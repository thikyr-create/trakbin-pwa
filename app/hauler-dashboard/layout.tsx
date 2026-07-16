export default function HaulerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full bg-slate-900 overflow-hidden">
      {children}
    </div>
  );
}