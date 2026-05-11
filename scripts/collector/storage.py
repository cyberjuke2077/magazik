"""
PostgreSQL storage module using Prisma ORM.
Saves extracted product data to the main database.
"""

import asyncio
from typing import Dict, Any, Optional, List
from prisma import Prisma
from prisma.models import Product, Manufacturer, Category, ProductImage, Specification, Datasheet
import logging

logger = logging.getLogger(__name__)


class ProductStorage:
    """Handles saving product data to PostgreSQL via Prisma."""
    
    def __init__(self):
        self.db: Optional[Prisma] = None
        self._default_category_id: Optional[str] = None
    
    async def connect(self):
        """Connect to PostgreSQL database."""
        self.db = Prisma()
        await self.db.connect()
        logger.info("Connected to PostgreSQL")
        
        # Get or create default category for uncategorized products
        self._default_category_id = await self._ensure_default_category()
    
    async def disconnect(self):
        """Disconnect from PostgreSQL database."""
        if self.db:
            await self.db.disconnect()
            logger.info("Disconnected from PostgreSQL")
    
    async def _ensure_default_category(self) -> str:
        """Ensure default category exists, create if not."""
        category = await self.db.category.find_first(
            where={'slug': 'uncategorized'}
        )
        
        if not category:
            category = await self.db.category.create(
                data={
                    'slug': 'uncategorized',
                    'name': 'Без категории',
                    'description': 'Товары без категории'
                }
            )
            logger.info(f"Created default category: {category.id}")
        
        return category.id
    
    async def _get_or_create_manufacturer(self, name: str) -> str:
        """Get existing manufacturer or create new one."""
        # Normalize manufacturer name
        name = name.strip()
        slug = name.lower().replace(' ', '-').replace('/', '-')
        
        manufacturer = await self.db.manufacturer.find_first(
            where={'slug': slug}
        )
        
        if not manufacturer:
            manufacturer = await self.db.manufacturer.create(
                data={
                    'name': name,
                    'slug': slug
                }
            )
            logger.info(f"Created manufacturer: {name} ({manufacturer.id})")
        
        return manufacturer.id
    
    async def save_product(
        self,
        part_number: str,
        manufacturer_name: str,
        data: Dict[str, Any]
    ) -> Optional[str]:
        """
        Save product data to PostgreSQL.
        
        Args:
            part_number: Product part number
            manufacturer_name: Manufacturer name
            data: Extracted product data from extractor
        
        Returns:
            Product ID if saved successfully, None otherwise
        """
        try:
            # Get or create manufacturer
            manufacturer_id = await self._get_or_create_manufacturer(manufacturer_name)
            
            # Generate slug from part number
            slug = part_number.lower().replace('/', '-').replace(' ', '-')
            
            # Check if product already exists
            existing = await self.db.product.find_first(
                where={
                    'partNumber': part_number,
                    'manufacturerId': manufacturer_id
                }
            )
            
            if existing:
                logger.info(f"Product {part_number} already exists, updating...")
                product = await self._update_product(existing.id, data)
            else:
                logger.info(f"Creating new product {part_number}...")
                product = await self._create_product(
                    slug=slug,
                    part_number=part_number,
                    manufacturer_id=manufacturer_id,
                    data=data
                )
            
            return product.id if product else None
            
        except Exception as e:
            logger.error(f"Failed to save product {part_number}: {e}")
            return None
    
    async def _create_product(
        self,
        slug: str,
        part_number: str,
        manufacturer_id: str,
        data: Dict[str, Any]
    ) -> Optional[Product]:
        """Create new product with all related data."""
        try:
            # Create product
            product = await self.db.product.create(
                data={
                    'slug': slug,
                    'name': data.get('name', part_number),
                    'partNumber': part_number,
                    'description': data.get('description'),
                    'weight': float(data['weight']) if data.get('weight') else None,
                    'categoryId': self._default_category_id,
                    'manufacturerId': manufacturer_id,
                    'inStock': False,
                    'stockCount': 0
                }
            )
            
            # Create related data
            await self._create_images(product.id, data.get('images', []))
            await self._create_specifications(product.id, data.get('specifications', {}))
            await self._create_datasheets(product.id, data.get('datasheets', []))
            
            logger.info(f"Created product {part_number} ({product.id})")
            return product
            
        except Exception as e:
            logger.error(f"Failed to create product {part_number}: {e}")
            return None
    
    async def _update_product(
        self,
        product_id: str,
        data: Dict[str, Any]
    ) -> Optional[Product]:
        """Update existing product with new data."""
        try:
            # Update product
            product = await self.db.product.update(
                where={'id': product_id},
                data={
                    'name': data.get('name'),
                    'description': data.get('description'),
                    'weight': float(data['weight']) if data.get('weight') else None
                }
            )
            
            # Delete old related data
            await self.db.productimage.delete_many(where={'productId': product_id})
            await self.db.specification.delete_many(where={'productId': product_id})
            await self.db.datasheet.delete_many(where={'productId': product_id})
            
            # Create new related data
            await self._create_images(product_id, data.get('images', []))
            await self._create_specifications(product_id, data.get('specifications', {}))
            await self._create_datasheets(product_id, data.get('datasheets', []))
            
            logger.info(f"Updated product {product_id}")
            return product
            
        except Exception as e:
            logger.error(f"Failed to update product {product_id}: {e}")
            return None
    
    async def _create_images(self, product_id: str, images: List[str]):
        """Create product images."""
        for i, image_url in enumerate(images):
            if image_url:
                await self.db.productimage.create(
                    data={
                        'productId': product_id,
                        'imageUrl': image_url,
                        'order': i
                    }
                )
    
    async def _create_specifications(self, product_id: str, specs: Dict[str, str]):
        """Create product specifications."""
        for i, (key, value) in enumerate(specs.items()):
            if key and value:
                await self.db.specification.create(
                    data={
                        'productId': product_id,
                        'key': key,
                        'value': value,
                        'order': i
                    }
                )
    
    async def _create_datasheets(self, product_id: str, datasheets: List[str]):
        """Create product datasheets."""
        for url in datasheets:
            if url:
                await self.db.datasheet.create(
                    data={
                        'productId': product_id,
                        'title': 'Datasheet',
                        'url': url
                    }
                )
