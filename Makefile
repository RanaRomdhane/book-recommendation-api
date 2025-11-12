.PHONY: help install test build run docker-build docker-run docker-push k8s-deploy k8s-delete k8s-logs clean

# Default Git commit SHA for image tagging
GIT_SHA := $(shell git rev-parse --short HEAD)
IMAGE_NAME := ranaromdhane/book-recommendation-api
DOCKER_TAG := $(GIT_SHA)

help: ## Show this help message
	@echo "📚 Book Recommendation API - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

test: ## Run tests
	npm test

test-coverage: ## Run tests with coverage
	npm run test:coverage

run: ## Run the application locally
	npm start

dev: ## Run the application in development mode
	npm run dev

# Docker commands
docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(DOCKER_TAG) .
	docker tag $(IMAGE_NAME):$(DOCKER_TAG) $(IMAGE_NAME):main

docker-run: ## Run Docker container locally
	docker run -p 3000:3000 --name book-api $(IMAGE_NAME):main

docker-push: docker-build ## Build and push Docker image
	docker push $(IMAGE_NAME):$(DOCKER_TAG)
	docker push $(IMAGE_NAME):main

docker-stop: ## Stop running container
	docker stop book-api || true
	docker rm book-api || true

# Kubernetes commands
k8s-start: ## Start minikube
	minikube start --driver=docker

k8s-deploy: ## Deploy to local Kubernetes
	kubectl apply -f kubernetes/deployment.yaml
	kubectl apply -f kubernetes/service.yaml
	kubectl apply -f kubernetes/hpa.yaml
	@echo "Waiting for deployment..."
	kubectl rollout status deployment/book-recommendation-api
	@echo "✅ Deployment complete!"

k8s-update: docker-build docker-push ## Update deployment with new image
	kubectl set image deployment/book-recommendation-api book-api=$(IMAGE_NAME):$(DOCKER_TAG)
	kubectl rollout status deployment/book-recommendation-api

k8s-delete: ## Delete Kubernetes resources
	kubectl delete -f kubernetes/deployment.yaml || true
	kubectl delete -f kubernetes/service.yaml || true
	kubectl delete -f kubernetes/hpa.yaml || true

k8s-logs: ## View pod logs
	kubectl logs -l app=book-api --tail=100 -f

k8s-status: ## Check deployment status
	@echo "=== Pods ==="
	kubectl get pods -l app=book-api
	@echo ""
	@echo "=== Services ==="
	kubectl get service book-api-service
	@echo ""
	@echo "=== HPA ==="
	kubectl get hpa book-api-hpa

k8s-url: ## Get service URL
	minikube service book-api-service --url

# Cleanup
clean: ## Clean up generated files
	rm -rf node_modules coverage logs/*.log

# Security
security-scan: ## Run security scans
	npm audit
	trivy fs . --exit-code 0

# Lint
lint: ## Run linting
	npm run lint || echo "No lint script configured"