import { useCalendar } from "@/contexts/calendar-context";

interface CalendarHeaderProps {
  // アニメーション関連のプロパティを削除
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({}) => {
  const { currentMonth } = useCalendar();
  const currentDate = new Date(currentMonth + "-01"); // YYYY-MM-01 形式に変換
  
  // 月の日本語表記
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const year = currentDate.getFullYear();
  const month = monthNames[currentDate.getMonth()];

  return (
    <div className="sticky top-0 z-[40] bg-white border-b border-gray-300 shadow-sm p-2">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-lg font-bold m-0">{year}年 {month}</h2>
        </div>
      </div>
      <div className="flex justify-between">
        {["日", "月", "火", "水", "木", "金", "土"].map((day, idx) => (
          <div key={idx} className="w-1/7 text-center text-xs">{day}</div>
        ))}
      </div>
    </div>
  );
}; 