import http from 'node:http';
const url = 'http://localhost:3000/client.js';
http.get(url, res => {
  let d=''; res.setEncoding('utf8'); res.on('data', c=>d+=c); res.on('end', ()=>{
    console.log('LEN', d.length);
    // find pattern: single-quote (39) then LF(10) then single-quote (39)
    for(let i=0;i<d.length-2;i++){
      if(d.charCodeAt(i)===39 && d.charCodeAt(i+1)===10 && d.charCodeAt(i+2)===39){
        console.log('FOUND quote-LF-quote at', i);
        console.log('context', JSON.stringify(d.slice(Math.max(0,i-20), i+20)));
        break;
      }
    }
    // find any char code >127
    for(let i=0;i<d.length;i++){ if(d.charCodeAt(i)>127){ console.log('NONASCII at',i,d.charCodeAt(i)); break; }}
    // show JSON for entire string start to see escapes
    console.log('JSON START');
    console.log(JSON.stringify(d.slice(0,400)));
    console.log('JSON END');
  });
}).on('error', e=>console.error(e));
