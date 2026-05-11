import fs from 'fs'
import path from 'path'

const datasetDir = 'storage/datasets/default'
const outputFile = 'data/parsed/stealth-latest.csv'

// Read all JSON files
const files = fs.readdirSync(datasetDir).filter(f => f.endsWith('.json')).sort()

if (files.length === 0) {
  console.log('No JSON files found')
  process.exit(0)
}

// Read first file to get headers
const firstFile = JSON.parse(fs.readFileSync(path.join(datasetDir, files[0]), 'utf-8'))
const headers = Object.keys(firstFile)

// Create CSV
const rows = [headers.join(',')]

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(datasetDir, file), 'utf-8'))
  const row = headers.map(h => {
    const value = data[h] || ''
    const str = value.toString()
    // Escape quotes, newlines, and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`
    }
    return str
  })
  rows.push(row.join(','))
}

// Ensure directory exists
fs.mkdirSync('data/parsed', { recursive: true })

// Write CSV
fs.writeFileSync(outputFile, rows.join('\n'))

console.log(`✅ Converted ${files.length} products to ${outputFile}`)
