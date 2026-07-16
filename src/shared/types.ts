export interface MeshNode {
  id: string;
  name: string;
  // role describes the node type within the mesh; 'assistant' is a special
  // role used by the local AI assistant node.
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
