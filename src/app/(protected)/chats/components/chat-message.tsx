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
  avatarUrl: string;            // 相手のアバター
}

export default function ChatWindow({ messages, onSend, avatarUrl }: ChatWindowProps) {
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
    <div className="flex flex-col pb-4 h-full w-full">
      <div
        ref={chatContainerRef}
        className="border p-4 overflow-y-auto mb-4 bg-white rounded flex flex-col"
      >
        {messages.map((msg, idx) => {
          const isMine = msg.sender_id === user?.id;
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const showTime =
            idx === 0 ||
            (prevMsg &&
              new Date(msg.created_at).getTime() -
                new Date(prevMsg.created_at).getTime() >
                5 * 60 * 1000); // 5分
          const showAvatar =
            !isMine &&
            (idx === 0 ||
              (prevMsg && prevMsg.sender_id !== msg.sender_id) ||
              (prevMsg &&
                new Date(msg.created_at).getTime() -
                  new Date(prevMsg.created_at).getTime() >
                  5 * 60 * 1000));
          return (
            <div key={msg.id} className="flex flex-col mb-2">
              {showTime && (
                <div className="text-center text-xs text-gray-400 mb-1">
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              )}
              <div
                className={`flex ${
                  isMine ? "justify-end" : "justify-start"
                } items-end gap-2`}
              >
                {!isMine && (
                  showAvatar ? (
                    avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="avatar"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6" />
                    )
                  ) : (
                    // spacer to keep left alignment when avatar is hidden
                    <div className="w-6 h-6" />
                  )
                )}
                <div
                  className={`p-2 rounded-lg max-w-[60%] ${
                    isMine
                      ? "bg-blue-100 text-right"
                      : "bg-gray-100 text-left"
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{msg.message}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 px-4">
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