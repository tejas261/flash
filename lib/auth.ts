import { randomBytes } from "node:crypto";
import { addDays, isAfter } from "date-fns";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";

const SESSION_COOKIE = "flash_admin_session";
const SESSION_DAYS = 14;

export async function createAdminSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  await db.adminSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.adminSession.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await db.adminSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          restaurant: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (isAfter(new Date(), session.expiresAt)) {
    await db.adminSession.delete({ where: { token } });
    return null;
  }

  return session;
}

export async function requireAdminSession() {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
