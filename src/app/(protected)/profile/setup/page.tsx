'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

export default function InitialProfileSetup({ userId }: { userId: string }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('users').insert({
      id: userId,
      username,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/my-calendar') // プロフィール設定完了後の遷移先
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h2 className="text-xl font-bold">プロフィールを設定してください</h2>
      <Input
        placeholder="ユーザー名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button onClick={handleSubmit} disabled={loading || !username.trim()}>
        {loading ? '登録中...' : '登録する'}
      </Button>
    </div>
  )
}