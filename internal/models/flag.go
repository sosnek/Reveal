package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Flag types
const (
	FlagTypePost    = "post"
	FlagTypeComment = "comment"
)

// Flag reasons
const (
	FlagReasonSpam         = "spam"
	FlagReasonInappropriate = "inappropriate"
	FlagReasonHarassment   = "harassment"
	FlagReasonHateSpeech   = "hate_speech"
	FlagReasonViolence     = "violence"
	FlagReasonOther        = "other"
)

type Flag struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	FlagType  string     `gorm:"type:varchar(20);not null;index" json:"flag_type"`
	PostID    *uuid.UUID `gorm:"type:uuid;index" json:"post_id,omitempty"`
	CommentID *uuid.UUID `gorm:"type:uuid;index" json:"comment_id,omitempty"`
	IPHash    string     `gorm:"type:varchar(64);not null;index" json:"-"`
	Reason    string     `gorm:"type:varchar(100);not null" json:"reason"`
	Details   string     `gorm:"type:text" json:"details"`
	CreatedAt time.Time  `gorm:"not null" json:"created_at"`
	
	// Foreign key relationships
	Post    Post    `gorm:"foreignKey:PostID;references:ID;constraint:OnDelete:CASCADE" json:"-"`
	Comment Comment `gorm:"foreignKey:CommentID;references:ID;constraint:OnDelete:CASCADE" json:"-"`
}

func (f *Flag) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

func GetValidFlagTypes() []string {
	return []string{
		FlagTypePost,
		FlagTypeComment,
	}
}

func GetValidFlagReasons() []string {
	return []string{
		FlagReasonSpam,
		FlagReasonInappropriate,
		FlagReasonHateSpeech,
		FlagReasonHarassment,
		FlagReasonViolence,
		FlagReasonOther,
	}
}

// Helper methods for creating flags
func NewPostFlag(postID uuid.UUID, ipHash, reason, details string) *Flag {
	return &Flag{
		FlagType:  FlagTypePost,
		PostID:    &postID,
		IPHash:    ipHash,
		Reason:    reason,
		Details:   details,
		CreatedAt: time.Now(),
	}
}

func NewCommentFlag(commentID uuid.UUID, ipHash, reason, details string) *Flag {
	return &Flag{
		FlagType:  FlagTypeComment,
		CommentID: &commentID,
		IPHash:    ipHash,
		Reason:    reason,
		Details:   details,
		CreatedAt: time.Now(),
	}
} 