package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserFlag struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	PostID    uuid.UUID `gorm:"type:uuid;not null;index" json:"post_id"`
	IPHash    string    `gorm:"type:varchar(64);not null;index" json:"-"`
	Reason    string    `gorm:"type:varchar(100);not null" json:"reason"`
	Details   string    `gorm:"type:text" json:"details"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	
	// Foreign key relationship
	Post Post `gorm:"foreignKey:PostID;references:ID" json:"-"`
}

func (uf *UserFlag) BeforeCreate(tx *gorm.DB) error {
	if uf.ID == uuid.Nil {
		uf.ID = uuid.New()
	}
	return nil
}

// Flag reasons
const (
	FlagReasonSpam         = "spam"
	FlagReasonInappropriate = "inappropriate"
	FlagReasonHateSpeech   = "hate_speech"
	FlagReasonHarassment   = "harassment"
	FlagReasonViolence     = "violence"
	FlagReasonOther        = "other"
)

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