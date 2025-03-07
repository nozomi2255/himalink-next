"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { HomeIcon } from '@heroicons/react/24/outline';

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
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

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
      .select('username')
      .eq('id', userId)
      .maybeSingle(); // Get a single user

    if (userError) {
      console.error('Error fetching user data:', userError);
    } else {
      setUserName(userData?.username || null); // Set the username
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
    // ホームに戻るボタン
    <div className="p-4">
      <h1 className="text-2xl font-bold">{userName ? `${userName}'s Calendar` : "Loading..."}</h1>
      <button
        onClick={() => router.push('/calendar')}
        className="mt-4 flex items-center bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
      >
        <HomeIcon className="h-5 w-5 mr-2" />
      </button>
      {loading ? (
        <p>Loading entries...</p>
      ) : (
        <div className="mt-4">
          {/* カレンダー表示 */}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            editable={false} // 他人の予定は編集不可とする場合
            height="auto"
          />
        </div>
      )}
      {currentUserId && <p>Current User ID: {currentUserId}</p>}
      <div className="mt-4">
        {isFollowing ? (
          // フォロー解除ボタン
          <button
            onClick={handleUnfollow}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Unfollow
          </button>
        ) : (
          // フォローするボタン
          <button
            onClick={handleFollow}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Follow
          </button>
        )}
      </div>
    </div>
  );
}