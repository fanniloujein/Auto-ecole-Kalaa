export { auth as middleware } from "@/lib/auth";

export const config = {
  // Protège tout sauf /login, /fiche/[token] (fiche publique partagée avec le client),
  // les assets statiques et les routes API d'auth
  matcher: ["/((?!login|fiche|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
