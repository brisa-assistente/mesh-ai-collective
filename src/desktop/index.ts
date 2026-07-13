import { MeshMessage, MeshNode } from '../shared/types.js';

const node: MeshNode = {
  id: 'desktop-node-01',
  name: 'Desktop Node',
  role: 'gateway',
  capabilities: ['orchestration', 'context-sharing', 'local-inference'],
};

function createHeartbeat(): MeshMessage {
  return {
    from: node.id,
    type: 'heartbeat',
    payload: {
      name: node.name,
      role: node.role,
      capabilities: node.capabilities,
    },
    timestamp: new Date().toISOString(),
  };
}

function main() {
  console.log('Mesh AI Collective desktop node initialized');
  console.log(JSON.stringify(createHeartbeat(), null, 2));
}

main();
