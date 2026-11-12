import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: '7 Kebiasaan Anak Indonesia Hebat | SMAN 5 Semarang',
  description:
    'Dashboard evaluasi diri, statistik perkembangan, dan kuis interaktif Gerakan 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) SMAN 5 Semarang.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${jakarta.className} bg-slate-50 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}