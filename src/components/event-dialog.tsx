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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { addDays, compareAsc, format, isSameDay, isToday, isTomorrow, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Clock, GripHorizontal, Plus, ChevronUp, ChevronDown, MapPin, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Save, Trash, Check, Users } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/app/types";

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
}

function formatTime(datetime?: string) {
    if (!datetime) return "-";
    return datetime.substring(11, 16); // UTCの "YYYY-MM-DDTHH:mm:ss" から "HH:mm" 抜き出し
}

function formatDateHeader(date: Date) {
    return format(date, "M月d日（E）");
}

// EventContentProps の型定義を追加
interface EventContentProps {
    isMobile: boolean;
    isOwner: boolean;
    entryId?: string;
    entry: any; // entry の型をより具体的にするか、any のままにするか検討
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
}

// EventContent をメモ化されたコンポーネントとして定義
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
    formatTime
}) => {
    // EventContent の中身をここに移動
    return (
        <>
            <div className="flex flex-col gap-4">

                {/* タイムラインビュー */}
                <ScrollArea className="flex-1" ref={scrollRef}>
                    {/* タイムライン表示（予定がある日のみ） */}
                    <div className="divide-y">
                        {/* 既存の日付の配列を取得してソート */}
                        {(() => {
                            const allDates = [...datesWithEvents];

                            // 選択された日付が存在し、追加フォームが表示されている場合は、その日付も含める
                            if (showAddForm && addFormDate && !datesWithEvents.some(date =>
                                format(date, "yyyy-MM-dd") === format(addFormDate, "yyyy-MM-dd")
                            )) {
                                allDates.push(addFormDate);
                            }

                            // 日付を昇順でソート
                            return allDates.sort(compareAsc).map(date => {
                                const dateStr = format(date, "yyyy-MM-dd");
                                const eventsOnDate = groupedEvents[dateStr] || [];
                                const isSelectedDate = addFormDate && format(addFormDate, "yyyy-MM-dd") === dateStr;

                                return (
                                    <div key={dateStr} id={`date-${dateStr}`} className="py-2">
                                        {/* 日付ヘッダー */}
                                        <div className="sticky top-0 bg-white px-4 py-2 z-10 flex justify-between items-center">
                                            <h3 className="font-medium">{formatDateHeader(date)}</h3>
                                        </div>

                                        {/* イベントリスト */}
                                        <div className="space-y-4 px-4 mt-2">
                                            {/* 予定追加フォーム */}
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
                                                    {/* イベントカード */}
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

                                                            {/* イベントの内容があれば表示 */}
                                                            {event.content && (
                                                                <div className="text-sm mt-1 border-t pt-2">
                                                                    {event.content}
                                                                </div>
                                                            )}

                                                            {/* 参加者数は型にないので表示しない */}
                                                            {/* 
                                                            {event.entry_type === "event" && event.participants_count > 0 && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                                    <Users className="h-3 w-3" />
                                                                    <span>{event.participants_count}人参加</span>
                                                                </div>
                                                            )}
                                                            */}

                                                            {/* リアクション情報は型にないので表示しない */}
                                                            {/*
                                                            {event.reactions && Object.keys(event.reactions).length > 0 && (
                                                                <div className="flex gap-1 mt-1">
                                                                    {Object.entries(event.reactions).map(([emoji, count]) => (
                                                                        <Badge key={emoji} variant="secondary" className="text-xs gap-1">
                                                                            {emoji} <span>{count}</span>
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            */}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* イベントがない場合 */}
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
}: EventDialogProps) {
    const [entry, setEntry] = useState<any>(null);
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

    // シートの高さを管理するstate
    const [sheetHeight, setSheetHeight] = useState(70);
    const sheetRef = useRef<HTMLDivElement>(null);
    const dragStartYRef = useRef(0);
    const startHeightRef = useRef(0);

    const supabase = createClient();

    const [showAddForm, setShowAddForm] = useState(false)
    const [addFormDate, setAddFormDate] = useState<Date | null>(null)
    const scrollRef = useRef<HTMLDivElement | null>(null)

    // ドラッグ開始時の処理
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // タッチ操作時は特に慎重に処理
        if ("touches" in e) {
            e.stopPropagation();
            document.body.style.overflow = "hidden"; // ボディのスクロールを無効化
        }

        // マウスイベントとタッチイベントの両方に対応
        const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        dragStartYRef.current = clientY;
        startHeightRef.current = sheetHeight;

        // イベントリスナーを追加
        document.addEventListener("mousemove", handleDragMove, { passive: false });
        document.addEventListener("touchmove", handleDragMove, { passive: false });
        document.addEventListener("mouseup", handleDragEnd);
        document.addEventListener("touchend", handleDragEnd);
    };

    // ドラッグ中の処理
    const handleDragMove = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

        const deltaY = dragStartYRef.current - clientY;
        const windowHeight = window.innerHeight;
        const deltaPercent = (deltaY / windowHeight) * 100;

        // 新しい高さを計算（上にドラッグすると大きく、下にドラッグすると小さく）
        let newHeight = startHeightRef.current + deltaPercent;

        // 高さの制限（最小20%、最大90%）
        newHeight = Math.max(20, Math.min(90, newHeight));

        setSheetHeight(newHeight);
    };

    // ドラッグ終了時の処理
    const handleDragEnd = () => {
        // ボディのスクロールを元に戻す
        document.body.style.overflow = "";

        // イベントリスナーを削除
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("touchmove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
        document.removeEventListener("touchend", handleDragEnd);
    };

    // コンポーネントのアンマウント時にイベントリスナーを削除
    useEffect(() => {
        return () => {
            document.removeEventListener("mousemove", handleDragMove);
            document.removeEventListener("touchmove", handleDragMove);
            document.removeEventListener("mouseup", handleDragEnd);
            document.removeEventListener("touchend", handleDragEnd);
        };
    }, []);

    // 日付ごとにイベントをグループ化
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

    // 予定がある日付のみの配列
    const datesWithEvents = Object.keys(groupedEvents)
        .map((dateStr) => new Date(dateStr))
        .sort(compareAsc)

    // 日付の配列を作成（今日を中心に前後の日付を含む）
    const dateRange = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i - 15))

    // 日付ごとにソートされたイベントリスト
    const sortedDates = dateRange.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        return {
            date,
            events: (groupedEvents[dateStr] || []).sort((a, b) => a.start_time.localeCompare(b.start_time)),
        }
    })

    // --- New Effects --- 

    // Effect 1: Manage Form Data based on entryId or selectedStartDate
    useEffect(() => {
        console.log("[Form Data Effect] Triggered", { entryId, selectedStartDate });
        if (entryId && entry) {
            // Event selected: Populate form from entry state
            console.log("[Form Data Effect] Populating from entry");
            setNewTitle(entry.title ?? "");
            setStartDate(entry.start_time ? new Date(entry.start_time) : undefined);
            setStartTime(entry.start_time ? format(new Date(entry.start_time), "HH:mm") : "00:00");
            setEndDate(entry.end_time ? new Date(entry.end_time) : undefined);
            setEndTime(entry.end_time ? format(new Date(entry.end_time), "HH:mm") : "00:00");
            setIsAllDay(entry.is_all_day ?? true);
        } else if (!entryId && selectedStartDate) {
            // Date selected: Reset form, set dates based on selectedStartDate
            console.log("[Form Data Effect] Resetting for new date selection");
            const selectedDate = new Date(selectedStartDate);
            setNewTitle(""); // ★ Always reset title on date click for simplicity
            setStartDate(selectedDate);
            setStartTime("00:00");
            setEndDate(selectedDate);
            setEndTime("00:00");
            setIsAllDay(true);
            setAddFormDate(selectedDate); // Keep track of the date for the add form
        } else {
            // Neither selected: Potentially clear form (or do nothing if dialog closes)
             console.log("[Form Data Effect] Clearing form (or no action)");
            // setNewTitle("");
            // setStartDate(undefined);
            // setStartTime("00:00");
            // setEndDate(undefined);
            // setEndTime("00:00");
            // setIsAllDay(true);
             setAddFormDate(null); // Clear add form date marker
        }
    }, [entryId, selectedStartDate, entry]); // Depends on entryId, selectedStartDate, and entry state

    // Effect 2: Manage Form Visibility (showAddForm)
    useEffect(() => {
        console.log("[Visibility Effect] Triggered", { entryId, selectedStartDate });
        if (entryId) {
            // Event selected: Hide form
            console.log("[Visibility Effect] Hiding form (event selected)");
            setShowAddForm(false);
        } else if (selectedStartDate) {
            // Date selected: Show form
            console.log("[Visibility Effect] Showing form (date selected)");
            setShowAddForm(true);
        } else {
            // Neither selected: Hide form
            console.log("[Visibility Effect] Hiding form (neither selected)");
            setShowAddForm(false);
        }
    }, [entryId, selectedStartDate]); // Depends only on entryId and selectedStartDate

    // Effect 3: Manage Scrolling
    useEffect(() => {
        console.log("[Scroll Effect] Triggered", { entryId, addFormDate, showAddForm });
        if (entryId) {
            // Scroll to selected event
            console.log("[Scroll Effect] Scrolling to event", entryId);
            setTimeout(() => {
                const eventElement = document.getElementById(`event-${entryId}`);
                if (eventElement && scrollRef.current) {
                    eventElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
        } else if (showAddForm && addFormDate) {
            // Scroll to the date where the add form is shown
            const dateStr = format(addFormDate, "yyyy-MM-dd");
            console.log("[Scroll Effect] Scrolling to date", dateStr);
            setTimeout(() => {
                if (!scrollRef.current) return;
                const dateElement = document.getElementById(`date-${dateStr}`);
                if (dateElement) {
                    dateElement.scrollIntoView({ behavior: "smooth", block: "center" });
                } else {
                    // Fallback scroll logic (if date element doesn't exist yet)
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
    }, [entryId, addFormDate, showAddForm, datesWithEvents, scrollRef]); // Dependencies for scrolling logic

    // Effect 4: Fetch Data (Adjusted slightly for clarity)
    useEffect(() => {
        if (!open) {
            // Dialog closed: Clear entry state
            if (entry) setEntry(null);
            return;
        }

        if (!entryId) {
            // No event selected: Clear entry state
            if (entry) {
                console.log('[Fetch Data Effect] Clearing entry state because entryId is null');
                setEntry(null);
            }
            return;
        }
        
        console.log("[Fetch Data Effect] Triggered for entryId:", entryId);
        let isMounted = true; // Flag to prevent state update on unmounted component
        const fetchData = async () => {
            try {
                // Fetch all data related to the entry
                const [entryResult, commentResult, reactionResult, reactionUsersResult] = await Promise.all([
                    supabase.rpc("get_entry_with_details", { p_entry_id: entryId }),
                    supabase.rpc("get_entry_comments", { p_entry_id: entryId }),
                    supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId }),
                    supabase.rpc("get_entry_reaction_users", { p_entry_id: entryId })
                ]);

                if (!isMounted) return; // Exit if component unmounted during fetch

                // Process entry data
                const fetchedEntry = entryResult.data?.[0] ?? null;
                setEntry(fetchedEntry); // Update entry state first

                // Process comments
                setComments(commentResult.data ?? []);

                // Process reactions summary
                setReactions(Object.fromEntries((reactionResult.data ?? []).map((r: any) => [r.reaction_type, r.count])));

                // Process reaction details and user reactions
                const detailsMap: Record<string, ReactionDetail> = {};
                const currentUserReactionsSet = new Set<string>();
                const { data: { user } } = await supabase.auth.getUser(); // Fetch current user inside async
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

            } catch (error) { // Add error handling
                console.error("[Fetch Data Effect] Error fetching data:", error);
                 if (!isMounted) return;
                 // Optionally reset state on error
                 setEntry(null);
                 setComments([]);
                 setReactions({});
                 setReactionDetails({});
                 setUserReactions([]);
            }
        };

        fetchData();

        return () => {
            isMounted = false; // Cleanup function to set flag on unmount
        };
    }, [entryId, open, supabase]); // Dependencies for fetching data

    const combineDateTime = (date: Date | undefined, time: string): string | undefined => {
        if (!date) return undefined;
        const [hours, minutes] = time.split(":");
        const newDate = new Date(date);
        newDate.setHours(parseInt(hours), parseInt(minutes));
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
            // すでにリアクションしているか確認
            const { data: existingReaction } = await supabase.rpc('get_user_reaction', {
                p_entry_id: entryId,
                p_reaction_type: emoji
            });
            console.log("get_user_reaction実行結果:", { existingReaction });

            if (existingReaction && existingReaction.length > 0) {
                // リアクションが存在する場合は削除         
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

                // データを再取得して状態を更新
                const { data: newReactionData } = await supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId });

                // 状態を更新（ユーザーのリアクションリストから削除）
                setUserReactions(prev => prev.filter(r => r !== emoji));
            } else {
                // リアクションが存在しない場合は追加
                const { error } = await supabase.rpc('add_entry_reaction', {
                    p_entry_id: entryId,
                    p_reaction_type: emoji
                });

                if (error) throw error;

                // 状態を更新（ユーザーのリアクションリストに追加）
                setUserReactions(prev => [...prev, emoji]);
            }

            // データを再取得
            const { data: reactionData } = await supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId });
            const { data: reactionUsersData } = await supabase.rpc("get_entry_reaction_users", { p_entry_id: entryId });

            setReactions(Object.fromEntries((reactionData ?? []).map((r: any) => [r.reaction_type, r.count])));

            // リアクション詳細の更新
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

    // 時間入力用のハンドラー
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
                    {/* ドラッグハンドル */}
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
                        {/* MemoizedEventContent を使用 */}
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
                    {/* MemoizedEventContent を使用 */}
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
                    />
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
