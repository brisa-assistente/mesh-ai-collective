const ws = new WebSocket('ws://' + location.host);
const logElement = document.getElementById('log');
const assistantResponseElement = document.getElementById('assistantResponse');
const fromNode = document.getElementById('fromNode');
const toNode = document.getElementById('toNode');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('sendButton');

function log(text) {
  const tn = document.createTextNode(text);
  logElement.appendChild(tn);
  logElement.appendChild(document.createElement('br'));
  logElement.scrollTop = logElement.scrollHeight;
}

ws.onopen = () => log('Connected to mesh interface');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'reload') {
    log('[info] client script updated, reloading page');
    window.location.reload();
    return;
  }
  if (data.event === 'info') {
    log('[info] ' + data.message);
  } else if (data.event === 'nodes') {
    setNodeOptions(data.nodes || []);
    log('[info] node list updated');
  } else if (data.event === 'assistant-response') {
    const payload = data.payload;
    const responseText = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    const text = '[assistant] ' + data.from + ' -> ' + data.to + ': ' + responseText;
    log(text);
    assistantResponseElement.textContent = responseText;
  } else if (data.event === 'network') {
    log('[network] ' + JSON.stringify(data.payload));
  } else if (data.event === 'sent') {
    log('[sent] from ' + data.from + ' -> ' + data.to);
  } else if (data.event === 'error') {
    log('[error] ' + data.message);
  }
};

ws.onclose = () => log('Disconnected from server');

function setNodeOptions(nodes) {
  fromNode.innerHTML = '';
  toNode.innerHTML = '';
  nodes.forEach((node) => {
    const optionFrom = document.createElement('option');
    optionFrom.value = node.id;
    optionFrom.textContent = node.name;
    fromNode.appendChild(optionFrom);

    const optionTo = document.createElement('option');
    optionTo.value = node.id;
    optionTo.textContent = node.name;
    toNode.appendChild(optionTo);
  });
}

window.addEventListener('load', async () => {
  setNodeOptions([]);
  try {
    const resp = await fetch('/nodes');
    if (resp.ok) {
      const body = await resp.json();
      if (body && Array.isArray(body.nodes)) {
        setNodeOptions(body.nodes);
        log('[info] nodes loaded via HTTP fallback');
      }
    }
  } catch (e) {
    // ignore fetch errors
  }
});

sendButton.onclick = () => {
  ws.send(JSON.stringify({
    type: 'send',
    from: fromNode.value,
    to: toNode.value,
    message: messageInput.value,
  }));
  messageInput.value = '';
};
