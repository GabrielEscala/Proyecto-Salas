import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminLogin from "@/components/admin-login";

export default function AdminLoginPage() {
  const isAdmin = cookies().get("salas_admin")?.value === "1";
  if (isAdmin) {
    redirect("/admin");
  }
  return <AdminLogin />;
}
