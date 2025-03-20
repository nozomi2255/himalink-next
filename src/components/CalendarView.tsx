"use client";

import React, { useState } from "react";
import Calendar from "./Calendar";
import { Event } from '../app/types';
import EventFormModal from "./EventFormModal";

interface CalendarViewProps {
  events: Event[]; // eventsの型をEvent[]に変更
}

export default function CalendarView({ events }: CalendarViewProps) {

  // EventFormModal の表示状態を管理（初期状態は非表示）
  const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");

  // 日付がクリックされたときの処理
  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setSelectedEventId(""); // 追加の場合はイベントIDは空にする
    setSelectedEventTitle(""); // 追加の場合はタイトルは空にする
    setIsEventFormModalOpen(true);
  };

  // イベントがクリックされたときの処理
  const handleEventClick = (arg: { event: { id: string, title: string } }) => {
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
      <Calendar 
        events={events} 
        editable={true} 
        selectable={true} 
        dateClick={handleDateClick} 
        eventClick={handleEventClick}
      />
      {isEventFormModalOpen && (
        <EventFormModal 
          selectedDate={selectedDate}
          selectedEventId={selectedEventId} 
          selectedEventTitle={selectedEventTitle}
          onClose={handleCloseEventFormModal}
        />
      )}
    </div>
  );
}