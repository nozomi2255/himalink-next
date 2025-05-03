// app/profile/setup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function ProfileSetup() {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('ユーザーが見つかりません')
    }

    const { error } = await supabase.from('Users').insert({
      id: user.id,
      email: user.email,
      username,
      full_name: fullName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (error) {
      alert('登録に失敗しました')
    } else {
      router.push('/my-calendar') // 遷移先は適宜変更
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h1 className="text-xl font-bold mb-4">プロフィール設定</h1>
      <input
        type="text"
        placeholder="ユーザー名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-2 border p-2 w-full"
        required
      />
      <input
        type="text"
        placeholder="氏名"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="mb-4 border p-2 w-full"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        保存して開始
      </button>
    </form>
  )
}