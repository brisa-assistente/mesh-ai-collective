let ws = null;
const logElement = document.getElementById('log');
const assistantResponseElement = document.getElementById('assistantResponse');
const fromNode = document.getElementById('fromNode');
const toNode = document.getElementById('toNode');
const messageInput = document.getElementById('message');
const messageTypeSelect = document.getElementById('messageType');
const sendButton = document.getElementById('sendButton');
const recordButton = document.getElementById('recordButton');
const stopButton = document.getElementById('stopButton');

let mediaRecorder = null;
let recordedChunks = [];
let pendingAudioPayload = null;
let reconnectTimer = null;

function connectSocket() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  ws = new WebSocket('ws://' + location.host);

  ws.onopen = () => {
    log('Connected to mesh interface');
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

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
      const ev = data.payload;
      if (ev && ev.event === 'leader-elected') {
        const leaderEl = document.getElementById('leader');
        if (leaderEl) leaderEl.textContent = ev.leaderId;
        log('[leader] elected ' + ev.leaderId);
      } else if (ev && ev.event === 'leader-lost') {
        const leaderEl = document.getElementById('leader');
        if (leaderEl) leaderEl.textContent = '';
        log('[leader] lost ' + ev.leaderId);
      } else {
        log('[network] ' + JSON.stringify(ev));
      }
    } else if (data.event === 'sent') {
      log('[sent] from ' + data.from + ' -> ' + data.to);
    } else if (data.event === 'error') {
      log('[error] ' + data.message);
    }
  };

  ws.onclose = () => {
    log('Disconnected from server');
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectSocket();
      }, 1000);
    }
  };
}

function log(text) {
  const tn = document.createTextNode(text);
  logElement.appendChild(tn);
  logElement.appendChild(document.createElement('br'));
  logElement.scrollTop = logElement.scrollHeight;
}

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
  connectSocket();

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

recordButton.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recordedChunks = [];
    mediaRecorder = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'audio/webm' });
      const dataUrl = await blobToBase64(blob);
      pendingAudioPayload = {
        mime: blob.type || 'audio/webm',
        data: dataUrl,
      };
      log('[audio] gravação concluída');
      stopButton.disabled = true;
      recordButton.disabled = false;
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.start();
    stopButton.disabled = false;
    recordButton.disabled = true;
    log('[audio] gravação iniciada');
  } catch (error) {
    log('[error] microfone indisponível: ' + String(error));
  }
};

stopButton.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
};

sendButton.onclick = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    log('[error] websocket não está pronto; aguarde a reconexão');
    return;
  }

  const selectedType = messageTypeSelect?.value || 'command';

  if (selectedType === 'assistant-audio-query') {
    if (!pendingAudioPayload) {
      log('[error] grave um áudio antes de enviar uma consulta de áudio');
      return;
    }

    ws.send(JSON.stringify({
      type: 'send',
      from: fromNode.value,
      to: toNode.value,
      message: pendingAudioPayload,
      messageType: selectedType,
    }));
    pendingAudioPayload = null;
    messageInput.value = '';
    return;
  }

  ws.send(JSON.stringify({
    type: 'send',
    from: fromNode.value,
    to: toNode.value,
    message: messageInput.value,
    messageType: selectedType,
  }));
  messageInput.value = '';

  if (selectedType === 'assistant-query') {
    assistantResponseElement.textContent = 'Aguardando resposta da assistente...';
  }
};

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
