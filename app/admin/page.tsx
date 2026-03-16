import { redirect } from "next/navigation";

import { getCurrentAdminSession } from "@/lib/auth";

export default async function AdminIndexPage() {
  const session = await getCurrentAdminSession();

  redirect(session ? "/admin/orders" : "/admin/login");
}
