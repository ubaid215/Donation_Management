import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'warn', 'error']
      : ['error'],
    errorFormat: 'pretty'
  });
};

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Handle Prisma Client connection lifecycle
export const connectPrisma = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database');
  } catch (error) {
    console.error('❌ Prisma connection error:', error);
    throw error;
  }
};

export const disconnectPrisma = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Prisma disconnected from database');
  } catch (error) {
    console.error('❌ Prisma disconnection error:', error);
    throw error;
  }
};

// Handle application shutdown
const shutdownHandler = async () => {
  console.log('Shutting down Prisma...');
  await disconnectPrisma();
  process.exit(0);
};

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);

export default prisma;