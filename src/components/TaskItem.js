import React from 'react';
import { Trash2, Edit, Calendar, Clock, AlertTriangle } from 'lucide-react';

const TaskItem = ({ task, toggleComplete, deleteTask, startEditing }) => {
  // Функция для получения класса по приоритету
  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'low': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Функция для получения иконки по приоритету
  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  // Функция для проверки скорого дедлайна
  const getTimeStatus = (dueDate) => {
    if (!dueDate) return { isDeadlineSoon: false, isOverdue: false, remainingHours: null };
    
    const now = new Date();
    const taskDate = new Date(dueDate);
    const diffTime = taskDate - now;
    const diffHours = diffTime / (1000 * 60 * 60);
    
    return {
      isDeadlineSoon: diffHours > 0 && diffHours < 1, // Меньше часа до дедлайна
      isNearDeadline: diffHours > 0 && diffHours < 24, // Меньше 24 часов
      isOverdue: diffHours < 0,
      remainingHours: Math.abs(diffHours)
    };
  };
  
  // Получаем статус времени
  const timeStatus = task.dueDate ? getTimeStatus(task.dueDate) : { isDeadlineSoon: false, isOverdue: false };
  
  // Форматирование даты и времени
  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    return {
      date: date.toLocaleDateString('en-EN', dateOptions),
      time: date.toLocaleTimeString('en-EN', timeOptions)
    };
  };
  
  const formattedDateTime = task.dueDate ? formatDateTime(task.dueDate) : null;
  
  return (
    <div 
      className={`p-4 border rounded-lg shadow-sm flex justify-between items-center
        ${task.completed 
          ? 'bg-gray-100 border-gray-200' 
          : 'bg-white border-gray-300 hover:border-blue-300 hover:shadow-md transition-all'}`}
    >
      <div className="flex items-center space-x-3 flex-1">
        {/* Чекбокс */}
        <div>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleComplete(task.id)}
            className="form-checkbox h-5 w-5 text-blue-600 rounded"
          />
        </div>
        
        {/* Содержимое задачи */}
        <div className="flex-1">
          <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {task.text}
          </p>
          
          {/* Метаданные задачи */}
          <div className="flex flex-wrap gap-2 mt-1">
            {/* Приоритет */}
            {task.priority && (
              <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${getPriorityClass(task.priority)}`}>
                {getPriorityIcon(task.priority)}
                {task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium'}
              </span>
            )}
            
            {/* Дата выполнения */}
            {formattedDateTime && (
              <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1
                ${timeStatus.isDeadlineSoon 
                  ? 'bg-red-100 border-red-300 text-red-800' 
                  : timeStatus.isNearDeadline
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : 'bg-green-100 border-green-300 text-green-800'
                }
                ${timeStatus.isOverdue && !task.completed 
                  ? 'bg-red-100 border-red-300 text-red-800' 
                  : ''
                }`}
              >
                <Calendar className="h-3 w-3" />
                {formattedDateTime.date}
              </span>
            )}
            
            {/* Время выполнения */}
            {formattedDateTime && formattedDateTime.time && (
              <span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1
                ${timeStatus.isDeadlineSoon 
                  ? 'bg-red-100 border-red-300 text-red-800' 
                  : timeStatus.isNearDeadline
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : 'bg-green-100 border-green-300 text-green-800'
                }
                ${timeStatus.isOverdue && !task.completed 
                  ? 'bg-red-100 border-red-300 text-red-800' 
                  : ''
                }`}
              >
                <Clock className="h-3 w-3" />
                {formattedDateTime.time}
                
                {/* Показ оставшегося времени */}
                {!task.completed && (
                  <>
                    {timeStatus.isDeadlineSoon && (
                      <span className="ml-1 font-semibold">
                        {`(${Math.round(timeStatus.remainingHours * 60)} minutes!)`}
                      </span>
                    )}
                    {timeStatus.isOverdue && (
                      <span className="ml-1 font-semibold">Overdue!</span>
                    )}
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Кнопки действий */}
      <div className="flex space-x-2">
        <button
          onClick={() => startEditing(task)}
          className="p-2 text-blue-500 hover:text-blue-700 focus:outline-none"
          disabled={task.completed}
        >
          <Edit className="h-5 w-5" />
        </button>
        <button
          onClick={() => deleteTask(task.id)}
          className="p-2 text-red-500 hover:text-red-700 focus:outline-none"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default TaskItem;