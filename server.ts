import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Google GenAI client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Tool declarations for Gemini Function Calling
const manageAlarmDeclaration: FunctionDeclaration = {
  name: 'manage_alarm',
  description: 'Set, list, or dismiss an alarm for the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action to perform: 'set', 'list', 'delete'",
      },
      time: {
        type: Type.STRING,
        description: 'Time for the alarm in HH:MM format (24h or 12h AM/PM, e.g. 07:30 or 7:30 AM).',
      },
      label: {
        type: Type.STRING,
        description: 'Descriptive title or purpose for the alarm (e.g., Morning Workout, Wake up, Meeting).',
      },
    },
    required: ['action'],
  },
};

const manageReminderDeclaration: FunctionDeclaration = {
  name: 'manage_reminder',
  description: 'Create, view, or manage a reminder with date, time, and priority.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action to perform: 'create', 'list', 'delete'",
      },
      title: {
        type: Type.STRING,
        description: 'Title or reminder task description.',
      },
      datetime: {
        type: Type.STRING,
        description: 'Target ISO date/time or natural description (e.g. 2026-11-11T14:00 or Today at 4 PM).',
      },
      priority: {
        type: Type.STRING,
        description: "Priority level: 'low', 'medium', 'high'.",
      },
      category: {
        type: Type.STRING,
        description: "Category: 'work', 'personal', 'health', 'finance', 'general'.",
      },
    },
    required: ['action'],
  },
};

const scheduleTaskDeclaration: FunctionDeclaration = {
  name: 'schedule_task',
  description: 'Schedule an automated recurring or one-time automation task.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Name of the scheduled automated task.',
      },
      schedule: {
        type: Type.STRING,
        description: 'Frequency or trigger time (e.g. Daily at 09:00, Every 2 hours, Tomorrow at 10:00).',
      },
      actionType: {
        type: Type.STRING,
        description: "Task type: 'app_launch', 'system_lock', 'backup_files', 'whatsapp_draft', 'custom'.",
      },
      payload: {
        type: Type.STRING,
        description: 'Specific details or arguments for the task action.',
      },
    },
    required: ['name', 'schedule', 'actionType'],
  },
};

const pcLaunchAppDeclaration: FunctionDeclaration = {
  name: 'pc_launch_application',
  description: 'Launch an application on the user Windows PC via the connected Python agent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      appName: {
        type: Type.STRING,
        description: 'Name of the application to open (e.g., notepad, chrome, vscode, calc, explorer, taskmgr, settings).',
      },
      arguments: {
        type: Type.STRING,
        description: 'Optional command line parameters or file path to open in the application.',
      },
      requiresConfirmation: {
        type: Type.BOOLEAN,
        description: 'Whether user confirmation should be prompted before executing this PC action (true for apps and sensitive operations).',
      },
    },
    required: ['appName'],
  },
};

const pcFileManagerDeclaration: FunctionDeclaration = {
  name: 'pc_file_manager',
  description: 'Browse, inspect directory contents, preview files, or open directories in Windows Explorer on the local PC.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      operation: {
        type: Type.STRING,
        description: "Operation to perform: 'list' (list directory items), 'read' (read text file preview), 'open_explorer' (open in Windows Explorer).",
      },
      path: {
        type: Type.STRING,
        description: 'Directory or file path (e.g., Documents, Downloads, Desktop, or C:\\...).',
      },
      requiresConfirmation: {
        type: Type.BOOLEAN,
        description: 'Whether user confirmation is requested before performing the file operation.',
      },
    },
    required: ['operation', 'path'],
  },
};

const pcSystemControlDeclaration: FunctionDeclaration = {
  name: 'pc_system_control',
  description: 'Perform system-level control on the Windows PC such as locking the screen, volume adjustments, or checking battery status.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "System action: 'lock' (lock workstation), 'volume_mute', 'volume_up', 'volume_down', 'battery_status'.",
      },
      requiresConfirmation: {
        type: Type.BOOLEAN,
        description: 'Flag if confirmation is required before executing (lock or sensitive action).',
      },
    },
    required: ['action'],
  },
};

const draftSocialMessageDeclaration: FunctionDeclaration = {
  name: 'draft_social_message',
  description: 'Draft an instant message or smart auto-reply for WhatsApp Web or Messenger in Bengali (বাংলা) or English with auto-linking.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      platform: {
        type: Type.STRING,
        description: "Target platform: 'whatsapp' or 'messenger'.",
      },
      recipientName: {
        type: Type.STRING,
        description: 'Name of the person or contact to message.',
      },
      contactInfo: {
        type: Type.STRING,
        description: 'Phone number for WhatsApp (international format e.g. +8801700000000) or Facebook username for Messenger.',
      },
      messageContent: {
        type: Type.STRING,
        description: 'Drafted message or smart reply body in natural Bengali or English.',
      },
      tone: {
        type: Type.STRING,
        description: "Tone of the message: 'formal', 'friendly', 'casual', 'urgent', 'affirmative', 'polite_decline', 'delay'.",
      },
      language: {
        type: Type.STRING,
        description: "Language used: 'bangla' or 'english'.",
      },
      isReply: {
        type: Type.BOOLEAN,
        description: 'Whether this is an auto-reply or response to an incoming message.',
      },
      replyToSnippet: {
        type: Type.STRING,
        description: 'Context or snippet of the original message being answered.',
      },
    },
    required: ['platform', 'recipientName', 'messageContent'],
  },
};

const tools = [
  {
    functionDeclarations: [
      manageAlarmDeclaration,
      manageReminderDeclaration,
      scheduleTaskDeclaration,
      pcLaunchAppDeclaration,
      pcFileManagerDeclaration,
      pcSystemControlDeclaration,
      draftSocialMessageDeclaration,
    ],
  },
];

// Helper to determine language
function detectLanguage(text: string): 'bn' | 'en' {
  // Check for Bengali Unicode range: 0980 - 09FF
  const bengaliRegex = /[\u0980-\u09FF]/;
  return bengaliRegex.test(text) ? 'bn' : 'en';
}

// API Route: Chat with Shihab AI
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      currentTime,
      pcAgentOnline = false,
      userLanguage = 'auto',
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not set. Please configure it in Settings > Secrets.',
      });
    }

    const detectedLang = userLanguage === 'auto' ? detectLanguage(message) : userLanguage;
    const nowStr = currentTime || new Date().toISOString();

    const systemInstruction = `You are Shihab AI (শিহাব এআই), a premier, highly intelligent, bilingual personal assistant and Windows desktop companion.
Current system time: ${nowStr}.
Connected PC Agent Status: ${pcAgentOnline ? 'ONLINE (Ready to execute real Windows commands)' : 'OFFLINE (Local Python agent is not connected yet)'}.

CORE PRINCIPLES:
1. BILINGUAL EXCELLENCE (বাংলা & English):
   - You seamlessly understand and respond in both Bengali (বাংলা) and English.
   - If the user speaks in Bengali, reply in natural, respectful, and articulate Bengali.
   - If the user speaks in English, reply in crisp, professional English.
   - You can also mix appropriately (Banglish / tech terms) when natural.

2. GEMINI FUNCTION CALLING:
   - When the user asks to set an alarm, create a reminder, schedule a task, launch a PC app, manage PC files, lock the screen, or draft/reply to a WhatsApp or Messenger message, you MUST call the appropriate function tool.
   - Never answer with "I have set your alarm" without invoking the \`manage_alarm\` tool.
   - Never answer with "I opened Notepad" without invoking \`pc_launch_application\`.

3. HONEST PC CONTROL POLICY (CRITICAL):
   - Never simulate PC control or falsely claim success.
   - If the PC agent is OFFLINE and the user asks for PC actions (like launching Chrome, checking files, locking PC), still invoke the function tool with requiresConfirmation=true, but explicitly notify the user in your message that the local Python service must be running at localhost:5678 to execute on their actual hardware.
   - For all sensitive actions (launching applications, file operations, system locking/sleeping), set requiresConfirmation = true so the user is in full control.

4. WHATSAPP AUTO-LINKING & SMART REPLY ASSISTANCE:
   - When the user asks to "auto link whatsapp", "reply", "whatsapp reply", or provides a message from a client/friend to answer:
     - ALWAYS call \`draft_social_message\` with platform: 'whatsapp'.
     - Extract any phone number provided (e.g. +8801..., 017...) or ask/use placeholder.
     - Set \`isReply: true\` and provide an impeccably phrased, courteous reply in the user's requested language (Bangla or English) and tone.
     - Always provide the user with the direct auto-linked WhatsApp Web URL in the response so they can click and send immediately.

Keep your verbal responses concise, helpful, and courteous.`;

    // Format chat contents
    const contents: any[] = [];

    // Add prior turns
    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        if (item.role === 'user' || item.role === 'model') {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }],
          });
        }
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        tools,
      },
    });

    const responseText = response.text || '';
    const functionCalls = response.functionCalls || [];

    return res.json({
      text: responseText,
      functionCalls,
      language: detectedLang,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate response from Shihab AI',
    });
  }
});

// Relay endpoint to forward commands to local Python agent
app.post('/api/pc-agent/relay', async (req: Request, res: Response) => {
  const { targetUrl, endpoint, method = 'POST', payload, token } = req.body;
  const baseUrl = targetUrl || 'http://localhost:5678';
  const fullUrl = `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || 'shihab-secret-key-2026'}`,
        'X-Agent-Token': token || 'shihab-secret-key-2026',
      },
    };

    if (method !== 'GET' && payload) {
      fetchOptions.body = JSON.stringify(payload);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    fetchOptions.signal = controller.signal;

    const agentRes = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeout);

    const data = await agentRes.json().catch(() => ({ statusText: agentRes.statusText }));
    return res.status(agentRes.status).json(data);
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: 'Cannot reach local PC Agent. Make sure `python shihab_agent.py` is running on your Windows PC.',
      details: err?.message,
    });
  }
});

// Start or ensure local agent service
async function ensureLocalAgentRunning() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('http://localhost:5678/api/status', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      return true;
    }
  } catch {
    // not running, spawn it
  }

  const scriptPath = path.join(__dirname, 'shihab_agent.py');
  if (fs.existsSync(scriptPath)) {
    try {
      const { spawn } = await import('child_process');
      const child = spawn('python3', [scriptPath, '--port', '5678'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return true;
    } catch (e) {
      console.warn('Could not spawn agent process:', e);
      return false;
    }
  }
  return false;
}

// Endpoint to explicitly bring agent online
app.post('/api/pc-agent/start', async (_req: Request, res: Response) => {
  const started = await ensureLocalAgentRunning();
  // Wait 500ms for socket binding
  await new Promise((r) => setTimeout(r, 600));

  try {
    const checkRes = await fetch('http://localhost:5678/api/status', { method: 'GET' });
    const data = await checkRes.json();
    return res.json({ success: true, message: 'Agent service is online', data });
  } catch (err: any) {
    return res.json({
      success: started,
      message: started ? 'Agent starting up' : 'Failed to start agent',
      error: err?.message,
    });
  }
});

// Downloadable shihab_agent.py script endpoint
app.get('/api/agent-script', (_req: Request, res: Response) => {
  const scriptPath = path.join(__dirname, 'shihab_agent.py');
  if (fs.existsSync(scriptPath)) {
    const content = fs.readFileSync(scriptPath, 'utf-8');
    res.setHeader('Content-Type', 'text/x-python');
    res.setHeader('Content-Disposition', 'attachment; filename="shihab_agent.py"');
    return res.send(content);
  }
  return res.status(404).json({ error: 'Agent script not found' });
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    name: 'Shihab AI Backend',
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  // Attempt to initialize local agent service
  ensureLocalAgentRunning().catch(() => {});

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Shihab AI server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
