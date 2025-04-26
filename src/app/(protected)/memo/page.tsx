"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemoList } from "./components/memo-list";
import { MemoEditor } from "./components/memo-editor";
import { Memo } from "../../types";

export default function MemoPage() {
    const [memos, setMemos] = useState<Memo[]>([]);
    const [openEditor, setOpenEditor] = useState(false);

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

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>みんなのメモ</CardTitle>
                <Dialog open={openEditor} onOpenChange={setOpenEditor}>
                    <DialogTrigger asChild>
                        <Button>＋ 新規メモ</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle></DialogTitle>
                        <MemoEditor onSaved={(newMemo) => setMemos((prev) => [newMemo, ...prev])} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <MemoList memos={memos} />
            </CardContent>
        </Card>
    );
}