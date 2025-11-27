/**
 * WebSocket Client for Real-time Live Operations
 * Handles connection, reconnection, and event management
 */

export type WebSocketEventType = 
  | 'liveScore'
  | 'engagement'
  | 'moderation'
  | 'performance'
  | 'incident'
  | 'connection'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  heartbeatInterval?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private currentReconnectDelay: number = 1000;
  private reconnectCount: number = 0;
  private heartbeatInterval: number = 30000;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: Map<WebSocketEventType, Set<(data: any) => void>> = new Map();
  private isIntentionallyClosed: boolean = false;

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.reconnectAttempts = config.reconnectAttempts ?? 5;
    this.reconnectDelay = config.reconnectDelay ?? 1000;
    this.maxReconnectDelay = config.maxReconnectDelay ?? 30000;
    this.heartbeatInterval = config.heartbeatInterval ?? 30000;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionallyClosed = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectCount = 0;
          this.currentReconnectDelay = this.reconnectDelay;
          this.startHeartbeat();
          this.flushMessageQueue();
          this.emit('connection', { status: 'connected' });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.emit('error', { message: 'WebSocket error occurred' });
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WebSocket] Disconnected');
          this.stopHeartbeat();
          this.emit('connection', { status: 'disconnected' });

          if (!this.isIntentionallyClosed && this.reconnectCount < this.reconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection failed:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    this.reconnectCount++;
    console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectCount}/${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
        if (this.reconnectCount < this.reconnectAttempts) {
          this.currentReconnectDelay = Math.min(
            this.currentReconnectDelay * 2,
            this.maxReconnectDelay
          );
          this.attemptReconnect();
        } else {
          this.emit('error', { message: 'Max reconnection attempts reached' });
        }
      });
    }, this.currentReconnectDelay);
  }

  /**
   * Send message to server
   */
  public send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
      console.warn('[WebSocket] Message queued - connection not ready');
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach((callback) => callback(message.data));
    }
  }

  /**
   * Subscribe to event type
   */
  public on(type: WebSocketEventType, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(type: WebSocketEventType, data: any): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'connection',
          data: { action: 'ping' },
          timestamp: Date.now(),
        });
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  public getStatus(): 'connecting' | 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isIntentionallyClosed) return 'disconnected';
    if (this.ws?.readyState === WebSocket.CONNECTING) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    if (this.reconnectCount > 0 && this.reconnectCount < this.reconnectAttempts) return 'reconnecting';
    return 'disconnected';
  }
}

/**
 * Create and manage singleton WebSocket instance
 */
let wsInstance: WebSocketClient | null = null;

export function initializeWebSocket(config: WebSocketConfig): WebSocketClient {
  if (!wsInstance) {
    wsInstance = new WebSocketClient(config);
  }
  return wsInstance;
}

export function getWebSocketInstance(): WebSocketClient | null {
  return wsInstance;
}

export function closeWebSocket(): void {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}
