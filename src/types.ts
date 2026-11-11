export type Role = 'user' | 'model' | 'system';

export interface FunctionCallItem {
  id?: string;
  name: string;
  args: Record<string, any>;
  status: 'pending_confirmation' | 'executing' | 'completed' | 'failed' | 'rejected';
  result?: any;
  error?: string;
  executionTimestamp?: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: string;
  language?: 'bn' | 'en';
  functionCalls?: FunctionCallItem[];
  status?: 'sending' | 'delivered' | 'error';
}

export interface Alarm {
  id: string;
  label: string;
  time: string; // HH:mm
  enabled: boolean;
  repeatDaily?: boolean;
  created: string;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string; // ISO string or parsable format
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'health' | 'finance' | 'general';
  completed: boolean;
  created: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  actionType: 'app_launch' | 'system_lock' | 'backup_files' | 'whatsapp_draft' | 'custom';
  payload: string;
  lastRun?: string;
  status: 'active' | 'paused';
}

export interface PCAgentStatus {
  connected: boolean;
  lastChecked: string | null;
  service?: string;
  version?: string;
  hostname?: string;
  platform?: string;
  python_version?: string;
  cpu_count?: number;
  user?: string;
  battery?: {
    ac_online: boolean;
    percentage: number | null;
  };
  error?: string;
}

export interface PCCommandLog {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  success: boolean;
  message?: string;
  pid?: number;
  error?: string;
}

export interface SocialDraft {
  id: string;
  platform: 'whatsapp' | 'messenger';
  recipient: string;
  contactInfo: string;
  message: string;
  tone: string;
  language: 'bangla' | 'english';
  timestamp: string;
  isReply?: boolean;
  replyToSnippet?: string;
  autoLinkUrl?: string;
}

export interface ConfirmationRequest {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionType: string;
  payload: any;
  resolved?: boolean;
}

export interface AppSettings {
  agentUrl: string;
  agentToken: string;
  preferredLanguage: 'auto' | 'bn' | 'en';
  enableVoiceResponse: boolean;
  speechVoiceRate: number;
  requireConfirmationForApps: boolean;
  requireConfirmationForFiles: boolean;
  requireConfirmationForSystem: boolean;
}
