#!/usr/bin/env python3
"""Headless-Chromium tests for the Coloring Edition (one picture per page). Usage: python3 test/run_tests.py PHOTO_DIR SHOT_DIR
Serves the repo on localhost, loads index.html at a phone viewport, runs the photo pipeline on synthetic photos (python3 test/simulate.py PHOTO_DIR first)."""
import sys, json, threading, http.server, socketserver, functools, time, base64, re, io
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent; PH=Path(sys.argv[1]); SH=Path(sys.argv[2]); SH.mkdir(parents=True,exist_ok=True)
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.TCPServer(('127.0.0.1',0),functools.partial(Q,directory=str(ROOT))); PORT=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{PORT}/index.html'
res=[]; errs=[]; ext=[]
def ok(name,cond,info=''):
    res.append((name,bool(cond),str(info)[:300])); print(('PASS' if cond else 'FAIL'),name,str(info)[:300])
ITEMS=['lion','elephant','giraffe','sheep','duck','noah','ark','cloud','rainbow','rock','puddle']
NICE={'noah':'Noah','ark':'The Ark'}
nice=lambda k: NICE.get(k,k.capitalize())
html=(ROOT/'index.html').read_text()
ok('no WebP anywhere in index.html','image/webp' not in html.lower())
ok('no ?. / ?? / replaceAll in the built JS (Safari 13)',not re.search(r'\?\?|\?\.[A-Za-z(\[]|replaceAll\(',html.split('<script>')[2]))
ok('no external URLs (fonts/CDN)',not re.search(r'(src|href)=["\']https?://|url\(https?://|googleapis',html))
ok('no CSS inset/flex-gap (iPadOS 13)',not re.search(r'[;{ ]inset:|display:flex[^"\'}]*;gap:',html))
ok('PDF has 11 pages',b'/Count 11' in (ROOT/'pages'/'Coloring_pages.pdf').read_bytes())
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: errs.append('PAGEERROR '+str(e)))
    pg.on('request',lambda r: ext.append(r.url) if not r.url.startswith(f'http://127.0.0.1:{PORT}') and not r.url.startswith('data:') and not r.url.startswith('blob:') else None)
    pg.goto(URL); pg.wait_for_function("typeof G!=='undefined'&&G.scene&&G.scene.name==='title'",timeout=20000); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(SH/'01_title_no_art.png'))
    ok('title loads, no class art yet',pg.evaluate("Object.keys(CA.art).length===0&&!KIDS_ON"))
    WAIT="!CA.busy&&(document.getElementById('caMsg').textContent.length>0||document.querySelector('.capick'))"
    def upload(files,sel='#caFile'):
        pg.evaluate("document.getElementById('caMsg').textContent=''")
        pg.set_input_files(sel,[str(PH/f) for f in files] if isinstance(files,list) else str(PH/files)); pg.wait_for_function(WAIT,timeout=120000); pg.wait_for_timeout(200)
    msg=lambda: pg.evaluate("document.getElementById('caMsg').textContent")
    def clear(): pg.evaluate("caRemove(KID_ITEMS.filter(k=>CA.art[k]))"); pg.wait_for_timeout(300)
    pg.evaluate("caOpen()"); pg.wait_for_timeout(300)
    pg.screenshot(path=str(SH/'02_panel_empty_landscape.png'))
    # --- every page, one photo each
    for i,k in enumerate(ITEMS,1):
        t=time.time(); upload(f'photo_{i:02d}_{k}.jpg'); m=msg(); got=pg.evaluate("Object.keys(CA.art)")
        ok(f'page {i} ({k}) photo -> read page code, saved only the {k}',nice(k) in m and k in got and len(got)==i,f'{m} ({time.time()-t:.1f}s)')
    ok('all 11 sprites stored',sorted(pg.evaluate("Object.keys(CA.art)"))==sorted(ITEMS))
    q=pg.evaluate("""async()=>{const o={};for(const k of KID_ITEMS){const a=CA.art[k];const im=new Image();im.src=a.url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let op=0,col=0,tot=c.width*c.height;for(let i=0;i<tot;i++){const a=d[i*4+3];if(a>128){op++;const mx=Math.max(d[i*4],d[i*4+1],d[i*4+2]),mn=Math.min(d[i*4],d[i*4+1],d[i*4+2]);if(mx>70&&(mx-mn)/mx>.28)col++}}
      o[k]={w:im.width,h:im.height,opaque:+(op/tot).toFixed(2),colored:+(col/Math.max(1,op)).toFixed(2),corner:d[3],corner2:d[(tot-1)*4+3]}}return o}""")
    bad=[k for k,v in q.items() if not(400<=max(v['w'],v['h'])<=514 and 0.1<v['opaque']<0.95 and v['corner']<10 and v['corner2']<10)]
    ok('each sprite: <=512px long edge, transparent corners, sensible coverage',not bad,'bad='+str(bad)+' '+json.dumps({k:(v['w'],v['h']) for k,v in q.items()}))
    ok('most sprites carry color',sum(1 for v in q.values() if v['colored']>0.12)>=8,{k:v['colored'] for k,v in q.items()})
    pg.evaluate("caRender()"); pg.wait_for_timeout(200)
    pg.screenshot(path=str(SH/'03_panel_with_cutouts_top.png'))
    pg.evaluate("document.getElementById('ca').scrollTop=520"); pg.wait_for_timeout(200); pg.screenshot(path=str(SH/'04_panel_with_cutouts_grid.png'))
    sheet=pg.evaluate("""async()=>{const c=document.createElement('canvas');c.width=1100;c.height=560;const g=c.getContext('2d');g.fillStyle='#8fb7d8';g.fillRect(0,0,c.width,c.height);let i=0;for(const k of KID_ITEMS){const im=new Image();im.src=CA.art[k].url;await im.decode();const s=Math.min(240/im.width,170/im.height),x=(i%4)*270+15,y=((i/4)|0)*185+10;g.drawImage(im,x,y,im.width*s,im.height*s);g.fillStyle='#000';g.font='14px sans-serif';g.fillText(k,x,y+180);i++}return c.toDataURL('image/png')}""")
    (SH/'05_cutouts_contact_sheet.png').write_bytes(base64.b64decode(sheet.split(',')[1]))
    # --- duck faces the same way as the page art and as the other animals
    def mask(url_or_path,isurl=True):
        im=Image.open(io.BytesIO(base64.b64decode(url_or_path.split(',')[1]))).convert('RGBA'); a=np.array(im)[...,3]>128
        ys,xs=np.where(a); a=a[ys.min():ys.max()+1,xs.min():xs.max()+1]; return np.array(Image.fromarray(a.astype(np.uint8)*255).resize((128,128)))>128
    def iou(a,b): return (a&b).sum()/max(1,(a|b).sum())
    pageart=np.array(Image.open(ROOT/'pages'/'png'/'page05_duck.png').convert('L'))
    box=pageart[108*3+30:(108+578)*3-30,66*3+30:(66+480)*3-30]<128   # inked pixels inside the box
    ys,xs=np.where(box); sil=np.zeros_like(box)
    import cv2
    m8=box.astype(np.uint8); cnts,_=cv2.findContours(m8,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE); cv2.drawContours(sil.view(np.uint8),cnts,-1,1,-1) if False else None
    filled=np.zeros(m8.shape,np.uint8); cv2.drawContours(filled,cnts,-1,1,-1); big=filled>0
    ys,xs=np.where(big); big=big[ys.min():ys.max()+1,xs.min():xs.max()+1]; pm=np.array(Image.fromarray(big.astype(np.uint8)*255).resize((128,128)))>128
    sm=mask(pg.evaluate("CA.art.duck.url"))
    a,bm=iou(sm,pm),iou(sm,pm[:,::-1])
    ok('duck sprite matches the NEW page art orientation (not mirrored)',a>bm+0.05,f'IoU as-is {a:.2f} vs mirrored {bm:.2f}')
    # duck head/beak: the page art's beak (rightmost point) is on the right half, tail on left
    ok('duck art: beak/head on the right, tail on the left (faces right like lion/elephant)', pm[:, 64:].sum()>0 and pm[:64, 96:].sum()>pm[:64, :32].sum(), f'upper-right mass {pm[:64,96:].sum()} vs upper-left {pm[:64,:32].sum()}')
    # in-game: the duck's facing flag equals its direction of travel (sprites face right at f=1)
    pg.evaluate("caClose()"); pg.wait_for_timeout(1500)
    pg.evaluate("window.__dl=[];(function(){const o=D.spr;D.spr=function(n,x,y,h,opt){if(n==='duck')window.__dl.push([x,opt&&opt.f]);return o.apply(this,arguments)}})();go(LEVELS[0].scene)"); pg.wait_for_timeout(1500); pg.evaluate("window.__dl=[]"); pg.wait_for_timeout(5000)
    dl=pg.evaluate("window.__dl"); consistent=0; total=0
    for (x0,f0),(x1,f1) in zip(dl,dl[1:]):
        if abs(x1-x0)>0.01 and abs(x1-x0)<3: total+=1; consistent+= ((x1>x0 and f1==1) or (x1<x0 and f1==-1))
    ok('gameplay: duck faces its direction of travel (right = f:1)',total>20 and consistent==total,f'{consistent}/{total} frames consistent')
    pg.screenshot(path=str(SH/'07_gameplay_ark_build_classart_on.png'))
    # --- reload persistence
    pg.reload(); pg.wait_for_function("typeof G!=='undefined'&&G.scene&&G.scene.name==='title'",timeout=20000); pg.wait_for_timeout(2000)
    ok('reload: class art persisted in IndexedDB & ON',pg.evaluate("Object.keys(CA.art).length===11&&KIDS_ON"))
    pg.screenshot(path=str(SH/'06_title_class_art_on.png'))
    for nm,sc in [('animals','LEVELS[1].scene'),('rainbow_flood','LEVELS[2].scene')]:
        pg.evaluate(f"go({sc})"); pg.wait_for_timeout(3500); pg.screenshot(path=str(SH/f'07_gameplay_{nm}_classart_on.png'))
    ok('gameplay scenes ran with class art',pg.evaluate("KIDS_ON&&IMG.lion===KID.lion"))
    pg.evaluate("go(TitleScene)"); pg.wait_for_timeout(800); pg.evaluate("kidsApply(false)")
    ok('Class Art OFF restores painted art',pg.evaluate("IMG.lion===ORIG.lion&&IMG.noah===ORIG.noah&&!IMG.rock"))
    pg.evaluate("go(LEVELS[1].scene)"); pg.wait_for_timeout(2500); pg.screenshot(path=str(SH/'08_gameplay_animals_classart_off.png'))
    pg.evaluate("kidsApply(true);go(TitleScene)")
    # --- several photos at once
    pg.evaluate("caOpen()"); clear(); upload(['photo_02_elephant.jpg','photo_07_ark.jpg','photo_09_rainbow.jpg'])
    ok('3 photos chosen at once -> all 3 saved',sorted(pg.evaluate("Object.keys(CA.art)"))==['ark','elephant','rainbow'],msg())
    # --- variants
    for n,k in [(1,'lion'),(5,'duck'),(11,'puddle')]:
        for v in ['rot90','rot180','tilt30','small','dark']:
            clear(); f=f'photo_{n:02d}_{k}_{v}.jpg'; upload(f); got=pg.evaluate("Object.keys(CA.art)")
            ok(f'variant {f}: read as {k}',got==[k],msg())
            if v in('rot90','tilt30') and k=='duck':
                s=pg.evaluate("CA.art.duck.url"); (SH/f'variant_{k}_{v}.png').write_bytes(base64.b64decode(s.split(',')[1]))
    # --- code unreadable -> 11-picture picker
    clear(); upload('photo_nocode.jpg'); has=pg.evaluate("document.querySelectorAll('.capick [data-act=pg]').length")
    ok('page code covered -> manual picker with 11 pictures',has==11,msg()); pg.screenshot(path=str(SH/'09_manual_picker.png'))
    pg.click('[data-act=pg][data-p="3"]'); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Saved')",timeout=60000)
    ok('manual pick Giraffe saves the giraffe',pg.evaluate("Object.keys(CA.art).join()")=='giraffe',msg())
    clear(); upload('photo_badcode.jpg'); ok('corrupted code (parity) -> manual picker, nothing guessed',pg.evaluate("document.querySelectorAll('.capick [data-act=pg]').length")==11 and pg.evaluate("Object.keys(CA.art).length")==0,msg())
    pg.click('[data-act=flip]'); pg.click('[data-act=flip]'); pg.click('[data-act=pg][data-p="6"]'); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Saved')",timeout=60000)
    ok('picker flip + choose Noah',pg.evaluate("Object.keys(CA.art).join()")=='noah',msg())
    # --- redo a single item
    clear(); upload('photo_02_elephant.jpg','input[data-only="lion"]')
    ok('redo lion with an elephant-page photo is refused clearly',pg.evaluate("!CA.art.lion&&!CA.art.elephant")and 'Elephant' in msg() and 'Lion' in msg(),msg())
    upload('photo_01_lion.jpg','input[data-only="lion"]'); ok('redo lion with the lion page works',pg.evaluate("Object.keys(CA.art).join()")=='lion',msg())
    # --- failures
    clear(); upload('photo_blank.jpg'); m=msg(); ok('photo with no squares -> clear message, nothing saved','4 black corner squares' in m and pg.evaluate("Object.keys(CA.art).length")==0,m)
    pg.screenshot(path=str(SH/'10_error_no_corners.png'))
    upload('photo_cutoff.jpg'); m=msg(); ok('page with corners cut off -> clear message, nothing saved','4 black corner squares' in m and pg.evaluate("Object.keys(CA.art).length")==0,m)
    (SH/'fake.heic').write_bytes(b'\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic'+b'\x00'*200)
    pg.evaluate("document.getElementById('caMsg').textContent=''"); pg.set_input_files('#caFile',str(SH/'fake.heic')); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.length>0",timeout=20000); m=msg()
    ok('undecodable (HEIC-like) file -> iPhone Most Compatible guidance','Most Compatible' in m and 'Settings' in m,m)
    pg.screenshot(path=str(SH/'11_error_heic_guidance.png'))
    upload(['photo_01_lion.jpg','photo_blank.jpg']); m=msg(); ok('one good + one bad photo: reports both',pg.evaluate("Object.keys(CA.art).join()")=='lion' and 'Saved' in m and 'corner squares' in m,m)
    pg.click('#caClr'); pg.click('#caClr'); pg.wait_for_timeout(500)
    ok('Clear all (2 taps) empties IndexedDB',pg.evaluate("Object.keys(CA.art).length===0&&!KIDS_ON") and pg.evaluate("CAIDB.get('art_lion')") is None)
    ok('print-PDF link present in panel',pg.evaluate("document.querySelector('#ca a[href=\"pages/Coloring_pages.pdf\"]')!==null"))
    # --- portrait phone
    pg.evaluate("caClose()"); pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(500)
    pg.screenshot(path=str(SH/'12_portrait_rotate_screen_with_class_art_button.png'))
    pg.click('#rotArt'); pg.wait_for_timeout(400); ok('portrait: Class Art reachable from rotate screen',pg.evaluate("document.getElementById('ca').classList.contains('on')"))
    upload('photo_08_cloud.jpg'); ok('portrait: photo works',pg.evaluate("Object.keys(CA.art).join()")=='cloud',msg())
    pg.evaluate("document.getElementById('ca').scrollTop=250"); pg.screenshot(path=str(SH/'13_portrait_panel.png'))
    ok('no console/page errors',not errs,'; '.join(errs[:5])); ok('no external network requests',not ext,'; '.join(ext[:5]))
    b.close()
n=sum(1 for r in res if r[1]); print(f'\n{n}/{len(res)} passed'); json.dump(res,open(SH/'results.json','w'),indent=1)
sys.exit(0 if n==len(res) else 1)
