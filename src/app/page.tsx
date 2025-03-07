import { redirect } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default async function HomePage() {
  // サーバーサイドでセッション情報を取得
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth'); // セッションがない場合は/authにリダイレクト
  } else {
    redirect('/calendar'); // セッションがある場合は/calendarにリダイレクト
  }
}
