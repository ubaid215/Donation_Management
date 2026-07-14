import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await hashPassword('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@donation.org' },
    update: {},
    create: {
      email: 'admin@donation.org',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true
    }
  });

  // Create sample operators
  const operatorPassword = await hashPassword('Operator@123');
  const operators = [
    {
      email: 'operator1@donation.org',
      name: 'Operator One',
      phone: '9876543210'
    },
    {
      email: 'operator2@donation.org',
      name: 'Operator Two',
      phone: '9876543211'
    }
  ];

  for (const op of operators) {
    await prisma.user.upsert({
      where: { email: op.email },
      update: {},
      create: {
        email: op.email,
        passwordHash: operatorPassword,
        name: op.name,
        phone: op.phone,
        role: 'OPERATOR',
        isActive: true
      }
    });
  }

  // Create donation categories
  const categories = [
    'Temple Maintenance',
    'Charity Programs',
    'Educational Support',
    'Medical Assistance',
    'Festival Celebrations',
    'Food Distribution',
    'Infrastructure Development',
    'Emergency Relief'
  ];

  for (const category of categories) {
    await prisma.donationCategory.upsert({
      where: { name: category },
      update: {},
      create: {
        name: category,
        description: `${category} fund`
      }
    });
  }

  // Create sample donations (last 30 days)
  const sampleDonations = [
    {
      donorName: 'John Doe',
      donorPhone: '9876543210',
      amount: 1000.50,
      purpose: 'Temple Maintenance',
      paymentMethod: 'CASH'
    },
    {
      donorName: 'Jane Smith',
      donorPhone: '9876543211',
      amount: 5000.00,
      purpose: 'Charity Programs',
      paymentMethod: 'UPI'
    },
    {
      donorName: 'Robert Johnson',
      donorPhone: '9876543212',
      amount: 2500.75,
      purpose: 'Educational Support',
      paymentMethod: 'BANK_TRANSFER'
    },
    {
      donorName: 'Sarah Williams',
      donorPhone: '9876543213',
      amount: 10000.00,
      purpose: 'Medical Assistance',
      paymentMethod: 'CARD'
    }
  ];

  const allOperators = await prisma.user.findMany({
    where: { role: 'OPERATOR', isActive: true }
  });

  // Create donations for last 30 days
  for (let i = 0; i < 50; i++) {
    const donation = sampleDonations[Math.floor(Math.random() * sampleDonations.length)];
    const operator = allOperators[Math.floor(Math.random() * allOperators.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 12) + 8); // Between 8 AM and 8 PM
    date.setMinutes(Math.floor(Math.random() * 60));

    await prisma.donation.create({
      data: {
        ...donation,
        operatorId: operator.id,
        date
      }
    });
  }

  console.log('Seed completed successfully!');
  console.log(`Admin login: admin@donation.org / Admin@123`);
  console.log(`Operator login: operator1@donation.org / Operator@123`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });