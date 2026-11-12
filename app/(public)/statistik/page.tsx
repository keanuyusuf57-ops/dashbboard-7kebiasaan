'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, TrendingUp, Award, Calendar, Sparkles } from 'lucide-react'

const GOOGLE_SHEET_API_URL =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_API_URL ||
  'https://script.google.com/macros/s/AKfycbyGCDCIQMCbgqy0l3hAjtuZs_Ed9F6xsj09cU9oxxnG72WizU_Q0sOVobnRtvYjGS5T/exec'

const INDICATOR_LABELS = [
  'Bangun Pagi',
  'Ibadah Tepat',
  'Berdoa Harian',
  'Olahraga 3x',
  'Ekskul/Sekolah',
  'Makan Sehat',
  'Gemar Membaca',
  'Bantu Ortu',
  'Tidur Cepat',
  'Bebas Gadget',
]

// Bank kalimat penyemangat yang natural, santai khas anak SMA, dan berbeda-beda antar siswa
const ENCOURAGEMENT_BANK = {
  high: [
    (name: string) =>
      `Gokil sih, ${name}! Ritme harianmu udah rapi banget. Pertahankan konsistensi ini ya, langkah kecil tiap hari bakal kerasa banget dampaknya ke depan!`,
    (name: string) =>
      `Salut buat kamu, ${name}! Kebiasaan positifmu udah jalan mulus. Tetap jaga energi baik ini dan jangan lupa ajak teman sebangkumu ikutan konsisten juga!`,
    (name: string) =>
      `Keren abis, ${name}! Kamu buktiin kalau disiplin itu nggak harus kaku. Terusin kebiasaan hebat ini sampai jadi karakter alami kamu di SMAN 5 Semarang!`,
    (name: string) =>
      `Mantap jiwa, ${name}! Skor kebiasaanmu solid banget. Jaga terus ritme tidur, ibadah, dan belajarmu biar makin siap ngejar target-target besarmu!`,
    (name: string) =>
      `Top banget, ${name}! Konsistensi kayak gini yang bikin beda. Tetap rendah hati dan terus pertahankan kebiasaan baikmu hari demi hari ya!`,
  ],
  medium: [
    (name: string) =>
      `Udah di jalur yang pas nih, ${name}! Tinggal naikin dikit lagi konsistensinya di beberapa kebiasaan yang masih bolong. Pelan-pelan aja, yang penting jalan terus!`,
    (name: string) =>
      `Progresmu udah kelihatan oke, ${name}! Nggak perlu langsung sempurna semua kok, coba fokus rapihin satu atau dua kebiasaan dulu minggu ini. Kamu pasti bisa!`,
    (name: string) =>
      `Lumayan banget lho ini, ${name}! Pondasinya udah ada, tinggal dibikin lebih rutin aja biar makin kerasa manfaatnya pas di sekolah. Semangat terus!`,
    (name: string) =>
      `Bagus, ${name}! Kamu udah mulai ngebangun rutinitas yang positif. Coba cek bagian mana yang skornya masih di bawah 4, lalu tantang dirimu buat naikin besok!`,
    (name: string) =>
      `Langkah awal yang solid, ${name}! Ingat, kebiasaan hebat itu dibangun dari hal-hal simpel yang diulang tiap hari. Yuk gas dikit lagi biar makin maksimal!`,
  ],
  low: [
    (name: string) =>
      `Nggak apa-apa banget mulai dari pelan-pelan, ${name}! Setiap orang punya ritmenya masing-masing. Besok coba mulai dari hal paling gampang dulu, kayak bangun lebih pagi atau berdoa sebelum belajar!`,
    (name: string) =>
      `Tenang aja, ${name}, yang penting kamu udah jujur sama diri sendiri lewat evaluasi ini. Yuk mulai benahi satu kebiasaan kecil hari ini, nanti lama-lama pasti kebiasa!`,
    (name: string) =>
      `Semangat ya, ${name}! Namanya juga proses belajar ngebangun kebiasaan baru, wajar kalau di awal masih naik-turun. Besok kita coba lagi lebih baik dari hari ini!`,
    (name: string) =>
      `Langkah pertama selalu yang paling menantang, dan kamu udah ambil langkah itu, ${name}! Coba kurangi begadang malam ini biar besok pagi lebih segar!`,
    (name: string) =>
      `Jangan berkecil hati ya, ${name}! Justru dari catatan ini kamu jadi tahu bagian mana yang bisa di-upgrade. Mulai dari langkah kecil aja dulu, pasti lama-lama naik!`,
  ],
}

function getPersonalEncouragement(fullName: string, avgScore: number): string {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName
  // Buat angka unik dari nama siswa agar setiap siswa mendapat variasi kalimat berbeda
  let hash = 0
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const positiveHash = Math.abs(hash)

  if (avgScore >= 4.0) {
    const list = ENCOURAGEMENT_BANK.high
    return list[positiveHash % list.length](firstName)
  }
  if (avgScore >= 2.8) {
    const list = ENCOURAGEMENT_BANK.medium
    return list[positiveHash % list.length](firstName)
  }
  const list = ENCOURAGEMENT_BANK.low
  return list[positiveHash % list.length](firstName)
}

export default function StatistikPribadiPage() {
  const [nameInput, setNameInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [studentRecords, setStudentRecords] = useState<any[]>([])
  const [matchedName, setMatchedName] = useState('')
  const [matchedClass, setMatchedClass] = useState('')

  // Otomatis isi nama jika siswa sebelumnya sudah mengisi survei di perangkat ini
  useEffect(() => {
    const savedNama = localStorage.getItem('kaih_student_nama')
    if (savedNama) {
      setNameInput(savedNama)
    }
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = nameInput.trim().toLowerCase()
    if (!query) return

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(GOOGLE_SHEET_API_URL)
      const json = await res.json()

      if (json.status === 'success' && Array.isArray(json.data)) {
        // Cari data siswa berdasarkan nama (cocok persis atau mengandung kata kunci nama)
        const matches = json.data.filter((r: any) => {
          const rowName = String(r.nama || '').trim().toLowerCase()
          return rowName === query || rowName.includes(query)
        })

        if (matches.length > 0) {
          // Ambil nama paling lengkap dari kecocokan terakhir
          const latest = matches[matches.length - 1]
          setMatchedName(latest.nama || nameInput.trim())
          setMatchedClass(latest.kelas || '-')
          setStudentRecords(matches)
        } else {
          setMatchedName('')
          setMatchedClass('')
          setStudentRecords([])
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data statistik pribadi:', err)
    } finally {
      setLoading(false)
    }
  }

  // Hitung rata-rata tiap indikator dari seluruh riwayat pengisian siswa
  const indicatorAverages = Array(10).fill(0)
  if (studentRecords.length > 0) {
    const sums = Array(10).fill(0)
    const counts = Array(10).fill(0)

    studentRecords.forEach((rec) => {
      if (Array.isArray(rec.scores)) {
        rec.scores.forEach((rawVal: any, idx: number) => {
          const val = Number(rawVal)
          if (!isNaN(val) && val >= 1 && val <= 5 && idx < 10) {
            sums[idx] += val
            counts[idx] += 1
          }
        })
      }
    })

    for (let i = 0; i < 10; i++) {
      indicatorAverages[i] = counts[i] > 0 ? Number((sums[i] / counts[i]).toFixed(2)) : 0
    }
  }

  const validScores = indicatorAverages.filter((v) => v > 0)
  const overallAvg =
    validScores.length > 0
      ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2))
      : 0
  const overallPct = Math.min(100, Math.round((overallAvg / 5) * 100))

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tombol Kembali ke Beranda */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Kartu Pencarian Nama Siswa */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 space-y-5">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Cek Statistik Pribadi
            </h1>
            <p className="text-sm text-slate-500">
              Masukkan nama lengkapmu untuk melihat perkembangan 7 Kebiasaan Anak Indonesia Hebat.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ketik nama lengkap kamu..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mencari Data...' : 'Tampilkan Hasil Saya'}
            </button>
          </form>
        </div>

        {/* Hasil Statistik Pribadi */}
        {searched && !loading && (
          <>
            {studentRecords.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-3">
                <p className="text-base font-bold text-slate-800">
                  Data atas nama "{nameInput}" belum ditemukan.
                </p>
                <p className="text-xs text-slate-500">
                  Pastikan ejaan nama sama dengan yang kamu tulis saat mengisi survei, atau isi
                  survei terlebih dahulu.
                </p>
                <div className="pt-2">
                  <Link
                    href="/survey"
                    className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Isi Survey Sekarang →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Kartu Profil & Kalimat Penyemangat Natural */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white p-6 sm:p-8 rounded-3xl shadow-md space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full">
                        Kelas {matchedClass}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black mt-2">{matchedName}</h2>
                    </div>

                    <div className="flex items-center gap-4 bg-white/15 backdrop-blur-sm px-5 py-3 rounded-2xl">
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-indigo-100 font-bold">Indeks</p>
                        <p className="text-2xl font-black">{overallPct}%</p>
                      </div>
                      <div className="h-8 w-px bg-white/20" />
                      <div className="text-center">
                        <p className="text-[10px] uppercase text-indigo-100 font-bold">Rata-Rata</p>
                        <p className="text-2xl font-black">{overallAvg}</p>
                      </div>
                    </div>
                  </div>

                  {/* Kalimat Penyemangat Unik */}
                  <div className="bg-white/10 border border-white/15 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
                    <Sparkles size={20} className="text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base font-medium leading-relaxed text-white">
                      {getPersonalEncouragement(matchedName, overallAvg)}
                    </p>
                  </div>
                </div>

                {/* Ringkasan 3 Kartu Metrik */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Pengisian</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {studentRecords.length} Kali
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Skor Rata-Rata</p>
                      <p className="text-lg font-extrabold text-slate-900">
                        {overallAvg} / 5.0
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                      <Award size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Capaian Kebiasaan</p>
                      <p className="text-lg font-extrabold text-slate-900">{overallPct}%</p>
                    </div>
                  </div>
                </div>

                {/* Grafik Detail Per Indikator */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Rincian Capaian Per Kebiasaan
                  </h3>

                  <div className="space-y-4">
                    {INDICATOR_LABELS.map((label, idx) => {
                      const val = indicatorAverages[idx]
                      const pct = Math.min(100, Math.round((val / 5) * 100))

                      return (
                        <div key={label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700">
                              {idx + 1}. {label}
                            </span>
                            <span className="text-indigo-600">
                              {val.toFixed(1)} / 5.0 ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}