# Reveal - Anonymous Secret Sharing

A secure, anonymous web application for sharing secrets and personal thoughts. Built with Go backend and React frontend, designed with privacy and anonymity as core principles.

## 🌟 Features

- **Complete Anonymity**: No user accounts, login, or tracking
- **Privacy First**: IP addresses are hashed with salt for spam prevention only
- **Modern UI**: Beautiful, responsive interface with dark/light themes
- **Spam Protection**: Rate limiting and basic content moderation
- **Secure Backend**: Built with Go, PostgreSQL, and security best practices
- **Easy Deployment**: Docker support for simple hosting

## 🏗️ Architecture

- **Backend**: Go with Gin framework
- **Database**: PostgreSQL with GORM
- **Frontend**: React with modern JavaScript
- **Security**: Rate limiting, IP hashing, content validation
- **Deployment**: Docker containers with multi-stage builds

## 🚀 Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd Reveal
```

2. Start the application:
```bash
make docker-run
```

3. Visit http://localhost:8080 to access the application

### Manual Setup

#### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL 12+

#### Backend Setup
1. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database configuration
```

2. Install dependencies and run:
```bash
go mod download
go run cmd/server/main.go
```

#### Frontend Setup
1. Install and build frontend:
```bash
cd web
npm install
npm run build
```

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/health` | Health check |
| POST   | `/api/posts` | Submit a secret |
| GET    | `/api/posts` | List recent posts |
| POST   | `/api/posts/{id}/flag` | Flag inappropriate content |

### Example Usage

**Submit a secret:**
```bash
curl -X POST http://localhost:8080/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title": "My Secret", "content": "This is my anonymous secret..."}'
```

**Get recent posts:**
```bash
curl http://localhost:8080/api/posts?limit=10
```

## 🔒 Security Features

- **No Tracking**: No user accounts, cookies, or session data
- **IP Privacy**: IP addresses are SHA-256 hashed with salt
- **Rate Limiting**: Prevents spam (5 posts per IP per 10 minutes)
- **Content Validation**: Length limits and basic sanitization
- **Security Headers**: XSS protection, CSRF prevention
- **Flagging System**: Community moderation for inappropriate content

## 🛠️ Development

### Available Commands

```bash
make help              # Show available commands
make dev              # Start development environment
make test             # Run tests
make build            # Build production binaries
make docker-build     # Build Docker image
make clean            # Clean build artifacts
```

### Project Structure

```
Reveal/
├── cmd/server/        # Application entry point
├── internal/
│   ├── handlers/      # HTTP request handlers
│   ├── models/        # Database models
│   ├── services/      # Business logic
│   ├── middleware/    # HTTP middleware
│   └── db/           # Database connection
├── web/              # React frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── build/        # Production build
├── docker-compose.yml # Docker development setup
├── Dockerfile        # Production container
└── .github/workflows/ # CI/CD pipelines
```

## 🌐 Deployment

### Docker Deployment

The application is designed for easy deployment using Docker:

```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Or build and run manually
docker build -t reveal .
docker run -p 8080:8080 reveal
```

### Environment Variables

Required environment variables for production:

```bash
DB_HOST=your_postgres_host
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=reveal_db
SALT_KEY=your_random_salt_key_change_this
```

### Hosting Platforms

The application can be deployed on:
- **Render**: Zero-config deployment
- **Railway**: Automatic PostgreSQL provisioning
- **Fly.io**: Global edge deployment
- **Any VPS**: Using Docker Compose

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
make test

# Integration tests with Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## ⚠️ Disclaimer

This application is designed for sharing thoughts anonymously. Users are responsible for the content they post. Please be respectful and avoid sharing harmful, illegal, or offensive content.