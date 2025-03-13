// app/calendar/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import CalendarHeader from "../components/CalendarHeader";
import CalendarView from "../components/CalendarView";
import EventFormModal from "../components/EventFormModal";
import FollowingModal from '../components/FollowingModal';
import FollowersModal from '../components/FollowersModal';
import UserSearchModal from '../components/UserSearchModal';

// Entryインターフェースの定義
interface Entry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
  is_all_day: boolean;
}

// Userインターフェースの定義
interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
}

export default function CalendarPage() {
  const router = useRouter(); // Next.jsのルーターを使用
  const [entries, setEntries] = useState<Entry[]>([]); // カレンダーのエントリーを格納するステート
  const [loading, setLoading] = useState(true); // ローディング状態を管理するステート
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // 現在のユーザーID
  const [userName, setUserName] = useState<string | null>(null); // 現在のユーザー名
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null); // 現在のユーザーのアバターURL
  const [searchEmail, setSearchEmail] = useState<string>(""); // 検索用のメールアドレス
  const [searchResults, setSearchResults] = useState<User[]>([]); // 検索結果を格納するステート
  const [showForm, setShowForm] = useState(false); // イベント追加/編集フォームの表示状態
  const [newTitle, setNewTitle] = useState(""); // 新しいイベントのタイトル
  const [selectedDate, setSelectedDate] = useState(""); // 選択された日付
  const [selectedEventId, setSelectedEventId] = useState(""); // 選択されたイベントのID
  const [followingUsers, setFollowingUsers] = useState<User[]>([]); // フォロー中のユーザー
  const [followers, setFollowers] = useState<User[]>([]); // フォロワー

  // モーダルの表示状態
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showUserSearchModal, setShowUserSearchModal] = useState(false); // ユーザー検索モーダルの表示状態

  // コンポーネントのマウント時にセッションを確認し、エントリーを取得
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/auth'); // 未ログインの場合、認証画面にリダイレクト
      } else {
        setCurrentUserId(data.session.user.id); // 現在のユーザーIDを設定
        fetchEntries(data.session.user.id); // ユーザーIDでエントリーを取得
        fetchFollowingUsers(data.session.user.id); // フォロー中のユーザーを取得
        fetchUserProfile(data.session.user.id); // ユーザーのプロフィールを取得
        console.log("Current User ID:", data.session.user.id); // デバッグ用
      }
    });
  }, [router]);

  // ユーザーのプロフィールを取得する関数
  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("Users")
      .select("username, avatar_url")
      .eq("id", userId)
      .single(); // ユーザーIDでフィルタリングし、1件取得

    if (error) {
      console.error('Error fetching user profile:', error); // エラーハンドリング
    } else {
      setUserName(data.username); // ユーザー名を設定
      setUserAvatarUrl(data.avatar_url); // アバターURLを設定
    }
  };

  // ユーザーのエントリーを取得する関数
  const fetchEntries = async (userId: string) => {
    setLoading(true); // ローディング開始
    const { data, error } = await supabase
      .from('Entries')
      .select('id, user_id, title, content, start_time, end_time, is_all_day')
      .eq('user_id', userId) // ユーザーIDでフィルタリング
      .order('start_time', { ascending: true }); // 開始時間でソート

    if (error) {
      console.error('Error fetching entries:', error); // エラーハンドリング
    } else {
      setEntries(data); // エントリーをステートに設定
    }
    setLoading(false); // ローディング終了
  };

  // フォロー中のユーザーを取得する関数
  const fetchFollowingUsers = async (userId: string) => {
    const { data, error } = await supabase
      .from('Follows')
      .select('following_id')
      .eq('follower_id', userId); // フォロワーIDでフィルタリング

    if (error) {
      console.error('Error fetching following users:', error); // エラーハンドリング
    } else {
      // フォロー中のユーザーの詳細を取得
      const followingUserIds = data.map((follow) => follow.following_id);
      const { data: usersData, error: usersError } = await supabase
        .from('Users')
        .select('id, username, email')
        .in('id', followingUserIds); // フォロー中のユーザーのIDでフィルタリング

      if (usersError) {
        console.error('Error fetching users data:', usersError); // エラーハンドリング
      } else {
        setFollowingUsers(usersData); // フォロー中のユーザーをステートに設定
      }
    }
  };

  // フォロワーを取得する関数
  const fetchFollowers = async (userId: string) => {
    const { data, error } = await supabase
      .from('Follows')
      .select('follower_id')
      .eq('following_id', userId); // フォロー中のユーザーIDでフィルタリング

    if (error) {
      console.error('Error fetching followers:', error); // エラーハンドリング
    } else {
      // follower_id の配列を抽出
      const followerIds = data.map((follow) => follow.follower_id);
      // Users テーブルから follower の詳細情報を取得
      const { data: usersData, error: usersError } = await supabase
        .from('Users')
        .select('id, username, email')
        .in('id', followerIds);
        
      if (usersError) {
        console.error('Error fetching followers details:', usersError); // エラーハンドリング
      } else {
        setFollowers(usersData); // フォロワーをステートに設定
      }
    }
  };

  // フォロワーを取得する関数を呼び出す
  const handleFetchFollowers = () => {
    if (currentUserId) {
      fetchFollowers(currentUserId); // フォロワーを取得
      setShowFollowersModal(true); // フォロワーモーダルを表示
    }
  };

  // ユーザー検索処理
  const handleSearch = async () => {
    const { data, error } = await supabase
      .from("Users")
      .select("id, username, email")
      .ilike("email", `%${searchEmail}%`); // メールアドレスで検索

    if (error) {
      console.error("Error searching users:", error); // エラーハンドリング
    } else {
      setSearchResults(data); // 検索結果をステートに設定
      setShowUserSearchModal(true); // 検索結果モーダルを表示
    }
  };

  // ユーザークリック時の処理
  const handleUserClick = (userId: string) => {
    // ユーザーのカレンダーを表示するためにリダイレクト
    router.push(`/other-calendar/${userId}`);
  };

  // Supabaseから取得したエントリーデータをFullCalendar用のイベントに変換
  const events = entries.map((entry) => {
    if (entry.is_all_day) {
      return {
        id: entry.id,
        title: entry.title,
        start: entry.start_time ? entry.start_time.split("T")[0] : "", // "YYYY-MM-DD"
        end: entry.end_time ? entry.end_time.split("T")[0] : "", // 終日イベントのため日付のみ
        allDay: true,
      };
    } else {
      return {
        id: entry.id,
        title: entry.title,
        start: entry.start_time,
        end: entry.end_time,
        allDay: false,
      };
    }
  });

  // 日付セルがクリックされた際の処理
  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setNewTitle(""); // 新しいタイトルをリセット
    setShowForm(true); // フォームを表示
    setSelectedEventId(""); // 選択されたイベントIDをリセット
  };

  // 予定の編集処理
  const handleEventClick = (arg: { event: { id: string } }) => {
    const event = entries.find(entry => entry.id === arg.event.id);
    if (event) {
      setNewTitle(event.title); // 既存のタイトルを設定
      setSelectedDate(event.start_time.split("T")[0]); // 日付を設定
      setShowForm(true); // フォームを表示
      setSelectedEventId(event.id); // 選択されたイベントIDを設定
    }
  };

  // 予定の更新処理
  const handleUpdateEvent = async () => {
    if (!currentUserId || !selectedEventId) return; // selectedEventIdが必要

    const { error } = await supabase
      .from("Entries")
      .update({ title: newTitle }) // タイトルを更新
      .eq("id", selectedEventId); // IDでフィルタリング

    if (error) {
      console.error("Error updating event:", error); // エラーハンドリング
    } else {
      fetchEntries(currentUserId); // 一覧を更新
      setShowForm(false); // フォームを非表示
      setNewTitle(""); // タイトルをリセット
    }
  };

  // 予定の削除処理
  const handleDeleteEvent = async () => {
    if (!selectedEventId) return; // selectedEventIdが必要

    const { error } = await supabase
      .from("Entries")
      .delete()
      .eq("id", selectedEventId); // IDでフィルタリング

    if (error) {
      console.error("Error deleting event:", error); // エラーハンドリング
    } else {
      if (currentUserId) { // currentUserIdがnullでないことを確認
        fetchEntries(currentUserId); // 一覧を更新
      }
      setShowForm(false); // フォームを非表示
      setNewTitle(""); // タイトルをリセット
    }
  };

  // 予定追加処理
  const handleAddEvent = async () => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("Entries")
      .insert([
        {
          user_id: currentUserId,
          entry_type: "event",
          title: newTitle,
          content: "",
          start_time: `${selectedDate}T00:00:00`, // ここでstart_timeを設定
          end_time: `${selectedDate}T23:59:59`, // ここでend_timeを設定
          is_all_day: true, // all_dayをtrueに設定
          location: null,
        },
      ]);

    if (error) {
      console.error("Error adding event:", error); // エラーハンドリング
    } else {
      fetchEntries(currentUserId); // 一覧を更新
      setShowForm(false); // フォームを非表示
      setNewTitle(""); // タイトルをリセット
    }
  };

  return (
    <div className="relative min-h-screen p-4 bg-gray-100">
      {/* ヘッダーを絶対配置 */}
      <div className="absolute top-0 left-0 w-full z-10">
      <CalendarHeader
        userAvatarUrl={userAvatarUrl}
        userName={userName}
        showSearch={true}
        setShowSearch={() => {}}
        searchEmail={searchEmail}
        setSearchEmail={setSearchEmail}
        handleSearch={handleSearch}
        onSearchModalOpen={() => setShowUserSearchModal(true)}
      />
      </div>

      {/* ユーザー検索モーダル */}
      {showUserSearchModal && (
        <UserSearchModal
          searchEmail={searchEmail}
          setSearchEmail={setSearchEmail}
          handleSearch={handleSearch}
          onClose={() => setShowUserSearchModal(false)}
          onUserClick={handleUserClick}
          searchResults={searchResults}
        />
      )}
      <div className="absolute top-4 right-4">
        <button onClick={() => setShowFollowingModal(true)} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          フォロー中
        </button>
        <button onClick={handleFetchFollowers} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ml-2">
          フォロワー
        </button>
      </div>

      {loading ? (
        <p>Loading entries...</p>
      ) : (
        <CalendarView
          events={events}
          handleDateClick={handleDateClick}
          handleEventClick={handleEventClick}
        />
      )}

      {showForm && (
        <EventFormModal
          selectedDate={selectedDate}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          setShowForm={setShowForm}
          selectedEventId={selectedEventId}
          handleUpdateEvent={handleUpdateEvent}
          handleDeleteEvent={handleDeleteEvent}
          handleAddEvent={handleAddEvent}
        />
      )}

      {/* Following Users Modal */}
      {showFollowingModal && (
        <FollowingModal
          followingUsers={followingUsers}
          onClose={() => setShowFollowingModal(false)}
          onUserClick={(userId) => { handleUserClick(userId) }}
        />
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <FollowersModal
          followers={followers}
          onClose={() => setShowFollowersModal(false)}
          onUserClick={(userId) => { handleUserClick(userId) }}
        />
      )}
    </div>
  );
}