"use client";

import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Event } from '../app/types';
import EventFormModal from "./EventFormModal";

interface CalendarViewProps {
  events: Event[]; // eventsの型をEvent[]に変更
}

export default function CalendarView({ events }: CalendarViewProps) {

  // FullCalendar が期待する形式に変換
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start_time, // FullCalendar expects 'start'
    end: event.end_time,     // FullCalendar expects 'end'
    allDay: event.is_all_day,
  }));

  // EventFormModal の表示状態を管理（初期状態は非表示）
  const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");

  // 日付がクリックされたときの処理
  const handleDateClick = (arg: { dateStr: string }) => {
    console.log("クリックされた日付:", arg.dateStr);
    setSelectedDate(arg.dateStr);
    setSelectedEventId(""); // 追加の場合はイベントIDは空にする
    setSelectedEventTitle(""); // 追加の場合はタイトルは空にする
    setIsEventFormModalOpen(true);
  };

  // イベントがクリックされたときの処理
  const handleEventClick = (arg: { event: { id: string, title: string } }) => {
    console.log("クリックされたイベントID:", arg.event.id);
    setSelectedEventId(arg.event.id);
    setSelectedEventTitle(arg.event.title); // クリックされたイベントのタイトルを設定
    setIsEventFormModalOpen(true);
  };
  
  // モーダルを閉じる処理
  const handleCloseEventFormModal: () => void = () => {
    console.log("handleCloseEventFormModal called");
    setIsEventFormModalOpen(false);
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] mt-0">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "",
          center: "title",
          right: "",
          //toolbarの設定タイトル以外は廃止
          // 代わりに month/week/day/today の機能は customButtons か
          // 独自の状態管理を利用して実装する
        }}
        events={calendarEvents}
        editable={true}
        selectable={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="100%"
      />
      <div className="z-50">
      {isEventFormModalOpen && (
        <EventFormModal 
          selectedDate={selectedDate}
          selectedEventId={selectedEventId} 
          selectedEventTitle={selectedEventTitle}
          onClose={handleCloseEventFormModal}
        />
      )}
      </div>
    </div>
  );
}