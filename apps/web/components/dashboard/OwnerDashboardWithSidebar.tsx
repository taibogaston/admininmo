"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { Contrato } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { OWNER_SECTIONS, OwnerSection, getOwnerSectionsForRole } from "./owner/sections";
import { cn } from "@/lib/utils";
import { UserRole } from "@admin-inmo/shared";
import { OwnerDashboard } from "./OwnerDashboard";
import { TransferenciasPropietarioList } from "./owner/TransferenciasPropietarioList";

interface OwnerDashboardWithSidebarProps {
  contratos: Contrato[];
  propietarioId: string;
  activeSection: OwnerSection;
  userRole: UserRole;
}

export const OwnerDashboardWithSidebar = ({
  contratos,
  propietarioId,
  activeSection,
  userRole,
}: OwnerDashboardWithSidebarProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeSection]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const originalOverflow = document.body.style.overflow;
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
    document.body.style.overflow = originalOverflow;
  }, [mobileNavOpen]);

  const userSections = useMemo(() => getOwnerSectionsForRole(userRole), [userRole]);
  
  const activeSectionConfig = useMemo(
    () => userSections.find((section) => section.id === activeSection) ?? userSections[0],
    [activeSection, userSections]
  );

  const NavigationItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <ul className="space-y-1.5">
      {userSections.map((section) => {
        const isActive = section.id === activeSection;
        const Icon = section.icon;
        return (
          <li key={section.id}>
            <Link
              href={`/dashboard/owner/${section.id}`}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-100 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                onNavigate?.();
              }}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors",
                  isActive
                    ? "border-slate-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                )}
                aria-hidden
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span>{section.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const SidebarContent = ({
    onNavigate,
    hideHeading = false,
  }: {
    onNavigate?: () => void;
    hideHeading?: boolean;
  }) => (
    <div className="flex h-full flex-col px-6 py-8">
      {!hideHeading && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Menu</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Panel de Propietario</h2>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto">
        <NavigationItems onNavigate={onNavigate} />
      </nav>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case "overview":
        return <OwnerDashboard contratos={contratos} propietarioId={propietarioId} />;
      case "contratos":
        return (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Contratos</h2>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Gestiona y visualiza todos tus contratos de alquiler
              </p>
            </div>
            <OwnerDashboard contratos={contratos} propietarioId={propietarioId} />
          </section>
        );
      case "transferencias":
        return (
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Transferencias</h2>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                Revisa y aprueba las transferencias de tus propiedades
              </p>
            </div>
            <TransferenciasPropietarioList propietarioId={propietarioId} userRole={userRole} />
          </section>
        );
      default:
        return <OwnerDashboard contratos={contratos} propietarioId={propietarioId} />;
    }
  };

  return (
    <>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <aside className="relative ml-auto flex h-full w-4/5 max-w-xs flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Menu</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-full p-0"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Cerrar menu de navegacion"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent onNavigate={() => setMobileNavOpen(false)} hideHeading />
            </div>
          </aside>
        </div>
      )}

      <div className="flex w-full flex-col md:flex-row">
        <aside
          className={cn(
            "relative hidden min-h-[calc(100vh-4rem)] w-72 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-lg transition-colors dark:border-slate-800 dark:bg-slate-950 md:flex",
            "md:fixed md:top-16 md:bottom-0 md:left-0 md:shadow-none"
          )}
        >
          <SidebarContent />
        </aside>

        <main className="flex-1 w-full space-y-12 px-4 pb-16 pt-6 md:ml-72 md:px-10 md:pb-20 md:pt-10">
          <div className="mb-6 flex items-center justify-between md:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-500">Seccion actual</p>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{activeSectionConfig.label}</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileNavOpen(true)}
              className="flex items-center gap-2"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </div>

          {renderSectionContent()}
        </main>
      </div>
    </>
  );
};
