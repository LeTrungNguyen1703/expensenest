# Health Check Module

This module implements health checks for the ExpenseNest application using NestJS Terminus.

## Endpoints

### 1. General Health Check
**GET** `/health`

Returns the overall health status of the application including:
- Database connectivity (Prisma/PostgreSQL)
- Memory heap usage (threshold: 150MB)
- Memory RSS usage (threshold: 300MB)

**Response Example:**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  }
}
```

### 2. Readiness Check
**GET** `/health/ready`

Checks if the application is ready to accept traffic. Primarily checks database connectivity.

Use this for Kubernetes readiness probes or load balancer health checks.

### 3. Liveness Check
**GET** `/health/live`

Checks if the application is alive and responsive. Performs a basic memory check.

Use this for Kubernetes liveness probes to detect if the application needs to be restarted.

## Integration with Kubernetes

### Example Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: expensenest
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: expensenest
        image: expensenest:latest
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

## Integration with Docker

### Docker Compose Health Check

```yaml
services:
  app:
    image: expensenest:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Monitoring

You can integrate these endpoints with monitoring tools like:
- **Prometheus**: Use the health check endpoints as targets
- **Grafana**: Create dashboards based on health check responses
- **Datadog**: Configure synthetic tests
- **New Relic**: Set up availability monitoring

## Customization

To add more health indicators, edit `health.controller.ts`:

```typescript
// Example: Add Redis health check
@Get()
@HealthCheck()
check() {
  return this.health.check([
    () => this.prismaHealth.pingCheck('database', this.prisma),
    () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    // Add custom health indicators here
  ]);
}
```

## Dependencies

- `@nestjs/terminus`: NestJS health check library
- `@nestjs/axios`: Required by Terminus for HTTP health checks
- `axios`: HTTP client

## Notes

- All health check endpoints are **public** and don't require authentication
- Memory thresholds can be adjusted based on your application's requirements
- The database health check uses Prisma's connection to PostgreSQL

