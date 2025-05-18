// src/app/(protected)/chats/components/chat-message.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
};

interface ChatWindowProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

export default function ChatWindow({ messages, onSend }: ChatWindowProps) {
  const { user, loading } = useUser();

  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSend(newMessage);
    setNewMessage("");
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="flex flex-col w-full">
      <div
        ref={chatContainerRef}
        className="border p-4 h-[400px] overflow-y-auto mb-4 bg-white rounded flex flex-col"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 p-2 rounded max-w-[75%] ${
              msg.sender_id === user?.id
                ? "bg-blue-100 text-right self-end ml-auto"
                : "bg-gray-100 text-left"
            }`}
          >
            <div className="text-sm text-gray-600">
              {msg.sender_id === user?.id ? "あなた" : "相手"}
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