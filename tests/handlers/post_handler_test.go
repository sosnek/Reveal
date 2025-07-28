package handlers_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"reveal/internal/db"
	"reveal/internal/handlers"
	"reveal/internal/middleware"
	"reveal/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type PostHandlerTestSuite struct {
	suite.Suite
	handler *handlers.PostHandler
	router  *gin.Engine
	db      *gorm.DB
}

func (suite *PostHandlerTestSuite) SetupSuite() {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	
	// Use in-memory SQLite for testing
	database, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	suite.Require().NoError(err)
	
	// Set global DB for the handlers to use
	db.DB = database
	suite.db = database
	
	// Auto-migrate the schema
	err = database.AutoMigrate(&models.Post{}, &models.UserFlag{})
	suite.Require().NoError(err)
	
	// Set test environment variable
	os.Setenv("SALT_KEY", "test_salt_key")
	
	suite.handler = handlers.NewPostHandler()
	
	// Setup router with middleware
	suite.router = gin.New()
	suite.router.Use(middleware.Logger())
	suite.router.Use(middleware.CORS())
	suite.router.Use(middleware.SecurityHeaders())
	
	// Setup API routes
	api := suite.router.Group("/api")
	{
		api.GET("/health", suite.handler.HealthCheck)
		api.GET("/flag-reasons", suite.handler.GetFlagReasons)
		api.POST("/posts", middleware.RateLimit(), suite.handler.CreatePost)
		api.GET("/posts", suite.handler.GetPosts)
		api.POST("/posts/:id/flag", middleware.RateLimit(), suite.handler.FlagPost)
	}
}

func (suite *PostHandlerTestSuite) TearDownSuite() {
	os.Unsetenv("SALT_KEY")
}

func (suite *PostHandlerTestSuite) SetupTest() {
	// Clean the database before each test
	suite.db.Exec("DELETE FROM user_flags")
	suite.db.Exec("DELETE FROM posts")
	
	// Reset rate limiters to avoid interference between tests
	middleware.ResetLimiters()
}

func (suite *PostHandlerTestSuite) TestHealthCheck() {
	req, _ := http.NewRequest("GET", "/api/health", nil)
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "healthy", response["status"])
	assert.Equal(suite.T(), "reveal-api", response["service"])
}

func (suite *PostHandlerTestSuite) TestGetFlagReasons() {
	req, _ := http.NewRequest("GET", "/api/flag-reasons", nil)
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	
	reasons, ok := response["reasons"].(map[string]interface{})
	assert.True(suite.T(), ok)
	assert.Contains(suite.T(), reasons, "spam")
	assert.Contains(suite.T(), reasons, "inappropriate")
	assert.Contains(suite.T(), reasons, "other")
}

func (suite *PostHandlerTestSuite) TestCreatePost_Success() {
	postData := handlers.CreatePostRequest{
		Title:   "Test Title",
		Content: "This is a test post content with more than 10 characters",
	}
	
	jsonData, _ := json.Marshal(postData)
	req, _ := http.NewRequest("POST", "/api/posts", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusCreated, w.Code)
	
	var response handlers.CreatePostResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.NotEqual(suite.T(), uuid.Nil, response.ID)
	assert.NotEmpty(suite.T(), response.CreatedAt)
}

func (suite *PostHandlerTestSuite) TestCreatePost_InvalidJSON() {
	req, _ := http.NewRequest("POST", "/api/posts", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Invalid request format", response["error"])
}

func (suite *PostHandlerTestSuite) TestCreatePost_EmptyTitle() {
	postData := handlers.CreatePostRequest{
		Title:   "",
		Content: "This is content but title is empty and should have enough characters",
	}
	
	jsonData, _ := json.Marshal(postData)
	req, _ := http.NewRequest("POST", "/api/posts", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	// Should get validation error first, not our custom message
	assert.Contains(suite.T(), response["error"], "Invalid request format")
}

func (suite *PostHandlerTestSuite) TestCreatePost_ContentTooShort() {
	postData := handlers.CreatePostRequest{
		Title:   "Title",
		Content: "Short", // Less than 10 characters
	}
	
	jsonData, _ := json.Marshal(postData)
	req, _ := http.NewRequest("POST", "/api/posts", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "at least 10 characters")
}

func (suite *PostHandlerTestSuite) TestGetPosts_Empty() {
	req, _ := http.NewRequest("GET", "/api/posts", nil)
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var posts []models.Post
	err := json.Unmarshal(w.Body.Bytes(), &posts)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), posts, 0)
}

func (suite *PostHandlerTestSuite) TestGetPosts_WithData() {
	// Create test posts directly in DB
	post1 := &models.Post{
		ID:        uuid.New(),
		Title:     "Test Post 1",
		Content:   "Content 1",
		IPHash:    "hash1",
		Flagged:   false,
		CreatedAt: time.Now(),
	}
	post2 := &models.Post{
		ID:        uuid.New(),
		Title:     "Test Post 2", 
		Content:   "Content 2",
		IPHash:    "hash2",
		Flagged:   false,
		CreatedAt: time.Now().Add(-time.Hour),
	}
	
	suite.db.Create(post1)
	suite.db.Create(post2)
	
	req, _ := http.NewRequest("GET", "/api/posts", nil)
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var posts []models.Post
	err := json.Unmarshal(w.Body.Bytes(), &posts)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), posts, 2)
	
	// Should be ordered by created_at DESC (newest first)
	assert.Equal(suite.T(), post1.ID, posts[0].ID)
	assert.Equal(suite.T(), post2.ID, posts[1].ID)
}

func (suite *PostHandlerTestSuite) TestGetPosts_WithLimit() {
	// Create 5 test posts
	for i := 0; i < 5; i++ {
		post := &models.Post{
			ID:        uuid.New(),
			Title:     fmt.Sprintf("Test Post %d", i),
			Content:   fmt.Sprintf("Content %d", i),
			IPHash:    fmt.Sprintf("hash%d", i),
			Flagged:   false,
			CreatedAt: time.Now().Add(-time.Duration(i) * time.Hour),
		}
		suite.db.Create(post)
	}
	
	req, _ := http.NewRequest("GET", "/api/posts?limit=3", nil)
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var posts []models.Post
	err := json.Unmarshal(w.Body.Bytes(), &posts)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), posts, 3)
}

func (suite *PostHandlerTestSuite) TestFlagPost_Success() {
	// Create test post
	post := &models.Post{
		ID:        uuid.New(),
		Title:     "Test Post",
		Content:   "Test Content",
		IPHash:    "hash1",
		Flagged:   false,
		CreatedAt: time.Now(),
	}
	suite.db.Create(post)
	
	flagData := handlers.FlagPostRequest{
		Reason:  "spam",
		Details: "",
	}
	
	jsonData, _ := json.Marshal(flagData)
	req, _ := http.NewRequest("POST", fmt.Sprintf("/api/posts/%s/flag", post.ID), bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Post flagged successfully", response["message"])
}

func (suite *PostHandlerTestSuite) TestFlagPost_InvalidUUID() {
	flagData := handlers.FlagPostRequest{
		Reason:  "spam",
		Details: "",
	}
	
	jsonData, _ := json.Marshal(flagData)
	req, _ := http.NewRequest("POST", "/api/posts/invalid-uuid/flag", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "Invalid post ID format")
}

func (suite *PostHandlerTestSuite) TestFlagPost_InvalidReason() {
	post := &models.Post{
		ID:        uuid.New(),
		Title:     "Test Post",
		Content:   "Test Content", 
		IPHash:    "hash1",
		Flagged:   false,
		CreatedAt: time.Now(),
	}
	suite.db.Create(post)
	
	flagData := handlers.FlagPostRequest{
		Reason:  "invalid_reason",
		Details: "",
	}
	
	jsonData, _ := json.Marshal(flagData)
	req, _ := http.NewRequest("POST", fmt.Sprintf("/api/posts/%s/flag", post.ID), bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "Invalid flag reason")
}

func (suite *PostHandlerTestSuite) TestFlagPost_OtherWithoutDetails() {
	post := &models.Post{
		ID:        uuid.New(),
		Title:     "Test Post",
		Content:   "Test Content",
		IPHash:    "hash1", 
		Flagged:   false,
		CreatedAt: time.Now(),
	}
	suite.db.Create(post)
	
	flagData := handlers.FlagPostRequest{
		Reason:  "other",
		Details: "", // Empty details for "other" reason
	}
	
	jsonData, _ := json.Marshal(flagData)
	req, _ := http.NewRequest("POST", fmt.Sprintf("/api/posts/%s/flag", post.ID), bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "Details required when reason is 'other'")
}

func (suite *PostHandlerTestSuite) TestFlagPost_NonExistentPost() {
	nonExistentID := uuid.New()
	
	flagData := handlers.FlagPostRequest{
		Reason:  "spam",
		Details: "",
	}
	
	jsonData, _ := json.Marshal(flagData)
	req, _ := http.NewRequest("POST", fmt.Sprintf("/api/posts/%s/flag", nonExistentID), bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w, req)
	
	assert.Equal(suite.T(), http.StatusNotFound, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "Post not found")
}

func (suite *PostHandlerTestSuite) TestFlagPost_DuplicateFlag() {
	// Create test post
	post := &models.Post{
		ID:        uuid.New(),
		Title:     "Test Post",
		Content:   "Test Content",
		IPHash:    "hash1",
		Flagged:   false,
		CreatedAt: time.Now(),
	}
	suite.db.Create(post)
	
	flagData := handlers.FlagPostRequest{
		Reason:  "spam",
		Details: "",
	}
	
	jsonData, _ := json.Marshal(flagData)
	
	// First flag attempt
	req1, _ := http.NewRequest("POST", fmt.Sprintf("/api/posts/%s/flag", post.ID), bytes.NewBuffer(jsonData))
	req1.Header.Set("Content-Type", "application/json")
	w1 := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w1, req1)
	assert.Equal(suite.T(), http.StatusOK, w1.Code)
	
	// Second flag attempt (should fail)
	jsonData2, _ := json.Marshal(flagData)
	req2, _ := http.NewRequest("POST", fmt.Sprintf("/api/posts/%s/flag", post.ID), bytes.NewBuffer(jsonData2))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	
	suite.router.ServeHTTP(w2, req2)
	
	assert.Equal(suite.T(), http.StatusConflict, w2.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w2.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.Contains(suite.T(), response["error"], "already flagged")
}

func TestPostHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(PostHandlerTestSuite))
} 