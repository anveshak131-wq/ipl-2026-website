/**
 * Real-time Analytics Pipeline Implementation
 * Based on the architecture from CRICKBUZZ_LIVE_SCORING_ANALYSIS.md
 */

import { Redis } from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Kafka, Producer, Consumer } from 'kafkajs';
import { EventEmitter } from 'events';

// Types for the analytics pipeline
export interface MatchData {
  id: string;
  teams: {
    team1: string;
    team2: string;
  };
  score: {
    team1: number;
    team2: number;
  };
  overs: number;
  status: 'live' | 'completed' | 'scheduled';
  timestamp: number;
  venue: string;
  players: PlayerData[];
}

export interface PlayerData {
  id: string;
  name: string;
  team: string;
  runs: number;
  balls: number;
  strikeRate: number;
  wickets?: number;
  economy?: number;
}

export interface ProcessedMatchData extends MatchData {
  processedAt: number;
  metadata: {
    league: string;
    season: string;
    matchType: string;
  };
  analytics: {
    momentum: number;
    pressureIndex: number;
    predictionScore: number;
  };
}

export interface PipelineMetrics {
  throughput: number;
  latency: number;
  errorRate: number;
  uptime: number;
  processedEvents: number;
}

/**
 * Real-time Analytics Pipeline Class
 * Implements the hybrid architecture with WebSocket + SSE + Polling
 */
export class AnalyticsPipeline extends EventEmitter {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private redis: Redis;
  private elasticsearch: ElasticsearchClient;
  private isRunning: boolean = false;
  private metrics: PipelineMetrics;

  constructor() {
    super();
    this.initializeKafka();
    this.initializeRedis();
    this.initializeElasticsearch();
    this.initializeMetrics();
  }

  private initializeKafka() {
    this.kafka = new Kafka({
      clientId: 'ipl-analytics',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      ssl: process.env.KAFKA_SSL === 'true',
      sasl: process.env.KAFKA_SASL_USERNAME ? {
        mechanism: 'plain',
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD || ''
      } : undefined
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000
    });

    this.consumer = this.kafka.consumer({
      groupId: 'ipl-analytics-consumer',
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
  }

  private initializeRedis() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  private initializeElasticsearch() {
    this.elasticsearch = new ElasticsearchClient({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      } : undefined,
      maxRetries: 3,
      requestTimeout: 30000
    });
  }

  private initializeMetrics() {
    this.metrics = {
      throughput: 0,
      latency: 0,
      errorRate: 0,
      uptime: 0,
      processedEvents: 0
    };
  }

  /**
   * Start the analytics pipeline
   */
  async start(): Promise<void> {
    try {
      // Connect to all services
      await this.producer.connect();
      await this.consumer.connect();
      await this.redis.connect();
      
      // Test Elasticsearch connection
      await this.elasticsearch.ping();
      
      this.isRunning = true;
      
      // Start consuming messages
      await this.startConsumer();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      this.emit('started');
      console.log('Analytics pipeline started successfully');
    } catch (error) {
      console.error('Failed to start analytics pipeline:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the analytics pipeline
   */
  async stop(): Promise<void> {
    try {
      this.isRunning = false;
      
      await this.consumer.disconnect();
      await this.producer.disconnect();
      await this.redis.disconnect();
      
      this.emit('stopped');
      console.log('Analytics pipeline stopped successfully');
    } catch (error) {
      console.error('Error stopping analytics pipeline:', error);
      this.emit('error', error);
    }
  }

  /**
   * Process incoming match data
   * Implements the real-time data processing from the architecture
   */
  async processMatchData(matchData: MatchData): Promise<ProcessedMatchData> {
    const startTime = Date.now();
    
    try {
      // Step 1: Enrich data with additional context
      const enrichedData = await this.enrichMatchData(matchData);
      
      // Step 2: Process through analytics engine
      const processedData = await this.processAnalytics(enrichedData);
      
      // Step 3: Store in multiple systems
      await this.storeInRedis(processedData);
      await this.indexInElasticsearch(processedData);
      await this.publishToKafka(processedData);
      
      // Step 4: Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);
      
      // Step 5: Emit real-time updates
      this.emit('matchProcessed', processedData);
      
      return processedData;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, false);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Enrich match data with additional context
   */
  private async enrichMatchData(matchData: MatchData): Promise<MatchData & { enriched: boolean }> {
    // Add historical data
    const historicalData = await this.getHistoricalData(matchData.teams.team1, matchData.teams.team2);
    
    // Add venue information
    const venueStats = await this.getVenueStats(matchData.venue);
    
    // Add weather conditions (mock for now)
    const weatherConditions = await this.getWeatherConditions(matchData.venue);
    
    return {
      ...matchData,
      enriched: true,
      historicalData,
      venueStats,
      weatherConditions
    };
  }

  /**
   * Process analytics calculations
   */
  private async processAnalytics(data: any): Promise<ProcessedMatchData> {
    const analytics = {
      momentum: this.calculateMomentum(data),
      pressureIndex: this.calculatePressureIndex(data),
      predictionScore: await this.calculatePredictionScore(data)
    };

    return {
      ...data,
      processedAt: Date.now(),
      metadata: {
        league: 'IPL',
        season: '2026',
        matchType: 'T20'
      },
      analytics
    };
  }

  /**
   * Store data in Redis for fast access
   */
  private async storeInRedis(data: ProcessedMatchData): Promise<void> {
    const key = `match:${data.id}`;
    const ttl = 3600; // 1 hour
    
    // Store main match data
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    // Store in real-time data structure
    await this.redis.zadd('live_matches', Date.now(), data.id);
    
    // Store player-specific data
    for (const player of data.players) {
      await this.redis.hset(`player:${player.id}`, {
        matchId: data.id,
        runs: player.runs,
        strikeRate: player.strikeRate,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Index data in Elasticsearch for search and analytics
   */
  private async indexInElasticsearch(data: ProcessedMatchData): Promise<void> {
    await this.elasticsearch.index({
      index: 'matches',
      id: data.id,
      body: {
        timestamp: new Date(data.timestamp).toISOString(),
        teams: data.teams,
        score: data.score,
        status: data.status,
        venue: data.venue,
        analytics: data.analytics,
        players: data.players.map(p => ({
          id: p.id,
          name: p.name,
          team: p.team,
          runs: p.runs,
          strikeRate: p.strikeRate
        }))
      }
    });
  }

  /**
   * Publish data to Kafka for real-time updates
   */
  private async publishToKafka(data: ProcessedMatchData): Promise<void> {
    const message = {
      key: data.id,
      value: JSON.stringify(data),
      headers: {
        'content-type': 'application/json',
        'timestamp': Date.now().toString()
      }
    };

    await this.producer.send({
      topic: 'match-updates',
      messages: [message]
    });

    // Also publish to specific topics
    await this.producer.send({
      topic: 'live-scores',
      messages: [message]
    });

    await this.producer.send({
      topic: 'player-stats',
      messages: [{
        ...message,
        key: `players-${data.id}`
      }]
    });
  }

  /**
   * Start consuming messages from Kafka
   */
  private async startConsumer(): Promise<void> {
    await this.consumer.subscribe({
      topic: ['match-updates', 'live-scores', 'player-stats'],
      fromBeginning: false
    });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value?.toString() || '{}');
          this.emit('kafkaMessage', { topic, data });
        } catch (error) {
          console.error('Error processing Kafka message:', error);
          this.emit('error', error);
        }
      }
    });
  }

  /**
   * Calculate momentum based on current match situation
   */
  private calculateMomentum(data: any): number {
    // Simple momentum calculation based on runs and wickets
    const { score, overs } = data;
    const runRate = (score.team1 + score.team2) / (overs || 1);
    const wicketsLost = data.players?.filter((p: any) => p.wickets > 0).length || 0;
    
    // Normalize to 0-100 scale
    const momentum = Math.min(100, Math.max(0, (runRate * 10) - (wicketsLost * 5)));
    return Math.round(momentum);
  }

  /**
   * Calculate pressure index based on match situation
   */
  private calculatePressureIndex(data: any): number {
    const { overs, score } = data;
    const remainingOvers = 20 - (overs || 0);
    const targetScore = 200; // Average T20 target
    const currentScore = score.team1 + score.team2;
    const requiredRunRate = remainingOvers > 0 ? (targetScore - currentScore) / remainingOvers : 0;
    
    // Pressure increases as required run rate increases
    const pressure = Math.min(100, Math.max(0, requiredRunRate * 8));
    return Math.round(pressure);
  }

  /**
   * Calculate prediction score using ML model (mock for now)
   */
  private async calculatePredictionScore(data: any): Promise<number> {
    // Mock ML prediction - in real implementation, this would call an ML service
    const { score, overs } = data;
    const currentScore = score.team1 + score.team2;
    const projectedScore = currentScore * (20 / (overs || 1));
    
    // Normalize to 0-100 scale
    const prediction = Math.min(100, Math.max(0, (projectedScore / 200) * 100));
    return Math.round(prediction);
  }

  /**
   * Get historical data for teams
   */
  private async getHistoricalData(team1: string, team2: string): Promise<any> {
    // Mock implementation - would query database for historical matchups
    return {
      headToHead: {
        matches: 25,
        team1Wins: 15,
        team2Wins: 10
      },
      recentForm: {
        team1: 'WWLWW',
        team2: 'WLWWW'
      }
    };
  }

  /**
   * Get venue statistics
   */
  private async getVenueStats(venue: string): Promise<any> {
    // Mock implementation - would query venue database
    return {
      averageFirstInnings: 165,
      averageSecondInnings: 158,
      pitchType: 'balanced',
      dewFactor: 'medium'
    };
  }

  /**
   * Get weather conditions
   */
  private async getWeatherConditions(venue: string): Promise<any> {
    // Mock implementation - would call weather API
    return {
      temperature: 28,
      humidity: 65,
      windSpeed: 12,
      conditions: 'clear'
    };
  }

  /**
   * Update pipeline metrics
   */
  private updateMetrics(processingTime: number, success: boolean): void {
    this.metrics.processedEvents++;
    this.metrics.latency = (this.metrics.latency + processingTime) / 2;
    
    if (!success) {
      this.metrics.errorRate = (this.metrics.errorRate + 1) / this.metrics.processedEvents;
    }
    
    // Calculate throughput (events per minute)
    this.metrics.throughput = this.metrics.processedEvents / ((Date.now() - this.metrics.uptime) / 60000);
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metrics.uptime = Date.now();
    
    setInterval(() => {
      this.emit('metrics', this.metrics);
    }, 5000); // Emit metrics every 5 seconds
  }

  /**
   * Get current pipeline metrics
   */
  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }

  /**
   * Get real-time match data from Redis
   */
  async getLiveMatches(): Promise<ProcessedMatchData[]> {
    const matchIds = await this.redis.zrange('live_matches', 0, -1);
    const matches: ProcessedMatchData[] = [];
    
    for (const matchId of matchIds) {
      const data = await this.redis.get(`match:${matchId}`);
      if (data) {
        matches.push(JSON.parse(data));
      }
    }
    
    return matches;
  }

  /**
   * Search matches using Elasticsearch
   */
  async searchMatches(query: string): Promise<any> {
    const result = await this.elasticsearch.search({
      index: 'matches',
      body: {
        query: {
          multi_match: {
            query,
            fields: ['teams.team1', 'teams.team2', 'venue']
          }
        }
      }
    });
    
    return result.body.hits.hits.map((hit: any) => hit._source);
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(playerId: string): Promise<any> {
    const stats = await this.redis.hgetall(`player:${playerId}`);
    return stats;
  }
}

/**
 * Singleton instance for the analytics pipeline
 */
export const analyticsPipeline = new AnalyticsPipeline();

/**
 * Initialize and start the pipeline
 */
export async function initializeAnalyticsPipeline(): Promise<void> {
  try {
    await analyticsPipeline.start();
    console.log('Analytics pipeline initialized successfully');
  } catch (error) {
    console.error('Failed to initialize analytics pipeline:', error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownAnalyticsPipeline(): Promise<void> {
  try {
    await analyticsPipeline.stop();
    console.log('Analytics pipeline shut down successfully');
  } catch (error) {
    console.error('Error shutting down analytics pipeline:', error);
  }
}
