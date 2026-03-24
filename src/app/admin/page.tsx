import UserManagementPanel from "@/components/admin/UserManagementPanel";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const STATIC_ADMIN_EMAIL = "admin@iletsbuddy.com";

export default async function AdminPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const email = (session?.user as { email?: string } | undefined)?.email;

  if (!session || role !== "admin" || email !== STATIC_ADMIN_EMAIL) {
    redirect("/");
  }

  return <UserManagementPanel />;
}
