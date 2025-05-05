import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAgerrIAlHOUTUSNWuX0RCwdySmzS1xGQ8",
  authDomain: "daily-task-planner-c8a1a.firebaseapp.com",
  projectId: "daily-task-planner-c8a1a",
  storageBucket: "daily-task-planner-c8a1a.firebasestorage.app",
  messagingSenderId: "437542977622",
  appId: "1:437542977622:web:f544ff92cf80d9e54b7bf7"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Функция для запроса разрешения на уведомления браузера
export const requestNotificationPermission = async () => {
  try {
    if (!("Notification" in window)) {
      console.warn("Этот браузер не поддерживает уведомления");
      return null;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Разрешение на уведомления получено');
      return true;
    } else {
      console.log('Разрешение на уведомления не получено');
      return false;
    }
  } catch (error) {
    console.error('Ошибка при запросе разрешения на уведомления:', error);
    return false;
  }
};