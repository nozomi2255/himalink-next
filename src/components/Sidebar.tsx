import React from "react";
import "./Sidebar.css"; // スタイルは別ファイルで定義（後述）

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      {/* プロフィールアイコン */}
      <div className="avatar">N</div>

      {/* ナビゲーションボタン */}
      <div className="nav-section">
        <button className="nav-button">👤 プロフィール</button>
        <button className="nav-button">🔍 検索</button>
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