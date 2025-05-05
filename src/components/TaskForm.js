import React, { useState, useEffect } from "react";
import { Plus, Check } from "lucide-react";

const TaskForm = ({ addTask, updateTask, editingTask, setEditingTask }) => {
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(""); // Новое состояние для времени
  const [priority, setPriority] = useState("normal");

  // При начале редактирования задачи
  useEffect(() => {
    if (editingTask) {
      setText(editingTask.text);

      // Обработка даты и времени из полной даты дедлайна
      if (editingTask.dueDate) {
        const dueDateTime = new Date(editingTask.dueDate);

        // Форматируем дату в формат YYYY-MM-DD для поля ввода
        const formattedDate = dueDateTime.toISOString().split("T")[0];
        setDueDate(formattedDate);

        // Форматируем время в формат HH:MM для поля ввода
        const hours = dueDateTime.getHours().toString().padStart(2, "0");
        const minutes = dueDateTime.getMinutes().toString().padStart(2, "0");
        setDueTime(`${hours}:${minutes}`);
      } else {
        setDueDate("");
        setDueTime("");
      }

      setPriority(editingTask.priority || "normal");
    }
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (text.trim() === "") return;

    // Создаем полную дату с объединением даты и времени
    let fullDueDate = null;
    if (dueDate) {
      if (dueTime) {
        // Если указано время, создаем полную дату с временем
        const [hours, minutes] = dueTime.split(":");
        fullDueDate = new Date(dueDate);
        fullDueDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      } else {
        // Если время не указано, используем конец дня (23:59)
        fullDueDate = new Date(dueDate);
        fullDueDate.setHours(23, 59, 59);
      }
    }

    const dueDateISOString = fullDueDate ? fullDueDate.toISOString() : null;

    if (editingTask) {
      updateTask(editingTask.id, text, dueDateISOString, priority);
      setEditingTask(null);
    } else {
      addTask(text, dueDateISOString, priority);
    }

    // Сброс формы
    setText("");
    setDueDate("");
    setDueTime("");
    setPriority("normal");
  };

  const handleCancel = () => {
    setEditingTask(null);
    setText("");
    setDueDate("");
    setDueTime("");
    setPriority("normal");
  };

  // Получаем текущую дату для минимальной даты в выборе
  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm"
    >
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter a new task..."
            className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex md:flex-row flex-col space-y-2 md:space-y-0 md:space-x-2">
            {/* Поле выбора даты */}
            <input
              type="date"
              value={dueDate}
              min={today}
              onChange={(e) => setDueDate(e.target.value)}
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Новое поле выбора времени */}
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Выбор приоритета */}
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="normal">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          {editingTask ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Check className="h-5 w-5" />
                Save changes
              </button>
            </>
          ) : (
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add a task
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
