const http = require('http');
const url = 'http://localhost:3000';
http.get(url, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const match = data.match(/<script>([\s\S]*)<\/script>/);
    console.log('match', !!match);
    if (!match) {
      console.log('no script tag found');
      console.log(data.slice(0, 1000));
      process.exit(1);
    }
    const script = match[1];
    console.log('script len', script.length);
    console.log(script.slice(0, 2000));
    try {
      new Function(script);
      console.log('parse ok');
    } catch (err) {
      console.error('syntax error', err.message);
      console.error(err.stack);
      const idx = err.loc && err.loc.column ? err.loc.column : null;
      if (idx !== null) {
        console.error('around', script.slice(Math.max(0, idx - 40), idx + 40));
      }
    }
  });
}).on('error', (e) => {
  console.error('request error', e.message);
});
