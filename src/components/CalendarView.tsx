"use client";

import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";
import { Event } from '../app/types';
import EventFormModal from "./EventFormModal";
import { createClient } from "@/utils/supabase/client";

interface CalendarViewProps {
  userId?: string; // オプショナルにして、未指定の場合は現在のユーザーのイベントを取得
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const [events, setEvents] = useState<Event[]>([]);

  const supabase = createClient();

  // イベント一覧を取得する関数（RPCを使用）
  const fetchEvents = async () => {
    if (userId) {
      // 他のユーザーのイベントを取得
      const { data, error } = await supabase
        .rpc('get_user_events', { _user_id: userId });

      if (error) {
        console.error("Failed to fetch events:", error);
        return;
      }
      setEvents(data || []);
    } else {
      // 現在のユーザーのイベントを取得（既存の実装）
      const res = await fetch(`/api/event`, { cache: "no-store" });
      if (res.ok) {
        const data: Event[] = await res.json();
        setEvents(data);
      } else {
        console.error("Failed to fetch events");
      }
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userId]); // userIdが変更されたときにも再取得

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