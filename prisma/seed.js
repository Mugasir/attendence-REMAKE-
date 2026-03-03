require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient, AdminRole } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'superadmin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
      fullName: 'Super Administrator',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      username: adminUsername,
      passwordHash,
      fullName: 'Super Administrator',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const studentSeed = {
    studentNumber: 'SU2024001',
    fullName: 'Jane Doe',
    program: 'BSc Computer Science',
    intakeYear: 2024,
    phoneNumber: '+260970000001',
    academicEmail: 'jane.doe@students.su.edu',
  };

  await prisma.student.upsert({
    where: { studentNumber: studentSeed.studentNumber },
    update: studentSeed,
    create: studentSeed,
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
