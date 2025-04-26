import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user"; // ユーザー情報取得想定
import { Memo } from "../../../types";

export function MemoEditor({ onSaved }: { onSaved: (memo: any) => void }) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = async () => {
    if (!user) {
      console.error("ユーザー情報が取得できていません");
      return;
    }

    const newMemo = {
      title,
      body,
      user_id: user.id,
      user_name: user.user_metadata.name || "名無し",
    };

    const res = await fetch("/api/memo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMemo),
    });

    if (res.ok) {
      const created: Memo = await res.json();
      onSaved(created);
      setTitle(""); // 入力リセット
      setBody("");
    } else {
      console.error("メモの作成に失敗しました");
    }
  };


  return (
    <div className="space-y-4">
      <Input placeholder="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="本文" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
      <Button onClick={handleSubmit}>保存</Button>
    </div>
  );
}