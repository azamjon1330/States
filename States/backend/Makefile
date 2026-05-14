.PHONY: all build run tidy docker-up docker-down clean

# Default target
all: tidy build

# Download dependencies and generate go.sum
tidy:
	go mod tidy

# Build the binary
build:
	go build -o main ./cmd/

# Run locally (requires PostgreSQL running)
run:
	go run ./cmd/

# Run with live reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	air

# Start full stack with Docker Compose
docker-up:
	docker compose up --build -d

# Stop Docker Compose services
docker-down:
	docker compose down

# Stop and remove volumes
docker-clean:
	docker compose down -v

# Clean build artifacts
clean:
	rm -f main

# Run tests
test:
	go test ./... -v

# Format code
fmt:
	go fmt ./...

# Vet code
vet:
	go vet ./...
