import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password.js';

const prisma = new PrismaClient();

async function createKhanqahAdmin() {
  try {
    console.log('\n🔐 Creating Khanqah Admin User\n');
    console.log('================================\n');

    const email = 'khanqahadmin@gmail.com';
    const password = 'Khanqah@2026'; // CHANGE THIS!
    const name = 'Khanqah Administrator';

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('⚠️  User already exists!');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Role: ${existing.role}`);
      console.log(`   Status: ${existing.isActive ? '✅ Active' : '❌ Inactive'}\n`);

      // Reset password and ensure admin
      console.log('🔄 Updating user: Setting to ADMIN role and resetting password...\n');
      
      const passwordHash = await hashPassword(password);
      
      const updated = await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role: 'ADMIN',
          isActive: true,
          name, // Update name too
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: updated.id,
          description: `User ${email} updated to ADMIN with password reset`,
          userRole: 'ADMIN',
          userId: updated.id,
          metadata: {
            updatedVia: 'createKhanqahAdmin-script',
          },
        },
      });

      console.log('✅ User updated successfully!\n');
    } else {
      console.log('🔄 Creating new admin user...\n');
      
      const passwordHash = await hashPassword(password);
      
      const admin = await prisma.user.create({
        data: {
          email,
          name,
          phone: null,
          passwordHash,
          role: 'ADMIN',
          isActive: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: admin.id,
          description: `Admin user ${email} created`,
          userRole: 'ADMIN',
          userId: admin.id,
          metadata: {
            createdVia: 'createKhanqahAdmin-script',
          },
        },
      });

      console.log('✅ Admin user created successfully!\n');
    }

    console.log('================================');
    console.log('LOGIN CREDENTIALS:');
    console.log('================================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Role: ADMIN');
    console.log('Status: ✅ Active');
    console.log('================================\n');
    console.log('⚠️  IMPORTANT:');
    console.log('1. Copy these credentials now!');
    console.log('2. Change password after first login!');
    console.log('3. Keep credentials secure!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nStack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createKhanqahAdmin();