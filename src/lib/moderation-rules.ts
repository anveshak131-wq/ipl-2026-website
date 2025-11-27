/**
 * Auto-Moderation Rules Engine
 * Handles automatic content flagging and action suggestions
 */

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ActionType = 'none' | 'flag' | 'hide' | 'delete' | 'blockUser';

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  pattern?: RegExp | string;
  severity: SeverityLevel;
  action: ActionType;
  keywords?: string[];
  caseSensitive?: boolean;
  priority?: number;
}

export interface FlaggedContent {
  id: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: number;
  matchId: string;
  flaggedRules: string[];
  severity: SeverityLevel;
  suggestedAction: ActionType;
  reviewed: boolean;
  actionTaken?: ActionType;
  actionTakenAt?: number;
  actionTakenBy?: string;
  reason?: string;
}

export interface ModerationStats {
  totalFlagged: number;
  pending: number;
  resolved: number;
  falsePositives: number;
  autoActioned: number;
  manualActioned: number;
  topRules: { ruleId: string; count: number }[];
}

class ModerationRulesEngine {
  private rules: Map<string, ModerationRule> = new Map();
  private flaggedContent: Map<string, FlaggedContent> = new Map();
  private stats: ModerationStats = {
    totalFlagged: 0,
    pending: 0,
    resolved: 0,
    falsePositives: 0,
    autoActioned: 0,
    manualActioned: 0,
    topRules: [],
  };

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default moderation rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: ModerationRule[] = [
      {
        id: 'spam_links',
        name: 'Spam Links',
        description: 'Detects excessive URLs or suspicious links',
        enabled: true,
        pattern: /(https?:\/\/[^\s]+){2,}/gi,
        severity: 'medium',
        action: 'flag',
        priority: 1,
      },
      {
        id: 'all_caps',
        name: 'All Caps Spam',
        description: 'Detects messages in all caps (potential spam)',
        enabled: true,
        pattern: /^[A-Z\s!?]{20,}$/,
        severity: 'low',
        action: 'flag',
        priority: 2,
      },
      {
        id: 'repeated_chars',
        name: 'Repeated Characters',
        description: 'Detects excessive character repetition',
        enabled: true,
        pattern: /(.)\1{9,}/g,
        severity: 'low',
        action: 'flag',
        priority: 3,
      },
      {
        id: 'offensive_language',
        name: 'Offensive Language',
        description: 'Detects offensive or abusive language',
        enabled: true,
        keywords: ['badword1', 'badword2', 'badword3'], // Placeholder
        severity: 'high',
        action: 'hide',
        caseSensitive: false,
        priority: 1,
      },
      {
        id: 'personal_info',
        name: 'Personal Information',
        description: 'Detects potential personal information sharing',
        enabled: true,
        pattern: /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        severity: 'high',
        action: 'hide',
        priority: 1,
      },
      {
        id: 'hate_speech',
        name: 'Hate Speech',
        description: 'Detects hate speech or discrimination',
        enabled: true,
        keywords: [], // Would be populated with actual hate speech keywords
        severity: 'critical',
        action: 'delete',
        caseSensitive: false,
        priority: 0,
      },
    ];

    defaultRules.forEach((rule) => this.rules.set(rule.id, rule));
  }

  /**
   * Check content against all rules
   */
  public checkContent(
    content: string,
    userId: string,
    userName: string,
    matchId: string
  ): FlaggedContent | null {
    const flaggedRules: string[] = [];
    let maxSeverity: SeverityLevel = 'low';
    let suggestedAction: ActionType = 'none';

    // Check each enabled rule
    const sortedRules = Array.from(this.rules.values())
      .filter((r) => r.enabled)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

    for (const rule of sortedRules) {
      if (this.matchesRule(content, rule)) {
        flaggedRules.push(rule.id);

        // Update severity and action
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        if (severityOrder[rule.severity] > severityOrder[maxSeverity]) {
          maxSeverity = rule.severity;
          suggestedAction = rule.action;
        }
      }
    }

    if (flaggedRules.length === 0) {
      return null; // No rules matched
    }

    const flaggedItem: FlaggedContent = {
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      userId,
      userName,
      timestamp: Date.now(),
      matchId,
      flaggedRules,
      severity: maxSeverity,
      suggestedAction,
      reviewed: false,
    };

    this.flaggedContent.set(flaggedItem.id, flaggedItem);
    this.stats.totalFlagged++;
    this.stats.pending++;

    return flaggedItem;
  }

  /**
   * Check if content matches a rule
   */
  private matchesRule(content: string, rule: ModerationRule): boolean {
    if (rule.keywords && rule.keywords.length > 0) {
      const text = rule.caseSensitive ? content : content.toLowerCase();
      const keywords = rule.caseSensitive ? rule.keywords : rule.keywords.map((k) => k.toLowerCase());
      return keywords.some((keyword) => text.includes(keyword));
    }

    if (rule.pattern) {
      const pattern = typeof rule.pattern === 'string' ? new RegExp(rule.pattern) : rule.pattern;
      return pattern.test(content);
    }

    return false;
  }

  /**
   * Get pending flagged content
   */
  public getPendingContent(limit: number = 50): FlaggedContent[] {
    return Array.from(this.flaggedContent.values())
      .filter((item) => !item.reviewed)
      .sort((a, b) => {
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, limit);
  }

  /**
   * Get all flagged content
   */
  public getAllFlaggedContent(limit: number = 100): FlaggedContent[] {
    return Array.from(this.flaggedContent.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Mark content as reviewed and take action
   */
  public reviewContent(
    contentId: string,
    action: ActionType,
    reason: string,
    reviewedBy: string
  ): FlaggedContent | null {
    const content = this.flaggedContent.get(contentId);
    if (!content) return null;

    content.reviewed = true;
    content.actionTaken = action;
    content.actionTakenAt = Date.now();
    content.actionTakenBy = reviewedBy;
    content.reason = reason;

    this.stats.pending--;
    this.stats.resolved++;

    if (action !== 'none') {
      this.stats.manualActioned++;
    } else {
      this.stats.falsePositives++;
    }

    return content;
  }

  /**
   * Auto-action flagged content based on rules
   */
  public autoActionContent(contentId: string, adminId: string): FlaggedContent | null {
    const content = this.flaggedContent.get(contentId);
    if (!content || content.reviewed) return null;

    return this.reviewContent(
      contentId,
      content.suggestedAction,
      `Auto-actioned based on rule: ${content.flaggedRules.join(', ')}`,
      adminId
    );
  }

  /**
   * Bulk action on multiple flagged items
   */
  public bulkAction(
    contentIds: string[],
    action: ActionType,
    reason: string,
    adminId: string
  ): FlaggedContent[] {
    return contentIds
      .map((id) => this.reviewContent(id, action, reason, adminId))
      .filter((item) => item !== null) as FlaggedContent[];
  }

  /**
   * Add or update a rule
   */
  public addRule(rule: ModerationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Get all rules
   */
  public getRules(): ModerationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Enable/disable a rule
   */
  public toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get moderation statistics
   */
  public getStats(): ModerationStats {
    // Update top rules
    const ruleCounts = new Map<string, number>();
    this.flaggedContent.forEach((content) => {
      content.flaggedRules.forEach((ruleId) => {
        ruleCounts.set(ruleId, (ruleCounts.get(ruleId) ?? 0) + 1);
      });
    });

    this.stats.topRules = Array.from(ruleCounts.entries())
      .map(([ruleId, count]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { ...this.stats };
  }

  /**
   * Clear old flagged content (older than specified time)
   */
  public clearOldContent(olderThanMs: number): number {
    const cutoffTime = Date.now() - olderThanMs;
    let cleared = 0;

    this.flaggedContent.forEach((content, id) => {
      if (content.timestamp < cutoffTime && content.reviewed) {
        this.flaggedContent.delete(id);
        cleared++;
      }
    });

    return cleared;
  }
}

// Singleton instance
let instance: ModerationRulesEngine | null = null;

export function getModerationEngine(): ModerationRulesEngine {
  if (!instance) {
    instance = new ModerationRulesEngine();
  }
  return instance;
}

export function resetModerationEngine(): void {
  instance = null;
}
