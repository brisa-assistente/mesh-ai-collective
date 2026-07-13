export interface MeshNode {
  id: string;
  name: string;
  role: 'sensor' | 'edge' | 'gateway' | 'coordinator';
  capabilities: string[];
}

export interface MeshMessage {
  from: string;
  to?: string;
  type: 'heartbeat' | 'task' | 'result' | 'context' | 'command';
  payload: unknown;
  timestamp: string;
}
