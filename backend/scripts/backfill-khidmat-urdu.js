// ============================================================
// scripts/backfill-khidmat-urdu.js
// Backfill Urdu names for existing Khidmat records
// ============================================================

import prisma from '../src/config/prisma.js';
import { translateToUrdu } from '../src/utils/translate.js';

async function backfillKhidmatUrduNames() {
  console.log('🔄 Starting backfill of Urdu names for Khidmat records...');
  
  try {
    // Get all records without Urdu names
    const records = await prisma.khidmatRecord.findMany({
      where: {
        nameUrdu: null
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`📊 Found ${records.length} records without Urdu names`);

    let updated = 0;
    let failed = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        // Skip if name is empty or just whitespace
        if (!record.name || record.name.trim() === '') {
          console.log(`⏭️  Skipping record ${record.id}: Empty name`);
          skipped++;
          continue;
        }

        // Translate name to Urdu
        const nameUrdu = await translateToUrdu(record.name);
        
        if (nameUrdu && nameUrdu !== record.name) {
          await prisma.khidmatRecord.update({
            where: { id: record.id },
            data: { nameUrdu }
          });
          updated++;
          console.log(`✅ Updated: "${record.name}" → "${nameUrdu}"`);
        } else {
          console.log(`⏭️  Skipped: "${record.name}" (translation same as original or failed)`);
          skipped++;
        }
      } catch (error) {
        failed++;
        console.error(`❌ Failed for "${record.name}":`, error.message);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  📊 Total processed: ${records.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
backfillKhidmatUrduNames()
  .then(() => console.log('✅ Migration completed successfully'))
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });