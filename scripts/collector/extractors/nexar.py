"""Nexar API extractor for product data."""

import os
import aiohttp
from typing import Dict, Any, Optional, List
from .base import BaseExtractor, ExtractResult


class NexarExtractor(BaseExtractor):
    """Extract product data from Nexar API (Octopart)."""
    
    TOKEN_URL = "https://identity.nexar.com/connect/token"
    API_URL = "https://api.nexar.com/graphql"
    
    def __init__(self):
        """Initialize Nexar extractor."""
        self.client_id = os.getenv('NEXAR_CLIENT_ID')
        self.client_secret = os.getenv('NEXAR_CLIENT_SECRET')
        self.access_token = None
        
        if not self.client_id or not self.client_secret:
            raise ValueError("NEXAR_CLIENT_ID and NEXAR_CLIENT_SECRET must be set in .env")
    
    async def _get_access_token(self) -> str:
        """Get OAuth2 access token."""
        if self.access_token:
            return self.access_token
        
        async with aiohttp.ClientSession() as session:
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }
            
            async with session.post(self.TOKEN_URL, data=data) as response:
                if response.status != 200:
                    raise Exception(f"Failed to get access token: {response.status}")
                
                result = await response.json()
                self.access_token = result['access_token']
                return self.access_token
    
    def get_url(self, part_number: str, manufacturer: str = "") -> str:
        """Generate Nexar API URL (not used for GraphQL)."""
        return self.API_URL
    
    async def extract_batch(self, products: List[Dict[str, str]]) -> List[ExtractResult]:
        """Extract data for multiple products (up to 3) in one request."""
        if len(products) > 3:
            raise ValueError("Nexar API supports max 3 products per batch")
        
        try:
            token = await self._get_access_token()
            
            # Build GraphQL query for multiple products
            queries = []
            for i, product in enumerate(products):
                mpn = product['part_number']
                manufacturer = product.get('manufacturer', '')
                
                # Escape quotes in strings
                mpn_escaped = mpn.replace('"', '\\"')
                mfr_escaped = manufacturer.replace('"', '\\"') if manufacturer else ''
                
                query_part = f'''
                    q{i}: supSearchMpn(
                        q: "{mpn_escaped}"
                        {f'manufacturer: "{mfr_escaped}"' if mfr_escaped else ''}
                        limit: 1
                    ) {{
                        results {{
                            part {{
                                mpn
                                name
                                shortDescription
                                manufacturer {{
                                    name
                                }}
                                category {{
                                    name
                                }}
                                specs {{
                                    attribute {{
                                        name
                                    }}
                                    displayValue
                                }}
                                bestDatasheet {{
                                    url
                                }}
                                bestImage {{
                                    url
                                }}
                            }}
                        }}
                    }}
                '''
                queries.append(query_part)
            
            query = "query { " + " ".join(queries) + " }"
            
            # Execute GraphQL query
            async with aiohttp.ClientSession() as session:
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
                
                async with session.post(
                    self.API_URL,
                    json={'query': query},
                    headers=headers
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        return [ExtractResult.failure(f"Nexar API error: {response.status} - {error_text}") 
                                for _ in products]
                    
                    result = await response.json()
                    
                    # Check for GraphQL errors
                    if 'errors' in result:
                        error_msg = result['errors'][0].get('message', 'Unknown error')
                        return [ExtractResult.failure(f"GraphQL error: {error_msg}") 
                                for _ in products]
                    
                    # Parse results for each product
                    results = []
                    for i, product in enumerate(products):
                        query_result = result.get('data', {}).get(f'q{i}', {})
                        part_results = query_result.get('results', [])
                        
                        if not part_results:
                            results.append(ExtractResult.failure(f"Product not found on Nexar: {product['part_number']}"))
                            continue
                        
                        part_data = part_results[0].get('part', {})
                        
                        # Extract data
                        data = {
                            'part_number': part_data.get('mpn', product['part_number']),
                            'name': part_data.get('name', ''),
                            'description': part_data.get('shortDescription', ''),
                            'manufacturer': part_data.get('manufacturer', {}).get('name', product.get('manufacturer', '')),
                            'category': part_data.get('category', {}).get('name', ''),
                            'specifications': {},
                            'datasheets': [],
                            'images': []
                        }
                        
                        # Extract specifications
                        specs = part_data.get('specs', [])
                        for spec in specs:
                            attr_name = spec.get('attribute', {}).get('name', '')
                            value = spec.get('displayValue', '')
                            if attr_name and value:
                                data['specifications'][attr_name] = value
                        
                        # Extract datasheet
                        datasheet = part_data.get('bestDatasheet', {})
                        if datasheet and datasheet.get('url'):
                            data['datasheets'].append(datasheet['url'])
                        
                        # Extract image
                        image = part_data.get('bestImage', {})
                        if image and image.get('url'):
                            data['images'].append(image['url'])
                        
                        results.append(ExtractResult.success(data))
                    
                    return results
        
        except Exception as e:
            return [ExtractResult.failure(f"Nexar extraction error: {str(e)}") 
                    for _ in products]
    
    async def extract(self, page, part_number: str, manufacturer: str = "", name: str = "") -> ExtractResult:
        """Extract data for single product (wrapper for batch extraction)."""
        products = [{'part_number': part_number, 'manufacturer': manufacturer}]
        results = await self.extract_batch(products)
        return results[0]
