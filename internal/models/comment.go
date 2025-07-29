package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Comment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	PostID    uuid.UUID `gorm:"type:uuid;not null;index" json:"post_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	IPHash    string    `gorm:"type:varchar(64);not null" json:"-"`
	Flagged   bool      `gorm:"default:false" json:"flagged"`
	
	// Vote counts - populated by service layer, not stored in DB
	Upvotes     int64  `gorm:"-" json:"upvotes"`
	Downvotes   int64  `gorm:"-" json:"downvotes"`
	UserVote    string `gorm:"-" json:"user_vote"`
	
	// Foreign key relationship
	Post Post `gorm:"foreignKey:PostID;references:ID;constraint:OnDelete:CASCADE" json:"-"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
} 