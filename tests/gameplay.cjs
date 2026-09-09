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
 p.fuel=0;p.reserve=0;p.vy=0;keys.KeyW=true;updatePlayerHeli(p,.1);assert.equal(p.vy,0);
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
 const p=G.helis[0];p.x=1000;p.y=GROUND-16;p.fuel=0;p.reserve=0;update(.016);
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
test('friendly forward pad refuels and caps repairs without granting ammo',()=>game()(`
 const p=G.helis[0],b=G.bunkers[0];b.owner=1;
 Object.assign(p,{x:forwardPadX(b),y:GROUND-30,vx:0,vy:0,hp:74,fuel:10,bombs:1,mis:0,flares:0});
 update(.5);assert.equal(p.service,'forward');assert.equal(p.hp,75);assert.ok(p.fuel>10);
 assert.equal(p.bombs,1);assert.equal(p.mis,0);assert.equal(p.flares,0);
 p.hp=90;update(.1);assert.equal(p.hp,90);
 b.owner=-1;update(.1);assert.equal(p.service,null);
`));
test('forward service requires a friendly pad, low altitude and slow flight',()=>game()(`
 const p=G.helis[0],b=G.bunkers[0];b.owner=1;p.x=forwardPadX(b);p.y=GROUND-30;
 p.vx=100;assert.equal(serviceAt(p),null);p.vx=0;p.vy=80;assert.equal(serviceAt(p),null);
 p.vy=0;p.y=300;assert.equal(serviceAt(p),null);p.y=GROUND-30;
 assert.equal(serviceAt(p).kind,'forward');b.owner=0;assert.equal(serviceAt(p),null);
`));
test('capture activates forward service and saves an engine-out landing',()=>game()(`
 const b=G.bunkers[0],p=G.helis[0];
 for(let i=0;i<3;i++){const u=spawnUnit(1,'INF');u.x=b.x;}
 updateCapture(.1);assert.equal(b.owner,1);
 p.x=forwardPadX(b);p.y=GROUND-16;p.fuel=0;p.reserve=0;update(.016);
 assert.equal(p.dead,false);assert.ok(p.fuel>0);assert.equal(p.service,'forward');
`));
test('ballistic estimate matches live integration at different frame rates',()=>game()(`
 for(const dt of [1/30,1/60,1/144])for(const vx of [-210,0,210])for(const vy of [-180,100]){
   const b={x:1000,y:300,vx,vy},expected=bombPosition(b,bombGroundTime(b));
   let landed=false;for(let i=0;i<2000&&!landed;i++)landed=stepBomb(b,dt);
   assert.ok(landed);assert.ok(Math.abs(b.x-expected.x)<.001);assert.ok(Math.abs(b.y-(GROUND-6))<.001);
 }
`));
test('hold B previews, release drops once, Escape and pause cancel',()=>game()(`
 ac=()=>{};G.state='play';const p=G.helis[0];
 onKey('KeyB');assert.equal(G.bombAiming,true);assert.equal(G.bombs.length,0);
 render();onKeyUp('KeyB');assert.equal(G.bombs.length,1);assert.equal(p.bombs,7);
 onKeyUp('KeyB');assert.equal(G.bombs.length,1);
 p.cdBomb=0;onKey('KeyB');onKey('Escape');onKeyUp('KeyB');assert.equal(G.bombs.length,1);
 onKey('KeyB');onKey('KeyP');onKeyUp('KeyB');assert.equal(G.bombs.length,1);
 G.paused=false;p.bombs=0;onKey('KeyB');assert.equal(G.bombAiming,false);
`));
test('wreckage is bounded and terrain emits distinct wash particles',()=>game()(`
 let dirt,grass;for(let x=0;x<WORLD;x+=320){if(terrainAt(x)==='grass')grass=x;else dirt=x;}
 assert.notEqual(dirt,undefined);assert.notEqual(grass,undefined);
 emitGroundWash(dirt,1);assert.equal(G.parts.at(-1).streak,false);
 emitGroundWash(grass,1);assert.equal(G.parts.at(-1).streak,true);
 for(let i=0;i<30;i++)killUnit(spawnUnit(-1,'TANK'));
 assert.equal(G.wrecks.length,24);render();
 for(const w of G.wrecks)w.life=.01;update(.1);assert.equal(G.wrecks.length,0);
`));
test('AA acquires an aircraft using its ground altitude',()=>game()(`
 const aa=spawnUnit(1,'AA');aa.x=500;aa.cd=0;
 Object.assign(G.helis[1],{x:800,y:300});updateUnits(.016);
 assert.equal(G.missiles.length,1);assert.equal(G.missiles[0].target,G.helis[1]);
`));
test('live bomb lands at the displayed ground estimate and consumes itself',()=>game()(`
 const p=G.helis[0];Object.assign(p,{x:1000,y:250,vx:160,vy:-30});
 const bomb=bombFromHeli(p),expected=bombPosition(bomb,bombGroundTime(bomb));
 G.bombs.push(bomb);
 for(let i=0;i<500&&G.bombs.length;i++)updateProjectiles(1/60);
 assert.equal(G.bombs.length,0);assert.ok(Math.abs(G.decals.at(-1).x-expected.x)<.001);
`));
test('emergency reserve provides temporary lift and resets only after sufficient refueling',()=>game()(`
 const p=G.helis[0];p.x=1000;p.fuel=0;p.reserve=20;keys.KeyW=true;update(.1);
 assert.ok(p.vy<0);assert.ok(p.reserve<20);assert.equal(p.dead,false);
 keys.KeyW=false;p.reserve=.01;update(.1);assert.equal(p.reserve,0);
 p.vy=0;keys.KeyW=true;updatePlayerHeli(p,.1);assert.equal(p.vy,0);keys.KeyW=false;
 p.x=PLAYER_X;p.y=GROUND-20;p.vy=0;p.fuel=0;p.reserve=3;update(1);
 assert.equal(p.reserve,3);update(1);assert.equal(p.reserve,RESERVE_SECONDS);
`));
test('difficulty changes starting funds, incoming damage and deployment cadence',()=>game()(`
 for(const id of ['recruit','normal','veteran']){
   SETTINGS.difficulty=id;newGame();assert.equal(G.funds,DIFFICULTIES[id].funds);
   const p=G.helis[0];hurtHeli(p,10,{x:p.x-100,y:p.y});
   assert.equal(p.hp,100-10*DIFFICULTIES[id].damage);
   let calls=0;aiDecide=()=>calls++;aiTick(DIFFICULTIES[id].interval-.1);assert.equal(calls,0);
   aiTick(.11);assert.equal(calls,1);
 }
`));
test('damage indicators identify each direction and fade',()=>game()(`
 const p=G.helis[0];
 for(const [edge,dx,dy] of [['left',-100,0],['right',100,0],['top',0,-100],['bottom',0,100]]){
   hurtHeli(p,1,{x:p.x+dx,y:p.y+dy});assert.equal(G.damageEdges[edge],.65);
 }
 update(.7);for(const time of Object.values(G.damageEdges))assert.equal(time,0);
`));
test('van estimate uses the breach line and warns only on escalating thresholds',()=>game()(`
 let alarms=0;SFX.alarm=()=>alarms++;
 const v=spawnUnit(-1,'VAN');v.x=PLAYER_X+70+UT.VAN.spd*40;
 assert.equal(vanThreat().seconds,40);assert.equal(formatETA(40),'0:40');update(.01);assert.equal(alarms,0);
 v.x=PLAYER_X+70+UT.VAN.spd*25;update(.01);assert.equal(alarms,1);update(.01);assert.equal(alarms,1);
 v.x=PLAYER_X+70+UT.VAN.spd*10;update(.01);assert.equal(alarms,2);
`));
test('training completes flight, bomb impact, boarding and bunker capture',()=>game()(`
 ac=()=>{};startTutorial();const p=G.helis[0];
 aiDecide();assert.equal(G.units.length,0);assert.equal(G.helis[1].dead,true);
 p.x=510;updateTutorial();assert.equal(G.tutorial.step,1);
 onKey('KeyB');onKeyUp('KeyB');for(let i=0;i<400&&G.bombs.length;i++)updateProjectiles(1/60);
 updateTutorial();assert.equal(G.tutorial.step,2);assert.equal(G.units.length,3);
 const x=G.units[0].x;updateUnits(1);assert.equal(G.units[0].x,x);
 p.y=GROUND-30;troopTransfer(p);updateTutorial();assert.equal(G.tutorial.step,3);
 p.x=G.bunkers[0].x;troopTransfer(p);updateCapture(.1);updateTutorial();assert.equal(G.state,'win');
 newGame();assert.equal(G.tutorial,null);assert.equal(G.helis[1].dead,false);
`));
test('cables become urgent only near the player and routine messages are tagged',()=>game()(`
 const b=G.bunkers[0],p=G.helis[0];assert.equal(cableIsUrgent(b),false);
 p.x=b.x;p.y=400;assert.equal(cableIsUrgent(b),true);b.owner=1;assert.equal(cableIsUrgent(b),false);
 buy(1,'INF');assert.equal(G.msgs[0].kind,'routine');
`));
test('training restarts after a helicopter loss rather than losing required cargo forever',()=>game()(`
 startTutorial();G.tutorial.step=3;const p=G.helis[0];p.cargo=3;hurtHeli(p,100);
 p.respawn=0;update(.016);assert.equal(G.tutorial.step,0);assert.equal(G.helis[0].dead,false);
`));
test('engineers capture, repair, and rebuild turrets while enemy troops contest',()=>game()(`
 const t=G.turrets[0],e=spawnUnit(1,'ENG');e.x=t.x;
 const enemy=spawnUnit(-1,'INF');enemy.x=t.x;
 engineerWork(e,4);assert.equal(t.side,0);killUnit(enemy);
 engineerWork(e,3);assert.equal(t.side,1);assert.equal(t.hp,30);
 engineerWork(e,4);assert.equal(t.hp,100);
 hurtEmplacement(t,100);assert.equal(t.side,0);assert.equal(t.hp,0);
 engineerWork(e,3);assert.equal(t.side,1);assert.equal(t.hp,30);
`));
test('garrison damage neutralizes service; infantry capture and replenish defenders',()=>game()(`
 const b=G.bunkers[0];hurtEmplacement(b,35);assert.equal(b.garrison,2);
 const e=spawnUnit(-1,'INF');e.x=b.x;updateCapture(.1);
 assert.equal(b.garrison,3);assert.ok(!G.units.includes(e));
 hurtEmplacement(b,100);assert.equal(b.owner,0);assert.equal(b.garrison,0);assert.ok(b.balloonDead);
 for(let i=0;i<3;i++){const u=spawnUnit(1,'INF');u.x=b.x;}
 updateCapture(.1);assert.equal(b.owner,1);assert.equal(b.garrison,3);assert.equal(b.hp,90);
 hurtEmplacement(b,40);const eng=spawnUnit(1,'ENG');eng.x=b.x;engineerWork(eng,1);assert.equal(b.hp,62);
`));
test('turrets engage aircraft, bunkers spare tanks and explosions destroy defenses',()=>game()(`
 const t=G.turrets[0];Object.assign(t,{side:1,hp:100});
 Object.assign(G.helis[1],{x:t.x+100,y:400});updateEmplacements(.1);assert.ok(G.bullets.length);
 G.bullets=[];const b=G.bunkers[0];b.cd=0;const tank=spawnUnit(1,'TANK');tank.x=b.x-100;
 t.hp=0;updateEmplacements(.1);assert.equal(G.bullets.length,0);
 const inf=spawnUnit(1,'INF');inf.x=b.x-100;updateEmplacements(.1);assert.ok(G.bullets.length);
 explode(b.x,b.y,78,100,1);assert.equal(b.garrison,0);
`));
test('airlifting preserves engineer role and health; parachutes land exactly once',()=>game()(`
 const p=G.helis[0];p.y=GROUND-30;const e=spawnUnit(1,'ENG');e.x=p.x;e.hp=15;
 troopTransfer(p);assert.equal(p.cargo,1);p.y=300;troopTransfer(p);
 assert.equal(p.cargo,0);assert.equal(G.paratroopers.length,1);assert.equal(G.units.length,0);
 const u=G.paratroopers[0];const x=u.x;updateEmplacements(1);assert.ok(u.x>x);
 updateEmplacements(10);assert.equal(G.paratroopers.length,0);assert.equal(G.units.length,1);
 assert.equal(u.type,'ENG');assert.equal(u.hp,15);updateEmplacements(1);assert.equal(G.units.length,1);
`));
test('Van jamming follows range, allegiance, destruction and helicopter death',()=>game()(`
 const p=G.helis[0],v=spawnUnit(-1,'VAN');v.x=p.x+1099;assert.equal(radarJammed(),true);
 render();v.x=p.x+1101;assert.equal(radarJammed(),false);
 v.x=p.x;v.side=1;assert.equal(radarJammed(),false);v.side=-1;
 p.dead=true;assert.equal(radarJammed(),false);p.dead=false;killUnit(v);assert.equal(radarJammed(),false);
`));
test('new defenses, airborne passengers and engineer dock render together',()=>game()(`
 G.state='play';G.camX=1000;const p=G.helis[0];p.x=1300;p.cargo=1;troopTransfer(p);
 const e=spawnUnit(1,'ENG');e.x=1300;e.work=1.5;
 Object.assign(G.turrets[0],{side:1,hp:50});render();
 assert.ok(G.buttons.some(b=>b.id==='buy_ENG'));
 startTutorial();assert.equal(G.turrets.length,0);
`));
test('neutralized bunker balloon stays disabled until infantry recapture',()=>game()(`
 const b=G.bunkers[0];hurtEmplacement(b,100);update(1);
 assert.equal(b.owner,0);assert.equal(b.balloonDead,true);
`));
test('missiles track emplacements and gunfire can hit descending troops',()=>game()(`
 const t=G.turrets[0];t.side=-1;t.hp=100;
 G.missiles.push(mkMissile(t.x,t.y,t,1));updateProjectiles(.016);assert.ok(t.hp<100);
 const u=spawnUnit(-1,'INF');G.units.splice(G.units.indexOf(u),1);u.y=300;G.paratroopers.push(u);
 G.bullets.push({x:u.x,y:300,vx:0,vy:0,life:1,side:1,dmg:30});updateProjectiles(.016);
 assert.equal(G.paratroopers.length,0);
`));
