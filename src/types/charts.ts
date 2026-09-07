  export type ChartSeriesPoint = [string, number];

export interface MetricCardProps {
  title: string;
  value: string;
  detail?: string;
  icon?: React.ReactNode;
  secondaryValues?: {
    label: string;
    value: string;
  }[];
}