"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Forzar refresh completo para asegurar que se limpie el estado
    window.location.href = "/login";
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      Cerrar sesion
    </Button>
  );
};
