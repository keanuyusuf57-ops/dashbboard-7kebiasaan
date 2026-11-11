import Navbar from '@/components/public/NavBar'
import Footer from '@/components/public/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar Atas Bawaan Kamu */}
      <Navbar />
      
      {/* Konten Utama Bawaan Kamu */}
      <main className="flex-1">{children}</main>
      
      {/* Footer Bawaan Kamu */}
      <Footer />
    </div>
  )
}