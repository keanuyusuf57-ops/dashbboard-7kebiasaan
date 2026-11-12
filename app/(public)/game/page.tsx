'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  Download,
  Share2,
  RotateCcw,
  BookOpen,
  Users,
  ShieldCheck,
} from 'lucide-react'

type Option = {
  text: string
  habit: string
}

type QuestionData = {
  id: string
  time_slot: number
  pertanyaan: string
  opsi_a: Option
  opsi_b: Option
  opsi_c: Option
}

type AnswerRecord = {
  questionText: string
  selectedOptionText: string
  habit: string
}

export default function GameKuisPage() {
  const supabase = createClient()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [screen, setScreen] = useState<'start' | 'quiz' | 'result'>('start')
  const [currentQuestions, setCurrentQuestions] = useState<QuestionData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [userAnswers, setUserAnswers] = useState<AnswerRecord[]>([])
  const [selectedChoiceKey, setSelectedChoiceKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [timerText, setTimerText] = useState('Rotasi Soal: --:--:--')

  // Gamifikasi XP & Level
  const [xp, setXp] = useState(0)

  // Hasil & Refleksi
  const [resultTitle, setResultTitle] = useState('')
  const [resultDesc, setResultDesc] = useState('')
  const [personalTips, setPersonalTips] = useState<string[]>([])
  const [awarenessLevel, setAwarenessLevel] = useState<string>('')
  const [awarenessDesc, setAwarenessDesc] = useState<string>('')
  const [savedResultId, setSavedResultId] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<boolean>(false)

  // AUDIO FX STATE
  const [isMuted, setIsMuted] = useState<boolean>(false)

  // STATISTIK KOMUNITAS
  const [communityPercentage, setCommunityPercentage] = useState<number | null>(null)
  const [totalPlayers, setTotalPlayers] = useState<number>(0)

  // Ambil total pemain aktif saat halaman dimuat
  useEffect(() => {
    async function loadCommunityStats() {
      const { count } = await supabase
        .from('hasil_kuis')
        .select('*', { count: 'exact', head: true })
      if (count !== null) setTotalPlayers(count)
    }
    loadCommunityStats()
  }, [])

  // SINTESIS SUARA AUDIO FX (Web Audio API)
  const playSound = (type: 'click' | 'fanfare') => {
    if (isMuted) return
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()

      if (type === 'click') {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      } else if (type === 'fanfare') {
        const notes = [440, 554.37, 659.25, 880]
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.value = freq
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.3)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(ctx.currentTime + idx * 0.1)
          osc.stop(ctx.currentTime + idx * 0.1 + 0.3)
        })
      }
    } catch (e) {
      console.warn('Audio FX Error:', e)
    }
  }

  // Hitung Time Slot Saat Ini (0: 00-06, 1: 06-12, 2: 12-18, 3: 18-24)
  const getCurrentTimeSlot = () => {
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 6) return 0
    if (hour >= 6 && hour < 12) return 1
    if (hour >= 12 && hour < 18) return 2
    return 3
  }

  // Timer Rotasi 6 Jam
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
      const sixHoursInSeconds = 6 * 3600
      const secondsUntilNextSlot = sixHoursInSeconds - (secondsInDay % sixHoursInSeconds)

      const hours = Math.floor(secondsUntilNextSlot / 3600)
      const minutes = Math.floor((secondsUntilNextSlot % 3600) / 60)
      const seconds = secondsUntilNextSlot % 60

      setTimerText(
        `Rotasi Soal: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      )
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  // Mulai Kuis & Fetch Soal dari Supabase
  const startGame = async () => {
    playSound('click')
    setScreen('quiz')
    setCurrentIndex(0)
    setScores({})
    setUserAnswers([])
    setSelectedChoiceKey(null)
    setXp(0)
    setCommunityPercentage(null)
    setCopiedText(false)
    setLoading(true)

    const activeSlot = getCurrentTimeSlot()

    try {
      const { data, error } = await supabase
        .from('bank_soal')
        .select('*')
        .eq('time_slot', activeSlot)
        .limit(10)

      if (error) throw error

      if (data && data.length > 0) {
        setCurrentQuestions(data as QuestionData[])
      } else {
        alert('Belum ada data soal untuk slot jam ini di database!')
        setScreen('start')
      }
    } catch (err: any) {
      console.error('Gagal mengambil data kuis:', err?.message || err)
      alert(`Gagal terhubung ke database Supabase: ${err?.message || 'Periksa koneksi RLS'}`)
      setScreen('start')
    } finally {
      setLoading(false)
    }
  }

  // Pilih Opsi Jawaban (dengan feedback visual & +100 XP)
  const selectOption = (optionKey: string, option: Option) => {
    if (selectedChoiceKey) return // Cegah klik ganda
    setSelectedChoiceKey(optionKey)
    playSound('click')

    const currentQ = currentQuestions[currentIndex]
    setXp((prev) => prev + 100)

    setScores((prev) => ({
      ...prev,
      [option.habit]: (prev[option.habit] || 0) + 1,
    }))

    const newAnswer: AnswerRecord = {
      questionText: currentQ.pertanyaan,
      selectedOptionText: option.text,
      habit: option.habit,
    }

    const updatedAnswers = [...userAnswers, newAnswer]
    setUserAnswers(updatedAnswers)

    setTimeout(() => {
      setSelectedChoiceKey(null)
      if (currentIndex + 1 < currentQuestions.length) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        showResult(updatedAnswers)
      }
    }, 450)
  }

  // Tampilkan Hasil Kuis & Simpan Ke Database
  const showResult = async (finalAnswers: AnswerRecord[]) => {
    setScreen('result')
    playSound('fanfare')

    let topHabit = 'Teratur'
    let maxScore = -1

    const tempScores: Record<string, number> = {}
    finalAnswers.forEach((ans) => {
      tempScores[ans.habit] = (tempScores[ans.habit] || 0) + 1
    })

    for (const [habit, score] of Object.entries(tempScores)) {
      if (score > maxScore) {
        maxScore = score
        topHabit = habit
      }
    }

    if (maxScore >= 8) {
      setAwarenessLevel('Fokus & Konsisten Tinggi 🎯')
      setAwarenessDesc('Jawabanmu menunjukkan kecenderungan karakter yang sangat kuat dan konsisten di satu bidang utama.')
    } else if (maxScore >= 5) {
      setAwarenessLevel('Seimbang & Reflektif ⚖️')
      setAwarenessDesc('Kamu memiliki keseimbangan kebiasaan yang fleksibel dan mempertimbangkan situasi secara matang.')
    } else {
      setAwarenessLevel('Eksploratif & Dinamis 🌟')
      setAwarenessDesc('Jawabanmu bervariasi secara alami, menandakan kamu siap mencoba berbagai kebiasaan positif baru.')
    }

    let title = '⚡ Si Pelopor Disiplin & Sehat'
    let desc =
      'Hebat! Kamu selalu konsisten dalam menjaga kebiasaan positif seperti bangun pagi dan menjaga kesehatan tubuh. Kamu panutan yang luar biasa!'
    let tips = [
      '💡 Pasang alarm berjarak dan langsung bangun tanpa tekan snooze biar energimu tidak drop.',
      '🥗 Cobalah sesekali bawa bekal buah atau jus dari rumah buat variasi nutrisi di sekolah.',
      '😴 Usahakan matikan layar HP 30 menit sebelum tidur biar kualitas tidurmu makin maksimal.',
    ]

    if (topHabit === 'Gemar Membaca') {
      title = '🌱 Si Cerdas Pembelajar Sejati'
      desc =
        'Kamu adalah anak yang selalu ingin tahu dan teratur! Rasa penasaranmu pada ilmu pengetahuan akan membawamu meraih cita-cita yang tinggi.'
      tips = [
        '📚 Buat target membaca santai minimal 10-15 halaman per hari dari buku impianmu.',
        '📝 Coba buat catatan ringkas atau rangkuman kreatif (mind map) biar ilmunya awet di kepala.',
        '🤝 Bagikan info menarik atau fakta unik yang baru kamu baca ke teman kelasmu!',
      ]
    } else if (topHabit === 'Gotong Royong' || topHabit === 'Sosial') {
      title = '🤝 Si Bintang Gotong Royong'
      desc =
        'Kamu punya kepedulian sosial yang tinggi! Sikap ramah dan suka membantumu membuat teman-teman merasa nyaman berada di dekatmu.'
      tips = [
        '✨ Tetap jadi inisiator kebaikan saat ada kegiatan kelompok atau piket kelas.',
        '💙 Ingat untuk tetap luangkan waktu istirahat buat diri sendiri alias "me time".',
        '💬 Jadilah pendengar yang baik ketika temanmu butuh tempat bercerita.',
      ]
    }

    setResultTitle(title)
    setResultDesc(desc)
    setPersonalTips(tips)

    try {
      const { data, error } = await supabase
        .from('hasil_kuis')
        .insert([{ profil_hasil: title, skor: tempScores }])
        .select()

      if (!error && data && data.length > 0) {
        setSavedResultId(data[0].id)
      }

      const { data: allResults, error: fetchErr } = await supabase
        .from('hasil_kuis')
        .select('profil_hasil')

      if (!fetchErr && allResults) {
        const total = allResults.length
        const matchCount = allResults.filter((r) => r.profil_hasil === title).length
        const percentage = total > 0 ? Math.round((matchCount / total) * 100) : 100

        setTotalPlayers(total)
        setCommunityPercentage(percentage)
      }
    } catch (err: any) {
      console.error('Gagal menyimpan/mengambil data statistik:', err?.message || err)
    }
  }

  // FUNGSI BAGIKAN TEKS HASIL
  const copyShareText = () => {
    playSound('click')
    const textToShare = `🎮 Tipe Kebiasaan Hebatku: ${resultTitle}\n"${resultDesc}"\n\nYuk ikutan kuis 7 Kebiasaan Anak Indonesia Hebat SMAN 5 Semarang!`
    navigator.clipboard.writeText(textToShare)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 3000)
  }

  // FUNGSI GENERATE GAMBAR POSTER PNG
  const downloadResultCard = () => {
    playSound('click')
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 640
    canvas.height = 960

    ctx.fillStyle = '#F0F9F4'
    ctx.fillRect(0, 0, 640, 960)

    ctx.strokeStyle = '#2ECC71'
    ctx.lineWidth = 6
    ctx.strokeRect(16, 16, 608, 928)

    ctx.fillStyle = 'rgba(46, 204, 113, 0.08)'
    ctx.beginPath()
    ctx.arc(520, 100, 160, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(100, 880, 200, 0, Math.PI * 2)
    ctx.fill()

    ctx.textAlign = 'center'
    ctx.fillStyle = '#27AE60'
    ctx.font = '900 76px "Arial Black", sans-serif'
    ctx.fillText('7', 110, 92)

    ctx.fillStyle = '#1E8449'
    ctx.font = '900 32px "Arial Black", sans-serif'
    ctx.fillText('KEBIASAAN', 340, 78)
    ctx.fillText('ANAK HEBAT', 340, 114)

    ctx.fillStyle = '#E8F8F5'
    ctx.beginPath()
    ctx.roundRect(80, 134, 480, 36, 18)
    ctx.fill()
    ctx.fillStyle = '#1E8449'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(`PROFIL: ${resultTitle.toUpperCase()}`, 320, 157)

    const drawCanvasMascot = (cX: number, cY: number) => {
      ctx.save()
      ctx.translate(cX, cY)

      ctx.fillStyle = '#80C242'
      ctx.strokeStyle = '#468826'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(0, 0, 42, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#468826'
      ctx.beginPath()
      ctx.ellipse(0, -42, 6, 12, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#1C2D42'
      ctx.beginPath()
      ctx.arc(-14, -6, 7, 0, Math.PI * 2)
      ctx.arc(14, -6, 7, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(-16, -8, 2.5, 0, Math.PI * 2)
      ctx.arc(12, -8, 2.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 118, 117, 0.8)'
      ctx.beginPath()
      ctx.arc(-22, 4, 5, 0, Math.PI * 2)
      ctx.arc(22, 4, 5, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#3A6E1F'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 2, 10, 0.2, Math.PI - 0.2)
      ctx.stroke()

      ctx.fillStyle = '#F1C40F'
      ctx.beginPath()
      ctx.arc(38, -30, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    const drawHexagon = (
      x: number,
      y: number,
      radius: number,
      fillColor: string,
      strokeColor: string,
      title: string,
      isActive: boolean = false
    ) => {
      ctx.save()
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6
        const hX = x + radius * Math.cos(angle)
        const hY = y + radius * Math.sin(angle)
        if (i === 0) ctx.moveTo(hX, hY)
        else ctx.lineTo(hX, hY)
      }
      ctx.closePath()

      ctx.fillStyle = fillColor
      ctx.fill()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = isActive ? 4 : 2
      ctx.stroke()

      ctx.fillStyle = isActive ? '#FFFFFF' : '#2C3E50'
      ctx.font = isActive ? 'bold 13px sans-serif' : '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(title, x, y + 4)

      ctx.restore()
    }

    const centerX = 320
    const centerY = 370
    const r = 68

    const habits = [
      { name: 'Taat Beribadah', x: centerX, y: centerY, isCenter: true },
      { name: 'Rajin Belajar', x: centerX, y: centerY - r * 1.73 },
      { name: 'Makan Sehat', x: centerX + r * 1.5, y: centerY - r * 0.865 },
      { name: 'Tidur Cepat', x: centerX + r * 1.5, y: centerY + r * 0.865 },
      { name: 'Rajin Olahraga', x: centerX, y: centerY + r * 1.73 },
      { name: 'Bermasyarakat', x: centerX - r * 1.5, y: centerY + r * 0.865 },
      { name: 'Bangun Pagi', x: centerX - r * 1.5, y: centerY - r * 0.865 },
    ]

    habits.forEach((h) => {
      const isHighlighted =
        h.isCenter || resultTitle.toLowerCase().includes(h.name.toLowerCase().split(' ')[0])
      const fillColor = isHighlighted ? '#27AE60' : '#FFFFFF'
      const strokeColor = isHighlighted ? '#1E8449' : '#A6ACAF'
      drawHexagon(h.x, h.y, r, fillColor, strokeColor, h.name, isHighlighted)
    })

    drawCanvasMascot(centerX, centerY)

    const boxY = 575
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#2ECC71'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(40, boxY, 560, 260, 24)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#1E8449'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('💡 Refleksi Kebiasaan Kamu:', 65, boxY + 36)

    ctx.fillStyle = '#4A5568'
    ctx.font = '13px sans-serif'

    const words = resultDesc.split(' ')
    let line = ''
    let lineY = boxY + 62
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > 500 && n > 0) {
        ctx.fillText(line, 65, lineY)
        line = words[n] + ' '
        lineY += 20
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, 65, lineY)

    if (personalTips.length > 0) {
      ctx.fillStyle = '#27AE60'
      ctx.font = 'bold 13px sans-serif'
      ctx.fillText('📌 Tips Utama:', 65, lineY + 32)
      ctx.fillStyle = '#2D3748'
      ctx.font = '12px sans-serif'
      ctx.fillText(personalTips[0], 65, lineY + 52)
    }

    ctx.fillStyle = '#E8F8F5'
    ctx.beginPath()
    ctx.roundRect(65, boxY + 190, 510, 42, 12)
    ctx.fill()
    ctx.fillStyle = '#1E8449'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(`🧠 Status Refleksi: ${awarenessLevel}`, 80, boxY + 216)

    ctx.fillStyle = '#7F8C8D'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SMAN 5 SEMARANG — GERAKAN 7 KEBIASAAN ANAK INDONESIA HEBAT', 320, 885)

    const imageURI = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `Poster_7Kebiasaan_${resultTitle.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    link.href = imageURI
    link.click()
  }

  // Komponen SVG Maskot Dinamis
  const MascotSVG = ({ variant }: { variant?: string }) => (
    <svg
      className="w-28 h-28 mx-auto drop-shadow-md hover:scale-105 transition-all animate-bounce"
      viewBox="0 0 200 220"
    >
      <path
        d="M 100 25 C 160 30, 185 85, 175 140 C 165 180, 135 195, 100 195 C 65 195, 35 180, 25 140 C 15 85, 40 30, 100 25 Z"
        fill="#80C242"
        stroke="#468826"
        strokeWidth="3"
      />
      <path d="M 100 30 L 100 190" stroke="#5E9C30" strokeWidth="2.5" opacity="0.6" />
      <path
        d="M 100 25 C 85 10, 85 -5, 100 -5 C 115 -5, 115 10, 100 25 Z"
        fill="#80C242"
        stroke="#468826"
        strokeWidth="2"
      />
      <ellipse cx="72" cy="110" rx="16" ry="20" fill="#1C2D42" />
      <ellipse cx="72" cy="110" rx="14" ry="18" fill="#1E78B4" />
      <ellipse cx="72" cy="114" rx="9" ry="12" fill="#38B6FF" />
      <circle cx="67" cy="100" r="6" fill="#FFFFFF" />
      <ellipse cx="128" cy="110" rx="16" ry="20" fill="#1C2D42" />
      <ellipse cx="128" cy="110" rx="14" ry="18" fill="#1E78B4" />
      <ellipse cx="128" cy="114" rx="9" ry="12" fill="#38B6FF" />
      <circle cx="123" cy="100" r="6" fill="#FFFFFF" />
      <path d="M 62 82 Q 72 78 80 84" stroke="#3A6E1F" strokeWidth="3" fill="none" />
      <path d="M 138 82 Q 128 78 120 84" stroke="#3A6E1F" strokeWidth="3" fill="none" />
      <ellipse cx="58" cy="128" rx="9" ry="5" fill="#FF7675" opacity="0.85" />
      <ellipse cx="142" cy="128" rx="9" ry="5" fill="#FF7675" opacity="0.85" />
      <path d="M 88 126 Q 100 142 112 126 Z" fill="#D63031" />
      <rect x="75" y="185" width="12" height="15" fill="#69AB2D" rx="4" />
      <rect x="113" y="185" width="12" height="15" fill="#69AB2D" rx="4" />

      {variant === 'reading' && (
        <>
          <circle cx="72" cy="110" r="17" fill="none" stroke="#2C3E50" strokeWidth="4" />
          <circle cx="128" cy="110" r="17" fill="none" stroke="#2C3E50" strokeWidth="4" />
          <line x1="89" y1="110" x2="111" y2="110" stroke="#2C3E50" strokeWidth="4" />
        </>
      )}
      {variant === 'star' && (
        <polygon
          points="100,5 106,20 122,20 109,30 114,45 100,35 86,45 91,30 78,20 94,20"
          fill="#F1C40F"
          stroke="#F39C12"
          strokeWidth="1.5"
        />
      )}
    </svg>
  )

  const currentQ = currentQuestions[currentIndex]
  const level = Math.floor(xp / 300) + 1
  const progressPct = Math.round(((currentIndex + 1) / (currentQuestions.length || 1)) * 100)

  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      {/* Element Canvas Tersembunyi untuk Poster PNG */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Navigasi Sidebar Kiri Konsisten dengan Beranda */}
      <aside className="w-64 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 hidden lg:flex flex-col shrink-0">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            NX
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-800">NEXARA • 7 KAIH</p>
            <p className="text-[11px] text-slate-500">SMAN 5 Semarang</p>
          </div>
        </div>

        <nav className="mt-5 space-y-1.5 flex-1">
          <Link
            href="/"
            className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Beranda
          </Link>
          <Link
            href="/survey"
            className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Yuk Survey!
          </Link>
          <Link
            href="/game"
            className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-bold bg-indigo-600 text-white shadow-sm"
          >
            Main Game 🎮
          </Link>
          <Link
            href="/statistik"
            className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Statistik Pribadi
          </Link>
          <Link
            href="/tentang"
            className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tentang 7 KAIH
          </Link>
        </nav>
      </aside>

      {/* Konten Utama Kuis Game */}
      <main className="flex-1 space-y-6 min-w-0">
        {/* Top Game HUD Bar (Level, XP, Timer Rotasi & Audio FX) */}
        <header className="flex flex-wrap items-center justify-between bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Status Karakter</p>
              <p className="text-sm font-black text-slate-800">
                Level {level} • <span className="text-indigo-600">{xp} XP</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-50 text-indigo-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Clock size={14} />
              <span>{timerText}</span>
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="hidden sm:inline">{isMuted ? 'Audio Off' : 'Audio On'}</span>
            </button>
          </div>
        </header>

        {/* 1. LAYAR UTAMA (START LOBBY) */}
        {screen === 'start' && (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-indigo-500/20 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-bold">
              <Sparkles size={14} className="text-amber-300" />
              <span>7 KAIH HABIT QUEST • SMAN 5 SEMARANG</span>
            </div>

            <MascotSVG />

            <div className="space-y-2 max-w-xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Temukan Tipe Kebiasaan Hebatmu!
              </h1>
              <p className="text-sm text-indigo-100/85 leading-relaxed">
                Jawab 10 pertanyaan simulasi harian sesuai rotasi waktu, kumpulkan poin XP, dan dapatkan Poster Karakter PNG serta tips kebiasaan personalmu!
              </p>
            </div>

            {/* 3 Kartu Preview Karakter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <ShieldCheck size={20} className="text-purple-300 mb-1.5" />
                <p className="text-xs font-bold">Pelopor Disiplin</p>
                <p className="text-[11px] text-indigo-200 mt-0.5">Bangun pagi, olahraga & hidup teratur</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <BookOpen size={20} className="text-blue-300 mb-1.5" />
                <p className="text-xs font-bold">Pembelajar Sejati</p>
                <p className="text-[11px] text-indigo-200 mt-0.5">Gemar membaca & rasa ingin tahu tinggi</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <Users size={20} className="text-emerald-300 mb-1.5" />
                <p className="text-xs font-bold">Bintang Gotong Royong</p>
                <p className="text-[11px] text-indigo-200 mt-0.5">Peduli sesama & aktif bermasyarakat</p>
              </div>
            </div>

            <div className="max-w-md mx-auto pt-2">
              <button
                onClick={startGame}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:scale-[1.02] text-slate-950 font-black py-4 rounded-2xl shadow-lg transition-all text-base cursor-pointer"
              >
                <Zap size={20} />
                <span>Mulai Kuis Sekarang 🚀</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. LAYAR KUIS INTERAKTIF (QUIZ) */}
        {screen === 'quiz' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 space-y-6">
            <div className="space-y-2 max-w-2xl mx-auto">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-indigo-600">
                  Tantangan {currentIndex + 1} dari {currentQuestions.length || 10}
                </span>
                <span className="text-slate-400">{progressPct}% Selesai</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {loading ? (
              <p className="text-center italic text-slate-500 py-14 animate-pulse">
                Menyiapkan arena soal dari database...
              </p>
            ) : currentQ ? (
              <div className="space-y-6 max-w-2xl mx-auto">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 text-center min-h-[64px] flex items-center justify-center leading-snug">
                  {currentQ.pertanyaan}
                </h2>

                <div className="flex flex-col gap-3.5">
                  {[
                    { key: 'A', opt: currentQ.opsi_a },
                    { key: 'B', opt: currentQ.opsi_b },
                    { key: 'C', opt: currentQ.opsi_c },
                  ].map(({ key, opt }) => {
                    const isSelected = selectedChoiceKey === key
                    return (
                      <button
                        key={key}
                        onClick={() => selectOption(key, opt)}
                        className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 scale-[1.01] shadow-md'
                            : 'border-slate-100 bg-slate-50/70 hover:border-indigo-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center font-black text-sm ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            {key}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-slate-800">
                            {opt.text}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-extrabold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                            <CheckCircle2 size={14} /> +100 XP
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 3. LAYAR HASIL LENGKAP (RESULT + POSTER PNG + TIPS + RINGKASAN) */}
        {screen === 'result' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-10 space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-3">
                <MascotSVG variant={resultTitle.includes('Cerdas') ? 'reading' : 'star'} />
                <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase">
                  <span>Profil Kebiasaan Kamu • {xp} XP</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800">{resultTitle}</h2>
                <div className="bg-indigo-50/60 p-4 rounded-2xl text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {resultDesc}
                </div>
              </div>

              {/* RINCIAN SKOR HABIT */}
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(scores).map(([habitName, val]) => (
                  <div
                    key={habitName}
                    className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center"
                  >
                    <p className="text-[11px] font-bold text-slate-500">{habitName}</p>
                    <p className="text-xl font-black text-indigo-700 mt-0.5">{val * 10}%</p>
                  </div>
                ))}
              </div>

              {/* BADGE KESADARAN DIRI */}
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center space-y-1">
                <p className="text-purple-700 text-xs font-extrabold uppercase tracking-wider">
                  🧠 Indikator Refleksi Kebiasaan
                </p>
                <p className="text-sm font-extrabold text-purple-900">
                  Pola Karakter: <span className="text-purple-600">{awarenessLevel}</span>
                </p>
                <p className="text-xs text-slate-600 leading-normal">{awarenessDesc}</p>
              </div>

              {/* KARTU STATISTIK KOMUNITAS REAL-TIME */}
              {communityPercentage !== null && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-5 text-center space-y-1 shadow-md">
                  <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
                    📊 Statistik Teman Sekolah
                  </p>
                  <p className="text-base sm:text-lg font-black">
                    <span className="text-yellow-300 text-xl font-black">
                      {communityPercentage}%
                    </span>{' '}
                    siswa SMAN 5 Semarang juga bertipe {resultTitle}!
                  </p>
                  <p className="text-[11px] text-indigo-200 italic">
                    (Dihitung dari {totalPlayers} total penyelesaian kuis)
                  </p>
                </div>
              )}

              {/* SARAN PERSONAL (TIPS SANTAI) */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                  📌 Tips Kebiasaan Buat Kamu
                </h3>
                <ul className="space-y-2">
                  {personalTips.map((tip, idx) => (
                    <li
                      key={idx}
                      className="text-xs sm:text-sm text-slate-700 font-medium leading-normal"
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* RINGKASAN JAWABAN SISWA */}
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  📝 Ringkasan Jawaban Kamu ({userAnswers.length} Soal)
                </h3>
                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 text-left">
                  {userAnswers.map((ans, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1"
                    >
                      <p className="text-xs font-bold text-slate-800">
                        {idx + 1}. {ans.questionText}
                      </p>
                      <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 py-1 px-2.5 rounded-lg inline-block">
                        Pilihanmu: {ans.selectedOptionText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOMBOL AKSI */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() =>
                    router.push(
                      `/survey?result_id=${savedResultId || ''}&profile=${encodeURIComponent(resultTitle)}`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold py-4 rounded-2xl shadow-md transition-all text-sm cursor-pointer"
                >
                  <span>Lanjutkan ke Web Survei Utama</span>
                  <ArrowRight size={16} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={downloadResultCard}
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all text-xs shadow-sm cursor-pointer"
                  >
                    <Download size={15} />
                    <span>Unduh Poster (PNG)</span>
                  </button>

                  <button
                    onClick={copyShareText}
                    className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all text-xs shadow-sm cursor-pointer"
                  >
                    <Share2 size={15} />
                    <span>{copiedText ? '✅ Teks Disalin!' : 'Salin Teks Profil'}</span>
                  </button>
                </div>

                <button
                  onClick={startGame}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold py-3 rounded-2xl transition-all text-sm cursor-pointer"
                >
                  <RotateCcw size={15} />
                  <span>Ulangi Kuis</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Panel Statistik Kanan (Live dari Supabase hasil_kuis) */}
      <aside className="w-72 space-y-6 hidden xl:block shrink-0">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-base">Aktivitas Kuis Siswa</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Sesi Selesai</span>
              <span className="font-bold text-indigo-600">{totalPlayers} Sesi</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[82%]" />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Soal berotasi otomatis setiap 6 jam sekali sesuai waktu harian siswa SMAN 5 Semarang.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}