const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const source=readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function mobile(){
 const nodes=new Map(),events=new Map(),docEvents=new Map();
 const noop=()=>{},gradient={addColorStop:noop};
 const ctx=new Proxy({measureText:t=>({width:t.length*6}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]||noop});
 class Element{
  constructor(id=''){this.id=id;this.style={};this.handlers=new Map();this.captures=new Set();this.children=[];this.textContent='';this.hidden=false;this.disabled=false;this.classes=new Set();
   this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};
  }
  set innerHTML(html){for(const [,id] of html.matchAll(/id="([^"]+)"/g))if(!nodes.has(id))nodes.set(id,new Element(id));}
  append(child){this.children.push(child);if(child.id)nodes.set(child.id,child);}
  setAttribute(){}
  getContext(){return ctx;}
  querySelector(selector){if(!this.small)this.small=new Element();return this.small;}
  addEventListener(type,fn){if(!this.handlers.has(type))this.handlers.set(type,[]);this.handlers.get(type).push(fn);}
  dispatchEvent(e){for(const fn of this.handlers.get(e.type)||[])fn(e);}
  setPointerCapture(id){this.captures.add(id);}
  hasPointerCapture(id){return this.captures.has(id);}
  releasePointerCapture(id){this.captures.delete(id);this.dispatchEvent({type:'lostpointercapture',pointerId:id});}
  getBoundingClientRect(){return this.id==='flight-stick'?{left:24,top:246,width:124,height:124,right:148,bottom:370}:{left:670,top:200,width:80,height:100,right:750,bottom:300};}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
 const document={body:new Element(),hidden:false,getElementById:get,createElement:()=>new Element(),addEventListener:(type,fn)=>docEvents.set(type,fn)};
 const sandbox={document,Image:class{},addEventListener:(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},requestAnimationFrame:noop,performance:{now:()=>0},location:{search:'?touch=1'},URLSearchParams,matchMedia:()=>({matches:true}),innerWidth:844,innerHeight:390,setTimeout:noop,window:{},Math,assert,
  emit:(id,type,pointerId=1,x=710,y=240)=>get(id).dispatchEvent({type,pointerId,clientX:x,clientY:y,preventDefault:noop,detail:1}),
  globalEvent:type=>{for(const fn of events.get(type)||[])fn();},docEvent:type=>docEvents.get(type)(),node:get};
 vm.createContext(sandbox);vm.runInContext(source+'\nASSETS_OK=true;AUDIO_MUTED=true;ac=()=>({state:"running"});',sandbox);
 vm.runInContext(readFileSync('mobile.js','utf8'),sandbox);
 return code=>vm.runInContext(code,sandbox);
}
test('two pointers can steer and shoot; releasing stick does not release gun',()=>mobile()(`
 emit('m-primary','click');assert.equal(G.state,'play');
 emit('flight-stick','pointerdown',1,117,303);emit('touch-fire','pointerdown',2);
 assert.ok(TOUCH.x>.5);assert.equal(TOUCH.fire,true);update(.016);assert.ok(G.bullets.length>0);
 emit('flight-stick','pointerup',1);assert.equal(TOUCH.x,0);assert.equal(TOUCH.fire,true);
 emit('touch-fire','pointerup',2);assert.equal(TOUCH.fire,false);
`));
test('bomb releases once, while pointer cancel and dragging off cancel safely',()=>mobile()(`
 emit('m-primary','click');emit('touch-bomb','pointerdown',3);assert.equal(G.bombAiming,true);
 emit('touch-bomb','pointerup',3);assert.equal(G.bombs.length,1);
 emit('touch-bomb','pointerup',3);assert.equal(G.bombs.length,1);
 G.helis[0].cdBomb=0;emit('touch-bomb','pointerdown',4);emit('touch-bomb','pointercancel',4);
 assert.equal(G.bombAiming,false);assert.equal(G.bombs.length,1);
 emit('touch-bomb','pointerdown',5);emit('touch-bomb','pointerup',5,400,100);assert.equal(G.bombs.length,1);
`));
test('reinforcement tray cancels held weapons, pauses, purchases and resumes',()=>mobile()(`
 emit('m-primary','click');emit('touch-fire','pointerdown',1);emit('touch-bomb','pointerdown',2);
 emit('m-units','click');assert.equal(G.paused,true);assert.equal(TOUCH.fire,false);assert.equal(G.bombAiming,false);
 const count=G.units.length;node('m-unit-list').children[0].dispatchEvent({type:'click'});
 assert.equal(G.units.length,count+1);assert.equal(G.funds,280);
 emit('m-primary','click');assert.equal(G.paused,false);assert.equal(G.bombs.length,0);
`));
test('rotation and backgrounding clear touches and require explicit resume',()=>mobile()(`
 emit('m-primary','click');emit('touch-bomb','pointerdown',3);emit('touch-fire','pointerdown',4);
 innerWidth=390;innerHeight=844;globalEvent('resize');assert.equal(G.paused,true);
 assert.equal(TOUCH.fire,false);assert.equal(G.bombAiming,false);assert.equal(node('m-rotate').hidden,false);
 innerWidth=844;innerHeight=390;globalEvent('resize');assert.equal(G.paused,true);
 emit('touch-bomb','pointerup',3);assert.equal(G.bombs.length,0);
 emit('m-primary','click');assert.equal(G.paused,false);
 emit('touch-fire','pointerdown',4);document.hidden=true;docEvent('visibilitychange');
 assert.equal(G.paused,true);assert.equal(TOUCH.fire,false);
`));
test('hover assistance holds altitude with fuel but cannot hover with an empty tank',()=>mobile()(`
 emit('m-primary','click');const p=G.helis[0];const y=p.y;
 for(let i=0;i<60;i++)update(1/60);assert.ok(Math.abs(p.y-y)<.001);
 p.fuel=0;p.reserve=0;for(let i=0;i<60;i++)update(1/60);assert.ok(p.y>y+1);
`));
test('mobile UI renders mission, pause, cargo and debrief states',()=>mobile()(`
 TOUCH.render();assert.equal(node('m-title').textContent,'RESCUE RAIDERS');emit('m-primary','click');
 G.helis[0].y=GROUND-30;G.helis[0].cargo=3;TOUCH.render();assert.equal(node('touch-cargo').hidden,false);
 emit('m-pause','click');TOUCH.render();assert.equal(node('m-controls').hidden,true);
 G.state='win';TOUCH.render();assert.equal(node('m-title').textContent,'Mission accomplished');
`));
test('captured instant-action buttons remain enabled through pointer release',()=>mobile()(`
 emit('m-primary','click');Object.assign(G.helis[1],{x:500,y:300});
 emit('touch-missile','pointerdown',6);TOUCH.render();assert.equal(node('touch-missile').disabled,false);
 emit('touch-missile','pointerup',6);TOUCH.render();assert.equal(node('touch-missile').disabled,true);
 G.helis[0].cdMis=0;TOUCH.render();emit('touch-missile','pointerdown',7);
 assert.equal(G.missiles.length,2);
`));
test('mobile difficulty and training selection configure the next sortie',()=>mobile()(`
 node('m-options').children[0].dispatchEvent({type:'click'});emit('m-primary','click');
 assert.equal(G.difficulty,'recruit');assert.equal(G.funds,450);
 G.state='menu';emit('m-tutorial','click');assert.ok(G.tutorial);TOUCH.render();
 assert.equal(node('m-training').hidden,false);assert.ok(node('m-training').textContent.startsWith('1/4'));
`));
test('mobile routine messages stay quiet while van ETA and reserve remain visible',()=>mobile()(`
 emit('m-primary','click');buy(1,'INF');TOUCH.render();assert.equal(node('m-notice').hidden,true);
 const v=spawnUnit(-1,'VAN');v.x=PLAYER_X+70+UT.VAN.spd*20;TOUCH.render();
 assert.equal(node('m-van').textContent,'HQ breach ~0:20');assert.equal(node('m-van').hidden,false);
 G.helis[0].fuel=0;G.helis[0].reserve=12;TOUCH.render();assert.ok(node('m-notice').textContent.includes('RESERVE 12s'));
`));
test('mobile engineers can be bought and passengers parachuted at altitude',()=>mobile()(`
 emit('m-primary','click');emit('m-units','click');
 const buttons=node('m-unit-list').children;assert.equal(buttons.length,5);
 buttons[4].dispatchEvent({type:'click'});assert.equal(G.units[0].type,'ENG');
 const p=G.helis[0];p.cargo=2;p.y=300;G.paused=false;TOUCH.render();
 assert.equal(node('touch-cargo').hidden,false);assert.equal(node('touch-cargo').textContent,'Parachute 1');
`));
