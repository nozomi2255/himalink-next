'use client'

import { useRouter } from "next/navigation";

import React from "react";
import "./Sidebar.css"; // スタイルは別ファイルで定義（後述）

const Sidebar: React.FC = () => {
  const router = useRouter();

  const handleAvatarClick = () => {
    router.push('/profile');
  };

  return (
    <div className="sidebar">
      {/* プロフィールアイコン */}
      <div className="avatar" onClick={handleAvatarClick}>
        <img
          src="/path/to/avatar.png" // 必要に応じて動的なURLやユーザー情報を渡してください
          alt="User Avatar"
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            objectFit: "cover",
            cursor: "pointer"
          }}
        />
      </div>

      {/* テンプレート予定 */}
      <div className="template-section">
        <h4>テンプレート</h4>
        <button className="template-button">ひま</button>
        <button className="template-button">買い物</button>
        <button className="template-button">映画</button>
      </div>
    </div>
  );
};

export default Sidebar;