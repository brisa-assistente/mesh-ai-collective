const http = require('http');
const url = 'http://localhost:3000/client.js';
http.get(url, (res) => {
  let d = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => d += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('LENGTH', d.length);
    console.log('JSON', JSON.stringify(d.slice(0, 300)));
    const bad = d.split('\n').map((line, index) => ({ index: index + 1, line }));
    console.log('LAST LINES');
    bad.slice(-15).forEach((l) => console.log(l.index + ': ' + JSON.stringify(l.line)));
    try {
      new Function(d);
      console.log('PARSE OK');
    } catch (err) {
      console.error('PARSE FAIL', err.message);
      console.error('ERR STACK', err.stack);
    }
  });
}).on('error', (e) => {
  console.error('REQUEST ERROR', e.message);
});
