import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp
} from 'firebase/firestore';

// Коллекция для хранения токенов устройств
const tokensCollection = collection(db, 'fcmTokens');

// Коллекция для хранения уведомлений
const notificationsCollection = collection(db, 'notifications');

// Сохранение FCM-токена пользователя
export const saveUserToken = async (userId, token) => {
  try {
    // Проверка, существует ли уже такой токен
    const q = query(tokensCollection, where('token', '==', token));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Если токен не существует, добавляем его
      await addDoc(tokensCollection, {
        userId,
        token,
        createdAt: serverTimestamp()
      });
      console.log('FCM Token сохранен');
    } else {
      console.log('FCM Token уже существует');
    }
  } catch (error) {
    console.error('Ошибка при сохранении FCM Token:', error);
  }
};

// Создание уведомления для отправки через Cloud Functions
export const createNotification = async (userId, title, body, data = {}) => {
  try {
    // Получаем токены устройств пользователя
    const q = query(tokensCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Токены устройств не найдены для пользователя');
      return;
    }
    
    // Создаем запись уведомления для каждого токена
    const tokens = querySnapshot.docs.map(doc => doc.data().token);
    
    await addDoc(notificationsCollection, {
      userId,
      title,
      body,
      data,
      tokens,
      sent: false,
      createdAt: serverTimestamp()
    });
    
    console.log('Уведомление создано для отправки');
  } catch (error) {
    console.error('Ошибка при создании уведомления:', error);
  }
};

// Форматирование даты и времени
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Для уведомлений о просроченных задачах
export const sendDueTaskNotification = async (userId, taskText) => {
  await createNotification(
    userId,
    'Срок задачи истек',
    `Задача "${taskText}" просрочена!`,
    { type: 'due_task' }
  );
};

// Для уведомлений за 1 час до дедлайна
export const sendOneHourTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  await createNotification(
    userId,
    'Остался час до дедлайна!',
    `Задача "${taskText}" должна быть выполнена к ${formattedDate} (через 1 час)`,
    { type: 'one_hour_task' }
  );
};

// Для уведомлений о скором дедлайне (менее 24 часов)
export const sendUpcomingTaskNotification = async (userId, taskText, dueDate) => {
  const formattedDate = formatDateTime(dueDate);
  
  await createNotification(
    userId,
    'Приближается срок задачи',
    `Задача "${taskText}" должна быть выполнена к ${formattedDate}`,
    { type: 'upcoming_task' }
  );
};