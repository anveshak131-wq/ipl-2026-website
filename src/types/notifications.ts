export type NotificationCategory = 'match' | 'news' | 'prediction';

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  description?: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    matchId?: string;
    newsId?: string;
    predictionId?: string;
    [key: string]: any;
  };
}

export interface NotificationPreferences {
  matches: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  news: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  predictions: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
}

export interface NotificationGroup {
  date: string;
  notifications: Notification[];
}

