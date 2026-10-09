'use strict';
// Shared operations layer: no browser UI dependencies in simulation or persistence.
function initOperations(g){
  g.group='all';g.groupOrders={infantry:{mode:'advance',x:0},armor:{mode:'advance',x:0},support:{mode:'advance',x:0}};
  g.formation=true;g.environment={weather:SETTINGS.weather||'clear',night:!!SETTINGS.night};
  g.nextReplayId=1;g.enemyMuster=0;g.radio=null;g.radioUntil=0;
  g.stats.pilotsRescued=0;g.academyEvents={};
}
function loadProgress(){
  const fallback={version:1,checkpoint:null};
  try{
    const data=JSON.parse(localStorage.getItem('rescue-raiders.operations.v1'));
    if(!data||data.version!==1)return fallback;
    const prefs=data.preferences||{};
    if(['recruit','normal','veteran'].includes(prefs.difficulty))SETTINGS.difficulty=prefs.difficulty;
    if([0,.35,1].includes(prefs.shake))SETTINGS.shake=prefs.shake;
    if(['clear','gusts','rain'].includes(prefs.weather))SETTINGS.weather=prefs.weather;
    if(typeof prefs.night==='boolean')SETTINGS.night=prefs.night;
    if(typeof prefs.muted==='boolean')AUDIO_MUTED=prefs.muted;
    return {version:1,checkpoint:Number.isInteger(data.checkpoint)&&data.checkpoint>=0&&data.checkpoint<3?data.checkpoint:null,complete:data.complete===true};
  }catch{return fallback;}
}
const PROGRESS=loadProgress();
function saveProgress(){
  try{localStorage.setItem('rescue-raiders.operations.v1',JSON.stringify({...PROGRESS,preferences:{difficulty:SETTINGS.difficulty,shake:SETTINGS.shake,weather:SETTINGS.weather||'clear',night:!!SETTINGS.night,muted:AUDIO_MUTED}}));PROGRESS.sessionOnly=false;return true;}
  catch{PROGRESS.sessionOnly=true;return false;}
}
function setDifficulty(id){if(Object.hasOwn(DIFFICULTIES,id)){SETTINGS.difficulty=id;saveProgress();}}
function saveCheckpoint(index,complete=false){PROGRESS.checkpoint=index;PROGRESS.complete=complete;saveProgress();}
function resumeCampaign(){if(PROGRESS.checkpoint!==null)startCampaign(PROGRESS.checkpoint);}
function cycleWeather(){const options=['clear','gusts','rain'];SETTINGS.weather=options[(options.indexOf(SETTINGS.weather||'clear')+1)%options.length];saveProgress();}
function toggleNight(){SETTINGS.night=!SETTINGS.night;saveProgress();}
function weatherLabel(){return {clear:'Clear',gusts:'Gusty',rain:'Rain'}[SETTINGS.weather||'clear'];}
function environmentWind(time){
  const weather=G.environment?.weather||'clear';
  if(weather==='gusts')return 32+Math.sin(time*.23)*22+Math.sin(time*1.1)*7;
  if(weather==='rain')return -28+Math.sin(time*.19)*14;
  return 16+Math.sin(time*.17)*9;
}
function applyWind(h,dt){
  if(h.y>=GROUND-24)return;
  // Modest lateral aerodynamic force; touch hover assist still requires pilot correction in weather.
  const factor=G.environment?.weather==='clear'?.12:.65;
  h.vx+=windAt(G.time)*factor*dt;
}
function returnGuidance(p=G.helis[0]){
  if(p.dead||G.tutorial)return null;
  const pads=[{x:PLAYER_X,name:'HQ',kind:'hq'},...G.bunkers.filter(b=>b.owner===1).map(b=>({x:forwardPadX(b),name:'Forward pad',kind:'forward'}))];
  const pad=pads.sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  const distance=Math.abs(pad.x-p.x),direction=Math.sign(pad.x-p.x)||-1;
  const speed=clamp(170+direction*windAt(G.time)*.25,110,195);
  const seconds=distance/speed+Math.max(0,GROUND-22-p.y)/110+5;
  const fuel=seconds*FUEL_BURN*(1+speed/430),warning=p.fuel<=fuel+8;
  return {...pad,distance,seconds,fuel,warning,label:`${direction<0?'◀':'▶'} ${pad.name} ${Math.round(distance)}m · ~${Math.ceil(fuel)}% fuel${warning?' · RETURN':''}`};
}
function unitGroup(u){return ['INF','ENG'].includes(u.type)?'infantry':u.type==='TANK'?'armor':'support';}
function selectGroup(group){if(['all','infantry','armor','support'].includes(group))G.group=group;}
function cycleGroup(){const groups=['all','infantry','armor','support'];selectGroup(groups[(groups.indexOf(G.group)+1)%groups.length]);}
function activeOrder(){
  if(G.group!=='all')return G.groupOrders[G.group];
  const orders=Object.values(G.groupOrders),first=orders[0];
  return orders.every(order=>order.mode===first.mode&&(order.mode!=='rally'||order.x===first.x))?first:{mode:'mixed'};
}
function orderFor(u){return G.groupOrders[unitGroup(u)]||G.orders;}
function formationRank(u){return {TANK:4,INF:3,ENG:3,AA:2,VAN:1}[u.type];}
// Escorts stop to fight short of the opposing HQ, so a Van inside its final run leaves formation and may pass them.
const VAN_DASH=680;
function vanDash(u){return u.type==='VAN'&&(u.side>0?ENEMY_X-70-u.x:u.x-(PLAYER_X+70))<VAN_DASH;}
// The escort setting is the player's; the enemy column always keeps formation.
function formationOn(side){return side!==1||G.formation;}
function canPass(u,o){return u.side===o.side&&(vanDash(u)||formationOn(u.side)&&formationRank(u)>formationRank(o)&&!(u.side===1&&orderFor(u).mode!=='advance'));}
function convoyMovement(u){
  if(vanDash(u)||!formationOn(u.side)||u.type==='TANK'||u.type==='ENG')return {move:true,dir:u.side};
  const allies=G.units.filter(o=>o!==u&&o.side===u.side&&!o.rescue&&!o.pilot&&o.type!=='ENG'&&(u.side===1||o.aiReleased));
  const tanks=allies.filter(o=>o.type==='TANK');
  const escorts=tanks.length?tanks:allies.filter(o=>o.type==='INF'||o.type==='AA');
  if(!escorts.length)return {move:u.type!=='VAN',dir:u.side};
  const lead=escorts.reduce((a,b)=>a.x*u.side>b.x*u.side?a:b);
  if(!tanks.length&&u.type!=='VAN')return {move:true,dir:u.side};
  const gap=(lead.x-u.x)*u.side,spacing={INF:65,AA:125,VAN:210}[u.type]||65;
  return {move:gap>spacing,dir:u.side,speed:Math.min(UT[u.type].spd,UT[lead.type].spd+Math.max(0,gap-spacing-20)*.2)};
}
function enemyMovement(u){
  if(u.type==='ENG'){
    const target=G.turrets.filter(t=>(t.side!==-1||t.hp<t.maxhp)&&Math.abs(t.x-u.x)<1400).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x))[0];
    if(target)return {move:Math.abs(target.x-u.x)>45,dir:Math.sign(target.x-u.x)||-1};
  }
  if(!u.aiReleased)return {move:false,dir:-1};
  return convoyMovement(u);
}
function radio(message){if(G.time<G.radioUntil)return;G.radio={text:message,until:G.time+5};G.radioUntil=G.time+9;SFX.blip();}
function updateOperations(dt){
  const waiting=G.units.filter(u=>u.side===-1&&!u.aiReleased&&u.type!=='ENG');
  G.enemyMuster=waiting.length?G.enemyMuster+dt:0;
  if(waiting.length&&((waiting.some(u=>u.type==='TANK')&&waiting.some(u=>u.type==='AA')&&waiting.filter(u=>u.type==='INF').length>=3)||G.enemyMuster>45)){
    waiting.forEach(u=>u.aiReleased=true);G.enemyMuster=0;radio('RADIO · Enemy column advancing');
  }
  const p=G.helis[0];
  if(!p.dead&&p.service==='hq'){
    const manifest=cargoManifest(p),pilots=manifest.filter(c=>c.pilot).length;
    if(pilots){p.cargoUnits=manifest.filter(c=>!c.pilot);p.cargo=p.cargoUnits.length;selectCargo(0);G.funds+=pilots*150;G.score+=pilots*250;G.stats.pilotsRescued+=pilots;radio('RESCUE · Pilot home · $150 recovery bonus');}
  }
  if(G.radio&&G.time>G.radio.until)G.radio=null;
}
function canBailout(){const p=G.helis[0];return G.state==='play'&&!G.tutorial&&!p.dead&&p.hp<=35&&p.y<GROUND-130&&G.lives>1;}
function bailout(){
  if(!canBailout())return false;
  const p=G.helis[0],x=p.x,y=p.y,vx=p.vx;
  while(p.cargo)troopTransfer(p,true);
  const pilot=spawnUnit(1,'INF');G.units.splice(G.units.indexOf(pilot),1);
  Object.assign(pilot,{x,y:y+20,vx:vx*.5,vy:70,pilot:true,chuteAge:0});G.paratroopers.push(pilot);
  hurtHeli(p,10000,{x,y,cause:'Pilot bailed out'});p.respawn=5;G.academyEvents.bailout=true;
  radio('MAYDAY · Pilot under canopy · Recover on your next helicopter');return true;
}
function recoveryMarker(){
  const pilot=G.units.find(u=>u.pilot)||G.paratroopers.find(u=>u.pilot);
  if(!pilot||G.replayView)return;
  const x=clamp(pilot.x-G.camX,30,W-30),y=(pilot.y??GROUND)-48;
  cx.save();cx.fillStyle='#eacb8c';cx.font='10px monospace';cx.textAlign='center';cx.fillText('✚ DOWNED PILOT',x,y);cx.restore();
}

function startAcademy(){
  startTutorial();G.tutorial={advanced:true,step:0};G.environment={weather:'clear',night:false};
  G.bunkers=[];G.turrets=[{x:1080,y:GROUND-22,type:'TURRET',side:0,hp:0,maxhp:100,cd:1}];
  const p=G.helis[0];Object.assign(p,{x:650,y:GROUND-22});
  const engineer=spawnUnit(1,'ENG');engineer.x=630;const infantry=spawnUnit(1,'INF');infantry.x=610;
}
function academyHint(){
  return [
    '1/5 · Land at 650m; board both troops',
    TOUCH.active?'2/5 · Climb above 130m; COMMAND → select ENG → Deploy selected near 1050m':'2/5 · Climb >130m; Q: engineer · F: drop near 1050m',
    '3/5 · Engineer: land and capture turret at 1080m',
    '4/5 · Let the engineer finish repairing the turret',
    TOUCH.active?'5/5 · COMMAND → select Armor → Hold, then Rally at helicopter':'5/5 · Tab: Armor · X: Hold · V: Rally'
  ][G.tutorial.step];
}
function updateAcademy(){
  const t=G.tutorial,p=G.helis[0],turret=G.turrets[0];
  if(t.step===0&&cargoManifest(p).some(c=>c.type==='ENG')&&p.cargo>=2)t.step=1;
  if(t.step===1&&G.academyEvents.engineerDrop)t.step=2;
  if(t.step===2&&turret.side===1)t.step=3;
  if(t.step===3&&turret.hp>=100){t.step=4;const tank=spawnUnit(1,'TANK');tank.x=800;}
  if(t.step===4&&G.academyEvents.armorHold&&G.academyEvents.armorRally)endGame(true,'FLIGHT ACADEMY COMPLETE');
}

// A fuselage rectangle rotates with the same pitch as its rendered sprite. Skids sit 22px below its center.
function heliBodyHit(h,x,y,padding=0){
  const dx=x-h.x,dy=y-h.y,c=Math.cos(h.pitch||0),s=Math.sin(h.pitch||0);
  return Math.abs(dx*c+dy*s-h.dir*8)<32+padding&&Math.abs(-dx*s+dy*c-3)<12+padding;
}
function heliCableHit(h,b){
  const pitch=h.pitch||0,halfWidth=Math.abs(Math.cos(pitch))*32+Math.abs(Math.sin(pitch))*12;
  return Math.abs(h.x+h.dir*8-b.x)<halfWidth&&h.y+15>BALLOON_Y+20&&h.y-12<GROUND-26;
}
function drawWeather(){
  if(G.environment?.weather!=='rain')return;
  cx.save();cx.fillStyle='rgba(111,132,142,.13)';cx.fillRect(0,0,W,GROUND);
  const wind=windAt(G.time),count=TOUCH.active?65:160;
  cx.strokeStyle='rgba(197,215,215,.23)';cx.lineWidth=.8;cx.beginPath();
  for(let i=0;i<count;i++){
    const x=((hash(i+301)*W+G.time*wind*2-G.camX*.1)%W+W)%W,y=(hash(i+812)*GROUND+G.time*440)%GROUND;
    cx.moveTo(x,y);cx.lineTo(x+wind*.06,y+14);
  }cx.stroke();
  for(let i=Math.floor(G.camX/110);i<(G.camX+W)/110;i++){
    const x=i*110+hash(i+77)*45-G.camX;
    cx.fillStyle='rgba(168,191,187,.18)';cx.beginPath();cx.ellipse(x,GROUND+4+hash(i)*20,12+hash(i+6)*24,1.3,0,0,7);cx.fill();
  }cx.restore();
}
function drawNight(){
  if(!G.environment?.night)return;
  cx.save();
  const darkness=cx.createLinearGradient(0,0,0,GROUND);
  darkness.addColorStop(0,'rgba(4,11,29,.94)');darkness.addColorStop(.45,'rgba(7,17,34,.80)');darkness.addColorStop(1,'rgba(5,13,28,.52)');
  cx.fillStyle=darkness;cx.fillRect(0,0,W,H);
  if(G.environment.weather!=='rain'){
    cx.fillStyle='rgba(192,213,222,.48)';for(let i=0;i<32;i++)cx.fillRect(hash(i+411)*W,110+hash(i+731)*115,1,1);
  }
  // Local light pools keep near-field hazards visible without illuminating the entire map.
  cx.globalCompositeOperation='screen';
  function light(x,y,r,color){const glow=cx.createRadialGradient(x,y,1,x,y,r);glow.addColorStop(0,color);glow.addColorStop(1,'rgba(120,160,175,0)');cx.fillStyle=glow;cx.fillRect(x-r,y-r,r*2,r*2);}
  for(const h of G.helis){
    if(h.dead||!onScreen(h.x))continue;const x=h.x-G.camX,tx=x+h.dir*100;
    cx.fillStyle='rgba(171,204,201,.055)';cx.beginPath();cx.moveTo(x+h.dir*24,h.y+6);cx.lineTo(tx+125,GROUND);cx.lineTo(tx-125,GROUND);cx.closePath();cx.fill();light(tx,GROUND,155,'rgba(179,203,183,.23)');
    light(x-h.dir*42,h.y+3,10,h.side===1?'rgba(95,240,169,.55)':'rgba(255,100,70,.55)');
  }
  const pads=[PLAYER_X,ENEMY_X,...G.bunkers.filter(b=>b.owner===1).map(forwardPadX)];
  for(const wx of pads){const x=wx-G.camX;if(x<-180||x>W+180)continue;light(x,GROUND,95,'rgba(178,197,144,.20)');for(const dx of [-45,-30,30,45]){cx.fillStyle='#bbdbb2';cx.fillRect(x+dx,GROUND-3,3,2);}}
  for(const t of G.turrets){if(t.hp<=0||!onScreen(t.x))continue;const x=t.x-G.camX,angle=-Math.PI/2+Math.sin(G.time*.45+t.x)*.8;
    cx.fillStyle='rgba(187,203,196,.045)';cx.beginPath();cx.moveTo(x,GROUND-22);cx.lineTo(x+Math.cos(angle-.16)*400,GROUND-22+Math.sin(angle-.16)*400);cx.lineTo(x+Math.cos(angle+.16)*400,GROUND-22+Math.sin(angle+.16)*400);cx.closePath();cx.fill();}
  for(const u of G.units)if(u.fireFlash>0)light(u.x-G.camX,GROUND-18,60,'rgba(255,179,95,.4)');
  for(const part of G.parts)if(part.add&&onScreen(part.x))light(part.x-G.camX,part.y,Math.min(80,(part.s||4)*5),'rgba(239,158,82,.13)');
  cx.restore();
}
function drawOperationsUI(){
  if(TOUCH.active)return;cx.save();
  if(G.state==='menu'){
    experienceButton('resume',PROGRESS.checkpoint===null?'No checkpoint yet':`Resume mission ${PROGRESS.checkpoint+1} [U]`,190,650,210,resumeCampaign);
    experienceButton('academy','Flight academy [Y]',412,650,210,startAcademy);
    experienceButton('weather','Weather: '+weatherLabel(),634,650,210,cycleWeather);
    experienceButton('night',SETTINGS.night?'Night operations':'Day operations',856,650,210,toggleNight,SETTINGS.night);
    if(PROGRESS.sessionOnly){cx.font='10px monospace';cx.fillStyle='#e1bf89';cx.textAlign='center';cx.fillText('Browser storage unavailable · checkpoints last only in this tab',W/2,698);}
  }else if(G.state==='play'&&!G.paused){
    if(!G.tutorial||G.tutorial.advanced){
      for(const [i,group] of ['all','infantry','armor','support'].entries())experienceButton('group_'+group,group==='all'?'All [Tab]':group[0].toUpperCase()+group.slice(1),424+i*109,70,102,()=>selectGroup(group),G.group===group);
    }
    const nav=returnGuidance();
    if(nav){cx.font='11px monospace';cx.textAlign='left';cx.fillStyle=nav.warning?'#f3c38a':'#aebdac';cx.fillStyle='rgba(10,23,29,.85)';cx.fillRect(15,137,370,23);cx.fillStyle=nav.warning?'#f3c38a':'#becbb8';cx.fillText(nav.label,24,152);}
    if(G.radio){cx.font='10px monospace';cx.textAlign='center';cx.fillStyle='#d5caaa';cx.fillText(G.radio.text,W/2,113);}
    if(canBailout())experienceButton('bailout','Bail out [J]',20,166,130,bailout);
  }else if(G.paused){experienceButton('formation','Convoy escorts: '+(G.formation?'On':'Off'),490,468,300,()=>G.formation=!G.formation);}
  cx.restore();
}
initOperations(G);
