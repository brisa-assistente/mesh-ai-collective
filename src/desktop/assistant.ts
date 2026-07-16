import { DesktopMeshNode } from './mesh.js';
import { type MeshMessage, type MeshNode } from '../shared/types.js';

/**
 * Simple AI service manager that attempts to call an online AI endpoint when
 * configured via `ONLINE_AI_URL`, falling back to a local rule-based responder.
 *
 * This is intentionally lightweight so it can run offline; replace or extend
 * with a proper local model runtime if needed.
 */

export class AIServiceManager {
  async answer(prompt: string): Promise<string> {
    const onlineUrl = process.env.ONLINE_AI_URL;

    if (onlineUrl) {
      try {
        const response = await fetch(onlineUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            model: process.env.ONLINE_AI_MODEL ?? 'gpt-3.5-turbo',
            key: process.env.ONLINE_AI_KEY ?? undefined,
          }),
        });

        if (!response.ok) {
          return `Online AI error: ${response.status} ${response.statusText}`;
        }

        const data = await response.json();
        if (typeof data.text === 'string') {
          return data.text;
        }

        if (Array.isArray(data.choices) && data.choices.length > 0) {
          const candidate = data.choices[0];
          if (typeof candidate.text === 'string') {
            return candidate.text;
          }
          if (candidate.message && typeof candidate.message.content === 'string') {
            return candidate.message.content;
          }
        }

        return `Online AI returned unexpected response: ${JSON.stringify(data)}`;
      } catch (error) {
        return `Online AI request failed: ${String(error)}`;
      }
    }

    return this.localAnswer(prompt);
  }

  localAnswer(prompt: string): string {
    const normalized = prompt.toLowerCase().trim();
    const sentences = normalized.split(/[.?!]+/).map((s) => s.trim()).filter(Boolean);
    const lastSentence = sentences.length > 0 ? sentences[sentences.length - 1] : normalized;

    if (/^(hi|hello|oi|ola|olá)/i.test(prompt)) {
      return 'Olá! Eu sou a assistente local do Mesh AI Collective. Como posso ajudar você hoje?';
    }
    if (/tempo|weather|clima/.test(normalized)) {
      return 'Ainda não tenho dados meteorológicos em tempo real, mas posso ajudar a encaminhar consultas de rede e explicar como o sistema funciona.';
    }
    if (/assistente|ajuda|help|pode fazer/.test(normalized)) {
      return 'Posso responder perguntas sobre a rede, os nós e como encaminhar mensagens. Se quiser, pergunte algo específico ou envie uma tarefa para outro nó.';
    }
    if (/sensor|temperatura|humidity|umidade/.test(normalized)) {
      return 'Os nós de borda coletam dados de sensores. Posso usar essa informação para ajudar na coordenação ou no fluxo de mensagens entre nós.';
    }
    if (/tarefa|task|prioridade/.test(normalized)) {
      return 'Você pode me pedir para direcionar tarefas entre nós ou verificar o estado de comunicação. Eu explico onde enviar e como o fluxo funciona.';
    }
    if (/rede|network|nós|nos/.test(normalized)) {
      return 'A rede mesh conecta nós locais em memória. Posso ajudar a monitorar mensagens e garantir que os nós se comuniquem corretamente.';
    }

    return `Resposta local simulada: eu entendi que você perguntou sobre "${lastSentence}". Em modo offline, uso padrões para te ajudar; se você quiser respostas mais avançadas, configure uma API online.`;
  }
}

export class AssistantMeshNode extends DesktopMeshNode {
  constructor(config: MeshNode, private aiService: AIServiceManager) {
    super(config);
  }

  override receive(message: MeshMessage): void {
    if (message.type === 'assistant-query') {
      console.log(`\n[${this.id}] Assistant query received from ${message.from}`);
      const queryText = typeof message.payload === 'string' ? message.payload : JSON.stringify(message.payload);
      this.aiService.answer(queryText)
        .then((response) => {
          const responseMessage: MeshMessage = {
            from: this.id,
            to: message.from,
            type: 'assistant-response',
            payload: response,
            timestamp: new Date().toISOString(),
          };
          if (this.network) {
            this.network.send(responseMessage);
          }
        })
        .catch((error) => {
          console.error(`Assistant node failed to answer: ${error}`);
        });
      return;
    }

    super.receive(message);
  }
}
