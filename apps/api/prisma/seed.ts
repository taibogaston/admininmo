import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { UserRole } from "@admin-inmo/shared";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@local.test";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        nombre: "Admin",
        apellido: "Local",
        rol: UserRole.ADMIN,
      },
    });
    console.log("Seeded admin user", adminEmail);
  } else {
    console.log("Admin user already exists", adminEmail);
  }

  const ownerEmail = "dueno@local.test";
  const existingOwner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    const passwordHash = await bcrypt.hash("dueno123", 10);
    await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        nombre: "Juan",
        apellido: "Dueno",
        rol: UserRole.PROPIETARIO,
      },
    });
    console.log("Seeded owner user", ownerEmail);
  } else {
    console.log("Owner user already exists", ownerEmail);
  }

  const tenantEmail = "inquilino@local.test";
  const existingTenant = await prisma.user.findUnique({ where: { email: tenantEmail } });
  if (!existingTenant) {
    const passwordHash = await bcrypt.hash("inquilino123", 10);
    await prisma.user.create({
      data: {
        email: tenantEmail,
        passwordHash,
        nombre: "Maria",
        apellido: "Inquilina",
        rol: UserRole.INQUILINO,
      },
    });
    console.log("Seeded tenant user", tenantEmail);
  } else {
    console.log("Tenant user already exists", tenantEmail);
  }
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
