package main

import (
	"log"
	"os"
	"strings"

	"reveal/internal/db"
	"reveal/internal/handlers"
	"reveal/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("config/.env"); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	db.Connect()
	db.Migrate()

	// Initialize handlers
	postHandler := handlers.NewPostHandler()
	commentHandler := handlers.NewCommentHandler()
	voteHandler := handlers.NewVoteHandler()

	// Setup router
	router := gin.New()

	// Apply middleware
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())
	router.Use(middleware.SecurityHeaders())
	router.Use(gin.Recovery())

	// Serve static files (frontend)
	router.Static("/assets", "./web/build/assets")
	router.StaticFile("/", "./web/build/index.html")
	router.StaticFile("/favicon.ico", "./web/build/favicon.ico")

	// API routes
	api := router.Group("/api")
	{
		// Health and utility endpoints
		api.GET("/health", postHandler.HealthCheck)
		api.GET("/flag-reasons", postHandler.GetFlagReasons)
		
		// Post endpoints
		api.POST("/posts", middleware.RateLimit(), postHandler.CreatePost)
		api.GET("/posts", postHandler.GetPosts)
		api.POST("/posts/:id/flag", middleware.RateLimit(), postHandler.FlagPost)
		
		// Comment endpoints
		api.POST("/posts/:id/comments", middleware.RateLimit(), commentHandler.CreateComment)
		api.GET("/posts/:id/comments", commentHandler.GetComments)
		api.POST("/comments/:id/flag", middleware.RateLimit(), commentHandler.FlagComment)
		
		// Vote endpoints (for both posts and comments)
		api.POST("/posts/:id/vote", middleware.RateLimit(), voteHandler.VoteOnPost)
		api.GET("/posts/:id/votes", voteHandler.GetPostVotes)
		api.POST("/comments/:id/vote", middleware.RateLimit(), voteHandler.VoteOnComment)
		api.GET("/comments/:id/votes", voteHandler.GetCommentVotes)
	}

	// Fallback to serve React app for client-side routing
	router.NoRoute(func(c *gin.Context) {
		// Only serve index.html for non-API routes
		if !strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.File("./web/build/index.html")
		} else {
			c.JSON(404, gin.H{"error": "Not found"})
		}
	})

	// Start server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	host := os.Getenv("SERVER_HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	log.Printf("Server starting on %s:%s", host, port)
	if err := router.Run(host + ":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
} 