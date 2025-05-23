"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import ChatWindow from "./components/chat-message";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUser } from "@/hooks/use-user";

type User = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
};

export default function ChatPage() {
  const supabase = createClient();
  const { user } = useUser();   // 現在ログインしているユーザー
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [openSheet, setOpenSheet] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});

  const fetchMessages = async (targetUserId: string) => {
    const { data, error } = await supabase.rpc("get_chat_messages", {
      p_user_id: targetUserId,
    });
    if (error || !data) return;

    // 全メッセージを保存
    setMessages(data);

    // 最新メッセージをカードに反映（データがない場合は空文字）
    if (data.length > 0) {
      const latest = data.reduce((a: ChatMessage, b: ChatMessage) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b
      );
      setLatestMessages((prev) => ({
        ...prev,
        [targetUserId]: latest.message,
      }));
    } else {
      setLatestMessages((prev) => ({
        ...prev,
        [targetUserId]: "",
      }));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedUserId) return;
    const { error } = await supabase.rpc("add_chat_message", {
      p_message: text,
      p_recipient_id: selectedUserId,
    });
    // Realtime サブスクで自動反映されるので即時リロード不要
  };

  const fetchFollowingUsers = async () => {
    const { data, error } = await supabase.rpc("get_following_users");
    if (!error && data) {
      setFollowingUsers(data);
      data.forEach((u: User) => fetchMessages(u.id));
    }
  };

  useEffect(() => {
    fetchFollowingUsers();
  }, []);

  // Realtime で ChatMessages の INSERT を購読
  useEffect(() => {
    if (!user) return; // 認証前は購読しない

    const channel = supabase
      .channel("chat_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ChatMessages",
        },
        (payload: any) => {
          const msg = payload.new as ChatMessage;

          // 自分が sender か recipient でなければ無視
          if (msg.sender_id !== user.id && msg.recipient_id !== user.id) return;

          // 相手IDを判定
          const otherId =
            msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;

          // 最新メッセージをカードへ
          setLatestMessages((prev) => ({
            ...prev,
            [otherId]: msg.message,
          }));

          // 現在開いているチャットならメッセージリストにも追加
          if (selectedUserId === otherId) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId]);

  const selectedUser = followingUsers.find((u) => u.id === selectedUserId);

  return (
    <>
      <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-6">
        <div className="sm:w-1/3">
          <h2 className="font-semibold mb-2">フォロー中のユーザー:</h2>
          <div className="grid grid-cols-1 gap-3">
            {followingUsers.map((user) => (
              <Card
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id);
                  setOpenSheet(true);
                  fetchMessages(user.id);
                }}
                className={`flex flex-row items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedUserId === user.id ? "border-blue-500" : ""
                }`}
              >
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                )}
                <div className="flex flex-col">
                  <span className="truncate font-medium">
                    {user.username || user.full_name}
                  </span>
                  <span className="text-sm text-gray-500 truncate max-w-[200px]">
                    {latestMessages[user.id] ?? ""}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md px-0">
          <SheetHeader>
            <SheetTitle>チャット</SheetTitle>
          </SheetHeader>
          {selectedUserId ? (
            <ChatWindow
              messages={messages}
              onSend={handleSendMessage}
              avatarUrl={selectedUser?.avatar_url || ""}
            />
          ) : (
            <div className="text-center text-gray-500 mt-4">
              ユーザーを選択してください
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}