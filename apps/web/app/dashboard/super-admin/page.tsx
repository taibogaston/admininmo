import { redirect } from "next/navigation";

export default async function SuperAdminPage() {
  redirect("/dashboard/super-admin/overview");
}
