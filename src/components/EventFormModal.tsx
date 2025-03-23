"use client";

import React, { useState } from "react";
import { Event } from "../app/types";

interface EventFormModalProps {
  selectedStartDate: string;
  selectedEndDate: string;
  selectedEventId: string;
  selectedEventTitle?: string;
  onClose: () => void;
  modalPosition: { top: number; left: number };
}

export default function EventFormModal({
  selectedStartDate,
  selectedEndDate,
  selectedEventId,
  selectedEventTitle,
  onClose,
  modalPosition,
}: EventFormModalProps) {

  // 内部状態でイベントタイトルを管理
  const [newTitle, setNewTitle] = useState(selectedEventTitle || "");

  // モーダルを閉じる内部処理（例としてログ出力）
  const handleCancel = () => {
    console.log("Modal closed.");
    onClose();
  };

  // イベント追加処理の内部定義
  const handleAdd = async () => {
    try {
      const response = await fetch("/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          start_time: selectedStartDate, // 連日イベントの開始日
          end_time: selectedEndDate,     // 連日イベントの終了日
          is_all_day: true,
          entry_type: "event",
        }),
      });
      if (!response.ok) throw new Error("Failed to add event");
      console.log(`Event added from ${selectedStartDate} to ${selectedEndDate} with title: ${newTitle}`);
    } catch (error) {
      console.error("Error adding event:", error);
    }
    onClose();
  };

  // イベント更新処理の内部定義
  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/event?eventId=${selectedEventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) throw new Error("Failed to update event");
      console.log(`Event ${selectedEventId} updated with new title: ${newTitle}`);
    } catch (error) {
      console.error("Error updating event:", error);
    }
    onClose();
  };

  // イベント削除処理の内部定義
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/event?eventId=${selectedEventId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete event");
      console.log(`Event ${selectedEventId} deleted`);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
    onClose();
  };

  return (
    <div
      className="absolute transform w-11/12 max-w-md bg-white bg-opacity-50 z-50"
      style={{ top: modalPosition.top, left: modalPosition.left }}
    >
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl mb-4">
          {selectedEventId 
            ? `Edit Event on ${selectedEventTitle || "No Title"}` 
            : `Add Event from ${selectedStartDate} to ${selectedEndDate}`}
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