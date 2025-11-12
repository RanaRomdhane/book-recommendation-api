#!/bin/bash
set -e

echo "🚀 Deploying Book Recommendation API to Kubernetes..."

# Configuration
IMAGE_NAME="ranaromdhane/book-recommendation-api"
GIT_SHA=$(git rev-parse --short HEAD)
IMAGE_TAG="${GIT_SHA}"

echo "📦 Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:main

echo "📤 Pushing image to Docker Hub..."
docker push ${IMAGE_NAME}:${IMAGE_TAG}
docker push ${IMAGE_NAME}:main

echo "☸️  Deploying to Kubernetes..."
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/hpa.yaml

echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/book-recommendation-api --timeout=120s

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📊 Current status:"
kubectl get pods -l app=book-api
echo ""
echo "🌐 Access the service:"
echo "   minikube service book-api-service --url"
echo ""