import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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
      <div className="relative w-full max-w-md">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <ChangePasswordForm email={user.email} />
      </div>
    </div>
  );
}
