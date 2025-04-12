"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client"; // ←適宜パス変更

interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string; // 表示対象イベントの ID
  currentUserId: string;
}

export function EventDetailDialog({ open, onOpenChange, entryId, currentUserId }: EventDetailDialogProps) {
  const [entry, setEntry] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (!entryId || !open) return;
    const supabase = createClient();

    const fetchData = async () => {
      const { data: entryData } = await supabase.rpc("get_entry_with_details", { p_entry_id: entryId });
      const { data: commentData } = await supabase.rpc("get_entry_comments", { p_entry_id: entryId });
      const { data: reactionData } = await supabase.rpc("get_entry_reactions_summary", { p_entry_id: entryId });

      setEntry(entryData?.[0] ?? null);
      setComments(commentData ?? []);
      setReactions(Object.fromEntries((reactionData ?? []).map((r: any) => [r.reaction_type, r.count])));
    };

    fetchData();
  }, [entryId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry?.title ?? "読み込み中..."}</DialogTitle>
          <DialogDescription>
            {entry?.start_time} - {entry?.end_time} @ {entry?.location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p>{entry?.content}</p>

          {/* Reactions */}
          <div className="flex gap-2">
            {["👍", "❤️", "😂", "🍻"].map((emoji) => (
              <Button key={emoji} variant="outline" size="sm">
                {emoji} {reactions[emoji] || 0}
              </Button>
            ))}
          </div>

          {/* Comments */}
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