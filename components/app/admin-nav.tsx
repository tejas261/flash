import Link from "next/link";
import { LayoutGrid, ListOrdered, LogOut, ScreenShare, UtensilsCrossed } from "lucide-react";

import { logoutAdminAction } from "@/lib/actions/admin-auth";

import { Button } from "@/components/ui/button";

const items = [
  { href: "/admin/orders", label: "Orders", icon: ListOrdered },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/display", label: "Display", icon: ScreenShare },
];

type AdminNavProps = {
  restaurantName: string;
  userName: string;
};

export function AdminNav({ restaurantName, userName }: AdminNavProps) {
  return (
    <header className="surface sticky top-4 z-30 mb-8 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LayoutGrid className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin Console</p>
            <h1 className="font-heading text-xl font-semibold">{restaurantName}</h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <nav className="flex flex-wrap gap-2">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <Button asChild key={item.href} variant="secondary" size="sm">
                  <Link href={item.href}>
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <form action={logoutAdminAction} className="flex items-center gap-3">
            <p className="hidden text-sm text-muted-foreground md:block">{userName}</p>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="size-4" />
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
