import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin-dashboard";

export default function AdminPage() {
  const isAdmin = cookies().get("salas_admin")?.value === "1";
  if (!isAdmin) {
    redirect("/admin/login");
  }
  return <AdminDashboard />;
}
