/**
 * News Notification Service
 * Creates notifications when news is uploaded by admins
 * 
 * References:
 * - Browser Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
 * - Notification best practices
 */

import { Content } from '@/types';

/**
 * Save notification to localStorage
 */
function saveNotificationToLocalStorage(notification: any): void {
  try {
    const existing = localStorage.getItem('notifications');
    const notifications = existing ? JSON.parse(existing) : [];
    notifications.unshift(notification);
    // Keep only last 100 notifications
    const limited = notifications.slice(0, 100);
    localStorage.setItem('notifications', JSON.stringify(limited));
  } catch (error) {
    console.error('Error saving notification to localStorage:', error);
  }
}

/**
 * Create a browser notification for news
 */
function createBrowserNotification(
  title: string,
  options: NotificationOptions
): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    return new Notification(title, {
      icon: '/logos/ipl-logo.png',
      badge: '/logos/ipl-logo.png',
      tag: options.tag,
      requireInteraction: false,
      ...options,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create notification when news is uploaded
 */
export async function createNewsNotification(news: Content): Promise<void> {
  try {
    // Only create notification for news type and if it's active
    if (news.type !== 'news' || !news.isActive) {
      return;
    }

    const title = `📰 ${news.title}`;
    const description = news.summary || news.content?.substring(0, 100) || 'New news article published';
    
    // Create browser notification if permission granted
    createBrowserNotification(title, {
      body: description,
      tag: `news-${news.id}`,
      data: {
        newsId: news.id,
        type: 'news',
      },
    });

    // Save notification to system (localStorage)
    const notification = {
      id: `notif-news-${news.id}-${Date.now()}`,
      category: 'news' as const,
      title: news.title,
      description: description,
      link: news.id ? `/news/${news.id}` : '/news',
      read: false,
      createdAt: new Date().toISOString(),
      metadata: {
        newsId: news.id,
        news,
      },
    };

    saveNotificationToLocalStorage(notification);

    // Dispatch event for real-time updates
    window.dispatchEvent(new CustomEvent('news-created', {
      detail: { newsId: news.id, news }
    }));

    console.log('News notification created for:', news.title);
  } catch (error) {
    console.error('Error creating news notification:', error);
  }
}

/**
 * Listen for news creation events and create notifications
 */
export function initializeNewsNotifications(): void {
  if (typeof window === 'undefined') return;

  const handleNewsCreated = async (event: CustomEvent) => {
    const { news } = event.detail || {};
    if (news) {
      await createNewsNotification(news);
    }
  };

  window.addEventListener('news-created', handleNewsCreated as EventListener);

  // Return cleanup function (though this typically runs for app lifetime)
  return () => {
    window.removeEventListener('news-created', handleNewsCreated as EventListener);
  };
}

