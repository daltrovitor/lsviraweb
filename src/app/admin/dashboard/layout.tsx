export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication check moved to client component to avoid server-side issues
  return <>{children}</>;
}
