import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { DesktopMeshNode, InMemoryMeshNetwork, type MeshNetworkEvent } from './mesh.js';
import { MeshNode } from '../shared/types.js';

export async function startWebInterface(
  network: InMemoryMeshNetwork,
  nodes: DesktopMeshNode[],
  port = 3000,
) {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  const candidateClientPaths = [
    path.join(serverDir, 'client.js'),
    path.join(serverDir, '..', '..', 'src', 'desktop', 'client.js'),
  ];
  const clientFilePath = candidateClientPaths.find((filePath) => fs.existsSync(filePath)) ?? candidateClientPaths[0];

  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getHtml());
      return;
    }

    if (req.url === '/client.js') {
      try {
        const clientScript = fs.readFileSync(clientFilePath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end(clientScript);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Failed to load client.js');
      }
      return;
    }

    // simple JSON endpoint to list nodes (useful as a WS fallback)
    if (req.url === '/nodes') {
      try {
        const nodeList = nodes.map((n) => ({ id: n.id, name: n.name }));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ nodes: nodeList }));
        return;
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'failed' }));
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  });

  const wss = new WebSocketServer({ server });

  const sendToClients = (payload: unknown) => {
    const message = JSON.stringify(payload);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  };

  if (fs.existsSync(clientFilePath)) {
    fs.watch(clientFilePath, { persistent: false }, () => {
      console.log(`client.js changed, broadcasting reload`);
      sendToClients({ event: 'reload' });
    });
  }

  wss.on('connection', (socket: WebSocket) => {
    // Notify server logs and client about new connection
    // eslint-disable-next-line no-console
    console.log('WebSocket client connected');
    socket.send(JSON.stringify({ event: 'info', message: 'Connected to Mesh AI Collective interface' }));

    // Send current nodes list to client so UI can populate selects dynamically
    try {
      const nodeList = nodes.map((n) => ({ id: n.id, name: n.name }));
      socket.send(JSON.stringify({ event: 'nodes', nodes: nodeList }));
    } catch (e) {
      // ignore
    }

    socket.on('message', (data: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(data.toString()) as { type: 'send'; from: string; to: string; message: unknown };
        if (parsed.type === 'send') {
          const node = nodes.find((nodeItem) => nodeItem.id === parsed.from);
          if (!node) {
            socket.send(JSON.stringify({ event: 'error', message: `Node ${parsed.from} not found` }));
            return;
          }

          const messageType = parsed.to === 'assistant-node-04' ? 'assistant-query' : 'command';

          node.send({
            from: parsed.from,
            to: parsed.to,
            type: messageType,
            payload: parsed.message,
            timestamp: new Date().toISOString(),
          });

          socket.send(JSON.stringify({ event: 'sent', to: parsed.to, from: parsed.from }));
        }
      } catch (error) {
        socket.send(JSON.stringify({ event: 'error', message: 'Invalid message format' }));
      }
    });
  });

  network.on('message', (event: MeshNetworkEvent) => {
    if (event.message.type === 'assistant-response') {
      sendToClients({
        event: 'assistant-response',
        from: event.message.from,
        to: event.message.to,
        payload: event.message.payload,
      });
    }
    sendToClients({ event: 'network', payload: event });
  });

  server.listen(port, () => {
    // Log to console so it's visible when the server is ready
    // This helps diagnose connection refused errors
    // and confirms the port and host where the interface is available.
    // Listen on all interfaces by default (0.0.0.0) so localhost should work.
    // If you need a specific host, set it here.
    // Example: server.listen(port, '127.0.0.1')
    // For now we log when the server is ready.
    // eslint-disable-next-line no-console
    console.log(`Web interface listening on http://localhost:${port}`);
  });

  return server;
}

function getHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mesh AI Collective Interface</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; height: 100vh; }
    .panel { flex: 1; padding: 16px; box-sizing: border-box; }
    .panel:nth-child(1) { background: #f6f7fb; border-right: 1px solid #ddd; }
    textarea { width: 100%; height: 120px; margin-top: 8px; }
    button { margin-top: 8px; padding: 8px 12px; }
    .log { background: #111; color: #eee; padding: 12px; height: calc(100vh - 220px); overflow-y: auto; font-family: monospace; white-space: pre-wrap; }
    label { display: block; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>Mesh AI Collective</h1>
    <p>Use a interface para enviar comandos para nós.</p>
    <label>From node
      <select id="fromNode"></select>
    </label>
    <label>To node
      <select id="toNode"></select>
    </label>
    <label>Message
      <textarea id="message"></textarea>
    </label>
    <button id="sendButton">Send Message</button>
    <div style="margin-top: 16px;">
      <h3>Assistant Response</h3>
      <div id="assistantResponse" style="background:#fff;color:#000;padding:12px;border:1px solid #ccc;min-height:80px;white-space:pre-wrap;"></div>
    </div>
  </div>
  <div class="panel">
    <h2>Logs</h2>
    <div id="log" class="log"></div>
  </div>
  <script src="/client.js"></script>
</body>
</html>`;
}

function getClientScript() {
  return [
    "const ws = new WebSocket('ws://' + location.host);",
    "const logElement = document.getElementById('log');",
    "const assistantResponseElement = document.getElementById('assistantResponse');",
    "const fromNode = document.getElementById('fromNode');",
    "const toNode = document.getElementById('toNode');",
    "const messageInput = document.getElementById('message');",
    "const sendButton = document.getElementById('sendButton');",
    "",
    "function log(text) {",
    "  const tn = document.createTextNode(text);",
    "  logElement.appendChild(tn);",
    "  logElement.appendChild(document.createElement('br'));",
    "  logElement.scrollTop = logElement.scrollHeight;",
    "}",
    "",
    "ws.onopen = () => log('Connected to mesh interface');",
    "ws.onmessage = (event) => {",
    "  const data = JSON.parse(event.data);",
    "  if (data.event === 'info') {",
    "    log('[info] ' + data.message);",
    "  } else if (data.event === 'nodes') {",
    "    setNodeOptions(data.nodes || []);",
    "    log('[info] node list updated');",
    "  } else if (data.event === 'assistant-response') {",
    "    const payload = data.payload;",
    "    const responseText = typeof payload === 'object' ? JSON.stringify(payload) : payload;",
    "    const text = '[assistant] ' + data.from + ' -> ' + data.to + ': ' + responseText;",
    "    log(text);",
    "    assistantResponseElement.textContent = responseText;",
    "  } else if (data.event === 'network') {",
    "    log('[network] ' + JSON.stringify(data.payload));",
    "  } else if (data.event === 'sent') {",
    "    log('[sent] from ' + data.from + ' -> ' + data.to);",
    "  } else if (data.event === 'error') {",
    "    log('[error] ' + data.message);",
    "  }",
    "};",
    "",
    "ws.onclose = () => log('Disconnected from server');",
    "",
    "function setNodeOptions(nodes) {",
    "  fromNode.innerHTML = '';",
    "  toNode.innerHTML = '';",
    "  nodes.forEach((node) => {",
    "    const optionFrom = document.createElement('option');",
    "    optionFrom.value = node.id;",
    "    optionFrom.textContent = node.name;",
    "    fromNode.appendChild(optionFrom);",
    "",
    "    const optionTo = document.createElement('option');",
    "    optionTo.value = node.id;",
    "    optionTo.textContent = node.name;",
    "    toNode.appendChild(optionTo);",
    "  });",
    "}",
    "",
    "window.addEventListener('load', async () => {",
    "  setNodeOptions([]);",
    "  try {",
    "    const resp = await fetch('/nodes');",
    "    if (resp.ok) {",
    "      const body = await resp.json();",
    "      if (body && Array.isArray(body.nodes)) {",
    "        setNodeOptions(body.nodes);",
    "        log('[info] nodes loaded via HTTP fallback');",
    "      }",
    "    }",
    "  } catch (e) {",
    "    // ignore fetch errors",
    "  }",
    "});",
    "",
    "sendButton.onclick = () => {",
    "  ws.send(JSON.stringify({",
    "    type: 'send',",
    "    from: fromNode.value,",
    "    to: toNode.value,",
    "    message: messageInput.value,",
    "  }));",
    "  messageInput.value = '';",
    "};",
  ].join('\n');
}
