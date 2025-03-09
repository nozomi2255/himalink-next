// components/UserProfileForm.tsx
"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
  bio?: string;
}

interface Props {
  profile: UserProfile;
}

export default function UserProfileForm({ profile }: Props) {
  const [username, setUsername] = useState(profile.username);
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // アップロードする画像ファイル

  // プロフィールを更新する関数
  const handleUpdate = async () => {
    let newAvatarUrl = avatarUrl;

    // 画像ファイルが選択されている場合、アップロード処理を行う
    if (avatarFile) {
      const { data, error: uploadError } = await supabase.storage
        .from("avatars") // ストレージバケット名
        .upload(`${profile.id}/${avatarFile.name}`, avatarFile); // ユーザーIDを使ってユニークなパスに保存

      if (uploadError) {
        alert("画像のアップロードに失敗しました。");
        return;
      }

      // アップロードした画像のURLを取得
      newAvatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/public/${profile.id}/${avatarFile.name}`;
    }

    // ユーザー情報を更新
    const { error } = await supabase
      .from("Users")
      .update({
        username,
        full_name: fullName,
        bio,
        avatar_url: newAvatarUrl,
      })
      .eq("id", profile.id);

    if (error) {
      alert("プロフィール更新に失敗しました。");
    } else {
      alert("プロフィールが更新されました！");
    }
  };

  // プロフィール画像を変更する関数
  const handleAvatarChange = () => {
    // 画像アップロードの処理をここに実装
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement; // e.targetをHTMLInputElementにキャスト
      const files = target.files; // filesを取得
      if (files && files.length > 0) {
        setAvatarFile(files[0]); // 選択されたファイルをステートに設定
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            setAvatarUrl(event.target.result as string); // プレビュー用に画像URLを設定
          }
        };
        reader.readAsDataURL(files[0]); // 画像をData URLとして読み込む
      }
    };
    fileInput.click(); // ファイル選択ダイアログを開く
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="プロフィール画像" className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <button onClick={handleAvatarChange} className="w-20 h-20 flex items-center justify-center bg-gray-300 rounded-full">
            <span className="text-2xl font-bold">{profile.username.charAt(0)}</span> {/* ユーザー名の頭文字を表示 */}
          </button>
        )}
      </div>
      <div>
        <label className="block font-bold">ユーザー名</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block font-bold">氏名</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label className="block font-bold">自己紹介</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="border p-2 w-full"
          rows={4}
        />
      </div>
      <button
        onClick={handleUpdate}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        更新する
      </button>
    </div>
  );
}