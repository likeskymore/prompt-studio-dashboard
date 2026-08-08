import { TopNav } from "@/components/nav";

export default function AnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav title="Analysis" />
      <main>{children}</main>
    </>
  );
}
