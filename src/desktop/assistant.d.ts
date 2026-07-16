declare module './assistant.js' {
  import { DesktopMeshNode } from './mesh.js';
  import { MeshNode, MeshMessage } from '../shared/types.js';

  export class AIServiceManager {
    answer(prompt: string): Promise<string>;
    localAnswer(prompt: string): string;
  }

  export class AssistantMeshNode extends DesktopMeshNode {
    constructor(config: MeshNode, aiService: AIServiceManager);
    receive(message: MeshMessage): void;
  }
}
