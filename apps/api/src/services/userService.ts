import { getPrisma } from "../utils/prisma";
import { UserRole } from "@admin-inmo/shared";

const prisma = getPrisma();

export const listUsers = async (roles?: UserRole[]) => {
  return prisma.user.findMany({
    where: roles && roles.length > 0 ? { rol: { in: roles } } : undefined,
    orderBy: [{ nombre: "asc" }, { apellido: "asc" }],
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
    },
  });
};
