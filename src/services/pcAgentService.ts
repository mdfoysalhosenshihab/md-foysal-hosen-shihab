import { PCAgentStatus, PCCommandLog } from '../types';

export class PCAgentService {
  private agentUrl: string;
  private token: string;
  private commandLogs: PCCommandLog[] = [];

  constructor(agentUrl = 'http://localhost:5678', token = 'shihab-secret-key-2026') {
    this.agentUrl = agentUrl;
    this.token = token;
    this.loadLogs();
  }

  public updateConfig(agentUrl: string, token: string) {
    this.agentUrl = agentUrl.replace(/\/+$/, '');
    this.token = token;
  }

  public getAgentUrl(): string {
    return this.agentUrl;
  }

  public getToken(): string {
    return this.token;
  }

  private loadLogs() {
    try {
      const saved = localStorage.getItem('shihab_pc_command_logs');
      if (saved) {
        this.commandLogs = JSON.parse(saved);
      }
    } catch {
      this.commandLogs = [];
    }
  }

  private saveLog(log: Omit<PCCommandLog, 'id' | 'timestamp'>) {
    const entry: PCCommandLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.commandLogs.unshift(entry);
    if (this.commandLogs.length > 50) this.commandLogs.pop();
    try {
      localStorage.setItem('shihab_pc_command_logs', JSON.stringify(this.commandLogs));
    } catch {
      // ignore
    }
    return entry;
  }

  public getLogs(): PCCommandLog[] {
    return [...this.commandLogs];
  }

  public clearLogs() {
    this.commandLogs = [];
    localStorage.removeItem('shihab_pc_command_logs');
  }

  /**
   * Dispatches request to the agent directly or via server relay fallback
   */
  private async sendRequest(endpoint: string, method = 'POST', body?: any): Promise<any> {
    // We try server-side relay first to circumvent browser HTTPS -> HTTP localhost mixed-content blocking
    try {
      const relayRes = await fetch('/api/pc-agent/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: this.agentUrl,
          endpoint,
          method,
          payload: body,
          token: this.token,
        }),
      });

      const relayData = await relayRes.json();
      if (!relayRes.ok && relayRes.status === 503) {
        throw new Error(relayData.error || 'PC Agent unreachable via relay');
      }
      return relayData;
    } catch (relayErr: any) {
      // If server relay failed or not available, try direct client fetch
      try {
        const fullUrl = `${this.agentUrl}/${endpoint.replace(/^\/+/, '')}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const directRes = await fetch(fullUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
            'X-Agent-Token': this.token,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        return await directRes.json();
      } catch (directErr: any) {
        throw new Error(
          `PC Agent is unreachable at ${this.agentUrl}. Please ensure Python service is running ('python shihab_agent.py'). Details: ${directErr?.message || relayErr?.message}`
        );
      }
    }
  }

  /**
   * Health check to detect whether real local Python agent is running
   */
  public async checkHealth(): Promise<PCAgentStatus> {
    try {
      const data = await this.sendRequest('/api/status', 'GET');
      if (data && data.success && data.data) {
        return {
          connected: true,
          lastChecked: new Date().toISOString(),
          service: data.data.service,
          version: data.data.version,
          hostname: data.data.hostname,
          platform: data.data.platform,
          python_version: data.data.python_version,
          cpu_count: data.data.cpu_count,
          user: data.data.user,
          battery: data.data.battery,
        };
      }
      return {
        connected: false,
        lastChecked: new Date().toISOString(),
        error: data.error || 'Agent returned invalid response',
      };
    } catch (err: any) {
      return {
        connected: false,
        lastChecked: new Date().toISOString(),
        error: err.message,
      };
    }
  }

  /**
   * Real Windows Application Launch
   */
  public async launchApplication(appName: string, args = ''): Promise<{ success: boolean; message: string; pid?: number; error?: string }> {
    try {
      const res = await this.sendRequest('/api/launch', 'POST', { app: appName, args });
      if (res.success) {
        this.saveLog({
          action: 'launch_app',
          target: `${appName} ${args}`.trim(),
          success: true,
          message: res.message,
          pid: res.pid,
        });
        return {
          success: true,
          message: res.message || `Launched ${appName} successfully (PID: ${res.pid})`,
          pid: res.pid,
        };
      } else {
        const errMsg = res.error || res.message || 'Launch failed';
        this.saveLog({
          action: 'launch_app',
          target: appName,
          success: false,
          error: errMsg,
        });
        return { success: false, message: errMsg, error: errMsg };
      }
    } catch (err: any) {
      this.saveLog({
        action: 'launch_app',
        target: appName,
        success: false,
        error: err.message,
      });
      return {
        success: false,
        message: err.message,
        error: err.message,
      };
    }
  }

  /**
   * Real Windows File Browsing / Management
   */
  public async listFiles(directoryPath: string): Promise<{ success: boolean; path?: string; items?: any[]; error?: string }> {
    try {
      const res = await this.sendRequest('/api/files', 'POST', {
        operation: 'list',
        path: directoryPath,
      });
      if (res.success) {
        this.saveLog({
          action: 'list_files',
          target: directoryPath,
          success: true,
          message: `Listed ${res.count || (res.items && res.items.length) || 0} items`,
        });
        return { success: true, path: res.path, items: res.items || [] };
      }
      return { success: false, error: res.error || 'Failed to list directory' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Read file preview
   */
  public async readFile(filePath: string): Promise<{ success: boolean; content?: string; size?: number; error?: string }> {
    try {
      const res = await this.sendRequest('/api/files', 'POST', {
        operation: 'read',
        path: filePath,
      });
      if (res.success) {
        this.saveLog({
          action: 'read_file',
          target: filePath,
          success: true,
          message: `Read ${res.size} bytes`,
        });
        return { success: true, content: res.content, size: res.size };
      }
      return { success: false, error: res.error || 'Failed to read file' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Open path in Windows Explorer
   */
  public async openInExplorer(directoryPath: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const res = await this.sendRequest('/api/files', 'POST', {
        operation: 'open_explorer',
        path: directoryPath,
      });
      if (res.success) {
        this.saveLog({
          action: 'open_explorer',
          target: directoryPath,
          success: true,
          message: res.message,
        });
        return { success: true, message: res.message };
      }
      return { success: false, message: res.error || 'Failed to open Explorer', error: res.error };
    } catch (err: any) {
      return { success: false, message: err.message, error: err.message };
    }
  }

  /**
   * Real Windows System Action (Lock, Volume)
   */
  public async systemAction(action: 'lock' | 'volume_mute' | 'volume_up' | 'volume_down'): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const res = await this.sendRequest('/api/system', 'POST', { action });
      if (res.success) {
        this.saveLog({
          action: 'system_action',
          target: action,
          success: true,
          message: res.message,
        });
        return { success: true, message: res.message };
      }
      return { success: false, message: res.error || 'Action failed', error: res.error };
    } catch (err: any) {
      this.saveLog({
        action: 'system_action',
        target: action,
        success: false,
        error: err.message,
      });
      return { success: false, message: err.message, error: err.message };
    }
  }
}

export const pcAgent = new PCAgentService();
