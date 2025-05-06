"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MemoList } from "./components/memo-list";
import { MemoEditor } from "./components/memo-editor";
import { Memo } from "../../types";

export default function MemoPage() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [openEditor, setOpenEditor] = useState(false);
    const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingMemoId, setDeletingMemoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/memo", { method: "GET" });
            if (res.ok) {
                const data: Memo[] = await res.json();
                setMemos(data);
            } else {
                console.error("メモの取得に失敗しました");
            }
        };
        fetchData();
    }, []);

    const handleEdit = (memo: Memo) => {
        setEditingMemo(memo);
        setOpenEditor(true);
    };

    const handleDeleteClick = (memoId: string) => {
        setDeletingMemoId(memoId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingMemoId) return;
        const res = await fetch(`/api/memo/${deletingMemoId}`, { method: "DELETE" });
        if (res.ok) {
            setMemos((prev) => prev.filter((memo) => memo.id !== deletingMemoId));
            setShowDeleteConfirm(false);
            setDeletingMemoId(null);
        } else {
            console.error("メモの削除に失敗しました");
        }
    };

    const handleSave = (savedMemo: Memo) => {
        if (editingMemo) {
            setMemos((prev) => prev.map((m) => (m.id === savedMemo.id ? savedMemo : m)));
        } else {
            setMemos((prev) => [savedMemo, ...prev]);
        }
        setOpenEditor(false);
        setEditingMemo(null);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setEditingMemo(null);
        }
        setOpenEditor(open);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>みんなのメモ</CardTitle>
                <Dialog open={openEditor} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button>＋ 新規メモ</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>{editingMemo ? "メモの編集" : "新規メモ"}</DialogTitle>
                        <MemoEditor
                            initialMemo={editingMemo ?? undefined}
                            onSaved={handleSave}
                            onCancel={() => handleOpenChange(false)}
                         />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <MemoList
                    memos={memos}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                 />
            </CardContent>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>削除確認</DialogTitle>
                        <DialogDescription>
                            本当にこのメモを削除しますか？この操作は元に戻せません。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            キャンセル
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>
                            削除する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}