# Docker Setup for TrustHire Frontend

This document explains how to run the TrustHire frontend application using Docker.

## Prerequisites

- Docker installed on your machine ([Download Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Create a `.env` file** in the frontend directory with your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

2. **Build and run** the container:
   ```bash
   docker-compose up --build
   ```

3. **Access the application** at `http://localhost:3000`

4. **Stop the container**:
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker Commands

1. **Build the Docker image**:
   ```bash
   docker build -t trusthire-frontend .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key \
     -e NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain \
     -e NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id \
     -e NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket \
     -e NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id \
     -e NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id \
     trusthire-frontend
   ```

3. **Access the application** at `http://localhost:3000`

## Docker Commands Reference

### Build
```bash
# Build the image
docker build -t trusthire-frontend .

# Build with no cache
docker build --no-cache -t trusthire-frontend .
```

### Run
```bash
# Run in foreground
docker-compose up

# Run in background (detached mode)
docker-compose up -d

# Run with rebuild
docker-compose up --build
```

### Stop
```bash
# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Logs
```bash
# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
```

### Clean Up
```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Complete cleanup
docker system prune -a --volumes
```

## Multi-Stage Build Explanation

The Dockerfile uses a multi-stage build process for optimization:

1. **Stage 1 (deps)**: Installs dependencies
2. **Stage 2 (builder)**: Builds the Next.js application
3. **Stage 3 (runner)**: Creates a minimal production image

This approach:
- Reduces final image size
- Improves security by running as non-root user
- Separates build-time and runtime dependencies

## Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Production Deployment

### Deploy to Cloud Platforms

**Docker Hub:**
```bash
docker tag trusthire-frontend your-username/trusthire-frontend
docker push your-username/trusthire-frontend
```

**AWS ECR:**
```bash
aws ecr get-login-password --region region | docker login --username AWS --password-stdin aws_account_id.dkr.ecr.region.amazonaws.com
docker tag trusthire-frontend:latest aws_account_id.dkr.ecr.region.amazonaws.com/trusthire-frontend:latest
docker push aws_account_id.dkr.ecr.region.amazonaws.com/trusthire-frontend:latest
```

**Google Cloud:**
```bash
docker tag trusthire-frontend gcr.io/project-id/trusthire-frontend
docker push gcr.io/project-id/trusthire-frontend
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Container won't start
```bash
# Check logs
docker-compose logs frontend

# Restart container
docker-compose restart frontend
```

### Build fails
```bash
# Clean build
docker-compose down
docker system prune -a
docker-compose up --build
```

## Performance Tips

1. **Use Docker BuildKit** for faster builds:
   ```bash
   DOCKER_BUILDKIT=1 docker build -t trusthire-frontend .
   ```

2. **Layer caching**: The Dockerfile is optimized to cache dependencies separately from application code

3. **Resource limits** (optional):
   ```yaml
   services:
     frontend:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

## Security Best Practices

- ✅ Running as non-root user (nextjs)
- ✅ Multi-stage build to reduce image size
- ✅ Minimal base image (Alpine Linux)
- ✅ Environment variables for sensitive data
- ✅ .dockerignore to exclude unnecessary files

## Support

For issues or questions, please contact the development team or create an issue in the repository.
