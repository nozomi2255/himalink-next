"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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
      .single(); // Get a single user

    if (userError) {
      console.error('Error fetching user data:', userError);
    } else {
      setUserName(userData.username); // Set the username
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{userName ? `${userName}'s Calendar` : "Loading..."}</h1>
      {loading ? (
        <p>Loading entries...</p>
      ) : (
        <div className="mt-4">
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
    </div>
  );
}