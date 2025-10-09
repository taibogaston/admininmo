import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { UserRole } from "@admin-inmo/shared";

const prisma = new PrismaClient();

async function ensureSuperAdmin() {
  const email = "root@rentapp.test";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Super admin already exists", email);
    return;
  }

  const passwordHash = await bcrypt.hash("root1234", 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      nombre: "Root",
      apellido: "Admin",
      rol: UserRole.SUPER_ADMIN,
    },
  });
  console.log("Seeded super admin user", email);
}

async function ensureDemoInmobiliaria() {
  const inmobiliaria = await prisma.inmobiliaria.upsert({
    where: { slug: "demo-inmobiliaria" },
    create: {
      nombre: "Demo Inmobiliaria",
      slug: "demo-inmobiliaria",
    },
    update: {},
  });

  const adminEmail = "admin@demo.test";
  const adminExisting = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminExisting) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        nombre: "Admin",
        apellido: "Demo",
        rol: UserRole.ADMIN,
        inmobiliariaId: inmobiliaria.id,
      },
    });
    console.log("Seeded demo admin", adminEmail);
  }

  const ownerEmail = "dueno@demo.test";
  const ownerExisting = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!ownerExisting) {
    const passwordHash = await bcrypt.hash("dueno123", 10);
    await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        nombre: "Juan",
        apellido: "Dueno",
        rol: UserRole.PROPIETARIO,
        inmobiliariaId: inmobiliaria.id,
      },
    });
    console.log("Seeded demo owner", ownerEmail);
  }

  const tenantEmail = "inquilino@demo.test";
  const tenantExisting = await prisma.user.findUnique({ where: { email: tenantEmail } });
  if (!tenantExisting) {
    const passwordHash = await bcrypt.hash("inquilino123", 10);
    await prisma.user.create({
      data: {
        email: tenantEmail,
        passwordHash,
        nombre: "Maria",
        apellido: "Inquilina",
        rol: UserRole.INQUILINO,
        inmobiliariaId: inmobiliaria.id,
      },
    });
    console.log("Seeded demo tenant", tenantEmail);
  }
}

async function main() {
  await ensureSuperAdmin();
  await ensureDemoInmobiliaria();
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
