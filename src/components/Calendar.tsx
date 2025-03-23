"use client";

import React, { useState, useEffect } from "react";
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, addDays, format, subMonths, addMonths, isBefore, isAfter 
} from "date-fns";
import "./Calendar.css";
import { Event } from "../app/types";

interface CalendarProps {
  events: Event[];
  editable?: boolean;
  selectable?: boolean;
  dateClick?: (arg: { dateStr: string }) => void;
  eventClick?: (arg: { event: { id: string; title: string } }) => void;
  dragDateChange?: (arg: { startDate: string; endDate: string }) => void;
  modalOpen?: boolean;
  modalPosition: { top: number; left: number };
  setModalPosition: React.Dispatch<React.SetStateAction<{ top: number; left: number }>>;
}

const Calendar: React.FC<CalendarProps> = ({ events, editable, selectable, dateClick, eventClick, dragDateChange, modalOpen, modalPosition, setModalPosition }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [clickedDate, setClickedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!modalOpen) {
      setClickedDate(null);
    }
  }, [modalOpen]);

  // 月の開始・終了・週の開始・終了を取得
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // 日付データを作成
  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // ドラッグ中に選択されているセルか判定する関数
  const isDragSelected = (day: Date) => {
    if (dragStart && dragEnd) {
      const start = new Date(dragStart);
      const end = new Date(dragEnd);
      return !isBefore(day, start) && !isAfter(day, end);
    }
    return false;
  };

  // マウスイベントハンドラー
  const handleMouseDown = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    setDragStart(dateStr);
    setDragEnd(dateStr);
  };

  const handleMouseEnter = (day: Date) => {
    if (dragStart) {
      setDragEnd(format(day, "yyyy-MM-dd"));
    }
  };

  const handleMouseUp = () => {
    if (dragStart && dragEnd && dragDateChange) {
      dragDateChange({ startDate: dragStart, endDate: dragEnd });
    }
    // 状態をリセットする場合（モーダルを開くなどの別処理と組み合わせても良い）
    setDragStart(null);
    setDragEnd(null);
  };

  const handleDateClick = (event: React.MouseEvent, dateStr: string) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const newPosition = { top: rect.top + window.scrollY, left: rect.right + 10 };
    console.log("Modal Position:", newPosition);
    setModalPosition(newPosition);
    setClickedDate(dateStr);
    dateClick && dateClick({ dateStr });
  };

  return (
    <div className="calendar-container">
      {/* ナビゲーション */}
      <div className="calendar-header">
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}>←</button>
        <h2>{format(currentDate, "MMMM yyyy")}</h2>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}>→</button>
      </div>

      {/* カレンダーのヘッダー（曜日） */}
      <div className="calendar-grid calendar-header-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
      </div>

      {/* 日付セル */}
      <div className="calendar-grid">
        {days.map((day, index) => {
          const dateStr = format(day, "yyyy-MM-dd");
          return (
            <div
              key={index}
              className={`calendar-day ${format(day, "MM") !== format(monthStart, "MM") ? "other-month" : ""} ${isDragSelected(day) ? "drag-selected" : ""}`}
              onMouseDown={() => handleMouseDown(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              onMouseUp={handleMouseUp}
              onClick={(event) => handleDateClick(event, dateStr)}
            >
              <div className="day-number">{format(day, "d")}</div>
              <div className="event-container">
                {events
                  .filter(event => {
                    const eventStart = startOfDay(new Date(event.start_time));
                    const eventEnd = startOfDay(new Date(event.end_time));
                    const cellDay = startOfDay(day);
                    return cellDay >= eventStart && cellDay <= eventEnd;
                  })
                  .map(event => (
                    <div
                      key={event.id}
                      className="event"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("イベントクリック:", event.id);
                        if (eventClick) {
                          eventClick({ event: { id: event.id, title: event.title } });
                        }
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                {/* クリックされた日付に対して、デフォルトのイベントコンテナを追加 */}
                {clickedDate === dateStr && (
                  <div className="event default-event">
                    New Event
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;