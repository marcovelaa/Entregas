const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
async function run() {
  const prisma = new PrismaClient();
  const sql = fs.readFileSync('E:/Entregas2/der.sql', 'utf8');
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  
  // The split by ';' approach might fail if there are semicolons inside strings. 
  // Let's just execute it as a single block if possible, or use Prisma db push instead.
  // Actually, executeRawUnsafe supports multiple statements.
  try {
      await prisma.$executeRawUnsafe(sql);
  } catch(e) {
      console.error(e);
  }
  await prisma.$disconnect();
}
run();
