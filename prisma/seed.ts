import { AdminRole } from '@prisma/client';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { hashValue } from '../src/utils/crypto';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_SUPER_ADMIN_USERNAME ?? 'dean';
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'ChangeMeStrong!';
  const fullName = process.env.SEED_SUPER_ADMIN_NAME ?? 'Dean of Students';

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`Super admin '${username}' already exists.`);
    return;
  }

  const passwordHash = await hashValue(password);

  await prisma.admin.create({
    data: {
      username,
      fullName,
      passwordHash,
      role: AdminRole.SUPER_ADMIN
    }
  });

  console.log(`Created super admin '${username}'.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
