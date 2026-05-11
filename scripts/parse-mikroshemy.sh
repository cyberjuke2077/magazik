#!/bin/bash

# Parse all subcategories of "Микросхемы"
# This will parse 92 subcategories with all their products

cd /Users/lux/Desktop/projects/electromagaz

echo "🚀 Starting parser for all Микросхемы subcategories..."
echo "📦 Getting category slugs from database..."

# Get all valid subcategory slugs
SLUGS=$(docker exec electromagaz_db psql -U postgres -d electromagaz -t -c "
SELECT c2.slug
FROM \"Category\" c1
INNER JOIN \"Category\" c2 ON c2.\"parentId\" = c1.id
WHERE c1.name = 'Микросхемы' 
  AND c2.slug NOT LIKE '/catalog-show/%'
ORDER BY c2.name;
" | tr '\n' ' ')

echo "📊 Found $(echo $SLUGS | wc -w) categories"
echo ""
echo "Starting Crawlee parser..."
echo ""

# Run parser with all slugs
npx tsx scripts/parse-with-crawlee.ts $SLUGS

echo ""
echo "✅ Parsing complete!"
echo "📁 Results saved to: data/parsed/crawlee-$(date +%Y-%m-%d).csv"
