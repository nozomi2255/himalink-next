"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import CalendarView from "../../../../components/CalendarView";
import { HomeIcon } from '@heroicons/react/24/outline';
import CalendarHeader from "../../../../components/CalendarHeader";
import UserSearchModal from "../../../../components/UserSearchModal";

interface Entry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
}

export default function OtherCalendarPage() {
  const { userId } = useParams();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth");
      } else {
        setCurrentUserId(session.user.id);
        if (userId) {
          fetchOtherEntries(Array.isArray(userId) ? userId[0] : userId);
        }
        checkFollowStatus(session.user.id, userId as string);
      }
    };
    checkSessionAndFetch();
  }, [router, userId]);

  const fetchOtherEntries = async (userId: string) => {
    setLoading(true);

    // Fetch user information
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user data:', userError);
    } else {
      setUserName(userData?.username || null);
      setUserAvatarUrl(userData?.avatar_url || null);
    }

    // Fetch entries for the user
    const { data, error } = await supabase
      .from('Entries')
      .select('id, user_id, title, content, start_time, end_time, is_all_day')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries(data);
    }
    setLoading(false);
  };

  const events = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    start: entry.start_time,
    end: entry.end_time,
    allDay: entry.is_all_day,
  }));

  const checkFollowStatus = async (currentUserId: string, targetUserId: string) => {
    const { data, error } = await supabase
      .from("Follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (error) {
      console.error("Error checking follow status:", error);
    } else {
      setIsFollowing(!!data); // フォロー中かどうかを設定
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || !userId) return;

    const { error } = await supabase
      .from("Follows")
      .insert([{ follower_id: currentUserId, following_id: userId }]); 

    if (error) {
      console.error("Error following user:", error);
    } else {
      setIsFollowing(true); // フォロー状態を更新
    }
  };

  const handleUnfollow = async () => {
    if (!currentUserId || !userId) return;

    const { error } = await supabase
      .from("Follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", userId);

    if (error) {
      console.error("Error unfollowing user:", error);
    } else {
      setIsFollowing(false); // フォロー状態を更新
    }
  };

  return (
    <div className="relative min-h-screen p-4 bg-gray-100">
      <div className="absolute top-0 left-0 w-full z-10">
        <CalendarHeader
          userAvatarUrl={userAvatarUrl}
          userName={userName}
          showSearch={false}
          setShowSearch={() => {}}
          searchEmail={""}
          setSearchEmail={() => {}}
          handleSearch={() => {}}
          onAvatarClick={() => {}}  // ここで何も行わないように指定
          onSearchModalOpen={() => setShowSearchModal(true)}
        />
      </div>
      <div className="p-4">
        <button
          onClick={() => router.push('/calendar')}
          className="absolute left-5 top-4 transform -translate-y-1/2 flex items-center bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
        >
          <HomeIcon className="h-5 w-5 mr-2" />
        </button>
        {loading ? (
          <p>Loading entries...</p>
        ) : (
          <div className="mt-4">
            <CalendarView
              events={events}
              handleDateClick={() => {}}
              handleEventClick={() => {}}
            />
          </div>
        )}
        <div className="mt-4">
          {isFollowing ? (
            <button
              onClick={handleUnfollow}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Unfollow
            </button>
          ) : (
            <button
              onClick={handleFollow}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Follow
            </button>
          )}
        </div>
      </div>
      {showSearchModal && (
        <UserSearchModal
          searchEmail={""}
          setSearchEmail={() => {}}
          handleSearch={() => {
            setShowSearchModal(false);
          }}
          onClose={() => setShowSearchModal(false)}
          searchResults={[]}
          onUserClick={() => {}}
        />
      )}
    </div>
  );
}