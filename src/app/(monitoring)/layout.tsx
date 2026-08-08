import { SideNav } from "@/components/nav";

export default function MonitoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="grow overflow-auto">
        {children}
      </div>
    </div>
  );
}