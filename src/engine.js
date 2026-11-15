// ===== Bible Arcade engine (shared by Noah's Big Boat & David & the Giant) =====
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const QS=new URLSearchParams(location.search);
const C=document.getElementById('c'),X=C.getContext('2d');
const UI=document.getElementById('ui'),CAP=document.getElementById('cap'),CARD=document.getElementById('card'),HUD=document.getElementById('hud'),FADE=document.getElementById('fade'),ROT=document.getElementById('rotate');document.getElementById('mid').appendChild(CAP);
let RS=2;// render scale (device pixels per logical px)
const G={W:320,H:180,t:0,scene:null,auto:QS.get('auto')==='1',speed:+(QS.get('speed')||1),paused:false,tilt:store.get(GAME_ID+'Tilt')==='1',tiltX:0,keys:{},ptr:{down:false,x:0,y:0},fx:[],shake:0};
function resize(){const vw=innerWidth,vh=innerHeight;ROT.classList.toggle('on',vh>vw*1.05);
 G.H=180;G.W=Math.round(Math.max(280,Math.min(420,180*vw/vh)));RS=Math.max(2,Math.min(4,vh*Math.min(2,window.devicePixelRatio||1)/180));C.width=Math.round(G.W*RS);C.height=Math.round(G.H*RS);
 const k=Math.min(1.4,Math.max(.7,vh/390));document.documentElement.style.setProperty('--k',k);if(G.scene&&G.scene.resize)G.scene.resize()}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));resize();
// ---------- helpers ----------
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
const OUT='#2b1a10';
const D={
 rr(x,y,w,h,r,f,s,lw){X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath();if(f){X.fillStyle=f;X.fill()}if(s!==0){X.lineWidth=lw||1;X.strokeStyle=s||OUT;X.stroke()}},
 ell(x,y,rx,ry,f,s,lw,rot){X.beginPath();X.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,Math.PI*2);if(f){X.fillStyle=f;X.fill()}if(s!==0){X.lineWidth=lw||1;X.strokeStyle=s||OUT;X.stroke()}},
 poly(pts,f,s,lw){X.beginPath();X.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)X.lineTo(pts[i],pts[i+1]);X.closePath();if(f){X.fillStyle=f;X.fill()}if(s!==0){X.lineWidth=lw||1;X.strokeStyle=s||OUT;X.lineJoin='round';X.stroke()}},
 line(x1,y1,x2,y2,c,lw){X.beginPath();X.moveTo(x1,y1);X.lineTo(x2,y2);X.strokeStyle=c||OUT;X.lineWidth=lw||1;X.lineCap='round';X.stroke()},
 rect(x,y,w,h,c){X.fillStyle=c;X.fillRect(x,y,w,h)},
 sky(c1,c2,c3){const g=X.createLinearGradient(0,0,0,G.H);g.addColorStop(0,c1);g.addColorStop(.6,c2);g.addColorStop(1,c3||c2);X.fillStyle=g;X.fillRect(0,0,G.W,G.H)},
 cloud(x,y,s,c,a){X.save();X.globalAlpha=a==null?1:a;const f=c||'#fff';[[0,0,12,7],[10,-4,10,8],[20,1,11,6],[-10,2,9,5]].forEach(p=>D.ell(x+p[0]*s,y+p[1]*s,p[2]*s,p[3]*s,f,0));X.restore()},
 hills(y,amp,freq,off,c,seed){X.beginPath();X.moveTo(0,G.H);for(let x=0;x<=G.W+4;x+=4){X.lineTo(x,y-amp*(Math.sin((x+off)*freq+(seed||0))*.6+Math.sin((x+off)*freq*2.3+(seed||0)*2)*.4))}X.lineTo(G.W,G.H);X.closePath();X.fillStyle=c;X.fill()},
 sun(x,y,r,c){X.save();X.globalAlpha=.25;D.ell(x,y,r*1.8,r*1.8,c||'#fff2a8',0);X.globalAlpha=1;D.ell(x,y,r,r,c||'#ffe066',0);X.restore()},
 sparkle(x,y,r,c){X.save();X.fillStyle=c||'#fff6b0';X.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.35:r;X.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}X.closePath();X.fill();X.restore()},
 shadow(x,y,w){X.save();X.globalAlpha=.22;D.ell(x,y,w,w*.28,'#000',0);X.restore()},
 spr(n,x,y,h,o){const im=IMG[n];if(!im)return;o=o||{};const w=h*im.width/im.height;X.save();X.translate(x,y);if(o.rot)X.rotate(o.rot);X.scale((o.f||1)*(o.sx||1),o.sy||1);if(o.a!=null)X.globalAlpha*=o.a;
  if(o.glow){X.shadowColor=o.glow;X.shadowBlur=(o.gb||10)*RS}if(o.filter)X.filter=o.filter;X.drawImage(im,-w*(o.ax==null?.5:o.ax),-h*(o.ay==null?1:o.ay),w,h);X.restore();return w},
 sprW(n,h){const im=IMG[n];return im?h*im.width/im.height:0},
 bg(n,off,o){const im=IMG[n];if(!im)return;o=o||{};const s=Math.max(G.W/im.width,G.H/im.height)*(o.zoom||1),w=im.width*s,h=im.height*s,y=G.H-h+(o.dy||0)*(h-G.H);
  if(off==null){X.drawImage(im,(G.W-w)/2,y,w,h);return}let x0=-(((off%(2*w))+2*w)%(2*w));for(let x=x0,i=0;x<G.W;x+=w,i++){if(i%2){X.save();X.translate(x+w,y);X.scale(-1,1);X.drawImage(im,0,0,w,h);X.restore()}else X.drawImage(im,x,y,w,h)}},
 vig(a){const g=X.createRadialGradient(G.W/2,G.H*.55,G.H*.35,G.W/2,G.H*.55,G.W*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(20,8,0,'+(a==null?.45:a)+')');X.fillStyle=g;X.fillRect(0,0,G.W,G.H)},
 tint(c,a){X.save();X.globalAlpha=a;X.fillStyle=c;X.fillRect(0,0,G.W,G.H);X.restore()},
 softShadow(x,y,w,a){X.save();const g=X.createRadialGradient(x,y,0,x,y,w);g.addColorStop(0,'rgba(0,0,0,'+(a||.35)+')');g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.translate(x,y);X.scale(1,.28);X.translate(-x,-y);X.beginPath();X.arc(x,y,w,0,7);X.fill();X.restore()},
 plank(x,y,w,h,o){const im=IMG.plank;o=o||{};if(!im){D.rr(x,y,w,h,1.5,'#a8652e');return}const cap=Math.min(w*.3,h*1.6),sc=im.height/h,cw=cap*sc;
  X.save();if(o.a!=null)X.globalAlpha*=o.a;X.drawImage(im,0,0,cw,im.height,x,y,cap,h);X.drawImage(im,cw,0,im.width-2*cw,im.height,x+cap,y,w-2*cap,h);X.drawImage(im,im.width-cw,0,cw,im.height,x+w-cap,y,cap,h);
  if(o.tint){X.globalCompositeOperation='source-atop';X.globalAlpha=o.tint[1];X.fillStyle=o.tint[0];X.fillRect(x,y,w,h)}X.restore()},
 txt(s,x,y,sz,c,al){X.save();X.font='900 '+sz+'px "Trebuchet MS",Verdana,sans-serif';X.textAlign=al||'center';X.textBaseline='middle';X.lineJoin='round';X.lineWidth=sz*.28;X.strokeStyle='#3a1d08';X.fillStyle='rgba(0,0,0,.35)';X.fillText(s,x,y+sz*.12);X.strokeText(s,x,y);
  const g=X.createLinearGradient(0,y-sz/2,0,y+sz/2);g.addColorStop(0,'#fff8d0');g.addColorStop(.5,c||'#ffd34d');g.addColorStop(1,'#e8962a');X.fillStyle=g;X.fillText(s,x,y);X.restore()},
 meter(x,y,w,v,lo,hi,ok){// balance gauge, v in -1..1
  D.rr(x-w/2-2,y-6,w+4,12,6,'#3a1d08',0);const g=X.createLinearGradient(0,y-5,0,y+5);g.addColorStop(0,'#fff4cf');g.addColorStop(1,'#e9c97e');D.rr(x-w/2,y-4.5,w,9,4.5,g,0);
  const gg=X.createLinearGradient(0,y-4,0,y+4);gg.addColorStop(0,'#9fe08a');gg.addColorStop(1,'#3f9a3a');D.rr(x-w*.14,y-3.5,w*.28,7,3.5,gg,0);
  const bx=x+clamp(v,-1,1)*(w/2-5);X.save();X.shadowColor=ok?'#fff27a':'#ff6040';X.shadowBlur=8*RS;const bg=X.createRadialGradient(bx-1.2,y-1.5,.5,bx,y,5);bg.addColorStop(0,'#fff');bg.addColorStop(1,ok?'#f3b51c':'#e0442a');D.ell(bx,y,5,5,bg,'#3a1d08',1.2);X.restore()},
 grass(y,c1,c2){D.rect(0,y,G.W,G.H-y,c1);X.fillStyle=c2;for(let x=(-G.t*0)%6;x<G.W;x+=6){X.fillRect(x,y,2,2)}}
};
// Generic cartoon person. o:{robe,skin,hair,beard,belt,h(eight),face(1/-1),walk(phase),arms:'down'|'up'|'carry'|'swing',hat}
function person(x,y,o){o=o||{};const h=o.h||26,s=h/26,f=o.face||1,wp=o.walk||0;X.save();X.translate(x,y);X.scale(s*f,s);
 const lg=Math.sin(wp)*3;D.shadow(0,0,7);
 D.line(-2,-7,-2-lg,0,o.leg||'#6b4a2e',2.4);D.line(2,-7,2+lg,0,o.leg||'#6b4a2e',2.4);
 D.poly([-6,-17,6,-17,8,-4,-8,-4],o.robe||'#c98a4b');if(o.trim)D.rect(-7.5,-6,15,1.6,o.trim);
 D.rect(-6.5,-11,13,2,o.belt||'#7a3f1d');
 const arm=(ang,c)=>{X.save();X.translate(0,-15);X.rotate(ang);D.rr(-1.6,0,3.2,9,1.5,o.sleeve||o.robe||'#c98a4b');D.ell(0,9.5,1.9,1.9,o.skin||'#e0a878');X.restore()};
 const a=o.arms||'down',sw=Math.sin(wp)*.5;
 if(a==='up'){arm(2.7,0);arm(-2.7,0)}else if(a==='carry'){arm(2.4,0);arm(-2.4,0)}else if(a==='swing'){arm(-.2-sw,0);arm(o.swing||0,0)}else if(a==='pray'){arm(-.6,0);arm(.6,0)}else{arm(-.2-sw,0);arm(.2+sw,0)}
 D.ell(0,-21,5,5,o.skin||'#e0a878');
 if(o.hair)D.poly([-5,-22,-4.5,-26,0,-27.5,4.5,-26,5,-22,3,-24,-3,-24],o.hair);
 if(o.beard)D.poly([-4.5,-20,4.5,-20,3,-15,0,-13.5,-3,-15],o.beard);
 if(o.hood)D.poly([-6,-19,-5.5,-25,0,-27.5,5.5,-25,6,-19,4,-24,-4,-24],o.hood);
 if(o.helmet){D.poly([-5.6,-23,-5,-26.5,0,-28,5,-26.5,5.6,-23],o.helmet);D.line(0,-28,0,-31,o.helmet,1.6);D.rect(-6,-23.5,12,1.6,'#8a6d2b')}
 D.rect(1.6,-22.5,1.4,1.8,OUT);D.rect(3.3,-22.5,1.1,1.8,OUT);if(o.mouth!==0)D.line(1.8,-19,3.6,-19.4,OUT,.8);
 if(o.blush){X.globalAlpha=.4;D.ell(3,-20,1.4,.9,'#ff7a7a',0);X.globalAlpha=1}
 X.restore()}
// particles
function fx(x,y,n,o){o=o||{};for(let i=0;i<n;i++)G.fx.push({x,y,vx:rnd(-1,1)*(o.sp||40),vy:rnd(-1,.3)*(o.sp||40)-(o.up||0),g:o.g==null?80:o.g,life:o.life||rnd(.5,.9),t:0,c:o.c||['#fff6b0','#ffd34d','#fff'][i%3],r:o.r||rnd(1,2.2),k:o.k||'dot'})}
function fxUpdate(dt){G.fx=G.fx.filter(p=>{p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;return p.t<p.life})}
function fxDraw(){X.save();G.fx.forEach(p=>{const k=clamp(1-p.t/p.life,0,1);X.globalAlpha=k;if(p.k==='star'){X.globalCompositeOperation='lighter';X.save();X.translate(p.x,p.y);X.rotate(p.t*4);D.ell(0,0,p.r*2.2,p.r*2.2,'rgba(255,220,120,.25)',0);D.sparkle(0,0,p.r*2*(0.6+k*.6),p.c);X.restore();X.globalCompositeOperation='source-over'}
 else if(p.k==='txt'){D.txt(p.s,p.x,p.y,p.r,p.c)}else if(p.k==='drop'){D.ell(p.x,p.y,p.r*.7,p.r,p.c,0)}else D.ell(p.x,p.y,p.r,p.r,p.c,0)});X.restore();X.globalAlpha=1}
function floatTxt(s,x,y,c){G.fx.push({x,y,vx:0,vy:-22,g:0,life:1.1,t:0,c:c||'#ffd34d',r:13,k:'txt',s})}
function burst(x,y,n){fx(x,y,n||16,{k:'star',sp:80,up:20});G.fx.push({x,y,vx:0,vy:0,g:0,life:.4,t:0,c:'rgba(255,255,255,.6)',r:6,k:'dot'})}
// ---------- audio (WebAudio synth, unlocked on first tap for iOS) ----------
const Snd=(()=>{let ac=null,master=null,bus=null,muted=store.get(GAME_ID+'Mute')==='1',cur=null,want=null,timer=null,step=0,nextT=0,failed=false;
 function unlock(){if(failed)return;try{if(ac){if(ac.state!=='running')ac.resume().catch(()=>{});return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC){failed=true;return}ac=new AC();master=ac.createGain();master.gain.value=muted?0:.9;master.connect(ac.destination);bus=ac.createGain();bus.gain.value=.28;bus.connect(master);
  const b=ac.createBuffer(1,1,22050),s=ac.createBufferSource();s.buffer=b;s.connect(ac.destination);s.start(0);if(ac.state!=='running')ac.resume().catch(()=>{});if(want)music(want,true)}catch(e){failed=true}}
 ['touchstart','touchend','mousedown','keydown'].forEach(e=>addEventListener(e,unlock,{capture:true,passive:true}));
 function env(g,t0,a,d,p){g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(p,t0+a);g.gain.exponentialRampToValueAtTime(.0001,t0+a+d)}
 function tone(f,t0,dur,type,vol,dest,glide){const o=ac.createOscillator(),g=ac.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t0);if(glide)o.frequency.exponentialRampToValueAtTime(glide,t0+dur);env(g,t0,.008,dur,vol);o.connect(g);g.connect(dest||bus);o.start(t0);o.stop(t0+dur+.05)}
 let nb=null;function noiseBuf(){if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}return nb}
 function noise(t0,f,q,dur,vol,dest,type){const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseBuf();fl.type=type||'bandpass';fl.frequency.value=f;fl.Q.value=q;env(g,t0,.004,dur,vol);s.connect(fl);fl.connect(g);g.connect(dest||master);s.start(t0);s.stop(t0+dur+.05)}
 const nf=n=>261.63*Math.pow(2,n/12);// semitones from C4
 function sched(){const S=SONGS[cur];if(!S)return;const sp=60/S.bpm/2;while(nextT<ac.currentTime+.25){const i=step%S.mel.length,m=S.mel[i],b=S.bass[i%S.bass.length],d=S.drum?S.drum[i%S.drum.length]:'.';
  if(m!=null&&m!=='-')tone(nf(m),nextT,S.pad?sp*2.5:sp*.85,S.wave||'square',S.mv||.09);
  if(b!=null&&b!=='-')tone(nf(b-24),nextT,sp*1.7,'triangle',.22);
  if(S.harm&&m!=null&&m!=='-'&&i%4===0)tone(nf(m-5),nextT,sp*2,'triangle',.05);
  if(d==='D')tone(120,nextT,.16,'sine',.45,bus,45);if(d==='t')noise(nextT,6000,1,.04,.12,bus,'highpass');if(d==='k')noise(nextT,1200,1.5,.08,.2,bus);
  if(S.rumble&&i===0)noise(nextT,140,.7,2.4,.25,bus,'lowpass');nextT+=sp;step++}}
 function music(name,force){want=name;if(!ac||(!force&&cur===name))return;cur=name;step=0;nextT=ac.currentTime+.08;clearInterval(timer);timer=setInterval(sched,60);sched()}
 const sfx={
  tap(){const t=ac.currentTime;tone(660,t,.06,'square',.12,master,990)},
  jump(){const t=ac.currentTime;tone(300,t,.18,'square',.13,master,720)},
  coin(){const t=ac.currentTime;tone(988,t,.07,'square',.12,master);tone(1319,t+.07,.22,'square',.12,master)},
  good(){const t=ac.currentTime;[0,4,7].forEach((s,i)=>tone(nf(12+s),t+i*.06,.18,'triangle',.18,master))},
  bad(){const t=ac.currentTime;tone(220,t,.22,'sawtooth',.1,master,140)},
  bump(){const t=ac.currentTime;noise(t,300,1,.15,.4,master,'lowpass');tone(140,t,.12,'sine',.3,master,70)},
  thud(){const t=ac.currentTime;noise(t,500,1,.1,.35,master,'lowpass');tone(180,t,.1,'sine',.3,master,90)},
  whoosh(){const t=ac.currentTime;noise(t,900,.8,.35,.3,master)},
  splash(){const t=ac.currentTime;noise(t,1600,.6,.6,.45,master);for(let i=0;i<5;i++)tone(rnd(900,1700),t+.08+i*.06,.07,'sine',.06,master,1800)},
  thunder(){const t=ac.currentTime;noise(t,90,.6,2.2,.7,master,'lowpass');noise(t,400,.8,.5,.3,master,'lowpass')},
  flap(){const t=ac.currentTime;noise(t,1400,2,.08,.18,master)},
  baa(){const t=ac.currentTime;const o=ac.createOscillator(),g=ac.createGain(),l=ac.createOscillator(),lg=ac.createGain();o.type='sawtooth';o.frequency.value=420;l.frequency.value=22;lg.gain.value=25;l.connect(lg);lg.connect(o.frequency);env(g,t,.03,.45,.08);o.connect(g);g.connect(master);o.start(t);l.start(t);o.stop(t+.5);l.stop(t+.5)},
  spin(p){const t=ac.currentTime;noise(t,600+p*1400,3,.1,.12,master)},
  fanfare(){const t=ac.currentTime;[[0,.12],[4,.12],[7,.12],[12,.36],[7,.12],[12,.6]].reduce((tt,[n,d])=>{tone(nf(n+7),t+tt,d*.95,'square',.11,master);tone(nf(n-5),t+tt,d*.95,'triangle',.14,master);return tt+d},0)},
  win(){const t=ac.currentTime;[0,4,7,12,16].forEach((s,i)=>tone(nf(12+s),t+i*.09,.5,'triangle',.16,master));tone(nf(24),t+.5,.8,'sine',.1,master)},
  chime(){const t=ac.currentTime;[0,7,12,16].forEach((s,i)=>tone(nf(19+s),t+i*.1,.7,'sine',.11,master))}
 };
 function play(n,a){if(!ac||muted)return;try{sfx[n]&&sfx[n](a)}catch(e){}}
 function setMute(m){muted=m;store.set(GAME_ID+'Mute',m?'1':'0');if(master)master.gain.setTargetAtTime(m?0:.9,ac.currentTime,.03)}
 return{unlock,music:n=>{try{music(n)}catch(e){}},play,setMute,get muted(){return muted},get ctx(){return ac},get cur(){return cur}}})();
// ---------- UI ----------
const $=id=>document.getElementById(id);
function btn(label,cls,css,fn){const b=document.createElement('button');b.className='btn '+(cls||'');b.innerHTML=label;Object.assign(b.style,css||{});
 const go=e=>{e.preventDefault();e.stopPropagation();Snd.unlock();Snd.play('tap');fn(b)};b.addEventListener('touchstart',go,{passive:false});b.addEventListener('mousedown',go);UI.appendChild(b);return b}
function clearUI(){UI.innerHTML='';cap('');hud('')}
function hud(lt,txt){if(!lt&&!txt){HUD.style.display='none';return}HUD.style.display='block';HUD.innerHTML='<span class="lt">'+(lt||'')+'</span>'+(txt||'')}
function cap(html,sub){CAP.style.display=html?'block':'none';CAP.innerHTML=(html||'')+(sub?'<small>'+sub+'</small>':'')}
(function(){const m=$('mute'),lab=()=>m.textContent=Snd.muted?'🔇':'🔊';lab();const tb=$('tiltb'),tl=()=>{tb.textContent=G.tilt?'📱✓':'📱';tb.style.width=G.tilt?'58px':'44px';tb.title=G.tilt?'Tilt on':'Tilt off'};tl();
 const on=(el,f)=>{const go=e=>{e.preventDefault();e.stopPropagation();Snd.unlock();f()};el.addEventListener('touchstart',go,{passive:false});el.addEventListener('mousedown',go)};
 on(m,()=>{Snd.setMute(!Snd.muted);lab()});
 on(tb,()=>{const enable=()=>{G.tilt=!G.tilt;store.set(GAME_ID+'Tilt',G.tilt?'1':'0');tl();toast(G.tilt?'Tilt ON: tip your phone to steer':'Tilt OFF: use your thumb')};
  if(!G.tilt&&window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(r=>{if(r==='granted')enable();else toast('Tilt was not allowed')}).catch(()=>toast('Tilt not available'))}else enable()});
 on($('home'),()=>{if(G.scene&&G.scene.name!=='title')go(TitleScene)})})();
let toastT=null;function toast(s){cap(s);clearTimeout(toastT);toastT=setTimeout(()=>{if(CAP.textContent===s)cap('')},1800)}
addEventListener('deviceorientation',e=>{if(e.gamma==null)return;const ang=(screen.orientation&&screen.orientation.angle)!=null?screen.orientation.angle:(window.orientation||0);
 let v=(ang===90)?e.beta:(ang===-90||ang===270)?-e.beta:e.gamma;G.tiltX=clamp((v||0)/22,-1,1)});
// ---------- fades & scenes ----------
let fading=true;
function fadeIn(){FADE.style.opacity='0';setTimeout(()=>{fading=false;FADE.style.pointerEvents='none'},500)}
function go(S,arg){if(fading&&G.scene)return;fading=true;FADE.style.pointerEvents='auto';FADE.style.opacity='1';hideCard();
 setTimeout(()=>{try{clearUI();G.fx=[];G.keys={};G.ptr.down=false;G.scene=S(arg);G.scene.t=0;G.scene.init&&G.scene.init()}catch(e){window.__showErr&&__showErr(e.message);console.error(e)}fadeIn()},G.scene?500:50)}
// level-complete card with NIrV verse
function stars(n){let s='';for(let i=0;i<3;i++)s+='<i class="'+(i<n?'':'off')+'" style="animation-delay:'+(.25+i*.18)+'s">★</i>';return s}
function card(o){const inn=CARD.querySelector('.in');inn.innerHTML=(o.title?'<h2>'+o.title+'</h2>':'')+(o.stars!=null?'<div class="stars">'+stars(o.stars)+'</div>':'')+(o.sub?'<div style="font-weight:bold;font-size:14px;color:#5a4a3a">'+o.sub+'</div>':'')+
 '<div class="v">“'+o.verse+'”</div><div class="ref">'+o.ref+' <span class="ver">(NIrV)</span></div><div class="row"></div>'+(o.credit?'<div class="credit">'+o.credit+'</div>':'');
 const row=inn.querySelector('.row');(o.btns||[]).forEach((b,i)=>{const e=btn(b.label,b.cls||'green',{},()=>{if(fading)return;b.fn()});row.appendChild(e)});
 cap('');CARD.classList.add('on');G.paused=true;Snd.play(o.sfx||'win');if(G.auto&&o.btns&&o.btns.length){const b=o.btns[o.btns.length-1];setTimeout(()=>{if(CARD.classList.contains('on'))b.fn()},1500)}}
function hideCard(){CARD.classList.remove('on');G.paused=false}
function levelDone(i,starsN,dl){const L=LEVELS[i];const best=+(store.get(GAME_ID+'S'+i)||0);if(starsN>best)store.set(GAME_ID+'S'+i,starsN);
 const un=+(store.get(GAME_ID+'Unl')||0);if(i+1>un)store.set(GAME_ID+'Unl',i+1);
 const nxt=i+1<LEVELS.length?()=>go(LEVELS[i+1].intro||LEVELS[i+1].scene):()=>go(FinaleScene);
 setTimeout(()=>card({title:L.done||('Level '+(i+1)+' complete!'),stars:starsN,verse:L.verse,ref:L.ref,btns:[{label:'↻ Again',cls:'cream',fn:()=>go(L.scene)},{label:i+1<LEVELS.length?'Next ▶':'Finale ▶',cls:'green',fn:nxt}]}),dl==null?2200:dl)}
// story cutscene: pages of {draw(t), text}
function Story(pages,next){let i=0,pt=0;const s={name:'story',init(){cap(pages[0].text,'tap to continue')},update(dt){pt+=dt;if(G.auto&&pt>1.4)s.tap()},draw(){pages[Math.min(i,pages.length-1)].draw(s.t)},
 tap(){if(pt<.6||i>=pages.length)return;i++;pt=0;if(i>=pages.length){cap('');go(next)}else{cap(pages[i].text,'tap to continue');Snd.play('tap')}}};return s}
// ---------- input ----------
function toGame(e){const r=C.getBoundingClientRect();const p=e.touches?e.changedTouches[0]:e;return[(p.clientX-r.left)/r.width*G.W,(p.clientY-r.top)/r.height*G.H]}
function pdown(e){if(e.target.closest&&e.target.closest('.btn,#card'))return;e.preventDefault();if(fading||G.paused)return;const [x,y]=toGame(e);G.ptr={down:true,x,y,sx:x,sy:y,t:G.t};const s=G.scene;s&&s.down&&s.down(x,y);s&&s.tap&&s.tap(x,y)}
function pmove(e){if(!G.ptr.down)return;const [x,y]=toGame(e);G.ptr.x=x;G.ptr.y=y;const s=G.scene;s&&s.move&&s.move(x,y)}
function pup(e){if(!G.ptr.down)return;G.ptr.down=false;const [x,y]=toGame(e);const s=G.scene;s&&s.up&&s.up(x,y)}
addEventListener('touchstart',pdown,{passive:false});addEventListener('touchmove',e=>{e.preventDefault();pmove(e)},{passive:false});addEventListener('touchend',pup);addEventListener('touchcancel',pup);
addEventListener('mousedown',e=>{if(!('ontouchstart' in window))pdown(e)});addEventListener('mousemove',pmove);addEventListener('mouseup',pup);
addEventListener('keydown',e=>{G.keys[e.key]=1;if(e.key===' '||e.key==='ArrowUp'){if(!G.keys._sp){G.keys._sp=1;const s=G.scene;if(s&&!G.paused){s.down&&s.down(G.W/2,G.H/2);s.tap&&s.tap(G.W/2,G.H/2)}}}});
addEventListener('keyup',e=>{G.keys[e.key]=0;if(e.key===' '||e.key==='ArrowUp'){G.keys._sp=0;const s=G.scene;s&&s.up&&s.up(G.W/2,G.H/2)}});
// steering input -1..1 from tilt, keys, or thumb drag (left/right half or drag offset)
function steer(){let v=0;if(G.keys.ArrowLeft)v-=1;if(G.keys.ArrowRight)v+=1;if(G.tilt)v+=G.tiltX;return clamp(v,-1,1)}
// ---------- loop ----------
let last=performance.now();
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,(now-last)/1000)*G.speed;last=now;if(ROT.classList.contains('on'))dt=0;
 const s=G.scene;X.setTransform(RS,0,0,RS,0,0);X.imageSmoothingEnabled=true;X.imageSmoothingQuality='high';
 try{if(s){if(!G.paused&&dt>0){G.t+=dt;s.t+=dt;if(G.auto&&s.auto)s.auto(dt);s.update&&s.update(dt);fxUpdate(dt)}
  X.save();if(G.shake>0){G.shake=Math.max(0,G.shake-dt*20);X.translate(rnd(-1,1)*G.shake,rnd(-1,1)*G.shake)}s.draw();fxDraw();X.restore()}}catch(e){console.error(e);__showErr(e.message);G.scene=null}}
const IMG={};function loadAssets(){return Promise.all(Object.keys(ASSETS).map(k=>new Promise(r=>{const i=new Image();i.onload=()=>{IMG[k]=i;(i.decode?i.decode().catch(()=>{}):Promise.resolve()).then(r)};i.onerror=()=>r();i.src=ASSETS[k]})))}
addEventListener('load',()=>{loadAssets().then(()=>{const l=document.getElementById('load');if(l)l.remove();go(TitleScene);requestAnimationFrame(frame)})});
// generic title builder
function makeTitle(o){return()=>({name:'title',init(){Snd.music('title');const h=document.createElement('div');h.style.cssText='position:absolute;left:0;right:0;top:calc(var(--it) + '+(o.top||'9%')+');text-align:center;pointer-events:none';h.innerHTML='<div class="logo">'+o.title+'</div><div class="tag">'+o.tag+'</div>';UI.appendChild(h);const un=+(store.get(GAME_ID+'Unl')||0);
 btn('▶ PLAY','wood big',{left:o.playL||'50%',top:o.play||'58%',transform:'translateX(-50%)'},()=>go(LEVELS[0].intro||LEVELS[0].scene));
 const row=document.createElement('div');row.style.cssText='position:absolute;left:50%;bottom:calc(var(--ib) + 10px);transform:translateX(-50%);display:flex;pointer-events:none';UI.appendChild(row);
 LEVELS.forEach((L,i)=>{const ok=i<=un;const st=+(store.get(GAME_ID+'S'+i)||0);const b=btn((ok?(i+1):'🔒')+'<div class="st">'+(ok?'★'.repeat(st)+'☆'.repeat(3-st):'')+'</div>',ok?'cream':'lock',{position:'static',padding:'3px 12px',fontSize:'17px',minWidth:'50px',minHeight:'44px',marginLeft:i?'8px':'0'},()=>{if(ok)go(L.scene)});b.title=L.name;row.appendChild(b)});
 if(G.auto)setTimeout(()=>go(LEVELS[0].intro||LEVELS[0].scene),900)},update(){},draw(){o.draw(this.t)}})}
window.__G=G;
