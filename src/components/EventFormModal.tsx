"use client";

import React, { useState } from "react";

interface EventFormModalProps {
  selectedDate: string;
  selectedEventId: string;
  selectedEventTitle?: string; // 編集モード時にイベントのタイトルを渡す
  onClose: () => void;
}

export default function EventFormModal({
  selectedDate,
  selectedEventId,
  selectedEventTitle,
  onClose,
}: EventFormModalProps) {

  // 内部状態でイベントタイトルを管理
  const [newTitle, setNewTitle] = useState(selectedEventTitle || "");

  // モーダルを閉じる内部処理（例としてログ出力）
  const handleCancel = () => {
    console.log("Modal closed.");
    // ここでモーダルの表示状態を管理する処理を追加する
    onClose();
  };

  // イベント追加処理の内部定義
  const handleAdd = () => {
    console.log(`Add event on ${selectedDate} with title: ${newTitle}`);
    // ここで API 呼び出しなどの追加処理を実装する
    onClose();
  };

  // イベント更新処理の内部定義
  const handleUpdate = () => {
    console.log(`Update event ${selectedEventId} with new title: ${newTitle}`);
    // ここで API 呼び出しなどの更新処理を実装する
    onClose();
  };

  // イベント削除処理の内部定義
  const handleDelete = () => {
    console.log(`Delete event ${selectedEventId}`);
    // ここで API 呼び出しなどの削除処理を実装する
    onClose();
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-white bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl mb-4">
          {selectedEventId 
            ? `Edit Event on ${selectedEventTitle || "No Title"}` 
            : `Add Event on ${selectedDate}`}
        </h2>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Enter event title"
          className="border p-2 w-full mb-4"
        />
        <div className="flex justify-end">
          <button
            onClick={handleCancel}
            className="mr-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          {selectedEventId ? (
            <>
              <button
                onClick={handleUpdate}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Update
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={handleAdd}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}