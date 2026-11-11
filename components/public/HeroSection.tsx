import { createClient } from '@/lib/supabase/server'
import { connection } from 'next/server'
import Link from 'next/link'

export default async function HeroSection() {
  // Memberitahu Next.js 16 bahwa komponen ini dipanggil per-koneksi request
  await connection()

  const supabase = await createClient()
  const { data: config } = await supabase.from('home_config').select('*').limit(1).maybeSingle()

  return (
    <section className="relative h-[480px] flex items-center justify-center text-white overflow-hidden bg-gray-900">
      {config?.hero_media_type === 'video' ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          src={config.hero_media_url}
        />
      ) : (
        <img
          src={config?.hero_media_url || '/hero-placeholder.jpg'}
          alt="Hero Background"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}

      <div className="relative z-10 text-center max-w-3xl px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight text-white">
          {config?.hero_title || 'Penilaian 7 Kebiasaan Anak Indonesia Hebat'}
        </h1>
        <p className="text-lg sm:text-xl text-gray-200 mb-8 font-medium">
          {config?.hero_subtitle || 'Gerakan Karakter Unggul Siswa-Siswi SMAN 5 Semarang'}
        </p>
        <Link
          href="/survey"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg transition-transform hover:scale-105"
        >
          Isi Survey Sekarang
        </Link>
      </div>
    </section>
  )
}