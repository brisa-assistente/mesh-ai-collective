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

## O que este nó faz

- Inicializa um nó desktop como `gateway`
- Simula uma rede em memória com múltiplos nós
- Envias mensagens de `heartbeat`, `task` e `context`
- Exibe mensagens recebidas em todos os nós

## Estrutura do projeto

- `src/desktop/index.ts` - nó desktop principal
- `src/desktop/mesh.ts` - camada de rede mesh em memória
- `src/shared/types.ts` - tipos compartilhados
- `docs/ARCHITECTURE.md` - visão técnica
- `docs/ROADMAP.md` - plano de evolução

## Próximos passos

- Integrar MQTT ou ZeroMQ
- Adicionar armazenamento local de nós
- Criar nós especializados para tasks e sensores
4. Integrar memória distribuída e orquestração coletiva
