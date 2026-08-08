"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigations } from "@/config/site";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="flex grow flex-col gap-y-1 p-2">
      {navigations.map((navigation) => {
        const Icon = navigation.icon;
        return (
          <Link
            key={navigation.name}
            href={navigation.href}
            className={cn(
              "flex items-center rounded-md px-2 py-1.5 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === navigation.href
                ? "bg-accent text-accent-foreground"
                : "bg-transparent",
            )}
          >
            <Icon
              size={16}
              className="mr-2 text-current"
            />
            <span className="text-sm text-current">
              {navigation.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
