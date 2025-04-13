"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, addDays, format, subMonths, addMonths, isBefore, isAfter, isSameMonth
} from "date-fns";
import { Event } from "../app/types";

// TODO: デフォルトイベントコンテナを列を跨ぐ場合も表示できるようにする。
// TODO: 現在、ドラッグで、前の日付に戻る場合はデフォルトイベントコンテナを適用できないことを改善する。
// TODO: DBから取得したイベントコンテナに関しても、複数日の予定は、連なったイベントコンテナを表示するようにする。
// TODO: 月遷移のスクロールに関して、週単位か、月単位のスクロールしかできないように制限する。微妙なスクロールはできないようにする.
// TODO: イベント編集モーダルを閉じた後に、イベントが初期化されない問題を改善する。
// TODO: ドラッグ時のモーダルポジションを修正する。


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
    const dayElement = document.querySelector(`[data-date="${dragStart}"]`) as HTMLElement;
    if (!dayElement) return;
    const rect = dayElement.getBoundingClientRect();
    let newPosition = { top: rect.top + window.scrollY, left: rect.right + 10 };
    if (dragStart) {
      const dayOfWeek = new Date(dragStart).getDay();
      if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) { // 木、金、土
        newPosition = { top: rect.top + window.scrollY, left: rect.left - 300 }; // 左に表示
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
    let newPosition = { top: rect.top + window.scrollY, left: rect.right + 10 };
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) { // 木、金、土
      newPosition = { top: rect.top + window.scrollY, left: rect.left - 300 }; // 左に表示
    }
    setModalPosition(newPosition);
    setClickedDate(dateStr);
    dateClick && dateClick({ dateStr });
  };

  return (
    /* 1. カレンダー全体のコンテナ */
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden" ref={calendarRef} style={{ userSelect: dragStart ? 'none' : 'auto' }}>
      /* 2. 複数日イベントレイヤー */
      <div className="absolute inset-0 pointer-events-none z-[1000]">
        {(barStyle && !clickedDate) && (
          <div
            className={`absolute text-white text-xs px-2 py-0.5 bg-blue-200 rounded-lg italic shadow-md whitespace-nowrap overflow-hidden text-ellipsis z-[100] animate-fadeIn ${dragStart ? 'pointer-events-none' : 'pointer-events-auto'}`}
            style={barStyle}
            onClick={(e) => {
              e.stopPropagation();
              console.log("Event bar clicked");
            }}
          >
            New Event
          </div>
        )}
      </div>
      /* 3. 固定ヘッダー部 */
      <div className="sticky top-0 z-[50] bg-white border-b border-gray-300 shadow-sm p-2">
        <div className={`transition-opacity transition-transform duration-300 ${animatingHeader ? (scrollDirection === 'up' ? 'opacity-0 -translate-y-5' : 'opacity-0 translate-y-5') : ''}`}>
          <h2 className="text-xl font-bold m-0">{format(currentDate ?? new Date(), "MMMM yyyy")}</h2>
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
                        setBarStyle(null); //barstyleをリセット
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