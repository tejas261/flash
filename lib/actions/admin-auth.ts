"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { clearAdminSession, createAdminSession, getCurrentAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminLoginSchema } from "@/lib/validations";

export type AuthActionState = {
  error?: string;
};

export async function loginAdminAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const values = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!values.success) {
    return { error: values.error.issues[0]?.message ?? "Enter a valid email and password." };
  }

  const user = await db.adminUser.findUnique({
    where: { email: values.data.email.toLowerCase() },
  });

  if (!user) {
    return { error: "Invalid admin credentials." };
  }

  const isValid = await bcrypt.compare(values.data.password, user.passwordHash);

  if (!isValid) {
    return { error: "Invalid admin credentials." };
  }

  await createAdminSession(user.id);
  redirect("/admin/orders");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function redirectAuthenticatedAdmin() {
  const session = await getCurrentAdminSession();

  if (session) {
    redirect("/admin/orders");
  }
}
