// ===================== CLASS ART: phone photo of a colored page -> game sprites (all on THIS device) =====================
// No server, no uploads. Pure canvas. Saved in this browser's IndexedDB only.
const CA_PAGES=/*LAYOUT*/;
const CA_W=612,CA_H=792,CA_C=39,CA_INSET=9,CA_SC=2,CA_OUT=512,CA_MAXPX=2000;
const CA_PAGEPTS=[[CA_C,CA_C],[CA_W-CA_C,CA_C],[CA_W-CA_C,CA_H-CA_C],[CA_C,CA_H-CA_C]];// TL TR BR BL centres of the black squares
const CA_NAMES={lion:'Lion',elephant:'Elephant',giraffe:'Giraffe',sheep:'Sheep',duck:'Duck',noah:'Noah',ark:'The Ark',cloud:'Cloud',rainbow:'Rainbow',rock:'Rock',puddle:'Puddle'};
const CA={art:{},store:true,pending:null,busy:false};
const HEIC_MSG="This photo is in a format your browser can't open (iPhone photos are often HEIC). On iPhone or iPad: Settings \u203A Camera \u203A Formats \u203A choose \u201CMost Compatible\u201D, then take the photo again. Or take a screenshot of the photo, or save it as a JPG, and add that instead.";
const CORNER_MSG="I couldn't find all 4 black corner squares. Lay the page flat, keep all 4 black squares in the picture (don't cut off the edges), use good light with no big shadows, and try again.";
function caErr(code,msg){const e=new Error(msg);e.caCode=code;return e}
function caPageOf(k){for(let i=0;i<CA_PAGES.length;i++)if(CA_PAGES[i][k])return i+1;return 0}
function caPut(c,d,w,h){const g=c.getContext('2d'),id=g.createImageData(w,h);id.data.set(d);g.putImageData(id,0,0)}
const caTick=()=>new Promise(r=>setTimeout(r,30));
const caEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
// ---------- storage (IndexedDB, with a timeout so a stuck browser can never freeze the game) ----------
const CAIDB={db:null,
 open(){const self=this;if(self.db)return Promise.resolve(self.db);return new Promise(function(ok,bad){if(!window.indexedDB)return bad(new Error('no IndexedDB'));let r;try{r=indexedDB.open('noahcolor_art',1)}catch(e){return bad(e)}
  r.onupgradeneeded=function(){r.result.createObjectStore('items')};r.onsuccess=function(){self.db=r.result;ok(self.db)};r.onerror=function(){bad(r.error||new Error('idb'))};r.onblocked=function(){bad(new Error('blocked'))}})},
 tx(mode,fn){return this.open().then(db=>new Promise((ok,bad)=>{const t=db.transaction('items',mode),s=t.objectStore('items');const r=fn(s);t.oncomplete=()=>ok(r&&r.result);t.onerror=()=>bad(t.error);t.onabort=()=>bad(t.error)}))},
 get(k){return this.tx('readonly',s=>s.get(k))},put(k,v){return this.tx('readwrite',s=>s.put(v,k))},del(k){return this.tx('readwrite',s=>s.delete(k))}};
const caTimeout=(p,ms)=>Promise.race([p,new Promise((_,bad)=>setTimeout(()=>bad(new Error('timeout')),ms))]);
function caLoadStored(){return caTimeout((async()=>{for(const k of KID_ITEMS){const v=await CAIDB.get('art_'+k);if(v&&v.url)CA.art[k]=v}})(),3000).catch(()=>{CA.store=false}).then(()=>caBuildStickers())}
function caBuildStickers(){return Promise.all(KID_ITEMS.map(k=>new Promise(r=>{const a=CA.art[k];if(!a){delete KID[k];return r()}
 if(KID[k]&&KID[k].caUrl===a.url)return r();const i=new Image();i.onload=()=>{try{const c=kidSticker(i);c.caUrl=a.url;KID[k]=c}catch(e){}r()};i.onerror=()=>{delete CA.art[k];delete KID[k];r()};i.src=a.url})))}
// ---------- decode (createImageBitmap first, then <img>; HEIC failure -> plain guidance) ----------
async function caDecode(file){
 let bm=null,src=null,w=0,h=0;
 if(window.createImageBitmap){try{bm=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){try{bm=await createImageBitmap(file)}catch(e2){bm=null}}}
 if(bm){src=bm;w=bm.width;h=bm.height}
 else{try{src=await new Promise((ok,bad)=>{const u=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);ok(im)};im.onerror=()=>{URL.revokeObjectURL(u);bad(new Error('decode'))};im.src=u});w=src.naturalWidth;h=src.naturalHeight}catch(e){throw caErr('decode',HEIC_MSG)}}
 if(!w||!h)throw caErr('decode',HEIC_MSG);
 const s=Math.min(1,CA_MAXPX/Math.max(w,h)),cw=Math.round(w*s),ch=Math.round(h*s),c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');
 try{g.drawImage(src,0,0,cw,ch);if(bm&&bm.close)bm.close();return g.getImageData(0,0,cw,ch)}catch(e){throw caErr('decode','This photo is too big for this device to open. Try a smaller picture (or a screenshot of the photo).')}}
// ---------- find the 4 black corner squares ----------
function caFindSquares(d,w,h){
 const n=w*h,gray=new Uint8Array(n);let sum=0;for(let i=0;i<n;i++){const v=(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11)|0;gray[i]=v;sum+=v}
 const thr=Math.min(95,sum/n*.45),lab=new Int32Array(n),stack=new Int32Array(n),cand=[];let id=0;
 for(let i=0;i<n;i++){if(gray[i]>=thr||lab[i])continue;id++;let sp=0,area=0,x0=w,x1=0,y0=h,y1=0,sx=0,sy=0,sxx=0,syy=0,sxy=0;stack[sp++]=i;lab[i]=id;
  while(sp){const p=stack[--sp],x=p%w,y=(p/w)|0;area++;sx+=x;sy+=y;sxx+=x*x;syy+=y*y;sxy+=x*y;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
   if(x>0&&!lab[p-1]&&gray[p-1]<thr){lab[p-1]=id;stack[sp++]=p-1}if(x<w-1&&!lab[p+1]&&gray[p+1]<thr){lab[p+1]=id;stack[sp++]=p+1}
   if(y>0&&!lab[p-w]&&gray[p-w]<thr){lab[p-w]=id;stack[sp++]=p-w}if(y<h-1&&!lab[p+w]&&gray[p+w]<thr){lab[p+w]=id;stack[sp++]=p+w}}
  if(area<n*.0002||area>n*.02)continue;
  const bw=x1-x0+1,bh=y1-y0+1;if(area/(bw*bh)<.45)continue;
  const mx=sx/area,my=sy/area,cxx=sxx/area-mx*mx,cyy=syy/area-my*my,cxy=sxy/area-mx*my,tr=cxx+cyy,dt=cxx*cyy-cxy*cxy,ds=Math.sqrt(Math.max(0,tr*tr/4-dt)),l1=tr/2+ds,l2=tr/2-ds;
  if(l2<=0||l2/l1<.55)continue;const solid=12*Math.sqrt(l1*l2)/area;if(solid<.8||solid>1.3)continue;
  cand.push({area,x:mx,y:my})}
 if(cand.length<4)return null;
 cand.sort((a,b)=>b.area-a.area);const top=cand.slice(0,8);let best=null,bestA=0;
 for(let a=0;a<top.length;a++)for(let b=a+1;b<top.length;b++)for(let c=b+1;c<top.length;c++)for(let e=c+1;e<top.length;e++){
  const q=[top[a],top[b],top[c],top[e]],mn=Math.min.apply(null,q.map(p=>p.area)),mxa=Math.max.apply(null,q.map(p=>p.area));if(mxa/mn>2.3)continue;
  const cx=(q[0].x+q[1].x+q[2].x+q[3].x)/4,cy=(q[0].y+q[1].y+q[2].y+q[3].y)/4;q.sort((p,r)=>Math.atan2(p.y-cy,p.x-cx)-Math.atan2(r.y-cy,r.x-cx));
  let ok=true,sg=0,ar=0;for(let i=0;i<4;i++){const p=q[i],r=q[(i+1)%4],t=q[(i+2)%4],cr=(r.x-p.x)*(t.y-r.y)-(r.y-p.y)*(t.x-r.x);if(cr===0||(sg&&Math.sign(cr)!==sg)){ok=false;break}sg=Math.sign(cr);ar+=p.x*r.y-r.x*p.y}
  ar=Math.abs(ar)/2;if(ok&&ar>bestA){bestA=ar;best=q}}
 if(!best||bestA<n*.06)return null;// page must fill a fair part of the picture
 return best.map(p=>[p.x,p.y])}// clockwise, starting anywhere
function caDist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1])}
function caCandidates(cyc){const out=[];for(let k=0;k<4;k++){const P=[0,1,2,3].map(i=>cyc[(k+i)%4]),wl=(caDist(P[0],P[1])+caDist(P[3],P[2]))/2,hl=(caDist(P[0],P[3])+caDist(P[1],P[2]))/2,r=wl/hl;if(r>.5&&r<1.1)out.push(P)}return out}
// ---------- geometry ----------
function caHomog(src,dst){const A=[],bv=[];for(let i=0;i<4;i++){const x=src[i][0],y=src[i][1],u=dst[i][0],v=dst[i][1];A.push([x,y,1,0,0,0,-u*x,-u*y]);bv.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);bv.push(v)}
 for(let i=0;i<8;i++){let p=i;for(let r=i+1;r<8;r++)if(Math.abs(A[r][i])>Math.abs(A[p][i]))p=r;const t=A[i];A[i]=A[p];A[p]=t;const tb=bv[i];bv[i]=bv[p];bv[p]=tb;
  for(let r=0;r<8;r++)if(r!==i){const f=A[r][i]/A[i][i];for(let c=i;c<8;c++)A[r][c]-=f*A[i][c];bv[r]-=f*bv[i]}}
 const h=bv.map((v,i)=>v/A[i][i]);h.push(1);return h}
// warp a rectangle of the PAGE (pt units) out of the photo; alpha=0 where the sample fell outside the photo
function caWarp(img,H,x0,y0,w,h,sc){const ow=Math.round(w*sc),oh=Math.round(h*sc),out=new Uint8ClampedArray(ow*oh*4),S=img.data,W=img.width,HH=img.height;
 for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){const X=x0+(x+.5)/sc,Y=y0+(y+.5)/sc,z=H[6]*X+H[7]*Y+1,u=(H[0]*X+H[1]*Y+H[2])/z-.5,v=(H[3]*X+H[4]*Y+H[5])/z-.5,o=(y*ow+x)*4;
  if(!(u>=0&&v>=0&&u<W-1&&v<HH-1)){out[o]=out[o+1]=out[o+2]=255;out[o+3]=0;continue}
  const ux=u|0,vy=v|0,fx=u-ux,fy=v-vy,p=(vy*W+ux)*4,q=p+W*4,a=(1-fx)*(1-fy),b=fx*(1-fy),c=(1-fx)*fy,e=fx*fy;
  out[o]=S[p]*a+S[p+4]*b+S[q]*c+S[q+4]*e;out[o+1]=S[p+1]*a+S[p+5]*b+S[q+1]*c+S[q+5]*e;out[o+2]=S[p+2]*a+S[p+6]*b+S[q+2]*c+S[q+6]*e;out[o+3]=255}
 return{data:out,width:ow,height:oh}}
// ---------- which picture? read the page-ID code printed at the bottom ----------
// two black anchor bars with 5 slots between them: 4 id bits (filled dot = 1) + an even-parity bit. ids 1..11 = lion..puddle
const CA_CODE={y:757,slots:[262,284,306,328,350],anch:[236,376]};
function caReadId(img,P){const sc=4,x0=215,y0=740,rw=182,rh=34,R=caWarp(img,caHomog(CA_PAGEPTS,P),x0,y0,rw,rh,sc),w=R.width,h=R.height,d=R.data,g=new Float32Array(w*h),vals=[];
 for(let i=0;i<w*h;i++){if(!d[i*4+3])return 0;g[i]=d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11;vals.push(g[i])}
 vals.sort((a,b)=>a-b);const ref=vals[Math.floor(vals.length*.9)];if(ref<60)return 0;const thr=ref*.55;
 const frac=(cx,cy,rx,ry,circ)=>{let n=0,k=0;for(let y=Math.floor((cy-ry-y0)*sc);y<=Math.ceil((cy+ry-y0)*sc);y++)for(let x=Math.floor((cx-rx-x0)*sc);x<=Math.ceil((cx+rx-x0)*sc);x++){if(x<0||y<0||x>=w||y>=h)continue;
   if(circ){const dx=(x/sc+x0-cx)/rx,dy=(y/sc+y0-cy)/ry;if(dx*dx+dy*dy>1)continue}n++;if(g[y*w+x]<thr)k++}return n?k/n:0};
 for(const ax of CA_CODE.anch)if(frac(ax,CA_CODE.y,2.5,8,false)<.8)return 0;
 const bits=[];for(const sx of CA_CODE.slots){const f=frac(sx,CA_CODE.y,3.5,3.5,true);if(f>.75)bits.push(1);else if(f<.15)bits.push(0);else return 0}
 if((bits[0]+bits[1]+bits[2]+bits[3]+bits[4])%2)return 0;const id=bits[0]*8+bits[1]*4+bits[2]*2+bits[3];return id>=1&&id<=KID_ITEMS.length?id:0}
// pick orientation + picture from the code. returns {P,page} or {P,page:0} (unreadable -> ask)
function caPickPage(cands,img){const hit=[];cands.forEach(P=>{const n=caReadId(img,P);if(n)hit.push({P,page:n})});
 if(hit.length===1)return hit[0];return{P:cands[0],page:0}}
// ---------- lighting: estimate the paper brightness over the whole page, divide it out ----------
function caLight(pg){const w=pg.width,h=pg.height,d=pg.data,G=12,gw=Math.ceil(w/G),gh=Math.ceil(h/G),ref=new Float32Array(gw*gh),has=[];
 for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const v=[];for(let y=gy*G;y<Math.min(h,gy*G+G);y+=2)for(let x=gx*G;x<Math.min(w,gx*G+G);x+=2){const p=(y*w+x)*4;if(d[p+3])v.push(Math.max(d[p],d[p+1],d[p+2]))}
  if(v.length>12){v.sort((a,b)=>a-b);ref[gy*gw+gx]=v[Math.floor(v.length*.85)];has.push(ref[gy*gw+gx])}else ref[gy*gw+gx]=0}
 has.sort((a,b)=>a-b);const med=has.length?has[has.length>>1]:230,r2=new Float32Array(gw*gh),R=3;
 for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){let m=0;for(let yy=Math.max(0,gy-R);yy<=Math.min(gh-1,gy+R);yy++)for(let xx=Math.max(0,gx-R);xx<=Math.min(gw-1,gx+R);xx++)m=Math.max(m,ref[yy*gw+xx]);r2[gy*gw+gx]=Math.max(60,med*.55,m||med)}
 const r3=new Float32Array(gw*gh);for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){let s=0,c=0;for(let yy=Math.max(0,gy-2);yy<=Math.min(gh-1,gy+2);yy++)for(let xx=Math.max(0,gx-2);xx<=Math.min(gw-1,gx+2);xx++){s+=r2[yy*gw+xx];c++}r3[gy*gw+gx]=s/c}
 return{gw,gh,G,ref:r3,at(X,Y){const fx=Math.min(gw-1,Math.max(0,X/G-.5)),fy=Math.min(gh-1,Math.max(0,Y/G-.5)),x0=fx|0,y0=fy|0,x1=Math.min(gw-1,x0+1),y1=Math.min(gh-1,y0+1),ax=fx-x0,ay=fy-y0,r=this.ref;
  return(r[y0*gw+x0]*(1-ax)+r[y0*gw+x1]*ax)*(1-ay)+(r[y1*gw+x0]*(1-ax)+r[y1*gw+x1]*ax)*ay}}}
// ---------- one box -> transparent sprite (paper flood-filled from the border, white INSIDE outlines stays) ----------
function caCutBox(img,H,light,box){
 const x=box[0]+CA_INSET,y=box[1]+CA_INSET,bw=box[2]-2*CA_INSET,bh=box[3]-2*CA_INSET,R=caWarp(img,H,x,y,bw,bh,CA_SC),w=R.width,h=R.height,d=R.data,paper=new Uint8Array(w*h);let colored=0;
 for(let j=0;j<h;j++){const Y=y+(j+.5)/CA_SC;for(let i=0;i<w;i++){const X=x+(i+.5)/CA_SC,k=245/light.at(X,Y),p=(j*w+i)*4;
  for(let c=0;c<3;c++)d[p+c]=Math.min(255,d[p+c]*k);const mx=Math.max(d[p],d[p+1],d[p+2]),mn=Math.min(d[p],d[p+1],d[p+2]);
  paper[j*w+i]=mx>200&&(mx-mn)*255/mx<45?1:0;if(mx>70&&(mx-mn)/mx>.28)colored++;d[p+3]=255}}
 const st=[];for(let i=0;i<w;i++){st.push(i,(h-1)*w+i)}for(let j=0;j<h;j++){st.push(j*w,j*w+w-1)}
 while(st.length){const q=st.pop();if(paper[q]!==1)continue;paper[q]=2;const i=q%w;if(i>0)st.push(q-1);if(i<w-1)st.push(q+1);if(q>=w)st.push(q-w);if(q<w*h-w)st.push(q+w)}
 // drop specks: keep opaque pieces bigger than 2% of the biggest
 const lab=new Int32Array(w*h),sizes=[0];let id=0;const sk=[];
 for(let q=0;q<w*h;q++){if(paper[q]===2||lab[q])continue;id++;let a=0;sk.length=0;sk.push(q);lab[q]=id;while(sk.length){const p=sk.pop();a++;const i=p%w;
  if(i>0&&paper[p-1]!==2&&!lab[p-1]){lab[p-1]=id;sk.push(p-1)}if(i<w-1&&paper[p+1]!==2&&!lab[p+1]){lab[p+1]=id;sk.push(p+1)}if(p>=w&&paper[p-w]!==2&&!lab[p-w]){lab[p-w]=id;sk.push(p-w)}if(p<w*h-w&&paper[p+w]!==2&&!lab[p+w]){lab[p+w]=id;sk.push(p+w)}}sizes.push(a)}
 const big=Math.max.apply(null,sizes),al=new Float32Array(w*h);
 for(let q=0;q<w*h;q++)al[q]=paper[q]!==2&&sizes[lab[q]]>big*.02?255:0;
 // soften the cut edge (3x3 box blur of alpha)
 const tmp=new Float32Array(w*h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){let s=0,c=0;for(let t=-1;t<=1;t++){const ii=i+t;if(ii>=0&&ii<w){s+=al[j*w+ii];c++}}tmp[j*w+i]=s/c}
 let x0=w,x1=-1,y0=h,y1=-1;for(let j=0;j<h;j++)for(let i=0;i<w;i++){let s=0,c=0;for(let t=-1;t<=1;t++){const jj=j+t;if(jj>=0&&jj<h){s+=tmp[jj*w+i];c++}}const a=s/c;d[(j*w+i)*4+3]=a;if(a>8){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j}}
 if(x1<x0)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;caPut(c,d,w,h);
 const cw=x1-x0+1,ch=y1-y0+1,s=CA_OUT/Math.max(cw,ch),o=document.createElement('canvas');o.width=Math.max(1,Math.round(cw*s));o.height=Math.max(1,Math.round(ch*s));const g=o.getContext('2d');g.imageSmoothingEnabled=true;try{g.imageSmoothingQuality='high'}catch(e){}
 g.drawImage(c,x0,y0,cw,ch,0,0,o.width,o.height);
 return{url:o.toDataURL('image/png'),w:o.width,h:o.height,colored:colored>w*h*.012}}
async function caCutPage(img,P,page,only){const H=caHomog(CA_PAGEPTS,P),pg=caWarp(img,H,0,0,CA_W,CA_H,1),light=caLight(pg),out={};
 for(const k of Object.keys(CA_PAGES[page-1])){if(only&&k!==only)continue;await caTick();const r=caCutBox(img,H,light,CA_PAGES[page-1][k]);if(r)out[k]=r}return out}
// small straightened preview of the whole page (for the manual "which page?" picker)
function caThumb(img,P){const R=caWarp(img,caHomog(CA_PAGEPTS,P),0,0,CA_W,CA_H,.5),c=document.createElement('canvas');c.width=R.width;c.height=R.height;caPut(c,R.data,R.width,R.height);return c}
// ---------- save + apply ----------
async function caSave(res,page){let saveOk=true;const names=[];
 for(const k of Object.keys(res)){CA.art[k]={url:res[k].url,t:Date.now(),colored:res[k].colored};names.push(k);try{await caTimeout(CAIDB.put('art_'+k,CA.art[k]),4000)}catch(e){saveOk=false}}
 if(!saveOk)CA.store=false;await caBuildStickers();kidsApply(true);return{names,saveOk}}
async function caRemove(keys){for(const k of keys){delete CA.art[k];delete KID[k];try{await caTimeout(CAIDB.del('art_'+k),4000)}catch(e){}}kidsApply(KIDS_WANT(),true)}
const KIDS_WANT=()=>store.get(GAME_ID+'Kids')!=='0';
// ---------- the whole photo flow ----------
async function caHandle(file,only,say){
 say('Opening the photo\u2026');await caTick();const img=await caDecode(file);
 say('Looking for the 4 black corner squares\u2026');await caTick();const cyc=caFindSquares(img.data,img.width,img.height);if(!cyc)throw caErr('corners',CORNER_MSG);
 const cands=caCandidates(cyc);if(!cands.length)throw caErr('corners',CORNER_MSG);
 say('Checking which page this is\u2026');await caTick();const pk=caPickPage(cands,img);
 if(!pk.page){CA.pending={img,cands,ci:0,only};return{ask:true}}
 return caFinish(img,pk.P,pk.page,only,say)}
async function caFinish(img,P,page,only,say){const item=KID_ITEMS[page-1];
 if(only&&only!==item)throw caErr('wrongpage','That photo is the '+CA_NAMES[item]+' page, but you are redoing the '+CA_NAMES[only]+'. Take a photo of the '+CA_NAMES[only]+' page instead.');
 say('Cutting out the '+CA_NAMES[item]+'\u2026');const res=await caCutPage(img,P,page,only);
 if(!Object.keys(res).length)throw caErr('empty','I found the page but couldn\u2019t cut out the drawing. Try again with better light.');
 const r=await caSave(res,page);r.page=page;return r}
// ---------- the Class Art panel ----------
const caEl=id=>document.getElementById(id);
function caSay(t,cls){const m=caEl('caMsg');if(!m)return;m.className='camsg'+(cls?' '+cls:'');m.textContent=t||''}
function caBusy(b){CA.busy=b;const p=caEl('ca');if(p)p.classList.toggle('busy',b)}
function caTile(k){const a=CA.art[k],pg=caPageOf(k),orig=ORIG[k];
 const img=a?'<img src="'+a.url+'" alt="">':orig&&orig.src?'<img class="orig" src="'+orig.src+'" alt="">':'<div class="none">only shows with class art</div>';
 const st=a?(a.colored===false?'Saved \u2022 little color seen':'Class art \u2713'):(orig?'Painted art':'Not added');
 return '<div class="catile'+(a?' has':'')+'"><div class="cath">'+img+'</div><b>'+CA_NAMES[k]+'</b><small>Page '+pg+' of 11 \u2022 '+st+'</small><div class="cabtns"><label class="cabtn sm">'+(a?'\u21BB Redo':'+ Add')+'<input type="file" accept="image/*" data-only="'+k+'" hidden></label>'+(a?'<button class="cabtn sm ghost" data-act="del" data-k="'+k+'">Clear</button>':'')+'</div></div>'}
function caRender(){const any=KID_ITEMS.some(k=>CA.art[k]);
 caEl('caGrid').innerHTML=KID_ITEMS.map(caTile).join('');
 const t=caEl('caTog');t.textContent='Class art: '+(KIDS_ON?'ON':'OFF');t.className='cabtn tog'+(KIDS_ON?' on':'');t.style.display=any?'':'none';
 caEl('caClr').style.display=any?'':'none';caEl('caClr').textContent='Clear all';caEl('caClr').dataset.sure='';
 caEl('caNoStore').style.display=CA.store?'none':'block'}
function caPickRender(){const p=CA.pending,box=caEl('caPick');if(!p){box.innerHTML='';return}
 box.innerHTML='<div class="capick"><b>I couldn\u2019t read the page code. Which picture is this page?</b><div class="capcv"></div><div class="cabtns pk">'+KID_ITEMS.map((k,i)=>'<button class="cabtn sm" data-act="pg" data-p="'+(i+1)+'">'+CA_NAMES[k]+'</button>').join('')+'</div><div class="cabtns"><button class="cabtn sm ghost" data-act="flip">\u21BB Picture upside down? Flip it</button><button class="cabtn sm ghost" data-act="cancel">Cancel</button></div></div>';
 const c=caThumb(p.img,p.cands[p.ci]);box.querySelector('.capcv').appendChild(c)}
function caErrText(e){return e&&e.caCode?e.message:'Something went wrong reading that photo ('+(e&&e.message||e)+'). Please try another photo.'}
function caSummary(log,bad){let t='';if(log.length)t+='\u2713 Saved: '+log.join(', ')+'.';if(!CA.store&&log.length)t+=' (This browser wouldn\u2019t save them for later \u2014 they work until you close this page. Private Browsing can cause that.)';if(bad.length)t+=(t?'\n':'')+bad.join('\n');return{t,cls:bad.length?'bad':'good'}}
async function caRunFiles(files,only,log,bad){if(CA.busy)return;caBusy(true);CA.pending=null;caPickRender();log=log||[];bad=bad||[];
 for(let i=0;i<files.length;i++){const tag=files.length>1?'Photo '+(i+1)+' of '+files.length+': ':'';
  try{caSay(tag+'Working on it\u2026 (a few seconds)');const r=await caHandle(files[i],only,t=>caSay(tag+t));
   if(r.ask){CA.pending.rest=files.slice(i+1);CA.pending.log=log;CA.pending.bad=bad;const s=caSummary(log,bad);caSay(s.t,s.cls);caPickRender();caBusy(false);caRender();return}
   log.push(r.names.map(k=>CA_NAMES[k]).join(', '))}catch(e){bad.push(tag+caErrText(e))}}
 const s=caSummary(log,bad);caSay(s.t,s.cls);caBusy(false);caRender()}
async function caPicked(page){const p=CA.pending;if(!p)return;caBusy(true);CA.pending=null;caPickRender();const log=p.log||[],bad=p.bad||[];
 try{const r=await caFinish(p.img,p.cands[p.ci],page,p.only,caSay);log.push(r.names.map(k=>CA_NAMES[k]).join(', '))}catch(e){bad.push(caErrText(e))}
 caBusy(false);if(p.rest&&p.rest.length){caRunFiles(p.rest,null,log,bad);return}
 const s=caSummary(log,bad);caSay(s.t,s.cls);caRender()}
function caOpen(){caSay('');CA.pending=null;caPickRender();caRender();caEl('ca').classList.add('on')}
function caClose(){caEl('ca').classList.remove('on');CA.pending=null;if(G.scene&&G.scene.name==='title')go(TitleScene)}
(function(){
 const d=document.createElement('div');d.id='ca';
 d.innerHTML='<div class="capanel"><button class="caclose" data-act="close" aria-label="Close">&times;</button><div class="kick">Noah\u2019s Big Boat \u2022 Coloring Edition</div><h2>\uD83C\uDFA8 Class Art</h2>'
 +'<p class="canote"><b>Everything stays on this device.</b> The photo is read right here in your browser \u2014 nothing is uploaded or sent anywhere. Your drawings are saved only in this browser.</p>'
 +'<div class="cabtns main"><label class="cabtn big">\uD83D\uDCF7 Add colored page<input type="file" accept="image/*" id="caFile" multiple hidden></label><a class="cabtn" href="pages/Coloring_pages.pdf" target="_blank" rel="noopener">\uD83D\uDDA8\uFE0F Print the coloring pages (PDF)</a><button class="cabtn tog" id="caTog" data-act="tog">Class art: ON</button></div>'
 +'<ol class="catips"><li>Print the PDF (11 pages, one big picture each) at <b>100%</b>, not \u201Cfit to page\u201D. Color with bold crayons or markers.</li><li>Lay a page flat in good light. Keep <b>all 4 black corner squares</b> in the photo.</li><li>Tap <b>Add colored page</b> and take a photo (or pick several from your library). The game knows which picture it is. Repeat for each page you colored.</li></ol>'
 +'<div id="caMsg" class="camsg"></div><div id="caPick"></div><div id="caNoStore" class="camsg bad" style="display:none">This browser can\u2019t save class art for later (Private Browsing?). It will work until you close the page.</div>'
 +'<div id="caGrid" class="cagrid"></div><div class="cabtns foot"><button class="cabtn ghost" id="caClr" data-act="clr">Clear all</button><button class="cabtn big" data-act="close">Done</button></div>'
 +'<div class="caspin"><div>Working\u2026</div></div></div>';
 document.body.appendChild(d);
 ['touchstart','touchmove','touchend','touchcancel','mousedown','mousemove','mouseup'].forEach(e=>d.addEventListener(e,ev=>ev.stopPropagation(),{passive:true}));
 d.addEventListener('change',ev=>{const i=ev.target;if(!i||i.type!=='file')return;const fl=i.files?Array.prototype.slice.call(i.files):[];const only=i.getAttribute('data-only')||null;i.value='';if(fl.length)caRunFiles(fl,only)});
 d.addEventListener('click',async ev=>{const b=ev.target.closest?ev.target.closest('[data-act]'):null;if(!b)return;const a=b.getAttribute('data-act');
  if(a==='close')caClose();
  else if(a==='tog'){kidsApply(!KIDS_ON);caRender()}
  else if(a==='del'){await caRemove([b.getAttribute('data-k')]);caSay('');caRender()}
  else if(a==='clr'){if(!b.dataset.sure){b.dataset.sure='1';b.textContent='Tap again to clear ALL class art'}else{await caRemove(KID_ITEMS.filter(k=>CA.art[k]));caSay('All class art cleared. The painted art is back.');caRender()}}
  else if(a==='pg')caPicked(+b.getAttribute('data-p'));
  else if(a==='flip'){if(CA.pending){CA.pending.ci=(CA.pending.ci+1)%CA.pending.cands.length;caPickRender()}}
  else if(a==='cancel'){CA.pending=null;caPickRender();caSay('')}});
 const r=caEl('rotArt');if(r){const go2=e=>{e.preventDefault();e.stopPropagation();caOpen()};r.addEventListener('click',go2)}
})();
