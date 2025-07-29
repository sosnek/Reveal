package services

import (
	"crypto/sha256"
	"fmt"
	"net"
	"os"
	"time"

	"reveal/internal/db"
	"reveal/internal/models"

	"github.com/google/uuid"
)

type PostService struct{}

func NewPostService() *PostService {
	return &PostService{}
}

func (s *PostService) CreatePost(title, content, clientIP string) (*models.Post, error) {
	// Validate input
	if title == "" {
		return nil, fmt.Errorf("title cannot be empty")
	}
	if content == "" {
		return nil, fmt.Errorf("content cannot be empty")
	}

	// Hash the IP address for privacy and spam prevention
	ipHash := s.hashIP(clientIP)

	// Check for spam (basic rate limiting per IP)
	if s.isSpamming(ipHash) {
		return nil, fmt.Errorf("rate limit exceeded")
	}

	post := &models.Post{
		ID:        uuid.New(),
		Title:     title,
		Content:   content,
		CreatedAt: time.Now(),
		IPHash:    ipHash,
		Flagged:   false,
	}

	result := db.DB.Create(post)
	if result.Error != nil {
		return nil, result.Error
	}

	return post, nil
}

func (s *PostService) GetRecentPosts(clientIP string, limit int) ([]models.Post, error) {
	if limit <= 0 {
		limit = 50
	}
	
	ipHash := s.hashIP(clientIP)
	var posts []models.Post
	
	// Get posts that are not globally flagged AND not flagged by this user
	result := db.DB.Where("flagged = ?", false).
		Where("id NOT IN (?)", 
			db.DB.Table("flags").
				Select("post_id").
				Where("flag_type = ? AND ip_hash = ? AND post_id IS NOT NULL", models.FlagTypePost, ipHash),
		).
		Order("created_at DESC").
		Limit(limit).
		Find(&posts)
	
	if result.Error != nil {
		return nil, result.Error
	}

	// If no posts, return empty slice
	if len(posts) == 0 {
		return posts, nil
	}

	// Extract post IDs for efficient vote count query
	postIDs := make([]uuid.UUID, len(posts))
	for i, post := range posts {
		postIDs[i] = post.ID
	}

	// Get vote counts for all posts in a single query
	type VoteCount struct {
		PostID    uuid.UUID `json:"post_id"`
		VoteType  string    `json:"vote_type"`
		Count     int64     `json:"count"`
	}
	
	var voteCounts []VoteCount
	db.DB.Table("votes").
		Select("post_id, vote_type, COUNT(*) as count").
		Where("post_id IN ?", postIDs).
		Group("post_id, vote_type").
		Scan(&voteCounts)

	// Get user's votes for all posts in a single query
	type UserVote struct {
		PostID   uuid.UUID `json:"post_id"`
		VoteType string    `json:"vote_type"`
	}
	
	var userVotes []UserVote
	db.DB.Table("votes").
		Select("post_id, vote_type").
		Where("post_id IN ? AND ip_hash = ?", postIDs, ipHash).
		Scan(&userVotes)

	// Create maps for efficient lookup
	voteCountMap := make(map[uuid.UUID]map[string]int64)
	userVoteMap := make(map[uuid.UUID]string)

	// Initialize vote count map
	for _, postID := range postIDs {
		voteCountMap[postID] = map[string]int64{
			models.VoteTypeUpvote:   0,
			models.VoteTypeDownvote: 0,
		}
	}

	// Populate vote counts
	for _, vc := range voteCounts {
		if voteCountMap[vc.PostID] == nil {
			voteCountMap[vc.PostID] = make(map[string]int64)
		}
		voteCountMap[vc.PostID][vc.VoteType] = vc.Count
	}

	// Populate user votes
	for _, uv := range userVotes {
		userVoteMap[uv.PostID] = uv.VoteType
	}

	// Assign vote data to posts
	for i := range posts {
		postID := posts[i].ID
		posts[i].Upvotes = voteCountMap[postID][models.VoteTypeUpvote]
		posts[i].Downvotes = voteCountMap[postID][models.VoteTypeDownvote]
		posts[i].UserVote = userVoteMap[postID]
	}

	return posts, nil
}

func (s *PostService) FlagPost(postID uuid.UUID, clientIP, reason, details string) error {
	ipHash := s.hashIP(clientIP)
	
	// Check if user already flagged this post
	var existingFlag models.Flag
	result := db.DB.Where("flag_type = ? AND post_id = ? AND ip_hash = ?", models.FlagTypePost, postID, ipHash).First(&existingFlag)
	if result.Error == nil {
		return fmt.Errorf("post already flagged by user")
	}
	
	// Verify post exists
	var post models.Post
	if err := db.DB.First(&post, postID).Error; err != nil {
		return fmt.Errorf("post not found")
	}
	
	// Create flag using helper method
	flag := models.NewPostFlag(postID, ipHash, reason, details)
	
	if err := db.DB.Create(flag).Error; err != nil {
		return err
	}
	
	// Check if post should be globally flagged (e.g., if 5+ users flag it)
	var flagCount int64
	db.DB.Model(&models.Flag{}).Where("flag_type = ? AND post_id = ?", models.FlagTypePost, postID).Count(&flagCount)
	
	if flagCount >= 5 {
		// Globally flag the post
		db.DB.Model(&models.Post{}).Where("id = ?", postID).Update("flagged", true)
	}

	return nil
}

func (s *PostService) hashIP(ip string) string {
	saltKey := os.Getenv("SALT_KEY")
	if saltKey == "" {
		saltKey = "default_salt_change_in_production"
	}
	
	// Parse IP to handle IPv6 properly
	parsedIP := net.ParseIP(ip)
	var ipBytes []byte
	
	if parsedIP != nil {
		ipBytes = parsedIP.To16() // Convert to IPv6 format (works for IPv4 too)
	} else {
		ipBytes = []byte(ip) // Fallback for unparseable IPs
	}
	
	data := append(ipBytes, []byte(saltKey)...)
	hash := sha256.Sum256(data)
	return fmt.Sprintf("%x", hash)
}

func (s *PostService) isSpamming(ipHash string) bool {
	// Simple spam check: max 5 posts per IP in last 10 minutes
	var count int64
	tenMinutesAgo := time.Now().Add(-10 * time.Minute)
	
	db.DB.Model(&models.Post{}).
		Where("ip_hash = ? AND created_at > ?", ipHash, tenMinutesAgo).
		Count(&count)
	
	return count >= 5
} 