"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

export const CreateInmobiliariaForm = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      nombre: String(formData.get("nombre") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      admin: {
        nombre: String(formData.get("adminNombre") ?? "").trim(),
        apellido: String(formData.get("adminApellido") ?? "").trim(),
        email: String(formData.get("adminEmail") ?? "").trim(),
        password: String(formData.get("adminPassword") ?? ""),
        telefono: String(formData.get("adminTelefono") ?? "").trim() || undefined,
      },
    };

    try {
      const res = await fetch("/api/inmobiliarias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "No se pudo crear la inmobiliaria");
      }

      toast.success("Inmobiliaria creada correctamente. Se genero el administrador inicial.");
      form.reset();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Crear nueva inmobiliaria</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Genera un tenant y el primer administrador responsable de esa cuenta.
        </p>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <Label htmlFor="nombre">Nombre comercial</Label>
          <Input id="nombre" name="nombre" placeholder="Inmobiliaria Central" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" placeholder="inmobiliaria-central" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="adminNombre">Nombre admin</Label>
          <Input id="adminNombre" name="adminNombre" placeholder="Nombre" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="adminApellido">Apellido admin</Label>
          <Input id="adminApellido" name="adminApellido" placeholder="Apellido" required />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="adminEmail">Email administrador</Label>
          <Input id="adminEmail" name="adminEmail" type="email" placeholder="admin@inmobiliaria.com" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="adminPassword">Contrasena temporal</Label>
          <Input id="adminPassword" name="adminPassword" type="password" minLength={8} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="adminTelefono">Telefono (opcional)</Label>
          <Input id="adminTelefono" name="adminTelefono" type="tel" placeholder="+54..." />
        </div>
        <div className="md:col-span-2 flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full md:w-auto" disabled={submitting}>
            {submitting ? "Creando..." : "Crear inmobiliaria"}
          </Button>
        </div>
      </form>
    </div>
  );
};
