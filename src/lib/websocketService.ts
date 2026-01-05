/**
 * WebSocket Service for Real-time Updates
 * Implements the hybrid architecture from CRICKBUZZ_LIVE_SCORING_ANALYSIS.md
 */

import { analyticsPipeline } from './analyticsPipeline';

export interface WebSocketMessage {
  type: 'score_update' | 'wicket' | 'over_change' | 'match_end' | 'player_stats';
  data: any;
  timestamp: number;
  matchId: string;
}

export interface WebSocketConnection {
  id: string;
  userId?: string;
  matchId?: string;
  socket: WebSocket;
  lastActivity: number;
  isActive: boolean;
}

/**
 * Enhanced WebSocket Manager with hybrid architecture
 */
export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private matchSubscriptions: Map<string, Set<string>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeHeartbeat();
  }

  /**
   * Initialize heartbeat for connection health monitoring
   */
  private initializeHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkConnectionHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Create a new WebSocket connection
   */
  async createConnection(userId: string, matchId?: string): Promise<WebSocket> {
    const connectionId = `${userId}-${matchId || 'global'}-${Date.now()}`;
    
    // Check if connection already exists
    const existingConnection = this.findExistingConnection(userId, matchId);
    if (existingConnection && existingConnection.isActive) {
      return existingConnection.socket;
    }

    // Create new WebSocket connection
    const socket = new WebSocket(this.getWebSocketUrl(matchId));
    
    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      matchId,
      socket,
      lastActivity: Date.now(),
      isActive: false
    };

    // Setup connection handlers
    this.setupConnectionHandlers(socket, connection);
    
    // Store connection
    this.connections.set(connectionId, connection);
    
    // Subscribe to match updates if matchId is provided
    if (matchId) {
      this.subscribeToMatch(matchId, connectionId);
    }

    return socket;
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupConnectionHandlers(socket: WebSocket, connection: WebSocketConnection): void {
    socket.onopen = () => {
      console.log(`WebSocket connection opened: ${connection.id}`);
      connection.isActive = true;
      connection.lastActivity = Date.now();
      
      // Send initial connection message
      this.sendMessage(socket, {
        type: 'connection_established',
        data: { connectionId: connection.id },
        timestamp: Date.now(),
        matchId: connection.matchId || ''
      });

      // Reset reconnect attempts
      this.reconnectAttempts.set(connection.id, 0);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message, connection);
        connection.lastActivity = Date.now();
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log(`WebSocket connection closed: ${connection.id}`, event.code, event.reason);
      connection.isActive = false;
      
      // Attempt reconnection if not a normal closure
      if (event.code !== 1000) {
        this.attemptReconnection(connection);
      } else {
        // Clean up connection
        this.cleanupConnection(connection.id);
      }
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error for connection ${connection.id}:`, error);
      connection.isActive = false;
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage, connection: WebSocketConnection): void {
    switch (message.type) {
      case 'ping':
        this.sendMessage(connection.socket, {
          type: 'pong',
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
          matchId: message.matchId
        });
        break;
      
      case 'subscribe_match':
        if (message.data.matchId) {
          this.subscribeToMatch(message.data.matchId, connection.id);
        }
        break;
      
      case 'unsubscribe_match':
        if (message.data.matchId) {
          this.unsubscribeFromMatch(message.data.matchId, connection.id);
        }
        break;
      
      default:
        // Forward message to analytics pipeline
        analyticsPipeline.emit('websocketMessage', {
          connection,
          message
        });
    }
  }

  /**
   * Subscribe to match updates
   */
  private subscribeToMatch(matchId: string, connectionId: string): void {
    if (!this.matchSubscriptions.has(matchId)) {
      this.matchSubscriptions.set(matchId, new Set());
    }
    this.matchSubscriptions.get(matchId)!.add(connectionId);
    
    // Listen to analytics pipeline events
    analyticsPipeline.on('matchProcessed', (data) => {
      if (data.id === matchId) {
        this.broadcastToMatch(matchId, {
          type: 'score_update',
          data,
          timestamp: Date.now(),
          matchId
        });
      }
    });
  }

  /**
   * Unsubscribe from match updates
   */
  private unsubscribeFromMatch(matchId: string, connectionId: string): void {
    const subscriptions = this.matchSubscriptions.get(matchId);
    if (subscriptions) {
      subscriptions.delete(connectionId);
      if (subscriptions.size === 0) {
        this.matchSubscriptions.delete(matchId);
      }
    }
  }

  /**
   * Broadcast message to all connections subscribed to a match
   */
  private broadcastToMatch(matchId: string, message: WebSocketMessage): void {
    const subscriptions = this.matchSubscriptions.get(matchId);
    if (!subscriptions) return;

    subscriptions.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.isActive) {
        this.sendMessage(connection.socket, message);
      }
    });
  }

  /**
   * Send message through WebSocket
   */
  private sendMessage(socket: WebSocket, message: WebSocketMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  /**
   * Find existing connection for user and match
   */
  private findExistingConnection(userId: string, matchId?: string): WebSocketConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.userId === userId && 
          connection.matchId === matchId && 
          connection.isActive) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Attempt to reconnect a closed connection
   */
  private async attemptReconnection(connection: WebSocketConnection): Promise<void> {
    const attempts = this.reconnectAttempts.get(connection.id) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.log(`Max reconnection attempts reached for ${connection.id}`);
      this.cleanupConnection(connection.id);
      return;
    }

    this.reconnectAttempts.set(connection.id, attempts + 1);
    
    // Exponential backoff
    const delay = Math.pow(2, attempts) * 1000;
    
    setTimeout(async () => {
      try {
        console.log(`Attempting reconnection ${attempts + 1}/${this.maxReconnectAttempts} for ${connection.id}`);
        await this.createConnection(connection.userId!, connection.matchId);
      } catch (error) {
        console.error(`Reconnection failed for ${connection.id}:`, error);
      }
    }, delay);
  }

  /**
   * Check connection health and cleanup inactive connections
   */
  private checkConnectionHealth(): void {
    const now = Date.now();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [connectionId, connection] of this.connections.entries()) {
      if (now - connection.lastActivity > inactiveThreshold) {
        console.log(`Cleaning up inactive connection: ${connectionId}`);
        connection.socket.close();
        this.cleanupConnection(connectionId);
      }
    }
  }

  /**
   * Clean up connection
   */
  private cleanupConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Unsubscribe from match
      if (connection.matchId) {
        this.unsubscribeFromMatch(connection.matchId, connectionId);
      }
      
      // Remove from connections
      this.connections.delete(connectionId);
      this.reconnectAttempts.delete(connectionId);
    }
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(matchId?: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const path = matchId ? `/live/${matchId}` : '/live';
    
    return `${protocol}//${host}${path}`;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    matchSubscriptions: number;
    reconnectAttempts: number;
  } {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isActive).length;
    
    return {
      totalConnections: this.connections.size,
      activeConnections,
      matchSubscriptions: this.matchSubscriptions.size,
      reconnectAttempts: Array.from(this.reconnectAttempts.values())
        .reduce((sum, attempts) => sum + attempts, 0)
    };
  }

  /**
   * Close all connections
   */
  closeAllConnections(): void {
    for (const connection of this.connections.values()) {
      connection.socket.close();
    }
    this.connections.clear();
    this.matchSubscriptions.clear();
    this.reconnectAttempts.clear();
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

/**
 * Server-Sent Events (SSE) Service as fallback
 */
export class SSEService {
  private connections: Map<string, EventSource> = new Map();

  /**
   * Create SSE connection
   */
  createConnection(userId: string, matchId?: string): EventSource {
    const connectionId = `${userId}-${matchId || 'global'}`;
    
    // Close existing connection if any
    const existingConnection = this.connections.get(connectionId);
    if (existingConnection) {
      existingConnection.close();
    }

    // Create new EventSource
    const url = this.getSSEUrl(matchId);
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      console.log(`SSE connection opened: ${connectionId}`);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        analyticsPipeline.emit('sseMessage', {
          connectionId,
          data
        });
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error(`SSE error for connection ${connectionId}:`, error);
    };

    this.connections.set(connectionId, eventSource);
    return eventSource;
  }

  /**
   * Get SSE URL
   */
  private getSSEUrl(matchId?: string): string {
    const path = matchId ? `/api/sse/match/${matchId}` : '/api/sse/live';
    return `${window.location.origin}${path}`;
  }

  /**
   * Close SSE connection
   */
  closeConnection(userId: string, matchId?: string): void {
    const connectionId = `${userId}-${matchId || 'global'}`;
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.close();
      this.connections.delete(connectionId);
    }
  }

  /**
   * Close all SSE connections
   */
  closeAllConnections(): void {
    for (const connection of this.connections.values()) {
      connection.close();
    }
    this.connections.clear();
  }
}

/**
 * Polling Service as final fallback
 */
export class PollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private defaultInterval = 5000; // 5 seconds

  /**
   * Start polling for match updates
   */
  startPolling(userId: string, matchId: string, callback: (data: any) => void): void {
    const pollingId = `${userId}-${matchId}`;
    
    // Stop existing polling if any
    this.stopPolling(userId, matchId);

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/match/${matchId}/score`);
        if (response.ok) {
          const data = await response.json();
          callback(data);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, this.defaultInterval);

    this.intervals.set(pollingId, interval);
  }

  /**
   * Stop polling
   */
  stopPolling(userId: string, matchId?: string): void {
    const pollingId = `${userId}-${matchId || 'global'}`;
    const interval = this.intervals.get(pollingId);
    
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(pollingId);
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}

/**
 * Hybrid Real-time Service
 * Combines WebSocket, SSE, and Polling for maximum reliability
 */
export class HybridRealtimeService {
  private wsManager: WebSocketManager;
  private sseService: SSEService;
  private pollingService: PollingService;
  private currentMethod: 'websocket' | 'sse' | 'polling' = 'websocket';

  constructor() {
    this.wsManager = new WebSocketManager();
    this.sseService = new SSEService();
    this.pollingService = new PollingService();
  }

  /**
   * Connect to real-time updates with fallback
   */
  async connect(userId: string, matchId?: string, callback: (data: any) => void): Promise<void> {
    try {
      // Try WebSocket first
      await this.connectWebSocket(userId, matchId, callback);
      this.currentMethod = 'websocket';
    } catch (wsError) {
      console.warn('WebSocket connection failed, trying SSE:', wsError);
      
      try {
        // Try SSE as fallback
        this.connectSSE(userId, matchId, callback);
        this.currentMethod = 'sse';
      } catch (sseError) {
        console.warn('SSE connection failed, using polling:', sseError);
        
        // Use polling as final fallback
        this.connectPolling(userId, matchId || 'global', callback);
        this.currentMethod = 'polling';
      }
    }
  }

  /**
   * Connect using WebSocket
   */
  private async connectWebSocket(userId: string, matchId: string | undefined, callback: (data: any) => void): Promise<void> {
    const socket = await this.wsManager.createConnection(userId, matchId);
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        callback(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  /**
   * Connect using SSE
   */
  private connectSSE(userId: string, matchId: string | undefined, callback: (data: any) => void): void {
    const eventSource = this.sseService.createConnection(userId, matchId);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
  }

  /**
   * Connect using Polling
   */
  private connectPolling(userId: string, pollingId: string, callback: (data: any) => void): void {
    this.pollingService.startPolling(userId, pollingId, callback);
  }

  /**
   * Disconnect from real-time updates
   */
  disconnect(userId: string, matchId?: string): void {
    this.wsManager.cleanupConnection(`${userId}-${matchId || 'global'}`);
    this.sseService.closeConnection(userId, matchId);
    this.pollingService.stopPolling(userId, matchId);
  }

  /**
   * Get current connection method
   */
  getConnectionMethod(): string {
    return this.currentMethod;
  }

  /**
   * Get connection statistics
   */
  getStats(): any {
    return {
      method: this.currentMethod,
      websocket: this.wsManager.getStats(),
      sse: {
        connections: this.sseService['connections'].size
      },
      polling: {
        activePolls: this.pollingService['intervals'].size
      }
    };
  }

  /**
   * Close all connections
   */
  closeAll(): void {
    this.wsManager.closeAllConnections();
    this.sseService.closeAllConnections();
    this.pollingService.stopAllPolling();
  }
}

// Singleton instance
export const realtimeService = new HybridRealtimeService();
