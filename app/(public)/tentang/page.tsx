'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Sparkles, CheckCircle2, Users } from 'lucide-react'

const SEVEN_HABITS = [
  {
    number: '01',
    title: 'Bangun Pagi',
    desc: 'Melatih kedisiplinan waktu dan kesiapan fisik serta mental sebelum memulai aktivitas belajar di sekolah.',
  },
  {
    number: '02',
    title: 'Beribadah',
    desc: 'Memperkuat nilai spiritual, ketakwaan, dan akhlak mulia sesuai agama serta kepercayaan masing-masing.',
  },
  {
    number: '03',
    title: 'Berolahraga',
    desc: 'Menjaga kebugaran jasmani agar tubuh tetap sehat, aktif, dan berenergi sepanjang hari.',
  },
  {
    number: '04',
    title: 'Makan Sehat & Bergizi',
    desc: 'Membiasakan pola konsumsi bergizi seimbang guna mendukung konsentrasi belajar dan pertumbuhan.',
  },
  {
    number: '05',
    title: 'Gemar Membaca',
    desc: 'Menumbuhkan budaya literasi, rasa ingin tahu, dan wawasan luas melalui kebiasaan membaca rutin.',
  },
  {
    number: '06',
    title: 'Bermasyarakat & Membantu Orang Tua',
    desc: 'Membangun kepedulian sosial, empati, dan tanggung jawab di lingkungan keluarga maupun masyarakat.',
  },
  {
    number: '07',
    title: 'Istirahat Cukup',
    desc: 'Mengatur pola tidur malam yang teratur dan bijak menggunakan gawai agar tubuh pulih optimal.',
  },
]

export default function TentangPage() {
  const supabase = createClient()
  const [teamMembers, setTeamMembers] = useState<any[]>([])

  useEffect(() => {
    async function loadTeam() {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true })
      if (data) setTeamMembers(data)
    }
    loadTeam()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Tombol Balik ke Beranda di Bagian Atas */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Beranda</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold">
            <Sparkles size={13} />
            <span>SMAN 5 SEMARANG</span>
          </span>
        </div>

        {/* Hero Tentang 7 KAIH */}
        <div className="bg-gradient-to-br from-[#2e1065] via-[#3b0764] to-[#0f172a] text-white p-8 sm:p-10 rounded-3xl shadow-lg space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Tentang Gerakan 7 Kebiasaan Anak Indonesia Hebat
          </h1>
          <p className="text-sm sm:text-base text-indigo-200 max-w-3xl leading-relaxed">
            Program penguatan karakter siswa SMAN 5 Semarang yang selaras dengan gerakan nasional
            Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) untuk membentuk generasi
            yang sehat, cerdas, berkarakter, dan berdaya saing.
          </p>
        </div>

        {/* Penjelasan 7 Kebiasaan */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={22} className="text-indigo-600" />
            <h2 className="text-xl font-extrabold text-slate-900">
              Pilar Utama 7 Kebiasaan Positif
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SEVEN_HABITS.map((habit) => (
              <div
                key={habit.number}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4"
              >
                <span className="text-sm font-black text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-xl shrink-0">
                  {habit.number}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{habit.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{habit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tim Pengembang */}
        {teamMembers.length > 0 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5">
              <Users size={22} className="text-indigo-600" />
              <h2 className="text-xl font-extrabold text-slate-900">Tim Pengembang Nexara</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4"
                >
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                      {member.name?.[0] || 'N'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">{member.name}</p>
                    <p className="text-xs font-semibold text-indigo-600 truncate">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tombol Balik ke Beranda di Bagian Bawah */}
        <div className="text-center pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition-all"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  )
}