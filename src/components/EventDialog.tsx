// EventDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { Save, Trash, Check } from "lucide-react";

interface EventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entryId?: string;
    currentUserId: string;
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
    currentUserId,
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

    const supabase = createClient();

    useEffect(() => {
        if (!entryId || !open) return;
        const fetchData = async () => {
            const { data: entryData } = await supabase.rpc("get_entry_with_details", { p_entry_id: entryId });
            const { data: commentData } = await supabase.rpc("get_entry_comments", { p_entry_id: entryId });
            const { data: reactionData } = await supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId });
            setEntry(entryData?.[0] ?? null);
            setNewTitle(entryData?.[0]?.title ?? "");
            setComments(commentData ?? []);
            setReactions(Object.fromEntries((reactionData ?? []).map((r: any) => [r.reaction_type, r.count])));
        };
        fetchData();
    }, [entryId, open]);

    const handleAdd = async () => {
        await fetch("/api/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: newTitle,
                start_time: selectedStartDate,
                end_time: selectedEndDate,
                is_all_day: true,
                entry_type: "event",
            }),
        });
        onOpenChange(false);
    };

    const handleUpdate = async () => {
        await fetch(`/api/event?eventId=${entryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTitle }),
        });
        onOpenChange(false);
    };

    const handleDelete = async () => {
        await fetch(`/api/event?eventId=${entryId}`, { method: "DELETE" });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-[30%] max-w-xl"
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
                    <DialogTitle className="flex flex-row gap-2">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="イベントタイトルを入力"
                            className="mb-4 w-full"
                        />
                        <div className="text-sm whitespace-pre-line">
                            {formatTime(entry?.start_time ?? selectedStartDate)} {"\n"} {formatTime(entry?.end_time ?? selectedEndDate)}
                        </div>
                    </DialogTitle>
                    <DialogDescription>

                    </DialogDescription>
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
