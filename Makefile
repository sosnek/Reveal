# Makefile for Reveal - Anonymous Secret Sharing Application

.PHONY: help dev build test clean docker-build docker-run docker-down install-frontend build-frontend

# Default target
help:
	@echo "Available commands:"
	@echo "  dev              - Start development server"
	@echo "  build            - Build the Go application"
	@echo "  test             - Run tests"
	@echo "  install-frontend - Install frontend dependencies"
	@echo "  build-frontend   - Build frontend for production"
	@echo "  docker-build     - Build Docker image"
	@echo "  docker-run       - Run with Docker Compose"
	@echo "  docker-down      - Stop Docker containers"
	@echo "  clean            - Clean build artifacts"

# Development
dev:
	@echo "Starting development environment..."
	docker-compose up --build

# Build Go application
build: build-frontend
	@echo "Building Go application..."
	go build -o bin/reveal ./cmd/server

# Install frontend dependencies
install-frontend:
	@echo "Installing frontend dependencies..."
	cd web && npm install

# Build frontend for production
build-frontend: install-frontend
	@echo "Building frontend..."
	cd web && npm run build

# Run tests
test:
	@echo "Running backend tests..."
	go test ./...

test-frontend:
	@echo "Running frontend tests..."
	cd web && npm test -- --coverage --watchAll=false

test-all: test test-frontend
	@echo "All tests completed!"

test-watch:
	@echo "Running backend tests in watch mode..."
	go test ./... -watch

test-frontend-watch:
	@echo "Running frontend tests in watch mode..."
	cd web && npm test

test-coverage:
	@echo "Running tests with coverage..."
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated at coverage.html"

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t reveal:latest .

docker-run:
	@echo "Starting with Docker Compose..."
	docker-compose up --build -d

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down

# Clean up
clean:
	@echo "Cleaning up..."
	rm -rf bin/
	rm -rf web/build/
	rm -rf web/node_modules/
	docker-compose down --volumes --remove-orphans

# Setup for development
setup: install-frontend
	@echo "Setting up development environment..."
	cp env.example .env
	@echo "Please edit .env with your database configuration" 