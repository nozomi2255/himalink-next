// src/app/page.tsx
"use client";

import CalendarHeader from "../components/CalendarHeader";
import CalendarView from "../components/CalendarView";
import EventFormModal from "../components/EventFormModal";
import FollowingModal from "../components/FollowingModal";
import FollowersModal from "../components/FollowersModal";
import UserSearchModal from "../components/UserSearchModal";

export default function CalendarPage() {
  return (
    <div className="relative min-h-screen p-4 bg-gray-100">
      {/* ヘッダー */}
      <div className="absolute top-0 left-0 w-full z-10">
        <CalendarHeader 
          // 必要に応じたpropsを渡す
          userAvatarUrl="/path/to/default-avatar.png" 
          userName="ユーザー名" 
          showSearch={true}
          setShowSearch={() => {}}
          searchEmail=""
          setSearchEmail={() => {}}
          handleSearch={() => {}}
          onSearchModalOpen={() => {}}
        />
      </div>

      {/* ユーザー検索モーダル */}
      <UserSearchModal
        searchEmail=""
        setSearchEmail={() => {}}
        handleSearch={() => {}}
        onClose={() => {}}
        onUserClick={(userId) => {}}
        searchResults={[]}
      />

      {/* フォロー/フォロワーボタン */}
      <div className="absolute top-4 right-4 space-x-2">
        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          フォロー中
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          フォロワー
        </button>
      </div>

      {/* カレンダー表示 */}
      <CalendarView 
        // カレンダー用のイベント情報等のpropsを必要に応じて渡す
        events={[]}
        handleDateClick={() => {}}
        handleEventClick={() => {}}
      />

      {/* イベントフォーム（追加・編集用） */}
      <EventFormModal 
        // 必要なpropsを渡す
        selectedDate=""
        newTitle=""
        setNewTitle={() => {}}
        setShowForm={() => {}}
        selectedEventId=""
        handleUpdateEvent={() => {}}
        handleDeleteEvent={() => {}}
        handleAddEvent={() => {}}
      />

      {/* フォロー中モーダル */}
      <FollowingModal 
        followingUsers={[]}
        onClose={() => {}}
        onUserClick={(userId) => {}}
      />

      {/* フォロワーモーダル */}
      <FollowersModal 
        followers={[]}
        onClose={() => {}}
        onUserClick={(userId) => {}}
      />
    </div>
  );
}