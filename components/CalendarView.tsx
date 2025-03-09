"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

// Entryインターフェースの定義
interface Entry {
  id: string;
  title: string;
  start: string; // ISO 8601 format
  end?: string; // ISO 8601 format
  allDay?: boolean; // 終日イベントかどうか
}

interface CalendarViewProps {
  events: Entry[]; // eventsの型をEntry[]に変更
  handleDateClick: (arg: { dateStr: string }) => void;
  handleEventClick: (arg: { event: { id: string } }) => void;
}

export default function CalendarView({ events, handleDateClick, handleEventClick }: CalendarViewProps) {
  return (
    <div className="w-full h-[calc(100vh-200px)] mt-4">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={true}
        selectable={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="100%"
      />
    </div>
  );
}