package services_test

import (
	"fmt"
	"os"
	"testing"
	"time"

	"reveal/internal/db"
	"reveal/internal/models"
	"reveal/internal/services"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type PostServiceTestSuite struct {
	suite.Suite
	service *services.PostService
	db      *gorm.DB
}

func (suite *PostServiceTestSuite) SetupSuite() {
	// Use in-memory SQLite for testing
	database, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	suite.Require().NoError(err)
	
	// Set global DB for the service to use
	db.DB = database
	suite.db = database
	
	// Auto-migrate the schema
	err = database.AutoMigrate(&models.Post{}, &models.Flag{})
	suite.Require().NoError(err)
	
	// Set test environment variable
	os.Setenv("SALT_KEY", "test_salt_key")
	
	suite.service = services.NewPostService()
}

func (suite *PostServiceTestSuite) TearDownSuite() {
	os.Unsetenv("SALT_KEY")
}

func (suite *PostServiceTestSuite) SetupTest() {
	// Clean the database before each test
	suite.db.Exec("DELETE FROM flags")
	suite.db.Exec("DELETE FROM posts")
}

func (suite *PostServiceTestSuite) TestCreatePost_Success() {
	title := "Test Title"
	content := "This is a test post content"
	clientIP := "127.0.0.1"
	
	post, err := suite.service.CreatePost(title, content, clientIP)
	
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), post)
	assert.Equal(suite.T(), title, post.Title)
	assert.Equal(suite.T(), content, post.Content)
	assert.NotEqual(suite.T(), uuid.Nil, post.ID)
	assert.False(suite.T(), post.Flagged)
	assert.NotEmpty(suite.T(), post.IPHash)
	assert.WithinDuration(suite.T(), time.Now(), post.CreatedAt, time.Second)
}

func (suite *PostServiceTestSuite) TestCreatePost_EmptyTitle() {
	post, err := suite.service.CreatePost("", "content", "127.0.0.1")
	
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), post)
}

func (suite *PostServiceTestSuite) TestCreatePost_EmptyContent() {
	post, err := suite.service.CreatePost("title", "", "127.0.0.1")
	
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), post)
}

func (suite *PostServiceTestSuite) TestCreatePost_SpamPrevention() {
	clientIP := "192.168.1.1"
	
	// Create 5 posts (should succeed)
	for i := 0; i < 5; i++ {
		post, err := suite.service.CreatePost("Title", "Content", clientIP)
		assert.NoError(suite.T(), err)
		assert.NotNil(suite.T(), post)
	}
	
	// 6th post should fail due to spam prevention
	post, err := suite.service.CreatePost("Title", "Content", clientIP)
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), post)
	assert.Contains(suite.T(), err.Error(), "rate limit exceeded")
}

func (suite *PostServiceTestSuite) TestGetRecentPosts_NoFlags() {
	// Create test posts
	clientIP := "192.168.1.1"
	
	_, err := suite.service.CreatePost("Test Post 1", "This is test content 1", clientIP)
	suite.NoError(err)
	_, err = suite.service.CreatePost("Test Post 2", "This is test content 2", clientIP)
	suite.NoError(err)

	posts, err := suite.service.GetRecentPosts(clientIP, 10)
	suite.NoError(err)
	suite.Len(posts, 2)
}

func (suite *PostServiceTestSuite) TestGetRecentPosts_WithUserFlags() {
	// Create test post
	clientIP := "192.168.1.1"
	post, err := suite.service.CreatePost("Test Post", "This is test content", clientIP)
	suite.NoError(err)

	// Flag the post with the same user
	err = suite.service.FlagPost(post.ID, clientIP, "spam", "Test flag")
	suite.NoError(err)

	// Check if the flagged post is hidden from the user who flagged it
	posts, err := suite.service.GetRecentPosts(clientIP, 10)
	suite.NoError(err)
	suite.Len(posts, 0)

	// But visible to other users
	otherClientIP := "192.168.1.2"
	posts, err = suite.service.GetRecentPosts(otherClientIP, 10)
	suite.NoError(err)
	suite.Len(posts, 1)
}

func (suite *PostServiceTestSuite) TestGetRecentPosts_WithGlobalFlags() {
	// Create test post
	clientIP := "192.168.1.1"
	post, err := suite.service.CreatePost("Test Post", "This is test content", clientIP)
	suite.NoError(err)

	// Mark post as globally flagged
	suite.db.Model(&post).Update("flagged", true)

	posts, err := suite.service.GetRecentPosts(clientIP, 10)
	suite.NoError(err)
	suite.Len(posts, 0)
}

func (suite *PostServiceTestSuite) TestFlagPost_Success() {
	clientIP := "127.0.0.1"
	
	// Create test post
	post, _ := suite.service.CreatePost("Title", "Content", clientIP)
	
	// Flag the post with different IP
	flaggingIP := "192.168.1.1"
	err := suite.service.FlagPost(post.ID, flaggingIP, "spam", "This is spam")
	
	assert.NoError(suite.T(), err)
	
	// Verify flag was created
	var flag models.Flag
	err = suite.db.Where("post_id = ?", post.ID).First(&flag).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "spam", flag.Reason)
	assert.Equal(suite.T(), "This is spam", flag.Details)
}

func (suite *PostServiceTestSuite) TestFlagPost_DuplicateFlag() {
	clientIP := "127.0.0.1"
	
	// Create test post
	post, _ := suite.service.CreatePost("Title", "Content", clientIP)
	
	// Flag the post
	err := suite.service.FlagPost(post.ID, clientIP, "spam", "")
	assert.NoError(suite.T(), err)
	
	// Try to flag again with same IP
	err = suite.service.FlagPost(post.ID, clientIP, "inappropriate", "")
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "already flagged")
}

func (suite *PostServiceTestSuite) TestFlagPost_NonExistentPost() {
	clientIP := "127.0.0.1"
	nonExistentID := uuid.New()
	
	err := suite.service.FlagPost(nonExistentID, clientIP, "spam", "")
	
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "not found")
}

func (suite *PostServiceTestSuite) TestFlagPost_GlobalFlagAfter5Flags() {
	// Create test post
	post, _ := suite.service.CreatePost("Title", "Content", "127.0.0.1")
	
	// Flag the post with 5 different IPs
	for i := 0; i < 5; i++ {
		ip := fmt.Sprintf("192.168.1.%d", i+1)
		err := suite.service.FlagPost(post.ID, ip, "spam", "")
		assert.NoError(suite.T(), err)
	}
	
	// Check if post is globally flagged
	var updatedPost models.Post
	err := suite.db.First(&updatedPost, post.ID).Error
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), updatedPost.Flagged)
}

// Note: hashIP and isSpamming are private methods tested indirectly through public methods above
// The spam prevention functionality is tested in TestCreatePost_SpamPrevention
// The IP hashing functionality is tested indirectly through all flagging tests

func TestPostServiceTestSuite(t *testing.T) {
	suite.Run(t, new(PostServiceTestSuite))
} 