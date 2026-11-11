import { createClient } from '@/lib/supabase/server'
import { connection } from 'next/server'

export default async function TeamList() {
  await connection()

  const supabase = await createClient()
  const { data: team } = await supabase
    .from('team_members')
    .select('*')
    .order('display_order', { ascending: true })

  if (!team || team.length === 0) {
    return (
      <p className="text-center text-gray-500 font-semibold text-sm py-8">
        Belum ada data tim pengembang.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {team.map((member) => {
        // Jika URL foto kosong atau tidak diisi, gunakan Avatar generator berdasarkan nama
        const avatarUrl =
          member.photo_url && member.photo_url.trim() !== ''
            ? member.photo_url
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                member.name
              )}&background=0D8ABC&color=fff&bold=true`

        return (
          <div
            key={member.id}
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center flex flex-col items-center hover:shadow-md transition-shadow"
          >
            <div className="w-24 h-24 mb-4 relative">
              <img
                src={avatarUrl}
                alt={member.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-blue-600 shadow-sm"
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
            <p className="text-sm font-semibold text-blue-600">{member.role}</p>
          </div>
        )
      })}
    </div>
  )
}