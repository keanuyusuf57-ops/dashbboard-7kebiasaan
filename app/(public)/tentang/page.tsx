'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ActivityGallery from '@/components/public/ActivityGallery'
import { createClient } from '@/lib/supabase/client'
import {
  Info,
  Target,
  Lightbulb,
  Users,
  ClipboardList,
  Gamepad2,
  ArrowRight,
  FolderKanban,
} from 'lucide-react'

type TeamMember = {
  id: string
  nama: string
  peran: string
  kelas_atau_jabatan: string | null
  deskripsi: string | null
  foto_url: string | null
  urutan: number
}

const HABIT_GUIDES_DEFAULT = [
  { slug: 'bangun-pagi', num: 1, tag: 'Disiplin', title: 'Bangun Pagi', shortDesc: 'Memulai hari lebih awal dengan semangat dan kesiapan.' },
  { slug: 'beribadah', num: 2, tag: 'Spiritual', title: 'Beribadah', shortDesc: 'Menjalankan ibadah sesuai agama dan kepercayaan.' },
  { slug: 'berolahraga', num: 3, tag: 'Sehat', title: 'Berolahraga', shortDesc: 'Menjaga kebugaran tubuh melalui aktivitas fisik.' },
  { slug: 'makan-sehat-dan-bergizi', num: 4, tag: 'Sehat', title: 'Makan Sehat dan Bergizi', shortDesc: 'Memilih makanan bergizi untuk mendukung kesehatan.' },
  { slug: 'gemar-belajar', num: 5, tag: 'Cerdas', title: 'Gemar Belajar', shortDesc: 'Menumbuhkan rasa ingin tahu dan kebiasaan belajar.' },
  { slug: 'bermasyarakat', num: 6, tag: 'Peduli', title: 'Bermasyarakat', shortDesc: 'Berinteraksi, bekerja sama, dan peduli terhadap sesama.' },
  { slug: 'tidur-cepat', num: 7, tag: 'Disiplin', title: 'Tidur Cepat', shortDesc: 'Beristirahat cukup agar siap menjalani hari berikutnya.' },
]

const DEFAULT_ABOUT = {
  what: 'Platform Digital 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) SMAN 5 Semarang adalah sistem evaluasi karakter, edukasi pembiasaan harian, dan gamifikasi interaktif berbasis web untuk memantau penerapan tujuh dimensi karakter utama pelajar.',
  purpose:
    'Digunakan oleh siswa SMAN 5 Semarang untuk mengisi survei refleksi harian, mempelajari panduan 7 kebiasaan, mengerjakan kuis XP, dan melihat statistik karakter pribadi. Guru dan admin menggunakannya untuk memantau indeks karakter per kelas.',
  why: 'Dibangun untuk menghadirkan pencatatan dan pembinaan karakter siswa yang modern, transparan, dan mudah diakses dari ponsel maupun laptop.',
}

export default function TentangPage() {
  const supabase = createClient()

  const [aboutWhat, setAboutWhat] = useState(DEFAULT_ABOUT.what)
  const [aboutPurpose, setAboutPurpose] = useState(DEFAULT_ABOUT.purpose)
  const [aboutWhy, setAboutWhy] = useState(DEFAULT_ABOUT.why)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAboutData = useCallback(async () => {
    const [{ data: cfgData }, { data: teamData }] = await Promise.all([
      supabase
        .from('home_config')
        .select('about_what, about_purpose, about_why')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('about_team').select('*').order('urutan', { ascending: true }),
    ])

    if (cfgData) {
      if (cfgData.about_what) setAboutWhat(cfgData.about_what)
      if (cfgData.about_purpose) setAboutPurpose(cfgData.about_purpose)
      if (cfgData.about_why) setAboutWhy(cfgData.about_why)
    }

    if (teamData) {
      setTeamMembers(teamData as TeamMember[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAboutData()

    const channel = supabase
      .channel('realtime-tentang-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_config' },
        () => fetchAboutData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'about_team' },
        () => fetchAboutData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAboutData, supabase])

  return (
    <div className="space-y-6 font-sans text-[#090D16]">
      {/* === HERO BANNER LAMAN TENTANG === */}
      <section className="rounded-[2rem] bg-gradient-to-br from-indigo-950 via-indigo-900 to-sky-800 text-white p-6 sm:p-9 lg:p-10 shadow-xl">
        <div className="max-w-3xl space-y-3.5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
            SMAN 5 Semarang • Pengembang NEXARA
          </p>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Tentang 7 KAIH &amp; NEXARA
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Platform pemantauan karakter 7 Kebiasaan Anak Indonesia Hebat yang dikembangkan oleh tim{' '}
            <strong className="text-amber-300">NEXARA</strong> untuk SMAN 5 Semarang.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <Link
              href="/survey"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-400 text-indigo-950 text-xs sm:text-sm font-black shadow-md"
            >
              <ClipboardList size={16} />
              <span>Isi Survei</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-extrabold"
            >
              <Gamepad2 size={16} />
              <span>Kuis XP</span>
            </Link>
          </div>
        </div>
      </section>

      {/* === 3 KARTU PENJELASAN UTAMA === */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="kaih-glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Info size={20} />
            </span>
            <h2 className="font-heading text-lg font-black text-[#090D16]">
              Tentang Apa Web Ini?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{aboutWhat}</p>
        </div>

        <div className="kaih-glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Target size={20} />
            </span>
            <h2 className="font-heading text-lg font-black text-[#090D16]">
              Digunakan Untuk Apa?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{aboutPurpose}</p>
        </div>

        <div className="kaih-glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lightbulb size={20} />
            </span>
            <h2 className="font-heading text-lg font-black text-[#090D16]">
              Mengapa Web Ini Dibuat?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{aboutWhy}</p>
        </div>
      </section>

      {/* === RINGKASAN 7 PILAR KEBIASAAN === */}
      <section className="kaih-glass-card p-6 sm:p-7 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-900 text-xs font-extrabold uppercase tracking-wider">
          <FolderKanban size={15} />
          <span>7 Kebiasaan Anak Indonesia Hebat</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {HABIT_GUIDES_DEFAULT.map((habit) => (
            <Link
              key={habit.slug}
              href={`/kebiasaan/${habit.slug}`}
              className="p-4 rounded-2xl bg-white/85 hover:bg-white border border-white hover:border-indigo-300 transition-all space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-slate-950 text-white text-[10px] font-black">
                  #{habit.num}
                </span>
                <span className="text-[10px] font-extrabold text-indigo-700">{habit.tag}</span>
              </div>
              <h3 className="font-heading text-sm font-extrabold text-[#090D16] group-hover:text-indigo-700">
                {habit.title}
              </h3>
              <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                {habit.shortDesc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* === GALERI DOKUMENTASI KEGIATAN 7 KAIH SMAN 5 SEMARANG === */}
      <ActivityGallery />

      {/* === TIM PENGEMBANG NEXARA === */}
      <section className="kaih-glass-card p-6 sm:p-7 rounded-3xl space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
          <Users size={22} className="text-indigo-700 shrink-0" />
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
              NEXARA Developer Team
            </p>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-[#090D16]">
              Tim Pengembang NEXARA
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs font-bold text-slate-500 animate-pulse">
            Memuat profil tim...
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="p-5 rounded-2xl bg-white/80 border border-white space-y-1">
            <h3 className="font-heading text-lg font-black text-[#090D16]">
              NEXARA • SMAN 5 Semarang
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Tim pengembang di balik Dashboard Evaluasi Karakter 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) SMAN 5 Semarang.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-5 rounded-3xl bg-white/85 border border-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start gap-3.5">
                  {member.foto_url ? (
                    <img
                      src={member.foto_url}
                      alt={member.nama}
                      className="h-14 w-14 rounded-2xl object-contain bg-transparent shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-indigo-950 text-amber-300 font-black text-base flex items-center justify-center shrink-0">
                      {member.nama.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-extrabold">
                      {member.peran}
                    </span>
                    <h3 className="font-heading text-base font-black text-[#090D16] leading-snug">
                      {member.nama}
                    </h3>
                    {member.kelas_atau_jabatan && (
                      <p className="text-xs font-bold text-slate-600">
                        {member.kelas_atau_jabatan}
                      </p>
                    )}
                  </div>
                </div>

                {member.deskripsi && (
                  <p className="text-xs text-slate-700 leading-relaxed pt-2 border-t border-slate-200/70">
                    {member.deskripsi}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}