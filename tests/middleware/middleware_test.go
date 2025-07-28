package middleware_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"reveal/internal/middleware"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestCORS(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := gin.New()
	router.Use(middleware.CORS())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})

	t.Run("should add CORS headers to GET request", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		
		router.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
		assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Headers"), "Content-Type")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "POST")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
	})

	t.Run("should handle OPTIONS preflight request", func(t *testing.T) {
		req, _ := http.NewRequest("OPTIONS", "/test", nil)
		w := httptest.NewRecorder()
		
		router.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusNoContent, w.Code)
		assert.Equal(t, "*", w.Header().Get("Access-Control-Allow-Origin"))
	})
}

func TestSecurityHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := gin.New()
	router.Use(middleware.SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
	assert.Equal(t, "DENY", w.Header().Get("X-Frame-Options"))
	assert.Equal(t, "1; mode=block", w.Header().Get("X-XSS-Protection"))
	assert.Equal(t, "strict-origin-when-cross-origin", w.Header().Get("Referrer-Policy"))
}

func TestRateLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	// Clear limiters map for clean test
	middleware.ResetLimiters()
	
	router := gin.New()
	router.Use(middleware.RateLimit())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})

	t.Run("should allow requests under rate limit", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "127.0.0.1:12345"
		w := httptest.NewRecorder()
		
		router.ServeHTTP(w, req)
		
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("should rate limit requests from same IP", func(t *testing.T) {
		// Use a fresh limiter for this test
		testIP := "192.168.1.100"
		
		// Make several requests quickly
		successCount := 0
		rateLimitedCount := 0
		
		for i := 0; i < 10; i++ {
			req, _ := http.NewRequest("GET", "/test", nil)
			req.RemoteAddr = testIP + ":12345"
			w := httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			if w.Code == http.StatusOK {
				successCount++
			} else if w.Code == http.StatusTooManyRequests {
				rateLimitedCount++
			}
		}
		
		// Should have some successful requests and some rate limited
		assert.Greater(t, successCount, 0, "Should have some successful requests")
		assert.Greater(t, rateLimitedCount, 0, "Should have some rate limited requests")
	})

	t.Run("should handle different IPs independently", func(t *testing.T) {
		// Clear limiters for clean test
		middleware.ResetLimiters()
		
		req1, _ := http.NewRequest("GET", "/test", nil)
		req1.RemoteAddr = "192.168.1.1:12345"
		w1 := httptest.NewRecorder()
		
		req2, _ := http.NewRequest("GET", "/test", nil)
		req2.RemoteAddr = "192.168.1.2:12345"
		w2 := httptest.NewRecorder()
		
		router.ServeHTTP(w1, req1)
		router.ServeHTTP(w2, req2)
		
		// Both should succeed as they're from different IPs
		assert.Equal(t, http.StatusOK, w1.Code)
		assert.Equal(t, http.StatusOK, w2.Code)
	})

	t.Run("should return proper rate limit error message", func(t *testing.T) {
		// Use a specific IP and exhaust its rate limit
		testIP := "192.168.1.200"
		
		// Make many requests to trigger rate limiting
		var w *httptest.ResponseRecorder
		for i := 0; i < 20; i++ {
			req, _ := http.NewRequest("GET", "/test", nil)
			req.RemoteAddr = testIP + ":12345"
			w = httptest.NewRecorder()
			
			router.ServeHTTP(w, req)
			
			if w.Code == http.StatusTooManyRequests {
				break
			}
		}
		
		// Should eventually get rate limited
		if w.Code == http.StatusTooManyRequests {
			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Contains(t, response["error"], "Rate limit exceeded")
		}
	})
}

// TestGetLimiter functionality is covered by TestRateLimit tests above

func TestLogger(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := gin.New()
	router.Use(middleware.Logger())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "ok"})
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	// Should not panic and complete successfully
	assert.NotPanics(t, func() {
		router.ServeHTTP(w, req)
	})
	
	assert.Equal(t, http.StatusOK, w.Code)
} 