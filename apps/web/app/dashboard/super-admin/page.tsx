import { serverApiFetch } from "@/lib/server-api";
import { InmobiliariaWithCounts } from "@/lib/types";
import { CreateInmobiliariaForm } from "@/components/super-admin/CreateInmobiliariaForm";

export default async function SuperAdminPage() {
  const inmobiliarias = await serverApiFetch<InmobiliariaWithCounts[]>("/api/inmobiliarias");

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
                    Todavia no hay inmobiliarias dadas de alta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
