import { TopNav } from "@/components/nav";

export default function ExperimentMonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav title="Experiment Monitoring" />
      <main>{children}</main>
    </>
  );
}
