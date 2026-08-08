import { TopNav } from "@/components/nav";

export default function PromptDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav title="Prompt Designer" />
      <main>{children}</main>
    </>
  );
}
