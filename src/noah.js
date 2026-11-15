const NIRV_NOTICE='Scripture quotations taken from The Holy Bible, New International Reader\'s Version®, NIrV® Copyright © 1995, 1996, 1998, 2014 by Biblica, Inc.® Used by permission. All rights reserved worldwide.';
// ===================== NOAH'S BIG BOAT =====================
const SONGS={
 title:{bpm:120,mel:[7,'-',12,'-',11,9,7,'-',4,'-',5,7,9,'-','-','-',7,'-',12,'-',14,12,11,'-',9,7,5,4,7,'-','-','-'],bass:[0,'-',7,'-',5,'-',7,'-',9,'-',5,'-',7,'-',0,'-'],drum:'D.t.k.t.D.t.k.tt',harm:1},
 build:{bpm:136,mel:[0,4,7,4,9,7,4,'-',5,9,12,9,7,'-','-','-',0,4,7,4,9,7,12,'-',11,7,9,11,12,'-','-','-'],bass:[0,'-',0,'-',5,'-',5,'-',7,'-',7,'-',0,'-',7,'-'],drum:'D.tkD.tkD.tkDktk'},
 animals:{bpm:126,mel:[12,'-',7,9,12,'-',7,9,12,14,16,14,12,'-','-','-',9,'-',5,7,9,'-',5,7,9,11,12,11,7,'-','-','-'],bass:[0,'-',7,'-',0,'-',7,'-',5,'-',0,'-',7,'-',7,'-'],drum:'D.k.D.k.D.k.Dkkk',wave:'triangle',mv:.16},
 storm:{bpm:96,mel:[0,'-',3,'-',7,'-',3,'-',5,'-',3,2,0,'-','-','-',-2,'-',2,'-',5,'-',2,'-',3,'-',2,-2,0,'-','-','-'],bass:[0,'-','-','-',-4,'-','-','-',-2,'-','-','-',0,'-',-5,'-'],drum:'D...k.D.D...k..k',wave:'sawtooth',mv:.05,rumble:1},
 dove:{bpm:112,mel:[12,'-',16,'-',19,'-',16,'-',17,'-',21,'-',19,'-','-','-',16,'-',14,'-',12,'-',14,'-',16,'-',12,'-',11,'-','-','-'],bass:[0,'-','-','-',5,'-','-','-',7,'-','-','-',0,'-','-','-'],drum:'..t...t...t...t.',wave:'triangle',mv:.15,pad:1},
 finale:{bpm:100,mel:[12,'-',11,12,14,'-',12,'-',16,'-',14,'-',12,'-','-','-',9,'-',11,12,14,'-',16,'-',17,'-',16,14,12,'-','-','-'],bass:[0,'-',4,'-',5,'-',7,'-',9,'-',5,'-',7,'-',0,'-'],drum:'D...t...D...t.t.',wave:'triangle',mv:.16,harm:1}
};
// ---------- shared art (painted sprites) ----------
const NOAH={};
function meadow(t,dark){D.bg('bg_meadow');if(dark){D.tint('#1c2740',.55)}else{X.save();X.globalCompositeOperation='lighter';X.globalAlpha=.10+.04*Math.sin(t*.7);const g=X.createRadialGradient(G.W*.7,0,0,G.W*.7,0,G.W*.7);g.addColorStop(0,'#fff2c0');g.addColorStop(1,'rgba(0,0,0,0)');X.fillStyle=g;X.fillRect(0,0,G.W,G.H);X.restore();kidMeadowDecor(t)}}
function noahSpr(x,y,h,o){o=o||{};const b=o.bob==null?Math.sin(G.t*3)*.6:o.bob;D.softShadow(x,y,h*.3);D.spr('noah',x,y,h,{f:o.f||1,sy:1+Math.sin(G.t*3)*.012,sx:1-Math.sin(G.t*3)*.012,rot:o.rot,glow:o.glow})}
function plank(x,y,w,h,c,nails,tint){D.plank(x,y,w,h,{tint})}
// whole ark, bottom-center at (cx,by), scale s  (old width 164*s)
function drawArk(cx,by,s,o){o=o||{};D.softShadow(cx,by-2,90*s,.3);D.spr('ark',cx,by+6*s,100*s,{glow:o.lit?'rgba(255,210,120,.0)':null});if(o.peek)o.peek()}
const TYPES=['lion','elephant','giraffe','zebra','sheep','bunny','bear','camel'];
const AH={lion:27,elephant:31,giraffe:44,zebra:30,sheep:22,bunny:19,bear:27,camel:35};
function drawAnimal(tp,x,y,s,wp,f,hl){const h=AH[tp]*s,hop=Math.abs(Math.sin(wp||0)),sq=1+(wp?(hop-.5)*.06:0);D.softShadow(x,y,h*.45,.32);
 if(hl){X.save();X.globalAlpha=.55+.25*Math.sin(G.t*8);D.ell(x,y,h*.55,h*.16,null,'#ffe27a',1.4);X.restore();D.sparkle(x+h*.35,y-h*1.05,2.5+Math.sin(G.t*8))}
 D.spr(tp,x,y-(wp?hop*1.6*s:0),h,{f:f||1,sy:sq,sx:2-sq,glow:hl?'#fff3a0':null,gb:5})}
// ---------- LEVEL 1: BUILD THE ARK ----------
function BuildScene(){const S={name:'build',rows:[],phase:'stack',misses:0,perfect:0,px:0,ph:0,drop:null,fall:[],cells:null,painted:0,total:0,
 W:[100,124,140,152,160,164,96,108],cx(){return G.W/2+16},rowY(i){return 146-(i+1)*7},
 init(){Snd.music('build');this.upd();cap('Tap to drop each plank right on its outline!')},
 upd(){hud('Build the Ark',this.phase==='stack'?'Planks '+this.rows.length+' / 8':'Pitch '+Math.floor(this.cov()*100)+'%')},
 cov(){return this.total?this.painted/this.total:0},
 speed(){return 1.7+this.rows.length*.22},
 tap(){if(this.phase!=='stack'||this.drop||this.t<.4)return;this.drop={x:this.px,y:40,vy:0,w:this.W[this.rows.length]};Snd.play('whoosh');cap('')},
 down(x,y){if(this.phase==='pitch')this.paint(x,y)},move(x,y){if(this.phase==='pitch')this.paint(x,y)},
 paint(x,y){if(!this.cells)return;let n=0;this.cells.forEach(c=>{if(!c.p&&(c.x-x)**2+(c.y-y)**2<120){c.p=1;n++}});if(n){this.painted+=n;if(Math.random()<.4)Snd.play('spin',.2);if(Math.random()<.5)fx(x,y,1,{c:'#5a3418',sp:20,g:60,life:.4});this.upd();
  if(this.cov()>=.9&&this.phase==='pitch'){this.phase='done';this.cells.forEach(c=>c.p=1);this.painted=this.total;this.upd();Snd.play('fanfare');fx(this.cx(),110,40,{k:'star',sp:90,up:30});cap('The ark is ready! Here come the animals, two by two! 🎉');
   levelDone(0,this.misses===0?3:this.misses<=2?2:1,9400)}}},
 startPitch(){this.phase='pitch';const cx=this.cx();this.cells=[];for(let i=0;i<6;i++){const w=this.W[i],y=this.rowY(i);for(let x=cx-w/2+3;x<cx+w/2;x+=5)this.cells.push({x,y:y+3.5,p:0})}this.total=this.cells.length;this.upd();cap('Now swipe to paint pitch on the hull so no water gets in!')},
 update(dt){this.ph+=dt*this.speed();this.px=this.cx()+Math.sin(this.ph)*Math.min(70,G.W-this.cx()-this.W[Math.min(7,this.rows.length)]/2-4);
  const d=this.drop;if(d){d.vy+=500*dt;d.y+=d.vy*dt;const ty=this.rowY(this.rows.length);if(d.y>=ty){const off=d.x-this.cx(),tol=this.rows.length>=6?22:26;
    if(Math.abs(off)<=tol){const perf=Math.abs(off)<5;this.rows.push({off,w:d.w,snap:0,perf});G.shake=perf?2:1;Snd.play(perf?'coin':'thud');if(perf){this.perfect++;fx(this.cx(),ty,14,{k:'star',sp:60,up:20});cap('Perfect!')}else cap(['Good!','Nice!','Steady!'][this.rows.length%3]);
     this.upd();if(this.rows.length===8){Snd.play('good');setTimeout(()=>this.startPitch(),700)}}
    else{this.misses++;this.fall.push({x:d.x,y:ty,vx:Math.sign(off)*40,vy:-60,r:0,w:d.w});Snd.play('bump');cap('Oops! Try again — wait till it lines up.')}this.drop=null}}
  this.rows.forEach(r=>r.snap=Math.min(1,r.snap+dt*6));this.fall=this.fall.filter(f=>{f.vy+=400*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.r+=f.vx*.03*dt;return f.y<230})},
 auto(dt){if(this.phase==='stack'){if(!this.drop&&this.t>.6&&Math.abs(this.px-this.cx())<3&&Math.random()<.7)this.tap()}
  else if(this.phase==='pitch'){this.at=(this.at||0)+dt;const k=this.at*1.2,cx=this.cx(),row=Math.floor(k)%6,fr=k%1;const x=cx+(row%2?1:-1)*(fr*2-1)*80,y=this.rowY(row)+3.5;this.paint(x,y);this.ax=x;this.ay=y}},
 draw(){meadow(this.t);const cx=this.cx();
  D.softShadow(cx,148,100,.35);
  X.save();const gg=X.createRadialGradient(cx,150,10,cx,150,120);gg.addColorStop(0,'rgba(120,80,40,.55)');gg.addColorStop(1,'rgba(120,80,40,0)');X.fillStyle=gg;X.translate(cx,150);X.scale(1,.25);X.translate(-cx,-150);X.beginPath();X.arc(cx,150,120,0,7);X.fill();X.restore();
  [[-100,1],[100,-1]].forEach(([o,d])=>{X.save();X.translate(cx+o,150);X.rotate(-Math.PI/2);D.plank(0,-5,140,10);X.restore();X.save();X.translate(cx+o,110);X.rotate(-Math.PI/2+d*.6);D.plank(0,-3,40,6);X.restore()});
  D.plank(cx-110,10,220,11);D.plank(cx-96,146,192,7);
  const doneK=this.phase==='done'?clamp((this.dt2=(this.dt2||0)+1/60)*1.2,0,1):0;
  X.save();X.globalAlpha=1-ease(doneK);
  for(let i=0;i<8;i++){const w=this.W[i],y=this.rowY(i);if(i>=this.rows.length){if(this.phase==='stack'&&i===this.rows.length){X.save();X.globalAlpha=.55+.25*Math.sin(this.t*6);X.setLineDash([3,2]);D.rr(cx-w/2,y,w,7,2,'rgba(255,240,180,.25)','#fff6c0',1.2);X.setLineDash([]);X.restore()}}
   else{const r=this.rows[i],x=cx-w/2+r.off*(1-ease(r.snap));plank(x,y,w,7.5,null,1,i>=6?['#c0442a',.35]:null)}}
  if(this.cells){this.cells.forEach(c=>{if(c.p){X.globalAlpha=.8*(1-ease(doneK));D.rect(c.x-2.6,c.y-3.6,5.2,7.2,'#2a160a')}});X.globalAlpha=1-ease(doneK);if(this.phase==='pitch'){X.globalAlpha=.35+.25*Math.sin(this.t*5);for(let i=0;i<6;i++)D.rr(cx-this.W[i]/2,this.rowY(i),this.W[i],7.5,2,null,'#fff6c0',.8)}}
  X.restore();
  if(doneK>0){X.save();X.globalAlpha=ease(doneK);D.spr('ark',cx,152,96,{sy:1+.05*Math.sin(doneK*Math.PI)});X.restore()}
  if(this.phase==='stack'&&this.rows.length<8){const w=this.W[this.rows.length];if(!this.drop){const sw=Math.sin(this.ph)*.04;D.line(this.px,19,this.px,34,'#e8d6a8',1);D.line(this.px-w/2+6,41,this.px,34,'#e8d6a8',.8);D.line(this.px+w/2-6,41,this.px,34,'#e8d6a8',.8);
    X.save();X.translate(this.px,44);X.rotate(sw);plank(-w/2,-3.75,w,7.5,null,1,this.rows.length>=6?['#c0442a',.35]:null);X.restore();
    X.save();X.globalAlpha=.25+.2*Math.sin(this.t*6);D.line(this.px,50,this.px,this.rowY(this.rows.length),'#fff6c0',1.2);X.restore()}
   else plank(this.drop.x-this.drop.w/2,this.drop.y,this.drop.w,7.5,null,1,this.rows.length>=6?['#c0442a',.35]:null)}
  this.fall.forEach(f=>{X.save();X.translate(f.x,f.y);X.rotate(f.r);plank(-f.w/2,-3.75,f.w,7.5);X.restore()});
  const sw=this.drop||this.phase==='pitch'?Math.sin(this.t*14)*.06:0;noahSpr(Math.max(16,cx-112),152,48,{rot:sw});
  if(this.phase==='pitch'){const px=this.ax!=null?this.ax:G.ptr.x,py=this.ay!=null?this.ay:G.ptr.y;if(G.ptr.down||G.auto){X.save();X.translate(px,py);X.rotate(-.5);D.rr(-1.2,-14,2.4,12,1,'#8a5a2a',0);D.rr(-4,-4,8,6,2,'#3a1d08',0);D.ell(0,2,4.5,2.2,'#1a0d04',0);X.restore()}}
  if(this.phase==='done'){const wk=(this.dt2||0)-1.1,rb=[cx-100,156],rt=[cx-64,114],dr=cx+20;
   X.save();X.translate(rb[0],rb[1]);X.rotate(Math.atan2(rt[1]-rb[1],rt[0]-rb[0]));D.plank(-2,-3,Math.hypot(rt[0]-rb[0],rt[1]-rb[1])+6,6);X.restore();
   const pts=[[-24,157],rb,rt,[dr,113]],seg=[];let L=0;for(let s=0;s<3;s++){const l=Math.hypot(pts[s+1][0]-pts[s][0],pts[s+1][1]-pts[s][1]);seg.push(l);L+=l}
   ['lion','elephant','giraffe','zebra','sheep'].forEach((tp,i)=>[0,1].forEach(j=>{const t=wk-(i*2+j)*.38;if(t<0)return;let d=t*80;if(d>=L)return;let s=0;while(d>seg[s]){d-=seg[s];s++}const f=d/seg[s],x=pts[s][0]+(pts[s+1][0]-pts[s][0])*f,y=pts[s][1]+(pts[s+1][1]-pts[s][1])*f,sc=s<1?.85:s===1?.85-.25*f:.6;
    X.save();if(s===2){X.beginPath();X.rect(0,0,dr-4,107);X.clip()}drawAnimal(tp,x,y,sc,t*12,1);X.restore()}));
   X.save();const dg=X.createRadialGradient(dr,104,1,dr,104,9);dg.addColorStop(0,'rgba(255,220,140,'+(.35+.15*Math.sin(this.t*4))+')');dg.addColorStop(1,'rgba(255,220,140,0)');X.fillStyle=dg;X.fillRect(dr-10,94,20,20);X.restore()}
  D.vig(.35);
 }};return S}
// ---------- LEVEL 2: TWO BY TWO ----------
function AnimalsScene(){const S={name:'animals',an:[],sel:null,loaded:0,mist:0,queue:TYPES.slice(5),
 init(){Snd.music('animals');const types=TYPES.slice(0,5);types.forEach(tp=>{this.add(tp);this.add(tp)});this.upd();cap('Tap two animals that match to send them into the ark!')},
 upd(){hud('Two by Two','Pairs '+this.loaded+' / 8')},
 fieldW(){return G.W-140},
 add(tp){const a={tp,x:rnd(14,this.fieldW()),y:rnd(122,170),tx:0,ty:0,f:Math.random()<.5?1:-1,wp:rnd(0,6),st:'wander',wt:rnd(0,2),shake:0,s:1,id:Math.random()};
  if(this.t>1){a.x=-12;a.tx=rnd(20,this.fieldW());a.ty=a.y;a.st='enter'}this.an.push(a);return a},
 door(){return[G.W-62,121]},ramp(){return[G.W-112,160]},
 pick(x,y){let best=null,bd=1e9;this.an.forEach(a=>{if(a.st!=='wander'&&a.st!=='enter')return;const h=AH[a.tp],r=Math.max(15,h*.6),d=((a.x-x)**2+(a.y-h*.45-y)**2)/(r*r);if(d<1&&d<bd){bd=d;best=a}});return best},
 tap(x,y){const a=this.pick(x,y);if(!a)return;if(!this.sel){this.sel=a;Snd.play('tap');cap('');return}
  if(a===this.sel){this.sel=null;return}
  if(a.tp===this.sel.tp){const b=this.sel;this.sel=null;[a,b].forEach((q,i)=>{q.st='board';q.delay=i*.35});Snd.play('good');fx(a.x,a.y-10,10,{k:'star',up:20});fx(b.x,b.y-10,10,{k:'star',up:20})}
  else{this.mist++;a.shake=.5;this.sel.shake=.5;this.sel=null;Snd.play('bad');cap('Not a match — find the same animal!')}},
 update(dt){const [rx,ry]=this.ramp(),[dx,dy]=this.door();
  this.an.forEach(a=>{a.shake=Math.max(0,a.shake-dt);
   if(a.st==='wander'){a.wt-=dt;if(a.wt<0){a.wt=rnd(1.5,3.5);a.tx=clamp(a.x+rnd(-40,40),12,this.fieldW());a.ty=clamp(a.y+rnd(-18,18),122,170)}const ddx=a.tx-a.x,ddy=a.ty-a.y,d=Math.hypot(ddx,ddy);if(d>1){a.x+=ddx/d*10*dt;a.y+=ddy/d*10*dt;a.wp+=dt*8;a.f=ddx>0?1:-1}}
   else if(a.st==='enter'){a.x+=24*dt;a.wp+=dt*10;a.f=1;if(a.x>=a.tx){a.st='wander';a.wt=0}}
   else if(a.st==='board'){if(a.delay>0){a.delay-=dt;return}const tx=a.leg?dx:rx,ty=a.leg?dy:ry,ddx=tx-a.x,ddy=ty-a.y,d=Math.hypot(ddx,ddy);a.f=ddx>=0?1:-1;a.wp+=dt*14;
    if(d<2){if(!a.leg)a.leg=1;else{a.st='gone';this.onGone(a)}}else{const v=a.leg?40:70;a.x+=ddx/d*Math.min(d,v*dt);a.y+=ddy/d*Math.min(d,v*dt);if(a.leg)a.s=Math.max(.6,a.s-dt*.3)}}});
  this.an=this.an.filter(a=>a.st!=='gone')},
 onGone(a){this.gone=(this.gone||0)+1;if(this.gone%2===0){this.loaded++;this.upd();Snd.play('coin');if(a.tp==='sheep')Snd.play('baa');
  if(this.queue.length){const tp=this.queue.shift();setTimeout(()=>{this.add(tp);setTimeout(()=>this.add(tp),700)},300)}
  if(this.loaded>=8&&!this.done){this.done=1;Snd.play('fanfare');cap('Every animal is safe inside! 🦁🐘🦒');levelDone(1,this.mist===0?3:this.mist<=2?2:1)}}},
 auto(dt){this.ac=(this.ac||0)+dt;if(this.ac<.9)return;this.ac=0;const w=this.an.filter(a=>a.st==='wander');
  if(this.sel){const m=w.find(a=>a!==this.sel&&a.tp===this.sel.tp);if(m)this.tap(m.x,m.y-AH[m.tp]*.45);return}
  for(const a of w){if(w.some(b=>b!==a&&b.tp===a.tp)){this.tap(a.x,a.y-AH[a.tp]*.45);return}}},
 draw(){const k=Math.min(1,this.loaded/8);meadow(this.t,false);D.tint('#22304a',k*.4);
  for(let i=0;i<3;i++){X.save();X.globalAlpha=k*.9;D.spr('cloud',G.W-50-i*80+Math.sin(this.t*.3+i)*6,40+i*5,26+i*3);X.restore()}
  const [dx,dy]=this.door(),[rx,ry]=this.ramp();drawArk(G.W-58,156,.7,{open:1});
  X.save();const ang=Math.atan2(dy+14-ry,dx-rx),len=Math.hypot(dx-rx,dy+14-ry);X.translate(rx,ry);X.rotate(ang);D.plank(-4,-5,len+8,10);X.restore();
  noahSpr(G.W-122,176,40,{f:-1,rot:this.sel?Math.sin(this.t*8)*.05:0});
  [...this.an].sort((a,b)=>a.y-b.y).forEach(a=>{const sx=a.shake?Math.sin(a.shake*60)*2:0;const bob=a===this.sel?-Math.abs(Math.sin(this.t*8))*3:0;X.save();if(a.s<1)X.globalAlpha=clamp((a.s-.6)/.3,0,1);drawAnimal(a.tp,a.x+sx,a.y+bob,a.s*.95,a.wp,a.f,a===this.sel);X.restore()});
  D.vig(.35);
 }};return S}
// ---------- LEVEL 3: RIDE THE FLOOD ----------
function FloodScene(){const S={name:'flood',ang:0,av:0,day:1,dp:0,tumbles:0,flash:0,nextBolt:3,rain:[],u:0,
 init(){Snd.music('storm');for(let i=0;i<70;i++)this.rain.push({x:rnd(0,G.W),y:rnd(0,G.H),v:rnd(160,240)});this.upd();cap('Hold your thumb on the left or right to keep the ark level! (or tilt 📱)')},
 upd(){hud('Ride the Flood','Day '+Math.min(40,this.day)+' / 40')},
 input(){let u=steer();if(G.ptr.down)u+=clamp((G.ptr.x-G.W/2)/(G.W*.3),-1,1);return clamp(u,-1,1)},
 update(dt){if(this.done)return;const tt=this.t,str=.9+Math.min(1.1,this.day/26);
  const wave=(Math.sin(tt*1.3)*.7+Math.sin(tt*.71+1)*.6+Math.sin(tt*2.3+2)*.25)*str;
  this.u=lerp(this.u,G.auto?this.au||0:this.input(),.25);
  this.av+=(wave*1.1-this.u*2.8-this.ang*1.2-this.av*1.1)*dt;this.ang+=this.av*dt;
  const a=Math.abs(this.ang);const rate=a<.22?1:a<.4?.5:.15;this.dp+=dt*rate*1.25;if(this.dp>=1){this.dp-=1;this.day++;this.upd();if(this.day%10===0)Snd.play('chime')}
  if(a>.55){this.tumbles++;this.ang=Math.sign(this.ang)*.3;this.av=-this.av*.3;G.shake=4;Snd.play('bump');cap('Whoa! The animals tumbled — keep it steady!');fx(G.W/2,110,12,{c:'#cfe8ff',sp:70,up:20})}
  this.nextBolt-=dt;if(this.nextBolt<0){this.nextBolt=rnd(3,6);this.flash=1;Snd.play('thunder')}this.flash=Math.max(0,this.flash-dt*2.5);
  this.rain.forEach(r=>{r.y+=r.v*dt;r.x-=r.v*.25*dt;if(r.y>G.H){r.y=-5;r.x=rnd(0,G.W+40)}});
  if(this.day>40){this.done=1;Snd.play('fanfare');cap('Forty days! The ark floated safely. 🌊');this.ang=0;levelDone(2,this.tumbles===0?3:this.tumbles<=2?2:1)}},
 auto(dt){this.au=clamp(this.ang*3+this.av*1.6,-1,1)},
 waveY(x,l){const t=this.t;return 128+l*12+Math.sin(x*.045+t*(1.6-l*.3)+l)*4*(1+l*.3)+Math.sin(x*.11-t*2.1)*1.5},
 draw(){D.bg('bg_storm',this.t*3,{dy:.4});D.tint('#0a1430',.15);
  if(this.flash>.6){X.save();X.shadowColor='#bfe0ff';X.shadowBlur=12*RS;X.lineWidth=2;X.strokeStyle='#fffbe0';X.beginPath();X.moveTo(G.W*.72,0);X.lineTo(G.W*.67,28);X.lineTo(G.W*.71,30);X.lineTo(G.W*.65,62);X.stroke();X.restore()}
  const wv=(l,c1,c2,foam)=>{X.beginPath();X.moveTo(0,G.H);for(let x=0;x<=G.W+4;x+=3)X.lineTo(x,this.waveY(x,l));X.lineTo(G.W,G.H);X.closePath();const g=X.createLinearGradient(0,118+l*12,0,G.H);g.addColorStop(0,c1);g.addColorStop(1,c2);X.fillStyle=g;X.fill();
   if(foam){X.save();X.strokeStyle='rgba(235,250,255,.45)';X.lineWidth=1;X.shadowColor='#fff';X.shadowBlur=3*RS;X.beginPath();for(let x=0;x<=G.W+4;x+=3)X.lineTo(x,this.waveY(x,l));X.stroke();X.restore();X.globalAlpha=.5;for(let i=0;i<10;i++){const x=((i*47+this.t*(14+l*6))%(G.W+20))-10;D.ell(x,this.waveY(x,l)+4+l*3,3,1,'#e6f6ff',0)}X.globalAlpha=1}};
  wv(-1,'#1f6f8f','#0d3550');const cx=G.W/2,by=this.waveY(cx,0)+8;
  X.save();X.translate(cx,by);X.rotate(this.ang);D.spr('ark',0,0,74,{sy:1+Math.sin(this.t*3)*.015});X.restore();
  wv(0,'rgba(40,150,170,.92)','#0e3f5e',1);wv(1,'rgba(26,110,150,.95)','#0a2f48',1);
  X.save();X.strokeStyle='rgba(210,230,255,.55)';X.lineWidth=.9;X.beginPath();this.rain.forEach(r=>{X.moveTo(r.x,r.y);X.lineTo(r.x-2.4,r.y+8)});X.stroke();X.restore();
  if(this.flash>0)D.tint('#eef6ff',this.flash*.55);
  D.vig(.55);
  D.meter(G.W/2,52,96,this.ang/.55,0,0,Math.abs(this.ang)<.22);
  X.save();X.globalAlpha=.22+(G.ptr.down?.12:0);[[24,1],[G.W-24,-1]].forEach(([x,d])=>{D.ell(x,G.H/2+20,15,15,'rgba(255,255,255,.5)','#fff',1.2);D.poly([x-6*d,G.H/2+20,x+4*d,G.H/2+13,x+4*d,G.H/2+27],'#fff',0)});X.restore();
 }};return S}
// ---------- LEVEL 4: THE DOVE'S FLIGHT ----------
function DoveScene(){const S={name:'dove',y:80,vy:0,dist:0,leg:0,obs:[],bumps:0,inv:0,flap:0,LEN:900,
 init(){Snd.music('dove');this.upd();cap('Tap to flap! Fly over the water and find dry land.')},
 upd(){hud("The Dove's Flight",this.leg===0?'Find land '+Math.floor(this.dist/this.LEN*100)+'%':this.leg===1?'Got the olive leaf!':'Back to Noah '+Math.floor(this.dist/(this.LEN*.6)*100)+'%')},
 tap(){if(this.leg===1||this.done)return;this.vy=-78;this.flap=.25;Snd.play('flap');cap('')},
 spawn(){const gap=36;const cy=rnd(32,130);this.obs.push({x:G.W+30,y:cy,r:rnd(13,18)})},
 update(dt){if(this.done)return;const goal=this.leg===0?this.LEN:this.LEN*.6;
  if(this.leg!==1){this.vy+=170*dt;this.vy=Math.min(this.vy,90);this.y+=this.vy*dt;if(this.y<14){this.y=14;this.vy=0}if(this.y>140){this.y=140;this.vy=-60;this.hit()}
   const sp=58;this.dist+=sp*dt;this.obs.forEach(o=>o.x-=sp*dt);this.obs=this.obs.filter(o=>o.x>-40);
   const lastX=this.obs.length?this.obs[this.obs.length-1].x:-99;if(lastX<G.W-95&&this.dist<goal-G.W*.6)this.spawn();
   this.inv=Math.max(0,this.inv-dt);const bx=70;this.obs.forEach(o=>{if(this.inv<=0&&Math.hypot(o.x-bx,o.y-this.y)<o.r+5){this.hit();this.vy=o.y>this.y?-70:60}});
   if(this.t%1<dt)this.upd();
   if(this.dist>=goal){if(this.leg===0){this.leg=1;this.lt=0;Snd.play('good');cap('An olive leaf! 🌿 The waters are going down.');this.upd()}else{this.done=1;Snd.play('fanfare');cap('Noah knew the waters were going away! 🕊️');levelDone(3,this.bumps===0?3:this.bumps<=2?2:1)}}}
  else{this.lt+=dt;this.y=lerp(this.y,100,dt*3);this.vy=0;if(this.lt>2.2){this.leg=2;this.dist=0;this.obs=[];this.upd();cap('Now fly back to the ark!')}}
  this.flap=Math.max(0,this.flap-dt)},
 hit(){if(this.inv>0)return;this.bumps++;this.inv=1.2;G.shake=3;Snd.play('bump');fx(70,this.y,8,{c:'#fff',sp:40});cap('Bonk! Fly around the storm clouds.')},
 auto(){if(this.leg===1)return;let target=80;const o=this.obs.find(o=>o.x>40&&o.x<180);if(o){const above=o.y-o.r-12,below=o.y+o.r+14;target=(o.y>78&&above>20)||below>132?above:below}if(this.y>target&&this.vy>-20)this.tap()},
 draw(){const goal=this.leg===0?this.LEN:this.LEN*.6,pr=this.dist/goal,back=this.leg===2;
  const off=this.dist*(back?-1:1);D.bg('bg_sea',off*.25,{dy:.3});
  if(this.leg===0&&pr>.7||this.leg===1){const mx=this.leg===1?150:G.W+60-(pr-.7)/.3*(G.W-90);D.spr('tree',mx,158,80)}
  if(this.leg===2&&pr>.6){const ax=G.W+60-(pr-.6)/.4*(G.W-90);X.save();X.translate(ax,156);X.rotate(Math.sin(this.t*1.5)*.03);D.spr('ark',0,0,62);X.restore();noahSpr(ax+24,128,30,{f:-1})}
  X.save();X.globalAlpha=.6;for(let i=0;i<12;i++){const x=((i*53-off*.9)%(G.W+20)+G.W+20)%(G.W+20)-10;D.ell(x,150+(i%4)*6,4,.8,'#fff',0)}X.restore();
  this.obs.forEach(o=>{D.spr('cloud',o.x,o.y+o.r*.75,o.r*1.65,{rot:Math.sin(this.t+o.x*.05)*.03});if(Math.sin(this.t*3+o.x)>.97){X.save();X.strokeStyle='#fff6b0';X.lineWidth=1;X.beginPath();X.moveTo(o.x,o.y+o.r*.6);X.lineTo(o.x-3,o.y+o.r+4);X.lineTo(o.x+1,o.y+o.r+5);X.lineTo(o.x-2,o.y+o.r+12);X.stroke();X.restore()}});
  const dx=this.leg===1?lerp(70,140,Math.min(1,this.lt/1)):70;const face=back?-1:1;X.save();if(this.inv>0&&Math.floor(this.inv*10)%2)X.globalAlpha=.4;
  const turn=this.leg===1&&this.lt>1.1,x=turn?lerp(140,70,Math.min(1,(this.lt-1.1)/1)):dx,f=face*(turn?-1:1);
  const wf=this.flap>0?Math.sin(this.flap*40):Math.sin(this.t*6)*.5;
  X.translate(x,this.y);X.rotate(clamp(this.vy/220,-.4,.45)*f);
  D.spr('dove',0,0,30,{f,ay:.5,sy:1+wf*.12,sx:1-wf*.05});
  if(this.leg>=1&&!(this.leg===1&&this.lt<.9)){X.scale(f,1);D.line(18,0,22,4,'#4a7a2a',.9);D.ell(22,5,3.4,1.5,'#5fa83a','#2e5a1a',.5,.4)}X.restore();
  D.vig(.3);
 }};return S}
// ---------- FINALE: RAINBOW ----------
function FinaleScene(){const S={name:'finale',p:0,par:0,
 init(){Snd.music('finale');hud('The Rainbow','Swipe across the sky!');cap('Swipe across the sky to paint God\'s rainbow! 🌈')},
 move(x,y){if(this.p>=1)return;const d=Math.hypot(x-(this.lx||x),y-(this.ly||y));this.lx=x;this.ly=y;this.p=Math.min(1,this.p+d/420);if(Math.random()<.3)Snd.play('spin',this.p);if(this.p>=1)this.finish()},
 down(x,y){this.lx=x;this.ly=y},
 finish(){Snd.play('win');if(KIDS_ON)crayonBurst(G.W/2,40,60);cap('');hud('The Rainbow','God keeps His promises!');fx(G.W/2,60,50,{k:'star',sp:100,up:20});
  setTimeout(()=>card({title:'God keeps His promises! 🌈',sub:'You finished Noah\'s Big Boat!',verse:'I have put my rainbow in the clouds. It will be the sign of the covenant between me and the earth.',ref:'Genesis 9:13',credit:NIRV_NOTICE,btns:[{label:'🏠 Home',cls:'cream',fn:()=>go(TitleScene)},{label:'↻ Play Again',cls:'green',fn:()=>go(LEVELS[0].intro)}],sfx:'fanfare'}),2600)},
 auto(dt){if(this.p<1){const a=this.t*3;this.move(G.W/2+Math.cos(a)*90,80+Math.sin(a)*30)}},
 update(dt){if(this.p>=1)this.par+=dt},
 draw(){D.bg('bg_finale');const cx=G.W/2,cy=150,R=128;const cols=['#ff5a5a','#ffa040','#ffe05a','#6ad460','#4aa8ff','#6a6ae0','#b070e0'];
  X.save();X.beginPath();X.moveTo(cx,cy);X.arc(cx,cy,R+6,Math.PI,Math.PI+Math.PI*this.p);X.closePath();X.clip();X.globalAlpha=.85;X.shadowColor='#fff';X.shadowBlur=10*RS;cols.forEach((c,i)=>{X.beginPath();X.arc(cx,cy,R-i*5,Math.PI,0);X.strokeStyle=c;X.lineWidth=5.6;X.stroke()});X.restore();
  if(this.p>0&&this.p<1){const a=Math.PI+Math.PI*this.p;X.save();X.globalCompositeOperation='lighter';const px=cx+Math.cos(a)*(R-15),py=cy+Math.sin(a)*(R-15);const g=X.createRadialGradient(px,py,0,px,py,22);g.addColorStop(0,'rgba(255,255,220,.9)');g.addColorStop(1,'rgba(255,255,200,0)');X.fillStyle=g;X.fillRect(px-22,py-22,44,44);X.restore()}
  if(kidHas('rainbow')&&this.par>0){const k=ease(clamp(this.par*.8,0,1));X.save();X.globalAlpha=k*.95;D.spr('rainbow',cx,cy-6+(1-k)*10,R*.82*(.9+.1*k));X.restore()}
  if(kidHas('cloud')){[[-1,.30],[1,.32]].forEach(([d,y],i)=>D.spr('cloud',cx+d*(G.W*.36+Math.sin(this.t*.4+i)*4),G.H*y,18))}
  if(kidHas('duck'))D.spr('duck',cx+G.W*.06,176,14,{f:-1,sy:1+Math.abs(Math.sin(this.t*5))*.06});
  D.spr('ark',cx+G.W*.22,138,58);
  const jump=this.p>=1?-Math.abs(Math.sin(this.t*6))*3:0;D.softShadow(cx-G.W*.22,168,50);D.spr('family',cx-G.W*.22,168+jump,40);
  if(this.par>0)TYPES.forEach((tp,i)=>{const k=clamp(this.par*.7-i*.22,0,1);if(k<=0)return;const xi=cx-30+(i%4)*24+(i<4?0:12),yi=i<4?160:176;drawAnimal(tp,lerp(cx+G.W*.2,xi,ease(k)),lerp(140,yi,ease(k)),.85,k<1?this.t*10:0,-1)});
  D.vig(.3);
 }};return S}
// ---------- stories ----------
const pg=(text,drawFn)=>({text,draw:drawFn});
const LEVELS=[
 {name:'Build the Ark',scene:BuildScene,ref:'Genesis 6:14',done:'The ark is built!',verse:'So make yourself an ark out of cypress wood. Make rooms in it. Cover it with tar inside and out.',
  intro:()=>Story([pg('Long ago, Noah loved God and walked with Him.',t=>{meadow(t);noahSpr(G.W/2,166,96);D.vig(.3)}),
   pg('God told Noah: “Build a big boat — an ark!”',t=>{meadow(t);X.save();X.globalCompositeOperation='lighter';const g=X.createRadialGradient(G.W/2,0,0,G.W/2,0,140);g.addColorStop(0,'rgba(255,240,170,'+(.55+.15*Math.sin(t*3))+')');g.addColorStop(1,'rgba(255,240,170,0)');X.fillStyle=g;X.fillRect(0,0,G.W,G.H);X.restore();noahSpr(G.W/2-70,166,90);X.save();X.globalAlpha=ease(t/1.2);D.spr('ark',G.W/2+60,160,110*(.6+.4*ease(t/1.2)));X.restore();D.vig(.3)})],BuildScene)},
 {name:'Two by Two',scene:AnimalsScene,ref:'Genesis 7:9',done:'All aboard!',verse:'All of them came to Noah and entered the ark. Everything happened just as God had commanded Noah.',
  intro:()=>Story([pg('Then the animals came to the ark, two by two!',t=>{meadow(t);D.spr('ark',G.W-78,160,92);TYPES.slice(0,4).forEach((tp,i)=>{const x=((t*30+i*55)%(G.W-90));drawAnimal(tp,x,158-(i%2)*6,1.1,t*10,1);drawAnimal(tp,x-18,170-(i%2)*6,1.1,t*10+1,1)});D.vig(.3)})],AnimalsScene)},
 {name:'Ride the Flood',scene:FloodScene,ref:'Genesis 7:17',done:'Forty days!',verse:'For 40 days the flood kept coming on the earth. As the waters rose higher, they lifted the ark high above the earth.',
  intro:()=>Story([pg('God shut the door. Then the rain began to fall…',t=>{meadow(t,true);D.spr('ark',G.W/2,162,110);X.save();X.strokeStyle='rgba(200,220,255,.6)';X.lineWidth=.9;X.beginPath();for(let i=0;i<70;i++){const x=(i*37+t*40)%G.W,y=(i*53+t*200)%G.H;X.moveTo(x,y);X.lineTo(x-2.4,y+8)}X.stroke();X.restore();D.vig(.5)})],FloodScene)},
 {name:"The Dove's Flight",scene:DoveScene,ref:'Genesis 8:11',done:'The dove came back!',verse:'In the evening the dove returned to him. There in its beak was a freshly picked olive leaf! So Noah knew that the water on the earth had gone down.',
  intro:()=>Story([pg('The rain stopped. Noah sent out a dove to look for dry land.',t=>{D.bg('bg_sea',null,{dy:.3});X.save();X.translate(G.W/2-50,160);X.rotate(Math.sin(t*1.5)*.03);D.spr('ark',0,0,96);X.restore();noahSpr(G.W/2-12,118,40,{f:1});const k=t%3;const wf=Math.sin(t*12);D.spr('dove',G.W/2+20+k*50,80-k*15,22,{ay:.5,sy:1+wf*.12});D.vig(.3)})],DoveScene)}
];
const TitleScene=makeTitle({title:"Noah's Big Boat",tag:'\uD83D\uDD8D\uFE0F Coloring Edition',top:'6%',play:'45%',playL:'75%',draw(t){D.bg('bg_title',null,{zoom:1+.02*Math.sin(t*.4),dy:.2});
 X.save();X.globalCompositeOperation='lighter';for(let i=0;i<14;i++){const x=(i*61+t*8)%G.W,y=(i*37+Math.sin(t+i)*10)%G.H;X.globalAlpha=.3+.3*Math.sin(t*2+i);D.sparkle(x,y,1.6+(i%3))}X.restore();D.vig(.4)}});
