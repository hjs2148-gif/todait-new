const fs=require("fs"),path=require("path");const root=path.join(__dirname,"..");
const src=fs.readFileSync(path.join(root,"gen/np.mjs"),"utf8");
const pal=(k)=>{const m=src.match(new RegExp(k+": \{([^}]*)\}"));return Object.fromEntries([...m[1].matchAll(/(\w+): '([^']*)'/g)].map(x=>[x[1],x[2]]))};
const names=(process.argv[2]||"").split(",");
for(const [f,k] of [["np.html","light"],["npd.html","dark"]]){const vars=Object.entries(pal(k)).map(([a,b])=>`--${a}:${b};`).join(" ");
let all='<!doctype html><meta charset=utf-8><body style="margin:0;display:flex;gap:20px;align-items:flex-start;background:#777">';
for(const n of names){const h=fs.readFileSync(path.join(root,"np/project",n+".dc.html"),"utf8");
all+=`<div><style>${h.match(/<style>([\s\S]*?)<\/style>/)[1].replace("body{margin:0}","")}</style>${h.match(/<x-dc>[\s\S]*?<\/helmet>([\s\S]*?)<\/x-dc>/)[1].replace("{{vars}}",vars)}</div>`}
fs.writeFileSync(path.join(root,"static",f),all)}
