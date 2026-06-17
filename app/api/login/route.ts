import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const sessionMaxAge = 30 * 24 * 60 * 60;

function loginRedirect(request: Request, path: string) {
  const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  return NextResponse.redirect(new URL(path, origin));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const callbackUrl = String(form.get("callbackUrl") || "/dashboard");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return loginRedirect(request, "/login?error=invalid");

  const normalizedHash = user.passwordHash.replace(/^\$2y\$/, "$2a$");
  const valid = await bcrypt.compare(password, normalizedHash);
  if (!valid) return loginRedirect(request, "/login?error=invalid");

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return loginRedirect(request, "/login?error=config");

  const token = await encode({
    secret,
    maxAge: sessionMaxAge,
    token: {
      id: String(user.id),
      sub: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role
    }
  });

  const secureCookie = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const response = loginRedirect(request, callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
  response.cookies.set({
    name: secureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: sessionMaxAge
  });

  return response;
}
