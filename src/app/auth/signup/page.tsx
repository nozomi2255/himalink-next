"use client";

import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  interface User {
    id: string;
    email: string;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed") || error.code === "USER_NOT_CONFIRMED") {
        console.error("Email not confirmed. Please verify your email before logging in.");
        setError("メール認証が完了していません。確認メール内のリンクをクリックしてください。");
      } else if (error.message.includes("Invalid login credentials") || error.code === "INVALID_LOGIN_CREDENTIALS") {
        console.error("Invalid login credentials.");
        setError("メールアドレスまたはパスワードが正しくありません。");
      } else if (error.message.includes("User already registered") || error.code === "USER_ALREADY_EXISTS") {
        console.error("User already registered.");
        setError("このメールアドレスは既に登録されています。");
      } else {
        console.error("Sign up error:", error);
        setError("サインアップに失敗しました。しばらくしてから再試行してください。");
      }
    } else {
      setUser(data.user as User);
      // UsersテーブルにINSERTする処理（重複、RLS、スキーマ等の問題は考慮しない前提）
      const { error: insertError } = await supabase
        .from("Users")
        .insert([
          {
            id: data.user?.id,
            email: data.user?.email,
            username: email, // 仮にsignUpEmailをusernameとして利用
          },
        ]);
      if (insertError) {
        console.error("Error inserting into Users table:", insertError);
      }
      router.push('/auth'); // サインアップ成功後、ログインページへリダイレクト
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSignUp} className="w-full max-w-sm bg-white p-6 rounded shadow-md">
        <label className="block mb-2">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <label className="block mb-2">Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Sign Up</button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      {/* userが存在する場合、ウェルカムメッセージを表示 */}
      {user && <p className="text-green-500 mt-4">Welcome, {user.email}!</p>}
    </div>
  );
}