// EventDialog.tsx
"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, compareAsc, format, isSameDay, isToday, isTomorrow, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";
import { toZonedTime, format as formatTz } from 'date-fns-tz';
import { CalendarIcon, Clock, GripHorizontal, Plus, ChevronUp, ChevronDown, MapPin, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Save, Trash, Check, Users } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Event, UserProfile } from "@/app/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    targetUserProfile?: UserProfile;
}

function formatTime(datetime?: string, timeZone: string = 'Asia/Tokyo') {
    if (!datetime) return "-";
    try {
        const date = new Date(datetime);
        if (isNaN(date.getTime())) {
             console.error("Invalid date string provided to formatTime:", datetime);
             return "-";
        }
        const zonedDate = toZonedTime(date, timeZone);
        return formatTz(zonedDate, 'HH:mm', { timeZone, locale: ja });
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
    handleTitleChange: (value: string) => void;
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
    handleUpdate: () => void;
    handleDelete: () => void;
    handleAdd: () => void;
    handleReactionToggle: (emoji: string) => void;
    userReactions: string[];
    reactions: Record<string, number>;
    reactionDetails: Record<string, ReactionDetail>;
    comments: any[];
    scrollRef: React.RefObject<HTMLDivElement | null>;
    formatDateHeader: (date: Date) => string;
    formatTime: (datetime?: string) => string;
    targetUserProfile?: UserProfile;
}

const MemoizedEventContent = memo<EventContentProps>(({ 
    isMobile, 
    isOwner, 
    entryId, 
    entry,
    events,
    groupedEvents,
    datesWithEvents,
    showAddForm,
    addFormDate,
    newTitle,
    handleTitleChange,
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
    targetUserProfile
}) => {
    return (
        <>
            <div className="flex flex-col gap-4">

                <ScrollArea className="flex-1" ref={scrollRef}>
                    <div className="divide-y">
                        {(() => {
                            const allDates = [...datesWithEvents];

                            if (showAddForm && addFormDate && !datesWithEvents.some(date =>
                                format(date, "yyyy-MM-dd") === format(addFormDate, "yyyy-MM-dd")
                            )) {
                                allDates.push(addFormDate);
                            }

                            return allDates.sort(compareAsc).map(date => {
                                const dateStr = format(date, "yyyy-MM-dd");
                                const eventsOnDate = groupedEvents[dateStr] || [];
                                const isSelectedDate = addFormDate && format(addFormDate, "yyyy-MM-dd") === dateStr;

                                return (
                                    <div key={dateStr} id={`date-${dateStr}`} className="py-2">
                                        <div className="sticky top-0 bg-white px-4 py-2 z-10 flex justify-between items-center">
                                            <h3 className="font-medium">{formatDateHeader(date)}</h3>
                                        </div>

                                        <div className="space-y-4 px-4 mt-2">
                                            {isSelectedDate && showAddForm && !entryId && (
                                                <div
                                                    key={`add-form-${dateStr}`}
                                                    className="p-3 rounded-lg border border-dashed border-blue-400 bg-blue-50"
                                                >
                                                    <div className={cn("flex justify-end", isMobile && "mb-4")}>
                                                        {isOwner && (
                                                            entryId ? (
                                                                <>
                                                                    <Button onClick={handleUpdate} variant="ghost" size="icon">
                                                                        <Save className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button onClick={handleDelete} variant="ghost" size="icon">
                                                                        <Trash className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button onClick={handleAdd} variant="ghost" size="icon">
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                            )
                                                        )}
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
                                                                            !startDate && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {startDate ? format(startDate, "M'月'dd'日'") : <span>開始日を選択</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0">
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
                                                                            !endDate && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {endDate ? format(endDate, "M'月'dd'日'") : <span>終了日を選択</span>}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0">
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
                                                </div>
                                            )}

                                            {eventsOnDate.map((event, index) => (
                                                <div key={event.id} className="space-y-2">
                                                    <div
                                                        id={`event-${event.id}`}
                                                        className={`p-3 rounded-lg border bg-white border-gray-200 shadow-sm`}
                                                    >
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex items-start gap-2">
                                                                    <div className="text-sm font-medium text-slate-500 min-w-[45px] mt-0.5">
                                                                        {formatTime(event.start_time)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium">{event.title}</div>
                                                                        {event.location && (
                                                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                                <MapPin className="h-3 w-3" />
                                                                                {event.location}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {event.is_all_day && (
                                                                    <Badge variant="outline" className="text-xs">終日</Badge>
                                                                )}
                                                            </div>

                                                            {!event.is_all_day && (
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                                                                </div>
                                                            )}

                                                            {event.content && (
                                                                <div className="text-sm mt-1 border-t pt-2">
                                                                    {event.content}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
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
                            <div className="py-12 text-center text-muted-foreground">予定はありません</div>
                        )}
                    </div>
                </ScrollArea>

                {targetUserProfile && (
                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Avatar>
                                    <AvatarImage src={targetUserProfile.avatarUrl || undefined} alt={targetUserProfile.username || 'User Avatar'} />
                                    <AvatarFallback>{targetUserProfile.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                {targetUserProfile.username || 'ユーザー'}
                            </CardTitle>
                            <CardDescription>プロフィール</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>{targetUserProfile.bio || '自己紹介はありません。'}</p>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    <p>{entry?.content}</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            {["👍", "❤️"].map((emoji) => (
                                <div key={emoji} className="relative group">
                                    <Button
                                        variant={userReactions.includes(emoji) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleReactionToggle(emoji)}
                                    >
                                        {emoji} {reactions[emoji] || 0}
                                    </Button>
                                    {reactionDetails[emoji]?.users?.length > 0 && (
                                        <div className="absolute top-full left-0 mt-1 bg-white p-2 rounded shadow-md z-10 hidden group-hover:block w-max border border-gray-200">
                                            {reactionDetails[emoji].users.map((user) => (
                                                <div key={user.user_id} className="text-xs py-1 flex items-center gap-1">
                                                    <span className="font-semibold">{user.username}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {Object.entries(reactionDetails).length > 0 && (
                            <div className="text-xs text-gray-500">
                                {Object.entries(reactionDetails).map(([emoji, detail]) => (
                                    detail.users.length > 0 && (
                                        <div key={emoji} className="flex items-center gap-1 mt-1">
                                            <span>{emoji}</span>
                                            <span className="font-semibold">
                                                {detail.users.slice(0, 3).map(u => u.username).join(', ')}
                                                {detail.users.length > 3 ? ` 他${detail.users.length - 3}人` : ''}
                                            </span>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-medium">コメント</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {comments.map((c) => (
                                <div key={c.id} className="border rounded p-2 text-sm">
                                    <span className="font-semibold">{c.user_id}</span>: {c.comment}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
});

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
}: EventDialogProps) {
    const [entry, setEntry] = useState<Event | null>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [reactions, setReactions] = useState<Record<string, number>>({});
    const [reactionDetails, setReactionDetails] = useState<Record<string, ReactionDetail>>({});
    const [userReactions, setUserReactions] = useState<string[]>([]);
    const [commentText, setCommentText] = useState("");
    const [newTitle, setNewTitle] = useState("");
    const [isAllDay, setIsAllDay] = useState(true);
    const [startDate, setStartDate] = useState<Date | undefined>(
        selectedStartDate ? new Date(selectedStartDate) : undefined
    );
    const [endDate, setEndDate] = useState<Date | undefined>(
        selectedEndDate ? new Date(selectedEndDate) : undefined
    );
    const [startTime, setStartTime] = useState("00:00");
    const [endTime, setEndTime] = useState("00:00");
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [sheetHeight, setSheetHeight] = useState(70);
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragStartYRef = useRef(0);
    const startHeightRef = useRef(0);

    const supabase = createClient();

    const [showAddForm, setShowAddForm] = useState(false)
    const [addFormDate, setAddFormDate] = useState<Date | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if ("touches" in e) {
            e.stopPropagation();
            document.body.style.overflow = "hidden";
        }

        const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

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

        const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

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

    const groupedEvents = events?.reduce(
        (groups: Record<string, Event[]>, event: Event) => {
            const dateStr = format(event.start_time, "yyyy-MM-dd")
            if (!groups[dateStr]) {
                groups[dateStr] = []
            }
            groups[dateStr].push(event)
            return groups
        },
        {} as Record<string, Event[]>,
    ) || {}

    const datesWithEvents = Object.keys(groupedEvents)
        .map((dateStr) => new Date(dateStr))
        .sort(compareAsc)

    const dateRange = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i - 15))

    const sortedDates = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        return {
            date,
            events: (groupedEvents[dateStr] || []).sort((a, b) => a.start_time.localeCompare(b.start_time)),
        }
    })

    useEffect(() => {
        console.log("[Form Data Effect] Triggered", { entryId, selectedStartDate });
        if (entryId && entry) {
            console.log("[Form Data Effect] Populating from entry");
            setNewTitle(entry.title ?? "");
            setStartDate(entry.start_time ? new Date(entry.start_time) : undefined);
            setStartTime(entry.start_time ? format(new Date(entry.start_time), "HH:mm") : "00:00");
            setEndDate(entry.end_time ? new Date(entry.end_time) : undefined);
            setEndTime(entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "00:00");
            setIsAllDay(entry.is_all_day ?? true);
        } else if (!entryId && selectedStartDate) {
            console.log("[Form Data Effect] Resetting for new date selection");
            const selectedDate = new Date(selectedStartDate);
            setNewTitle("");
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
        console.log("[Visibility Effect] Triggered", { entryId, selectedStartDate });
        if (entryId) {
            console.log("[Visibility Effect] Hiding form (event selected)");
            setShowAddForm(false);
        } else if (selectedStartDate) {
            console.log("[Visibility Effect] Showing form (date selected)");
            setShowAddForm(true);
        } else {
            console.log("[Visibility Effect] Hiding form (neither selected)");
            setShowAddForm(false);
        }
    }, [entryId, selectedStartDate]);

    useEffect(() => {
        console.log("[Scroll Effect] Triggered", { entryId, addFormDate, showAddForm });
        if (entryId) {
            console.log("[Scroll Effect] Scrolling to event", entryId);
            setTimeout(() => {
                const eventElement = document.getElementById(`event-${entryId}`);
                if (eventElement && scrollRef.current) {
                    eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
        } else if (showAddForm && addFormDate) {
            const dateStr = format(addFormDate, "yyyy-MM-dd");
            console.log("[Scroll Effect] Scrolling to date", dateStr);
            setTimeout(() => {
                if (!scrollRef.current) return;
                const dateElement = document.getElementById(`date-${dateStr}`);
                if (dateElement) {
                    dateElement.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                    console.log("[Scroll Effect] Date element not found, using fallback");
                    const sortedEventDates = datesWithEvents.map(d => format(d, "yyyy-MM-dd")).sort();
                    let nextDateStr: string | null = null;
                    for (const eventDateStr of sortedEventDates) {
                        if (eventDateStr > dateStr) {
                            nextDateStr = eventDateStr;
                            break;
                        }
                    }
                    if (nextDateStr) {
                        const nextDateElement = document.getElementById(`date-${nextDateStr}`);
                        if (nextDateElement) {
                            nextDateElement.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                    } else {
                        const lastDateStr = sortedEventDates[sortedEventDates.length - 1];
                        if (lastDateStr) {
                            const lastDateElement = document.getElementById(`date-${lastDateStr}`);
                            if (lastDateElement) {
                                lastDateElement.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                        }
                    }
                }
            }, 100);
        }
    }, [entryId, addFormDate, showAddForm, datesWithEvents, scrollRef]);

    useEffect(() => {
        if (!open) {
            if (entry) setEntry(null);
            return;
        }

        if (!entryId) {
            if (entry) {
                console.log('[Fetch Data Effect] Clearing entry state because entryId is null');
                setEntry(null);
            }
            return;
        }
        
        console.log("[Fetch Data Effect] Triggered for entryId:", entryId);
        let isMounted = true;
        const fetchData = async () => {
            try {
                const [entryResult, commentResult, reactionResult, reactionUsersResult] = await Promise.all([
                    supabase.rpc("get_entry_with_details", { p_entry_id: entryId }),
                    supabase.rpc("get_entry_comments", { p_entry_id: entryId }),
                    supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId }),
                    supabase.rpc("get_entry_reaction_users", { p_entry_id: entryId })
                ]);

                if (!isMounted) return;

                const fetchedEntry = entryResult.data?.[0] ?? null;
                setEntry(fetchedEntry);

                setComments(commentResult.data ?? []);

                setReactions(Object.fromEntries((reactionResult.data ?? []).map((r: any) => [r.reaction_type, r.count])));

                const detailsMap: Record<string, ReactionDetail> = {};
                const currentUserReactionsSet = new Set<string>();
                const { data: { user } } = await supabase.auth.getUser();
                const currentUserId = user?.id;

                if (reactionUsersResult.data) {
                    reactionUsersResult.data.forEach((reaction: any) => {
                        if (!detailsMap[reaction.reaction_type]) {
                            detailsMap[reaction.reaction_type] = { count: 0, users: [] };
                        }
                        detailsMap[reaction.reaction_type].count++;
                        detailsMap[reaction.reaction_type].users.push({
                            user_id: reaction.user_id,
                            username: reaction.username || reaction.user_id,
                            avatar_url: reaction.avatar_url
                        });
                        if (reaction.user_id === currentUserId) {
                            currentUserReactionsSet.add(reaction.reaction_type);
                        }
                    });
                }
                setReactionDetails(detailsMap);
                setUserReactions(Array.from(currentUserReactionsSet));

            } catch (error) {
                console.error("[Fetch Data Effect] Error fetching data:", error);
                 if (!isMounted) return;
                 setEntry(null);
                 setComments([]);
                 setReactions({});
                 setReactionDetails({});
                 setUserReactions([]);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [entryId, open, supabase]);

    const combineDateTime = (date: Date | undefined, time: string): string | undefined => {
        if (!date) return undefined;
        const [hours, minutes] = time.split(':');
        const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(hours), parseInt(minutes));
        if (isNaN(newDate.getTime())) {
            console.error("Invalid date/time combination:", date, time);
            return undefined;
        }
        return newDate.toISOString();
    };

    const handleAdd = async () => {
        const { error } = await supabase.rpc('insert_entry', {
            p_user_id: targetUserId,
            p_title: newTitle,
            p_start_time: combineDateTime(startDate, startTime),
            p_end_time: combineDateTime(endDate, endTime),
            p_is_all_day: isAllDay,
            p_entry_type: "event",
        });

        if (error) {
            console.error('RPC insert_entry error:', error);
        } else {
            onOpenChange(false);
        }
    };

    const handleUpdate = async () => {
        const { error } = await supabase.rpc('update_entry', {
            p_id: entryId,
            p_title: newTitle,
            p_start_time: combineDateTime(startDate, startTime),
            p_end_time: combineDateTime(endDate, endTime),
            p_is_all_day: isAllDay,
        });

        if (error) {
            console.error('RPC update_entry error:', error);
        } else {
            onOpenChange(false);
        }
    };

    const handleDelete = async () => {
        const { error } = await supabase.rpc('delete_entry', {
            p_id: entryId,
        });

        if (error) {
            console.error('RPC delete_entry error:', error);
        } else {
            onOpenChange(false);
        }
    };

    const handleReactionToggle = async (emoji: string) => {
        if (!entryId) return;

        try {
            const { data: existingReaction } = await supabase.rpc('get_user_reaction', {
                p_entry_id: entryId,
                p_reaction_type: emoji
            });
            console.log("get_user_reaction実行結果:", { existingReaction });

            if (existingReaction && existingReaction.length > 0) {
                const { error, data } = await supabase.rpc('delete_entry_reaction', {
                    p_entry_id: entryId,
                    p_reaction_type: emoji
                });

                console.log("削除実行結果:", { error, data });
                if (error) {
                    console.error("削除エラー詳細:", error);
                    throw error;
                }

                console.log("削除されたリアクション数:", data?.[0]?.deleted_count || 0);

                const { data: newReactionData } = await supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId });

                setUserReactions(prev => prev.filter(r => r !== emoji));
            } else {
                const { error } = await supabase.rpc('add_entry_reaction', {
                    p_entry_id: entryId,
                    p_reaction_type: emoji
                });

                if (error) throw error;

                setUserReactions(prev => [...prev, emoji]);
            }

            const { data: reactionData } = await supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId });
            const { data: reactionUsersData } = await supabase.rpc("get_entry_reaction_users", { p_entry_id: entryId });

            setReactions(Object.fromEntries((reactionData ?? []).map((r: any) => [r.reaction_type, r.count])));

            const detailsMap: Record<string, ReactionDetail> = {};
            if (reactionUsersData) {
                reactionUsersData.forEach((reaction: any) => {
                    if (!detailsMap[reaction.reaction_type]) {
                        detailsMap[reaction.reaction_type] = {
                            count: 0,
                            users: []
                        };
                    }
                    detailsMap[reaction.reaction_type].count++;
                    detailsMap[reaction.reaction_type].users.push({
                        user_id: reaction.user_id,
                        username: reaction.username || reaction.user_id,
                        avatar_url: reaction.avatar_url
                    });
                });
            }
            setReactionDetails(detailsMap);
        } catch (error) {
            console.error('リアクション処理エラー:', error);
        }
    };

    const handleTitleChange = useCallback((value: string) => {
        setNewTitle(value);
    }, []);

    const handleStartTimeChange = useCallback((value: string) => {
        setStartTime(value);
    }, []);

    const handleEndTimeChange = useCallback((value: string) => {
        setEndTime(value);
    }, []);

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
                        <SheetTitle>
                        </SheetTitle>
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
                            handleTitleChange={handleTitleChange}
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
                            handleUpdate={handleUpdate}
                            handleDelete={handleDelete}
                            handleAdd={handleAdd}
                            handleReactionToggle={handleReactionToggle}
                            userReactions={userReactions}
                            reactions={reactions}
                            reactionDetails={reactionDetails}
                            comments={comments}
                            scrollRef={scrollRef}
                            formatDateHeader={formatDateHeader}
                            formatTime={formatTime}
                            targetUserProfile={targetUserProfile}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[25%] max-w-xl h-[50vh] overflow-y-auto"
                style={!isOwner ? {} : { top: modalPosition.top, left: modalPosition.left }}
                onOpenAutoFocus={(e) => e.preventDefault()}> 
                <DialogHeader>
                    <DialogTitle>
                    </DialogTitle>
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
                        handleTitleChange={handleTitleChange}
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
                        handleUpdate={handleUpdate}
                        handleDelete={handleDelete}
                        handleAdd={handleAdd}
                        handleReactionToggle={handleReactionToggle}
                        userReactions={userReactions}
                        reactions={reactions}
                        reactionDetails={reactionDetails}
                        comments={comments}
                        scrollRef={scrollRef}
                        formatDateHeader={formatDateHeader}
                        formatTime={formatTime}
                        targetUserProfile={targetUserProfile}
                    />
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
