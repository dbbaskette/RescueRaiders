// Touch presentation and pointer ownership are isolated from keyboard controls.
(() => {
  const query=new URLSearchParams(location.search);
  const coarse=matchMedia('(pointer: coarse)');
  TOUCH.active=query.get('touch')==='1'||coarse.matches;
  if(!TOUCH.active)return;
  document.body.classList.add('touch-mode');
  const root=document.createElement('div');root.id='mobile-ui';
  root.innerHTML=`
    <div class="topbar">
      <div class="status">
        <div class="meter"><span>HULL</span><div class="track"><i id="m-hull"></i></div><b id="m-hull-value"></b></div>
        <div class="meter"><span>FUEL</span><div class="track"><i id="m-fuel"></i></div><b id="m-fuel-value"></b></div>
        <footer><strong id="m-funds"></strong><span id="m-lives"></span></footer><div id="m-van" hidden></div><div id="m-navigation" hidden></div>
      </div>
      <div class="radar-stack"><button class="radar-button" id="m-radar" aria-label="Radar: tap to scan a sector"><canvas id="touch-radar" width="340" height="74"></canvas></button>
        <div class="notice" id="m-notice" hidden></div>
      </div>
      <div class="top-actions"><button id="m-units">COMMAND</button><button id="m-audio" aria-label="Mute sound">SOUND</button><button id="m-pause" aria-label="Pause game">Ⅱ</button></div>
    </div>
    <div id="m-training" hidden></div>
    <div class="flight-controls" id="m-controls">
      <div id="flight-stick" role="group" aria-label="Flight joystick: drag to steer"><span class="stick-label">FLIGHT</span><div id="stick-knob"></div></div>
      <div class="weapons">
        <button id="touch-bomb" aria-label="Hold to preview bomb, release to drop">BOMB<small></small></button>
        <button id="touch-missile" aria-label="Launch missile">MISSILE<small></small></button>
        <button id="touch-fire" aria-label="Hold to fire gun">FIRE</button>
        <button id="touch-flare" aria-label="Deploy flares">FLARE<small></small></button>
        <button id="cancel-bomb" hidden>Cancel bomb</button>
      </div>
      <button id="touch-cargo" hidden></button>
    </div>
    <section class="modal" id="m-modal" role="dialog" aria-modal="true" aria-labelledby="m-title" hidden>
      <div class="panel"><p class="eyebrow">RESCUE RAIDERS / FIELD COMMAND</p><h1 id="m-title"></h1>
        <p class="description" id="m-description"></p>
        <div class="difficulty-options" id="m-options" role="group" aria-label="Difficulty"></div>
        <div class="command-row" id="m-operations-menu"><button id="m-quick">Quick battle</button><button id="m-resume">Resume campaign</button><button id="m-academy">Flight academy</button><button id="m-combat">Combat school</button><button id="m-weather">Weather</button><button id="m-night">Day / night</button><button id="m-fullscreen">Fullscreen</button></div>
        <div class="units" id="m-unit-list" hidden></div>
        <div id="m-command" hidden>
          <div class="command-row" aria-label="Select command group"><button id="m-group-all">All</button><button id="m-group-infantry">Infantry</button><button id="m-group-armor">Armor</button><button id="m-group-support">Support</button></div>
          <div class="command-row" role="group" aria-label="Ground force orders"><button id="m-advance">Advance</button><button id="m-hold">Hold</button><button id="m-rally">Rally at helicopter</button></div>
          <div class="cargo-row" id="m-cargo-seats" role="group" aria-label="Select passenger"></div>
          <div class="command-row"><button id="m-drop-selected">Deploy selected</button><button id="m-shake">Camera shake</button><button id="m-formation">Convoy escorts</button><button id="m-bailout">Bail out</button></div>
        </div>
        <p class="tray-status" id="m-tray-status" role="status" hidden></p>
        <div class="panel-actions"><button class="primary" id="m-primary"></button><button id="m-restart" hidden>Restart mission</button><button id="m-quit" hidden>Quit to menu</button><button id="m-tutorial">Training sortie</button><button id="m-campaign">Campaign · 3 missions</button><button id="m-replay">Watch final moments</button></div>
      </div>
    </section>
    <div id="m-replay-controls" hidden><button id="m-replay-close">Back to debrief</button><button id="m-replay-speed">Slow motion</button><button id="m-replay-focus">Follow action</button></div>
    <section class="modal rotate" id="m-rotate" role="dialog" aria-modal="true" aria-label="Rotate your phone" hidden>
      <div class="panel"><p class="eyebrow">LANDSCAPE FLIGHT DECK</p><h1>Rotate to fly</h1><p class="description">Turn your phone sideways for two-thumb controls and a wider view. Your mission stays paused.</p></div>
    </section>`;
  document.body.append(root);
  const el=id=>document.getElementById(id);
  const stick=el('flight-stick'),knob=el('stick-knob');
  let stickId=null,tray=false,trayWasPaused=false,portrait=false,panelView='';
  const owners=new Map();
  function unlock(){const audio=ac();if(audio.state==='suspended')audio.resume().catch(()=>{});}
  function canFly(){return ASSETS_OK&&G.state==='play'&&!G.paused&&!G.helis[0].dead&&!portrait&&!tray;}
  function releaseCapture(node,id){if(node.hasPointerCapture(id))node.releasePointerCapture(id);}
  function reset(){
    TOUCH.x=0;TOUCH.y=0;TOUCH.fire=false;G.bombAiming=false;
    knob.style.transform='translate(0px,0px)';
    const id=stickId;stickId=null;if(id!==null)releaseCapture(stick,id);
    const held=[...owners];owners.clear();
    for(const [node,owner] of held){node.classList.remove('held');releaseCapture(node,owner);}
  }
  TOUCH.reset=reset;
  function stickMove(e){
    if(e.pointerId!==stickId)return;
    const r=stick.getBoundingClientRect(),radius=r.width*.34;
    let x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius;
    const d=Math.hypot(x,y);if(d>1){x/=d;y/=d;}
    TOUCH.x=Math.abs(x)<.08?0:x;TOUCH.y=Math.abs(y)<.08?0:y;
    knob.style.transform=`translate(${x*radius}px,${y*radius}px)`;
  }
  stick.addEventListener('pointerdown',e=>{
    if(!canFly()||stickId!==null)return;e.preventDefault();unlock();
    stickId=e.pointerId;stick.setPointerCapture(stickId);stickMove(e);
  });
  stick.addEventListener('pointermove',stickMove);
  function endStick(e){if(e.pointerId!==stickId)return;const id=stickId;stickId=null;
    TOUCH.x=TOUCH.y=0;knob.style.transform='translate(0px,0px)';releaseCapture(stick,id);}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,endStick);
  function control(id,down,up=()=>{},cancel=()=>{}){
    const node=el(id);
    node.addEventListener('pointerdown',e=>{
      if(!canFly()||owners.has(node)||node.disabled)return;e.preventDefault();unlock();
      owners.set(node,e.pointerId);node.setPointerCapture(e.pointerId);node.classList.add('held');down();
    });
    function finish(e){
      if(owners.get(node)!==e.pointerId)return;
      owners.delete(node);node.classList.remove('held');releaseCapture(node,e.pointerId);
      const r=node.getBoundingClientRect();
      const inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
      if(e.type==='pointerup'&&inside&&canFly())up();else cancel();
    }
    for(const event of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(event,finish);
  }
  control('touch-fire',()=>TOUCH.fire=true,()=>TOUCH.fire=false,()=>TOUCH.fire=false);
  control('touch-bomb',()=>onKey('KeyB'),()=>onKeyUp('KeyB'),()=>G.bombAiming=false);
  control('touch-missile',()=>onKey('KeyM'));
  control('touch-flare',()=>onKey('KeyC'));
  el('touch-cargo').addEventListener('click',()=>{if(canFly()){unlock();onKey('KeyE');}});
  el('cancel-bomb').addEventListener('click',()=>G.bombAiming=false);
  el('m-audio').addEventListener('click',()=>{unlock();toggleAudio();});
  el('m-pause').addEventListener('click',()=>{if(G.state==='play'){reset();G.paused=true;tray=false;}});
  el('m-units').addEventListener('click',()=>{
    if(G.state!=='play')return;unlock();trayWasPaused=G.paused;reset();G.paused=true;tray=true;
    el('m-tray-status').textContent='Choose reinforcements. Flight is paused.';
  });
  el('m-primary').addEventListener('click',()=>{
    if(portrait||!ASSETS_OK)return;unlock();reset();
    if(tray){tray=false;G.paused=trayWasPaused;}
    else if(G.state==='play')G.paused=false;
    else nextSortie();
  });
  el('m-campaign').addEventListener('click',()=>{if(portrait)return;unlock();reset();tray=false;startCampaign();});
  el('m-replay').addEventListener('click',()=>{if(portrait)return;reset();startReplay();});
  el('m-replay-close').addEventListener('click',stopReplay);
  el('m-replay-speed').addEventListener('click',toggleReplaySpeed);
  el('m-replay-focus').addEventListener('click',toggleReplayFocus);
  el('m-resume').addEventListener('click',()=>{if(!portrait){unlock();tray=false;resumeCampaign();}});
  el('m-academy').addEventListener('click',()=>{if(!portrait){unlock();tray=false;startAcademy();}});
  el('m-combat').addEventListener('click',()=>{if(!portrait){unlock();tray=false;startCombatSchool();}});
  el('m-quick').addEventListener('click',()=>{if(portrait||!ASSETS_OK)return;unlock();reset();tray=false;startQuickBattle();});
  el('m-quit').addEventListener('click',()=>{if(portrait)return;reset();tray=false;quitToMenu();});
  el('m-fullscreen').addEventListener('click',toggleFullscreen);
  el('m-weather').addEventListener('click',cycleWeather);
  el('m-night').addEventListener('click',toggleNight);
  el('m-formation').addEventListener('click',()=>G.formation=!G.formation);
  el('m-bailout').addEventListener('click',()=>{if(tray&&bailout()){tray=false;G.paused=false;}});
  for(const group of ['all','infantry','armor','support'])el('m-group-'+group).addEventListener('click',()=>{if(tray)selectGroup(group);});
  for(const mode of ['advance','hold','rally'])el('m-'+mode).addEventListener('click',()=>{if(tray)setOrder(mode);});
  el('m-shake').addEventListener('click',cycleShake);
  el('m-drop-selected').addEventListener('click',()=>{const p=G.helis[0];if(tray&&!p.dead&&p.cargo){troopTransfer(p,true);el('m-tray-status').textContent='Passenger deployed. Resume flight when ready.';}});
  const cargoButtons=[];
  for(let i=0;i<4;i++){const button=document.createElement('button');button.addEventListener('click',()=>selectCargo(i));el('m-cargo-seats').append(button);cargoButtons.push(button);}
  el('m-restart').addEventListener('click',()=>{if(portrait)return;unlock();tray=false;restartMission();});
  el('m-tutorial').addEventListener('click',()=>{if(portrait||!ASSETS_OK)return;unlock();tray=false;startTutorial();});
  const difficultyButtons=[];
  for(const [id,mode] of Object.entries(DIFFICULTIES)){
    const button=document.createElement('button');button.textContent=mode.name;
    button.title=`$${mode.funds} starting funds · ${Math.round(mode.damage*100)}% incoming hull damage · enemy orders every ${mode.interval}s`;
    button.addEventListener('click',()=>{if(G.state!=='play')setDifficulty(id);});
    el('m-options').append(button);difficultyButtons.push({button,id});
  }
  const icons={ENG:'M12 2h9v3h3v3H9V5h3z M12 10h9v9h-3v5h-3v-5h-3z M23 11h8v3h-8z',INF:'M14 2h5v5h-5z M12 9h9v9h-3v6h-3v-6h-3z M20 10h9v3h-9z',TANK:'M2 17h30v6H2z M6 11h22v6H6z M12 6h12v5H12z M21 7h12v3H21z',AA:'M2 17h30v6H2z M8 12h17v5H8z M14 12l9-11 3 2-9 11z M20 12l9-11 3 2-9 11z',VAN:'M2 8h22v11H2z M24 12h7v7h-7z M6 19h5v5H6z M23 19h5v5h-5z'};
  const unitButtons=[];
  for(const [type,name] of [['INF','Infantry'],['TANK','Tank'],['AA','AA truck'],['VAN','Demo van'],['ENG','Engineer']]){
    const button=document.createElement('button');button.type='button';
    button.innerHTML=`<svg viewBox="0 0 34 26" aria-hidden="true"><path d="${icons[type]||icons.INF}"/></svg>${name}<small></small>`;
    button.setAttribute('aria-label',`Deploy ${name}`);
    button.addEventListener('click',()=>{
      if(!tray||portrait||G.state!=='play')return;unlock();const before=G.units.length;buy(1,type);
      el('m-tray-status').textContent=G.units.length>before?`${name} deployed. $${G.funds} remaining.`:G.msgs[0]?.text||'Cannot deploy.';
    });
    el('m-unit-list').append(button);unitButtons.push({button,type});
  }
  function orientation(){
    const next=innerHeight>innerWidth;
    if(next!==portrait){reset();if(G.state==='play')G.paused=true;}
    portrait=next;el('m-rotate').hidden=!portrait;
  }
  addEventListener('resize',orientation);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){reset();if(G.state==='play')G.paused=true;}});
  el('m-radar').addEventListener('click',e=>{
    if(!canFly())return;const r=el('m-radar').getBoundingClientRect();
    const fraction=e.detail===0?.5:clamp((e.clientX-r.left)/r.width,0,1);
    G.camX=clamp(fraction*WORLD-W/2,0,WORLD-W);G.scanTimer=2.5;
  });
  const radar=el('touch-radar').getContext('2d');
  function drawRadar(){
    const r=radar,mx=x=>x/WORLD*340;r.clearRect(0,0,340,74);
    r.strokeStyle='#284a50';r.lineWidth=1;for(let x=0;x<340;x+=56)r.strokeRect(x,0,56,74);
    for(const t of G.turrets){r.fillStyle=t.side===1?'#72d7c0':t.side===-1?'#f48277':'#8b959e';r.fillRect(mx(t.x)-2,64,4,5);}
    for(const b of G.bunkers){const x=mx(b.x);r.fillStyle=b.owner===1?'#7cd6b0':'#fa8278';
      r.fillRect(x-3,60,6,7);
      if(!b.balloonDead&&!b.cableBroken){r.fillRect(x,16,1,43);r.beginPath();r.arc(x,13,3,0,7);r.fill();}
      if(b.owner===1){r.fillRect(x+5,56,7,2);r.fillRect(x+7,54,2,6);}
    }
    for(const u of G.units){if(radarJammed()&&u.side!==1)continue;const x=mx(u.x);r.fillStyle=u.side===1?'#76cbbb':'#f98477';
      if(u.type==='VAN'){r.globalAlpha=.65+.35*Math.sin(G.anim*8)**2;r.beginPath();r.moveTo(x+u.side*6,58);r.lineTo(x-u.side*4,52);r.lineTo(x-u.side*4,64);r.closePath();r.fill();r.globalAlpha=1;}
      else r.fillRect(x-1,61,3,3);
    }
    for(const h of G.helis)if(!h.dead&&(!radarJammed()||h.side===1)){const x=mx(h.x),y=clamp(h.y/GROUND*56,5,56);
      r.strokeStyle=h.side===1?'#fff':'#ff9682';r.beginPath();r.arc(x,y,4,0,7);r.moveTo(x-7,y);r.lineTo(x+7,y);r.stroke();}
    if(radarJammed()){r.fillStyle='#ffd070';r.font='bold 11px '+FONT;r.fillText('JAMMED',140,12);}
    r.strokeStyle='#cbe7de88';r.strokeRect(mx(G.camX),1,W/WORLD*340,71);
  }
  function text(id,value){const node=el(id);if(node.textContent!==value)node.textContent=value;}
  TOUCH.render=()=>{
    el('m-replay-controls').hidden=!G.replay||portrait;
    text('m-replay-speed',G.replay?.speed===.35?'Speed: 0.35×':'Speed: 1×');
    text('m-replay-focus',G.replay?.follow?'Following '+G.replay.focus.label:'Original camera');
    if(G.replay){el('m-modal').hidden=true;el('m-controls').hidden=true;root.querySelector('.topbar').inert=true;el('m-training').hidden=true;return;}
    const p=G.helis[0],menu=G.state!=='play'||G.paused||tray||!ASSETS_OK;
    const view=menu?(tray?'command':G.state):'';
    if(view!==panelView){el('m-modal').querySelector('.panel').scrollTop=0;panelView=view;}
    if(menu||p.dead||portrait){if(TOUCH.fire||TOUCH.x||TOUCH.y||G.bombAiming||owners.size)reset();}
    root.querySelector('.topbar').inert=menu||portrait;
    el('m-controls').hidden=menu||p.dead||portrait;
    el('m-modal').hidden=!menu||portrait;
    el('m-command').hidden=!tray;
    el('m-campaign').hidden=G.state!=='menu'||tray;
    el('m-replay').hidden=!['win','over'].includes(G.state)||G.replayFrames.length<2;
    text('m-shake','Shake: '+shakeLabel());
    el('m-operations-menu').hidden=G.state!=='menu'||tray;
    el('m-resume').disabled=PROGRESS.checkpoint===null;
    text('m-resume',PROGRESS.checkpoint===null?'No checkpoint yet':'Resume mission '+(PROGRESS.checkpoint+1));
    text('m-weather','Weather: '+weatherLabel());text('m-night',SETTINGS.night?'Night operations':'Day operations');
    text('m-formation','Escorts: '+(G.formation?'On':'Off'));el('m-bailout').disabled=!canBailout();
    el('m-bailout').title='Requires hull at 35% or less, altitude above 130m and a spare helicopter';
    for(const group of ['all','infantry','armor','support']){el('m-group-'+group).classList.toggle('selected',G.group===group);el('m-group-'+group).setAttribute('aria-pressed',String(G.group===group));}
    const navigation=returnGuidance();el('m-navigation').hidden=!navigation||menu||portrait;
    text('m-navigation',navigation?navigation.label:'');el('m-navigation').classList.toggle('urgent',!!navigation?.warning);
    for(const mode of ['advance','hold','rally']){el('m-'+mode).classList.toggle('selected',activeOrder().mode===mode);el('m-'+mode).setAttribute('aria-pressed',String(activeOrder().mode===mode));}
    const manifest=cargoManifest(p);
    cargoButtons.forEach((button,i)=>{const c=manifest[i];button.disabled=!c;button.textContent=c?`${c.pilot?'PILOT':c.type} ${Math.ceil(c.hp/UT[c.type].hp*100)}%`:'Empty';button.classList.toggle('selected',!!c&&i===G.selectedCargo);button.setAttribute('aria-pressed',String(!!c&&i===G.selectedCargo));});
    el('m-drop-selected').disabled=!p.cargo||p.dead;
    el('m-unit-list').hidden=!tray;el('m-tray-status').hidden=!tray;
    el('m-restart').hidden=tray||G.state!=='play';el('m-quit').hidden=tray||G.state!=='play';
    el('m-quick').hidden=primarySortie().id==='quick';
    el('m-fullscreen').hidden=!fullscreenAvailable();text('m-fullscreen',isFullscreen()?'Leave fullscreen':'Fullscreen');
    el('m-primary').disabled=!ASSETS_OK;el('m-units').disabled=!!G.tutorial&&!G.tutorial.advanced;
    el('m-options').hidden=G.state==='play'||tray;el('m-tutorial').hidden=G.state==='play'||tray;
    for(const {button,id} of difficultyButtons){button.classList.toggle('selected',SETTINGS.difficulty===id);button.setAttribute('aria-pressed',String(SETTINGS.difficulty===id));}
    el('m-training').hidden=!G.tutorial||menu||portrait;text('m-training',tutorialHint());
    if(menu){
      text('m-title',!ASSETS_OK?'Loading aircraft…':tray?'Field command':G.state==='menu'?'RESCUE RAIDERS':G.state==='win'?'Mission accomplished':G.state==='over'?'Mission failed':'Flight paused');
      text('m-description',tray?`$${G.funds} · ${missionText()}`:G.state==='menu'?'Left thumb: steer. Right thumb: hold FIRE, hold and release BOMB. Capture bunkers and escort your Demo Van to enemy HQ.'+(PROGRESS.sessionOnly?' Browser storage unavailable; checkpoints last only in this tab.':''):G.state==='play'?'Your helicopter is safe while paused. Resume when you are ready.':`${G.endMsg} · Score ${G.score} · ${debriefDetails()}`);
      text('m-primary',tray?'Back to flight':G.state==='play'?'Resume flight':G.state==='menu'?primarySortie().label:sortieLabel());
    }
    for(const {button,type} of unitButtons){const active=type==='VAN'&&G.units.some(u=>u.side===1&&u.type==='VAN');button.disabled=active||G.funds<UT[type].cost;button.querySelector('small').textContent=active?'Active':`$${UT[type].cost}`;}
    for(const [name,value] of [['hull',Math.max(0,p.hp/p.maxhp*100)],['fuel',p.fuel]]){
      el(`m-${name}`).style.width=`${value}%`;el(`m-${name}`).style.background=value<(name==='fuel'?20:25)?'#ffb16f':'#8edfb1';text(`m-${name}-value`,name==='fuel'&&p.fuel<=0?`R ${Math.ceil(p.reserve)}s`:`${Math.ceil(value)}%`);
      el(`m-${name}`).classList.toggle('servicing',p.rearming);
    }
    el('m-training').hidden=(!G.tutorial&&G.campaign===null)||menu||portrait;
    text('m-training',G.tutorial?tutorialHint():missionText());
    text('m-funds',`$${G.funds}`);text('m-lives',`${G.lives} lives · ${G.score} pts`);
    text('m-audio',AUDIO_MUTED?'MUTED':'SOUND');el('m-audio').setAttribute('aria-label',AUDIO_MUTED?'Unmute sound':'Mute sound');
    el('touch-bomb').querySelector('small').textContent=G.bombAiming?`${bombGroundTime(bombFromHeli(p)).toFixed(1)}s ETA`:`${Math.floor(p.bombs)} · hold`;
    el('touch-missile').querySelector('small').textContent=`${Math.floor(p.mis)}`;
    el('touch-flare').querySelector('small').textContent=`${Math.floor(p.flares)}`;
    el('touch-missile').disabled=(p.mis<1||p.cdMis>0)&&!owners.has(el('touch-missile'));
    el('touch-flare').disabled=p.flares<1&&!owners.has(el('touch-flare'));
    const troops=G.units.filter(u=>['INF','ENG'].includes(u.type)&&u.side===1&&Math.abs(u.x-p.x)<115).length;
    el('touch-cargo').hidden=!p.cargo&&(p.y<GROUND-130||!troops);
    text('touch-cargo',p.cargo?(p.y<GROUND-130?'Parachute 1':`Drop ${p.cargo} troops`):`Board ${Math.min(4,troops)} troops`);
    el('cancel-bomb').hidden=!G.bombAiming;
    let notice='',danger=false;
    if(p.dead)notice=`Helicopter down · ${Math.max(0,Math.ceil(p.respawn))}s`;
    else if(p.hp<p.maxhp*.25){notice='CRITICAL HULL · Land at a friendly pad';danger=true;}
    else if(G.cableWarning>.05){notice='CABLE AHEAD · Climb or turn';danger=true;}
    else if(incomingMissile()){notice='INCOMING MISSILE · Deploy flares';danger=true;}
    else if(p.fuel<=0){notice=p.reserve>0?`RESERVE ${Math.ceil(p.reserve)}s · LAND`:'ENGINE OUT';danger=true;}
    else if(p.fuel<LOW_FUEL){notice='LOW FUEL · Land at a friendly pad';danger=true;}
    else if(G.bannerAlert)notice=G.bannerAlert.title;
    else if(G.radio)notice=G.radio.text;
    else if(G.msgs.some(m=>m.kind!=='routine'))notice=G.msgs.find(m=>m.kind!=='routine').text;
    else if(G.scanTimer>0)notice='Scanning · Move joystick to return';
    const threat=vanThreat();
    el('m-van').hidden=!threat||menu||portrait;
    text('m-van',threat?`HQ breach ~${formatETA(threat.seconds)}`:'');
    el('m-van').classList.toggle('urgent',!!threat&&threat.level>0);
    el('m-notice').hidden=!notice||menu||portrait;el('m-notice').classList.toggle('danger',danger);const compact=notice.startsWith('CRITICAL HULL')?'HULL CRITICAL · LAND':notice.startsWith('CABLE AHEAD')?'CABLE · CLIMB':notice.startsWith('INCOMING MISSILE')?'MISSILE · FLARE':notice.startsWith('LOW FUEL')?'LOW FUEL · LAND':notice;
    text('m-notice',compact);el('m-notice').title=notice;
    drawRadar();
  };
  orientation();TOUCH.render();
})();
