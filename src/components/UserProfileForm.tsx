// components/UserProfileForm.tsx
"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import UserAvatar from "./UserAvatar"; // UserAvatarをインポート

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // アップロードする画像ファイル
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(profile.avatar_url || null);

  // プロフィールを更新する関数
  const handleUpdate = async () => {
    let newAvatarUrl = localAvatarUrl; // 既存のローカルstateを初期値に

    // 画像ファイルが選択されている場合、アップロード処理を行う
    if (avatarFile) {
      // ファイルパスの指定: バケット "avatars" 内のパスは `${profile.id}/${avatarFile.name}`
      const filePath = `${profile.id}/${avatarFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars") // ストレージバケット名
        .upload(filePath, avatarFile, { upsert: true }); // ユーザーIDを使ってユニークなパスに保存

      if (uploadError) {
        alert("画像のアップロードに失敗しました。");
        console.error("Upload error:", uploadError);
        return;
      }

      // アップロードした画像のURLを取得
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      newAvatarUrl = publicUrlData.publicUrl; // 新しいアバターURLを設定
      // localAvatarUrlを更新することで、UserAvatarに反映される
      setLocalAvatarUrl(newAvatarUrl);
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
      console.error("Profile update error:", error);
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
            // プレビュー用に画像URLを設定
            setLocalAvatarUrl(event.target.result as string);
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
        <UserAvatar
          avatarUrl={localAvatarUrl} // localAvatarUrlを使用
          username={profile.username}
          onClick={handleAvatarChange} // 画像変更のためのクリックハンドラ
          size={80}
        />
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