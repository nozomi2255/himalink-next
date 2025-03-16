// src/app/followActions.ts
import { createClient } from '@/utils/supabase/server';
import type { UserRecord } from './types';

/**
 * フォロー中のユーザーを取得する関数
 */
export async function getFollowingUsers(userId: string): Promise<UserRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  const followingUserIds = data.map((follow: any) => follow.following_id);
  const { data: usersData, error: usersError } = await supabase
    .from('Users')
    .select('id, username, email')
    .in('id', followingUserIds);
  if (usersError) throw usersError;
  return usersData as UserRecord[];
}

/**
 * フォロワーを取得する関数
 */
export async function getFollowers(userId: string): Promise<UserRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Follows')
    .select('follower_id')
    .eq('following_id', userId);
  if (error) throw error;
  const followerIds = data.map((follow: any) => follow.follower_id);
  const { data: usersData, error: usersError } = await supabase
    .from('Users')
    .select('id, username, email')
    .in('id', followerIds);
  if (usersError) throw usersError;
  return usersData as UserRecord[];
}