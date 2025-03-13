"use client";

import { useState } from "react";
import LoginModal from "./LoginModal";
import Image from "next/image";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[rgba(135,206,250,1)] to-[rgba(0,191,255,1)] text-gray-800 animate-fade-in">
      {/* ロゴ */}
      <Image src="/logo.png" alt="Himalink Logo" width={120} height={120} className="mb-4" />
      {/* キャッチコピー */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
        暇な日をシェアして、<br />集まろう！
      </h1>
      {/* ログインボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-400 to-blue-600 text-white text-lg font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
      >
        ログイン
      </button>
      {isOpen && <LoginModal onClose={() => setIsOpen(false)} />}
    </div>
  );
}