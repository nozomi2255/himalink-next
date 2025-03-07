'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Head from 'next/head';

interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface Entry {
  id: string;
  user_id: string;
  entry_type: string;
  title: string;
  content: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string;
  created_at: string;
  updated_at: string;
}

export default function HomePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/auth');
      } else {
        router.replace('/calendar');
      }
    };

    checkSession();
  }, [router]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('Users')
      .select('id, email, username, full_name, avatar_url, created_at, updated_at');

    if (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users.');
    } else {
      console.log('Users:', data);
      setUsers(data);
    }
    setLoadingUsers(false);
    setLoading(false);
  };

  const fetchEntries = async () => {
    setLoadingEntries(true);
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('Entries')
      .select('id, user_id, entry_type, title, content, start_time, end_time, is_all_day, location, created_at, updated_at');

    if (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to fetch entries.');
    } else {
      console.log('Entries:', data);
      setEntries(data);
    }
    setLoadingEntries(false);
    setLoading(false);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Head>
        <title>ひまリンク - 直感的なカレンダー & ソーシャルスケジューリング</title>
        <meta
          name="description"
          content="ひまリンクは、直感的なカレンダー表示と予定管理機能を通じて、ユーザーが簡単に予定を追加・編集し、友人と共有できる革新的なサービスです。"
        />
        <link rel="canonical" href="https://yourdomain.com" />
      </Head>
      <div className="p-8">
        <h1 className="text-4xl font-bold">ひまリンクへようこそ</h1>
        <p className="mt-4 text-lg">
          ひまリンクは、直感的なカレンダー表示と予定管理機能を提供する革新的なサービスです。
          ここでは、あなたの予定を簡単に追加・編集し、友人との共有もスムーズに行えます。
        </p>
      </div>
      <div className="p-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <button onClick={fetchUsers} className="btn">Fetch Users</button>
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.id}>{user.full_name || user.username || user.email}</li>
            ))}
          </ul>
        )}

        <h1 className="text-2xl font-bold mt-4">Entries</h1>
        <button onClick={fetchEntries} className="btn">Fetch Entries</button>
        {loadingEntries ? (
          <p>Loading entries...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>{entry.title}</li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
