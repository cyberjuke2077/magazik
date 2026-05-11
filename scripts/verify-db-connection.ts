import { prisma } from '../src/lib/prisma'

async function verifyConnection() {
  try {
    console.log('Testing PostgreSQL connection...')
    await prisma.$connect()
    console.log('✅ Successfully connected to PostgreSQL')
    
    const result = await prisma.$queryRaw`SELECT version()`
    console.log('Database version:', result)
    
    await prisma.$disconnect()
    console.log('✅ Connection test completed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error)
    process.exit(1)
  }
}

verifyConnection()
