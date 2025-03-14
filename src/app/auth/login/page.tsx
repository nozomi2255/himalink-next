'use client';

import { useState } from "react";
import LoginModal from "./LoginModal";
import Image from "next/image";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-row items-center justify-center min-h-screen bg-gradient-to-b from-[rgba(135,206,250,1)] to-[rgba(0,191,255,1)] text-gray-800 animate-fade-in">
      {/* 左側: ロゴ */}
      <div className="flex-shrink-0 -ml-50">
        <Image 
          src="/logo/logo.png" 
          alt="Himalink Logo" 
          width={800} 
          height={800} 
        />
      </div>
      {/* 右側: テキストとログインボタン */}
      <div className="flex flex-col items-center ml-8 -mt-20">
        {/* キャッチコピー */}
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-6">
          <div className="mb-4">
          <span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-pink-500">
            <span className="relative text-white dark:text-gray-950">暇な日</span>
          </span>
          <br />
          </div>
          を持て余す。
        </h1>
        {/* ログインボタン */}
        <button
          onClick={() => setIsOpen(true)}
          className="self-center flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xl font-semibold px-8 py-4 rounded-full shadow-lg animate-bounce_small hover:from-blue-500 hover:to-blue-700 transition-all duration-300 mt-20"
        >
          ログイン
        </button>
      </div>
      {isOpen && <LoginModal onClose={() => setIsOpen(false)} />}
    </div>
  );
}