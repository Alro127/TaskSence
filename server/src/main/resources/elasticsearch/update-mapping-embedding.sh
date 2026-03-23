#!/bin/bash
# Chạy script này để thêm dense_vector field vào ES mapping cho RAG
# Yêu cầu: Elasticsearch đang chạy tại localhost:9200

ES_URL="${ELASTICSEARCH_URIS:-http://localhost:9200}"

echo "Updating tasks index mapping..."
curl -X PUT "$ES_URL/tasks/_mapping" \
  -H 'Content-Type: application/json' \
  -d '{
    "properties": {
      "embedding": {
        "type": "dense_vector",
        "dims": 768,
        "index": true,
        "similarity": "cosine"
      }
    }
  }'

echo ""
echo "Updating projects index mapping..."
curl -X PUT "$ES_URL/projects/_mapping" \
  -H 'Content-Type: application/json' \
  -d '{
    "properties": {
      "embedding": {
        "type": "dense_vector",
        "dims": 768,
        "index": true,
        "similarity": "cosine"
      }
    }
  }'

echo ""
echo "Updating comments index mapping..."
curl -X PUT "$ES_URL/comments/_mapping" \
  -H 'Content-Type: application/json' \
  -d '{
    "properties": {
      "embedding": {
        "type": "dense_vector",
        "dims": 768,
        "index": true,
        "similarity": "cosine"
      }
    }
  }'

echo ""
echo "Done! All mappings updated."
