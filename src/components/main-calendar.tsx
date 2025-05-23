"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, addDays, format, subMonths, addMonths, isBefore, isAfter, isSameMonth, getYear, getMonth
} from "date-fns";
import { Event } from "../app/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCalendar } from "@/contexts/calendar-context";
import { CalendarHeader } from "./calendar-header";

// TODO: DBから取得したイベントコンテナに関しても、複数日の予定は、連なったイベントコンテナを表示するようにする。
// TODO: 月遷移のスクロールに関して、週単位か、月単位のスクロールしかできないように制限する。微妙なスクロールはできないようにする.
// TODO: ドラッグ時のモーダルポジションを修正する。

// 祝日判定用のインターフェース
interface HolidaysData {
  [date: string]: string;
}

interface MainCalendarProps {
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

const MainCalendar: React.FC<MainCalendarProps> = ({ 
  events, 
  editable, 
  selectable, 
  dateClick, 
  eventClick, 
  dragDateChange, 
  modalOpen, 
  modalPosition, 
  setModalPosition 
}) => {
  const { currentMonth, setCurrentMonth } = useCalendar();
  const [holidays, setHolidays] = useState<HolidaysData>({});

  // 祝日データを取得する関数
  const fetchHolidays = async (year: number) => {
    try {
      const response = await fetch(`https://holidays-jp.github.io/api/v1/${year}/date.json`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("祝日データの取得に失敗しました:", error);
      return {};
    }
  };

  // 初期表示時と年が変わった時に祝日データを取得
  useEffect(() => {
    const loadHolidays = async () => {
      const currentYear = getYear(new Date());
      const holidaysData = await fetchHolidays(currentYear);
      
      // 翌年のデータも取得（年末の表示時に必要）
      const nextYearHolidays = await fetchHolidays(currentYear + 1);
      
      setHolidays({...holidaysData, ...nextYearHolidays});
    };
    
    loadHolidays();
  }, []);

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
  const initialMonthList = Array.from({ length: 5 }, (_, i) =>
    addMonths(currentDate, i - 2)
  );
  const [monthList, setMonthList] = useState<Date[]>(initialMonthList);
  const [activeMonthIndex, setActiveMonthIndex] = useState(1);
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

  // イベントを週ごとにグループ化するヘルパー関数
  const groupEventsByWeek = (event: Event) => {
    const eventStart = startOfDay(new Date(event.start_time));
    const eventEnd = startOfDay(new Date(event.end_time));
    const eventDays = weeks.flat().filter(day => {
      const current = startOfDay(day);
      return current >= eventStart && current <= eventEnd;
    });

    if (eventDays.length === 0) return [];

    // 週ごとにグループ化
    const weekGroups: Date[][] = [];
    let currentWeek: Date[] = [];

    eventDays.forEach((day, index) => {
      if (currentWeek.length === 0 || day.getDay() > currentWeek[currentWeek.length - 1].getDay()) {
        currentWeek.push(day);
      } else {
        weekGroups.push(currentWeek);
        currentWeek = [day];
      }

      if (index === eventDays.length - 1) {
        weekGroups.push(currentWeek);
      }
    });

    return weekGroups;
  };

  // 各イベントのバースタイルを計算する（全日付で段を管理）
  const calculateEventBarStyles = () => {
    const allBarStyles: Array<BarStyle & { title: string, id: string }> = [];

    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const eventPositions: Record<string, Set<number>> = {}; // 各日付ごとに使われている段を管理

    sortedEvents.forEach(event => {
      const eventStart = startOfDay(new Date(event.start_time));
      const eventEnd = startOfDay(new Date(event.end_time));

      // イベントがカバーするすべての日付を列挙
      const daysCovered: string[] = [];
      let currentDay = eventStart;
      while (currentDay <= eventEnd) {
        daysCovered.push(format(currentDay, "yyyy-MM-dd"));
        currentDay = addDays(currentDay, 1);
      }

      // すべての日付に対して、空いている段(position)を探す
      let position = 0;
      while (daysCovered.some(dateStr => eventPositions[dateStr]?.has(position))) {
        position++;
      }

      // 選んだ段をすべての日付に予約する
      daysCovered.forEach(dateStr => {
        if (!eventPositions[dateStr]) {
          eventPositions[dateStr] = new Set();
        }
        eventPositions[dateStr].add(position);
      });

      // スタイル計算（週をまたぐ場合は分割）
      const weekGroups = groupEventsByWeek(event);

      const eventBarStyles = weekGroups.map(weekDays => {
        const firstDayEl = document.querySelector(`[data-date="${format(weekDays[0], "yyyy-MM-dd")}"]`) as HTMLElement;
        const lastDayEl = document.querySelector(`[data-date="${format(weekDays[weekDays.length - 1], "yyyy-MM-dd")}"]`) as HTMLElement;

        if (!firstDayEl || !lastDayEl) return null;

        return {
          top: `${firstDayEl.offsetTop + 24 + (position * 22)}px`,
          left: `${firstDayEl.offsetLeft}px`,
          width: `${(lastDayEl.offsetLeft + lastDayEl.offsetWidth) - firstDayEl.offsetLeft}px`,
          title: event.title,
          id: event.id
        };
      }).filter((style): style is BarStyle & { title: string, id: string } => style !== null);

      allBarStyles.push(...eventBarStyles);
    });

    return allBarStyles;
  };

  const [eventBarStyles, setEventBarStyles] = useState<Array<BarStyle & { title: string, id: string }>>([]);

  useEffect(() => {
    if (!calendarRef.current) return;
    
    // DOMが完全に描画された後に実行するために、タイマーを使用
    const timer = setTimeout(() => {
      const styles = calculateEventBarStyles();
      setEventBarStyles(styles);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [events, monthList]);

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
          // スクロール位置調整のための準備
          const oldScrollHeight = container.scrollHeight;
          const oldScrollTop = container.scrollTop;

          setMonthList(prev => {
            const newMonthList = [prevMonth, ...prev];
            // 新しいリストがレンダリングされた後にスクロール位置を調整
            // useEffectやrequestAnimationFrameを使うのがより確実
            requestAnimationFrame(() => {
              if (calendarRef.current) {
                const newScrollHeight = calendarRef.current.scrollHeight;
                // 増えた高さ分だけスクロール位置を上にずらす（加算する）
                calendarRef.current.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
              }
            });
            return newMonthList;
          });
          // setMonthListのコールバックや別のuseEffectでscrollTopを調整する方がより堅牢
          // ここでの直接的なscrollTop操作は削除または修正
          // container.scrollTop += container.scrollHeight; // <-- この行を修正または削除
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
          setCurrentMonth(newMonth);
          setAnimatingHeader(true);
          setTimeout(() => {
            setAnimatingHeader(false);
          }, 300);
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [monthList, setCurrentMonth]);

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
    setModalPositionForElement(dayElement);

    setDragStart(null);
    setDragEnd(null);
  };

  const handleDateClick = (dateStr: string) => {
    const dayElement = document.querySelector(`[data-date="${dateStr}"]`) as HTMLElement;
    if (!dayElement) return;
    setModalPositionForElement(dayElement);
    setClickedDate(dateStr);
    dateClick && dateClick({ dateStr });
  };

  // モーダルポジションを要素に基づいて設定するヘルパー関数
  const setModalPositionForElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    let newPosition = { top: rect.top + window.scrollY + 50, left: rect.right + 155 };
    
    // 要素の日付から曜日を取得
    const dateStr = element.getAttribute('data-date');
    if (dateStr) {
      const dayOfWeek = new Date(dateStr).getDay();
      if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) { // 木、金、土
        newPosition = { top: rect.top + window.scrollY + 50, left: rect.left - 155 }; // 左に表示
      }
    }
    
    setModalPosition(newPosition);
  };

  const days = weeks.flat();

  return (
    /* 1. カレンダー全体のコンテナ */
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden" ref={calendarRef} style={{ userSelect: dragStart ? 'none' : 'auto' }}>
      /* 2. 複数日イベントレイヤー */
      <div className="absolute inset-0 pointer-events-none z-[30]">
        {barStyles.map((style, index) => (
          <div
            key={index}
            className="absolute text-white text-xs px-2 py-0.5 bg-blue-200 rounded-lg italic shadow-md whitespace-nowrap overflow-hidden text-ellipsis z-[20] animate-fadeIn pointer-events-none"
            style={style}
          >
            New Event
          </div>
        ))}
        {eventBarStyles.map((style, index) => (
          <div
            key={`event-${style.id}-${index}`}
            className="absolute text-white text-xs px-2 py-0.5 bg-blue-500 rounded-lg shadow-md whitespace-nowrap overflow-hidden text-ellipsis z-[20] cursor-pointer pointer-events-auto"
            style={style}
            onClick={(e) => {
              e.stopPropagation();
              
              // イベントが関連する日付の要素を見つける
              const eventDate = new Date(events.find(event => event.id === style.id)?.start_time || new Date());
              const dateStr = format(eventDate, "yyyy-MM-dd");
              const dayElement = document.querySelector(`[data-date="${dateStr}"]`) as HTMLElement;
              
              if (dayElement) {
                setModalPositionForElement(dayElement);
              }
              
              eventClick && eventClick({ event: { id: style.id, title: style.title } });
            }}
          >
            {style.title}
          </div>
        ))}
      </div>
      <CalendarHeader />

      /* 4. カレンダー日付グリッド */
      <div className="grid grid-cols-7 w-full max-w-full box-border">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const thisMonth = format(day, "yyyy-MM");
          const colIndex = index % 7; // 0=日曜 ... 6=土曜
          const isLastCol = colIndex === 6;
          const right = days[index + 1];
          const below = days[index + 7];
          const isVBoundary = right && format(right, "yyyy-MM") !== thisMonth;
          const isHBoundary = below && format(below, "yyyy-MM") !== thisMonth;
          
          // 祝日判定
          const dateStr = format(day, "yyyy-MM-dd");
          const isHoliday = holidays[dateStr] !== undefined;

          // 各方向の枠線スタイル
          const borderTop    = "border-t border-gray-200";
          const borderLeft   = "border-l border-gray-200";
          const borderRight  = isVBoundary && !isLastCol ? "border-r-2 border-r-gray-400" : "border-r border-gray-200";
          const borderBottom = isHBoundary ? "border-b-2 border-b-gray-400" : "border-b border-gray-200";

          const cellClasses = [
            "relative min-h-[120px] pt-6 pb-1 box-border flex flex-col items-start",
            "transition-colors duration-200 ease-in-out",
            // 四方向の枠線を個別指定
            borderTop,
            borderLeft,
            borderRight,
            borderBottom,
            // 当月 vs 他月 背景・文字色
            isCurrentMonth
              ? "bg-white hover:bg-gray-100"
              : "bg-white text-gray-500 hover:bg-gray-100",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={index}
              data-date={dateStr}
              onMouseDown={() => handleMouseDown(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              onMouseUp={handleMouseUp}
              onClick={() => handleDateClick(dateStr)}
              className={cellClasses}
            >
              <div className={`absolute top-1 left-1 font-bold ${
                isCurrentMonth 
                  ? isHoliday || colIndex === 0 
                    ? 'text-red-500' // 祝日・日曜日は赤色
                    : colIndex === 6
                      ? 'text-blue-500' // 土曜日は青色
                      : 'text-black' 
                  : isHoliday || colIndex === 0 
                    ? 'text-red-300 opacity-30' // 他の月の祝日・日曜日
                    : colIndex === 6
                      ? 'text-blue-300 opacity-30' // 他の月の土曜日
                      : 'text-gray-500 opacity-30'
              }`}>
                {format(day, "d")}
              </div>
              {/* イベントの表示コンテナ（absolute配置に統一のため1日イベント表示は削除） */}
              <div className="absolute z-[5] w-full box-border rounded-lg">
                {clickedDate === dateStr && (
                  <div className="text-white text-xs px-2 py-0.5 bg-blue-200 rounded-lg italic shadow-md whitespace-nowrap overflow-hidden text-ellipsis z-[20]">
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

export default MainCalendar;