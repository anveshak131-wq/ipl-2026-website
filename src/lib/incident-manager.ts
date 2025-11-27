/**
 * Incident Management System
 * Tracks and manages incidents during live events
 */

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type IncidentCategory = 'performance' | 'moderation' | 'technical' | 'user' | 'data' | 'security' | 'other';

export interface IncidentEvent {
  timestamp: number;
  type: 'created' | 'updated' | 'status_changed' | 'severity_changed' | 'comment_added' | 'resolved' | 'closed';
  details: string;
  actor?: string;
}

export interface IncidentComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  matchId?: string;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  resolvedAt?: number;
  closedAt?: number;
  affectedUsers?: number;
  affectedSystems?: string[];
  rootCause?: string;
  resolution?: string;
  events: IncidentEvent[];
  comments: IncidentComment[];
  tags?: string[];
}

export interface IncidentStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  closed: number;
  avgResolutionTime: number;
  byCriticality: Record<IncidentSeverity, number>;
  byCategory: Record<IncidentCategory, number>;
}

class IncidentManager {
  private incidents: Map<string, Incident> = new Map();
  private incidentCounter: number = 0;

  /**
   * Create a new incident
   */
  public createIncident(
    title: string,
    description: string,
    category: IncidentCategory,
    severity: IncidentSeverity,
    createdBy: string,
    matchId?: string
  ): Incident {
    const id = `INC-${Date.now()}-${++this.incidentCounter}`;
    const now = Date.now();

    const incident: Incident = {
      id,
      title,
      description,
      category,
      severity,
      status: 'open',
      matchId,
      createdAt: now,
      createdBy,
      updatedAt: now,
      events: [
        {
          timestamp: now,
          type: 'created',
          details: `Incident created by ${createdBy}`,
          actor: createdBy,
        },
      ],
      comments: [],
    };

    this.incidents.set(id, incident);
    return incident;
  }

  /**
   * Get incident by ID
   */
  public getIncident(id: string): Incident | null {
    return this.incidents.get(id) || null;
  }

  /**
   * Get all incidents
   */
  public getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Get incidents by status
   */
  public getIncidentsByStatus(status: IncidentStatus): Incident[] {
    return Array.from(this.incidents.values())
      .filter((i) => i.status === status)
      .sort((a, b) => {
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Get incidents by category
   */
  public getIncidentsByCategory(category: IncidentCategory): Incident[] {
    return Array.from(this.incidents.values()).filter((i) => i.category === category);
  }

  /**
   * Get incidents for a specific match
   */
  public getIncidentsByMatch(matchId: string): Incident[] {
    return Array.from(this.incidents.values()).filter((i) => i.matchId === matchId);
  }

  /**
   * Update incident status
   */
  public updateStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    actor: string,
    details?: string
  ): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const oldStatus = incident.status;
    incident.status = newStatus;
    incident.updatedAt = Date.now();

    if (newStatus === 'resolved' && !incident.resolvedAt) {
      incident.resolvedAt = Date.now();
    }

    if (newStatus === 'closed' && !incident.closedAt) {
      incident.closedAt = Date.now();
    }

    incident.events.push({
      timestamp: Date.now(),
      type: 'status_changed',
      details: details || `Status changed from ${oldStatus} to ${newStatus}`,
      actor,
    });

    return incident;
  }

  /**
   * Update incident severity
   */
  public updateSeverity(
    incidentId: string,
    newSeverity: IncidentSeverity,
    actor: string,
    reason?: string
  ): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const oldSeverity = incident.severity;
    incident.severity = newSeverity;
    incident.updatedAt = Date.now();

    incident.events.push({
      timestamp: Date.now(),
      type: 'severity_changed',
      details: reason || `Severity changed from ${oldSeverity} to ${newSeverity}`,
      actor,
    });

    return incident;
  }

  /**
   * Add comment to incident
   */
  public addComment(incidentId: string, author: string, text: string): IncidentComment | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const comment: IncidentComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author,
      text,
      timestamp: Date.now(),
    };

    incident.comments.push(comment);
    incident.updatedAt = Date.now();

    incident.events.push({
      timestamp: Date.now(),
      type: 'comment_added',
      details: `Comment added by ${author}`,
      actor: author,
    });

    return comment;
  }

  /**
   * Resolve incident
   */
  public resolveIncident(
    incidentId: string,
    rootCause: string,
    resolution: string,
    actor: string
  ): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.rootCause = rootCause;
    incident.resolution = resolution;
    incident.resolvedAt = Date.now();
    incident.status = 'resolved';
    incident.updatedAt = Date.now();

    incident.events.push({
      timestamp: Date.now(),
      type: 'resolved',
      details: `Incident resolved: ${resolution}`,
      actor,
    });

    return incident;
  }

  /**
   * Close incident
   */
  public closeIncident(incidentId: string, actor: string): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = 'closed';
    incident.closedAt = Date.now();
    incident.updatedAt = Date.now();

    incident.events.push({
      timestamp: Date.now(),
      type: 'closed',
      details: 'Incident closed',
      actor,
    });

    return incident;
  }

  /**
   * Update affected users
   */
  public setAffectedUsers(incidentId: string, count: number): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.affectedUsers = count;
    incident.updatedAt = Date.now();

    return incident;
  }

  /**
   * Update affected systems
   */
  public setAffectedSystems(incidentId: string, systems: string[]): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.affectedSystems = systems;
    incident.updatedAt = Date.now();

    return incident;
  }

  /**
   * Add tags to incident
   */
  public addTags(incidentId: string, tags: string[]): Incident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const tagSet = new Set([...(incident.tags || []), ...tags]);
    incident.tags = Array.from(tagSet);
    incident.updatedAt = Date.now();

    return incident;
  }

  /**
   * Get incident statistics
   */
  public getStats(): IncidentStats {
    const incidents = Array.from(this.incidents.values());

    const stats: IncidentStats = {
      total: incidents.length,
      open: incidents.filter((i) => i.status === 'open').length,
      investigating: incidents.filter((i) => i.status === 'investigating').length,
      resolved: incidents.filter((i) => i.status === 'resolved').length,
      closed: incidents.filter((i) => i.status === 'closed').length,
      avgResolutionTime: 0,
      byCriticality: {
        low: incidents.filter((i) => i.severity === 'low').length,
        medium: incidents.filter((i) => i.severity === 'medium').length,
        high: incidents.filter((i) => i.severity === 'high').length,
        critical: incidents.filter((i) => i.severity === 'critical').length,
      },
      byCategory: {
        performance: incidents.filter((i) => i.category === 'performance').length,
        moderation: incidents.filter((i) => i.category === 'moderation').length,
        technical: incidents.filter((i) => i.category === 'technical').length,
        user: incidents.filter((i) => i.category === 'user').length,
        data: incidents.filter((i) => i.category === 'data').length,
        security: incidents.filter((i) => i.category === 'security').length,
        other: incidents.filter((i) => i.category === 'other').length,
      },
    };

    // Calculate average resolution time
    const resolvedIncidents = incidents.filter((i) => i.resolvedAt);
    if (resolvedIncidents.length > 0) {
      const totalResolutionTime = resolvedIncidents.reduce((sum, i) => {
        return sum + (i.resolvedAt! - i.createdAt);
      }, 0);
      stats.avgResolutionTime = totalResolutionTime / resolvedIncidents.length;
    }

    return stats;
  }

  /**
   * Get recent incidents
   */
  public getRecentIncidents(limit: number = 20): Incident[] {
    return Array.from(this.incidents.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  /**
   * Search incidents
   */
  public searchIncidents(query: string): Incident[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.incidents.values()).filter(
      (i) =>
        i.title.toLowerCase().includes(lowerQuery) ||
        i.description.toLowerCase().includes(lowerQuery) ||
        i.id.toLowerCase().includes(lowerQuery) ||
        i.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Export incidents as JSON
   */
  public exportAsJSON(): string {
    return JSON.stringify(Array.from(this.incidents.values()), null, 2);
  }

  /**
   * Clear old incidents (older than specified time in ms)
   */
  public clearOldIncidents(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    let cleared = 0;

    this.incidents.forEach((incident, id) => {
      if (incident.closedAt && incident.closedAt < cutoffTime) {
        this.incidents.delete(id);
        cleared++;
      }
    });

    return cleared;
  }

  /**
   * Reset manager
   */
  public reset(): void {
    this.incidents.clear();
    this.incidentCounter = 0;
  }
}

// Singleton instance
let instance: IncidentManager | null = null;

export function getIncidentManager(): IncidentManager {
  if (!instance) {
    instance = new IncidentManager();
  }
  return instance;
}

export function resetIncidentManager(): void {
  instance = null;
}
