# Arquitetura proposta

## Visão geral

O projeto segue um modelo de inteligência distribuída, onde cada dispositivo atua como um nó com:

- autonomia local
- comunicação em rede mesh
- compartilhamento de contexto e tarefas
- orquestração distribuída

## Camadas

1. Camada de dispositivo
   - coleta dados locais
   - executa inferência leve
   - publica eventos e resultados

2. Camada de comunicação
   - troca mensagens entre nós
   - usa protocolos leves como MQTT, ZeroMQ ou WebSocket

3. Camada de coordenação
   - decide qual nó resolve cada tarefa
   - combina resultados parciais

4. Camada de conhecimento coletivo
   - mantém contexto compartilhado
   - permite memória distribuída e decisões colaborativas

## Nó desktop inicial

O primeiro nó implementado é um exemplo base em TypeScript para:

- iniciar um nó com identidade e papéis
- emitir mensagens de heartbeat
- receber mensagens de outros nós
- preparar a base para expansão para mesh real
