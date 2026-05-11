/**
 * Convert Webshare Proxies Script
 * 
 * Converts Webshare proxy list from host:port:user:pass format
 * to .env format for use in parsers.
 * 
 * Usage:
 *   tsx scripts/convert-proxies.ts /path/to/webshare-proxies.txt
 */

import { readFileSync, writeFileSync } from 'fs'
import { loadWebshareProxies, formatProxyUrl } from '../src/lib/proxy/index'

function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error('Usage: tsx scripts/convert-proxies.ts <proxy-file>')
    console.error('Example: tsx scripts/convert-proxies.ts ~/Downloads/webshare-proxies.txt')
    process.exit(1)
  }
  
  const inputFile = args[0]
  const outputFile = '.env.proxies'
  
  console.log(`📥 Reading proxies from: ${inputFile}`)
  
  try {
    const content = readFileSync(inputFile, 'utf-8')
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
    writeFileSync(outputFile, envContent, 'utf-8')
    
    console.log(`✅ Successfully converted ${proxies.length} proxies`)
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Review .env.proxies file')
    console.log('2. Run parser with proxies: tsx scripts/parse-with-proxies.ts')
    console.log('')
    console.log('📊 Proxy statistics:')
    console.log(`   Total: ${proxies.length}`)
    console.log(`   First proxy: ${proxies[0].host}:${proxies[0].port}`)
    console.log(`   Last proxy: ${proxies[proxies.length - 1].host}:${proxies[proxies.length - 1].port}`)
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()
