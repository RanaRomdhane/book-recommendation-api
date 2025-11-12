# 📚 Book Recommendation API

A simple REST API that recommends books based on your preferences. Built to demonstrate modern DevOps practices.

![CI/CD](https://github.com/RanaRomdhane/book-recommendation-api/actions/workflows/ci-cd.yaml/badge.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-orange)
![Observability](https://img.shields.io/badge/Observability-OpenTelemetry%2520%257C%2520Prometheus%2520%257C%2520Grafana-green)

## What Does This Do?

This API helps you find books you might like. Tell it what genres you prefer, how long you want the book to be, and what rating you're looking for, and it'll recommend books from its collection.

**Example**: "I want sci-fi books under 400 pages with at least 4.5 stars" → You get _Dune_ and _Foundation_

## Quick Start

### Option 1: Run Locally with Full Observability (Recommended)

```bash
## Clone the project
git clone https://github.com/RanaRomdhane/book-recommendation-api
cd book-recommendation-api

# Install dependencies
npm install

# Start the observability stack (Docker required)
npm run observability:up

# Start the API with OpenTelemetry tracing
npm start

# Access the services:
# 🌐 API: http://localhost:3000
# 📊 Grafana: http://localhost:3001 (admin/admin)
# 🔍 Jaeger: http://localhost:16686
# 📈 Prometheus: http://localhost:9090
```

### Option 2: Using Docker Only

```bash
# Build and run the API
docker build -t book-api .
docker run -p 3000:3000 book-api

# Or use the full observability stack
docker-compose -f docker-compose.observability.yml up -d
```

### Option 3: Kubernetes (For Learning K8s)

```bash
# Start minikube
minikube start

# Deploy everything
make k8s-deploy

# Get the URL
make k8s-url
```

### Option 4: Windows Users

```bash
# Start observability stack
docker-compose -f docker-compose.observability.yml up -d

# Start API with tracing
node -r ./tracing.js server.js
```

## How to Use the API

### 1. Check if it's working
```bash
curl http://localhost:3000/health
```

### 2. Get all books
```bash
curl http://localhost:3000/books
```

### 3. Get recommendations
```bash
curl -X POST http://localhost:3000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "preferredGenres": ["sci-fi", "fantasy"],
    "maxPages": 400,
    "minRating": 4.5
  }'
```

### 4. See Prometheus metrics
```bash
curl http://localhost:3000/metrics
```

### 5. See legacy JSON metrics
```bash
curl http://localhost:3000/legacy-metrics
```

## Architecture

```
User Request → Express.js API → Book Filter Algorithm → JSON Response
                    ↓
              [Logging & Tracing]
```

**Stack:**

- Node.js + Express.js (Backend)

- OpenTelemetry (Distributed Tracing)

- Prometheus (Metrics Collection)

- Grafana (Visualization & Dashboards)

- Jaeger (Trace Analysis)

- Docker (Containerization)

- Kubernetes (Orchestration)

- GitHub Actions (CI/CD)

- Trivy (Security Scanning)

## Project Structure

```
├── src/
│   ├── app.js              # Main API logic with Prometheus metrics
│   ├── server.js           # Server startup
│   └── tracing.js          # OpenTelemetry configuration
├── kubernetes/
│   ├── deployment.yaml     # K8s deployment config
│   ├── service.yaml        # K8s service config
│   └── hpa.yaml           # Auto-scaling config
├── .github/workflows/
│   └── ci-cd.yaml         # Automated pipeline
├── docker-compose.observability.yml  # Full observability stack
├── otel-collector-config.yaml        # OpenTelemetry collector
├── grafana/
│   └── datasources.yml     # Grafana configuration
├── Dockerfile              # Container definition
└── tests/                  # Unit tests
```

## Development Commands :

### Using npm scripts (Cross-platform):

```bash
npm install                  # Install dependencies
npm start                   # Start API with OpenTelemetry
npm test                    # Run tests
npm run test:coverage       # Run tests with coverage
npm run observability:up    # Start observability stack
npm run observability:down  # Stop observability stack
npm run observability:logs  # View observability logs
npm run full:start          # Start everything
```
### Using Docker Compose:
```bash
# Start full observability stack
docker-compose -f docker-compose.observability.yml up -d

# View logs
docker-compose -f docker-compose.observability.yml logs -f

# Stop everything
docker-compose -f docker-compose.observability.yml down
```

## What Makes This a DevOps Project?

### ✅ Full Observability Stack
- OpenTelemetry Tracing: Distributed tracing with Jaeger UI

- Prometheus Metrics: Custom application metrics and system metrics

- Grafana Dashboards: Beautiful visualizations and monitoring

- Structured Logging: JSON logs with trace correlation

### ✅ Automated Testing
Every code change runs tests automatically in GitHub Actions.

### ✅ Security Scanning
- **Trivy filesystem scan**: Checks your code and dependencies for known vulnerabilities
- **Trivy image scan**: Checks the Docker image for security issues
- Both run automatically on every push

### ✅ Continuous Deployment
Push to `main` → Tests run → Image builds → Security scans → Ready to deploy

### ✅ Production-Ready Monitoring
- Health checks: Know if your service is up

- Performance metrics: Response times, error rates, throughput

- Business metrics: Books requested, recommendations generated

- Distributed tracing: Track requests across services

### ✅ Container Best Practices
- Specific image versions (no latest tag)

- Non-root user for security

- Health checks built-in

- Optimized layer caching

- Multi-stage builds

### ✅ Observability
- **Logs**: Every request is logged with a unique ID for tracking
- **Metrics**: See how many requests you're getting and response times
- **Health checks**: Know if your service is up

### Prometheus Metrics
- HTTP Metrics: Request count, duration, error rates

- Business Metrics: Books requested, recommendations generated

- System Metrics: Memory, CPU, event loop lag

- Custom Metrics: Recommendation duration, genre preferences

### Grafana Dashboards
- Real-time API performance

- Error rates and trends

- Business metrics visualization

- Alerting capabilities

### 🚦 Access URLs (After Starting Observability)
Service	URL	Credentials
- Your API	http://localhost:3000	-
- Grafana	http://localhost:3001	admin/admin
- Jaeger	http://localhost:16686	-
- Prometheus	http://localhost:9090	-

### 📈 Monitoring Your API
Once running, you can monitor:

- Grafana: View API metrics and create dashboards

- Jaeger: Trace specific requests and identify bottlenecks

- Prometheus: Query raw metrics and set up alerts

- Terminal: View structured JSON logs with trace IDs

## Why These Choices?

### Why Docker Health Checks?
While Kubernetes has its own health checks, Docker's `HEALTHCHECK` is useful for:
- Local development (quick status check with `docker ps`)
- Docker Compose setups
- Any environment without orchestration

### Why HPA (HorizontalPodAutoscaler)?
Even for small projects, HPA demonstrates:
- How Kubernetes handles load automatically
- Production-ready scaling patterns
- It's a learning opportunity for K8s features

### Why No Minikube in CI?
Running full K8s in CI is slow and unnecessary. The CI focuses on:
- Testing your code
- Scanning for vulnerabilities
- Building the Docker image

Manual deployment is done separately with `make k8s-deploy` or `scripts/deploy.sh`

## Common Tasks

### Update the deployment
```bash
# Make your code changes
git add .
git commit -m "Add new feature"
git push

# Deploy to K8s
make docker-build docker-push
make k8s-update
```

### View logs
```bash
make k8s-logs
```

### Check what's running
```bash
make k8s-status
```

### Clean up
```bash
make k8s-delete
make docker-stop
make clean
```

## Testing

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage

# Watch mode (for development)
npm run test:watch
```

## Contributing

1. **Create a branch** for your feature
   ```bash
   git checkout -b fix/improve-readme
   ```

2. **Make your changes** and commit
   ```bash
   git commit -m "Make README more friendly"
   ```

3. **Push and create a Pull Request**
   ```bash
   git push origin fix/improve-readme
   ```

4. **Wait for peer review** - Someone will review your code

5. **Address feedback** if any, then it gets merged!

## Troubleshooting

**Problem**: Container won't start
- Check logs: `docker logs book-api` or `kubectl logs -l app=book-api`
- Verify port 3000 isn't already in use

**Problem**: Can't access service in Kubernetes
- Run `minikube service book-api-service --url` to get the correct URL
- Check pods are running: `kubectl get pods`

**Problem**: Tests failing
- Make sure dependencies are installed: `npm install`
- Check Node version: `node --version` (should be 18+)

## License

MIT License - Feel free to use this for learning!