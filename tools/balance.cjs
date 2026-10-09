// Headless balance baseline: plays whole sorties without rendering and reports how they end.
// Usage: node tools/balance.cjs [seconds=900] [runs=2]   (a full run takes a minute or two)
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const root=__dirname+'/../';
const source=readFileSync(root+'index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1]+'\n'+readFileSync(root+'experience.js','utf8')+'\n'+readFileSync(root+'operations.js','utf8');
function game(){
 const noop=()=>{},gradient={addColorStop:noop};
 const ctx=new Proxy({measureText:t=>({width:t.length*6}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||noop});
 const sandbox={localStorage:{getItem:()=>null,setItem:noop},document:{getElementById:()=>({getContext:()=>ctx,addEventListener:noop,style:{}})},Image:class{},addEventListener:noop,requestAnimationFrame:noop,performance:{now:()=>0},location:{search:''},setTimeout:noop,window:{},Math};
 vm.createContext(sandbox);vm.runInContext(source+'\nAUDIO_MUTED=true;',sandbox);
 return code=>vm.runInContext(code,sandbox);
}
// The helicopter is removed so results isolate the ground war: "idle" buys nothing, "army" keeps a standard convoy on order.
const SORTIE=`(function(difficulty,policy,limit){
 SETTINGS.difficulty=difficulty;newGame();G.state='play';G.lives=99;G.helis[0].dead=true;G.helis[0].respawn=1e9;
 let buyIn=0,enemyVan=null;
 while(G.state==='play'&&G.time<limit){
  if(policy==='army'&&(buyIn-=1/60)<=0){buyIn=2;
   const count=type=>G.units.filter(u=>u.side===1&&u.type===type).length;
   const want=count('TANK')<1?'TANK':count('AA')<1?'AA':count('INF')<3?'INF':!count('VAN')?'VAN':count('TANK')<3?'TANK':'INF';
   if(G.funds>=UT[want].cost)buy(1,want);
  }
  aiTick(1/60);update(1/60);
  if(enemyVan===null&&G.units.some(u=>u.side===-1&&u.type==='VAN'))enemyVan=Math.round(G.time);
 }
 return {result:G.state==='play'?'undecided':G.state==='win'?'win':'loss',seconds:Math.round(G.time),enemyVan,bunkers:G.bunkers.filter(b=>b.owner===1).length};
})`;
const limit=Number(process.argv[2])||900,runs=Number(process.argv[3])||2;
console.log(`difficulty policy  ${runs} runs, ${limit}s limit  ->  result@seconds (bunkers held)`);
for(const difficulty of ['recruit','normal','veteran'])for(const policy of ['idle','army']){
 const results=[];
 for(let i=0;i<runs;i++){const r=game()(`${SORTIE}('${difficulty}','${policy}',${limit})`);results.push(`${r.result}@${r.seconds}(${r.bunkers})`);}
 console.log(difficulty.padEnd(10),policy.padEnd(6),results.join('  '));
}
