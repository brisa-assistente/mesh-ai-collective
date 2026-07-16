import { EventEmitter } from 'events';
import { MeshMessage, MeshNode } from '../shared/types.js';

export interface MeshNetwork {
  registerNode(node: DesktopMeshNode): void;
  send(message: MeshMessage): void;
  broadcast(message: MeshMessage): void;
}

export type MeshNetworkEvent =
  | { event: 'outgoing'; message: MeshMessage }
  | { event: 'delivered'; message: MeshMessage }
  | { event: 'received'; message: MeshMessage; nodeId: string };

export class InMemoryMeshNetwork extends EventEmitter implements MeshNetwork {
  private nodes = new Map<string, DesktopMeshNode>();

  registerNode(node: DesktopMeshNode): void {
    this.nodes.set(node.id, node);
    node.network = this;
  }

  send(message: MeshMessage): void {
    if (message.to) {
      const target = this.nodes.get(message.to);
      if (target) {
        this.emit('message', { event: 'outgoing', message });
        target.receive(message);
        this.emit('message', { event: 'delivered', message });
        return;
      }
      console.warn(`Mesh network: destination not found for message to=${message.to}`);
      return;
    }

    this.broadcast(message);
  }

  broadcast(message: MeshMessage): void {
    this.emit('message', { event: 'outgoing', message });
    for (const node of this.nodes.values()) {
      if (node.id !== message.from) {
        node.receive(message);
      }
    }
  }
}

export class DesktopMeshNode {
  public network: InMemoryMeshNetwork | null = null;

  constructor(public config: MeshNode) {}

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  receive(message: MeshMessage): void {
    console.log(`\n[${this.id}] Received ${message.type} from ${message.from}`);
    console.log(JSON.stringify(message, null, 2));

    if (this.network) {
      this.network.emit('message', {
        event: 'received',
        message,
        nodeId: this.id,
      });
    }
  }

  send(message: MeshMessage): void {
    if (!this.network) {
      throw new Error('Mesh node is not registered in a network.');
    }
    this.network.send(message);
  }

  createHeartbeat(): MeshMessage {
    return {
      from: this.id,
      type: 'heartbeat',
      payload: {
        name: this.name,
        role: this.config.role,
        capabilities: this.config.capabilities,
      },
      timestamp: new Date().toISOString(),
    };
  }

  startHeartbeat(interval = 5000): void {
    setInterval(() => {
      const heartbeat = this.createHeartbeat();
      console.log(`\n[${this.id}] Sending heartbeat`);
      this.send(heartbeat);
    }, interval);
  }

  sendTask(taskDetails: unknown, to: string): void {
    this.send({
      from: this.id,
      to,
      type: 'task',
      payload: taskDetails,
      timestamp: new Date().toISOString(),
    });
  }

  sendContext(context: unknown, to: string): void {
    this.send({
      from: this.id,
      to,
      type: 'context',
      payload: context,
      timestamp: new Date().toISOString(),
    });
  }
}
