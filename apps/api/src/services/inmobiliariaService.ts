import { z } from "zod";
import { getPrisma } from "../utils/prisma";
import { HttpError } from "../utils/errors";
import { registerUser } from "./authService";
import { AuthTokenPayload, UserRole } from "@admin-inmo/shared";

const prisma = getPrisma();

const createInmobiliariaSchema = z.object({
  nombre: z.string().min(2),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
  admin: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    telefono: z.string().optional(),
  }),
});

type CreateInmobiliariaInput = z.infer<typeof createInmobiliariaSchema>;

export const createInmobiliaria = async (data: unknown, actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Solo un super administrador puede crear inmobiliarias");
  }

  const parsed: CreateInmobiliariaInput = createInmobiliariaSchema.parse(data);

  const slugExists = await prisma.inmobiliaria.findUnique({ where: { slug: parsed.slug } });
  if (slugExists) {
    throw new HttpError(409, "El slug ya está en uso");
  }

  const inmobiliaria = await prisma.inmobiliaria.create({
    data: {
      nombre: parsed.nombre,
      slug: parsed.slug,
    },
  });

  const { user: adminUser } = await registerUser(
    {
      ...parsed.admin,
      rol: UserRole.ADMIN,
      inmobiliariaId: inmobiliaria.id,
    },
    { allowSelfSignup: false, creator: actor }
  );

  return { inmobiliaria, admin: adminUser };
};

export const listInmobiliarias = async (actor: AuthTokenPayload) => {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Solo un super administrador puede listar inmobiliarias");
  }

  return prisma.inmobiliaria.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          usuarios: true,
          contratos: true,
        },
      },
    },
  });
};
