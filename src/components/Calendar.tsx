"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [previousMonth, setPreviousMonth] = useState(subMonths(currentDate, 1));
  const [nextMonth, setNextMonth] = useState(addMonths(currentDate, 1));
  const [activeMonth, setActiveMonth] = useState<'previous' | 'current' | 'next'>('current');
  const [transitioning, setTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'previous' | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (!modalOpen) {
      setClickedDate(null);
    }
  }, [modalOpen]);

  useEffect(() => {
    const container = calendarRef.current;
    if (!container) return;

    let accumulatedScroll = 0;
    const SCROLL_THRESHOLD = 100; // 月変更の閾値

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // ブラウザのデフォルトスクロールを防ぐ
      accumulatedScroll += e.deltaY;
      setScrollOffset(accumulatedScroll);

      if (accumulatedScroll > SCROLL_THRESHOLD) {
        handleMonthChange('next');
        accumulatedScroll = 0;
        setScrollOffset(0);
      } else if (accumulatedScroll < -SCROLL_THRESHOLD) {
        handleMonthChange('previous');
        accumulatedScroll = 0;
        setScrollOffset(0);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [nextMonth, previousMonth]);

  const handleMonthChange = (direction: 'next' | 'previous') => {
    setActiveMonth(direction);
    setTimeout(() => {
      setCurrentDate(direction === 'next' ? nextMonth : previousMonth);
      setScrollOffset(0);
      setActiveMonth('current');
    }, 300); // CSSトランジション時間に合わせる
  };

  useEffect(() => {
    setPreviousMonth(subMonths(currentDate, 1));
    setNextMonth(addMonths(currentDate, 1));
  }, [currentDate]);

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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = addDays(startDate, 41);

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const isDragSelected = (day: Date) => {
    if (dragStart && dragEnd) {
      const start = new Date(dragStart);
      const end = new Date(dragEnd);
      return !isBefore(day, start) && !isAfter(day, end);
    }
    return false;
  };

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
    <div className="calendar-container" ref={calendarRef}>
      <div
        className="calendar-month previous-month"
        style={{ transform: `translateY(calc(-100% + ${scrollOffset}px))` }}
      >
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

      <div
        className="calendar-month current-month"
        style={{ transform: `translateY(${scrollOffset}px)` }}
      >
        <h2>{format(currentDate, "MMMM yyyy")}</h2>
        <div className="calendar-grid calendar-header-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
        </div>

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

      <div
        className="calendar-month next-month"
        style={{ transform: `translateY(calc(100% + ${scrollOffset}px))` }}
      >
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