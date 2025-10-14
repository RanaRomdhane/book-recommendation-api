#!/bin/bash
echo "🧪 Testing Book Recommendation API..."
echo "========================================"
echo ""

BASE_URL="http://localhost:3000"

# Fonction pour formater JSON avec Python
format_json() {
  python3 -m json.tool 2>/dev/null || cat
}

echo "1️⃣  Testing health endpoint..."
echo "------------------------------------"
curl -s $BASE_URL/health | format_json
echo ""

echo "2️⃣  Testing books endpoint (first 2 books)..."
echo "------------------------------------"
curl -s $BASE_URL/books | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps({'success': data['success'], 'count': data['count'], 'first_books': data['data'][:2]}, indent=2))" 2>/dev/null || curl -s $BASE_URL/books
echo ""

echo "3️⃣  Testing recommendations (sci-fi, rating >= 4.5)..."
echo "------------------------------------"
curl -s -X POST $BASE_URL/recommendations \
  -H "Content-Type: application/json" \
  -d '{"preferredGenres": ["sci-fi"], "minRating": 4.5}' | format_json
echo ""

echo "4️⃣  Testing metrics..."
echo "------------------------------------"
curl -s $BASE_URL/metrics | format_json
echo ""

echo "5️⃣  Testing specific book (ID: 2)..."
echo "------------------------------------"
curl -s $BASE_URL/books/2 | format_json
echo ""

echo "6️⃣  Testing 404 error..."
echo "------------------------------------"
curl -s $BASE_URL/books/999 | format_json
echo ""

echo "7️⃣  Testing invalid JSON..."
echo "------------------------------------"
curl -s -X POST $BASE_URL/recommendations \
  -H "Content-Type: application/json" \
  -d 'invalid json' | format_json
echo ""

echo "========================================"
echo "✅ All tests completed!"
echo "========================================"