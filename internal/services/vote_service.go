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

type VoteService struct{}

func NewVoteService() *VoteService {
	return &VoteService{}
}

// VoteOnPost adds or toggles a vote on a post
func (s *VoteService) VoteOnPost(postID uuid.UUID, voteType, clientIP string) error {
	// Validate vote type
	if !models.IsValidVoteType(voteType) {
		return fmt.Errorf("invalid vote type")
	}

	// Verify post exists
	var post models.Post
	if err := db.DB.First(&post, postID).Error; err != nil {
		return fmt.Errorf("post not found")
	}

	// Hash the IP address
	ipHash := s.hashIP(clientIP)

	// Check for spam (basic rate limiting per IP)
	if s.isSpamming(ipHash) {
		return fmt.Errorf("rate limit exceeded")
	}

	// Check if user already voted on this post
	var existingVote models.Vote
	result := db.DB.Where("post_id = ? AND ip_hash = ?", postID, ipHash).First(&existingVote)
	
	if result.Error == nil {
		// User already voted
		if existingVote.VoteType == voteType {
			// Same vote type, remove the vote (toggle behavior)
			return s.RemoveVoteFromPost(postID, clientIP)
		} else {
			// Different vote type, update the existing vote
			existingVote.VoteType = voteType
			existingVote.CreatedAt = time.Now()
			return db.DB.Save(&existingVote).Error
		}
	}

	// Create new vote
	vote := &models.Vote{
		ID:        uuid.New(),
		PostID:    &postID,
		VoteType:  voteType,
		IPHash:    ipHash,
		CreatedAt: time.Now(),
	}

	return db.DB.Create(vote).Error
}

// VoteOnComment adds or toggles a vote on a comment
func (s *VoteService) VoteOnComment(commentID uuid.UUID, voteType, clientIP string) error {
	// Validate vote type
	if !models.IsValidVoteType(voteType) {
		return fmt.Errorf("invalid vote type")
	}

	// Verify comment exists
	var comment models.Comment
	if err := db.DB.First(&comment, commentID).Error; err != nil {
		return fmt.Errorf("comment not found")
	}

	// Hash the IP address
	ipHash := s.hashIP(clientIP)

	// Check for spam (basic rate limiting per IP)
	if s.isSpamming(ipHash) {
		return fmt.Errorf("rate limit exceeded")
	}

	// Check if user already voted on this comment
	var existingVote models.Vote
	result := db.DB.Where("comment_id = ? AND ip_hash = ?", commentID, ipHash).First(&existingVote)
	
	if result.Error == nil {
		// User already voted
		if existingVote.VoteType == voteType {
			// Same vote type, remove the vote (toggle behavior)
			return s.RemoveVoteFromComment(commentID, clientIP)
		} else {
			// Different vote type, update the existing vote
			existingVote.VoteType = voteType
			existingVote.CreatedAt = time.Now()
			return db.DB.Save(&existingVote).Error
		}
	}

	// Create new vote
	vote := &models.Vote{
		ID:        uuid.New(),
		CommentID: &commentID,
		VoteType:  voteType,
		IPHash:    ipHash,
		CreatedAt: time.Now(),
	}

	return db.DB.Create(vote).Error
}

// RemoveVoteFromPost removes a user's vote from a post
func (s *VoteService) RemoveVoteFromPost(postID uuid.UUID, clientIP string) error {
	ipHash := s.hashIP(clientIP)
	result := db.DB.Where("post_id = ? AND ip_hash = ?", postID, ipHash).Delete(&models.Vote{})
	
	if result.Error != nil {
		return result.Error
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("vote not found")
	}

	return nil
}

// RemoveVoteFromComment removes a user's vote from a comment
func (s *VoteService) RemoveVoteFromComment(commentID uuid.UUID, clientIP string) error {
	ipHash := s.hashIP(clientIP)
	result := db.DB.Where("comment_id = ? AND ip_hash = ?", commentID, ipHash).Delete(&models.Vote{})
	
	if result.Error != nil {
		return result.Error
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("vote not found")
	}

	return nil
}

// GetPostVotes returns the vote counts and user's current vote for a post
func (s *VoteService) GetPostVotes(postID uuid.UUID, clientIP string) (int64, int64, string, error) {
	var upvotes, downvotes int64
	
	// Count upvotes
	db.DB.Model(&models.Vote{}).Where("post_id = ? AND vote_type = ?", postID, models.VoteTypeUpvote).Count(&upvotes)
	
	// Count downvotes
	db.DB.Model(&models.Vote{}).Where("post_id = ? AND vote_type = ?", postID, models.VoteTypeDownvote).Count(&downvotes)
	
	// Get user's current vote
	ipHash := s.hashIP(clientIP)
	var userVote models.Vote
	userVoteType := ""
	if err := db.DB.Where("post_id = ? AND ip_hash = ?", postID, ipHash).First(&userVote).Error; err == nil {
		userVoteType = userVote.VoteType
	}
	
	return upvotes, downvotes, userVoteType, nil
}

// GetCommentVotes returns the vote counts and user's current vote for a comment
func (s *VoteService) GetCommentVotes(commentID uuid.UUID, clientIP string) (int64, int64, string, error) {
	var upvotes, downvotes int64
	
	// Count upvotes
	db.DB.Model(&models.Vote{}).Where("comment_id = ? AND vote_type = ?", commentID, models.VoteTypeUpvote).Count(&upvotes)
	
	// Count downvotes
	db.DB.Model(&models.Vote{}).Where("comment_id = ? AND vote_type = ?", commentID, models.VoteTypeDownvote).Count(&downvotes)
	
	// Get user's current vote
	ipHash := s.hashIP(clientIP)
	var userVote models.Vote
	userVoteType := ""
	if err := db.DB.Where("comment_id = ? AND ip_hash = ?", commentID, ipHash).First(&userVote).Error; err == nil {
		userVoteType = userVote.VoteType
	}
	
	return upvotes, downvotes, userVoteType, nil
}

func (s *VoteService) hashIP(ip string) string {
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

func (s *VoteService) isSpamming(ipHash string) bool {
	// Simple spam check: max 30 votes per IP in last 2 minutes
	var count int64
	twoMinutesAgo := time.Now().Add(-2 * time.Minute)
	
	db.DB.Model(&models.Vote{}).
		Where("ip_hash = ? AND created_at > ?", ipHash, twoMinutesAgo).
		Count(&count)
	
	return count >= 30
} 