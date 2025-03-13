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
    <div className="w-full h-[calc(100vh-80px)] mt-0">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "",
          center: "title",
          right: ""
          //toolbarの設定タイトル以外は廃止
          // 代わりに month/week/day/today の機能は customButtons か
          // 独自の状態管理を利用して実装する
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