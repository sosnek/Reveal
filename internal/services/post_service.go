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

func (s *PostService) GetRecentPosts(limit int, clientIP string) ([]models.Post, error) {
	var posts []models.Post
	ipHash := s.hashIP(clientIP)
	
	// Get posts that are not globally flagged AND not flagged by this user
	result := db.DB.Where("flagged = ?", false).
		Where("id NOT IN (?)", 
			db.DB.Table("user_flags").
				Select("post_id").
				Where("ip_hash = ?", ipHash),
		).
		Order("created_at DESC").
		Limit(limit).
		Find(&posts)
	
	if result.Error != nil {
		return nil, result.Error
	}

	return posts, nil
}

func (s *PostService) FlagPost(postID uuid.UUID, clientIP, reason, details string) error {
	ipHash := s.hashIP(clientIP)
	
	// Check if user already flagged this post
	var existingFlag models.UserFlag
	result := db.DB.Where("post_id = ? AND ip_hash = ?", postID, ipHash).First(&existingFlag)
	if result.Error == nil {
		return fmt.Errorf("post already flagged by user")
	}
	
	// Verify post exists
	var post models.Post
	if err := db.DB.First(&post, postID).Error; err != nil {
		return fmt.Errorf("post not found")
	}
	
	// Create user flag
	userFlag := &models.UserFlag{
		PostID:    postID,
		IPHash:    ipHash,
		Reason:    reason,
		Details:   details,
		CreatedAt: time.Now(),
	}
	
	if err := db.DB.Create(userFlag).Error; err != nil {
		return err
	}
	
	// Check if post should be globally flagged (e.g., if 5+ users flag it)
	var flagCount int64
	db.DB.Model(&models.UserFlag{}).Where("post_id = ?", postID).Count(&flagCount)
	
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