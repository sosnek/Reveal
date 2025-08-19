# Reveal - Anonymous Secret Sharing - Vibe coded in one day. 

Disclaimer: This is not how I write code. This is simply a POC of what I could accomplish in one day without manually typing in a single line of code.

<img width="3324" height="1788" alt="image" src="https://github.com/user-attachments/assets/1663c310-4c5d-4ba6-9a2d-36c7a0810db3" />
<img width="3082" height="1782" alt="image" src="https://github.com/user-attachments/assets/f587cdda-b940-4215-aaee-a79874a97498" />



## 🌟 Features

### 🔒 Privacy & Security
- **Complete Anonymity**: No user accounts, login, or tracking
- **Privacy First**: IP addresses are hashed with salt for spam prevention only
- **Advanced Security**: Rate limiting, content validation, and XSS protection
- **Community Moderation**: Flagging system for inappropriate content

### 💬 Interactive Features
- **Anonymous Discussions**: Comment on any secret without revealing identity
- **Community Voting**: Upvote/downvote posts and comments Reddit-style
- **Real-time Engagement**: Instant feedback and voting updates
- **Content Moderation**: Community-driven flagging system

### 🎨 Modern Interface
- **Beautiful Design**: Glassmorphism effects with modern gradients
- **Dark Mode Toggle**: Seamless switching between light and dark themes
- **Responsive Layout**: Perfect experience on desktop, tablet, and mobile
- **Smooth Animations**: Polished micro-interactions and transitions
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### 🚀 Technical Excellence
- **Modern Stack**: Go backend + React frontend with Vite
- **Component Library**: shadcn/ui components with Tailwind CSS v4
- **Type Safety**: Robust validation and error handling
- **Docker Ready**: Simple deployment with container support

## 🏗️ Architecture

### Backend
- **Framework**: Go with Gin web framework
- **Database**: PostgreSQL with GORM ORM
- **Security**: SHA-256 IP hashing, rate limiting, input validation
- **APIs**: RESTful endpoints with JSON responses

### Frontend
- **Framework**: React 19 with functional components and hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS v4 with shadcn/ui component library
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context for theme management
- **Type Safety**: JSConfig with import aliases

### Infrastructure
- **Containerization**: Multi-stage Docker builds
- **Database**: PostgreSQL with automatic migrations
- **Proxy**: Vite dev server with API proxy for development
- **Static Assets**: Optimized builds with asset fingerprinting

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Reveal
```

2. **Start the application:**
```bash
make docker-run
```

3. **Access the application:**
   - **Production**: http://localhost:8080
   - **Development**: Frontend at http://localhost:5174, Backend at http://localhost:8080

### Manual Development Setup

#### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL 12+

#### Backend Setup
1. **Environment configuration:**
```bash
cp env.example .env
# Edit .env with your database configuration
```

2. **Start the backend:**
```bash
go mod download
go run cmd/server/main.go
# Backend runs on http://localhost:8080
```

#### Frontend Setup
1. **Install dependencies and start development server:**
```bash
cd web
npm install
npm run dev
# Frontend runs on http://localhost:5174 with API proxy
```

2. **Build for production:**
```bash
npm run build
# Creates optimized build in ./build directory
```

## 🎨 UI Features

### Design System
- **Glassmorphism**: Translucent cards with backdrop blur effects
- **Color Palette**: Consistent blue-to-purple gradients with semantic tokens
- **Typography**: Modern font hierarchy with proper contrast ratios
- **Spacing**: Harmonious layout with consistent gaps and padding

### Interactive Elements
- **Theme Toggle**: Animated sun/moon icon with smooth transitions
- **Voting Buttons**: Color-coded with hover states and visual feedback
- **Form Validation**: Real-time feedback with character counters
- **Loading States**: Beautiful spinners and skeleton screens

### Responsive Features
- **Mobile First**: Optimized for touch interactions
- **Flexible Layouts**: Adapts seamlessly to any screen size
- **Performance**: Lazy loading and optimized bundle sizes

## 📝 API Endpoints

### Core Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/health` | Health check |
| GET    | `/api/flag-reasons` | Get available flag reasons |

### Post Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/posts` | Submit a secret |
| GET    | `/api/posts` | List recent posts |
| POST   | `/api/posts/{id}/flag` | Flag inappropriate content |

### Comment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/posts/{id}/comments` | Add a comment to a post |
| GET    | `/api/posts/{id}/comments` | Get comments for a post |
| POST   | `/api/comments/{id}/flag` | Flag inappropriate comment |

### Voting Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/posts/{id}/vote` | Upvote/downvote a post |
| GET    | `/api/posts/{id}/votes` | Get vote counts for a post |
| POST   | `/api/comments/{id}/vote` | Upvote/downvote a comment |
| GET    | `/api/comments/{id}/votes` | Get vote counts for a comment |

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

**Add a comment:**
```bash
curl -X POST http://localhost:8080/api/posts/{post-id}/comments \
  -H "Content-Type: application/json" \
  -d '{"content": "This really resonated with me..."}'
```

**Upvote a post:**
```bash
curl -X POST http://localhost:8080/api/posts/{post-id}/vote \
  -H "Content-Type: application/json" \
  -d '{"vote_type": "upvote"}'
```

**Get vote counts:**
```bash
curl http://localhost:8080/api/posts/{post-id}/votes
# Returns: {"upvotes": 15, "downvotes": 2, "score": 13, "userVote": "upvote"}
```

## 🔒 Security Features

### Privacy Protection
- **No Tracking**: Zero user accounts, cookies, or session storage
- **IP Anonymization**: SHA-256 hashing with salt for spam prevention only
- **Data Minimization**: Only essential data is stored
- **Automatic Cleanup**: No long-term user identification possible

### Spam Prevention
- **Rate Limiting**: 5 posts per IP per 10 minutes
- **Content Validation**: Title/content length limits and sanitization
- **Duplicate Prevention**: Unique vote constraints per user per content
- **Community Moderation**: User-driven flagging system

### Web Security
- **XSS Protection**: Content sanitization and CSP headers
- **CSRF Prevention**: Token validation on state-changing operations
- **SQL Injection**: Parameterized queries with GORM
- **Input Validation**: Server-side validation for all user inputs

## 🛠️ Development

### Available Commands

```bash
# Backend
make help              # Show available commands
make dev              # Start development environment
make test             # Run backend tests
make build            # Build production binaries
make docker-build     # Build Docker image
make clean            # Clean build artifacts

# Frontend (in /web directory)
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### Project Structure

```
Reveal/
├── cmd/server/              # Application entry point
├── internal/
│   ├── handlers/           # HTTP request handlers
│   ├── models/            # Database models (Post, Comment, Vote)
│   ├── services/          # Business logic services
│   ├── middleware/        # HTTP middleware (CORS, rate limiting)
│   └── db/               # Database connection and migrations
├── web/                   # Modern React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   └── ui/       # shadcn/ui component library
│   │   ├── contexts/     # React Context providers (Theme)
│   │   ├── lib/          # Utility functions
│   │   └── assets/       # Static assets
│   ├── public/           # Public assets
│   ├── index.html        # HTML entry point
│   ├── vite.config.js    # Vite configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── jsconfig.json     # JavaScript configuration
│   └── package.json      # Frontend dependencies
├── web-backup/           # Previous frontend version (backup)
├── migrations/           # Database migration files
├── docker-compose.yml    # Docker development setup
├── Dockerfile           # Production container
└── Makefile            # Build automation
```

### Development Workflow

1. **Start Development Environment:**
```bash
# Terminal 1: Backend
go run cmd/server/main.go

# Terminal 2: Frontend
cd web && npm run dev

# Or use Docker for full environment
make dev
```

2. **Code Style:**
   - **Go**: Standard Go formatting with `gofmt`
   - **JavaScript**: ESLint with React best practices
   - **CSS**: Tailwind utility classes with component patterns

3. **Component Development:**
   - Use shadcn/ui components as building blocks
   - Follow Tailwind CSS utility-first approach
   - Implement proper TypeScript-style JSDoc comments
   - Ensure accessibility with ARIA labels

## 🌐 Deployment

### Docker Deployment (Recommended)

**Production deployment:**
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Or build and run manually
docker build -t reveal .
docker run -p 8080:8080 reveal
```

### Environment Variables

**Required for production:**
```bash
# Database Configuration
DB_HOST=your_postgres_host
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=reveal_db

# Security
SALT_KEY=your_random_salt_key_change_this

# Optional
GIN_MODE=release              # Production mode
PORT=8080                     # Server port
```

### Hosting Platforms

**Recommended platforms:**
- **Render**: Zero-config deployment with automatic PostgreSQL
- **Railway**: Simple deployment with database provisioning
- **Fly.io**: Global edge deployment with PostgreSQL add-on
- **DigitalOcean App Platform**: Managed deployment with database
- **Any VPS**: Using Docker Compose for full control

**Deployment checklist:**
- [ ] Set environment variables
- [ ] Configure PostgreSQL database
- [ ] Set up SSL/TLS certificates
- [ ] Configure domain name
- [ ] Set up monitoring and logging
- [ ] Test all functionality

## 🧪 Testing

### Backend Testing
```bash
# Unit tests
make test

# Integration tests with Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Test coverage
go test -cover ./...
```

### Frontend Testing
```bash
cd web

# Lint checks
npm run lint

# Build verification
npm run build

# Manual testing checklist
# [ ] Dark/light mode toggle
# [ ] Responsive design on mobile
# [ ] Form validation
# [ ] Voting functionality
# [ ] Comment posting and display
```

## 📦 Technology Stack

### Backend Dependencies
- **gin-gonic/gin**: Web framework
- **gorm.io/gorm**: ORM for database operations
- **gorm.io/driver/postgres**: PostgreSQL driver
- **golang.org/x/time**: Rate limiting utilities

### Frontend Dependencies
- **react**: UI library
- **axios**: HTTP client
- **@tailwindcss/vite**: Tailwind CSS v4 integration
- **class-variance-authority**: Component variant management
- **clsx**: Conditional class names
- **tailwind-merge**: Tailwind class merging utility
- **lucide-react**: Icon library

### Development Tools
- **Vite**: Fast build tool and dev server
- **ESLint**: JavaScript linting
- **Docker**: Containerization
- **Make**: Build automation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**:
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed
4. **Commit your changes**: `git commit -am 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Submit a pull request**

### Contribution Guidelines
- **Code Quality**: Ensure all tests pass and follow existing patterns
- **Documentation**: Update README and code comments as needed
- **UI Changes**: Maintain design consistency and accessibility
- **Security**: Follow security best practices for anonymous applications

## ⚠️ Disclaimer

This application is designed for sharing thoughts anonymously in a respectful environment. Users are responsible for the content they post. Please be respectful and avoid sharing harmful, illegal, or offensive content.

**Privacy Notice**: While this application is designed to protect your anonymity, please be aware that no system is 100% anonymous. Use responsibly and avoid sharing content that could identify you if that's not your intention.

---

**Built with ❤️ for anonymous expression and community support.**
