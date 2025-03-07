"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  // 他の必要なプロパティを追加
}

export default function AuthPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user as User);
        router.replace('/calendar'); // ログイン成功時にカレンダー画面に遷移
      }
    });
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      // エラーメッセージに応じて分岐する例
      if (error.message.includes("Email not confirmed")) {
        console.error('Email not confirmed. Please verify your email before logging in.');
        setError('メール認証が完了していません。確認メール内のリンクをクリックしてください。');
      } else if (error.message.includes("Invalid login credentials")) {
        console.error('Invalid login credentials.');
        setError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        console.error('Login error:', error);
        setError('ログインに失敗しました。しばらくしてから再試行してください。');
      }
    } else {
      setUser(data.user as User);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email: signUpEmail, password: signUpPassword });
    if (error) {
      // メール認証が未完了の場合
      if (error.message.includes("Email not confirmed") || error.code === "USER_NOT_CONFIRMED") {
        console.error("Email not confirmed. Please verify your email before logging in.");
        setError("メール認証が完了していません。確認メール内のリンクをクリックしてください。");
      }
      // 認証情報が不正な場合
      else if (error.message.includes("Invalid login credentials") || error.code === "INVALID_LOGIN_CREDENTIALS") {
        console.error("Invalid login credentials.");
        setError("メールアドレスまたはパスワードが正しくありません。");
      }
      // 既に登録済みの場合（例: User already exists）
      else if (error.message.includes("User already registered") || error.code === "USER_ALREADY_EXISTS") {
        console.error("User already registered.");
        setError("このメールアドレスは既に登録されています。");
      }
      // その他のエラー
      else {
        console.error("Sign up error:", error);
        setError("サインアップに失敗しました。しばらくしてから再試行してください。");
      }
    } else {
      setUser(data.user as User);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Login / Sign Up</h1>
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded shadow-md mb-4">
        <label className="block mb-2">Email:</label>
        <input
          type="email"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <label className="block mb-2">Password:</label>
        <input
          type="password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Login</button>
      </form>
      <form onSubmit={handleSignUp} className="w-full max-w-sm bg-white p-6 rounded shadow-md">
        <h2 className="text-lg font-semibold mb-2">Sign Up</h2>
        <label className="block mb-2">Email:</label>
        <input
          type="email"
          value={signUpEmail}
          onChange={(e) => setSignUpEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <label className="block mb-2">Password:</label>
        <input
          type="password"
          value={signUpPassword}
          onChange={(e) => setSignUpPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">Sign Up</button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      {user && <p className="text-green-500">Welcome, {user.email}!</p>}
    </div>
  );
}