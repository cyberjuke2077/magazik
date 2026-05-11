#!/usr/bin/env node
/**
 * Convert Webshare Proxies Script
 * 
 * Converts Webshare proxy list from host:port:user:pass format
 * to .env format for use in parsers.
 * 
 * Usage:
 *   node scripts/convert-proxies-simple.js /path/to/webshare-proxies.txt
 */

const fs = require('fs')

function parseWebshareProxy(line) {
  const parts = line.trim().split(':')
  
  if (parts.length !== 4) return null
  
  const [host, portStr, username, password] = parts
  const port = parseInt(portStr, 10)
  
  if (!host || isNaN(port) || !username || !password) return null
  
  return { host, port, username, password }
}

function formatProxyUrl(proxy) {
  return `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
}

function loadWebshareProxies(content) {
  return content
    .split('\n')
    .map(line => parseWebshareProxy(line))
    .filter(proxy => proxy !== null)
}

function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('Usage: node scripts/convert-proxies-simple.js <proxy-file>')
    console.error('Example: node scripts/convert-proxies-simple.js ~/Downloads/webshare-proxies.txt')
    process.exit(1)
  }
  
  const inputFile = args[0]
  const outputFile = '.env.proxies'
  
  console.log(`📥 Reading proxies from: ${inputFile}`)
  
  try {
    const content = fs.readFileSync(inputFile, 'utf-8')
    const proxies = loadWebshareProxies(content)
    
    console.log(`✅ Loaded ${proxies.length} proxies`)
    
    if (proxies.length === 0) {
      console.error('❌ No valid proxies found in file')
      process.exit(1)
    }
    
    // Generate .env format
    const envLines = [
      '# Webshare residential proxies',
      `# Generated: ${new Date().toISOString()}`,
      `# Total proxies: ${proxies.length}`,
      '',
    ]
    
    proxies.forEach((proxy, index) => {
      const url = formatProxyUrl(proxy)
      envLines.push(`PROXY_${index + 1}=${url}`)
    })
    
    const envContent = envLines.join('\n')
    
    console.log(`💾 Writing to: ${outputFile}`)
    fs.writeFileSync(outputFile, envContent, 'utf-8')
    
    console.log(`✅ Successfully converted ${proxies.length} proxies`)
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Review .env.proxies file')
    console.log('2. Load proxies in your parser scripts')
    console.log('')
    console.log('📊 Proxy statistics:')
    console.log(`   Total: ${proxies.length}`)
    console.log(`   First proxy: ${proxies[0].host}:${proxies[0].port}`)
    console.log(`   Last proxy: ${proxies[proxies.length - 1].host}:${proxies[proxies.length - 1].port}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
