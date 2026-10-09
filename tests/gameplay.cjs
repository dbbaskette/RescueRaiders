const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const source=readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1]+'\n'+readFileSync('experience.js','utf8')+'\n'+readFileSync('operations.js','utf8');
function game(options={}){
 let stored=options.stored??null;
 const localStorage={getItem:()=>{if(options.blocked)throw Error("blocked");return stored;},setItem:(key,value)=>{if(options.blocked)throw Error("quota");stored=value;}};
 const noop=()=>{};
 const gradient={addColorStop:noop};
 const ctx=new Proxy({measureText:t=>({width:t.length*6}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||noop});
 const sandbox={localStorage,readSaved:()=>JSON.parse(stored),document:{getElementById:()=>({getContext:()=>ctx,addEventListener:noop,style:{}})},Image:class{},addEventListener:noop,requestAnimationFrame:noop,performance:{now:()=>0},location:{search:''},setTimeout:noop,window:{},Math,assert};
 vm.createContext(sandbox);vm.runInContext(source+'\nAUDIO_MUTED=true;ac=()=>({state:"running"});',sandbox);
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
 assert.equal(p.dead,false);assert.equal(p.fuel,100);assert.equal(p.flares,FLARES);assert.equal(p.cdMis,0);
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
test('visual aircraft pitch smooths consistently across simulation rates',()=>game()(`
 const a=mkHeli(1),b=mkHeli(1);a.vx=b.vx=180;
 for(let i=0;i<30;i++)updateAirframe(a,1/30);
 for(let i=0;i<144;i++)updateAirframe(b,1/144);
 assert.ok(Math.abs(a.pitch-b.pitch)<1e-10);assert.ok(a.pitch>0&&a.pitch<.23);
 const before=a.pitch;updateAirframe(a,0);assert.equal(a.pitch,before);
 a.vx=-100;updateAirframe(a,1);assert.ok(a.pitch<0);
`));
test('rotors wind down on fuel exhaustion and stop after landing',()=>game()(`
 const h=mkHeli(1);h.fuel=0;h.reserve=0;updateAirframe(h,2);
 assert.ok(h.rotorSpeed<1&&h.rotorSpeed>.48);assert.ok(h.rotorPhase>=0&&h.rotorPhase<Math.PI*2);
 h.y=GROUND-16;updateAirframe(h,5);assert.ok(h.rotorSpeed<.001);
 h.fuel=20;updateAirframe(h,2);assert.ok(h.rotorSpeed>.9);
`));
test('shadow projection softens with altitude and remains finite on landing',()=>game()(`
 const near=shadowGeometry(10,130),high=shadowGeometry(300,130),ground=shadowGeometry(-1,130);
 assert.ok(high.radius>near.radius);assert.ok(high.height>near.height);
 assert.ok(high.opacity<near.opacity);assert.ok(high.offset<near.offset);
 assert.equal(Math.abs(ground.offset),0);assert.ok(ground.radius>0);
`));
test('paratrooper drag converges across frame rates and retains deployment momentum',()=>game()(`
 const a={x:2000,y:150,vx:100,vy:30,chuteAge:0},b={...a};
 for(let i=0;i<60;i++)stepParatrooper(a,1/30);
 for(let i=0;i<288;i++)stepParatrooper(b,1/144);
 assert.ok(a.x>2000);assert.ok(a.vx<100);assert.ok(a.vy>40&&a.vy<70);
 assert.ok(Math.abs(a.x-b.x)<.5);assert.ok(Math.abs(a.y-b.y)<2);
`));
test('parachute landing preserves troops, briefly settles and bounds discarded cloth',()=>game()(`
 G.turrets=[];G.bunkers=[];
 for(let i=0;i<30;i++){const u=spawnUnit(1,'INF');G.units.splice(G.units.indexOf(u),1);Object.assign(u,{y:GROUND-1,vx:0,vy:55,chuteAge:1});G.paratroopers.push(u);}
 updateEmplacements(.1);assert.equal(G.paratroopers.length,0);assert.equal(G.units.length,30);assert.equal(G.canopies.length,24);
 const u=G.units[0],x=u.x;updateUnits(.1);assert.equal(u.x,x);assert.ok(u.landing>0);
 updateEmplacements(8);assert.equal(G.canopies.length,0);
`));
test('ground gait stops while blocked and firing no longer uses damage flash',()=>game()(`
 G.turrets=[];G.bunkers=[];const tank=spawnUnit(1,'TANK'),enemy=spawnUnit(-1,'TANK');
 tank.x=500;enemy.x=700;tank.cd=0;const phase=tank.phase;updateUnits(.02);
 assert.equal(tank.phase,phase);assert.ok(tank.fireFlash>0);assert.equal(tank.flash,0);
 G.units=[tank];updateUnits(.1);assert.ok(tank.phase>phase);assert.equal(tank.moving,true);
`));
test('sound perspective pans to action and attenuates distant sources',()=>game()(`
 G.camX=1000;const center=soundPerspective(1640),left=soundPerspective(1100),right=soundPerspective(2180),far=soundPerspective(8000);
 assert.equal(center.pan,0);assert.equal(center.gain,1);assert.ok(left.pan<0&&right.pan>0);
 assert.equal(left.gain,right.gain);assert.ok(far.gain<left.gain);assert.ok(far.cutoff<left.cutoff);
 assert.equal(soundPerspective().gain,1);
`));
test('rotor audio reuses two beds and silences on pause, mute and hidden pages',()=>game()(`
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
 const node=()=>({gain:param(),frequency:param(),pan:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(n){return n;},start(){}});
 AC={currentTime:0,destination:node(),createBufferSource:node,createBiquadFilter:node,createOscillator:node,createGain:node,createStereoPanner:node,createDynamicsCompressor:node};
 AUDIO_MUTED=false;G.state='play';updateRotorAudio();assert.equal(ROTOR_AUDIO.length,2);
 for(let i=0;i<100;i++)updateRotorAudio();assert.equal(ROTOR_AUDIO.length,2);
 G.paused=true;updateRotorAudio();assert.equal(AUDIO_BUS.output.gain.value,0);
 G.paused=false;AUDIO_MUTED=true;updateRotorAudio();assert.equal(AUDIO_BUS.output.gain.value,0);
 AUDIO_MUTED=false;document.hidden=true;updateRotorAudio();assert.equal(AUDIO_BUS.output.gain.value,0);
 document.hidden=false;updateRotorAudio();assert.equal(AUDIO_BUS.output.gain.value,.8);
 newGame();G.state='play';updateRotorAudio();assert.equal(ROTOR_AUDIO.length,2);
`));
test('landing in front of friendly troops boards gradually and preserves role and health',()=>game()(`
 const p=G.helis[0];Object.assign(p,{x:1000,y:GROUND-16,vx:0,vy:0});
 const e=spawnUnit(1,'ENG');e.x=985;e.hp=13;const inf=spawnUnit(1,'INF');inf.x=950;
 autoBoardTroops(p,.2);assert.equal(p.cargo,0);autoBoardTroops(p,.16);assert.equal(p.cargo,1);
 assert.equal(p.cargoUnits[0].type,'ENG');assert.equal(p.cargoUnits[0].hp,13);
 autoBoardTroops(p,.35);assert.equal(p.cargo,2);assert.equal(G.units.length,0);
`));
test('automatic boarding requires a slow landing and never exceeds four seats',()=>game()(`
 const p=G.helis[0];Object.assign(p,{x:1000,y:GROUND-40,vx:0,vy:0});
 for(let i=0;i<6;i++){const u=spawnUnit(1,'INF');u.x=990-i*5;}
 const enemy=spawnUnit(-1,'INF');enemy.x=1000;const tank=spawnUnit(1,'TANK');tank.x=1000;
 autoBoardTroops(p,2);assert.equal(p.cargo,0);p.y=GROUND-16;p.vx=30;autoBoardTroops(p,2);assert.equal(p.cargo,0);
 p.vx=0;autoBoardTroops(p,2);assert.equal(p.cargo,4);assert.ok(G.units.includes(enemy));assert.ok(G.units.includes(tank));
`));
test('ground deployment inhibits automatic reboarding until takeoff',()=>game()(`
 const p=G.helis[0];Object.assign(p,{x:1000,y:GROUND-16,vx:0,vy:0,cargo:2});
 troopTransfer(p);assert.equal(p.cargo,0);autoBoardTroops(p,3);assert.equal(p.cargo,0);
 p.y=GROUND-80;autoBoardTroops(p,.1);assert.equal(p.boardingInhibit,false);
 p.y=GROUND-16;autoBoardTroops(p,1);assert.equal(p.cargo,2);
`));
test('automatic boarding tops up partial cargo and ignores troops ahead or still landing',()=>game()(`
 const p=G.helis[0];Object.assign(p,{x:1000,y:GROUND-16,vx:0,vy:0,cargo:1,cargoUnits:[{type:'ENG',hp:11}]});
 const ahead=spawnUnit(1,'INF');ahead.x=1030;const settling=spawnUnit(1,'INF');settling.x=990;settling.landing=.5;
 autoBoardTroops(p,1);assert.equal(p.cargo,1);settling.landing=0;autoBoardTroops(p,.4);
 assert.equal(p.cargo,2);assert.equal(p.cargoUnits[0].hp,11);assert.ok(G.units.includes(ahead));
`));
test('parachute has a deployment delay before its canopy opens',()=>game()(`
 assert.equal(parachuteInflation(0),0);assert.equal(parachuteInflation(.25),0);
 assert.ok(parachuteInflation(.6)>0&&parachuteInflation(.6)<1);assert.equal(parachuteInflation(1),1);
 G.state='play';const p=G.helis[0];p.cargo=1;troopTransfer(p);
 for(const age of [.1,.5,1.2]){G.paratroopers[0].chuteAge=age;render();}
`));
test('selected cargo deploys first without losing other passengers or rescue identity',()=>game()(`
 const p=G.helis[0];p.cargo=3;p.cargoUnits=[{type:'INF',hp:12},{type:'ENG',hp:19,rescue:true},{type:'INF',hp:22}];p.y=GROUND-30;
 selectCargo(1);troopTransfer(p,true);assert.equal(p.cargo,2);assert.equal(G.units[0].type,'ENG');assert.equal(G.units[0].hp,19);assert.equal(G.units[0].rescue,true);
 assert.equal(p.cargoUnits[0].hp,12);assert.equal(p.cargoUnits[1].hp,22);troopTransfer(p);assert.equal(p.cargo,0);assert.equal(G.units.length,3);
`));
test('hold stops movement while rally can reverse a convoy and advance resumes',()=>game()(`
 G.turrets=[];G.bunkers=[];const u=spawnUnit(1,'TANK');u.x=2000;G.helis[0].x=1700;
 setOrder('hold');updateUnits(1);assert.equal(u.x,2000);
 setOrder('rally');updateUnits(1);assert.ok(u.x<2000);
 u.x=1720;updateUnits(1);assert.equal(u.x,1720);
 setOrder('advance');updateUnits(1);assert.ok(u.x>1720);
`));
test('landing cues distinguish speed, nearby enemies, service and boarding capacity',()=>game()(`
 const p=G.helis[0];p.x=1000;p.y=300;assert.equal(landingCue(p),null);
 p.y=GROUND-50;p.vx=70;assert.equal(landingCue(p).safe,false);p.vx=0;
 assert.equal(landingCue(p).safe,true);const e=spawnUnit(-1,'INF');e.x=p.x;assert.equal(landingCue(p).safe,false);
 G.units=[];p.cargo=4;assert.equal(landingCue(p).label,'Cargo full');
`));
test('hard landing applies graded damage once and gentle touchdown remains safe',()=>game()(`
 G.state='play';const p=G.helis[0];p.x=1000;p.y=GROUND-27;p.vy=200;update(.033);
 const hp=p.hp;assert.ok(hp<100&&hp>40);assert.equal(G.stats.hardLandings,1);
 for(let i=0;i<20;i++)update(.033);assert.equal(p.hp,hp);assert.equal(G.stats.hardLandings,1);
 p.hp=100;p.y=GROUND-25;p.vy=40;update(.1);assert.equal(p.hp,100);
`));
test('camera look ahead eases through reversals and stays in world bounds',()=>game()(`
 const p=G.helis[0];p.x=3000;p.vx=180;for(let i=0;i<30;i++)updateCamera(p,.1);
 assert.ok(G.camX>p.x-W/2);const lead=G.cameraLead;p.vx=-180;updateCamera(p,.016);assert.ok(G.cameraLead>0&&G.cameraLead<lead);
 p.x=0;for(let i=0;i<50;i++)updateCamera(p,.1);assert.ok(G.camX>=0);
 cycleShake();assert.equal(SETTINGS.shake,.35);cycleShake();assert.equal(SETTINGS.shake,0);
`));
test('campaign capture, rescue delivery and escort progress through distinct missions',()=>game()(`
 startCampaign();assert.equal(G.campaign,0);const first=G.bunkers[0].x;G.bunkers[0].owner=1;updateMission();assert.equal(G.state,'win');
 nextSortie();assert.equal(G.campaign,1);assert.notEqual(G.bunkers[0].x,first);
 const p=G.helis[0];p.x=2330;p.y=GROUND-30;troopTransfer(p);assert.equal(p.cargo,4);
 p.x=PLAYER_X;p.service='hq';updateMission();assert.equal(G.stats.rescued,4);assert.equal(G.state,'win');assert.equal(p.cargo,0);
 nextSortie();assert.equal(G.campaign,2);assert.ok(G.turrets.every(t=>t.side===-1));
 const v=spawnUnit(1,'VAN');v.x=ENEMY_X;update(.001);assert.equal(G.state,'win');nextSortie();assert.equal(G.state,'menu');
`));
test('rescue casualties fail the mission and retry restores its objective',()=>game()(`
 startCampaign(1);killUnit(G.units[0]);updateMission();assert.equal(G.state,'over');restartMission();
 assert.equal(G.campaign,1);assert.equal(G.units.filter(u=>u.rescue).length,4);assert.equal(G.state,'play');
`));
test('replay is bounded, optional, and cannot mutate the debrief or recorded state',()=>game()(`
 G.state='play';for(let i=0;i<100;i++){G.helis[0].x=500+i;recordReplay(.125);}
 assert.equal(G.replayFrames.length,64);endGame(true,'Test');const score=G.score,x=G.helis[0].x,frames=JSON.stringify(G.replayFrames);
 startReplay();assert.ok(G.replay);renderReplay();assert.equal(G.score,score);assert.equal(G.helis[0].x,x);assert.equal(JSON.stringify(G.replayFrames),frames);
 stopReplay();assert.equal(G.replay,null);assert.equal(G.state,'win');
`));
test('rescue markers follow passengers home and stranded troops cannot capture bunkers',()=>game()(`
 startCampaign(1);assert.equal(objectiveLocation().label,'Recover troops');
 const p=G.helis[0];p.x=2330;p.y=GROUND-30;troopTransfer(p);
 assert.equal(objectiveLocation().x,PLAYER_X);assert.ok(missionText().includes('Return to HQ'));
 p.x=G.bunkers[0].x;troopTransfer(p);updateCapture(.1);assert.equal(G.bunkers[0].owner,-1);
`));
test('cosmetic remnants and impact particles remain bounded and distinct',()=>game()(`
 impactEffect(1000,GROUND,'armor');assert.ok(G.parts.every(p=>p.add));G.parts=[];
 impactEffect(1000,GROUND,'ground');assert.ok(G.parts.every(p=>!p.add));
 for(let i=0;i<40;i++)killUnit(spawnUnit(-1,'INF'));assert.equal(G.casualties.length,30);
 updateAtmosphere(10);assert.equal(G.casualties.length,0);
`));

test('campaign checkpoints advance, survive a reload, and ignore quick battle and academy',()=>{
 const run=game();run(`startCampaign(0);endGame(true,'Captured');assert.equal(readSaved().checkpoint,1);startAcademy();assert.equal(readSaved().checkpoint,1);newGame();G.state='play';endGame(true,'Quick');assert.equal(readSaved().checkpoint,1);`);
 game({stored:JSON.stringify({version:1,checkpoint:1,preferences:{difficulty:'veteran',shake:0,muted:true,weather:'rain',night:true}})})(`resumeCampaign();assert.equal(G.campaign,1);assert.equal(G.difficulty,'veteran');assert.equal(G.environment.weather,'rain');assert.equal(SETTINGS.shake,0);assert.equal(AUDIO_MUTED,true);`);
});
test('corrupt, unsupported and unavailable storage cannot block a mission',()=>{
 for(const stored of ['broken','null',JSON.stringify({version:99,checkpoint:2}),JSON.stringify({version:1,checkpoint:999,preferences:{difficulty:'bad',shake:-8,weather:'hurricane'}})])game({stored})(`assert.equal(PROGRESS.checkpoint,null);startCampaign();assert.equal(G.state,'play');`);
 game({blocked:true})(`startCampaign(1);assert.equal(G.campaign,1);assert.equal(PROGRESS.sessionOnly,true);cycleShake();toggleNight();newGame();assert.equal(SETTINGS.shake,.35);`);
});
test('preferences save from the actual controls and training does not change difficulty',()=>game()(`
 setDifficulty('recruit');cycleShake();cycleWeather();toggleNight();toggleAudio();
 const saved=readSaved();assert.equal(saved.preferences.difficulty,'recruit');assert.equal(saved.preferences.shake,.35);assert.equal(saved.preferences.weather,'gusts');assert.equal(saved.preferences.night,true);assert.equal(saved.preferences.muted,false);
 startAcademy();assert.equal(SETTINGS.difficulty,'recruit');assert.equal(G.environment.night,false);
`));
test('return guidance switches to the nearest friendly pad and budgets a fuel margin',()=>game()(`
 const p=G.helis[0];p.x=2800;const b=G.bunkers[0];b.owner=1;let nav=returnGuidance();assert.equal(nav.x,forwardPadX(b));assert.ok(nav.fuel>0&&!nav.warning);
 p.fuel=nav.fuel+7;assert.equal(returnGuidance().warning,true);b.owner=-1;assert.equal(returnGuidance().kind,'hq');
`));
test('group orders isolate armor and new units inherit their group command',()=>game()(`
 G.state='play';G.formation=false;const infantry=spawnUnit(1,'INF'),tank=spawnUnit(1,'TANK');selectGroup('armor');setOrder('hold');
 assert.equal(commandMovement(tank).move,false);assert.equal(commandMovement(infantry).move,true);
 const second=spawnUnit(1,'TANK');assert.equal(commandMovement(second).move,false);
 G.helis[0].x=100;setOrder('rally');assert.equal(commandMovement(tank).dir,-1);
 selectGroup('all');setOrder('advance');assert.equal(commandMovement(second).move,true);assert.equal(G.orders.mode,'advance');
`));
test('convoys establish tank, infantry, AA and van order without blocking the lead tank',()=>game()(`
 G.state='play';G.bunkers=[];G.turrets=[];G.helis[1].dead=true;
 const inf=spawnUnit(1,'INF'),aa=spawnUnit(1,'AA'),van=spawnUnit(1,'VAN'),tank=spawnUnit(1,'TANK');
 Object.assign(tank,{x:250});Object.assign(inf,{x:280});Object.assign(aa,{x:310});Object.assign(van,{x:360});
 for(let i=0;i<1800;i++)updateUnits(1/60);
 assert.ok(tank.x>inf.x&&inf.x>aa.x&&aa.x>van.x);assert.ok(van.x>360);assert.ok(tank.x-van.x>=190);
 G.units=[van];assert.equal(commandMovement(van).move,false);const escort=spawnUnit(1,'INF');escort.x=van.x+260;assert.equal(commandMovement(van).move,true);
`));
test('enemy waves assemble then release, and engineers can reclaim a turret behind them',()=>game()(`
 for(const type of ['INF','INF','INF','AA','TANK'])spawnUnit(-1,type);
 assert.equal(commandMovement(G.units[0]).move,false);updateOperations(.1);assert.ok(G.units.every(u=>u.aiReleased));assert.ok(G.radio.text.includes('advancing'));
 const eng=spawnUnit(-1,'ENG');eng.x=4000;G.turrets=[{x:4300,side:1,hp:70,maxhp:100}];assert.equal(commandMovement(eng).dir,1);
 const lone=spawnUnit(-1,'TANK');updateOperations(46);assert.equal(lone.aiReleased,true);
`));
test('wind drives aircraft and bomb drift while prediction matches stepped impact',()=>game()(`
 G.environment.weather='rain';G.time=0;const h=G.helis[0];h.vx=0;applyWind(h,1);assert.ok(h.vx<0);
 const bomb=bombFromHeli(h),prediction=bombPosition(bomb,bombGroundTime(bomb));assert.ok(bomb.wind<0);
 for(let i=0;i<500;i++)if(stepBomb(bomb,1/60))break;
 assert.ok(Math.abs(bomb.x-prediction.x)<.0001);assert.ok(Math.abs(bomb.y-prediction.y)<.0001);
 h.y=GROUND-22;h.vx=0;applyWind(h,1);assert.equal(h.vx,0);
`));
test('bailout conserves passengers and recovers a unique pilot for one reward',()=>game()(`
 G.state='play';const p=G.helis[0];Object.assign(p,{x:3000,y:300,hp:30,cargo:2,cargoUnits:[{type:'ENG',hp:17},{type:'INF',hp:20,rescue:true}]});
 assert.equal(bailout(),true);assert.equal(G.lives,2);assert.equal(p.cargo,0);assert.equal(G.paratroopers.length,3);assert.equal(bailout(),false);
 const pilot=G.paratroopers.find(u=>u.pilot);assert.ok(pilot);assert.equal(G.paratroopers.filter(u=>u.rescue).length,1);
 p.dead=false;p.cargo=0;p.cargoUnits=[];G.paratroopers=G.paratroopers.filter(u=>u!==pilot);delete pilot.y;G.units.push(pilot);assert.equal(commandMovement(pilot).move,false);
 boardTroop(p,pilot);assert.equal(p.cargoUnits[0].pilot,true);p.service='hq';const funds=G.funds;updateOperations(.1);
 assert.equal(G.stats.pilotsRescued,1);assert.equal(G.funds,funds+150);assert.equal(p.cargo,0);updateOperations(.1);assert.equal(G.funds,funds+150);
`));
test('bailout needs spare aircraft, altitude and critical damage',()=>game()(`
 G.state='play';const p=G.helis[0];p.hp=60;assert.equal(canBailout(),false);p.hp=30;p.y=GROUND-50;assert.equal(canBailout(),false);p.y=300;G.lives=1;assert.equal(canBailout(),false);
`));
test('advanced academy progresses through real transport, engineering and group orders',()=>game()(`
 startAcademy();const p=G.helis[0];autoBoardTroops(p,1);updateTutorial();assert.equal(G.tutorial.step,1);
 p.x=1050;p.y=400;selectCargo(cargoManifest(p).findIndex(c=>c.type==='ENG'));troopTransfer(p,true);updateTutorial();assert.equal(G.tutorial.step,2);
 const engineer=G.paratroopers[0];for(let i=0;i<800&&G.paratroopers.length;i++)updateEmplacements(1/60);engineer.x=1080;
 for(let i=0;i<500;i++){updateUnits(1/60);updateTutorial();}
 assert.equal(G.tutorial.step,4);selectGroup('armor');setOrder('hold');setOrder('rally');updateTutorial();assert.equal(G.state,'win');assert.equal(PROGRESS.checkpoint,null);
`));
test('replay interpolation follows entity identity across removals and never edits snapshots',()=>game()(`
 G.state='play';const a=spawnUnit(1,'TANK'),b=spawnUnit(1,'AA');a.x=1000;b.x=1500;G.time=1;recordReplay(.2);
 a.x=1200;b.x=1700;G.time=2;recordReplay(.2);let f=interpolatedReplay(.5);assert.equal(f.units[0].x,1100);assert.equal(f.units[1].x,1600);
 G.units.splice(0,1);b.x=1900;G.time=3;recordReplay(.2);f=interpolatedReplay(1.5);assert.equal(f.units[0].x,1200);assert.equal(f.units[1].x,1800);
 endGame(true,'Test');startReplay();toggleReplaySpeed();assert.equal(G.replay.speed,.35);const saved=JSON.stringify(G.replayFrames);renderReplay();assert.equal(JSON.stringify(G.replayFrames),saved);assert.equal(G.units[0].x,1900);toggleReplayFocus();assert.equal(G.replay.follow,false);
`));
test('helicopter collision respects fuselage pitch and a visible cable crossing',()=>game()(`
 const h=G.helis[0];Object.assign(h,{x:1000,y:400,dir:1,pitch:0});
 assert.equal(heliBodyHit(h,1035,403),true);assert.equal(heliBodyHit(h,1060,403),false);assert.equal(heliBodyHit(h,1008,430),false);
 assert.equal(heliCableHit(h,{x:1030}),true);assert.equal(heliCableHit(h,{x:1050}),false);
 h.pitch=.2;assert.equal(heliBodyHit(h,1035,410),true);
`));
// Convoys are marched from spawn by stepping the simulation; teleporting a Van hides finish-line bugs.
const MARCH=`
 function march(side,escorts,seconds=420){
  G.state='play';G.helis[1].dead=true;G.helis[1].respawn=1e9;G.helis[0].dead=true;G.helis[0].respawn=1e9;
  for(const b of G.bunkers)Object.assign(b,{owner:0,side:0,hp:0,garrison:0,balloonDead:true,cableBroken:true,balloonRespawn:1e9});
  for(const type of escorts)spawnUnit(side,type).aiReleased=true;
  // The Van is bought after its escorts have left, so it starts behind them as it does in play.
  for(let i=0;i<seconds*30&&G.state==='play';i++){if(i===600)spawnUnit(side,'VAN').aiReleased=true;update(1/30);}
 }`;
test('an escorted player Van crosses the enemy HQ line with convoy escorts on',()=>game()(MARCH+`
 march(1,['TANK','AA','INF','INF','INF']);assert.equal(G.state,'win');assert.ok(G.endMsg.includes('DEMO VAN'));
`));
test('an escorted enemy Van crosses the player HQ line with convoy escorts on',()=>game()(MARCH+`
 march(-1,['TANK','AA','INF','INF','INF']);assert.equal(G.state,'over');assert.ok(G.endMsg.includes('DEMO VAN'));
`));
test('the enemy column ignores the player escort setting and still finishes',()=>game()(MARCH+`
 G.formation=false;march(-1,['TANK','AA','INF','INF','INF']);assert.equal(G.state,'over');assert.ok(G.endMsg.includes('DEMO VAN'));
`));
test('a player Van with escorts off still finishes',()=>game()(MARCH+`
 G.formation=false;march(1,['TANK']);assert.equal(G.state,'win');
`));
test('the Van breaks formation for its final run only near the opposing HQ, and Hold still stops it',()=>game()(`
 G.state='play';const tank=spawnUnit(1,'TANK'),van=spawnUnit(1,'VAN');
 Object.assign(tank,{x:4100});Object.assign(van,{x:4000});assert.equal(commandMovement(van).move,false);
 const line=ENEMY_X-70;Object.assign(tank,{x:line-500});Object.assign(van,{x:line-600});assert.equal(commandMovement(van).move,true);
 assert.equal(canPass(van,tank),true);selectGroup('support');setOrder('hold');assert.equal(commandMovement(van).move,false);
`));
test('an AA truck keeps advancing while a helicopter loiters outside its firing range',()=>game()(`
 G.state='play';G.bunkers=[];G.turrets=[];const aa=spawnUnit(-1,'AA');aa.aiReleased=true;aa.x=5000;
 Object.assign(G.helis[0],{x:4000,y:GROUND-100});for(let i=0;i<60;i++)updateUnits(1/60);
 assert.ok(aa.x<4990);assert.equal(G.missiles.length,0);
`));
test('held bunkers raise income and enemy income no longer grows with time',()=>game()(`
 G.state='play';G.helis[1].dead=true;G.helis[1].respawn=1e9;let funds=G.funds;G.ecoT=2.99;update(.02);assert.equal(G.funds,funds+25);
 G.bunkers[0].owner=1;G.bunkers[1].owner=1;funds=G.funds;G.ecoT=2.99;update(.02);assert.equal(G.funds,funds+35);assert.equal(incomeFor(1),35);
 G.time=900;const enemy=G.eFunds;G.ecoT=2.99;update(.02);assert.equal(G.eFunds,enemy+DIFFICULTIES.normal.income+2*BUNKER_INCOME);
 G.eFunds=5000;G.ecoT=2.99;update(.02);assert.equal(G.eFunds,ENEMY_BANK);
`));
test('destroying an enemy unit pays a bounty and losing your own does not',()=>game()(`
 const funds=G.funds;killUnit(spawnUnit(-1,'TANK'));assert.equal(G.funds,funds+30);killUnit(spawnUnit(-1,'INF'));assert.equal(G.funds,funds+35);
 killUnit(spawnUnit(1,'TANK'));assert.equal(G.funds,funds+35);
`));
test('a fresh helicopter survives two missile hits on Normal and carries four flares',()=>game()(`
 const p=G.helis[0];assert.equal(p.flares,4);
 for(let hit=0;hit<2;hit++){G.missiles.push(mkMissile(p.x+10,p.y,p,-1));updateProjectiles(.016);}
 assert.equal(G.missiles.length,0);assert.equal(p.dead,false);assert.ok(p.hp>20&&p.hp<30);
 Object.assign(p,{x:PLAYER_X,y:GROUND-22,flares:0});for(let i=0;i<300;i++)update(1/60);assert.equal(p.flares,4);
`));
test('three stars need a clean win inside a par that an escorted convoy can meet',()=>game()(`
 G.state='win';G.time=400;assert.equal(sortieRating().stars,3);assert.ok(sortiePar()>=420);
 G.time=sortiePar()+1;assert.equal(sortieRating().stars,2);G.time=400;G.stats.helisLost=1;assert.equal(sortieRating().stars,2);
 G.state='over';assert.equal(sortieRating().stars,1);
 startCampaign(0);G.state='win';G.time=60;assert.equal(sortieRating().stars,3);assert.equal(sortiePar(),MISSIONS[0].par);
 startTutorial();G.state='win';G.time=5000;assert.equal(sortieRating().stars,3);
`));
test('simulation advances in fixed steps so game speed does not depend on the display rate',()=>game()(`
 function run(hz){newGame();G.state='play';G.helis[1].dead=true;G.helis[1].respawn=1e9;for(let i=0;i<hz*2;i++)advance(1/hz);return {time:G.time,y:G.helis[0].y};}
 const slow=run(30),normal=run(60),fast=run(120);
 for(const r of [slow,normal,fast])assert.ok(Math.abs(r.time-2)<.02);
 assert.ok(Math.abs(slow.y-normal.y)<.5&&Math.abs(fast.y-normal.y)<.5);
 newGame();G.state='play';advance(.1);assert.ok(Math.abs(G.time-.1)<.01);
 G.paused=true;const held=G.time;advance(.1);assert.equal(G.time,held);
`));
test('particles, shadows and night lights do not build gradients every frame',()=>game()(`
 G.state='play';G.environment.night=true;let count=0;const radial=cx.createRadialGradient;cx.createRadialGradient=(...a)=>{count++;return radial(...a);};
 render();const quiet=count;
 for(let i=0;i<12;i++)spawnUnit(1,'TANK').x=200+i*70;for(let i=0;i<20;i++)explode(300+i*20,GROUND-60,78,0,1);
 count=0;render();assert.ok(G.parts.length>300);assert.ok(count-quiet<=2,'extra gradients in a busy frame: '+(count-quiet));
`));
test('enemy, hit and wreck sprites are shaded from one base image instead of downloaded copies',()=>game()(`
 assert.equal(ASSET_NEED,9);
 const pixel=(side,effect)=>{const d=new Uint8ClampedArray([120,130,110,255,9,9,9,0]);shadePixels(d,side,effect);return d;};
 const friend=pixel(1,''),enemy=pixel(-1,''),hit=pixel(1,'hit'),wreck=pixel(1,'wreck');
 assert.ok(enemy[0]>enemy[1]+30&&enemy[0]>friend[0]);assert.equal(enemy[7],0);assert.deepEqual([...enemy.slice(4,7)],[9,9,9]);
 assert.ok(hit[1]>friend[1]+60);assert.ok(wreck[0]===wreck[1]&&wreck[1]===wreck[2]&&wreck[0]<60);
`));
test('sustained slow frames lower render quality and fast frames do not raise it mid-sortie',()=>game()(`
 const full=particleLimit();for(let i=0;i<300;i++)governQuality(.04);assert.ok(QUALITY.level>0);assert.ok(particleLimit()<full);
 const level=QUALITY.level;for(let i=0;i<900;i++)governQuality(.016);assert.equal(QUALITY.level,level);
 newGame();assert.equal(QUALITY.level,0);
`));
test('an incoming missile is reported and sounded until a flare decoys it',()=>game()(`
 G.state='play';G.helis[1].dead=true;G.helis[1].respawn=1e9;const p=G.helis[0];assert.equal(incomingMissile(),null);
 const m=mkMissile(p.x+700,p.y,p,-1);G.missiles.push(m);assert.equal(incomingMissile(),m);
 let tones=0;SFX.lock=()=>tones++;update(.2);assert.ok(tones>=1);
 m.target={x:p.x+50,y:p.y,life:1};assert.equal(incomingMissile(),null);G.missiles=[mkMissile(p.x+700,p.y,p,1)];assert.equal(incomingMissile(),null);
`));
test('desktop HUD panels sit below the ground lane',()=>game()(`
 for(const panel of Object.values(HUD_BOTTOM))assert.ok(panel.y>=GROUND+12,'panel top '+panel.y);
`));
test('every main menu control sits inside the menu panel and an unavailable action is disabled',()=>game()(`
 render();assert.ok(G.buttons.length>=10);
 for(const b of G.buttons)assert.ok(b.x>=MENU_PANEL.x&&b.y>=MENU_PANEL.y&&b.x+b.w<=MENU_PANEL.x+MENU_PANEL.w&&b.y+b.h<=MENU_PANEL.y+MENU_PANEL.h,b.id+' is outside the panel');
 const resume=G.buttons.find(b=>b.id==='resume');assert.equal(resume.disabled,true);
 handleCanvasClick(resume.x+5,resume.y+5);assert.equal(G.state,'menu');
`));
test('Esc cancels a bomb preview first, otherwise pauses and resumes',()=>game()(`
 G.state='play';onKey('Escape');assert.equal(G.paused,true);onKey('Escape');assert.equal(G.paused,false);
 onKey('KeyB');assert.equal(G.bombAiming,true);onKey('Escape');assert.equal(G.bombAiming,false);assert.equal(G.paused,false);
`));
test('the pause screen can return to the main menu and open the controls reference',()=>game()(`
 G.state='play';G.paused=true;render();const ids=G.buttons.map(b=>b.id);
 for(const id of ['pause_resume','pause_restart','pause_menu','pause_controls','pause_audio','shake','formation'])assert.ok(ids.includes(id),id);
 for(const a of G.buttons)for(const b of G.buttons)if(a!==b)assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,a.id+' overlaps '+b.id);
 G.buttons.find(b=>b.id==='pause_controls').onClick();render();assert.ok(G.buttons.some(b=>b.id==='controls_close'));onKey('Escape');render();assert.ok(G.buttons.some(b=>b.id==='pause_resume'));
 G.buttons.find(b=>b.id==='pause_menu').onClick();assert.equal(G.state,'menu');assert.equal(G.paused,false);
`));
test('a gamepad flies, fires, bombs and pauses, and hands control back to the keyboard',()=>game()(`
 G.state='play';G.helis[1].dead=true;G.helis[1].respawn=1e9;const p=G.helis[0];
 const pad={connected:true,axes:[1,-1,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 const x=p.x,y=p.y;for(let i=0;i<30;i++){pollGamepad([pad]);update(1/60);}assert.ok(p.x>x+10&&p.y<y-10);assert.equal(PAD.active,true);
 pad.axes=[0,0,0,0];pad.buttons[0].pressed=true;pollGamepad([pad]);update(1/60);assert.ok(G.bullets.length>0);pad.buttons[0].pressed=false;
 pad.buttons[2].pressed=true;pollGamepad([pad]);assert.equal(G.bombAiming,true);pad.buttons[2].pressed=false;pollGamepad([pad]);assert.equal(G.bombs.length,1);
 pad.buttons[9].pressed=true;pollGamepad([pad]);assert.equal(G.paused,true);pollGamepad([pad]);assert.equal(G.paused,true);
 pad.buttons[9].pressed=false;pollGamepad([pad]);pad.buttons[9].pressed=true;pollGamepad([pad]);assert.equal(G.paused,false);
 pollGamepad([]);assert.equal(PAD.x,0);assert.equal(PAD.fire,false);
`));
test('combat school teaches buying, refuelling, flaring a missile and passing a cable',()=>game()(`
 startCombatSchool();const p=G.helis[0];assert.equal(G.tutorial.step,0);assert.ok(academyHint().startsWith('1/4'));
 buy(1,'INF');updateTutorial();assert.equal(G.tutorial.step,1);assert.ok(p.fuel<LOW_FUEL);assert.ok(returnGuidance());
 Object.assign(p,{x:PLAYER_X,y:GROUND-22,vx:0,vy:0});for(let i=0;i<900&&G.tutorial.step===1;i++)update(1/60);assert.equal(G.tutorial.step,2);
 Object.assign(p,{x:420,y:260,vx:0,vy:0});for(let i=0;i<400&&!incomingMissile();i++){p.y=260;update(1/60);}assert.ok(incomingMissile());
 onKey('KeyC');for(let i=0;i<300&&G.tutorial.step===2;i++){p.y=260;update(1/60);}assert.equal(G.tutorial.step,3);
 const cable=G.bunkers[0];assert.equal(cable.owner,-1);assert.equal(cable.balloonDead,false);
 Object.assign(p,{x:cable.x+220,y:150});updateTutorial();assert.equal(G.state,'win');
`));
test('lessons chain into the campaign and the menu points first-time and returning players differently',()=>{
 game()(`
  assert.equal(primarySortie().id,'training');startTutorial();endGame(true,'done');assert.ok(sortieLabel().includes('Flight academy'));
  nextSortie();assert.equal(G.tutorial.advanced,true);assert.ok(!G.tutorial.combat);endGame(true,'done');
  nextSortie();assert.equal(G.tutorial.combat,true);endGame(true,'done');assert.equal(readSaved().lessons,3);
  nextSortie();assert.equal(G.campaign,0);assert.equal(readSaved().lastMode,'campaign');
  newGame();assert.equal(primarySortie().id,'campaign');startQuickBattle();assert.equal(readSaved().lastMode,'quick');newGame();assert.equal(primarySortie().id,'quick');
  onKey('Enter');assert.equal(G.state,'play');assert.equal(G.campaign,null);assert.equal(G.tutorial,null);
 `);
 game({stored:JSON.stringify({version:1,checkpoint:1,lastMode:'campaign',lessons:3})})(`
  const next=primarySortie();assert.equal(next.id,'campaign');assert.ok(next.label.includes('2'));next.start();assert.equal(G.campaign,1);
 `);
 game({stored:JSON.stringify({version:1,checkpoint:null,lastMode:'hacked',lessons:99})})(`assert.equal(PROGRESS.lastMode,null);assert.equal(PROGRESS.lessons,3);`);
});
test('the page is installable: manifest, icons and metadata are linked',()=>{
 const {existsSync}=require('node:fs');const html=readFileSync('index.html','utf8'),manifest=JSON.parse(readFileSync('manifest.webmanifest','utf8'));
 assert.ok(html.includes('rel="manifest" href="manifest.webmanifest"'));assert.ok(html.includes('rel="icon"'));assert.ok(html.includes('apple-mobile-web-app-capable'));assert.ok(html.includes('name="description"'));
 assert.equal(manifest.orientation,'landscape');assert.ok(['fullscreen','standalone'].includes(manifest.display));assert.ok(manifest.icons.length>=2);
 for(const icon of manifest.icons)assert.ok(existsSync(icon.src),icon.src);
});
