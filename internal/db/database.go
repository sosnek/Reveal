package db

import (
	"fmt"
	"log"
	"os"

	"reveal/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSLMODE")

	if dbSSLMode == "" {
		dbSSLMode = "disable"
	}

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode)

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	DB = database
	log.Println("Connected to PostgreSQL database")
}

func Migrate() {
	err := DB.AutoMigrate(&models.Post{}, &models.Flag{}, &models.Comment{}, &models.Vote{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	
	// Drop old user_flags table if it exists
	if DB.Migrator().HasTable("user_flags") {
		log.Println("Dropping old user_flags table...")
		err = DB.Migrator().DropTable("user_flags")
		if err != nil {
			log.Printf("Warning: Failed to drop user_flags table: %v", err)
		} else {
			log.Println("Successfully dropped old user_flags table")
		}
	}
	
	// Drop old reactions table if it exists and create votes table
	if DB.Migrator().HasTable("reactions") {
		log.Println("Dropping old reactions table...")
		err = DB.Migrator().DropTable("reactions")
		if err != nil {
			log.Printf("Warning: Failed to drop reactions table: %v", err)
		}
	}
	
	// Add unique constraint for votes to prevent duplicate votes
	// This prevents the same user from voting multiple times on the same post/comment with the same vote type
	if !DB.Migrator().HasConstraint(&models.Vote{}, "unique_vote_constraint") {
		err = DB.Exec(`
			ALTER TABLE votes ADD CONSTRAINT unique_vote_constraint UNIQUE (
				COALESCE(post_id::text, ''), 
				COALESCE(comment_id::text, ''), 
				vote_type, 
				ip_hash
			)
		`).Error
		if err != nil {
			log.Printf("Warning: Failed to add unique constraint for votes: %v", err)
		} else {
			log.Println("Added unique constraint for votes")
		}
	}
	
	log.Println("Database migration completed")
} 