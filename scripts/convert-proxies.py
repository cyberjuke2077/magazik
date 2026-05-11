#!/usr/bin/env python3
"""
Convert Webshare Proxies Script

Converts Webshare proxy list from host:port:user:pass format
to .env format for use in parsers.

Usage:
    python3 scripts/convert-proxies.py /path/to/webshare-proxies.txt
"""

import sys
from datetime import datetime

def parse_webshare_proxy(line):
    """Parse proxy from Webshare format (host:port:username:password)"""
    parts = line.strip().split(':')
    
    if len(parts) != 4:
        return None
    
    host, port_str, username, password = parts
    
    try:
        port = int(port_str)
    except ValueError:
        return None
    
    if not host or not username or not password:
        return None
    
    return {
        'host': host,
        'port': port,
        'username': username,
        'password': password
    }

def format_proxy_url(proxy):
    """Format proxy config to URL string"""
    return f"http://{proxy['username']}:{proxy['password']}@{proxy['host']}:{proxy['port']}"

def load_webshare_proxies(content):
    """Load proxies from file content"""
    proxies = []
    for line in content.split('\n'):
        proxy = parse_webshare_proxy(line)
        if proxy:
            proxies.append(proxy)
    return proxies

def main():
    if len(sys.argv) < 2:
        print('Usage: python3 scripts/convert-proxies.py <proxy-file>')
        print('Example: python3 scripts/convert-proxies.py ~/Downloads/webshare-proxies.txt')
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = '.env.proxies'
    
    print(f'📥 Reading proxies from: {input_file}')
    
    try:
        with open(input_file, 'r') as f:
            content = f.read()
        
        proxies = load_webshare_proxies(content)
        
        print(f'✅ Loaded {len(proxies)} proxies')
        
        if len(proxies) == 0:
            print('❌ No valid proxies found in file')
            sys.exit(1)
        
        # Generate .env format
        env_lines = [
            '# Webshare residential proxies',
            f'# Generated: {datetime.now().isoformat()}',
            f'# Total proxies: {len(proxies)}',
            '',
        ]
        
        for index, proxy in enumerate(proxies):
            url = format_proxy_url(proxy)
            env_lines.append(f'PROXY_{index + 1}={url}')
        
        env_content = '\n'.join(env_lines)
        
        print(f'💾 Writing to: {output_file}')
        with open(output_file, 'w') as f:
            f.write(env_content)
        
        print(f'✅ Successfully converted {len(proxies)} proxies')
        print('')
        print('📋 Next steps:')
        print('1. Review .env.proxies file')
        print('2. Load proxies in your parser scripts')
        print('')
        print('📊 Proxy statistics:')
        print(f'   Total: {len(proxies)}')
        print(f'   First proxy: {proxies[0]["host"]}:{proxies[0]["port"]}')
        print(f'   Last proxy: {proxies[-1]["host"]}:{proxies[-1]["port"]}')
        
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    main()
