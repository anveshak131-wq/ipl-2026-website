'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Calendar,
  FileText,
  Users,
  Bell,
  X,
  Save,
} from 'lucide-react';
import { useToast } from '../Toast';

export type EmailTemplateType = 'match_reminder' | 'news_update' | 'team_update' | 'welcome';

export interface EmailTemplate {
  id: string;
  name: string;
  type: EmailTemplateType;
  subject: string;
  body: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface EmailTemplatesProps {
  templates: EmailTemplate[];
  onSave: (template: EmailTemplate) => void;
  onDelete: (id: string) => void;
  onSendTest: (template: EmailTemplate, email: string) => void;
}

const templateTypes = [
  { value: 'match_reminder', label: 'Match Reminder', icon: Calendar },
  { value: 'news_update', label: 'News Update', icon: FileText },
  { value: 'team_update', label: 'Team Update', icon: Users },
  { value: 'welcome', label: 'Welcome Email', icon: Bell },
];

export default function EmailTemplates({
  templates,
  onSave,
  onDelete,
  onSendTest,
}: EmailTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'match_reminder' as EmailTemplateType,
    subject: '',
    body: '',
  });

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: 'match_reminder',
      subject: '',
      body: '',
    });
    setIsOpen(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      body: template.body,
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.subject || !formData.body) {
      showError('Please fill in all required fields');
      return;
    }

    const template: EmailTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      ...formData,
      variables: extractVariables(formData.body),
      createdAt: editingTemplate?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(template);
    setIsOpen(false);
    setEditingTemplate(null);
    success(editingTemplate ? 'Template updated' : 'Template created');
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleSendTest = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setTestEmail('');
    setShowTestDialog(true);
  };

  const confirmSendTest = () => {
    if (!testEmail || !testEmail.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    onSendTest(previewTemplate!, testEmail);
    setShowTestDialog(false);
    setPreviewTemplate(null);
    success(`Test email sent to ${testEmail}`);
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ''))));
  };

  const previewWithData = (template: EmailTemplate) => {
    let preview = template.body;
    const sampleData: { [key: string]: string } = {
      userName: 'John Doe',
      userEmail: 'john@example.com',
      teamName: 'Royal Challengers Bangalore',
      matchDate: '2026-04-15',
      matchTime: '7:30 PM',
      venue: 'M. Chinnaswamy Stadium',
      opponent: 'Mumbai Indians',
      newsTitle: 'Latest IPL News',
      newsSummary: 'Exciting updates from the tournament...',
    };

    template.variables.forEach((variable) => {
      const value = sampleData[variable] || `{{${variable}}}`;
      preview = preview.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
    });

    return preview;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#E6EDF3] flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#2F6FED]" />
          Email Templates
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F6FED] rounded-lg text-white text-sm font-medium hover:bg-[#2563EB] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </motion.button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const TypeIcon = templateTypes.find((t) => t.value === template.type)?.icon || FileText;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#141A22] border border-[#2A3440] rounded-xl p-4 hover:border-[#2F6FED]/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TypeIcon className="w-5 h-5 text-[#2F6FED]" />
                  <h4 className="font-semibold text-[#E6EDF3]">{template.name}</h4>
                </div>
                <span className="px-2 py-1 bg-[#1A2332] border border-[#2A3440] rounded text-xs text-[#AEBAC7]">
                  {templateTypes.find((t) => t.value === template.type)?.label}
                </span>
              </div>

              <p className="text-sm text-[#AEBAC7] mb-2 line-clamp-2">{template.subject}</p>

              {template.variables.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-[#6B7280] mb-1">Variables:</div>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-0.5 bg-[#1A2332] border border-[#2A3440] rounded text-[10px] text-[#2F6FED]"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => handlePreview(template)}
                  className="flex-1 px-3 py-1.5 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-xs font-medium hover:bg-[#141A22] transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
                <button
                  onClick={() => handleSendTest(template)}
                  className="flex-1 px-3 py-1.5 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] text-xs font-medium hover:bg-[#141A22] transition-colors flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  Test
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="px-3 py-1.5 bg-[#1A2332] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#141A22] transition-colors"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(template.id)}
                  className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B0F13] border border-[#2A3440] rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[#E6EDF3]">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Match Reminder Template"
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Template Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EmailTemplateType })}
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  >
                    {templateTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Email subject line"
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">
                    Body (use {'{{variable}}'} for dynamic content)
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    placeholder="Email body content..."
                    rows={12}
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED] font-mono text-sm"
                  />
                  <div className="mt-2 text-xs text-[#AEBAC7]">
                    Available variables: {'{{userName}}'}, {'{{userEmail}}'}, {'{{teamName}}'}, {'{{matchDate}}'}, {'{{matchTime}}'}, {'{{venue}}'}, {'{{opponent}}'}, {'{{newsTitle}}'}, {'{{newsSummary}}'}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#2A3440]">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-[#2F6FED] rounded-lg text-white font-semibold hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Template
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B0F13] border border-[#2A3440] rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#E6EDF3]">Email Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white rounded-lg p-6 text-gray-900">
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">To: john@example.com</div>
                  <div className="text-xs text-gray-500 mb-1">Subject: {previewTemplate.subject}</div>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewWithData(previewTemplate).replace(/\n/g, '<br>') }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Email Dialog */}
      <AnimatePresence>
        {showTestDialog && previewTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTestDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0B0F13] border border-[#2A3440] rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#E6EDF3]">Send Test Email</h3>
                <button
                  onClick={() => setShowTestDialog(false)}
                  className="p-1 text-[#AEBAC7] hover:text-[#E6EDF3] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#E6EDF3] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#2F6FED]"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#2A3440]">
                  <button
                    onClick={() => setShowTestDialog(false)}
                    className="flex-1 px-4 py-2 bg-[#141A22] border border-[#2A3440] rounded-lg text-[#E6EDF3] hover:bg-[#1A2332] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSendTest}
                    className="flex-1 px-4 py-2 bg-[#2F6FED] rounded-lg text-white font-semibold hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Test
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

