import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '7 Kebiasaan Anak Indonesia Hebat | SMAN 5 Semarang',
  description:
    'Dashboard evaluasi diri, statistik perkembangan, dan kuis interaktif Gerakan 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) SMAN 5 Semarang.',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      {/* Navigasi atas (<Navbar />) dinonaktifkan agar navigasi terpusat pada Sidebar Kiri di masing-masing halaman */}
      {children}
    </div>
  )
}