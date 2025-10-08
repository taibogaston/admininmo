import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";

export default async function HomePage() {
  try {
    await serverApiFetch("/api/auth/me");
    redirect("/dashboard");
  } catch (error) {
    redirect("/login");
  }
}
