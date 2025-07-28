package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Vote struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	PostID    *uuid.UUID `gorm:"type:uuid;index" json:"post_id,omitempty"`
	CommentID *uuid.UUID `gorm:"type:uuid;index" json:"comment_id,omitempty"`
	VoteType  string     `gorm:"type:varchar(10);not null" json:"vote_type"` // "upvote" or "downvote"
	IPHash    string     `gorm:"type:varchar(64);not null" json:"-"`
	CreatedAt time.Time  `gorm:"not null" json:"created_at"`
	
	// Foreign key relationships
	Post    Post    `gorm:"foreignKey:PostID;references:ID;constraint:OnDelete:CASCADE" json:"-"`
	Comment Comment `gorm:"foreignKey:CommentID;references:ID;constraint:OnDelete:CASCADE" json:"-"`
}

func (v *Vote) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	return nil
}

// Vote types
const (
	VoteTypeUpvote   = "upvote"
	VoteTypeDownvote = "downvote"
)

// ValidVoteTypes defines the allowed vote types
var ValidVoteTypes = []string{VoteTypeUpvote, VoteTypeDownvote}

// IsValidVoteType checks if the provided vote type is valid
func IsValidVoteType(voteType string) bool {
	for _, validType := range ValidVoteTypes {
		if voteType == validType {
			return true
		}
	}
	return false
} 