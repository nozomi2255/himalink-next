"use client";

import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";
import { Event } from '../app/types';
import EventFormModal from "./EventFormModal";

export default function CalendarView() {
  const [events, setEvents] = useState<Event[]>([]);

  // イベント一覧を取得する関数（fetchを使う）
  const fetchEvents = async () => {
    const res = await fetch(`/api/event`, { cache: "no-store" });
    if (res.ok) {
      const data: Event[] = await res.json();
      setEvents(data);
    } else {
      console.error("Failed to fetch events");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // EventFormModal の表示状態を管理（初期状態は非表示）
  const [isEventFormModalOpen, setIsEventFormModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

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
    fetchEvents(); // モーダルを閉じる際に最新のイベントを取得
    setIsEventFormModalOpen(false);
  };

  const handleDragDateChange = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    setSelectedRange({ startDate, endDate });
    setIsEventFormModalOpen(true);
  };

  useEffect(() => {
    if (!isEventFormModalOpen) {
      fetchEvents(); // モーダルが閉じられたときにイベントを再フェッチ
    }
  }, [isEventFormModalOpen]);

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <Calendar 
        events={events} 
        editable={true} 
        selectable={true} 
        dateClick={(arg) => {
          setSelectedDate(arg.dateStr);
          setSelectedEventId("");
          setSelectedEventTitle("");
          setIsEventFormModalOpen(true);
        }}
        eventClick={(arg) => {
          setSelectedEventId(arg.event.id);
          setSelectedEventTitle(arg.event.title);
          setIsEventFormModalOpen(true);
        }}
        dragDateChange={handleDragDateChange}
        modalOpen={isEventFormModalOpen}
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
      />
      {isEventFormModalOpen && (
        <EventFormModal
          selectedStartDate={selectedRange?.startDate || ""}
          selectedEndDate={selectedRange?.endDate || ""}
          selectedEventId={selectedEventId}
          selectedEventTitle={selectedEventTitle}
          modalPosition={modalPosition}
          onClose={handleCloseEventFormModal}
        />
      )}
    </div>
  );
}