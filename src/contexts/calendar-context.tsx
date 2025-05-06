'use client'
import { createContext, useContext, useState, ReactNode } from 'react';
import type { RecentEvent } from "@/app/types"; // Import from types.ts

interface CalendarContextType {
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  username: string | null;
  setUsername: (name: string | null) => void;
  selectedUserIdForDialog: string | null;
  setSelectedUserIdForDialog: (id: string | null) => void;
  recentAvatars: RecentEvent[];
  setRecentAvatars: (avatars: RecentEvent[]) => void;
  isLoadingRecentAvatars: boolean;
  setIsLoadingRecentAvatars: (loading: boolean) => void;
  recentAvatarsError: string | null;
  setRecentAvatarsError: (error: string | null) => void;
  isFollowedEventDialogOpen: boolean;
  setIsFollowedEventDialogOpen: (open: boolean) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // 'YYYY-MM' 形式
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedUserIdForDialog, setSelectedUserIdForDialog] = useState<string | null>(null);
  const [recentAvatars, setRecentAvatars] = useState<RecentEvent[]>([]);
  const [isLoadingRecentAvatars, setIsLoadingRecentAvatars] = useState<boolean>(true);
  const [recentAvatarsError, setRecentAvatarsError] = useState<string | null>(null);
  const [isFollowedEventDialogOpen, setIsFollowedEventDialogOpen] = useState<boolean>(false);

  return (
    <CalendarContext.Provider 
      value={{ 
        currentMonth, 
        setCurrentMonth, 
        userId, 
        setUserId,
        avatarUrl,
        setAvatarUrl,
        username,
        setUsername,
        selectedUserIdForDialog,
        setSelectedUserIdForDialog,
        recentAvatars,
        setRecentAvatars,
        isLoadingRecentAvatars,
        setIsLoadingRecentAvatars,
        recentAvatarsError,
        setRecentAvatarsError,
        isFollowedEventDialogOpen,
        setIsFollowedEventDialogOpen
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
} 