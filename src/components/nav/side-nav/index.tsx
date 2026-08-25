"use client";

import { ArrowLeftToLine, ArrowRightToLine } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Navigation from "./components/navigation";
import Link from "next/link";

export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={cn(
          "fixed left-0 top-12 z-50 rounded-r-md border border-l-0 border-border bg-sidebar px-2 py-1.5 text-sidebar-foreground shadow-md hover:bg-accent tablet:hidden",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-44" : "translate-x-0",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ArrowLeftToLine size={16} />
        ) : (
          <ArrowRightToLine size={16} />
        )}
      </button>
      <aside
        className={cn(
          "relative flex min-h-screen w-44 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground",
          "tablet:translate-x-0",
          "fixed inset-y-0 left-0 z-40 tablet:static",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          href="/"
          className="flex h-12 items-center justify-center border-b border-border text-lg font-semibold"
        >
          Prompt Studio
        </Link>
        <Navigation />
      </aside>
    </>
  );
}
