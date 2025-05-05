import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Коллекция задач
const tasksCollection = collection(db, 'tasks');

// Показать локальное уведомление в браузере
export const showLocalNotification = async (title, body, type) => {
  try {
    // Проверяем поддержку уведомлений в браузере
    if (!("Notification" in window)) {
      console.warn("Этот браузер не поддерживает уведомления");
      return false;
    }

    // Проверяем разрешение
    if (Notification.permission === "granted") {
      // Если всё хорошо, создаем уведомление
      const notification = new Notification(title, {
        body: body,
        icon: '/logo192.png',
        tag: `notification-${Date.now()}`
      });

      // Обработка клика по уведомлению
      notification.onclick = function() {
        window.focus();
        notification.close();
      };

      return true;
    } else if (Notification.permission !== "denied") {
      // Запрашиваем разрешение
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        return showLocalNotification(title, body, type);
      }
    }
    
    return false;
  } catch (error) {
    console.error("Ошибка при показе уведомления:", error);
    return false;
  }
};

// Получить все задачи для конкретного пользователя
export const getTasks = async (userId) => {
  try {
    console.log("Загрузка задач для пользователя:", userId);
    const q = query(
      tasksCollection, 
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    console.log(`Получено ${snapshot.docs.length} документов из Firestore`);
    
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Обработка задачи ${doc.id}:`, data);
      
      // Обработка createdAt в разных форматах
      let createdAt = data.createdAt;
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') {
          // Это Firebase Timestamp
          createdAt = createdAt.toDate();
          console.log(`Преобразован Timestamp в Date для задачи ${doc.id}`);
        } else if (typeof createdAt === 'string') {
          // Это строка ISO
          createdAt = new Date(createdAt);
          console.log(`Преобразована строка в Date для задачи ${doc.id}`);
        } else if (createdAt instanceof Date) {
          // Это уже Date, ничего не делаем
          console.log(`createdAt уже является Date для задачи ${doc.id}`);
        } else {
          // Неизвестный формат, используем текущую дату
          console.warn(`Неизвестный формат createdAt для задачи ${doc.id}:`, createdAt);
          createdAt = new Date();
        }
      } else {
        console.warn(`createdAt отсутствует для задачи ${doc.id}`);
        createdAt = new Date(); // Если поля нет, используем текущую дату
      }
      
      // Обработка dueDate
      let dueDate = data.dueDate;
      if (dueDate) {
        if (typeof dueDate.toDate === 'function') {
          dueDate = dueDate.toDate();
        } else if (typeof dueDate === 'string') {
          dueDate = new Date(dueDate);
        }
        // Если это уже Date, ничего не делаем
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
        dueDate
      };
    });
    
    // Сортируем задачи после получения (так как orderBy может не работать с разными типами данных)
    tasks.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt - a.createdAt; // От новых к старым
    });
    
    console.log(`Успешно загружено и обработано ${tasks.length} задач`);
    return tasks;
  } catch (error) {
    console.error("Ошибка при получении задач:", error);
    return [];
  }
};

// Добавить новую задачу
export const addTask = async (userId, text, dueDate, priority) => {
  try {
    console.log("Добавление новой задачи:", { text, dueDate, priority });
    
    const task = {
      text,
      completed: false,
      dueDate: dueDate || null,
      priority: priority || 'normal',
      notified: false,
      oneHourNotified: false,
      upcomingNotified: false,
      userId,
      createdAt: serverTimestamp() // Используем serverTimestamp для базы данных
    };
    
    console.log("Данные для сохранения:", task);
    const docRef = await addDoc(tasksCollection, task);
    console.log(`Задача успешно добавлена с ID: ${docRef.id}`);
    
    // Возвращаем объект для UI с локальной меткой времени для немедленного отображения
    const clientTask = {
      id: docRef.id,
      ...task,
      createdAt: new Date() // Локальная метка времени
    };
    
    console.log("Задача для отображения в UI:", clientTask);
    return clientTask;
  } catch (error) {
    console.error("Ошибка при добавлении задачи:", error);
    throw error;
  }
};

// Обновить задачу
export const updateTask = async (taskId, data) => {
  try {
    console.log(`Обновление задачи ${taskId}:`, data);
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, data);
    console.log(`Задача ${taskId} успешно обновлена`);
    return true;
  } catch (error) {
    console.error(`Ошибка при обновлении задачи ${taskId}:`, error);
    throw error;
  }
};

// Удалить задачу
export const deleteTask = async (taskId) => {
  try {
    console.log(`Удаление задачи ${taskId}`);
    const taskRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskRef);
    console.log(`Задача ${taskId} успешно удалена`);
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении задачи ${taskId}:`, error);
    throw error;
  }
};

// Отметить задачу как выполненную или невыполненную
export const toggleTaskComplete = async (taskId, completed) => {
  try {
    console.log(`Изменение статуса задачи ${taskId} на ${completed ? 'выполнено' : 'не выполнено'}`);
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { completed });
    console.log(`Статус задачи ${taskId} успешно обновлен`);
    return true;
  } catch (error) {
    console.error(`Ошибка при изменении статуса задачи ${taskId}:`, error);
    throw error;
  }
};

// Форматирование даты и времени
const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Получена невалидная дата:", dateString);
      return "Неизвестная дата";
    }
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error("Ошибка при форматировании даты:", error);
    return "Ошибка даты";
  }
};

// Для уведомлений о просроченных задачах
export const sendDueTaskNotification = async (userId, taskText) => {
  return showLocalNotification(
    'Срок задачи истек',
    `Задача "${taskText}" просрочена!`,
    'due'
  );
};

// Для уведомлений за 1 час до дедлайна
export const sendOneHourTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  return showLocalNotification(
    'Остался час до дедлайна!',
    `Задача "${taskText}" должна быть выполнена к ${formattedDate} (через 1 час)`,
    'oneHour'
  );
};

// Для уведомлений о скором дедлайне (менее 24 часов)
export const sendUpcomingTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  return showLocalNotification(
    'Приближается срок задачи',
    `Задача "${taskText}" должна быть выполнена к ${formattedDate}`,
    'upcoming'
  );
};