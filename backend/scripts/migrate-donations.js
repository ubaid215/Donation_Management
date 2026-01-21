import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateDonationsToCategories() {
  try {
    console.log('Starting migration of donations to categories...');
    
    const donations = await prisma.donation.findMany({
      where: {
        OR: [
          { categoryId: null },
          { categoryId: undefined }
        ]
      }
    });

    console.log(`Found ${donations.length} donations without categories`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const donation of donations) {
      try {
        // Find or create category based on purpose
        let category = await prisma.donationCategory.findFirst({
          where: {
            name: donation.purpose,
            isActive: true
          }
        });

        if (!category) {
          // Create new category
          category = await prisma.donationCategory.create({
            data: {
              name: donation.purpose,
              description: `Category for ${donation.purpose} donations`,
              isActive: true
            }
          });
          console.log(`Created new category: ${category.name}`);
        }

        // Update donation with categoryId
        await prisma.donation.update({
          where: { id: donation.id },
          data: { categoryId: category.id }
        });

        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} donations...`);
        }
      } catch (error) {
        console.error(`Error updating donation ${donation.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Migration completed. Updated: ${updatedCount}, Errors: ${errorCount}`);
    return { updated: updatedCount, errors: errorCount };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateDonationsToCategories();