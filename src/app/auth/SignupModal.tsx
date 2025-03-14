"use client";

import React, { useState, useEffect } from "react";
import { signup } from "./actions"; // サインアップ処理をインポート
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; // アイコンをインポート
import { createClient } from '../../utils/supabase/client'; // Supabaseクライアントをインポート

// onClose プロパティの型を定義
interface SignupModalProps {
  onClose: () => void; // 閉じるための関数
}

export default function SignupModal({ onClose }: SignupModalProps) {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null); // ユーザー情報を格納するステート

  useEffect(() => {
    const supabase = createClient();

    // 現在のユーザー情報を取得
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      }
    });
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("password");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    await signup(formData); // サインアップ処理を呼び出す
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"> {/* rgbaで透過度を設定 */}
      <div className="bg-gradient-to-b from-blue-400/90 to-blue-500 rounded-lg p-6 max-w-sm w-full"> {/* ポップな青色のグラデーションを設定 */}
        <h1 className="text-2xl font-bold mb-6 text-white">ひまリンクにサインアップ</h1>
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
              className="w-full bg-blue-700 text-white py-3 rounded-lg" // ボタンの色をポップな青に変更
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
          <form onSubmit={handleSignup} className="w-full max-w-md">
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
              className="w-full bg-blue-700 text-white py-3 rounded-lg mt-4" // ボタンの色をポップな青に変更
            >
              サインアップ
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 