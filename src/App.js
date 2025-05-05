import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import NotificationItem from './components/NotificationItem';
import Auth from './components/Auth';
import * as taskService from './services/taskService';
import FCMNotification from './components/FCMNotification';
import { requestNotificationPermission } from './firebase';

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const setupFCM = async () => {
      if (user) {
        try {
          const token = await requestNotificationPermission();
          if (token) {
            setFcmToken(token);
            console.log("FCM токен получен:", token);
            
          }
        } catch (error) {
          console.error("Ошибка при настройке FCM:", error);
        }
      }
    };
    
    if (user) {
      setupFCM();
    }
  }, [user]);
useEffect(() => {
  const loadTasks = async () => {
    if (user) {
      try {
        console.log("Загрузка задач для пользователя:", user.uid);
        const userTasks = await taskService.getTasks(user.uid);
        
        if (userTasks.length > 0) {
          console.log(`Загружено ${userTasks.length} задач`);
          setTasks(userTasks);
        } else {
          console.log("Задачи не найдены");
          setTasks([]);
        }

        if (userTasks.some(task => !task.createdAt)) {
          console.warn("Внимание: обнаружены задачи без временной метки createdAt");
        }
      } catch (error) {
        console.error("Ошибка загрузки задач:", error);
      }
    } else {
      setTasks([]);
    }
  };
  
  if (user) {
    loadTasks();

    const refreshInterval = setInterval(loadTasks, 180000);
    
    return () => clearInterval(refreshInterval);
  }
}, [user]);
  
useEffect(() => {
  if (!user) return;
  
const checkDueTasks = async () => {
  const now = new Date();
  
  const dueTasks = tasks.filter(task => {
    if (task.completed || !task.dueDate || task.notified) return false;
    const taskDate = new Date(task.dueDate);
    return taskDate <= now;
  });
  
  const oneHourTasks = tasks.filter(task => {
    if (task.completed || !task.dueDate || task.oneHourNotified) return false;
    const taskDate = new Date(task.dueDate);
    const diffTime = taskDate - now;
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 1;
  });
  
  const upcomingTasks = tasks.filter(task => {
    if (task.completed || !task.dueDate || task.upcomingNotified) return false;
    const taskDate = new Date(task.dueDate);
    const diffTime = taskDate - now;
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours > 1 && diffHours < 24;
  });
  
  if (dueTasks.length > 0) {
    const newNotifications = dueTasks.map(task => ({
      id: Date.now() + Math.random(),
      task: task.text,
      type: 'due'
    }));
    
    setNotifications(prev => [...prev, ...newNotifications]);
    
    // Отмечаем задачи как уведомленные и показываем браузерные уведомления
    const updatedTasks = [...tasks];
    for (const dueTask of dueTasks) {
      const index = updatedTasks.findIndex(t => t.id === dueTask.id);
      if (index !== -1) {
        updatedTasks[index] = { ...updatedTasks[index], notified: true };
        // Также обновляем в базе данных
        await taskService.updateTask(dueTask.id, { notified: true });
        
        // Показываем браузерное уведомление
        await taskService.sendDueTaskNotification(user.uid, dueTask.text);
      }
    }
    setTasks(updatedTasks);
  }
  
  // Обработка задач с дедлайном через 1 час
  if (oneHourTasks.length > 0) {
    const newNotifications = oneHourTasks.map(task => ({
      id: Date.now() + Math.random(),
      task: task.text,
      type: 'oneHour'
    }));
    
    setNotifications(prev => [...prev, ...newNotifications]);
    
    // Отмечаем задачи как уведомленные о приближении дедлайна через 1 час
    const updatedTasks = [...tasks];
    for (const oneHourTask of oneHourTasks) {
      const index = updatedTasks.findIndex(t => t.id === oneHourTask.id);
      if (index !== -1) {
        updatedTasks[index] = { ...updatedTasks[index], oneHourNotified: true };
        // Также обновляем в базе данных
        await taskService.updateTask(oneHourTask.id, { oneHourNotified: true });
        
        // Показываем браузерное уведомление
        await taskService.sendOneHourTaskNotification(user.uid, oneHourTask.text, oneHourTask.dueDate);
      }
    }
    setTasks(updatedTasks);
  }
  
  // Обработка задач со скорым дедлайном
  if (upcomingTasks.length > 0) {
    const newNotifications = upcomingTasks.map(task => ({
      id: Date.now() + Math.random(),
      task: task.text,
      type: 'upcoming'
    }));
    
    setNotifications(prev => [...prev, ...newNotifications]);
    
    // Отмечаем задачи как уведомленные о приближении дедлайна
    const updatedTasks = [...tasks];
    for (const upcomingTask of upcomingTasks) {
      const index = updatedTasks.findIndex(t => t.id === upcomingTask.id);
      if (index !== -1) {
        updatedTasks[index] = { ...updatedTasks[index], upcomingNotified: true };
        // Также обновляем в базе данных
        await taskService.updateTask(upcomingTask.id, { upcomingNotified: true });
        
        // Показываем браузерное уведомление
        await taskService.sendUpcomingTaskNotification(user.uid, upcomingTask.text, upcomingTask.dueDate);
      }
    }
    setTasks(updatedTasks);
  }
};
  
  // Проверяем задачи каждую минуту
  const interval = setInterval(checkDueTasks, 60000);
  
  // Инициальная проверка
  checkDueTasks();
  
  return () => clearInterval(interval);
}, [user, tasks]);
  
  // Добавление задачи
  const addTask = async (text, dueDate, priority) => {
    if (!user) return;
    
    try {
      const newTask = await taskService.addTask(user.uid, text, dueDate, priority);
      setTasks([newTask, ...tasks]);
      
      // Добавляем уведомление о создании
      setNotifications([
        ...notifications, 
        { id: Date.now(), task: text, type: 'created' }
      ]);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };
  
  // Обновление задачи
  const updateTask = async (taskId, text, dueDate, priority) => {
    try {
      await taskService.updateTask(taskId, { text, dueDate, priority });
      
      // Обновляем локальное состояние
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, text, dueDate, priority };
        }
        return task;
      }));
      
      // Добавляем уведомление о редактировании
      setNotifications([
        ...notifications, 
        { id: Date.now(), task: text, type: 'edited' }
      ]);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  
  // Удаление задачи
  const deleteTask = async (taskId) => {
    try {
      const taskToDelete = tasks.find(task => task.id === taskId);
      
      await taskService.deleteTask(taskId);
      
      // Обновляем локальное состояние
      setTasks(tasks.filter(task => task.id !== taskId));
      
      // Добавляем уведомление об удалении
      setNotifications([
        ...notifications, 
        { id: Date.now(), task: taskToDelete.text, type: 'deleted' }
      ]);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  
  // Изменение статуса выполнения
  const toggleComplete = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const newStatus = !task.completed;
      
      await taskService.toggleTaskComplete(taskId, newStatus);
      
      // Обновляем локальное состояние
      setTasks(tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, completed: newStatus };
        }
        return task;
      }));
      
      // Добавляем уведомление о выполнении если задача отмечена как выполненная
      if (newStatus) {
        setNotifications([
          ...notifications, 
          { id: Date.now(), task: task.text, type: 'completed' }
        ]);
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };
  
  // Начало редактирования задачи
  const startEditing = (task) => {
    setEditingTask(task);
  };
  
  // Удаление уведомления
  const removeNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      {/* Компонент для работы с FCM */}
      <FCMNotification setNotifications={setNotifications} />
      
      {user ? (
        <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600">Daily Task Planner</h1>
            <button
              onClick={() => auth.signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
          
          <TaskForm
            addTask={addTask}
            updateTask={updateTask}
            editingTask={editingTask}
            setEditingTask={setEditingTask}
          />
          
          {/* Переключатель отображения выполненных задач */}
          <div className="mb-4 flex justify-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={() => setShowCompleted(!showCompleted)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700">Show completed tasks</span>
            </label>
          </div>
          
          <TaskList
            tasks={tasks}
            toggleComplete={toggleComplete}
            deleteTask={deleteTask}
            startEditing={startEditing}
            showCompleted={showCompleted}
          />
          
          {/* Секция уведомлений */}
          <div className="fixed bottom-4 right-4 w-80">
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                removeNotification={removeNotification}
                style={{ opacity: 1 - (index * 0.1) }}
              />
            ))}
          </div>
        </div>
      ) : (
        <Auth />
      )}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default App;