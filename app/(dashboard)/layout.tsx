import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { ToastProvider } from "@/components/toast";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const settings = await prisma.settings.findFirst({ select: { schoolName: true } });
  const schoolName = settings?.schoolName ?? "Auto-École";

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block">
          <Sidebar schoolName={schoolName} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            adminName={session.user.name || session.user.email || "Admin"}
            schoolName={schoolName}
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
