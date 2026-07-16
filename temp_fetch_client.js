const http = require('http');
const url = 'http://localhost:3000/client.js';
const req = http.get(url, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('HEADERS', res.headers['content-type']);
    console.log('BODY START');
    console.log(body.slice(0, 2000));
    console.log('BODY END');
    try {
      new Function(body);
      console.log('JS parse ok');
    } catch (err) {
      console.error('PARSE ERROR', err.message);
      console.error(err.stack);
      const pos = err.message.match(/\((\d+):(\d+)\)/);
      if (pos) {
        const line = parseInt(pos[1], 10);
        const col = parseInt(pos[2], 10);
        console.error('LINE', line, 'COL', col);
      }
    }
  });
});
req.on('error', (e) => { console.error('REQUEST ERROR', e); });
