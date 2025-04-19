// EventDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Save, Trash, Check } from "lucide-react";

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

export function EventDialog({
    open,
    onOpenChange,
    entryId,
    targetUserId,
    isOwner,
    selectedStartDate,
    selectedEndDate,
    modalPosition = { top: 100, left: 100 },
}: EventDialogProps) {
    const [entry, setEntry] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [reactions, setReactions] = useState<Record<string, number>>({});
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

    const supabase = createClient();

    useEffect(() => {
        if (!entryId || !open) return;
        const fetchData = async () => {
            const { data: entryData } = await supabase.rpc("get_entry_with_details", { p_entry_id: entryId });
            const { data: commentData } = await supabase.rpc("get_entry_comments", { p_entry_id: entryId });
            const { data: reactionData } = await supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId });
            const entry = entryData?.[0] ?? null;
            setEntry(entry);
            setNewTitle(entry?.title ?? "");
            setIsAllDay(entry?.is_all_day ?? true);
            if (entry?.start_time) {
                const start = new Date(entry.start_time);
                setStartDate(start);
                setStartTime(format(start, "HH:mm"));
            }
            if (entry?.end_time) {
                const end = new Date(entry.end_time);
                setEndDate(end);
                setEndTime(format(end, "HH:mm"));
            }
            setComments(commentData ?? []);
            setReactions(Object.fromEntries((reactionData ?? []).map((r: any) => [r.reaction_type, r.count])));
        };
        fetchData();
    }, [entryId, open]);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[25%] max-w-xl"
                style={!isOwner ? {} : { top: modalPosition.top, left: modalPosition.left }}>
                <DialogHeader>
                    {isOwner && (
                        <>
                            <div className="flex justify-end">
                                {entryId ? (
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
                                )}
                            </div>
                        </>
                    )}
                    <DialogTitle className="flex flex-col gap-2">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="イベントタイトルを入力"
                            className="w-full"
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
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-[120px]"
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
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-[120px]"
                                    />
                                )}
                            </div>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                    <div className="flex items-center space-x-2 mt-2">
                        <Switch
                            id="all-day"
                            checked={isAllDay}
                            onCheckedChange={setIsAllDay}
                        />
                        <Label htmlFor="all-day">終日</Label>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <p>{entry?.content}</p>
                    <div className="flex gap-2">
                        {["👍", "❤️", "😂", "🍻"].map((emoji) => (
                            <Button key={emoji} variant="outline" size="sm">
                                {emoji} {reactions[emoji] || 0}
                            </Button>
                        ))}
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
            </DialogContent>
        </Dialog>
    );
}
