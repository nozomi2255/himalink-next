// src/app/eventActions.ts
import { createClient } from '@/utils/supabase/server';

// イベント（予定）の型定義（必要なフィールドに合わせて調整してください）
export interface Event {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  content?: string;
  location?: string;
}

/**
 * ユーザーの予定（イベント）を取得する関数
 * @param userId - 予定を取得する対象ユーザーのID
 * @returns Promise<Event[]> - ユーザーの予定の配列
 */
export async function getUserEvents(userId: string): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('Entries')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data as Event[];
}

/**
 * 指定した予定（イベント）を更新する関数
 * @param eventId - 更新対象の予定のID
 * @param updateData - 更新するデータ（部分更新）
 */
export async function updateEvent(eventId: string, updateData: Partial<Event>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('Entries')
    .update(updateData)
    .eq('id', eventId);
  if (error) throw error;
}

/**
 * 指定した予定（イベント）を削除する関数
 * @param eventId - 削除対象の予定のID
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('Entries')
    .delete()
    .eq('id', eventId);
  if (error) throw error;
}

/**
 * 新しい予定（イベント）を追加する関数
 * @param userId - 予定を追加するユーザーのID
 * @param newEvent - 新しいイベントのデータ
 */
export async function addEvent(userId: string, newEvent: Omit<Event, 'id'>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('Entries')
    .insert([{ ...newEvent, user_id: userId }]);
  if (error) throw error;
}