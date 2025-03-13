"use client";

import React, { useState } from "react";
import { login } from "./actions";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // アイコンをインポート

// onClose プロパティの型を定義
interface LoginModalProps {
  onClose: () => void; // 閉じるための関数
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("password");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    await login(formData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0, 0, 0, 0.78)] z-50"> {/* rgbaで透過度を設定 */}
      <div className="bg-[rgba(79, 179, 179, 0.97)] rounded-lg p-6 max-w-sm w-full"> {/* モーダルの色をrgbaで設定 */}
        <h1 className="text-2xl font-bold mb-6 text-white">ひまリンクにログイン</h1>
        {/* メールアドレス入力 */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="w-full max-w-md">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded bg-white text-black mb-4" // 入力フォームの色を白に、文字色を黒に
              required
            />
            <button
              type="submit"
              className="w-full bg-[#3B8B8B] text-white py-3 rounded-lg" // ボタンの色を変更
            >
              次へ
            </button>
            <button className="w-full text-blue-300 mt-4" onClick={onClose}>
              パスワードを忘れた場合はこちら
            </button>
          </form>
        )}

        {/* パスワード入力 */}
        {step === "password" && (
          <form onSubmit={handleLogin} className="w-full max-w-md">
            <p className="text-sm text-gray-200 mb-2">メールアドレス</p>
            <div className="w-full border p-3 rounded bg-gray-800 text-white mb-4">
              {email}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-3 rounded bg-white text-black" // 入力フォームの色を白に、文字色を黒に
                required
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-[#3B8B8B] text-white py-3 rounded-lg mt-4" // ボタンの色を変更
            >
              ログイン
            </button>
          </form>
        )}
      </div>
    </div>
  );
}