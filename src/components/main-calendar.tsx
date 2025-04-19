"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, addDays, format, subMonths, addMonths, isBefore, isAfter, isSameMonth
} from "date-fns";
import { Event } from "../app/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// TODO: DBから取得したイベントコンテナに関しても、複数日の予定は、連なったイベントコンテナを表示するようにする。
// TODO: 月遷移のスクロールに関して、週単位か、月単位のスクロールしかできないように制限する。微妙なスクロールはできないようにする.
// TODO: ドラッグ時のモーダルポジションを修正する。


interface CalendarProps {
  avatarUrl: string | null;
  username: string;
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

interface BarStyle {
  top: string;
  left: string;
  width: string;
}

const Calendar: React.FC<CalendarProps> = ({ avatarUrl, username, events, editable, selectable, dateClick, eventClick, dragDateChange, modalOpen, modalPosition, setModalPosition }) => {

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
  const [barStyles, setBarStyles] = useState<BarStyle[]>([]);

  useLayoutEffect(() => {
    if ((!selectedRange && !dragStart) || !calendarRef.current || clickedDate) return;

    const startDate = selectedRange ? selectedRange.start : dragStart;
    const endDate = selectedRange ? selectedRange.end : dragEnd;

    if (!startDate || !endDate) return;

    const start = startOfDay(new Date(startDate));
    const end = startOfDay(new Date(endDate));

    // 日付の順序を正規化
    const [earlierDate, laterDate] = [start, end].sort((a, b) => a.getTime() - b.getTime());

    const allDays = weeks.flat().filter(day => {
      const current = startOfDay(day);
      return current >= earlierDate && current <= laterDate;
    });

    if (allDays.length === 0) return;

    // 週ごとにグループ化
    const weekGroups: Date[][] = [];
    let currentWeek: Date[] = [];
    
    allDays.forEach((day, index) => {
      if (currentWeek.length === 0 || day.getDay() > currentWeek[currentWeek.length - 1].getDay()) {
        currentWeek.push(day);
      } else {
        weekGroups.push(currentWeek);
        currentWeek = [day];
      }
      
      if (index === allDays.length - 1) {
        weekGroups.push(currentWeek);
      }
    });

    // 各週のバーのスタイルを計算
    const newBarStyles = weekGroups.map(weekDays => {
      const firstDayEl = document.querySelector(`[data-date="${format(weekDays[0], "yyyy-MM-dd")}"]`) as HTMLElement;
      const lastDayEl = document.querySelector(`[data-date="${format(weekDays[weekDays.length - 1], "yyyy-MM-dd")}"]`) as HTMLElement;

      if (!firstDayEl || !lastDayEl) return null;

      return {
        top: `${firstDayEl.offsetTop + 24}px`,
        left: `${firstDayEl.offsetLeft}px`,
        width: `${(lastDayEl.offsetLeft + lastDayEl.offsetWidth) - firstDayEl.offsetLeft}px`
      };
    }).filter((style): style is BarStyle => style !== null);

    setBarStyles(newBarStyles);
  }, [selectedRange, dragStart, dragEnd, clickedDate, monthList]);

  useEffect(() => {
    if (!modalOpen) {
      setSelectedRange(null);
      setClickedDate(null);
      setBarStyles([]);
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
      const days = Array.from(container.querySelectorAll("[data-date]")) as HTMLDivElement[];
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
      const start = new Date(dragStart);
      const end = new Date(dragEnd);
      // 日付の順序を正規化
      const [earlierDate, laterDate] = [start, end].sort((a, b) => a.getTime() - b.getTime());
      dragDateChange({ 
        startDate: format(earlierDate, "yyyy-MM-dd"), 
        endDate: format(laterDate, "yyyy-MM-dd") 
      });
      setSelectedRange({ 
        start: format(earlierDate, "yyyy-MM-dd"), 
        end: format(laterDate, "yyyy-MM-dd") 
      });
    }
    const dayElement = document.querySelector(`[data-date="${dragStart}"]`) as HTMLElement;
    if (!dayElement) return;
    const rect = dayElement.getBoundingClientRect();
    let newPosition = { top: rect.top + window.scrollY + 50, left: rect.right + 100 };
    if (dragStart) {
      const dayOfWeek = new Date(dragStart).getDay();
      if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) { // 木、金、土
        newPosition = { top: rect.top + window.scrollY + 50, left: rect.left - 100 }; // 左に表示
      }
    }
    setModalPosition(newPosition);

    setDragStart(null);
    setDragEnd(null);
  };

  const handleDateClick = (dateStr: string) => {
    const dayElement = document.querySelector(`[data-date="${dateStr}"]`) as HTMLElement;
    if (!dayElement) return;
    const rect = dayElement.getBoundingClientRect();
    let newPosition = { top: rect.top + window.scrollY + 50, left: rect.right + 155 };
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) { // 木、金、土
      newPosition = { top: rect.top + window.scrollY + 50, left: rect.left - 155 }; // 左に表示
    }
    setModalPosition(newPosition);
    setClickedDate(dateStr);
    dateClick && dateClick({ dateStr });
  };

  return (
    /* 1. カレンダー全体のコンテナ */
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden" ref={calendarRef} style={{ userSelect: dragStart ? 'none' : 'auto' }}>
      /* 2. 複数日イベントレイヤー */
      <div className="absolute inset-0 pointer-events-none z-50">
        {barStyles.map((style, index) => (
          <div
            key={index}
            className="absolute text-white text-xs px-2 py-0.5 bg-blue-200 rounded-lg italic shadow-md whitespace-nowrap overflow-hidden text-ellipsis z-[100] animate-fadeIn pointer-events-none"
            style={style}
          >
            New Event
          </div>
        ))}
      </div>
      /* 3. 固定ヘッダー部 */
      <div className="sticky top-0 z-[50] bg-white border-b border-gray-300 shadow-sm p-2">
        <div className="flex items-center justify-between px-2">
          <div className={`transition-opacity transition-transform duration-300 ${animatingHeader ? (scrollDirection === 'up' ? 'opacity-0 -translate-y-5' : 'opacity-0 translate-y-5') : ''}`}>
            <h2 className="text-xl font-bold m-0">{format(currentDate ?? new Date(), "MMMM yyyy")}</h2>
          </div>
          {/* アバター配置 */}
          <Avatar>
            <AvatarImage src={avatarUrl || "/default-avatar.png"} alt={username} />
            <AvatarFallback>{username?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex justify-between px-2 bg-gray-100 font-bold border-b border-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={idx} className="w-1/7 text-center py-2">{day}</div>
          ))}
        </div>
      </div>

      /* 4. カレンダー日付グリッド */
      <div className="grid grid-cols-7 w-full max-w-full box-border">
        {weeks.flat().map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={index}
              data-date={format(day, "yyyy-MM-dd")}
              onMouseDown={() => handleMouseDown(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              onMouseUp={handleMouseUp}
              onClick={() => handleDateClick(format(day, "yyyy-MM-dd"))}
              className={`relative min-h-[120px] pt-6 pb-1 box-border flex flex-col items-start border transition-colors duration-200 ease-in-out ${isCurrentMonth
                ? 'bg-white border-gray-300 hover:bg-blue-50 animate-fadeIn'
                : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                }`}
            >
              <div
                className={`absolute top-1 left-1 font-bold ${isSameMonth(day, currentDate) ? 'text-black opacity-100' : 'text-gray-500 opacity-30'
                  }`}
              >
                {format(day, "d")}
              </div>
              {/* イベントの表示コンテナ（絶対位置） */}
              <div className="absolute z-10 w-full box-border rounded-lg">
                {clickedDate === format(day, "yyyy-MM-dd") && (
                  <div className="text-white text-xs px-2 py-0.5 bg-blue-200 rounded-lg italic shadow-md whitespace-nowrap overflow-hidden text-ellipsis z-[100]">
                    New Event
                  </div>
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
                      className="cursor-pointer rounded-lg bg-blue-500 text-white text-sm px-1 py-0.5"
                      onClick={(e) => {
                        setBarStyles([]); //barstyleをリセット
                        setClickedDate(null); //clickedDateをリセット
                        e.stopPropagation();
                        eventClick && eventClick({ event: { id: event.id, title: event.title } });
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;