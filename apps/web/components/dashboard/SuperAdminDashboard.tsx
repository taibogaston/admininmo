"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { InmobiliariaWithCounts, TransferenciaManual } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SUPER_ADMIN_SECTIONS, SuperAdminSection } from "./super-admin/sections";
import { CreateInmobiliariaForm } from "@/components/super-admin/CreateInmobiliariaForm";
import { TransferenciasPendientesList } from "@/components/dashboard/admin/TransferenciasPendientesList";
import { clientApiFetch } from "@/lib/client-api";

interface SuperAdminDashboardProps {
  inmobiliarias: InmobiliariaWithCounts[];
  activeSection: SuperAdminSection;
}

export const SuperAdminDashboard = ({
  inmobiliarias: initialInmobiliarias,
  activeSection,
}: SuperAdminDashboardProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inmobiliarias, setInmobiliarias] = useState<InmobiliariaWithCounts[]>(initialInmobiliarias);
  const [transferencias, setTransferencias] = useState<TransferenciaManual[]>([]);
  const [loading, setLoading] = useState(false);

  const activeSectionConfig = useMemo(
    () => SUPER_ADMIN_SECTIONS.find((section) => section.id === activeSection) ?? SUPER_ADMIN_SECTIONS[0],
    [activeSection]
  );

  // Cargar datos según la sección activa
  useEffect(() => {
    const loadSectionData = async () => {
      setLoading(true);
      try {
        if (activeSection === "transferencias") {
          // Cargar transferencias pendientes para todas las inmobiliarias
          const allTransferencias: TransferenciaManual[] = [];
          for (const inmobiliaria of inmobiliarias) {
            try {
              const transferencias = await clientApiFetch<TransferenciaManual[]>(`/api/pagos/transferencias-pendientes/${inmobiliaria.id}`);
              allTransferencias.push(...transferencias);
            } catch {
              // Ignorar errores para inmobiliarias sin transferencias
            }
          }
          setTransferencias(allTransferencias);
        }
      } catch (error) {
        console.error("Error loading section data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSectionData();
  }, [activeSection, inmobiliarias]);

  const NavigationItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <ul className="space-y-1.5">
      {SUPER_ADMIN_SECTIONS.map((section) => {
        const isActive = section.id === activeSection;
        const Icon = section.icon;
        return (
          <li key={section.id}>
            <Link
              href={`/dashboard/super-admin/${section.id}`}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
              onClick={onNavigate}
            >
              <Icon className="h-5 w-5" />
              <span>{section.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const renderSectionContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Cargando...</p>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-8">
            <CreateInmobiliariaForm />

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inmobiliarias activas</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Resumen de cuentas aprovisionadas y su cantidad de usuarios y contratos.
                </p>
              </div>
              <div className="overflow-x-auto px-4 pb-4">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">Nombre</th>
                      <th scope="col" className="px-4 py-3">Slug</th>
                      <th scope="col" className="px-4 py-3 text-right">Usuarios</th>
                      <th scope="col" className="px-4 py-3 text-right">Contratos</th>
                      <th scope="col" className="px-4 py-3">Creada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    {inmobiliarias.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.nombre}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.slug}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.usuarios}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.contratos}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString("es-AR")}
                        </td>
                      </tr>
                    ))}
                    {inmobiliarias.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400" colSpan={5}>
                          Todavía no hay inmobiliarias dadas de alta.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );

      case "inmobiliarias":
        return (
          <div className="space-y-8">
            <CreateInmobiliariaForm />
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inmobiliarias</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Gestiona todas las inmobiliarias del sistema.
                </p>
              </div>
              <div className="overflow-x-auto px-4 pb-4">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">Nombre</th>
                      <th scope="col" className="px-4 py-3">Slug</th>
                      <th scope="col" className="px-4 py-3 text-right">Usuarios</th>
                      <th scope="col" className="px-4 py-3 text-right">Contratos</th>
                      <th scope="col" className="px-4 py-3">Creada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
                    {inmobiliarias.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.nombre}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.slug}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.usuarios}</td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{item.contratos}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );


      case "transferencias":
        return (
          <div className="space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Transferencias Pendientes</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Verifica y gestiona las transferencias pendientes de todas las inmobiliarias.
                </p>
              </div>
              <div className="p-6">
                <TransferenciasPendientesList inmobiliariaId={inmobiliarias[0]?.id || ""} />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-300">Sección no encontrada</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-slate-950">
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm" style={{ display: mobileNavOpen ? "block" : "none" }} onClick={() => setMobileNavOpen(false)} />
        <div className={cn("fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform dark:bg-slate-900", mobileNavOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Navegación</h2>
            <Button variant="ghost" size="sm" onClick={() => setMobileNavOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-6">
            <NavigationItems onNavigate={() => setMobileNavOpen(false)} />
          </nav>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-72 bg-white shadow-sm lg:block dark:bg-slate-900">
          <div className="sticky top-0 h-screen overflow-y-auto">
            <div className="border-b border-slate-200 px-6 py-6 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Super Admin</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">Panel de control</p>
            </div>
            <nav className="p-6">
              <NavigationItems />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <Button variant="ghost" size="sm" onClick={() => setMobileNavOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{activeSectionConfig.label}</h1>
              <div className="w-9" />
            </div>
          </div>
          <div className="p-6">
            {renderSectionContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
