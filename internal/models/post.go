package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Post struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Title     string    `gorm:"type:varchar(255);not null" json:"title" binding:"required,max=255"`
	Content   string    `gorm:"type:text;not null" json:"content" binding:"required,max=5000"`
	CreatedAt time.Time `gorm:"not null" json:"created_at"`
	IPHash    string    `gorm:"type:varchar(64);not null" json:"-"`
	Flagged   bool      `gorm:"default:false" json:"flagged"`
	
	// Vote counts - populated by service layer, not stored in DB
	Upvotes     int64  `gorm:"-" json:"upvotes"`
	Downvotes   int64  `gorm:"-" json:"downvotes"`
	UserVote    string `gorm:"-" json:"user_vote"`
}

func (p *Post) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
} 