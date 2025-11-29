'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, FileText, Users, AlertCircle } from 'lucide-react';
import { EmailTemplate } from './EmailTemplates';
import { useToast } from '../Toast';

interface BulkEmailSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    templateId?: string;
    subject: string;
    body: string;
    recipientIds: string[];
    emailType: 'match' | 'news' | 'custom';
    matchId?: string;
    newsId?: string;
  }) => Promise<void>;
  templates: EmailTemplate[];
  selectedUserIds: string[];
  selectedUserEmails: string[];
  matches?: Array<{ id: string; team1: string; team2: string; date: string; venue: string; status?: string }>;
  news?: Array<{ id: string; title: string; summary: string }>;
}

export default function BulkEmailSendModal({
  isOpen,
  onClose,
  onSend,
  templates,
  selectedUserIds,
  selectedUserEmails,
  matches = [],
  news = [],
}: BulkEmailSendModalProps) {
  const [emailType, setEmailType] = useState<'match' | 'news' | 'custom'>('custom');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [selectedNews, setSelectedNews] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { success, error: showError } = useToast();

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const generateProfessionalSubject = (match: { team1: string; team2: string; date: string; venue: string; status?: string }) => {
    const matchDate = new Date(match.date);
    const now = new Date();
    const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Generate different subject styles based on timing and context
    const subjects = [];
    
    // Time-based variations
    if (hoursUntilMatch <= 1) {
      subjects.push(`⚡ LIVE SOON: ${match.team1} vs ${match.team2} - Match Starting!`);
      subjects.push(`🔥 Don't Miss: ${match.team1} vs ${match.team2} - Starting Now!`);
      subjects.push(`⏰ Final Reminder: ${match.team1} vs ${match.team2} - Match About to Begin!`);
    } else if (hoursUntilMatch <= 24) {
      subjects.push(`📅 Today's Match: ${match.team1} vs ${match.team2} - ${match.venue}`);
      subjects.push(`🎯 Upcoming Clash: ${match.team1} vs ${match.team2} - Don't Miss It!`);
      subjects.push(`🏏 Match Alert: ${match.team1} vs ${match.team2} - Today at ${matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);
    } else {
      const daysUntil = Math.floor(hoursUntilMatch / 24);
      const dayName = matchDate.toLocaleDateString('en-US', { weekday: 'long' });
      subjects.push(`📆 ${dayName}'s Match: ${match.team1} vs ${match.team2} - ${match.venue}`);
      subjects.push(`🏆 Upcoming Match: ${match.team1} vs ${match.team2} - ${daysUntil} Day${daysUntil > 1 ? 's' : ''} Away`);
      subjects.push(`🎪 Match Preview: ${match.team1} vs ${match.team2} - Save the Date!`);
    }
    
    // Venue-based variations (if it's a notable venue)
    const notableVenues = ['Wankhede', 'Eden Gardens', 'Chinnaswamy', 'Chepauk', 'Narendra Modi'];
    if (notableVenues.some(v => match.venue.includes(v))) {
      subjects.push(`🏟️ Epic Clash at ${match.venue}: ${match.team1} vs ${match.team2}`);
    }
    
    // Team rivalry variations (you can customize based on known rivalries)
    const rivalries = [
      ['CSK', 'MI'],
      ['RCB', 'CSK'],
      ['MI', 'RCB'],
      ['KKR', 'MI'],
    ];
    
    const isRivalry = rivalries.some(([t1, t2]) => 
      (match.team1.includes(t1) && match.team2.includes(t2)) ||
      (match.team1.includes(t2) && match.team2.includes(t1))
    );
    
    if (isRivalry) {
      subjects.push(`⚔️ Classic Rivalry: ${match.team1} vs ${match.team2} - The Battle Continues!`);
      subjects.push(`🔥 Rivalry Renewed: ${match.team1} vs ${match.team2} - Who Will Win?`);
    }
    
    // Action-oriented variations
    subjects.push(`🎯 Match Alert: ${match.team1} vs ${match.team2} - Get Ready for the Action!`);
    subjects.push(`🏏 Don't Miss: ${match.team1} vs ${match.team2} - Live Cricket Action Awaits!`);
    subjects.push(`📺 Tune In: ${match.team1} vs ${match.team2} - Catch All the Excitement!`);
    
    // Return a random professional subject
    const randomIndex = Math.floor(Math.random() * subjects.length);
    return subjects[randomIndex];
  };

  const generateProfessionalBody = (match: { team1: string; team2: string; date: string; venue: string; status?: string }) => {
    const matchDate = new Date(match.date);
    const formattedDate = matchDate.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const timeUntil = matchDate.getTime() - new Date().getTime();
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeMessage = '';
    if (hoursUntil > 0) {
      timeMessage = `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}${minutesUntil > 0 ? ` and ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}` : ''}`;
    } else if (minutesUntil > 0) {
      timeMessage = `in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`;
    } else {
      timeMessage = 'very soon';
    }
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="SportsUP Logo" style="max-width: 200px; height: auto;" />
  </div>
  
  <h2 style="color: #0066FF; margin-top: 30px;">Match Alert!</h2>
  
  <p>Dear {{userName}},</p>
  
  <p>Get ready for an electrifying cricket match! <strong>${match.team1}</strong> will face off against <strong>${match.team2}</strong> ${timeMessage}.</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #0066FF;">📅 Match Details:</h3>
    <ul style="list-style: none; padding: 0;">
      <li style="margin: 8px 0;"><strong>Teams:</strong> ${match.team1} vs ${match.team2}</li>
      <li style="margin: 8px 0;"><strong>Date & Time:</strong> ${formattedDate}</li>
      <li style="margin: 8px 0;"><strong>Venue:</strong> ${match.venue}</li>
      <li style="margin: 8px 0;"><strong>Status:</strong> ${match.status || 'Upcoming'}</li>
    </ul>
  </div>
  
  <p><strong>🎯 What to Expect:</strong></p>
  <p>This promises to be an exciting encounter between two competitive teams. Don't miss out on the live action, thrilling moments, and nail-biting finishes!</p>
  
  <p><strong>📺 How to Watch:</strong></p>
  <p>Tune in to catch all the action live. Whether you're supporting {{teamName}} or just love great cricket, this is a match you won't want to miss.</p>
  
  <p>Stay connected for live updates, scores, and highlights!</p>
  
  <p>Best regards,<br>The SportsUP Team</p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">
    *You can customize this email using variables: {{userName}}, {{userEmail}}, {{teamName}}, {{matchDate}}, {{matchTime}}, {{venue}}, and {{opponent}}*
  </p>
</body>
</html>`;
  };

  const handleMatchSelect = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      setSelectedMatch(matchId);
      
      // Generate professional subject using AI-like logic
      const professionalSubject = generateProfessionalSubject(match);
      const professionalBody = generateProfessionalBody(match);
      
      setSubject(professionalSubject);
      setBody(professionalBody);
    }
  };

  const handleNewsSelect = (newsId: string) => {
    const newsItem = news.find((n) => n.id === newsId);
    if (newsItem) {
      setSelectedNews(newsId);
      // Auto-fill subject and body for news with professional formatting
      const professionalSubject = generateProfessionalNewsSubject(newsItem);
      const professionalBody = generateProfessionalNewsBody(newsItem);
      setSubject(professionalSubject);
      setBody(professionalBody);
    }
  };

  const generateProfessionalNewsSubject = (newsItem: { title: string; summary: string }) => {
    const subjects = [
      `📰 ${newsItem.title}`,
      `🔥 Latest: ${newsItem.title}`,
      `⚡ Breaking: ${newsItem.title}`,
      `📢 Update: ${newsItem.title}`,
      `🎯 Don't Miss: ${newsItem.title}`,
    ];
    return subjects[Math.floor(Math.random() * subjects.length)];
  };

  const generateProfessionalNewsBody = (newsItem: { title: string; summary: string }) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="{{logoUrl}}" alt="SportsUP Logo" style="max-width: 200px; height: auto;" />
  </div>
  
  <h2 style="color: #0066FF; margin-top: 30px;">${newsItem.title}</h2>
  
  <p>Dear {{userName}},</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-size: 16px;">${newsItem.summary}</p>
  </div>
  
  <p>Read the full article and stay updated with the latest cricket news, insights, and updates!</p>
  
  <p>Best regards,<br>The SportsUP Team</p>
  
  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
  <p style="font-size: 12px; color: #666;">
    *You can customize this email using variables: {{userName}}, {{userEmail}}*
  </p>
</body>
</html>`;
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      showError('Please fill in both subject and body');
      return;
    }

    if (selectedUserIds.length === 0) {
      showError('Please select at least one user');
      return;
    }

    if (emailType === 'match' && !selectedMatch) {
      showError('Please select a match');
      return;
    }

    if (emailType === 'news' && !selectedNews) {
      showError('Please select a news article');
      return;
    }

    try {
      setIsSending(true);
      await onSend({
        templateId: selectedTemplate || undefined,
        subject: subject.trim(),
        body: body.trim(),
        recipientIds: selectedUserIds,
        emailType,
        matchId: emailType === 'match' ? selectedMatch : undefined,
        newsId: emailType === 'news' ? selectedNews : undefined,
      });
      success(`Email sent to ${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''}`);
      onClose();
      // Reset form
      setEmailType('custom');
      setSelectedTemplate('');
      setSelectedMatch('');
      setSelectedNews('');
      setSubject('');
      setBody('');
    } catch (e: any) {
      showError(e?.message || 'Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0B0F13] border border-[#2A3440] rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#E6EDF3] flex items-center gap-2">
                <Send className="w-5 h-5 text-[#2F6FED]" />
                Send Bulk Email
              </h3>
              <p className="text-sm text-[#AEBAC7] mt-1">
                Sending to {selectedUserIds.length} selected user{selectedUserIds.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Email Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#E6EDF3] mb-3">Email Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setEmailType('custom');
                  setSelectedMatch('');
                  setSelectedNews('');
                }}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  emailType === 'custom'
                    ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-[#2F6FED]'
                    : 'bg-[#141A22] border-[#2A3440] text-[#AEBAC7] hover:border-[#2F6FED]/50'
                }`}
              >
                <Mail className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">Custom</div>
              </button>
              <button
                onClick={() => {
                  setEmailType('match');
                  setSelectedTemplate('');
                }}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  emailType === 'match'
                    ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-[#2F6FED]'
                    : 'bg-[#141A22] border-[#2A3440] text-[#AEBAC7] hover:border-[#2F6FED]/50'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">Match</div>
              </button>
              <button
                onClick={() => {
                  setEmailType('news');
                  setSelectedTemplate('');
                }}
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  emailType === 'news'
                    ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-[#2F6FED]'
                    : 'bg-[#141A22] border-[#2A3440] text-[#AEBAC7] hover:border-[#2F6FED]/50'
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">News</div>
              </button>
            </div>
          </div>

          {/* Template Selection (for custom emails) */}
          {emailType === 'custom' && templates.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Use Template (Optional)</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Match Selection */}
          {emailType === 'match' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Select Match</label>
              {matches.length === 0 ? (
                <div className="px-4 py-3 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#AEBAC7] text-sm">
                  No matches found. Please check back later or create matches in the Matches admin page.
                </div>
              ) : (
                <select
                  value={selectedMatch}
                  onChange={(e) => handleMatchSelect(e.target.value)}
                  className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                >
                  <option value="">Select a match...</option>
                  {matches.map((match) => {
                    const matchDate = new Date(match.date);
                    const formattedDate = matchDate.toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <option key={match.id} value={match.id}>
                        {match.status === 'completed' ? '✓ ' : match.status === 'live' ? '🔴 LIVE ' : '⏰ '}{match.team1} vs {match.team2} - {formattedDate} ({match.venue})
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          )}

          {/* News Selection */}
          {emailType === 'news' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Select News</label>
              {news.length === 0 ? (
                <div className="px-4 py-3 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#AEBAC7] text-sm">
                  No news articles found. Please add news articles in the Content admin page.
                </div>
              ) : (
                <select
                  value={selectedNews}
                  onChange={(e) => handleNewsSelect(e.target.value)}
                  className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                >
                  <option value="">Select a news article...</option>
                  {news.map((newsItem) => (
                    <option key={newsItem.id} value={newsItem.id}>
                      {newsItem.title.length > 60 ? `${newsItem.title.substring(0, 60)}...` : newsItem.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
            />
          </div>

          {/* Body */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Email Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email content..."
              rows={10}
              className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED] font-mono text-sm"
            />
            <div className="mt-2 text-xs text-[#AEBAC7]">
              You can use variables like {'{{userName}}'}, {'{{userEmail}}'}, {'{{teamName}}'} in the body.
            </div>
          </div>

          {/* Recipient List Preview */}
          <div className="mb-6 p-4 bg-[#141A22] border border-[#2A3440] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#2F6FED]" />
              <span className="text-sm font-medium text-[#E6EDF3]">Recipients ({selectedUserIds.length})</span>
            </div>
            <div className="max-h-32 overflow-y-auto">
              <div className="text-xs text-[#AEBAC7] space-y-1">
                {selectedUserEmails.slice(0, 10).map((email, idx) => (
                  <div key={idx}>{email}</div>
                ))}
                {selectedUserEmails.length > 10 && (
                  <div className="text-[#6B7280]">... and {selectedUserEmails.length - 10} more</div>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <div className="font-medium mb-1">Important:</div>
              <div className="text-yellow-200/80">
                This will send emails to all {selectedUserIds.length} selected user{selectedUserIds.length > 1 ? 's' : ''}. Make sure the content is correct before sending.
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#2A3440]">
            <button
              onClick={onClose}
              disabled={isSending}
              className="flex-1 px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !subject.trim() || !body.trim()}
              className="flex-1 px-4 py-2 bg-[#2F6FED] rounded-lg text-white font-semibold hover:bg-[#2563EB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {selectedUserIds.length} User{selectedUserIds.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

