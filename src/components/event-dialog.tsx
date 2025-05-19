// EventDialog.tsx
"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  addDays,
  compareAsc,
  compareDesc,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import {
  CalendarIcon,
  Clock,
  GripHorizontal,
  Plus,
  ChevronUp,
  ChevronDown,
  MapPin,
  X,
  Pencil,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Save, Trash, Check, Users } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Event, UserProfile } from "@/app/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReactionUser {
  user_id: string;
  username: string;
  avatar_url?: string;
}

interface ReactionDetail {
  count: number;
  users: ReactionUser[];
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Event[];
  entryId?: string;
  targetUserId?: string;
  isOwner: boolean;
  selectedStartDate?: string;
  selectedEndDate?: string;
  modalPosition?: { top: number; left: number };
  handleAdd: (data: {
    title: string;
    content: string;
    startDate: Date | undefined;
    startTime: string;
    endDate: Date | undefined;
    endTime: string;
    isAllDay: boolean;
  }) => void;
  handleUpdate: (
    eventId: string,
    data: {
      title: string;
      content: string;
      startDate: Date | undefined;
      startTime: string;
      endDate: Date | undefined;
      endTime: string;
      isAllDay: boolean;
    },
  ) => void;
  handleDelete: (eventId: string) => void;
  targetUserProfile?: UserProfile;
  eventReactions: Record<string, Record<string, number>>;
  eventReactionDetails: Record<string, Record<string, ReactionDetail>>;
  eventUserReactions: Record<string, string[]>;
  onEventReactionToggle: (eventId: string, emoji: string) => void;
  // --- Added props for entry/comments/reactions ---
  entry: Event | null;
  comments: any[];
  reactions: Record<string, number>;
  reactionDetails: Record<string, ReactionDetail>;
  userReactions: string[];
  onCommentTextChange: (text: string) => void;
  commentText: string;
  onCommentSubmit: () => void;
}

function formatTime(datetime?: string, timeZone: string = "Asia/Tokyo") {
  if (!datetime) return "-";
  try {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) {
      console.error("Invalid date string provided to formatTime:", datetime);
      return "-";
    }
    const zonedDate = toZonedTime(date, timeZone);
    return formatTz(zonedDate, "HH:mm", { timeZone, locale: ja });
  } catch (error) {
    console.error("Error formatting time:", error, "Input:", datetime);
    return "-";
  }
}

function formatDateHeader(date: Date) {
  return format(date, "M月d日（E）");
}

interface EventContentProps {
  isMobile: boolean;
  isOwner: boolean;
  entryId?: string;
  entry: any;
  events: Event[];
  groupedEvents: Record<string, Event[]>;
  datesWithEvents: Date[];
  showAddForm: boolean;
  addFormDate: Date | null;
  newTitle: string;
  newContent: string;
  handleTitleChange: (value: string) => void;
  handleContentChange: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  startTime: string;
  handleStartTimeChange: (value: string) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  endTime: string;
  handleEndTimeChange: (value: string) => void;
  isAllDay: boolean;
  setIsAllDay: (value: boolean) => void;
  handleUpdate: (
    eventId: string,
    data: {
      title: string;
      content: string;
      startDate: Date | undefined;
      startTime: string;
      endDate: Date | undefined;
      endTime: string;
      isAllDay: boolean;
    },
  ) => void;
  handleDelete: (eventId: string) => void;
  handleAdd: (data: {
    title: string;
    content: string;
    startDate: Date | undefined;
    startTime: string;
    endDate: Date | undefined;
    endTime: string;
    isAllDay: boolean;
  }) => void;
  handleReactionToggle: (emoji: string) => void;
  userReactions: string[];
  reactions: Record<string, number>;
  reactionDetails: Record<string, ReactionDetail>;
  comments: any[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  formatDateHeader: (date: Date) => string;
  formatTime: (datetime?: string) => string;
  targetUserProfile?: UserProfile;
  editingEventId: string | null;
  handleEditClick: (eventId: string) => void;
  handleCancelEdit: () => void;
  handleEventReactionToggle: (eventId: string, emoji: string) => void;
  eventUserReactions: Record<string, string[]>;
  eventReactions: Record<string, Record<string, number>>;
  eventReactionDetails: Record<string, Record<string, ReactionDetail>>;
  eventComments: Record<string, any[]>;
  commentInputs: Record<string, string>;
  handleEventCommentChange: (eventId: string, value: string) => void;
  handleEventCommentSubmit: (eventId: string) => void;
  eventImages: Record<string, any[]>;
  handleImageUpload: (eventId: string, file: File | undefined) => void;
  handleImageDelete: (
    eventId: string,
    imageId: string,
    imageUrl: string,
  ) => void;
}

const MemoizedEventContent = memo<EventContentProps>(
  ({
    isMobile,
    isOwner,
    entryId,
    entry,
    groupedEvents,
    datesWithEvents,
    showAddForm,
    addFormDate,
    newTitle,
    newContent,
    handleTitleChange,
    handleContentChange,
    startDate,
    setStartDate,
    startTime,
    handleStartTimeChange,
    endDate,
    setEndDate,
    endTime,
    handleEndTimeChange,
    isAllDay,
    setIsAllDay,
    handleUpdate,
    handleDelete,
    handleAdd,
    handleReactionToggle,
    userReactions,
    reactions,
    reactionDetails,
    comments,
    scrollRef,
    formatDateHeader,
    formatTime,
    targetUserProfile,
    editingEventId,
    handleEditClick,
    handleCancelEdit,
    handleEventReactionToggle,
    eventUserReactions,
    eventReactions,
    eventReactionDetails,
    eventComments,
    commentInputs,
    handleEventCommentChange,
    handleEventCommentSubmit,
    eventImages,
    handleImageUpload,
    handleImageDelete,
  }) => {
    return (
      <>
        <div className="flex flex-col gap-4">
          {targetUserProfile && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={targetUserProfile.avatarUrl || undefined}
                      alt={targetUserProfile.username || "User Avatar"}
                    />
                    <AvatarFallback>
                      {targetUserProfile.username?.charAt(0).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  {targetUserProfile.username || "ユーザー"}
                </CardTitle>
                <CardDescription>プロフィール</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{targetUserProfile.bio || "自己紹介はありません。"}</p>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="divide-y">
              {(() => {
                const allDates = [...datesWithEvents];

                if (
                  showAddForm &&
                  addFormDate &&
                  !datesWithEvents.some(
                    (date) =>
                      format(date, "yyyy-MM-dd") ===
                      format(addFormDate, "yyyy-MM-dd"),
                  )
                ) {
                  allDates.push(addFormDate);
                }

                return allDates.sort(compareDesc).map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const eventsOnDate = groupedEvents[dateStr] || [];
                  const isSelectedDate =
                    addFormDate &&
                    format(addFormDate, "yyyy-MM-dd") === dateStr;

                  return (
                    <div key={dateStr} id={`date-${dateStr}`} className="py-2">
                      <div className="sticky top-0 bg-white px-4 py-2 z-10 flex justify-between items-center">
                        <h3 className="font-medium">
                          {formatDateHeader(date)}
                        </h3>
                      </div>

                      <div className="flex flex-col space-y-4 px-4 mt-2">
                        {isSelectedDate &&
                          showAddForm &&
                          !editingEventId &&
                          !entryId && (
                            <div
                              key={`add-form-${dateStr}`}
                              className="flex flex-col p-3 rounded-lg border border-dashed border-blue-400 bg-blue-50"
                            >
                              <div
                                className={cn(
                                  "flex justify-end",
                                  isMobile && "mb-4",
                                )}
                              >
                                {isOwner &&
                                  (entryId ? (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleUpdate(entryId, {
                                            title: newTitle,
                                            content: newContent,
                                            startDate,
                                            endDate,
                                            startTime,
                                            endTime,
                                            isAllDay,
                                          })
                                        }
                                        variant="ghost"
                                        size="icon"
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        onClick={() => handleDelete(entryId)}
                                        variant="ghost"
                                        size="icon"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      onClick={() =>
                                        handleAdd({
                                          title: newTitle,
                                          content: newContent,
                                          startDate,
                                          endDate,
                                          startTime,
                                          endTime,
                                          isAllDay,
                                        })
                                      }
                                      variant="ghost"
                                      size="icon"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  ))}
                              </div>
                              <DebouncedInput
                                value={newTitle}
                                onChange={handleTitleChange}
                                placeholder="イベントタイトルを入力"
                                className="w-full mt-2"
                                autoFocus={false}
                                debounceTime={50}
                              />
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-[100px] justify-start text-left font-normal",
                                          !startDate && "text-muted-foreground",
                                        )}
                                      >
                                        {startDate ? (
                                          format(startDate, "M'月'dd'日'")
                                        ) : (
                                          <span>開始日を選択</span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full">
                                      <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  {!isAllDay && (
                                    <DebouncedInput
                                      type="time"
                                      value={startTime}
                                      onChange={handleStartTimeChange}
                                      className="w-[120px]"
                                      debounceTime={50}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-[100px] justify-start text-left font-normal",
                                          !endDate && "text-muted-foreground",
                                        )}
                                      >
                                        {endDate ? (
                                          format(endDate, "M'月'dd'日'")
                                        ) : (
                                          <span>終了日を選択</span>
                                        )}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto">
                                      <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={setEndDate}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  {!isAllDay && (
                                    <DebouncedInput
                                      type="time"
                                      value={endTime}
                                      onChange={handleEndTimeChange}
                                      className="w-[120px]"
                                      debounceTime={50}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="all-day"
                                  checked={isAllDay}
                                  onCheckedChange={setIsAllDay}
                                />
                                <Label htmlFor="all-day">終日</Label>
                              </div>
                              <DebouncedInput
                                value={newContent}
                                onChange={handleContentChange}
                                placeholder="詳細を入力"
                                className="w-full mt-2 h-16"
                                autoFocus={false}
                                debounceTime={50}
                              />
                            </div>
                          )}

                        {eventsOnDate.map((event, index) => (
                          <div key={event.id} className="space-y-2">
                            {editingEventId === event.id ? (
                              <div className="p-3 rounded-lg border border-dashed border-blue-400 bg-blue-50">
                                <div
                                  className={cn(
                                    "flex justify-end",
                                    isMobile && "mb-4",
                                  )}
                                >
                                  {isOwner && (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleUpdate(event.id, {
                                            title: newTitle,
                                            content: newContent,
                                            startDate,
                                            endDate,
                                            startTime,
                                            endTime,
                                            isAllDay,
                                          })
                                        }
                                        variant="ghost"
                                        size="icon"
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        onClick={() => handleDelete(event.id)}
                                        variant="ghost"
                                        size="icon"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        onClick={handleCancelEdit}
                                        variant="ghost"
                                        size="icon"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                                <DebouncedInput
                                  value={newTitle}
                                  onChange={handleTitleChange}
                                  placeholder="イベントタイトルを入力"
                                  className="w-full h-full mt-2"
                                  autoFocus={false}
                                  debounceTime={50}
                                />
                                <div className="flex flex-col gap-2 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-[100px] justify-start text-left font-normal",
                                            !startDate &&
                                              "text-muted-foreground",
                                          )}
                                        >
                                          {startDate ? (
                                            format(startDate, "M'月'dd'日'")
                                          ) : (
                                            <span>開始日</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto">
                                        <Calendar
                                          mode="single"
                                          selected={startDate}
                                          onSelect={setStartDate}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    {!isAllDay && (
                                      <DebouncedInput
                                        type="time"
                                        value={startTime}
                                        onChange={handleStartTimeChange}
                                        className="w-[120px]"
                                        debounceTime={50}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-[100px] justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground",
                                          )}
                                        >
                                          {endDate ? (
                                            format(endDate, "M'月'dd'日'")
                                          ) : (
                                            <span>終了日</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto">
                                        <Calendar
                                          mode="single"
                                          selected={endDate}
                                          onSelect={setEndDate}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    {!isAllDay && (
                                      <DebouncedInput
                                        type="time"
                                        value={endTime}
                                        onChange={handleEndTimeChange}
                                        className="w-[120px]"
                                        debounceTime={50}
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Switch
                                    id={`all-day-edit-${event.id}`}
                                    checked={isAllDay}
                                    onCheckedChange={setIsAllDay}
                                  />
                                  <Label htmlFor={`all-day-edit-${event.id}`}>
                                    終日
                                  </Label>
                                </div>
                                <DebouncedInput
                                  value={newContent}
                                  onChange={handleContentChange}
                                  placeholder="イベント内容を入力"
                                  className="w-full mt-2 h-16"
                                  autoFocus={false}
                                  debounceTime={50}
                                />
                              </div>
                            ) : (
                              <div
                                id={`event-${event.id}`}
                                className={`p-3 rounded-lg border bg-white border-gray-200 shadow-sm`}
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-2">
                                      <div className="text-sm font-medium text-slate-500 min-w-[45px] mt-0.5">
                                        {event.is_all_day ? (
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            終日
                                          </Badge>
                                        ) : (
                                          formatTime(event.start_time)
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {event.title}
                                        </div>
                                        {event.location && (
                                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <MapPin className="h-3 w-3" />
                                            {event.location}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {isOwner && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="ml-2 transition-opacity"
                                        onClick={() =>
                                          handleEditClick(event.id)
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>

                                  {!event.is_all_day && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(event.start_time)} -{" "}
                                      {formatTime(event.end_time)}
                                    </div>
                                  )}

                                  {event.content && (
                                    <div className="text-sm mt-1 border-t pt-2">
                                      {event.content}
                                    </div>
                                  )}

                                  {/* Event Reactions Section */}
                                  <div className="mt-2 pt-2 border-t flex flex-col gap-1">
                                    <div className="flex gap-1">
                                      {["👍", "❤️", "🎉", "🤔"].map((emoji) => (
                                        <div
                                          key={emoji}
                                          className="relative group"
                                        >
                                          <Button
                                            variant={
                                              (
                                                eventUserReactions[event.id] ||
                                                []
                                              ).includes(emoji)
                                                ? "default"
                                                : "outline"
                                            }
                                            size="sm"
                                            onClick={() =>
                                              handleEventReactionToggle(
                                                event.id,
                                                emoji,
                                              )
                                            }
                                            className="p-1 h-auto text-xs"
                                          >
                                            {emoji}{" "}
                                            {eventReactions[event.id]?.[
                                              emoji
                                            ] || 0}
                                          </Button>
                                          {(eventReactionDetails[event.id]?.[
                                            emoji
                                          ]?.users?.length ?? 0) > 0 && (
                                            <div className="absolute top-full left-0 mt-1 bg-white p-1.5 rounded shadow-md z-20 hidden group-hover:block md:block w-max border border-gray-200 text-xs">
                                              {(
                                                eventReactionDetails[
                                                  event.id
                                                ]?.[emoji]?.users ?? []
                                              ).map((user) => (
                                                <div
                                                  key={user.user_id}
                                                  className="py-0.5 flex items-center gap-1"
                                                >
                                                  {user.avatar_url && (
                                                    <Avatar className="h-4 w-4">
                                                      <AvatarImage
                                                        src={user.avatar_url}
                                                        alt={user.username}
                                                      />
                                                      <AvatarFallback>
                                                        {user.username
                                                          ?.charAt(0)
                                                          .toUpperCase()}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  )}
                                                  <span className="font-semibold">
                                                    {user.username}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    {/* Mobile: always show who reacted */}
                                    {isMobile && (
                                      <div className="text-xs text-gray-500 md:hidden flex flex-col gap-0.5">
                                        {["👍", "❤️", "🎉", "🤔"].map(
                                          (emoji) => {
                                            const users =
                                              eventReactionDetails[event.id]?.[
                                                emoji
                                              ]?.users ?? [];
                                            if (users.length === 0) return null;

                                            const firstNames = users
                                              .slice(0, 3)
                                              .map((u) => u.username)
                                              .join(", ");
                                            const others =
                                              users.length > 3
                                                ? ` 他${users.length - 3}人`
                                                : "";

                                            return (
                                              <div
                                                key={emoji}
                                                className="flex items-center gap-1"
                                              >
                                                <span>{emoji}</span>
                                                <span className="font-semibold">
                                                  {firstNames}
                                                  {others}
                                                </span>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {/* Images */}
                                  {eventImages[event.id]?.map((img, idx) => (
                                    <div
                                      key={idx}
                                      className="mt-2 relative inline-block"
                                    >
                                      <img
                                        src={img.image_url}
                                        alt={img.caption || "event image"}
                                        className="rounded w-full max-w-md"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 hover:bg-white"
                                        onClick={() =>
                                          handleImageDelete(
                                            event.id,
                                            img.id,
                                            img.image_url,
                                          )
                                        }
                                      >
                                        ✕
                                      </Button>
                                      {img.caption && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          {img.caption}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                  <div className="mt-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        handleImageUpload(
                                          event.id,
                                          e.target.files?.[0],
                                        )
                                      }
                                    />
                                  </div>
                                  {/* Comments */}
                                  <div className="mt-2 space-y-2">
                                    <Textarea
                                      placeholder="コメントを入力..."
                                      className="w-full"
                                      rows={2}
                                      value={commentInputs[event.id] || ""}
                                      onChange={(e) =>
                                        handleEventCommentChange(
                                          event.id,
                                          e.target.value,
                                        )
                                      }
                                    />
                                    <Button
                                      size="sm"
                                      className="mt-2"
                                      onClick={() =>
                                        handleEventCommentSubmit(event.id)
                                      }
                                    >
                                      コメントを投稿
                                    </Button>
                                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                                      {(eventComments[event.id] || []).map(
                                        (c: any, index: number) => (
                                          <div
                                            key={index}
                                            className="border rounded px-2 py-1 bg-gray-50 flex items-center gap-2"
                                          >
                                            <span className="flex items-center gap-1">
                                              {c.avatar_url && (
                                                <img
                                                  src={c.avatar_url}
                                                  alt={c.username || c.user_id}
                                                  className="w-5 h-5 rounded-full object-cover"
                                                />
                                              )}
                                              <strong>
                                                {c.username || c.user_id}
                                              </strong>
                                            </span>
                                            <span>: {c.comment}</span>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {eventsOnDate.length === 0 && !isSelectedDate && (
                          <div className="py-6 text-center text-muted-foreground">
                            <div className="mb-2">予定はありません</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}

              {datesWithEvents.length === 0 && !showAddForm && (
                <div className="py-12 text-center text-muted-foreground">
                  予定はありません
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="space-y-4">
            <p>{entry?.content}</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {["👍", "❤️"].map((emoji) => (
                  <div key={emoji} className="relative group">
                    <Button
                      variant={
                        userReactions.includes(emoji) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleReactionToggle(emoji)}
                    >
                      {emoji} {reactions[emoji] || 0}
                    </Button>
                    {reactionDetails[emoji]?.users?.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 bg-white p-2 rounded shadow-md z-10 hidden group-hover:block w-max border border-gray-200">
                        {reactionDetails[emoji].users.map((user) => (
                          <div
                            key={user.user_id}
                            className="text-xs py-1 flex items-center gap-1"
                          >
                            <span className="font-semibold">
                              {user.username}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {Object.entries(reactionDetails).length > 0 && (
                <div className="text-xs text-gray-500">
                  {Object.entries(reactionDetails).map(
                    ([emoji, detail]) =>
                      detail.users.length > 0 && (
                        <div
                          key={emoji}
                          className="flex items-center gap-1 mt-1"
                        >
                          <span>{emoji}</span>
                          <span className="font-semibold">
                            {detail.users
                              .slice(0, 3)
                              .map((u) => u.username)
                              .join(", ")}
                            {detail.users.length > 3
                              ? ` 他${detail.users.length - 3}人`
                              : ""}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium">コメント</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded p-2 text-sm flex items-center gap-2"
                  >
                    {/* Avatar + username */}
                    <span className="flex items-center gap-1">
                      {c.avatar_url && (
                        <Avatar className="h-5 w-5">
                          <AvatarImage
                            src={c.avatar_url}
                            alt={c.username || c.user_id}
                          />
                          <AvatarFallback>
                            {(c.username || c.user_id || "U")[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="font-semibold">
                        {c.username || c.user_id}
                      </span>
                    </span>
                    <span>: {c.comment}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);

export function EventDialog({
  open,
  onOpenChange,
  entryId,
  targetUserId,
  events,
  isOwner,
  selectedStartDate,
  selectedEndDate,
  modalPosition = { top: 100, left: 100 },
  targetUserProfile,
  eventReactions,
  eventReactionDetails,
  eventUserReactions,
  onEventReactionToggle,
  // new props for entry/comments/reactions
  entry,
  comments,
  reactions,
  reactionDetails,
  userReactions,
  onCommentTextChange,
  commentText,
  onCommentSubmit,
  handleAdd,
  handleUpdate,
  handleDelete,
}: EventDialogProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(
    selectedStartDate ? new Date(selectedStartDate) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    selectedEndDate ? new Date(selectedEndDate) : undefined,
  );
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("00:00");
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [sheetHeight, setSheetHeight] = useState(70);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef(0);
  const startHeightRef = useRef(0);

  const supabase = createClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormDate, setAddFormDate] = useState<Date | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventComments, setEventComments] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [eventImages, setEventImages] = useState<Record<string, any[]>>({});
  // Wrapper functions for MemoizedEventContent handlers
  const handleAddWrapper = (data: {
    title: string;
    content: string;
    startDate: Date | undefined;
    startTime: string;
    endDate: Date | undefined;
    endTime: string;
    isAllDay: boolean;
  }) => {
    handleAdd(data);
  };

  const handleUpdateWrapper = (
    eventId: string,
    data: {
      title: string;
      content: string;
      startDate: Date | undefined;
      startTime: string;
      endDate: Date | undefined;
      endTime: string;
      isAllDay: boolean;
    },
  ) => {
    handleUpdate(eventId, data);
  };

  const handleDeleteWrapper = (eventId: string) => {
    handleDelete(eventId);
  };

  // -------- image handling --------
  const fetchEntryImages = async (eventId: string) => {
    const { data, error } = await supabase.rpc("get_entry_images", {
      p_entry_id: eventId,
    });
    if (!error) {
      setEventImages((prev) => ({ ...prev, [eventId]: data || [] }));
    } else {
      console.error("画像取得エラー:", error);
    }
  };

  const handleImageUpload = async (eventId: string, file: File | undefined) => {
    if (!file) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `entry-images/${eventId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("public-files")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });
    if (uploadError) {
      console.error("アップロードエラー:", uploadError);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("public-files")
      .getPublicUrl(filePath);
    const { error: rpcError } = await supabase.rpc("add_entry_image", {
      p_entry_id: eventId,
      p_image_url: urlData?.publicUrl,
      p_caption: "",
    });
    if (rpcError) {
      console.error("DB登録エラー:", rpcError);
      return;
    }
    fetchEntryImages(eventId);
  };

  const handleImageDelete = async (
    eventId: string,
    imageId: string,
    imageUrl: string,
  ) => {
    const path = imageUrl.split("/public-files/")[1];
    if (!path) return;
    const { error: storageError } = await supabase.storage
      .from("public-files")
      .remove([path]);
    if (storageError) {
      console.error("ストレージ削除エラー:", storageError);
      return;
    }
    const { error: dbError } = await supabase
      .from("EntryImages")
      .delete()
      .eq("id", imageId);
    if (dbError) {
      console.error("DB削除エラー:", dbError);
      return;
    }
    fetchEntryImages(eventId);
  };

  // -------- comment handling --------
  const handleEventCommentChange = (eventId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [eventId]: value }));
  };

  const handleEventCommentSubmit = async (eventId: string) => {
    const content = commentInputs[eventId];
    if (!content?.trim()) return;
    const { error } = await supabase.rpc("add_entry_comment", {
      p_entry_id: eventId,
      p_comment: content,
    });
    if (error) {
      console.error("コメント投稿エラー:", error);
      return;
    }
    const { data: comments } = await supabase.rpc("get_entry_comments", {
      p_entry_id: eventId,
    });
    setEventComments((prev) => ({ ...prev, [eventId]: comments || [] }));
    setCommentInputs((prev) => ({ ...prev, [eventId]: "" }));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if ("touches" in e) {
      e.stopPropagation();
      document.body.style.overflow = "hidden";
    }

    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragStartYRef.current = clientY;
    startHeightRef.current = sheetHeight;

    document.addEventListener("mousemove", handleDragMove, { passive: false });
    document.addEventListener("touchmove", handleDragMove, { passive: false });
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchend", handleDragEnd);
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const deltaY = dragStartYRef.current - clientY;
    const windowHeight = window.innerHeight;
    const deltaPercent = (deltaY / windowHeight) * 100;

    let newHeight = startHeightRef.current + deltaPercent;

    newHeight = Math.max(20, Math.min(90, newHeight));

    setSheetHeight(newHeight);
  };

  const handleDragEnd = () => {
    document.body.style.overflow = "";

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchend", handleDragEnd);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("touchmove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, []);

  const groupedEvents =
    events?.reduce(
      (groups: Record<string, Event[]>, event: Event) => {
        const dateStr = format(event.start_time, "yyyy-MM-dd");
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(event);
        return groups;
      },
      {} as Record<string, Event[]>,
    ) || {};

  const datesWithEvents = Object.keys(groupedEvents)
    .map((dateStr) => new Date(dateStr))
    .sort(compareAsc);

  const dateRange = Array.from({ length: 30 }, (_, i) =>
    addDays(new Date(), i - 15),
  );

  const sortedDates = dateRange.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return {
      date,
      events: (groupedEvents[dateStr] || []).sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      ),
    };
  });

  useEffect(() => {
    if (entryId && entry) {
      setNewTitle(entry.title ?? "");
      setNewContent(entry.content ?? "");
      setStartDate(entry.start_time ? new Date(entry.start_time) : undefined);
      setStartTime(
        entry.start_time
          ? format(new Date(entry.start_time), "HH:mm")
          : "00:00",
      );
      setEndDate(entry.end_time ? new Date(entry.end_time) : undefined);
      setEndTime(
        entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "00:00",
      );
      setIsAllDay(entry.is_all_day ?? true);
    } else if (!entryId && selectedStartDate) {
      console.log("[Form Data Effect] Resetting for new date selection");
      const selectedDate = new Date(selectedStartDate);
      setNewTitle("");
      setNewContent("");
      setStartDate(selectedDate);
      setStartTime("00:00");
      setEndDate(selectedDate);
      setEndTime("00:00");
      setIsAllDay(true);
      setAddFormDate(selectedDate);
    } else {
      console.log("[Form Data Effect] Clearing form (or no action)");
      setAddFormDate(null);
    }
  }, [entryId, selectedStartDate, entry]);

  useEffect(() => {
    if (entryId) {
      setShowAddForm(false);
    } else if (selectedStartDate) {
      setShowAddForm(true);
    } else {
      setShowAddForm(false);
    }
  }, [entryId, selectedStartDate]);

  useEffect(() => {
    if (entryId) {
      setTimeout(() => {
        const eventElement = document.getElementById(`event-${entryId}`);
        if (eventElement && scrollRef.current) {
          eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } else if (showAddForm && addFormDate) {
      const dateStr = format(addFormDate, "yyyy-MM-dd");
      setTimeout(() => {
        if (!scrollRef.current) return;
        const dateElement = document.getElementById(`date-${dateStr}`);
        if (dateElement) {
          dateElement.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const sortedEventDates = datesWithEvents
            .map((d) => format(d, "yyyy-MM-dd"))
            .sort();
          let nextDateStr: string | null = null;
          for (const eventDateStr of sortedEventDates) {
            if (eventDateStr > dateStr) {
              nextDateStr = eventDateStr;
              break;
            }
          }
          if (nextDateStr) {
            const nextDateElement = document.getElementById(
              `date-${nextDateStr}`,
            );
            if (nextDateElement) {
              nextDateElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          } else {
            const lastDateStr = sortedEventDates[sortedEventDates.length - 1];
            if (lastDateStr) {
              const lastDateElement = document.getElementById(
                `date-${lastDateStr}`,
              );
              if (lastDateElement) {
                lastDateElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }
          }
        }
      }, 100);
    }
  }, [entryId, addFormDate, showAddForm, datesWithEvents, scrollRef]);

  // fetch comments & images for events when events change
  useEffect(() => {
    if (events.length === 0) return;
    let isMounted = true;
    (async () => {
      await Promise.all(
        events.map(async (ev) => {
          const [{ data: comments }, { data, error }] = await Promise.all([
            supabase.rpc("get_entry_comments", { p_entry_id: ev.id }),
            supabase.rpc("get_entry_images", { p_entry_id: ev.id }),
          ]);
          if (!isMounted) return;
          setEventComments((prev) => ({ ...prev, [ev.id]: comments || [] }));
          if (!error) {
            setEventImages((prev) => ({ ...prev, [ev.id]: data || [] }));
          }
        }),
      );
    })();
    return () => {
      isMounted = false;
    };
  }, [events]);

  const handleTitleChange = useCallback((value: string) => {
    setNewTitle(value);
  }, []);

  const handleStartTimeChange = useCallback((value: string) => {
    setStartTime(value);
  }, []);

  const handleEndTimeChange = useCallback((value: string) => {
    setEndTime(value);
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setNewContent(value);
  }, []);

  const handleEditClick = (eventId: string) => {
    const eventToEdit = events.find((e) => e.id === eventId);
    if (!eventToEdit) return;

    setEditingEventId(eventId);
    setShowAddForm(false);

    setNewTitle(eventToEdit.title ?? "");
    setNewContent(eventToEdit.content ?? "");
    setStartDate(
      eventToEdit.start_time ? new Date(eventToEdit.start_time) : undefined,
    );
    setStartTime(
      eventToEdit.start_time
        ? format(new Date(eventToEdit.start_time), "HH:mm")
        : "00:00",
    );
    setEndDate(
      eventToEdit.end_time ? new Date(eventToEdit.end_time) : undefined,
    );
    setEndTime(
      eventToEdit.end_time
        ? format(new Date(eventToEdit.end_time), "HH:mm")
        : "00:00",
    );
    setIsAllDay(eventToEdit.is_all_day ?? true);

    setTimeout(() => {
      const eventElement = document.getElementById(`event-${eventId}`);
      if (eventElement && scrollRef.current) {
        eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    if (selectedStartDate) {
      const selectedDate = new Date(selectedStartDate);
      setNewTitle("");
      setStartDate(selectedDate);
      setStartTime("00:00");
      setEndDate(selectedDate);
      setEndTime("00:00");
      setIsAllDay(true);
    } else {
      setNewTitle("");
      setStartDate(undefined);
      setStartTime("00:00");
      setEndDate(undefined);
      setEndTime("00:00");
      setIsAllDay(true);
    }
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side="bottom"
          className="rounded-t-xl gap-y-0 overflow-hidden flex flex-col bg-white border-t border-x shadow-lg p-0"
          style={{ height: `${sheetHeight}vh` }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className="w-full py-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing bg-gray-50"
            onMouseDown={handleDragStart}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDragStart(e);
            }}
            ref={sheetRef}
          >
            <div
              className="w-16 h-4 bg-gray-300 rounded-full flex items-center justify-center"
              onTouchMove={(e) => e.preventDefault()}
            >
              <div className="w-10 h-1 bg-gray-400 rounded-full" />
            </div>
          </div>

          <SheetHeader className="px-4">
            <SheetTitle></SheetTitle>
          </SheetHeader>
          <div className="px-4 flex-1 overflow-y-auto">
            <MemoizedEventContent
              isMobile={isMobile}
              isOwner={isOwner}
              entryId={entryId}
              entry={entry}
              events={events}
              groupedEvents={groupedEvents}
              datesWithEvents={datesWithEvents}
              showAddForm={showAddForm}
              addFormDate={addFormDate}
              newTitle={newTitle}
              newContent={newContent}
              handleTitleChange={handleTitleChange}
              handleContentChange={handleContentChange}
              handleUpdate={handleUpdateWrapper}
              handleDelete={handleDeleteWrapper}
              handleAdd={handleAddWrapper}
              startDate={startDate}
              setStartDate={setStartDate}
              startTime={startTime}
              handleStartTimeChange={handleStartTimeChange}
              endDate={endDate}
              setEndDate={setEndDate}
              endTime={endTime}
              handleEndTimeChange={handleEndTimeChange}
              isAllDay={isAllDay}
              setIsAllDay={setIsAllDay}
              handleReactionToggle={() => {}} // No-op or lift up as needed
              userReactions={userReactions}
              reactions={reactions}
              reactionDetails={reactionDetails}
              comments={comments}
              scrollRef={scrollRef}
              formatDateHeader={formatDateHeader}
              formatTime={formatTime}
              targetUserProfile={targetUserProfile}
              editingEventId={editingEventId}
              handleEditClick={handleEditClick}
              handleCancelEdit={handleCancelEdit}
              handleEventReactionToggle={onEventReactionToggle}
              eventUserReactions={eventUserReactions}
              eventReactions={eventReactions}
              eventReactionDetails={eventReactionDetails}
              eventComments={eventComments}
              commentInputs={commentInputs}
              handleEventCommentChange={handleEventCommentChange}
              handleEventCommentSubmit={handleEventCommentSubmit}
              eventImages={eventImages}
              handleImageUpload={handleImageUpload}
              handleImageDelete={handleImageDelete}
            />
            {/* コメント入力欄 */}
            <div className="mt-4">
              <Textarea
                value={commentText}
                onChange={(e) => onCommentTextChange(e.target.value)}
                placeholder="コメントを入力"
                className="w-full"
              />
              <Button className="mt-2" onClick={onCommentSubmit}>
                投稿
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[30%] h-[50vh] overflow-y-auto"
        style={
          !isOwner ? {} : { top: modalPosition.top, left: modalPosition.left }
        }
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <MemoizedEventContent
            isMobile={isMobile}
            isOwner={isOwner}
            entryId={entryId}
            entry={entry}
            events={events}
            groupedEvents={groupedEvents}
            datesWithEvents={datesWithEvents}
            showAddForm={showAddForm}
            addFormDate={addFormDate}
            newTitle={newTitle}
            newContent={newContent}
            handleTitleChange={handleTitleChange}
            handleContentChange={handleContentChange}
            handleUpdate={handleUpdateWrapper}
            handleDelete={handleDeleteWrapper}
            handleAdd={handleAddWrapper}
            startDate={startDate}
            setStartDate={setStartDate}
            startTime={startTime}
            handleStartTimeChange={handleStartTimeChange}
            endDate={endDate}
            setEndDate={setEndDate}
            endTime={endTime}
            handleEndTimeChange={handleEndTimeChange}
            isAllDay={isAllDay}
            setIsAllDay={setIsAllDay}
            handleReactionToggle={() => {}} // No-op or lift up as needed
            userReactions={userReactions}
            reactions={reactions}
            reactionDetails={reactionDetails}
            comments={comments}
            scrollRef={scrollRef}
            formatDateHeader={formatDateHeader}
            formatTime={formatTime}
            targetUserProfile={targetUserProfile}
            editingEventId={editingEventId}
            handleEditClick={handleEditClick}
            handleCancelEdit={handleCancelEdit}
            handleEventReactionToggle={onEventReactionToggle}
            eventUserReactions={eventUserReactions}
            eventReactions={eventReactions}
            eventReactionDetails={eventReactionDetails}
            eventComments={eventComments}
            commentInputs={commentInputs}
            handleEventCommentChange={handleEventCommentChange}
            handleEventCommentSubmit={handleEventCommentSubmit}
            eventImages={eventImages}
            handleImageUpload={handleImageUpload}
            handleImageDelete={handleImageDelete}
          />
          {/* コメント入力欄 */}
          <div className="mt-4">
            <Textarea
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              placeholder="コメントを入力"
              className="w-full"
            />
            <Button className="mt-2" onClick={onCommentSubmit}>
              投稿
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
