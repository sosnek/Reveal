package services

import (
	"crypto/sha256"
	"fmt"
	"net"
	"os"
	"strings"
	"time"

	"reveal/internal/db"
	"reveal/internal/models"

	"github.com/google/uuid"
)

type CommentService struct{}

func NewCommentService() *CommentService {
	return &CommentService{}
}

func (s *CommentService) CreateComment(postID uuid.UUID, content, clientIP string) (*models.Comment, error) {
	// Validate input
	if content == "" {
		return nil, fmt.Errorf("content cannot be empty")
	}
	
	// Basic content validation
	if len(strings.TrimSpace(content)) < 1 {
		return nil, fmt.Errorf("comment cannot be empty")
	}
	
	if len(content) > 1000 {
		return nil, fmt.Errorf("comment too long (max 1000 characters)")
	}

	// Verify post exists
	var post models.Post
	if err := db.DB.First(&post, postID).Error; err != nil {
		return nil, fmt.Errorf("post not found")
	}

	// Hash the IP address for privacy and spam prevention
	ipHash := s.hashIP(clientIP)

	// Check for spam (basic rate limiting per IP)
	if s.isSpamming(ipHash) {
		return nil, fmt.Errorf("rate limit exceeded")
	}

	comment := &models.Comment{
		ID:        uuid.New(),
		PostID:    postID,
		Content:   strings.TrimSpace(content),
		CreatedAt: time.Now(),
		IPHash:    ipHash,
		Flagged:   false,
	}

	result := db.DB.Create(comment)
	if result.Error != nil {
		return nil, result.Error
	}

	return comment, nil
}

func (s *CommentService) GetCommentsByPostID(postID uuid.UUID, clientIP string) ([]models.Comment, error) {
	var comments []models.Comment
	ipHash := s.hashIP(clientIP)
	
	// Get comments that are not globally flagged AND not flagged by this user
	result := db.DB.Where("post_id = ? AND flagged = ?", postID, false).
		Where("id NOT IN (?)", 
			db.DB.Table("user_flags").
				Select("post_id").
				Where("ip_hash = ?", ipHash),
		).
		Order("created_at ASC").
		Find(&comments)
	
	if result.Error != nil {
		return nil, result.Error
	}

	return comments, nil
}

func (s *CommentService) FlagComment(commentID uuid.UUID, clientIP, reason, details string) error {
	ipHash := s.hashIP(clientIP)
	
	// Check if user already flagged this comment
	var existingFlag models.UserFlag
	result := db.DB.Where("post_id = ? AND ip_hash = ?", commentID, ipHash).First(&existingFlag)
	if result.Error == nil {
		return fmt.Errorf("comment already flagged by user")
	}
	
	// Verify comment exists
	var comment models.Comment
	if err := db.DB.First(&comment, commentID).Error; err != nil {
		return fmt.Errorf("comment not found")
	}
	
	// Create user flag (reusing the UserFlag model, treating comment ID as post ID)
	userFlag := &models.UserFlag{
		PostID:    commentID, // Using the same table for simplicity
		IPHash:    ipHash,
		Reason:    reason,
		Details:   details,
		CreatedAt: time.Now(),
	}
	
	if err := db.DB.Create(userFlag).Error; err != nil {
		return err
	}
	
	// Check if comment should be globally flagged (e.g., if 3+ users flag it)
	var flagCount int64
	db.DB.Model(&models.UserFlag{}).Where("post_id = ?", commentID).Count(&flagCount)
	
	if flagCount >= 3 {
		// Globally flag the comment
		db.DB.Model(&models.Comment{}).Where("id = ?", commentID).Update("flagged", true)
	}

	return nil
}

func (s *CommentService) hashIP(ip string) string {
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

func (s *CommentService) isSpamming(ipHash string) bool {
	// Simple spam check: max 10 comments per IP in last 5 minutes
	var count int64
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)
	
	db.DB.Model(&models.Comment{}).
		Where("ip_hash = ? AND created_at > ?", ipHash, fiveMinutesAgo).
		Count(&count)
	
	return count >= 10
} 