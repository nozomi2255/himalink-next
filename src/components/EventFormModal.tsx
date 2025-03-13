"use client";

import React from "react";

interface EventFormModalProps {
  selectedDate: string;
  newTitle: string;
  setNewTitle: (title: string) => void;
  setShowForm: (show: boolean) => void;
  selectedEventId: string;
  handleUpdateEvent: () => void;
  handleDeleteEvent: () => void;
  handleAddEvent: () => void;
}

export default function EventFormModal({
  selectedDate,
  newTitle,
  setNewTitle,
  setShowForm,
  selectedEventId,
  handleUpdateEvent,
  handleDeleteEvent,
  handleAddEvent,
}: EventFormModalProps) {
  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-white bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl mb-4">
          {selectedEventId ? `Edit Event on ${selectedDate}` : `Add Event on ${selectedDate}`}
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
            onClick={() => setShowForm(false)}
            className="mr-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          {selectedEventId ? (
            <>
              <button
                onClick={handleUpdateEvent}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Update
              </button>
              <button
                onClick={handleDeleteEvent}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={handleAddEvent}
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