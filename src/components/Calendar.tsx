import React, { useState } from "react";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, subMonths, addMonths } from "date-fns";
import "./Calendar.css";
import { Event } from "../app/types";

interface CalendarProps {
  events: Event[];
  editable?: boolean;
  selectable?: boolean;
  dateClick?: (arg: { dateStr: string }) => void;
  eventClick?: (arg: { event: { id: string; title: string } }) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, editable, selectable, dateClick, eventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
        {days.map((day, index) => (
          <div key={index} className={`calendar-day ${format(day, "MM") !== format(monthStart, "MM") ? "other-month" : ""}`} onClick={() => dateClick && dateClick({ dateStr: format(day, "yyyy-MM-dd") })}>
            {format(day, "d")}
            <div className="event-container">
              {events.filter(event => format(event.created_at, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).map(event => (
                <div key={event.id} className="event" onClick={(e) => {
                  e.stopPropagation(); // Prevents date click from triggering
                  console.log("イベントクリック:", event.id);
                  if (eventClick) {
                    eventClick({ event: { id: event.id, title: event.title } });
                  }
                }}>
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