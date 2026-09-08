const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const source=readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function game(){
 const noop=()=>{};
 const gradient={addColorStop:noop};
 const ctx=new Proxy({measureText:t=>({width:t.length*6}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||noop});
 const sandbox={document:{getElementById:()=>({getContext:()=>ctx,addEventListener:noop,style:{}})},Image:class{},addEventListener:noop,requestAnimationFrame:noop,performance:{now:()=>0},location:{search:''},setTimeout:noop,window:{},Math,assert};
 vm.createContext(sandbox);vm.runInContext(source+'\nAUDIO_MUTED=true;',sandbox);
 return code=>vm.runInContext(code,sandbox);
}
test('ground missile acquisition and impact use ground altitude',()=>game()(`
 const u=spawnUnit(-1,'TANK');u.x=450;
 assert.equal(nearestGroundTarget(300,400,1,500),u);
 assert.equal(nearestGroundTarget(300,400,1,50),null);
 G.missiles.push(mkMissile(u.x,GROUND-10,u,1));updateProjectiles(.016);
 assert.equal(G.missiles.length,0);assert.ok(u.hp<u.maxhp);
`));
test('flare remains a valid missile target until it expires',()=>game()(`
 const p=G.helis[0];const f={x:p.x+100,y:p.y,life:1};G.flares.push(f);
 const m=mkMissile(p.x+300,p.y,p,-1);G.missiles.push(m);updateProjectiles(.016);
 assert.equal(m.target,f);updateProjectiles(.016);assert.equal(m.target,f);
 G.flares=[];updateProjectiles(.016);assert.equal(m.target,null);
`));
test('fuel burns in flight, refills at HQ, and engine-out prevents lift',()=>game()(`
 const p=G.helis[0];update(.1);assert.ok(p.fuel<100);
 p.x=PLAYER_X;p.y=GROUND-20;p.fuel=10;update(.1);assert.ok(p.fuel>10);assert.ok(p.rearming);
 p.fuel=0;p.vy=0;keys.KeyW=true;updatePlayerHeli(p,.1);assert.equal(p.vy,0);
`));
test('respawn restores fuel, flares and weapon readiness',()=>game()(`
 const p=G.helis[0];Object.assign(p,{dead:true,respawn:0,fuel:0,flares:0,cdMis:5});update(.016);
 assert.equal(p.dead,false);assert.equal(p.fuel,100);assert.equal(p.flares,3);assert.equal(p.cdMis,0);
`));
test('radar holds scan and flight input resumes tracking',()=>game()(`
 G.state='play';handleCanvasClick(1100,40);const scan=G.camX;update(.1);
 assert.equal(G.camX,scan);keys.KeyD=true;update(.1);assert.equal(G.scanTimer,0);assert.notEqual(G.camX,scan);
`));
test('cargo boarding and dropping preserve troops',()=>game()(`
 const p=G.helis[0];p.y=GROUND-30;
 for(let i=0;i<4;i++){const u=spawnUnit(1,'INF');u.x=p.x+i*10;}
 troopTransfer(p);assert.equal(p.cargo,4);assert.equal(G.units.length,0);
 troopTransfer(p);assert.equal(p.cargo,0);assert.equal(G.units.length,4);
`));
test('render supports normal, caution, service, pause and dead states',()=>game()(`
 G.state='play';render();G.helis[0].fuel=10;render();G.helis[0].hp=20;render();
 G.helis[0].rearming=true;render();G.paused=true;render();G.paused=false;
 G.helis[0].dead=true;render();G.state='over';render();
`));
test('engine-out landing costs a life, while landing at HQ recovers',()=>game()(`
 const p=G.helis[0];p.x=1000;p.y=GROUND-16;p.fuel=0;update(.016);
 assert.equal(p.dead,true);assert.equal(G.lives,2);
 newGame();const q=G.helis[0];q.x=PLAYER_X;q.y=GROUND-16;q.fuel=0;update(.016);
 assert.equal(q.dead,false);assert.ok(q.fuel>0);
`));
test('caution thresholds and death suppression',()=>game()(`
 let calls=0;SFX.caution=()=>calls++;const p=G.helis[0];
 p.hp=25;p.fuel=20;update(0);assert.equal(calls,0);
 p.hp=24;update(.3);assert.equal(calls,1);
 p.hp=100;p.fuel=10;G.cautionTimer=.9;update(.2);assert.equal(calls,2);
 p.dead=true;p.respawn=3;G.cautionTimer=.9;update(.2);assert.equal(calls,2);
`));
