import { ReactNode } from "react";

export type ChartSeriesPoint = [string, number];

export type MetricCardProps = {
  title: string;
  value: string;
  detail?: string;
  icon: ReactNode;
};