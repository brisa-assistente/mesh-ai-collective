import { DesktopMeshNode, InMemoryMeshNetwork } from './mesh.js';
import { AssistantMeshNode, AIServiceManager } from './assistant.js';
import { MeshNode } from '../shared/types.js';
import { startWebInterface } from './mesh-server.js';

const gatewayConfig: MeshNode = {
  id: 'desktop-node-01',
  name: 'Desktop Node',
  role: 'gateway',
  capabilities: ['orchestration', 'context-sharing', 'local-inference'],
  accessPolicy: {
    allowedRoles: ['coordinator', 'assistant'],
  },
};

const edgeConfig: MeshNode = {
  id: 'desktop-node-02',
  name: 'Edge Node',
  role: 'edge',
  capabilities: ['sensor-data', 'local-processing'],
  accessPolicy: {
    allowedRoles: ['gateway', 'coordinator'],
  },
};

const coordinatorPrimaryConfig: MeshNode = {
  id: 'desktop-node-03',
  name: 'Coordinator Node',
  role: 'coordinator',
  capabilities: ['scheduling', 'aggregation'],
  leadershipPriority: 100,
  accessPolicy: {
    allowedRoles: ['gateway', 'edge'],
  },
};

const coordinatorBackupConfig: MeshNode = {
  id: 'desktop-node-05',
  name: 'Coordinator Backup Node',
  role: 'coordinator',
  capabilities: ['scheduling', 'aggregation'],
  leadershipPriority: 80,
  accessPolicy: {
    allowedRoles: ['gateway', 'edge'],
  },
};

const assistantConfig: MeshNode = {
  id: 'assistant-node-04',
  name: 'Assistant Node',
  role: 'assistant',
  capabilities: ['local-ai', 'online-ai', 'dialog'],
  accessPolicy: {
    allowedRoles: ['gateway', 'coordinator'],
  },
};

const remoteControllerConfig: MeshNode = {
  id: 'remote-node-06',
  name: 'Remote Controller Node',
  role: 'remote-controller',
  capabilities: ['remote-control', 'device-access', 'screen-share'],
  accessPolicy: {
    allowedRoles: ['gateway', 'coordinator'],
  },
};

async function main() {
  const network = new InMemoryMeshNetwork();

  const gatewayNode = new DesktopMeshNode(gatewayConfig);
  const edgeNode = new DesktopMeshNode(edgeConfig);
  const coordinatorPrimaryNode = new DesktopMeshNode(coordinatorPrimaryConfig);
  const coordinatorBackupNode = new DesktopMeshNode(coordinatorBackupConfig);
  const assistantManager = new AIServiceManager();
  const assistantNode = new AssistantMeshNode(assistantConfig, assistantManager);
  const remoteControllerNode = new DesktopMeshNode(remoteControllerConfig);

  network.registerNode(gatewayNode);
  network.registerNode(edgeNode);
  network.registerNode(coordinatorPrimaryNode);
  network.registerNode(coordinatorBackupNode);
  network.registerNode(assistantNode);
  network.registerNode(remoteControllerNode);

  console.log('Mesh AI Collective desktop node initialized');

  gatewayNode.startHeartbeat(8000);
  edgeNode.startHeartbeat(12000);
  coordinatorPrimaryNode.startHeartbeat(15000);
  coordinatorBackupNode.startHeartbeat(15500);
  assistantNode.startHeartbeat(20000);

  setTimeout(() => {
    console.log(`Current leader: ${network.getCurrentLeaderId()}`);
    gatewayNode.sendTask({ task: 'analyze-sensor-data', priority: 'high' }, coordinatorPrimaryConfig.id);
  }, 3000);

  setTimeout(() => {
    edgeNode.sendContext({ temperature: 22.5, humidity: 0.55 }, 'desktop-node-01');
  }, 6000);

  const port = 3000;
  await startWebInterface(network, [gatewayNode, edgeNode, coordinatorPrimaryNode, coordinatorBackupNode, assistantNode, remoteControllerNode], port);
  console.log(`Web interface available at http://localhost:${port}`);
}

main();
