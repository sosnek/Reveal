package handlers

import (
	"net/http"
	"strconv"

	"reveal/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PostHandler struct {
	postService *services.PostService
}

func NewPostHandler() *PostHandler {
	return &PostHandler{
		postService: services.NewPostService(),
	}
}

type CreatePostRequest struct {
	Title   string `json:"title" binding:"required,max=255"`
	Content string `json:"content" binding:"required,max=5000"`
}

type CreatePostResponse struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt string    `json:"created_at"`
}

// POST /api/posts - Submit a secret anonymously
func (h *PostHandler) CreatePost(c *gin.Context) {
	var req CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Basic content validation
	if len(req.Content) < 10 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Content must be at least 10 characters long",
		})
		return
	}

	clientIP := c.ClientIP()
	post, err := h.postService.CreatePost(req.Title, req.Content, clientIP)
	if err != nil {
		if err.Error() == "rate limit exceeded" {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "You're posting too frequently. Please wait a moment before posting again.",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create post",
		})
		return
	}

	response := CreatePostResponse{
		ID:        post.ID,
		CreatedAt: post.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	c.JSON(http.StatusCreated, response)
}

// GET /api/posts - List recent public posts
func (h *PostHandler) GetPosts(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 50 // Default limit
	}

	clientIP := c.ClientIP()
	posts, err := h.postService.GetRecentPosts(limit, clientIP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch posts",
		})
		return
	}

	c.JSON(http.StatusOK, posts)
}

type FlagPostRequest struct {
	Reason  string `json:"reason" binding:"required"`
	Details string `json:"details"`
}

// POST /api/posts/{id}/flag - Mark a post as inappropriate
func (h *PostHandler) FlagPost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid post ID format",
		})
		return
	}

	var req FlagPostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate reason
	validReasons := []string{"spam", "inappropriate", "hate_speech", "harassment", "violence", "other"}
	isValidReason := false
	for _, validReason := range validReasons {
		if req.Reason == validReason {
			isValidReason = true
			break
		}
	}
	
	if !isValidReason {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid flag reason",
		})
		return
	}

	if req.Reason == "other" && req.Details == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Details required when reason is 'other'",
		})
		return
	}

	clientIP := c.ClientIP()
	err = h.postService.FlagPost(postID, clientIP, req.Reason, req.Details)
	if err != nil {
		if err.Error() == "post not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Post not found",
			})
			return
		}
		if err.Error() == "post already flagged by user" {
			c.JSON(http.StatusConflict, gin.H{
				"error": "You have already flagged this post",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to flag post",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Post flagged successfully",
	})
}

// GET /api/flag-reasons - Get available flag reasons
func (h *PostHandler) GetFlagReasons(c *gin.Context) {
	reasons := map[string]string{
		"spam": "Spam or unwanted content",
		"inappropriate": "Inappropriate content",
		"hate_speech": "Hate speech or discrimination",
		"harassment": "Harassment or bullying",
		"other": "Other (please specify)",
	}
	
	c.JSON(http.StatusOK, gin.H{
		"reasons": reasons,
	})
}

// GET /api/health - Health check endpoint
func (h *PostHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"service": "reveal-api",
	})
} 