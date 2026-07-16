import { DesktopMeshNode, InMemoryMeshNetwork } from './mesh.js';
import { AssistantMeshNode, AIServiceManager } from './assistant.js';
import { MeshNode } from '../shared/types.js';
import { startWebInterface } from './mesh-server.js';

const gatewayConfig: MeshNode = {
  id: 'desktop-node-01',
  name: 'Desktop Node',
  role: 'gateway',
  capabilities: ['orchestration', 'context-sharing', 'local-inference'],
};

const edgeConfig: MeshNode = {
  id: 'desktop-node-02',
  name: 'Edge Node',
  role: 'edge',
  capabilities: ['sensor-data', 'local-processing'],
};

const coordinatorConfig: MeshNode = {
  id: 'desktop-node-03',
  name: 'Coordinator Node',
  role: 'coordinator',
  capabilities: ['scheduling', 'aggregation'],
};

const assistantConfig: MeshNode = {
  id: 'assistant-node-04',
  name: 'Assistant Node',
  role: 'assistant',
  capabilities: ['local-ai', 'online-ai', 'dialog'],
};

async function main() {
  const network = new InMemoryMeshNetwork();

  const gatewayNode = new DesktopMeshNode(gatewayConfig);
  const edgeNode = new DesktopMeshNode(edgeConfig);
  const coordinatorNode = new DesktopMeshNode(coordinatorConfig);
  const assistantManager = new AIServiceManager();
  const assistantNode = new AssistantMeshNode(assistantConfig, assistantManager);

  network.registerNode(gatewayNode);
  network.registerNode(edgeNode);
  network.registerNode(coordinatorNode);
  network.registerNode(assistantNode);

  console.log('Mesh AI Collective desktop node initialized');

  gatewayNode.startHeartbeat(8000);
  edgeNode.startHeartbeat(12000);
  coordinatorNode.startHeartbeat(15000);
  assistantNode.startHeartbeat(20000);

  setTimeout(() => {
    gatewayNode.sendTask({ task: 'analyze-sensor-data', priority: 'high' }, 'desktop-node-03');
  }, 3000);

  setTimeout(() => {
    edgeNode.sendContext({ temperature: 22.5, humidity: 0.55 }, 'desktop-node-01');
  }, 6000);

  const port = 3000;
  await startWebInterface(network, [gatewayNode, edgeNode, coordinatorNode, assistantNode], port);
  console.log(`Web interface available at http://localhost:${port}`);
}

main();
