"""
PostgreSQL storage module using psycopg2.
Saves extracted product data to the main database.
"""

import os
import psycopg2
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class ProductStorage:
    """Handles saving product data to PostgreSQL via psycopg2."""
    
    def __init__(self):
        self.conn = None
        self._default_category_id: Optional[str] = None
    
    async def connect(self):
        """Connect to PostgreSQL database."""
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:electromagaz_dev_2026@localhost:5432/electromagaz')
        self.conn = psycopg2.connect(database_url)
        logger.info("Connected to PostgreSQL")
        
        # Get or create default category for uncategorized products
        self._default_category_id = await self._ensure_default_category()
    
    async def disconnect(self):
        """Disconnect from PostgreSQL database."""
        if self.conn:
            self.conn.close()
            logger.info("Disconnected from PostgreSQL")
    
    async def _ensure_default_category(self) -> str:
        """Ensure default category exists, create if not."""
        cursor = self.conn.cursor()
        
        # Check if category exists
        cursor.execute(
            "SELECT id FROM \"Category\" WHERE slug = %s",
            ('uncategorized',)
        )
        result = cursor.fetchone()
        
        if result:
            category_id = result[0]
        else:
            # Create default category
            cursor.execute(
                """
                INSERT INTO \"Category\" (id, slug, name, description, \"createdAt\", \"updatedAt\")
                VALUES (gen_random_uuid()::text, %s, %s, %s, NOW(), NOW())
                RETURNING id
                """,
                ('uncategorized', 'Без категории', 'Товары без категории')
            )
            category_id = cursor.fetchone()[0]
            self.conn.commit()
            logger.info(f"Created default category: {category_id}")
        
        cursor.close()
        return category_id
    
    async def _get_or_create_manufacturer(self, name: str) -> str:
        """Get existing manufacturer or create new one."""
        # Normalize manufacturer name
        name = name.strip()
        slug = name.lower().replace(' ', '-').replace('/', '-').replace('\\', '-')
        
        cursor = self.conn.cursor()
        
        # Check if manufacturer exists
        cursor.execute(
            "SELECT id FROM \"Manufacturer\" WHERE slug = %s",
            (slug,)
        )
        result = cursor.fetchone()
        
        if result:
            manufacturer_id = result[0]
        else:
            # Create manufacturer
            cursor.execute(
                """
                INSERT INTO \"Manufacturer\" (id, name, slug, \"createdAt\", \"updatedAt\")
                VALUES (gen_random_uuid()::text, %s, %s, NOW(), NOW())
                RETURNING id
                """,
                (name, slug)
            )
            manufacturer_id = cursor.fetchone()[0]
            self.conn.commit()
            logger.info(f"Created manufacturer: {name} ({manufacturer_id})")
        
        cursor.close()
        return manufacturer_id
    
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
            slug = part_number.lower().replace('/', '-').replace(' ', '-').replace('\\', '-')
            
            cursor = self.conn.cursor()
            
            # Check if product already exists
            cursor.execute(
                """
                SELECT id FROM \"Product\" 
                WHERE \"partNumber\" = %s AND \"manufacturerId\" = %s
                """,
                (part_number, manufacturer_id)
            )
            existing = cursor.fetchone()
            
            if existing:
                logger.info(f"Product {part_number} already exists, updating...")
                product_id = existing[0]
                await self._update_product(product_id, data)
            else:
                logger.info(f"Creating new product {part_number}...")
                product_id = await self._create_product(
                    slug=slug,
                    part_number=part_number,
                    manufacturer_id=manufacturer_id,
                    data=data
                )
            
            cursor.close()
            return product_id
            
        except Exception as e:
            logger.error(f"Failed to save product {part_number}: {e}")
            if self.conn:
                self.conn.rollback()
            return None
    
    async def _create_product(
        self,
        slug: str,
        part_number: str,
        manufacturer_id: str,
        data: Dict[str, Any]
    ) -> Optional[str]:
        """Create new product with all related data."""
        try:
            cursor = self.conn.cursor()
            
            # Create product
            cursor.execute(
                """
                INSERT INTO \"Product\" (
                    id, slug, name, \"partNumber\", description, weight,
                    \"categoryId\", \"manufacturerId\", \"inStock\", \"stockCount\",
                    \"createdAt\", \"updatedAt\"
                )
                VALUES (
                    gen_random_uuid()::text, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    NOW(), NOW()
                )
                RETURNING id
                """,
                (
                    slug,
                    data.get('name', part_number),
                    part_number,
                    data.get('description'),
                    float(data['weight']) if data.get('weight') else None,
                    self._default_category_id,
                    manufacturer_id,
                    False,
                    0
                )
            )
            product_id = cursor.fetchone()[0]
            
            # Create related data
            await self._create_images(cursor, product_id, data.get('images', []))
            await self._create_specifications(cursor, product_id, data.get('specifications', {}))
            await self._create_datasheets(cursor, product_id, data.get('datasheets', []))
            
            self.conn.commit()
            cursor.close()
            
            logger.info(f"Created product {part_number} ({product_id})")
            return product_id
            
        except Exception as e:
            logger.error(f"Failed to create product {part_number}: {e}")
            if self.conn:
                self.conn.rollback()
            return None
    
    async def _update_product(
        self,
        product_id: str,
        data: Dict[str, Any]
    ) -> Optional[str]:
        """Update existing product with new data."""
        try:
            cursor = self.conn.cursor()
            
            # Update product
            cursor.execute(
                """
                UPDATE \"Product\"
                SET name = %s, description = %s, weight = %s, \"updatedAt\" = NOW()
                WHERE id = %s
                """,
                (
                    data.get('name'),
                    data.get('description'),
                    float(data['weight']) if data.get('weight') else None,
                    product_id
                )
            )
            
            # Delete old related data
            cursor.execute("DELETE FROM \"ProductImage\" WHERE \"productId\" = %s", (product_id,))
            cursor.execute("DELETE FROM \"Specification\" WHERE \"productId\" = %s", (product_id,))
            cursor.execute("DELETE FROM \"Datasheet\" WHERE \"productId\" = %s", (product_id,))
            
            # Create new related data
            await self._create_images(cursor, product_id, data.get('images', []))
            await self._create_specifications(cursor, product_id, data.get('specifications', {}))
            await self._create_datasheets(cursor, product_id, data.get('datasheets', []))
            
            self.conn.commit()
            cursor.close()
            
            logger.info(f"Updated product {product_id}")
            return product_id
            
        except Exception as e:
            logger.error(f"Failed to update product {product_id}: {e}")
            if self.conn:
                self.conn.rollback()
            return None
    
    async def _create_images(self, cursor, product_id: str, images: List[str]):
        """Create product images."""
        for i, image_url in enumerate(images):
            if image_url:
                cursor.execute(
                    """
                    INSERT INTO \"ProductImage\" (id, \"productId\", \"imageUrl\", \"order\", \"createdAt\")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, NOW())
                    """,
                    (product_id, image_url, i)
                )
    
    async def _create_specifications(self, cursor, product_id: str, specs: Dict[str, str]):
        """Create product specifications."""
        for i, (key, value) in enumerate(specs.items()):
            if key and value:
                cursor.execute(
                    """
                    INSERT INTO \"Specification\" (id, \"productId\", key, value, \"order\", \"createdAt\")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, %s, NOW())
                    """,
                    (product_id, key, value, i)
                )
    
    async def _create_datasheets(self, cursor, product_id: str, datasheets: List[str]):
        """Create product datasheets."""
        for url in datasheets:
            if url:
                cursor.execute(
                    """
                    INSERT INTO \"Datasheet\" (id, \"productId\", title, url, \"createdAt\")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, NOW())
                    """,
                    (product_id, 'Datasheet', url)
                )
