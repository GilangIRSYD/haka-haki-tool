# Docker Deployment Guide

This guide explains how to build and run the IDX Analytics application using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)

## Quick Start with Docker Compose

The easiest way to run the application:

```bash
docker-compose up -d
```

The application will be available at `http://localhost:9000`

## Manual Docker Build

If you prefer to build and run manually:

### 1. Build the Docker Image

```bash
docker build -t idx-analytics:latest .
```

### 2. Run the Container

```bash
docker run -d -p 9000:9000 --name idx-analytics idx-analytics:latest
```

### 3. View Logs

```bash
docker logs -f idx-analytics
```

### 4. Stop the Container

```bash
docker stop idx-analytics
docker rm idx-analytics
```

## Docker Compose Commands

### Start the application

```bash
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f
```

### Stop the application

```bash
docker-compose down
```

### Rebuild and restart

```bash
docker-compose up -d --build
```

## Configuration

### Port Configuration

The application runs on port **9000** by default. To change the port:

**Using Docker Compose:**
```yaml
ports:
  - "8080:9000"  # Maps localhost:8080 to container:9000
```

**Using Docker run:**
```bash
docker run -d -p 8080:9000 idx-analytics:latest
```

### Environment Variables

You can add environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=9000
```

## Production Considerations

### Image Optimization

The Dockerfile uses a multi-stage build for optimal image size:
- **Stage 1 (deps):** Installs dependencies
- **Stage 2 (builder):** Builds the Next.js application
- **Stage 3 (runner):** Minimal runtime image with Bun

### Security

- Runs as non-root user (`nextjs`)
- Uses Alpine Linux for minimal attack surface
- Bun runtime for faster startup and lower memory usage

### Performance

- Bun provides faster startup and lower memory footprint
- Standalone output mode for optimal production builds
- Static assets are properly cached

## Troubleshooting

### Port Already in Use

If port 9000 is already in use:

```bash
# Option 1: Stop the conflicting service
lsof -ti:9000 | xargs kill -9

# Option 2: Use a different port
docker run -d -p 8080:9000 idx-analytics:latest
```

### Build Failures

If the build fails, try:

```bash
# Clean build
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Container Issues

To debug container issues:

```bash
# Enter the running container
docker exec -it idx-analytics sh

# Check logs
docker logs idx-analytics
```

## Deployment

### Deploy to Production

1. Build the image:
```bash
docker build -t idx-analytics:latest .
```

2. Tag for registry (example for Docker Hub):
```bash
docker tag idx-analytics:latest your-registry/idx-analytics:latest
```

3. Push to registry:
```bash
docker push your-registry/idx-analytics:latest
```

4. Pull and run on server:
```bash
docker pull your-registry/idx-analytics:latest
docker run -d -p 9000:9000 your-registry/idx-analytics:latest
```

## Health Check

To verify the application is running:

```bash
curl http://localhost:9000
```

You should see the IDX Analytics homepage.
