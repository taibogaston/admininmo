"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const registerSchema = z.object({
  nombre: z.string().min(1, "Requerido"),
  apellido: z.string().min(1, "Requerido"),
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nombre: "", apellido: "", email: "", password: "" },
  });
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: RegisterValues) => {
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, rol: "INQUILINO" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "No se pudo registrar");
      return;
    }
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Crear cuenta demo</h1>
          <p className="text-sm text-slate-600">Registrate como inquilino para probar la app.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register("nombre")} />
            {errors.nombre && <p className="text-sm text-rose-600">{errors.nombre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido</Label>
            <Input id="apellido" {...register("apellido")} />
            {errors.apellido && <p className="text-sm text-rose-600">{errors.apellido.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-600">
          ¿Ya tenés cuenta? <a href="/login" className="text-primary hover:underline">Ingresá</a>
        </p>
      </div>
    </div>
  );
}
