# 📚 Book Recommendation API

A DevOps-enabled REST API for personalized book recommendations with complete CI/CD, containerization, and observability.

![CI/CD](https://github.com/RanaRomdhane/book-recommendation-api/actions/workflows/ci-cd.yml/badge.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-orange)

## 🚀 Features

- **Personalized Recommendations**: Content-based filtering algorithm
- **RESTful API**: Clean, well-documented endpoints
- **DevOps Ready**: Full CI/CD pipeline with GitHub Actions
- **Containerized**: Docker and Kubernetes support
- **Observable**: Metrics, logging, and tracing
- **Secure**: SAST/DAST scanning and security headers

## 🏗️ Architecture

- **Framework**: Express.js
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Security**: Trivy SAST/DAST
- **Observability**: Winston logging, custom metrics

## 🛠️ Quick Start

### Local Development
```bash
git clone https://github.com/RanaRomdhane/book-recommendation-api
cd book-recommendation-api
npm install
npm run dev
```

### Docker
```bash
docker build -t book-recommendation-api .
docker run -p 3000:3000 book-recommendation-api
Docker Compose
```
```bash
docker-compose up
```
### Kubernetes
```bash
# Start minikube
minikube start

# Deploy application
kubectl apply -f kubernetes/

# Get service URL
minikube service book-api-service --url
```

## 📚 API Endpoints
### GET /health
Health check endpoint

```bash
curl http://localhost:3000/health
```
### GET /books
Retrieve all books
```bash
curl http://localhost:3000/books
```
### POST /recommendations
Get personalized recommendations
```bash
curl -X POST http://localhost:3000/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "preferredGenres": ["sci-fi", "fantasy"],
    "maxPages": 400,
    "minRating": 4.5
  }'
```
### GET /metrics
Prometheus-style metrics

```bash
curl http://localhost:3000/metrics
```
### GET /books/:id
Get specific book by ID

```bash
curl http://localhost:3000/books/1
```

## 🔧 Development
### Project Structure
``` text
src/
├── app.js          # Main application
tests/
├── app.test.js     # Test cases
kubernetes/
├── deployment.yml  # K8s deployment
├── service.yml     # K8s service
├── hpa.yml         # Auto-scaling
.github/workflows/
├── ci-cd.yml       # CI/CD pipeline
```
### Testing
``` bash
npm test
npm run test:coverage
npm run test:watch
```
## 🚢 Deployment
### CI/CD Pipeline
The GitHub Actions pipeline automatically:

Runs tests on every PR

Builds Docker image on main branch

Runs security scans (SAST)

Deploys to Kubernetes

### Manual Deployment
```bash
# Build and push Docker image
docker build -t ranaromdhane/book-recommendation-api .
docker push ranaromdhane/book-recommendation-api

# Deploy to Kubernetes
kubectl apply -f kubernetes/
```
## 📊 Monitoring
### Metrics
Access application metrics at /metrics endpoint:
``` bash
{
  "requests": {
    "total": 42,
    "averageResponseTime": "45.67",
    "uptime": "1234.56s"
  },
  "books": {
    "total": 10
  }
}
```

### Logs
Structured JSON logs are written to logs/combined.log and stdout.

### Tracing
Each request receives a unique trace ID for correlation.

## 🔒 Security
Security Features
SAST: Trivy static analysis in CI/CD

DAST: Runtime security scanning

Rate Limiting: 100 requests per 15 minutes

Security Headers: Helmet.js configuration

Dependency Scanning: npm audit integration

### Security Scanning
``` bash
./security/scan.bat
```
## 🤝 Contributing
Create a feature branch: git checkout -b feature/amazing-feature

Commit changes: git commit -m 'Add amazing feature'

Push branch: git push origin feature/amazing-feature

Open a Pull Request

## 📄 License
This project is licensed under the MIT License.