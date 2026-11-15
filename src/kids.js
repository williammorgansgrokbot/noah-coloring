// ===================== KIDS' ART MODE (class coloring pages -> game sprites) =====================
const KID_ITEMS=['lion','elephant','giraffe','sheep','duck','noah','ark','cloud','rainbow','rock','puddle'];
const KID={},ORIG={};let KIDS_ON=false;
const KID_PAL=['#ff5a5a','#ffa040','#ffe05a','#6ad460','#4aa8ff','#8a6ae0','#ff7ac8'];
function kidSticker(im){// die-cut paper sticker: white border + soft rim, so crayon cutouts sit in the painted scene
 const s=Math.min(1,700/Math.max(im.width,im.height)),w=Math.round(im.width*s),h=Math.round(im.height*s),b=Math.max(4,Math.round(Math.max(w,h)*.013)),p=b*3;
 const sil=document.createElement('canvas');sil.width=w+2*p;sil.height=h+2*p;const q=sil.getContext('2d');
 for(let a=0;a<24;a++){const r=a*Math.PI/12;q.drawImage(im,p+Math.cos(r)*b,p+Math.sin(r)*b,w,h)}
 q.globalCompositeOperation='source-in';q.fillStyle='#fffaf0';q.fillRect(0,0,sil.width,sil.height);
 const c=document.createElement('canvas');c.width=sil.width;c.height=sil.height;const x=c.getContext('2d');
 x.shadowColor='rgba(40,20,5,.55)';x.shadowBlur=b*1.4;x.shadowOffsetY=b*.6;x.drawImage(sil,0,0);x.shadowColor='transparent';
 x.globalAlpha=.35;x.strokeStyle='#c9a46a';x.drawImage(sil,0,0);x.globalAlpha=1;
 x.drawImage(im,p,p,w,h);
 // gentle paper sheen on the art
 x.globalCompositeOperation='source-atop';const g=x.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,'rgba(255,255,255,.18)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(60,30,0,.10)');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
 c.kid=1;return c}
function kidsApply(on,nosave){KIDS_ON=on&&Object.keys(KID).length>0;KID_ITEMS.forEach(k=>{if(KIDS_ON&&KID[k])IMG[k]=KID[k];else if(ORIG[k])IMG[k]=ORIG[k];else delete IMG[k]});if(!nosave)store.set(GAME_ID+'Kids',KIDS_ON?'1':'0')}
const _loadAssets=loadAssets;
loadAssets=function(){return _loadAssets().then(()=>{KID_ITEMS.forEach(k=>{if(IMG[k])ORIG[k]=IMG[k]});return caLoadStored()}).then(()=>kidsApply(QS.get('kids')==='0'?false:store.get(GAME_ID+'Kids')!=='0',QS.get('kids')==='0'))};
const kidHas=k=>KIDS_ON&&!!KID[k];
// squash/stretch + paper wobble for every kid sprite
const _spr=D.spr;D.spr=function(n,x,y,h,o){if(!kidHas(n))return _spr(n,x,y,h,o);o=Object.assign({},o||{});const ph=x*.13+(n.length*1.7);
 o.rot=(o.rot||0)+Math.sin(G.t*2.2+ph)*.035;const br=Math.sin(G.t*3.1+ph)*.025;o.sy=(o.sy||1)*(1+br);o.sx=(o.sx||1)*(1-br*.7);
 if(Math.random()<.004*(h/40))fx(x+rnd(-.3,.3)*h,y-h*rnd(.3,.9),1,{k:'star',sp:8,up:6,g:0,r:1.2});
 return _spr(n,x,y,h*(n==='ark'?.88:1.1),o)};
function crayonBurst(x,y,n){for(let i=0;i<n;i++)fx(x,y,1,{c:KID_PAL[i%KID_PAL.length],sp:90,up:30,g:120,r:rnd(1.2,2.4),life:rnd(.8,1.4)})}
// meadow extras drawn by the class: rock, puddle and a waddling duck
function kidMeadowDecor(t){if(!KIDS_ON)return;
 if(kidHas('rock')){D.softShadow(26,150,26,.3);D.spr('rock',26,152,40)}
 if(kidHas('puddle')){X.save();X.globalAlpha=.95;D.spr('puddle',G.W*.42,176,16,{sx:1.2});X.restore()}
 if(kidHas('duck')){const span=G.W-60,d=(t*14)%(span*2),fw=d<span,x=30+(fw?d:span*2-d),hop=Math.abs(Math.sin(t*7));D.softShadow(x,173,7,.3);D.spr('duck',x,173-hop*1.2,15,{f:fw?1:-1,sy:1-hop*.06,sx:1+hop*.06})}}
// title: "Art by our class" ribbon + kid gallery parade
const _makeTitle=makeTitle;
makeTitle=function(o){const f=_makeTitle(Object.assign({},o,{draw(t){o.draw(t);if(!KIDS_ON)return;
  const its=KID_ITEMS.filter(k=>KID[k]&&k!=='rainbow'&&k!=='puddle');X.save();const sy=G.H*.80+2,sx0=G.W*.03,sw=G.W*.5;X.globalAlpha=.55;D.rr(sx0-4,sy-34,sw+8,40,8,'rgba(30,15,5,.55)',0);X.globalAlpha=1;D.plank(sx0-6,sy,sw+12,7);X.restore();
  its.forEach((k,i)=>{const n=its.length,x=G.W*.05+((i+.5)/n)*G.W*.47,hop=Math.abs(Math.sin(t*3+i*.9)),y=G.H*.80+1-hop*3;D.softShadow(x,G.H*.80+2,10,.35);D.spr(k,x,y,k==='ark'?20:k==='cloud'?14:24,{sy:1-hop*.05+.03,sx:1+hop*.05-.03})})}}));
 return()=>{const s=f(),ini=s.init;s.init=function(){ini.call(this);const r=document.createElement('div');r.className='kidrib';
   r.innerHTML=KIDS_ON?'🖍️ Art by our class 🖍️':'';if(KIDS_ON)UI.appendChild(r);
   btn('\uD83C\uDFA8 Class Art','cream',{left:'calc(var(--il) + 10px)',bottom:'calc(var(--ib) + 10px)',width:'auto',fontSize:'14px',padding:'4px 12px'},()=>caOpen()).title='Add your colored pages, or switch the class art on and off';
   if(Object.keys(KID).length){const b=btn(KIDS_ON?'\uD83D\uDD8D\uFE0F Class art: ON':'\uD83C\uDFA8 Class art: OFF','cream',{right:'calc(var(--ir) + 10px)',bottom:'calc(var(--ib) + 62px)',width:'auto',fontSize:'14px',padding:'4px 12px'},()=>{kidsApply(!KIDS_ON);go(TitleScene)});b.title='Switch between the class drawings and the original art'}
   const pr=document.createElement('a');pr.className='btn cream';pr.href='pages/Coloring_pages.pdf';pr.target='_blank';pr.rel='noopener';pr.innerHTML='\uD83D\uDDA8\uFE0F Print pages';Object.assign(pr.style,{right:'calc(var(--ir) + 10px)',bottom:'calc(var(--ib) + 10px)',width:'auto',fontSize:'14px',padding:'4px 12px',display:'flex',alignItems:'center',textDecoration:'none'});['touchstart','mousedown'].forEach(e=>pr.addEventListener(e,ev=>ev.stopPropagation(),{passive:true}));UI.appendChild(pr);
   if(KIDS_ON)setTimeout(()=>crayonBurst(G.W*.28,G.H*.6,30),400)};return s}};
