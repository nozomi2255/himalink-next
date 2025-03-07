"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth");
      } else {
        setCurrentUserId(session.user.id);
        fetchOtherEntries();
      }
    };
    checkSessionAndFetch();
  }, [router]);

  const fetchOtherEntries = async () => {
    setLoading(true);
    const mockUserId = "ed967a9d-22a8-4e66-8f68-c8cd028ffffb";
    const { data, error } = await supabase
      .from("Entries")
      .select("id, user_id, title, content, start_time, end_time, is_all_day")
      .eq("user_id", mockUserId)
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching other entries:", error);
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
      <h1 className="text-2xl font-bold">Other Users' Calendars</h1>
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