import { getPrisma } from "../utils/prisma";
import { UserRole, AuthTokenPayload } from "@admin-inmo/shared";
import { HttpError } from "../utils/errors";

const prisma = getPrisma();

export const listUsers = async (roles: UserRole[] | undefined, actor: AuthTokenPayload, inmobiliariaId?: string) => {
  if (actor.role === UserRole.SUPER_ADMIN) {
    const where: Record<string, unknown> = {};
    if (roles && roles.length > 0) {
      where.rol = { in: roles };
    }
    if (inmobiliariaId) {
      where.inmobiliariaId = inmobiliariaId;
    }
    return prisma.user.findMany({
      where: Object.keys(where).length > 0 ? (where as any) : undefined,
      orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        inmobiliariaId: true,
      },
    });
  }

  if (actor.role !== UserRole.ADMIN || !actor.inmobiliariaId) {
    throw new HttpError(403, "No tenés permisos para listar usuarios");
  }

  return prisma.user.findMany({
    where: {
      inmobiliariaId: actor.inmobiliariaId,
      ...(roles && roles.length > 0 ? { rol: { in: roles } } : {}),
    },
    orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
      inmobiliariaId: true,
    },
  });
};
