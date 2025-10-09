"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

interface ChangePasswordFormProps {
  email: string;
}

export const ChangePasswordForm = ({ email }: ChangePasswordFormProps) => {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error("La nueva contrasena debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = (await res.json().catch(() => null)) as { message?: string } | null;

      if (!res.ok) {
        const message = data?.message ?? "No se pudo actualizar la contrasena";
        toast.error(message);
        return;
      }

      toast.success("Contrasena actualizada");
      router.replace("/dashboard");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Actualiza tu contrasena</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sesion iniciada como <span className="font-semibold">{email}</span>. Por seguridad debes definir una nueva contrasena.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Contrasena actual</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">Nueva contrasena</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar nueva contrasena</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Actualizando..." : "Guardar contrasena"}
        </Button>
      </form>
    </div>
  );
};
