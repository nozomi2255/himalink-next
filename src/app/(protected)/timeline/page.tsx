"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/useUser";

interface TimelineEvent {
  event_id: string;
  user_id: string;
  title: string;
  description: string;
  updated_at: string;
  avatar_url: string;
  username: string;
  time_since_update: string;
}

const formatTimeSince = (timeSince: string) => {
  const matches = timeSince.match(/(\d+):(\d+):\d+/);
  if (!matches) return "数分前";

  const hours = parseInt(matches[1]);
  const minutes = parseInt(matches[2]);

  if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return "数分前";
  }
};

export default function TimelinePage() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const supabase = createClient();

  useEffect(() => {
    const fetchTimelineEvents = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .rpc('get_recent_followed_events', {
          _follower_id: user.id
        });

      if (error) {
        console.error("Error fetching timeline events:", error);
        return;
      }

      setTimelineEvents(data || []);
      setIsLoading(false);
    };

    fetchTimelineEvents();

    // 1分ごとに更新
    const interval = setInterval(fetchTimelineEvents, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">タイムライン</h1>
      
      {timelineEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">フォローしているユーザーの更新はありません</p>
        </div>
      ) : (
        <div className="space-y-6">
          {timelineEvents.map((event) => (
            <div
              key={event.event_id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start space-x-4">
                <img
                  src={event.avatar_url || "/default-avatar.png"}
                  alt={`${event.username}のアバター`}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{event.username}</h3>
                    <span className="text-sm text-gray-500">
                      {formatTimeSince(event.time_since_update)}
                    </span>
                  </div>
                  <h4 className="text-lg font-medium mt-2">{event.title}</h4>
                  {event.description && (
                    <p className="mt-2 text-gray-600">{event.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
