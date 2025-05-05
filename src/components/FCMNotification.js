import React, { useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

const FCMNotification = ({ setNotifications }) => {
  useEffect(() => {
    // Получаем текущего пользователя
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      
      try {
        // Проверяем, разрешены ли уведомления в браузере
        if ("Notification" in window && Notification.permission === "default") {
          // Запрашиваем разрешение на уведомления, если еще не определено
          Notification.requestPermission();
        }
      } catch (error) {
        console.error('Ошибка при настройке браузерных уведомлений:', error);
      }
    });
    
    return () => {
      unsubscribeAuth();
    };
  }, [setNotifications]);

  // Компонент ничего не рендерит
  return null;
};

export default FCMNotification;