"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Settings,
  Tag,
  BarChart3,
  User,
  Variable,
} from "lucide-react";
import { isAdmin, isSuperAdmin } from "@/lib/permissions";

const navigation = [
  {
    name: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    roles: ["COMMON", "ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Equipamentos",
    href: "/app/equipments",
    icon: Package,
    roles: ["COMMON", "ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Cautelas",
    href: "/app/loans",
    icon: FileText,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Categorias",
    href: "/app/categories",
    icon: Tag,
    roles: ["ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Alterações",
    href: "/app/alterations",
    icon: Variable,
    roles: ["COMMON", "ADMIN", "SUPER_ADMIN"],
  },
  {
    name: "Clientes",
    href: "/app/customers",
    icon: Users,
    roles: ["ADMIN", "SUPER_ADMIN", "COMMON"],
  },
  {
    name: "Usuários",
    href: "/admin/users",
    icon: User,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "Relatórios",
    href: "/admin/reports",
    icon: BarChart3,
    roles: ["SUPER_ADMIN"],
  },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;

  const userRole = session.user.role;

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center border-b px-4">
        <h1 className="text-xl font-semibold">Sistema de Cautela</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center">
          <div className="ml-3">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">{session.user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
