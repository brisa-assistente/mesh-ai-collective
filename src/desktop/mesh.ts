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
  | { event: 'received'; message: MeshMessage; nodeId: string }
  | { event: 'leader-elected'; leaderId: string }
  | { event: 'leader-lost'; leaderId: string };

/**
 * In-memory mesh network implementation.
 * Routes messages between registered `DesktopMeshNode` instances inside the
 * same process and emits `message` events for observers.
 */
export class InMemoryMeshNetwork extends EventEmitter implements MeshNetwork {
  [x: string]: any;
  private nodes = new Map<string, DesktopMeshNode>();
  private heartbeatTimestamps = new Map<string, number>();
  private currentLeaderId: string | null = null;
  private readonly heartbeatTimeoutMs = 12000;
  private readonly leaderElectionTimer: NodeJS.Timeout;

  constructor() {
    super();
    this.leaderElectionTimer = setInterval(() => this.checkLeaderTimeout(), 5000);
  }

  registerNode(node: DesktopMeshNode): void {
    this.nodes.set(node.id, node);
    node.network = this;

    if (node.config.role === 'coordinator') {
      this.heartbeatTimestamps.set(node.id, Date.now());
      this.maybeElectLeader();
    }
  }

  send(message: MeshMessage): void {
    this.processHeartbeat(message);

    if (message.to) {
      const source = this.nodes.get(message.from);
      const target = this.nodes.get(message.to);
      if (target) {
        if (source && !this.isAllowed(source, target, message)) {
          console.warn(`Mesh network: access denied from=${message.from} to=${message.to} message=${message.type}`);
          return;
        }

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
        const source = this.nodes.get(message.from);
        if (source && !this.isAllowed(source, node, message)) {
          continue;
        }
        node.receive(message);
      }
    }
  }

  private isAllowed(sender: DesktopMeshNode, receiver: DesktopMeshNode, message: MeshMessage): boolean {
    const policy = receiver.config.accessPolicy;
    if (!policy) {
      return true;
    }

    if (policy.allowedNodeIds && !policy.allowedNodeIds.includes(sender.id)) {
      return false;
    }

    if (policy.allowedRoles && !policy.allowedRoles.includes(sender.config.role)) {
      return false;
    }

    return true;
  }

  private processHeartbeat(message: MeshMessage): void {
    if (message.type !== 'heartbeat') {
      return;
    }

    this.heartbeatTimestamps.set(message.from, Date.now());
    const node = this.nodes.get(message.from);
    if (node?.config.role === 'coordinator') {
      this.maybeElectLeader();
    }
  }

  private checkLeaderTimeout(): void {
    if (!this.currentLeaderId) {
      this.maybeElectLeader();
      return;
    }

    const lastSeen = this.heartbeatTimestamps.get(this.currentLeaderId);
    if (!lastSeen || Date.now() - lastSeen > this.heartbeatTimeoutMs) {
      const lostLeader = this.currentLeaderId;
      this.currentLeaderId = null;
      this.emit('message', { event: 'leader-lost', leaderId: lostLeader });
      this.maybeElectLeader();
    }
  }

  private maybeElectLeader(): void {
    const coordinators = [...this.nodes.values()].filter(
      (node) => node.config.role === 'coordinator' && this.isAlive(node.id),
    );

    if (coordinators.length === 0) {
      return;
    }

    coordinators.sort((a, b) => {
      const priorityA = a.config.leadershipPriority ?? 0;
      const priorityB = b.config.leadershipPriority ?? 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return a.id.localeCompare(b.id);
    });

    const elected = coordinators[0];
    if (elected.id !== this.currentLeaderId) {
      this.currentLeaderId = elected.id;
      this.emit('message', { event: 'leader-elected', leaderId: elected.id });
    }
  }

  private isAlive(nodeId: string): boolean {
    const lastSeen = this.heartbeatTimestamps.get(nodeId);
    return typeof lastSeen === 'number' && Date.now() - lastSeen <= this.heartbeatTimeoutMs;
  }

  getCurrentLeaderId(): string | null {
    return this.currentLeaderId;
  }
}

export class DesktopMeshNode {
  public network: InMemoryMeshNetwork | null = null;

  constructor(public config: MeshNode) {}

  /** Node identifier (from config.id). */

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
    const sendHeartbeat = () => {
      const heartbeat = this.createHeartbeat();
      console.log(`\n[${this.id}] Sending heartbeat`);
      this.send(heartbeat);
    };

    sendHeartbeat();
    setInterval(sendHeartbeat, interval);
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
