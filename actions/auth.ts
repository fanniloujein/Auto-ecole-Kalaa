"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect" };
    }
    // NEXT_REDIRECT is thrown on success — rethrow so the redirect happens
    throw error;
  }
}
