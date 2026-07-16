export interface MeshNode {
  id: string;
  name: string;
  role: 'sensor' | 'edge' | 'gateway' | 'coordinator' | 'assistant';
  capabilities: string[];
}

export interface MeshMessage {
  from: string;
  to?: string;
  type: 'heartbeat' | 'task' | 'result' | 'context' | 'command' | 'assistant-query' | 'assistant-response';
  payload: unknown;
  timestamp: string;
}
