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
  const initialMonthList = Array.from({ length: 13 }, (_, i) =>
    addMonths(currentDate, i - 6)
  );
  const [monthList, setMonthList] = useState<Date[]>(initialMonthList);
  const [activeMonthIndex, setActiveMonthIndex] = useState(6);
  const [transitioning, setTransitioning] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modalOpen) {
      setClickedDate(null);
    }
  }, [modalOpen]);

  const monthStart = startOfMonth(monthList[activeMonthIndex]);
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
      <div className="calendar-months-wrapper">
        {monthList.map((month, index) => {
          const monthStart = startOfMonth(month);
          const startDate = startOfWeek(monthStart);
          const endDate = addDays(startDate, 41);
          const days: Date[] = [];

          let day = startDate;
          while (day <= endDate) {
            days.push(day);
            day = addDays(day, 1);
          }

          return (
            <div
              key={index}
              className={`calendar-month ${index === activeMonthIndex ? 'active' : ''} ${transitioning ? (index > activeMonthIndex ? 'slide-down' : 'slide-up') : ''}`}
            >
              <h2>{format(month, "MMMM yyyy")}</h2>
              <div className="calendar-grid">
                {days.map((day, dayIndex) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  return (
                    <div
                      key={dayIndex}
                      className={`calendar-day ${format(day, "MM") !== format(month, "MM") ? "other-month" : ""} ${isDragSelected(day) ? "drag-selected" : ""}`}
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
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;