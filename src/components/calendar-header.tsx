import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCalendar } from "@/contexts/calendar-context";

interface CalendarHeaderProps {
  animatingHeader: boolean;
  scrollDirection: "up" | "down";
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  animatingHeader,
  scrollDirection,
}) => {
  const { currentMonth, userId, avatarUrl, username } = useCalendar();
  const currentDate = new Date(currentMonth + "-01"); // YYYY-MM-01 形式に変換

  return (
    <div className="sticky top-0 z-[40] bg-white border-b border-gray-300 shadow-sm p-2">
      <div className="flex items-center justify-between px-2">
        <div className={`transition-opacity transition-transform duration-300 ${
          animatingHeader 
            ? (scrollDirection === 'up' 
              ? 'opacity-0 -translate-y-5' 
              : 'opacity-0 translate-y-5') 
            : ''
        }`}>
          <h2 className="text-xl font-bold m-0">{format(currentDate, "MMMM yyyy")}</h2>
        </div>
        {userId && (
          <Avatar>
            <AvatarImage src={avatarUrl || "/default-avatar.png"} alt={username || ""} />
            <AvatarFallback>{username?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="flex justify-between px-2 bg-gray-100 font-bold border-b border-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
          <div key={idx} className="w-1/7 text-center py-2">{day}</div>
        ))}
      </div>
    </div>
  );
}; 