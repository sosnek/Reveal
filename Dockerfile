# Multi-stage build for the React frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci --only=production
COPY web/ ./
RUN npm run build

# Build the Go backend
FROM golang:1.24-alpine AS backend-build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

# Final stage - minimal runtime image
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

# Copy the built backend binary
COPY --from=backend-build /app/main .

# Copy the built frontend files
COPY --from=frontend-build /app/web/build ./web/build

# Expose port
EXPOSE 8080

# Run the application
CMD ["./main"] 