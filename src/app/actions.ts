// src/app/actions.ts
import { createClient } from '@/utils/supabase/server';
import type { User } from '@supabase/supabase-js';

export interface CustomUser {
    id: string;
    username: string;
    email: string;
}
/**
 * ユーザー情報を取得する関数
 */
export async function getUserInfo(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}