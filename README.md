# Mesh AI Collective

Este projeto é a base para um ecossistema de assistentes distribuídos em rede mesh, com nós autônomos que compartilham contexto, recursos e decisões.

## Visão

Construir uma arquitetura de IA coletiva offline, leve e escalável, onde cada dispositivo funciona como um nó com autonomia local e colaboração em rede.

## Objetivos iniciais

- Criar um nó desktop inicial em TypeScript
- Definir a arquitetura de rede mesh
- Documentar a evolução para dispositivos leves e multi-plataforma
- Preparar o projeto para publicação no GitHub

## Estrutura inicial

- docs/ARCHITECTURE.md: visão técnica da arquitetura
- docs/ROADMAP.md: plano de evolução
- src/desktop: nó desktop base
- src/shared: tipos e contratos compartilhados

## Executando o nó desktop

```bash
npm install
npm run build
npm start
```

Interface web: `http://localhost:3000`

### Integração com Ollama (IA local)

O assistente usa Ollama por padrão (offline-first), via API HTTP em `http://127.0.0.1:11434`.

Pré-requisitos:

1. Ollama instalado e em execução
2. Modelo baixado, por exemplo: `ollama pull llama3.2`

Variáveis de ambiente opcionais:

| Variável | Default | Descrição |
|----------|---------|-----------|
| `USE_OLLAMA` | ligado | Use `0` para desativar |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | URL da API |
| `OLLAMA_MODEL` | `llama3.2` | Modelo a usar |
| `OLLAMA_TIMEOUT_MS` | `120000` | Timeout da geração |
| `ONLINE_AI_URL` | — | Fallback online (opcional) |

PowerShell:

```powershell
$env:OLLAMA_MODEL = "llama3.2"
npm start
```

Para forçar só o responder local (sem Ollama):

```powershell
$env:USE_OLLAMA = "0"
npm start
```

## O que este nó faz

- Inicializa um nó desktop como `gateway`
- Simula uma rede em memória com múltiplos nós
- Envia mensagens de `heartbeat`, `task` e `context`
- Expõe UI web + WebSocket para queries ao nó assistant
- Responde com Ollama local (fallback online / regras)

## Estrutura do projeto

- `src/desktop/index.ts` - nó desktop principal
- `src/desktop/mesh.ts` - camada de rede mesh em memória
- `src/desktop/assistant.ts` - assistente + integração Ollama
- `src/desktop/mesh-server.ts` - UI web + WebSocket
- `src/shared/types.ts` - tipos compartilhados
- `docs/ARCHITECTURE.md` - visão técnica
- `docs/ROADMAP.md` - plano de evolução

## Próximos passos

- Integrar MQTT ou ZeroMQ
- Adicionar armazenamento local de nós
- Criar nós especializados para tasks e sensores
- Integrar memória distribuída e orquestração coletiva
