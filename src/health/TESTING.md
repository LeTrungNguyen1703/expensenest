# Testing Health Check Endpoints

## Manual Testing

### Using curl (Windows cmd/PowerShell)

```powershell
# Test general health endpoint
curl http://localhost:3000/health

# Test readiness endpoint
curl http://localhost:3000/health/ready

# Test liveness endpoint
curl http://localhost:3000/health/live
```

### Using curl (Unix/Linux/Mac)

```bash
# Test general health endpoint
curl http://localhost:3000/health

# Test readiness endpoint
curl http://localhost:3000/health/ready

# Test liveness endpoint
curl http://localhost:3000/health/live
```

### Using PowerShell Invoke-WebRequest

```powershell
# Test general health endpoint
Invoke-WebRequest -Uri http://localhost:3000/health | Select-Object -Expand Content

# Test readiness endpoint
Invoke-WebRequest -Uri http://localhost:3000/health/ready | Select-Object -Expand Content

# Test liveness endpoint
Invoke-WebRequest -Uri http://localhost:3000/health/live | Select-Object -Expand Content
```

### Using Browser
Simply navigate to:
- http://localhost:3000/health
- http://localhost:3000/health/ready
- http://localhost:3000/health/live

## Expected Responses

### Healthy Response (Status 200)
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
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
    "redis": {
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

### Unhealthy Response (Status 503)
```json
{
  "status": "error",
  "info": {
    "memory_heap": {
      "status": "up"
    }
  },
  "error": {
    "database": {
      "status": "down",
      "message": "Connection failed"
    },
    "redis": {
      "status": "down",
      "message": "Redis not configured"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection failed"
    },
    "redis": {
      "status": "down",
      "message": "Redis not configured"
    },
    "memory_heap": {
      "status": "up"
    }
  }
}
```

## Automated Testing

### Run Unit Tests
```bash
npm test -- health.controller.spec.ts
```

### Integration Testing Script

Create a test script `test-health.js`:

```javascript
const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\n=== ${path} ===`);
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', JSON.parse(data));
        resolve();
      });
    }).on('error', reject);
  });
};

async function runTests() {
  try {
    await testEndpoint('/health');
    await testEndpoint('/health/ready');
    await testEndpoint('/health/live');
    console.log('\n✅ All health checks completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runTests();
```

Run with: `node test-health.js`

## Monitoring Setup

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'expensenest-health'
    metrics_path: '/health'
    static_configs:
      - targets: ['localhost:3000']
    scrape_interval: 30s
```

### Uptime Monitoring Services

Configure these services to monitor your health endpoints:
- **UptimeRobot**: Add HTTP(s) monitor for `/health`
- **Pingdom**: Create uptime check
- **StatusCake**: Add uptime test
- **Better Uptime**: Configure status page

## CI/CD Health Checks

### GitHub Actions Example

```yaml
- name: Health Check
  run: |
    timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
```

### Docker Compose Wait Strategy

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

