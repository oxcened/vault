import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { type PropsWithChildren } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import { MobileBottomNav } from "~/components/mobile-bottom-nav";
import { MobileUserMenu } from "~/components/mobile-user-menu";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { auth } from "~/server/auth";

export type DashboardLayoutProps = PropsWithChildren;

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const session = await auth();

  if (!session) {
    return redirect("/");
  }

  return (
    <SessionProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="pb-20 md:pb-0">{children}</SidebarInset>
        <MobileUserMenu />
        <MobileBottomNav />
      </SidebarProvider>
    </SessionProvider>
  );
}
