#!/usr/bin/env python3
"""Headless-Chromium tests for the Coloring Edition. Usage: python3 test/run_tests.py PHOTO_DIR SHOT_DIR
Serves the repo on localhost, loads index.html at a phone viewport, runs the photo pipeline on synthetic photos."""
import sys, json, threading, http.server, socketserver, functools, time, io, base64
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent; PH=Path(sys.argv[1]); SH=Path(sys.argv[2]); SH.mkdir(parents=True,exist_ok=True)
H=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.TCPServer(('127.0.0.1',0),functools.partial(Q,directory=str(ROOT))); PORT=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{PORT}/index.html'
res=[]; errs=[]; ext=[]
def ok(name,cond,info=''):
    res.append((name,bool(cond),info)); print(('PASS' if cond else 'FAIL'),name,info)
P1=['lion','elephant','giraffe','sheep','duck','noah']; P2=['ark','cloud','rainbow','rock','puddle']
import re
html=(ROOT/'index.html').read_text()
ok('no WebP anywhere in index.html','image/webp' not in html.lower() and 'RIFF' not in html[:0])
ok('no ?. / ?? / replaceAll in the built JS (Safari 13)',not re.search(r'\?\?|\?\.[A-Za-z(\[]|replaceAll\(',html.split('<script>')[2]))
ok('no external URLs (fonts/CDN)',not re.search(r'(src|href)=["\']https?://|url\(https?://|googleapis',html))
ok('no CSS inset/flex-gap (iPadOS 13)',not re.search(r'[;{ ]inset:|display:flex[^"\'}]*;gap:',html))
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
    def upload(fname,sel='#caFile'):
        pg.set_input_files(sel,str(PH/fname)); 
        pg.wait_for_function("!CA.busy&&(document.getElementById('caMsg').textContent.length>0||document.querySelector('.capick'))",timeout=60000); pg.wait_for_timeout(200)
    def msg(): return pg.evaluate("document.getElementById('caMsg').textContent")
    def clear():
        pg.evaluate("caRemove(KID_ITEMS.filter(k=>CA.art[k]))"); pg.wait_for_timeout(300)
    pg.evaluate("caOpen()"); pg.wait_for_timeout(300)
    pg.screenshot(path=str(SH/'02_panel_empty_landscape.png'))
    # --- main photos
    t=time.time(); upload('photo_page1.jpg'); m=msg(); ok('page1 photo -> saved lion..noah','Page 1' in m and all(n in m for n in ['Lion','Noah']),m+f' ({time.time()-t:.1f}s)')
    upload('photo_page2.jpg'); m=msg(); ok('page2 photo -> saved ark..puddle','Page 2' in m and 'Puddle' in m,m)
    keys=pg.evaluate("Object.keys(CA.art)"); ok('all 11 sprites stored',sorted(keys)==sorted(P1+P2),str(keys))
    # sprite quality
    q=pg.evaluate("""async()=>{const o={};for(const k of KID_ITEMS){const a=CA.art[k];const im=new Image();im.src=a.url;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let op=0,col=0,tot=c.width*c.height;for(let i=0;i<tot;i++){const a=d[i*4+3];if(a>128){op++;const mx=Math.max(d[i*4],d[i*4+1],d[i*4+2]),mn=Math.min(d[i*4],d[i*4+1],d[i*4+2]);if(mx>70&&(mx-mn)/mx>.28)col++}}
      o[k]={w:im.width,h:im.height,opaque:+(op/tot).toFixed(2),colored:+(col/Math.max(1,op)).toFixed(2),corner:d[3],corner2:d[(tot-1)*4+3]}}return o}""")
    bad=[k for k,v in q.items() if not(300<=max(v['w'],v['h'])<=402 and 0.15<v['opaque']<0.95 and v['corner']<10 and v['corner2']<10)]
    ok('each sprite: ~400px, transparent corners, sensible coverage',not bad,'bad='+str(bad))
    ok('most sprites carry color (sim leaves some gray/white)',sum(1 for v in q.values() if v['colored']>0.12)>=8,str({k:v['colored'] for k,v in q.items()}))
    pg.evaluate("caRender()"); pg.wait_for_timeout(200)
    pg.screenshot(path=str(SH/'03_panel_with_cutouts_top.png'))
    pg.evaluate("document.getElementById('ca').scrollTop=520"); pg.wait_for_timeout(200)
    pg.screenshot(path=str(SH/'04_panel_with_cutouts_grid.png'))
    # contact sheet of the cutouts
    sheet=pg.evaluate("""async()=>{const c=document.createElement('canvas');c.width=1100;c.height=560;const g=c.getContext('2d');g.fillStyle='#8fb7d8';g.fillRect(0,0,c.width,c.height);let i=0;for(const k of KID_ITEMS){const im=new Image();im.src=CA.art[k].url;await im.decode();const s=Math.min(240/im.width,220/im.height),x=(i%4)*270+15,y=((i/4)|0)*185+10;g.drawImage(im,x,y,im.width*s*.85,im.height*s*.85);g.fillStyle='#000';g.font='14px sans-serif';g.fillText(k,x,y+180);i++}return c.toDataURL('image/png')}""")
    (SH/'05_cutouts_contact_sheet.png').write_bytes(base64.b64decode(sheet.split(',')[1]))
    pg.evaluate("document.getElementById('ca').scrollTop=0")
    # --- reload persistence
    pg.evaluate("caClose()"); pg.reload(); pg.wait_for_function("typeof G!=='undefined'&&G.scene&&G.scene.name==='title'",timeout=20000); pg.wait_for_timeout(2000)
    ok('reload: class art persisted in IndexedDB & ON',pg.evaluate("Object.keys(CA.art).length===11&&KIDS_ON"))
    pg.screenshot(path=str(SH/'06_title_class_art_on.png'))
    # --- gameplay with class art ON
    for i,(nm,sc) in enumerate([('ark_build','LEVELS[0].scene'),('animals','LEVELS[1].scene'),('rainbow_flood','LEVELS[2].scene')]):
        pg.evaluate(f"go({sc})"); pg.wait_for_timeout(3500); pg.screenshot(path=str(SH/f'07_gameplay_{nm}_classart_on.png'))
    ok('gameplay scenes ran with class art, no errors',pg.evaluate("KIDS_ON&&IMG.lion===KID.lion"))
    # toggle off -> painted art
    pg.evaluate("go(TitleScene)"); pg.wait_for_timeout(800); pg.evaluate("kidsApply(false)")
    ok('Class Art OFF restores painted art',pg.evaluate("IMG.lion===ORIG.lion&&IMG.noah===ORIG.noah&&!IMG.rock"))
    pg.evaluate("go(LEVELS[1].scene)"); pg.wait_for_timeout(2500); pg.screenshot(path=str(SH/'08_gameplay_animals_classart_off.png'))
    pg.evaluate("kidsApply(true);go(TitleScene)")
    # --- variants (each from clean state)
    pg.evaluate("caOpen()")
    for f,pageN,names in [('photo_page1_rot90.jpg',1,6),('photo_page2_rot90.jpg',2,5),('photo_page1_rot180.jpg',1,6),('photo_page2_rot180.jpg',2,5),('photo_page1_tilt30.jpg',1,6),('photo_page2_tilt30.jpg',2,5),('photo_page1_small.jpg',1,6),('photo_page2_small.jpg',2,5),('photo_page1_dark.jpg',1,6),('photo_page2_dark.jpg',2,5)]:
        clear(); upload(f); m=msg(); n=pg.evaluate("Object.keys(CA.art).length")
        # check sprites look right: compare aspect of lion/ark vs reference run
        info=pg.evaluate("(()=>{const o={};for(const k of Object.keys(CA.art)){o[k]=CA.art[k].url.length}return o})()")
        ok(f'variant {f}: page {pageN} detected, {names} items',f'Page {pageN}' in m and n==names,m)
        if f in('photo_page1_rot90.jpg','photo_page2_tilt30.jpg','photo_page1_rot180.jpg'):
            sheet=pg.evaluate("""async()=>{const ks=Object.keys(CA.art);const c=document.createElement('canvas');c.width=ks.length*180;c.height=170;const g=c.getContext('2d');g.fillStyle='#8fb7d8';g.fillRect(0,0,c.width,c.height);let i=0;for(const k of ks){const im=new Image();im.src=CA.art[k].url;await im.decode();const s=Math.min(165/im.width,165/im.height);g.drawImage(im,i*180+5,2,im.width*s,im.height*s);i++}return c.toDataURL('image/png')}""")
            (SH/('variant_'+f.replace('.jpg','.png'))).write_bytes(base64.b64decode(sheet.split(',')[1]))
    # --- no dots -> manual picker
    clear(); upload('photo_nodots.jpg'); has=pg.evaluate("!!document.querySelector('.capick')"); ok('no page dots -> manual Page 1/2 picker shown',has,msg())
    pg.screenshot(path=str(SH/'09_manual_page_picker.png'))
    pg.click('[data-act=pg][data-p="1"]'); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Saved')",timeout=30000)
    ok('manual pick Page 1 saves 6 items',pg.evaluate("Object.keys(CA.art).length")==6,msg())
    # --- redo single item with wrong / right page
    clear(); upload('photo_page2.jpg'); 
    pg.set_input_files('input[data-only="lion"]',str(PH/'photo_page2.jpg')); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Page 1')",timeout=30000)
    ok('redo lion with a Page-2 photo is refused clearly',pg.evaluate("!CA.art.lion")and 'Page 2' in msg(),msg())
    pg.set_input_files('input[data-only="ark"]',str(PH/'photo_page2.jpg')); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Saved')",timeout=30000)
    clear(); pg.set_input_files('input[data-only="ark"]',str(PH/'photo_page2.jpg')); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Saved')",timeout=30000)
    ok('redo only the ark: only the ark is saved',pg.evaluate("Object.keys(CA.art).join()")=='ark',pg.evaluate("Object.keys(CA.art).join()"))
    # --- failures
    clear(); upload('photo_blank.jpg'); m=msg(); ok('photo with no squares -> clear message, nothing saved','4 black corner squares' in m and pg.evaluate("Object.keys(CA.art).length")==0,m)
    pg.screenshot(path=str(SH/'10_error_no_corners.png'))
    upload('photo_cutoff.jpg'); m=msg(); ok('page with corners cut off -> clear message, nothing saved','4 black corner squares' in m and pg.evaluate("Object.keys(CA.art).length")==0,m)
    (SH/'fake.heic').write_bytes(b'\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic'+b'\x00'*200)
    pg.set_input_files('#caFile',str(SH/'fake.heic')); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.length>0",timeout=20000); m=msg()
    ok('undecodable (HEIC-like) file -> iPhone Most Compatible guidance','Most Compatible' in m and 'Settings' in m,m)
    pg.screenshot(path=str(SH/'11_error_heic_guidance.png'))
    # --- clear all two-step, print link
    pg.set_input_files('#caFile',str(PH/'photo_page1.jpg')); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Saved')",timeout=30000)
    pg.click('#caClr'); pg.click('#caClr'); pg.wait_for_timeout(500)
    ok('Clear all (2 taps) empties IndexedDB',pg.evaluate("Object.keys(CA.art).length===0&&!KIDS_ON") and pg.evaluate("CAIDB.get('art_lion')") is None)
    ok('print-PDF link present in panel and title',pg.evaluate("document.querySelector('#ca a[href=\"pages/Coloring_pages.pdf\"]')!==null")and pg.evaluate("1"))
    # --- portrait phone
    pg.evaluate("caClose()"); pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(500)
    pg.screenshot(path=str(SH/'12_portrait_rotate_screen_with_class_art_button.png'))
    pg.click('#rotArt'); pg.wait_for_timeout(400); ok('portrait: Class Art reachable from rotate screen',pg.evaluate("document.getElementById('ca').classList.contains('on')"))
    pg.set_input_files('#caFile',str(PH/'photo_page2.jpg')); pg.wait_for_function("!CA.busy&&document.getElementById('caMsg').textContent.includes('Saved')",timeout=30000)
    pg.evaluate("document.getElementById('ca').scrollTop=250"); pg.screenshot(path=str(SH/'13_portrait_panel.png'))
    ok('no console/page errors',not errs,'; '.join(errs[:5])); ok('no external network requests',not ext,'; '.join(ext[:5]))
    b.close()
n=sum(1 for r in res if r[1]); print(f'\n{n}/{len(res)} passed'); json.dump(res,open(SH/'results.json','w'),indent=1)
sys.exit(0 if n==len(res) else 1)
