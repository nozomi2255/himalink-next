// src/app/actions.ts
import { createClient } from '@/utils/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { UserRecord } from './types';

/**
 * 取得するカラムを変数として定義
 */
const userColumns = 'id, email, username, full_name, avatar_url, created_at, updated_at, bio';

/**
 * ユーザー情報を取得する関数
 */
export async function getUserInfo(): Promise<User | null> {
  const supabase = await createClient();

  // まず認証済みユーザー情報を取得
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("getUserInfo error:", error);
    throw error;
  }
  if (!user) return null;
  return user;
}

/**
 * ログインしているユーザーのIDを使って、Users テーブルから詳細なプロファイル情報を取得する関数
 */
export async function getUserRecord(userId: string): Promise<UserRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Users')
    .select(userColumns)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserRecord | null;
}

/**
 * 統合的に認証ユーザーと詳細プロファイル情報を取得する関数
 * こちらを利用することで、認証情報とプロファイル情報が一度に取得できます。
 */
export async function getAuthenticatedUser(): Promise<UserRecord | null> {
  const authUser = await getUserInfo();
  if (!authUser) return null;
  // ここで authUser.id を利用して詳細なレコードを取得
  const fullRecord = await getUserRecord(authUser.id);
  return fullRecord;
}