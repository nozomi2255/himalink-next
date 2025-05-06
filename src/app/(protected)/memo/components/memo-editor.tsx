import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user"; // ユーザー情報取得想定
import { Memo } from "../../../types";

// Props の型定義を更新
interface MemoEditorProps {
  initialMemo?: Memo; // オプションの初期メモデータ
  onSaved: (memo: Memo) => void;
  onCancel: () => void; // キャンセルハンドラ
}

export function MemoEditor({ initialMemo, onSaved, onCancel }: MemoEditorProps) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // initialMemo が変更されたらフォームを更新
  useEffect(() => {
    if (initialMemo) {
      setTitle(initialMemo.title);
      setBody(initialMemo.body);
    } else {
      // 新規作成の場合やダイアログが閉じた後に初期化
      setTitle("");
      setBody("");
    }
  }, [initialMemo]);

  const handleSave = async () => {
    if (!user && !initialMemo) { // 新規作成時のみユーザーチェック
      console.error("ユーザー情報が取得できていません");
      return;
    }

    const memoData = {
      title,
      body,
      // 更新時は user_id, user_name は変更しない想定
      // 新規作成時のみ設定
      ...(initialMemo ? {} : {
          user_id: user?.id,
          user_name: user?.user_metadata?.name || "名無し",
      })
    };

    const url = initialMemo ? `/api/memo/${initialMemo.id}` : "/api/memo";
    const method = initialMemo ? "PUT" : "POST";

    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memoData),
    });

    if (res.ok) {
      const savedMemo: Memo = await res.json();
      onSaved(savedMemo); // onSaved に結果を渡す
      // フォームのリセットは useEffect で initialMemo の変更時に行われる
    } else {
      console.error(`メモの${initialMemo ? '更新' : '作成'}に失敗しました`);
    }
  };


  return (
    <div className="space-y-4">
      <Input placeholder="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="本文" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
      <div className="flex justify-end space-x-2"> {/* ボタンを右寄せ */}
        <Button variant="outline" onClick={onCancel}>キャンセル</Button> {/* キャンセルボタン */}
        <Button onClick={handleSave}>{initialMemo ? '更新' : '保存'}</Button> {/* ボタンテキストを動的に変更 */}
      </div>
    </div>
  );
}