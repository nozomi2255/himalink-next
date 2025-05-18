// src/app/(protected)/chats/[userId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
};

export default function ChatDetailPage() {
  const supabase = createClient();
  const params = useParams();
  const userId = params.userId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = async () => {
    const { data, error } = await supabase.rpc("get_chat_messages", {
      p_user_id: userId,
    });
    if (!error && data) {
      setMessages(data);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase.rpc("add_chat_message", {
      p_message: newMessage,
      p_recipient_id: userId,
    });
    if (!error) {
      setNewMessage("");
      fetchMessages();
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMessages();
    }
  }, [userId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto mt-8 overflow-y-auto">
      <div
        ref={chatContainerRef}
        className="border p-4 h-[400px] overflow-y-auto mb-4 bg-white rounded flex flex-col"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 p-2 rounded max-w-[75%] ${
              msg.sender_id === userId
                ? "bg-blue-100 text-right self-end ml-auto"
                : "bg-gray-100 text-left"
            }`}
          >
            <div className="text-sm text-gray-600">
              {msg.sender_id === userId ? "あなた" : "相手"}
            </div>
            <div className="text-base whitespace-pre-wrap">{msg.message}</div>
            <div className="text-xs text-gray-400">
              {new Date(msg.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="メッセージを入力..."
        />
        <Button onClick={handleSend}>送信</Button>
      </div>
    </div>
  );
}