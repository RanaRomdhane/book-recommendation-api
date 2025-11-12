# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEVELOPER                                │
│  ┌────────────┐    ┌────────────┐    ┌──────────────┐          │
│  │  Git Push  │ -> │ Pull Request│ -> │ Peer Review  │          │
│  └────────────┘    └────────────┘    └──────────────┘          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 v
┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS CI/CD                        │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  │  Run Tests  │   │   Trivy FS  │   │ Build Image │          │
│  │  (Jest)     │ → │   Security  │ → │  (Docker)   │          │
│  └─────────────┘   └─────────────┘   └─────────────┘          │
│                                              │                   │
│  ┌─────────────┐   ┌─────────────┐         │                   │
│  │ Trivy Image │   │Push to Hub  │ ←───────┘                   │
│  │  Security   │ → │  (Docker)   │                             │
│  └─────────────┘   └─────────────┘                             │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 v
┌─────────────────────────────────────────────────────────────────┐
│                       DOCKER HUB                                 │
│        ranaromdhane/book-recommendation-api:sha                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 v
┌─────────────────────────────────────────────────────────────────┐
│                    LOCAL KUBERNETES (Minikube)                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Deployment                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │  Pod 1   │  │  Pod 2   │  │  Pod N   │              │  │
│  │  │ (API)    │  │ (API)    │  │ (API)    │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↑                                        │
│                         │ Managed by                             │
│                         │                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          HorizontalPodAutoscaler (HPA)                    │  │
│  │     Auto-scales pods based on CPU (50-70%)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Service (NodePort)                       │  │
│  │         Exposes pods on port 30001                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 v
                        ┌─────────────────┐
                        │   End User      │
                        │  curl/browser   │
                        └─────────────────┘
```

## Component Breakdown

### 1. Source Code (GitHub Repository)
- **src/app.js**: Express.js API with 158 lines
- **src/server.js**: Server initialization
- **tests/**: Jest unit tests
- **Dockerfile**: Container definition
- **kubernetes/**: K8s manifests

### 2. CI/CD Pipeline (GitHub Actions)

```
┌────────────────────────────────────────────────────────────┐
│  Trigger: Push to main/develop or Pull Request            │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ├──> Job: test
                 │    ├── npm install
                 │    ├── npm test
                 │    ├── npm audit
                 │    └── Upload coverage
                 │
                 ├──> Job: security-scan
                 │    ├── Trivy filesystem scan
                 │    │   (Checks: package.json, src/, configs)
                 │    └── Upload results to GitHub Security
                 │
                 └──> Job: build (main branch only)
                      ├── Build Docker image
                      ├── Trivy image scan
                      │   (Checks: OS packages, Node.js base)
                      ├── Push to Docker Hub
                      └── Upload scan results
```

### 3. Container Layer (Docker)

```dockerfile
┌─────────────────────────────────────────┐
│  node:18-alpine (Base Image)            │
│  + Application Code                     │
│  + Dependencies (npm packages)          │
│  + Health Check                         │
│  + Non-root user (security)             │
│  = book-recommendation-api:sha          │
└─────────────────────────────────────────┘
```

### 4. Orchestration Layer (Kubernetes)

```
Deployment
├── Replica Set (2-5 pods)
│   ├── Pod 1: book-api container
│   ├── Pod 2: book-api container
│   └── Pod N: book-api container
│
├── Resource Limits
│   ├── CPU: 100m request, 200m limit
│   └── Memory: 128Mi request, 256Mi limit
│
└── Health Checks
    ├── Liveness Probe: /health every 10s
    └── Readiness Probe: /health every 5s

Service (NodePort)
├── Selector: app=book-api
├── Port Mapping: 80 → 3000
└── NodePort: 30001

HPA (Horizontal Pod Autoscaler)
├── Min Replicas: 2
├── Max Replicas: 5
└── Target: 70% CPU utilization
```

## Data Flow

### Request Flow
```
1. User Request
   curl http://localhost:30001/recommendations
        ↓
2. Kubernetes Service (NodePort)
   Routes to healthy pod
        ↓
3. Pod/Container
   Express.js processes request
        ↓
4. Application Logic
   - Parse JSON body
   - Filter books by criteria
   - Sort by rating
        ↓
5. Response
   JSON with recommended books
        ↓
6. Logging & Metrics
   - Request logged with trace ID
   - Metrics updated
```

### Deployment Flow
```
1. Developer commits code
        ↓
2. GitHub Actions CI starts
        ↓
3. Tests run (pass/fail)
        ↓
4. Security scans (Trivy)
        ↓
5. Docker image built
        ↓
6. Image pushed to Docker Hub
        ↓
7. Manual deployment:
   - Pull new image
   - kubectl apply -f kubernetes/
   - Kubernetes rolling update
        ↓
8. Pods gradually replaced
   (Zero downtime)
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Code Level                                    │
│  - Helmet.js security headers                           │
│  - Rate limiting (100 req/15min)                        │
│  - Input validation                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│  Layer 2: Dependencies                                  │
│  - npm audit (moderate level)                           │
│  - Trivy filesystem scan                                │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│  Layer 3: Container                                     │
│  - Non-root user                                        │
│  - Minimal base image (Alpine)                          │
│  - Trivy image scan                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│  Layer 4: Kubernetes                                    │
│  - Resource limits (prevent DOS)                        │
│  - Health checks (remove unhealthy pods)                │
│  - Network policies (future)                            │
└─────────────────────────────────────────────────────────┘
```

## Observability Stack

```
Application
├── Winston Logger
│   ├── Structured JSON logs
│   ├── Log levels (info, error, warn)
│   └── Output: stdout + logs/combined.log
│
├── Trace IDs (UUID)
│   └── Correlate requests across logs
│
└── Metrics Endpoint (/metrics)
    ├── Total requests
    ├── Average response time
    └── Book count

Future enhancements:
└── Prometheus + Grafana
    ├── Prometheus scrapes /metrics
    ├── Grafana visualizes data
    └── Alerts on anomalies
```

## Technology Choices & Rationale

| Component | Choice | Why |
|-----------|--------|-----|
| Runtime | Node.js 18 | Long-term support, async I/O |
| Framework | Express.js | Lightweight, widely used |
| Container | Docker | Industry standard, portability |
| Base Image | node:18-alpine | Small size (40MB vs 1GB) |
| Orchestration | Kubernetes | Learn K8s concepts, auto-scaling |
| CI/CD | GitHub Actions | Native integration, free for public repos |
| Security | Trivy | Fast, accurate, easy to integrate |
| Testing | Jest | Fast, built-in mocking |

## Scaling Considerations

### Current State (Small Project)
- 2-5 pods
- CPU-based autoscaling
- NodePort service

### Production-Ready (Future)
```
├── Multiple replicas across nodes
├── LoadBalancer service (cloud)
├── Ingress controller (routing)
├── Database backend (PostgreSQL)
├── Redis cache layer
├── Horizontal scaling: 10-100 pods
└── Vertical scaling: Larger nodes
```

## Local Development vs Production

| Aspect | Local (Minikube) | Production (Cloud) |
|--------|------------------|-------------------|
| Service Type | NodePort | LoadBalancer |
| Replicas | 2 | 10+ |
| Storage | emptyDir | Persistent Volumes |
| Secrets | Plain env vars | Kubernetes Secrets |
| TLS | None | Cert-manager |
| Monitoring | Manual logs | Prometheus/Grafana |
| CI/CD | Manual deploy | Automatic with ArgoCD |