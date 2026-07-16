import http from 'node:http';
const url = 'http://localhost:3000/client.js';
http.get(url, res => {
  let d = '';
  res.setEncoding('utf8');
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('LENGTH', d.length);
    console.log('INDEX_BACKSLASH_N', d.indexOf('\\n'));
    console.log('INDEX_QUOTE_LF_QUOTE', d.indexOf('\' + String.fromCharCode(10) + '\''));
    const idx = d.indexOf('\\n');
    if (idx>=0) console.log('AROUND\\n', JSON.stringify(d.slice(idx-20, idx+20)));
    const qlf = d.indexOf('\' + String.fromCharCode(10) + '\'');
    if (qlf>=0) console.log('AROUND_QUOTE_LF_QUOTE', JSON.stringify(d.slice(qlf-20, qlf+20)));
  });
}).on('error', e => console.error('ERR', e.message));
