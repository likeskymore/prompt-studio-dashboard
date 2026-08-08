import { TopNav } from "@/components/nav";

export default function ExperimentConfigLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav title="Experiment Configurator" />
      <main>{children}</main>
    </>
  );
}
