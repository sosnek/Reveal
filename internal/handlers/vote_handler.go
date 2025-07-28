package handlers

import (
	"net/http"

	"reveal/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type VoteHandler struct {
	voteService *services.VoteService
}

func NewVoteHandler() *VoteHandler {
	return &VoteHandler{
		voteService: services.NewVoteService(),
	}
}

type VoteRequest struct {
	VoteType string `json:"vote_type" binding:"required"`
}

type VoteResponse struct {
	Upvotes      int64  `json:"upvotes"`
	Downvotes    int64  `json:"downvotes"`
	UserVote     string `json:"user_vote"`
	Score        int64  `json:"score"` // upvotes - downvotes
}

// POST /api/posts/{id}/vote - Vote on a post
func (h *VoteHandler) VoteOnPost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid post ID format",
		})
		return
	}

	var req VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if req.VoteType != "upvote" && req.VoteType != "downvote" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid vote type. Must be 'upvote' or 'downvote'",
		})
		return
	}

	clientIP := c.ClientIP()
	err = h.voteService.VoteOnPost(postID, req.VoteType, clientIP)
	if err != nil {
		if err.Error() == "post not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Post not found",
			})
			return
		}
		if err.Error() == "rate limit exceeded" {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "You're voting too frequently. Please wait a moment.",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process vote",
		})
		return
	}

	// Return updated vote counts
	upvotes, downvotes, userVote, err := h.voteService.GetPostVotes(postID, clientIP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch vote counts",
		})
		return
	}

	c.JSON(http.StatusOK, VoteResponse{
		Upvotes:   upvotes,
		Downvotes: downvotes,
		UserVote:  userVote,
		Score:     upvotes - downvotes,
	})
}

// GET /api/posts/{id}/votes - Get vote counts for a post
func (h *VoteHandler) GetPostVotes(c *gin.Context) {
	postIDStr := c.Param("id")
	postID, err := uuid.Parse(postIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid post ID format",
		})
		return
	}

	clientIP := c.ClientIP()
	upvotes, downvotes, userVote, err := h.voteService.GetPostVotes(postID, clientIP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch vote counts",
		})
		return
	}

	c.JSON(http.StatusOK, VoteResponse{
		Upvotes:   upvotes,
		Downvotes: downvotes,
		UserVote:  userVote,
		Score:     upvotes - downvotes,
	})
}

// POST /api/comments/{id}/vote - Vote on a comment
func (h *VoteHandler) VoteOnComment(c *gin.Context) {
	commentIDStr := c.Param("id")
	commentID, err := uuid.Parse(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid comment ID format",
		})
		return
	}

	var req VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if req.VoteType != "upvote" && req.VoteType != "downvote" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid vote type. Must be 'upvote' or 'downvote'",
		})
		return
	}

	clientIP := c.ClientIP()
	err = h.voteService.VoteOnComment(commentID, req.VoteType, clientIP)
	if err != nil {
		if err.Error() == "comment not found" {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Comment not found",
			})
			return
		}
		if err.Error() == "rate limit exceeded" {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "You're voting too frequently. Please wait a moment.",
			})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process vote",
		})
		return
	}

	// Return updated vote counts
	upvotes, downvotes, userVote, err := h.voteService.GetCommentVotes(commentID, clientIP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch vote counts",
		})
		return
	}

	c.JSON(http.StatusOK, VoteResponse{
		Upvotes:   upvotes,
		Downvotes: downvotes,
		UserVote:  userVote,
		Score:     upvotes - downvotes,
	})
}

// GET /api/comments/{id}/votes - Get vote counts for a comment
func (h *VoteHandler) GetCommentVotes(c *gin.Context) {
	commentIDStr := c.Param("id")
	commentID, err := uuid.Parse(commentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid comment ID format",
		})
		return
	}

	clientIP := c.ClientIP()
	upvotes, downvotes, userVote, err := h.voteService.GetCommentVotes(commentID, clientIP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch vote counts",
		})
		return
	}

	c.JSON(http.StatusOK, VoteResponse{
		Upvotes:   upvotes,
		Downvotes: downvotes,
		UserVote:  userVote,
		Score:     upvotes - downvotes,
	})
} 