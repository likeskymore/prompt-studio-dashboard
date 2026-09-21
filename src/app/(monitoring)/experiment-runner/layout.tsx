import { TopNav } from "@/components/nav";

export default function ExperimentRunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav title="Experiment Runner" />
      <main>{children}</main>
    </>
  );
}
