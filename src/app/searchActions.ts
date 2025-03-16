// src/app/userActions.ts
import { createClient } from '@/utils/supabase/server';
import type { UserRecord } from './types';

/**
 * 指定したクエリに基づいて、Usersテーブルからユーザーを検索する関数
 */
export async function searchUsers(query: string): Promise<UserRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Users')
    .select('*')
    .ilike('username', `%${query}%`); // 例としてusernameを部分一致検索
  if (error) throw error;
  return data as UserRecord[];
}