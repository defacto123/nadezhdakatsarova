import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Require an authenticated admin; redirects otherwise. Use in admin server code. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/admin");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
