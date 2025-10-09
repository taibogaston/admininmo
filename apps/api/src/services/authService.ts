import { randomBytes } from "crypto";
import { z } from "zod";
import { UserRole, AuthTokenPayload } from "@admin-inmo/shared";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "../utils/prisma";
import { hashPassword, comparePassword } from "../auth/password";
import { HttpError } from "../utils/errors";

const prisma = getPrisma();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  telefono: z.string().optional(),
  dni: z.string().optional(),
  cuitCuil: z.string().optional(),
  rol: z.nativeEnum(UserRole),
  cbu: z.string().optional(),
  banco: z.string().optional(),
  inmobiliariaId: z.string().optional(),
});

type RegisterInput = z.infer<typeof registerSchema>;
type PrismaUserWithRelations = Prisma.UserGetPayload<{ include: { inmobiliaria: true } }>; 

export const registerUser = async (
  data: unknown,
  options: { allowSelfSignup: boolean; creator?: AuthTokenPayload }
): Promise<{ user: PrismaUserWithRelations; temporaryPassword?: string }> => {
  const parsed: RegisterInput = registerSchema.parse(data);

  const creator = options.creator;

  if (parsed.rol === UserRole.SUPER_ADMIN && creator?.role !== UserRole.SUPER_ADMIN) {
    throw new HttpError(403, "Solo un super administrador puede crear este tipo de usuario");
  }

  if (!options.allowSelfSignup && !creator) {
    throw new HttpError(403, "Autenticacion requerida para crear usuarios");
  }

  if (options.allowSelfSignup && !creator && parsed.rol !== UserRole.INQUILINO) {
    throw new HttpError(403, "El autoservicio solo permite crear inquilinos");
  }

  if (creator && creator.role !== UserRole.SUPER_ADMIN && creator.role !== UserRole.ADMIN) {
    throw new HttpError(403, "No tenes permisos para crear usuarios");
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (exists) {
    throw new HttpError(409, "El email ya esta registrado");
  }

  let targetInmobiliariaId: string | null = parsed.inmobiliariaId ?? null;
  let temporaryPassword: string | undefined;

  if (parsed.rol === UserRole.SUPER_ADMIN) {
    targetInmobiliariaId = null;
  } else if (creator?.role === UserRole.SUPER_ADMIN) {
    if (!targetInmobiliariaId) {
      throw new HttpError(400, "Debes indicar la inmobiliaria del usuario");
    }
    const inmobiliariaExists = await prisma.inmobiliaria.findUnique({ where: { id: targetInmobiliariaId } });
    if (!inmobiliariaExists) {
      throw new HttpError(404, "Inmobiliaria no encontrada");
    }
  } else {
    targetInmobiliariaId = creator?.inmobiliariaId ?? targetInmobiliariaId;
    if (!targetInmobiliariaId) {
      throw new HttpError(400, "No se pudo determinar la inmobiliaria del usuario");
    }
    if (creator?.role === UserRole.ADMIN) {
      if (parsed.rol !== UserRole.INQUILINO && parsed.rol !== UserRole.PROPIETARIO) {
        throw new HttpError(403, "Solo podes crear inquilinos o propietarios");
      }
      if (!parsed.dni || parsed.dni.trim().length === 0) {
        throw new HttpError(400, "El DNI es obligatorio para crear usuarios");
      }
      targetInmobiliariaId = creator.inmobiliariaId;
    }
  }

  let passwordToHash = parsed.password;
  if (!passwordToHash) {
    if (!creator) {
      throw new HttpError(400, "La contrasena es obligatoria");
    }
    temporaryPassword = randomBytes(4).toString("hex");
    passwordToHash = temporaryPassword;
  }

  const passwordHash = await hashPassword(passwordToHash);

  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash,
      nombre: parsed.nombre,
      apellido: parsed.apellido,
      telefono: parsed.telefono,
      dni: parsed.dni,
      cuitCuil: parsed.cuitCuil,
      rol: parsed.rol,
      cbu: parsed.cbu,
      banco: parsed.banco,
      mustChangePassword: Boolean(temporaryPassword),
      inmobiliariaId: targetInmobiliariaId ?? undefined,
    },
    include: { inmobiliaria: true },
  });

  return { user, temporaryPassword };
};


const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const changePassword = async (userId: string, data: unknown) => {
  const parsed = changePasswordSchema.parse(data);

  if (parsed.currentPassword === parsed.newPassword) {
    throw new HttpError(400, "La nueva contrasena debe ser distinta a la actual");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  const matches = await comparePassword(parsed.currentPassword, user.passwordHash);
  if (!matches) {
    throw new HttpError(401, "La contrasena actual no es correcta");
  }

  const passwordHash = await hashPassword(parsed.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
    },
  });
};
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginInput = z.infer<typeof loginSchema>;

export const authenticateUser = async (data: unknown) => {
  const parsed: LoginInput = loginSchema.parse(data);
  const user = await prisma.user.findUnique({ where: { email: parsed.email }, include: { inmobiliaria: true } });
  if (!user) {
    throw new HttpError(401, "Credenciales invalidas");
  }

  const valid = await comparePassword(parsed.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Credenciales invalidas");
  }

  const tokenPayload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.rol as UserRole,
    inmobiliariaId: user.inmobiliariaId ?? null,
  };

  return { user, tokenPayload };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, include: { inmobiliaria: true } });
  if (!user) {
    throw new HttpError(404, "Usuario no encontrado");
  }
  return user;
};



