import { ChartColumn, type LucideIcon, Monitor, Play } from "lucide-react";

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
  {
    icon: Play,
    name: "Experiment Runner",
    href: "/experiment-runner",
  },
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
