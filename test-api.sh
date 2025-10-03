#!/bin/bash
echo "🧪 Testing Book Recommendation API..."

BASE_URL="http://localhost:3000"

echo "1. Testing health endpoint..."
curl -s $BASE_URL/health | jq .

echo "2. Testing books endpoint..."
curl -s $BASE_URL/books | jq '.data[0:2]'

echo "3. Testing recommendations..."
curl -s -X POST $BASE_URL/recommendations \
  -H "Content-Type: application/json" \
  -d '{"preferredGenres": ["sci-fi"], "minRating": 4.5}' | jq .

echo "4. Testing metrics..."
curl -s $BASE_URL/metrics | jq .

echo "5. Testing specific book..."
curl -s $BASE_URL/books/2 | jq .

echo "✅ All tests completed!"