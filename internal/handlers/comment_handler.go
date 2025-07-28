package handlers

import (
	"net/http"

	"reveal/internal/models"
	"reveal/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CommentHandler struct {
	commentService *services.CommentService
}

func NewCommentHandler() *CommentHandler {
	return &CommentHandler{
		commentService: services.NewCommentService(),
	}
}

type CreateCommentRequest struct {
	Content string `json:"content" binding:"required,max=1000"`
}

type CreateCommentResponse struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt string    `json:"created_at"`
}

// POST /api/posts/{id}/comments - Submit a comment on a post
func (h *CommentHandler) CreateComment(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid post ID format",
		})
		return
	}

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	clientIP := c.ClientIP()
	comment, err := h.commentService.CreateComment(postID, req.Content, clientIP)
	if err != nil {
		if err.Error() == "rate limit exceeded" {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "You're commenting too frequently. Please wait a moment before commenting again.",
			})
			return
		}
		if err.Error() == "post not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Post not found",
			})
			return
		}
		if err.Error() == "comment too long (max 1000 characters)" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Comment too long (max 1000 characters)",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create comment",
		})
		return
	}

	response := CreateCommentResponse{
		ID:        comment.ID,
		CreatedAt: comment.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}

	c.JSON(http.StatusCreated, response)
}

// GET /api/posts/{id}/comments - Get comments for a post
func (h *CommentHandler) GetComments(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid post ID format",
		})
		return
	}

	clientIP := c.ClientIP()
	comments, err := h.commentService.GetCommentsByPostID(postID, clientIP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch comments",
		})
		return
	}

	c.JSON(http.StatusOK, comments)
}

type FlagCommentRequest struct {
	Reason  string `json:"reason" binding:"required"`
	Details string `json:"details"`
}

// POST /api/comments/{id}/flag - Flag a comment as inappropriate
func (h *CommentHandler) FlagComment(c *gin.Context) {
	commentIDStr := c.Param("id")
	commentID, err := uuid.Parse(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid comment ID format",
		})
		return
	}

	var req FlagCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Validate reason
	validReasons := models.GetValidFlagReasons()
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
	err = h.commentService.FlagComment(commentID, clientIP, req.Reason, req.Details)
	if err != nil {
		if err.Error() == "comment not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Comment not found",
			})
			return
		}
		if err.Error() == "comment already flagged by user" {
			c.JSON(http.StatusConflict, gin.H{
				"error": "You have already flagged this comment",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to flag comment",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Comment flagged successfully",
	})
} 