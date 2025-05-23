// イベント（予定）の型定義
export interface Event {
    id: string;           // UUID
    user_id: string;      // UUID
    entry_type: string;   // 予定のタイプ
    title: string;        // タイトル
    content?: string;     // 内容（オプション）
    start_time: string;  // 開始時間（オプション）
    end_time: string;    // 終了時間（オプション）
    is_all_day: boolean;  // 終日イベントかどうか
    location?: string;    // 場所（オプション）
    created_at: string;   // 作成日時
    updated_at: string;   // 更新日時
  }
  
  // ユーザーの型定義（Supabase Auth のユーザー情報をベースに、必要なら拡張）
  export interface UserRecord {
    id: string;           // UUID
    email: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
    bio: string | null;
    // app_metadata や user_metadata も必要に応じて追加できますが、
    // 基本的なアプリケーション固有の情報だけを管理する場合は省略できます
  }
  
  // フォロー情報の型定義
  export interface Follow {
    follower_id: string;  // フォローしているユーザーのID
    following_id: string; // フォローされているユーザーのID
  }
  
  export type Memo = {
    id: string;
    title: string;
    body: string;
    user_id: string;
    user_name: string;
    created_at: string;
    updated_at: string;
  };
  // フォロワーやフォロー中のリストを表す場合は、UserRecord の配列を利用することが一般的です

  export type UserProfile = {
    avatarUrl: string | null;
    username: string | null;
    bio: string | null;
  };

  // calendar-context から移動
  export interface RecentEvent {
    event_id: string;
    user_id: string;
    username: string;
    title: string;
    content: string;
    entry_type: string;
    start_time: string; // Supabaseのtimestamp with time zoneは通常文字列で返されます
    end_time: string; // 同上
    is_all_day: boolean;
    location: string;
    avatar_url: string;
    updated_at: string;
    time_since_update: string; // Supabaseのinterval型は通常文字列で返されます
  }