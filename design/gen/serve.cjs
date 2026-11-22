const http=require('http'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','static');
http.createServer((q,s)=>{const f=path.join(dir,path.basename(decodeURIComponent(q.url.split('?')[0]))||'np.html');fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end()}s.writeHead(200,{'content-type':'text/html; charset=utf-8'});s.end(d)})}).listen(5299);
