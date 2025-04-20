'use client';

import { useState } from "react";
import LoginModal from "./LoginModal";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SignupModal from "./SignupModal";

export default function Page() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center min-h-screen px-4 py-8 md:py-0">
      {/* ロゴ */}
      <div className="w-full md:w-auto md:flex-shrink-0 mb-6 md:mb-0">
        <Image 
          src="/logo/logo.png" 
          alt="Himalink Logo" 
          width={800} 
          height={800}
          className="w-full max-w-[400px] md:max-w-[800px] mx-auto drop-shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
        />
      </div>
      {/* テキストとログインボタン */}
      <div className="flex flex-col items-center md:ml-5 text-center md:text-left">
        {/* キャッチコピー */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3">
          <div className="mb-4 text-center">
            <span className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-pink-500">
              <span className="relative text-white dark:text-gray-950">暇な日</span>
            </span>
            <br />
          </div>
          持て余してない？
        </h1>
        {/* ログインボタン */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsOpen(true)}
          className="self-center flex items-center justify-center bg-gradient-to-r from-blue-400 to-blue-600 text-white text-lg md:text-xl font-semibold px-6 md:px-8 py-3 md:py-4 rounded-full shadow-lg animate-bounce_small hover:from-blue-500 hover:to-blue-700 transition-all duration-300 mt-12 lg:mt-20 max-w-[280px]"
        >
          ログイン
        </Button>
        {/* アカウントを作成リンク */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => setIsSignupOpen(true)}
          className="mt-8 lg:mt-10 text-blue-500 text-lg md:text-xl font-semibold hover:underline"
        >
          アカウントを作成
        </Button>
      </div>
      {isOpen && <LoginModal onClose={() => setIsOpen(false)} />}
      {isSignupOpen && <SignupModal onClose={() => setIsSignupOpen(false)} />}
    </div>
  );
}