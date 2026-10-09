'use strict';
// Shared mission, transport, command and presentation behavior for both interfaces.
const MISSIONS=[
  {name:'Foothold',brief:'Capture the marked bunker.',kind:'capture',par:150,bunkers:[1500,3300],turrets:[1100,2700]},
  {name:'Bring them home',brief:'Recover four stranded troops and return them to HQ.',kind:'rescue',par:240,bunkers:[1300,3600,6000],turrets:[1750,3100,5200]},
  {name:'Breakthrough',brief:'Escort your Van to enemy HQ.',kind:'escort',par:720,bunkers:[1900,3700,5500,7200],turrets:[1400,2900,4600,6300,7800]}
];
SETTINGS.shake=1;
// Three stars need a win with no helicopter lost inside the par; an escorted convoy needs about five minutes to cross the map.
const QUICK_PAR=720;
function sortiePar(){return G.tutorial?null:G.campaign===null?QUICK_PAR:MISSIONS[G.campaign].par;}
function sortieRating(){
  if(G.state!=='win')return {stars:1,rank:'HONORABLE SERVICE SPECIALIST'};
  const par=sortiePar();
  return G.stats.helisLost===0&&(par===null||G.time<=par)?{stars:3,rank:'ACE FLIGHT COMMANDER'}:{stars:2,rank:'VETERAN SQUADRON LEADER'};
}
function initExperience(g){
  g.orders={mode:'advance',x:0};g.campaign=null;g.selectedCargo=0;g.casualties=[];
  g.replayFrames=[];g.replayClock=0;g.replay=null;g.cameraLead=0;
  Object.assign(g.stats,{rescued:0,convoyLost:0,lastLoss:'None',hardLandings:0});
  if(typeof initOperations==='function')initOperations(g);
}
initExperience(G);
function startCampaign(index=0){
  index=clamp(index,0,MISSIONS.length-1);newGame();G.state='play';G.campaign=index;saveCheckpoint(index);
  if(index===2)G.environment.night=true;
  const mission=MISSIONS[index],template=G.bunkers[0];
  G.bunkers=mission.bunkers.map(x=>({...template,x}));
  G.turrets=mission.turrets.map(x=>({x,y:GROUND-22,type:'TURRET',side:index===2?-1:0,hp:index===2?80:0,maxhp:100,cd:1}));
  if(index===0){G.bunkers[0].owner=0;G.bunkers[0].side=0;G.bunkers[0].hp=0;G.bunkers[0].garrison=0;G.bunkers[0].balloonDead=true;G.bunkers[0].cableBroken=true;}
  for(let i=0;i<4;i++){
    const u=spawnUnit(1,'INF');u.x=index===1?2300+i*22:250+i*24;
    if(index===1)u.rescue=true;
  }
}
function nextSortie(){
  if(G.campaign!==null){
    if(G.state==='win'&&G.campaign===MISSIONS.length-1){newGame();return;}
    startCampaign(G.campaign+(G.state==='win'?1:0));
  }else{newGame();G.state='play';}
}
function sortieLabel(){return G.campaign===null?'Fly again':G.state!=='win'?'Retry mission':G.campaign===2?'Campaign complete · Menu':'Next mission';}
function missionText(){
  if(G.tutorial)return G.tutorial.advanced?'Flight academy · Advanced operations':'Training sortie · Flight basics';
  if(G.campaign===null)return 'Quick battle · Escort your Van to enemy HQ';
  const m=MISSIONS[G.campaign],aboard=cargoManifest(G.helis[0]).filter(c=>c.rescue).length;
  return `${G.campaign+1}/3 ${m.name} · ${m.kind==='rescue'?(aboard?aboard+' aboard · Return to HQ':G.stats.rescued+'/4 home · Recover marked troops'):m.brief}`;
}
function objectiveLocation(){
  if(G.campaign===null)return null;
  if(G.campaign===0)return {x:G.bunkers[0].x,label:'Capture'};
  if(G.campaign===2)return {x:ENEMY_X,label:'Escort Van'};
  if(cargoManifest(G.helis[0]).some(c=>c.rescue))return {x:PLAYER_X,label:'Return to HQ'};
  const unit=G.units.find(u=>u.rescue)||G.paratroopers.find(u=>u.rescue);
  return unit?{x:unit.x,label:'Recover troops'}:null;
}
function drawMissionMarker(){
  const objective=objectiveLocation();if(!objective||G.state!=='play'||G.replayView)return;
  const actual=objective.x-G.camX,x=clamp(actual,36,W-36),y=GROUND-105;
  cx.save();cx.strokeStyle='#d6c690';cx.fillStyle='#d6c690';cx.lineWidth=1;
  cx.beginPath();cx.moveTo(x-5,y);cx.lineTo(x,y+5);cx.lineTo(x+5,y);cx.stroke();
  cx.font='10px monospace';cx.textAlign=actual<36?'left':actual>W-36?'right':'center';
  cx.fillText(objective.label+(actual<0?' ◀':actual>W?' ▶':''),x,y-7);cx.restore();
}
function downedParatrooper(u){
  G.casualties.push({x:u.x,y:u.y,vy:40,side:u.side,life:9});if(G.casualties.length>30)G.casualties.shift();
}
function updateMission(){
  if(G.campaign===null||G.state!=='play')return;
  const m=MISSIONS[G.campaign],p=G.helis[0];
  if(m.kind==='capture'&&G.bunkers[0].owner===1){endGame(true,'FORWARD BASE SECURED');return;}
  if(m.kind==='rescue'){
    if(!p.dead&&p.service==='hq'){
      const passengers=cargoManifest(p),delivered=passengers.filter(c=>c.rescue).length;
      if(delivered){G.stats.rescued+=delivered;p.cargoUnits=passengers.filter(c=>!c.rescue);p.cargo=p.cargoUnits.length;G.selectedCargo=0;}
    }
    if(G.stats.rescued>=4){endGame(true,'ALL FOUR TROOPS RETURNED TO HQ');return;}
    const available=G.units.filter(u=>u.rescue).length+G.paratroopers.filter(u=>u.rescue).length+(!p.dead?cargoManifest(p).filter(c=>c.rescue).length:0);
    if(available+G.stats.rescued<4)endGame(false,'RESCUE TEAM LOST · RETRY THE SORTIE');
  }
}
function cargoManifest(p){
  return Array.from({length:p.cargo},(_,i)=>p.cargoUnits?.[i]||{type:'INF',hp:UT.INF.hp});
}
function selectCargo(index){G.selectedCargo=clamp(index,0,Math.max(0,G.helis[0].cargo-1));}
function cycleCargo(){selectCargo((G.selectedCargo+1)%Math.max(1,G.helis[0].cargo));}
function setOrder(mode){
  if(!['advance','hold','rally'].includes(mode)||G.tutorial&&!G.tutorial.advanced)return;
  const order={mode,x:clamp(G.helis[0].x,80,WORLD-80)};
  if(G.group==='all'){G.orders=order;for(const group in G.groupOrders)G.groupOrders[group]={...order};}
  else G.groupOrders[G.group]=order;
  if(G.tutorial?.advanced&&G.group==='armor'){if(mode==='hold')G.academyEvents.armorHold=true;if(mode==='rally'&&G.academyEvents.armorHold)G.academyEvents.armorRally=true;}
}
function commandMovement(u){
  if(u.rescue||u.pilot)return {move:false,dir:u.side};
  if(G.tutorial&&!G.tutorial.advanced)return {move:true,dir:u.side};
  if(u.side!==1)return enemyMovement(u);
  const order=orderFor(u);
  if(order.mode==='advance')return convoyMovement(u);
  if(order.mode==='hold')return {move:false,dir:u.side};
  const delta=order.x-u.x;return {move:Math.abs(delta)>45,dir:Math.sign(delta)||u.side};
}
function landingCue(p){
  if(p.dead||p.y<GROUND-160)return null;
  const hazard=G.units.some(u=>u.side!==p.side&&Math.abs(u.x-p.x)<180)||emplacements().some(t=>t.hp>0&&t.side!==p.side&&Math.abs(t.x-p.x)<180);
  const speed=Math.abs(p.vx)>35||p.vy>85;
  const nearby=G.units.filter(u=>['INF','ENG'].includes(u.type)&&u.side===p.side&&Math.abs(u.x-p.x)<115).length;
  return {safe:!hazard&&!speed,nearby,seats:4-p.cargo,progress:clamp((p.boardingTimer||0)/.35,0,1),
    label:hazard?'Contested landing':speed?'Slow descent':p.boardingInhibit?'Troops deployed':p.rearming?'Servicing':nearby&&p.cargo<4?'Boarding area':p.cargo===4?'Cargo full':'Clear landing'};
}
function drawLandingCue(){
  if(G.state!=='play'||G.replayView)return;
  const p=G.helis[0],cue=landingCue(p);if(!cue)return;const x=p.x-G.camX;
  cx.save();cx.strokeStyle=cue.safe?'#aecbab':'#e6ae72';cx.fillStyle=cue.safe?'rgba(150,195,154,.12)':'rgba(220,153,100,.12)';cx.lineWidth=1;
  cx.beginPath();cx.ellipse(x,GROUND-2,46,7,0,0,7);cx.fill();cx.stroke();
  cx.fillStyle=cue.safe?'#c4d8bc':'#ecc195';cx.font='10px monospace';cx.textAlign='center';
  cx.fillText(cue.label+(cue.nearby?` · ${cue.nearby} troops · ${cue.seats} seats`:''),x,GROUND-65);
  if(cue.progress){cx.fillStyle='#263d35';cx.fillRect(x-24,GROUND-14,48,3);cx.fillStyle='#b4dab4';cx.fillRect(x-24,GROUND-14,48*cue.progress,3);}cx.restore();
}
function landingImpact(h,speed){
  const damage=clamp((speed-95)*.3,0,60);h.settle=Math.min(1,speed/130);
  if(speed>20)emitGroundWash(h.x,clamp(speed/120,.2,1));
  if(damage>0){if(h.side===1)G.stats.hardLandings++;hurtHeli(h,damage,{x:h.x,y:GROUND,cause:'Hard landing'});}
}
function updateCamera(p,dt){
  const desired=clamp(p.vx*1.15,-165,165);
  G.cameraLead+=(desired-G.cameraLead)*(1-Math.exp(-2*dt));
  G.camX+=((p.x-W/2+G.cameraLead)-G.camX)*(1-Math.exp(-3.2*dt));G.camX=clamp(G.camX,0,WORLD-W);
}
function cycleShake(){SETTINGS.shake=SETTINGS.shake===1?.35:SETTINGS.shake===.35?0:1;saveProgress();}
function shakeLabel(){return SETTINGS.shake===1?'Full':SETTINGS.shake===0?'Off':'Reduced';}
function impactEffect(x,y,kind){
  const armor=kind==='armor',grass=terrainAt(x)==='grass';
  for(let i=0;i<(TOUCH.active?5:9);i++)G.parts.push({x,y,vx:rnd(-70,70),vy:rnd(-110,-30),life:rnd(.18,.48),
    c:armor?'#efc986':grass?'#7a8055':'#9a846a',s:armor?1.3:rnd(1,3),g:1,streak:armor,add:armor,grow:armor?0:4,wind:armor?0:.4});
}
function updateAtmosphere(dt){
  for(const c of G.casualties){c.life-=dt;if(c.y!==undefined&&c.y<GROUND){c.vy=(c.vy||0)+220*dt;c.y=Math.min(GROUND,c.y+c.vy*dt);}}G.casualties=G.casualties.filter(c=>c.life>0);
  for(const u of G.units){
    if(['INF','ENG'].includes(u.type))continue;
    u.exhaust=(u.exhaust||0)-dt;
    if(u.exhaust<=0&&onScreen(u.x)&&(u.moving||u.hp<u.maxhp*.5)){
      u.exhaust=u.hp<u.maxhp*.5?.16:.4;
      G.parts.push({x:u.x-u.side*UT[u.type].w*.4,y:GROUND-10,vx:-u.side*8,vy:-10,life:1.3,c:u.hp<u.maxhp*.5?'#454643':'#787b72',s:2,g:-.05,grow:5,wind:.65});
    }
  }
}
function drawClouds(){
  cx.save();
  // Thin, slow-moving banks stay translucent so they never conceal hazards.
  for(let i=0;i<5;i++){
    const wx=i*2200+((G.time*5+i*93)%2200),x=wx-G.camX*.6,y=180+hash(i+81)*190;
    if(x<-300||x>W+300)continue;
    cx.save();cx.translate(x,y);cx.scale(1,.2);
    const cloud=cx.createRadialGradient(0,0,10,0,0,230);cloud.addColorStop(0,'rgba(203,197,180,.10)');cloud.addColorStop(1,'rgba(203,197,180,0)');
    cx.fillStyle=cloud;cx.fillRect(-240,-240,480,480);cx.restore();
  }cx.restore();
}
function drawWindsock(wx){
  if(!onScreen(wx))return;const x=wx-G.camX,wind=windAt(G.time),flutter=Math.sin(G.time*6+wx)*2;
  cx.save();cx.strokeStyle='#909183';cx.lineWidth=1;cx.beginPath();cx.moveTo(x,GROUND);cx.lineTo(x,GROUND-32);cx.stroke();
  for(let i=0;i<5;i++){cx.fillStyle=i%2?'#c7bda3':'#b4744e';cx.beginPath();cx.moveTo(x+i*4,GROUND-33+i*.7+flutter*i/5);cx.lineTo(x+(i+1)*4,GROUND-33+(i+1)*.7+flutter*(i+1)/5);cx.lineTo(x+(i+1)*4,GROUND-27+(i+1)*.2+flutter*(i+1)/5+(25-wind)*.08);cx.lineTo(x+i*4,GROUND-27+i*.2+flutter*i/5);cx.closePath();cx.fill();}cx.restore();
}
function drawRemnants(){
  for(const c of G.casualties){if(!onScreen(c.x))continue;cx.save();cx.globalAlpha=Math.min(1,c.life/2)*.7;
    drawSprite('soldier',c.side,c.x-G.camX,(c.y??GROUND)-2,12,c.side<0,Math.PI/2,false);cx.restore();}
}
function drawTracks(u,x){
  if(u.type!=='TANK')return;
  cx.save();cx.strokeStyle='#393d33';cx.lineWidth=1;
  for(let i=0;i<6;i++){const offset=(i*5+(u.phase||0)*2)%30;cx.beginPath();cx.moveTo(x-15+offset,GROUND-3);cx.lineTo(x-13+offset,GROUND-1);cx.stroke();}cx.restore();
}
function recordReplay(dt,force=false){
  if(G.tutorial||G.replay)return;G.replayClock+=dt;
  if(!force&&G.replayClock<.125)return;G.replayClock=0;
  const frame={camX:G.camX,time:G.time,anim:G.anim};
  const previous=G.replayFrames.at(-1);frame.at=previous?previous.at+Math.max(.001,G.time-previous.time):0;
  for(const name of ['helis','units','bunkers','turrets','paratroopers','canopies','wrecks','decals','parts','bullets','shells','bombs','missiles','flares','casualties']){
    const entities=name==='parts'?G[name].slice(-100):G[name];
    frame[name]=entities.map(entity=>{if(!entity.replayId)entity.replayId=G.nextReplayId++;return {...entity,target:null};});
  }
  G.replayFrames.push(JSON.parse(JSON.stringify(frame)));if(G.replayFrames.length>64)G.replayFrames.shift();
}
function replayDuration(){const frames=G.replayFrames;return frames.length>1?frames.at(-1).at-frames[0].at:0;}
function replayFocus(){
  for(const frame of [...G.replayFrames].reverse()){
    const van=frame.units.find(u=>u.type==='VAN'&&(u.side===1?u.x>ENEMY_X-110:u.x<PLAYER_X+110));
    if(van)return {name:'units',id:van.replayId,label:'Van',x:van.x};
    for(const name of ['missiles','bombs','shells']){
      const projectile=frame[name].at(-1);if(projectile)return {name,id:projectile.replayId,label:'Ordnance',x:projectile.x};
    }
  }
  return {name:'helis',id:G.replayFrames[0].helis[0].replayId,label:'Helicopter',x:G.helis[0].x};
}
function startReplay(){
  if(!['win','over'].includes(G.state)||G.replayFrames.length<2)return;
  if(TOUCH.reset)TOUCH.reset();G.replay={time:0,speed:1,follow:true,focus:replayFocus()};syncAudioBus();
}
function stopReplay(){G.replay=null;}
function toggleReplaySpeed(){if(G.replay)G.replay.speed=G.replay.speed===1?.35:1;}
function toggleReplayFocus(){if(G.replay)G.replay.follow=!G.replay.follow;}
function interpolatedReplay(time){
  const frames=G.replayFrames,target=frames[0].at+Math.max(0,time);
  let i=0;while(i<frames.length-1&&frames[i+1].at<=target)i++;
  const a=frames[i],b=frames[Math.min(i+1,frames.length-1)],mix=clamp((target-a.at)/Math.max(.001,b.at-a.at),0,1);
  const frame=JSON.parse(JSON.stringify(a));
  for(const key of ['camX','time','anim'])frame[key]=a[key]+(b[key]-a[key])*mix;
  for(const name of Object.keys(frame)){
    if(!Array.isArray(frame[name]))continue;
    const next=new Map(b[name].map(entity=>[entity.replayId,entity]));
    for(const entity of frame[name]){
      const after=next.get(entity.replayId);if(!after)continue;
      for(const key of ['x','y','vx','vy','pitch','rotorPhase','phase','chuteAge','life','r','s'])
        if(Number.isFinite(entity[key])&&Number.isFinite(after[key]))entity[key]+=(key==='rotorPhase'?(after[key]-entity[key]+Math.PI*2)%(Math.PI*2):after[key]-entity[key])*mix;
    }
  }
  if(G.replay?.follow){
    const focus=G.replay.focus;
    // Retain the impact location after the tracked projectile disappears.
    let entity=frame[focus.name].find(e=>e.replayId===focus.id);
    if(!entity)for(let j=i;j>=0&&!entity;j--)entity=frames[j][focus.name].find(e=>e.replayId===focus.id);
    if(entity)frame.camX=clamp(entity.x-W/2,0,WORLD-W);
  }
  return frame;
}
function renderReplay(){
  const live=G,frame=interpolatedReplay(live.replay.time);
  cx.save();
  try{
    G={...live,...frame,replayView:true,paused:true,buttons:[]};
    drawSky();drawBackdrop();drawHills();drawClouds();drawGround();drawDecals();drawWrecks();drawBases();
    for(const b of G.bunkers)drawBunker(b);drawEmplacements();drawRemnants();
    for(const u of G.units)drawUnit(u);for(const h of G.helis)if(!h.dead)drawHeli(h);drawProjectiles();drawParts();drawWeather();drawNight();
  }finally{G=live;cx.restore();}
  G.buttons=[];
  if(!TOUCH.active){cx.save();
    experienceButton('replay_close','Back to debrief [Esc]',300,18,220,stopReplay);
    experienceButton('replay_speed',G.replay.speed===1?'Slow motion [Space]':'Speed: 0.35× [Space]',530,18,220,toggleReplaySpeed);
    experienceButton('replay_focus',G.replay.follow?'Follow '+G.replay.focus.label+' [F]':'Original camera [F]',760,18,220,toggleReplayFocus);
    cx.restore();
  }
  if(TOUCH.active&&TOUCH.render)TOUCH.render();
}
function debriefDetails(){return `${G.stats.rescued} troops + ${G.stats.pilotsRescued} pilots rescued · ${G.stats.bunkersCap} bases · ${G.stats.convoyLost} convoy losses · Last helicopter loss: ${G.stats.lastLoss}`;}
function experienceButton(id,label,x,y,w,action,active=false){
  G.buttons.push({id,x,y,w,h:28,onClick:action});cx.fillStyle=active?'#365445':'rgba(12,25,32,.9)';cx.fillRect(x,y,w,28);
  cx.strokeStyle=active?'#a3c9a4':'#52685f';cx.strokeRect(x,y,w,28);cx.fillStyle='#d4dfd0';cx.font='11px monospace';cx.textAlign='center';cx.fillText(label,x+w/2,y+18);
}
function drawExperienceUI(){
  if(TOUCH.active)return;cx.save();
  if(G.state==='play'&&!G.paused){
    cx.font='11px monospace';cx.fillStyle='#d0d9c6';cx.textAlign='center';cx.fillText(missionText(),644,27);
    if(!G.tutorial||G.tutorial.advanced)for(const [i,mode] of ['advance','hold','rally'].entries())experienceButton('order_'+mode,['Advance [Z]','Hold [X]','Rally here [V]'][i],424+i*146,39,138,()=>setOrder(mode),activeOrder().mode===mode);
  }else if(G.state==='menu')experienceButton('campaign','Campaign · 3 missions [C]',820,580,240,()=>startCampaign());
  else if(G.paused)experienceButton('shake','Camera shake: '+shakeLabel(),490,432,300,cycleShake);
  else if(G.state==='win'||G.state==='over'){
    cx.font='11px monospace';cx.fillStyle='#c5d2bf';cx.textAlign='center';cx.fillText(debriefDetails(),W/2,460);
    if(G.replayFrames.length>1)experienceButton('replay','Watch final moments [R]',490,478,300,startReplay);
  }cx.restore();
}
