export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {children}
    </div>
  )
}
const ALLOWED_ADMINS = ['admin@sman5smg.sch.id', 'paknico@sman5smg.sch.id']