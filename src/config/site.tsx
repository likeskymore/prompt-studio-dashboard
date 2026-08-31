import { ChartColumn, type LucideIcon, MessagesSquare, Monitor } from "lucide-react";

export type SiteConfig = typeof siteConfig;
export type Navigation = {
  icon: LucideIcon;
  name: string;
  href: string;
};

export const siteConfig = {
  title: "PromptStudio",
  description: "Prompt Engineering application",
};

export const navigations: Navigation[] = [
  // {
  //   icon: MessagesSquare,
  //   name: "Experiment Configurator",
  //   href: "/experiment-config",
  // },
  {
    icon: Monitor,
    name: "Experiment Monitoring",
    href: "/experiment-monitor",
  },
  {
    icon: ChartColumn,
    name: "Analysis",
    href: "/analysis",
  },
];
