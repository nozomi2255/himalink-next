"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (!data.session) {
        router.replace('/auth'); // 未ログインの場合、認証画面にリダイレクト
      } else {
        router.replace('/calendar'); // ログイン済みの場合、カレンダー画面にリダイレクト
      }
      setLoading(false); // ローディングを終了
    });
  }, [router]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
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
  };

  const fetchEntries = async () => {
    setLoadingEntries(true);
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
  };

  if (loading) {
    return <p>Loading...</p>; // ローディング中の表示
  }

  return (
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
  );
}
