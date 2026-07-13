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

## Como começar

```bash
npm install
npm run build
npm start
```

## Próximos passos

1. Implementar comunicação mesh real via MQTT ou ZeroMQ
2. Adicionar agentes especializados
3. Criar nós para Raspberry Pi, ESP32 e outras plataformas
4. Integrar memória distribuída e orquestração coletiva
