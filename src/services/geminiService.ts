import { FunctionCallItem } from '../types';

export interface ChatResponse {
  text: string;
  functionCalls: FunctionCallItem[];
  language: 'bn' | 'en';
  timestamp: string;
}

export async function sendChatMessage(params: {
  message: string;
  history: { role: 'user' | 'model'; text: string }[];
  userLanguage?: 'auto' | 'bn' | 'en';
  pcAgentOnline?: boolean;
}): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      history: params.history,
      currentTime: new Date().toISOString(),
      userLanguage: params.userLanguage || 'auto',
      pcAgentOnline: !!params.pcAgentOnline,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${res.status}`);
  }

  const data = await res.json();
  return {
    text: data.text || '',
    functionCalls: (data.functionCalls || []).map((fc: any) => ({
      id: fc.id || `fc-${Math.random().toString(36).substr(2, 6)}`,
      name: fc.name,
      args: fc.args || {},
      status: 'pending_confirmation',
    })),
    language: data.language || 'en',
    timestamp: data.timestamp || new Date().toISOString(),
  };
}
