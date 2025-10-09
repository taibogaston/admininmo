import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { User } from "@/lib/types";

export default async function ChangePasswordPage() {
  let user: User;
  try {
    user = await serverApiFetch<User>("/api/auth/me");
  } catch {
    redirect("/login");
  }

  if (!user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <ChangePasswordForm email={user.email} />
    </div>
  );
}
