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
  // 現在の日付を管理する状態
  const [currentDate, setCurrentDate] = useState(new Date());
  // ドラッグ開始日と終了日を管理する状態
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  // クリックされた日付を管理する状態
  const [clickedDate, setClickedDate] = useState<string | null>(null);
  // 前月と次月の日付を管理する状態
  const [previousMonth, setPreviousMonth] = useState(subMonths(currentDate, 1));
  const [nextMonth, setNextMonth] = useState(addMonths(currentDate, 1));
  // アクティブな月を管理する状態
  const [activeMonth, setActiveMonth] = useState<'previous' | 'current' | 'next'>('current');

  // モーダルが閉じられたときにクリックされた日付をリセット
  useEffect(() => {
    if (!modalOpen) {
      setClickedDate(null);
    }
  }, [modalOpen]);

  // スクロールイベントで月を切り替える
  useEffect(() => {
    const container = document.querySelector(".calendar-container") as HTMLElement;
    if (!container) return;

    let lastScrollTime = 0;
    const SCROLL_DELAY = 500; // スクロールの遅延時間（ミリ秒）

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < SCROLL_DELAY) return;

      if (e.deltaY > 30) {
        handleMonthChange('next');
        lastScrollTime = now;
      } else if (e.deltaY < -30) {
        handleMonthChange('previous');
        lastScrollTime = now;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: true });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // 月を切り替える関数
  const handleMonthChange = (direction: 'next' | 'previous') => {
    if (direction === 'next') {
      setActiveMonth('next');
      setTimeout(() => {
        setCurrentDate(nextMonth);
        setActiveMonth('current');
      }, 1000); // アニメーションの時間に合わせる
    } else {
      setActiveMonth('previous');
      setTimeout(() => {
        setCurrentDate(previousMonth);
        setActiveMonth('current');
      }, 1000);
    }
  };

  // 現在の日付が変更されたときに前月と次月を更新
  useEffect(() => {
    setPreviousMonth(subMonths(currentDate, 1));
    setNextMonth(addMonths(currentDate, 1));
  }, [currentDate]);

  // アクティブな月をDOMに反映
  useEffect(() => {
    const months = document.querySelectorAll('.calendar-month');
    months.forEach((month, index) => {
      if (index === 1) {
        month.classList.add('active');
      } else {
        month.classList.remove('active');
      }
    });
  }, [activeMonth]);

  // 月の開始・終了・週の開始・終了を取得
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = addDays(startDate, 41); // 6週間分の日付を表示

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
      {/* 前月 */}
      <div className="calendar-month">
        <h2>{format(previousMonth, "MMMM yyyy")}</h2>
        <div className="calendar-grid">
          {days.map((day, index) => {
            const dateStr = format(day, "yyyy-MM-dd");
            return (
              <div
                key={index}
                className={`calendar-day ${format(day, "MM") !== format(previousMonth, "MM") ? "other-month" : ""} ${isDragSelected(day) ? "drag-selected" : ""}`}
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

      {/* 現在の月 */}
      <div className="calendar-month">
        <h2>{format(currentDate, "MMMM yyyy")}</h2>
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

      {/* 次月 */}
      <div className="calendar-month">
        <h2>{format(nextMonth, "MMMM yyyy")}</h2>
        <div className="calendar-grid">
          {days.map((day, index) => {
            const dateStr = format(day, "yyyy-MM-dd");
            return (
              <div
                key={index}
                className={`calendar-day ${format(day, "MM") !== format(nextMonth, "MM") ? "other-month" : ""} ${isDragSelected(day) ? "drag-selected" : ""}`}
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
    </div>
  );
};

export default Calendar;