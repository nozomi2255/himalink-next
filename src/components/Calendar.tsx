"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, addDays, format, subMonths, addMonths, isBefore, isAfter, isSameMonth
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

  const getWeeksBetween = (months: Date[]): Date[][] => {
    const first = startOfWeek(startOfMonth(months[0]));
    const last = endOfWeek(endOfMonth(months[months.length - 1]));

    const weeks: Date[][] = [];
    let current = first;

    while (current <= last) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(current);
        current = addDays(current, 1);
      }
      weeks.push(week);
    }

    return weeks;
  };

  const [currentDate, setCurrentDate] = useState(() => {
    const initialDate = new Date();
    return initialDate;
  });
  const visibleMonthRef = useRef<string>(format(currentDate, "yyyy-MM"));
  const [visibleMonth, setVisibleMonth] = useState<string>(visibleMonthRef.current);

  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [clickedDate, setClickedDate] = useState<string | null>(null);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const initialMonthList = Array.from({ length: 13 }, (_, i) =>
    addMonths(currentDate, i - 6)
  );
  const [monthList, setMonthList] = useState<Date[]>(initialMonthList);
  const [activeMonthIndex, setActiveMonthIndex] = useState(6);
  const calendarRef = useRef<HTMLDivElement>(null);
  const weeks = getWeeksBetween(monthList);
  const [animatingHeader, setAnimatingHeader] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const [barStyle, setBarStyle] = useState<React.CSSProperties | null>(null);

  useLayoutEffect(() => {
    if ((!selectedRange && !dragStart) || !calendarRef.current || clickedDate) return;

    const startDate = selectedRange ? selectedRange.start : dragStart;
    const endDate = selectedRange ? selectedRange.end : dragEnd;

    if (!startDate || !endDate) return;

    const start = startOfDay(new Date(startDate));
    const end = startOfDay(new Date(endDate));

    const allDays = weeks.flat().filter(day => {
      const current = startOfDay(day);
      return current >= start && current <= end;
    });

    if (allDays.length === 0) return;

    const firstDayEl = document.querySelector(`[data-date="${format(allDays[0], "yyyy-MM-dd")}"]`) as HTMLElement;
    const lastDayEl = document.querySelector(`[data-date="${format(allDays[allDays.length - 1], "yyyy-MM-dd")}"]`) as HTMLElement;

    if (!firstDayEl || !lastDayEl) return;

    const startTop = firstDayEl.offsetTop;
    const startLeft = firstDayEl.offsetLeft;
    const endRight = lastDayEl.offsetLeft + lastDayEl.offsetWidth;

    const top = startTop + 24; // match .day-number top margin
    const left = startLeft;
    const width = endRight - startLeft;

    setBarStyle({ top: `${top}px`, left: `${left}px`, width: `${width}px` });
  }, [selectedRange, dragStart, dragEnd, clickedDate, monthList]);

  useEffect(() => {
  if (!modalOpen) {
    setSelectedRange(null);
    setClickedDate(null);
    setBarStyle(null);
  }
  }, [modalOpen]);

  useEffect(() => {
    const container = calendarRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollThreshold = 300;
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;

      if (nearBottom) {
        const lastMonth = monthList[monthList.length - 1];
        const nextMonth = addMonths(lastMonth, 1);
        if (!monthList.some(m => format(m, "yyyy-MM") === format(nextMonth, "yyyy-MM"))) {
          setMonthList(prev => [...prev, nextMonth]);
        }
      }

      const nearTop = container.scrollTop < scrollThreshold;

      if (nearTop) {
        const firstMonth = monthList[0];
        const prevMonth = subMonths(firstMonth, 1);
        if (!monthList.some(m => format(m, "yyyy-MM") === format(prevMonth, "yyyy-MM"))) {
          setMonthList(prev => [prevMonth, ...prev]);
          // Maintain scroll position to prevent jump
          container.scrollTop += container.scrollHeight;
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [monthList]);

  useEffect(() => {
    const container = calendarRef.current;
    if (!container) return;

    const handleScroll = () => {
      const days = Array.from(container.querySelectorAll(".calendar-day")) as HTMLDivElement[];
      const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;

      let closestDate: Date | null = null;
      let minDistance = Infinity;

      days.forEach((dayEl) => {
        const rect = dayEl.getBoundingClientRect();
        const dayCenter = rect.top + rect.height / 2;
        const distance = Math.abs(dayCenter - containerCenter);

        if (distance < minDistance) {
          minDistance = distance;
          const dateStr = dayEl.dataset.date;
          if (dateStr) {
            closestDate = new Date(dateStr);
          }
        }
      });

      if (closestDate) {
        const newMonth = format(closestDate, "yyyy-MM");
        if (newMonth !== visibleMonthRef.current) {
          visibleMonthRef.current = newMonth;
          setVisibleMonth(newMonth);
          setCurrentDate(closestDate);
          setAnimatingHeader(true);
          setTimeout(() => {
            setAnimatingHeader(false);
          }, 300);
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [monthList]);

  useEffect(() => {
    const container = calendarRef.current;
    if (!container) return;

    const todayEl = container.querySelector(`[data-date="${format(new Date(), 'yyyy-MM-dd')}"]`) as HTMLElement;

    if (todayEl) {
      const containerCenter = container.clientHeight / 2;
      const todayPosition = todayEl.offsetTop + todayEl.clientHeight / 2;

      container.scrollTop = todayPosition - containerCenter;
    }
  }, []);

  const monthStart = startOfMonth(monthList[activeMonthIndex]);
  const monthEnd = endOfMonth(monthStart);


  const isDragSelected = (day: Date) => {
    if (dragStart && dragEnd) {
      const start = startOfDay(new Date(dragStart));
      const end = startOfDay(new Date(dragEnd));
      const currentDay = startOfDay(day);

      // ドラッグ範囲の日付を全て含む
      return currentDay >= start && currentDay <= end;
    }
    // ドラッグが始まったばかりで終了日が未定の場合でも開始日は選択済みにする
    if (dragStart && !dragEnd) {
      return format(day, 'yyyy-MM-dd') === dragStart;
    }
    return false;
  };

  const handleMouseDown = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    setDragStart(dateStr);
    setClickedDate(null);
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
      setSelectedRange({ start: dragStart, end: dragEnd }); // ←追加
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
    <div className="calendar-container" ref={calendarRef} style={{ userSelect: dragStart ? 'none' : 'auto' }}>
      <div className="multi-day-events-layer">
        {(barStyle && !clickedDate) && (
          <div
            className="multi-day-event-bar"
            style={barStyle}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Event bar clicked");
            }}
          >
            Event
          </div>
        )}
      </div>
      <div className="calendar-header-sticky">
        <div className={`calendar-header-title ${animatingHeader ? `animating ${scrollDirection}` : ""}`}>
          <h2>{format(currentDate ?? new Date(), "MMMM yyyy")}</h2>
        </div>
        <div className="weekday-row">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={idx} className="weekday-cell">{day}</div>
          ))}
        </div>
      </div>
      <div className="calendar-grid">
        {weeks.flat().map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${isSameMonth(day, currentDate) ? 'current-month' : 'other-month'}`}
            data-date={format(day, "yyyy-MM-dd")}
            onMouseDown={() => handleMouseDown(day)}
            onMouseEnter={() => handleMouseEnter(day)}
            onMouseUp={handleMouseUp}
            onClick={(event) => handleDateClick(event, format(day, "yyyy-MM-dd"))}
          >
            <div className="day-number">{format(day, "d")}</div>
            <div className="event-container">
              {clickedDate === format(day, "yyyy-MM-dd") && (
                <div className="event default-event">New Event</div>
              )}

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
                      eventClick && eventClick({ event: { id: event.id, title: event.title } });
                    }}
                  >
                    {event.title}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;