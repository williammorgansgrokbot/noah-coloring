"""Coloring Edition: ONE big picture per letter page (11 pages) -> SVG/PNG/PDF via headless Chromium, plus src/layout.json.
Run from the repo root:  python3 tools/make_pages.py"""
import json, math, base64
import cv2
from pathlib import Path
W,H=612,792; FID=30; FM=24
BW,BH=230,210; XS=[66,316]; YS=[95,325,555]
S='stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"'
F=f'fill="#fff" {S}'
def star(cx,cy,r1,r2,n):
    pts=[]
    for i in range(2*n):
        r=r1 if i%2==0 else r2; a=math.pi*i/n
        pts.append(f"{cx+r*math.cos(a):.1f},{cy+r*math.sin(a):.1f}")
    return f'<polygon points="{" ".join(pts)}" {F}/>'
eye=lambda x,y:f'<circle cx="{x}" cy="{y}" r="5" fill="#000"/>'
legs=lambda xs,y0,y1,w=18:''.join(f'<rect x="{x}" y="{y0}" width="{w}" height="{y1-y0}" rx="6" {F}/>' for x in xs)
# art in a 200x170 local frame
ART={
'lion': legs([45,70,120,145],95,150)+f'<path d="M160 90 Q195 70 185 45" fill="none" {S}/><circle cx="187" cy="42" r="8" {F}/>'
 +f'<ellipse cx="105" cy="95" rx="70" ry="35" {F}/>'+star(55,65,55,40,12)+f'<circle cx="55" cy="65" r="32" {F}/>'+eye(44,58)+eye(66,58)+f'<path d="M48 76 Q55 84 62 76" fill="none" {S}/>',
'elephant': legs([50,80,120,150],100,155,22)+f'<ellipse cx="110" cy="90" rx="75" ry="48" {F}/><path d="M40 85 Q15 120 25 155" fill="none" stroke="#000" stroke-width="18" stroke-linecap="round"/><path d="M40 85 Q15 120 25 155" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><circle cx="45" cy="70" r="32" {F}/><ellipse cx="72" cy="68" rx="22" ry="30" {F}/>'+eye(38,62),
'giraffe': legs([70,90,125,145],110,165,14)+f'<ellipse cx="110" cy="105" rx="50" ry="25" {F}/><path d="M70 100 L60 35 L80 35 L90 95 Z" {F}/><ellipse cx="62" cy="28" rx="26" ry="16" {F}/><line x1="55" y1="14" x2="52" y2="2" {S}/><line x1="68" y1="14" x2="71" y2="2" {S}/>'
 +''.join(f'<circle cx="{x}" cy="{y}" r="8" {F}/>' for x,y in [(95,100),(120,112),(140,98),(73,70)])+eye(52,25),
'sheep': legs([65,90,120,145],100,150,14)+''.join(f'<circle cx="{x}" cy="{y}" r="24" {F}/>' for x,y in [(70,90),(100,75),(130,75),(155,92),(130,110),(95,110)])+f'<ellipse cx="112" cy="92" rx="55" ry="28" fill="#fff"/><ellipse cx="45" cy="85" rx="22" ry="26" {F}/>'+eye(38,80)+eye(52,80),
'duck': f'<path d="M40 110 Q40 150 100 150 Q170 150 175 95 L145 110 Q120 90 80 105 Z" {F}/><circle cx="70" cy="65" r="30" {F}/><path d="M98 60 L135 68 L98 78 Z" {F}/><path d="M90 120 Q115 105 140 120" fill="none" {S}/>'+eye(75,58)+legs([80,110],150,165,10),
'noah': f'<path d="M60 165 L70 80 L130 80 L140 165 Z" {F}/><circle cx="100" cy="50" r="30" {F}/><path d="M72 60 Q100 120 128 60 Q120 85 100 88 Q80 85 72 60" {F}/><path d="M140 30 L150 165" {S}/><path d="M70 95 L40 125" {S}/><path d="M130 95 L148 110" {S}/>'+eye(90,45)+eye(110,45)+f'<line x1="60" y1="130" x2="140" y2="130" {S}/>',
'ark': f'<path d="M10 100 L190 100 L165 160 L35 160 Z" {F}/><rect x="55" y="45" width="90" height="55" {F}/><path d="M45 48 L100 15 L155 48 Z" {F}/><rect x="70" y="60" width="20" height="20" {F}/><rect x="110" y="60" width="20" height="20" {F}/><line x1="25" y1="128" x2="178" y2="128" {S}/>',
'cloud': f'<path d="M25 105 A35 35 0 0 1 62 72 A45 45 0 0 1 140 72 A35 35 0 0 1 175 105 A30 30 0 0 1 150 135 L50 135 A30 30 0 0 1 25 105 Z" {F}/>',
'rainbow': ''.join(f'<path d="M{100-r} 150 A{r} {r} 0 0 1 {100+r} 150 Z" {F}/>' for r in [95,78,61,44,27]),
'rock': f'<path d="M20 150 L35 95 L75 60 L130 65 L170 100 L185 150 Z" {F}/><path d="M75 60 L95 105 L130 65" fill="none" {S}/>',
'puddle': f'<path d="M20 120 Q20 85 70 90 Q100 70 140 88 Q190 90 180 125 Q175 155 110 150 Q70 160 40 148 Q20 140 20 120 Z" {F}/><ellipse cx="80" cy="115" rx="18" ry="7" {F}/><ellipse cx="135" cy="120" rx="12" ry="5" {F}/>',
}
DERIVED=['lion','elephant','giraffe','sheep','noah','ark','cloud','rock']
def img_art(name,fw=200,fh=170):
    im=cv2.imread(f"lineart/{name}.png",0); h,w=im.shape; s=min(fw/w,fh/h); dw,dh=w*s,h*s
    b=base64.b64encode(open(f"lineart/{name}.png","rb").read()).decode()
    return f'<image x="{(fw-dw)/2:.1f}" y="{(fh-dh)/2:.1f}" width="{dw:.1f}" height="{dh:.1f}" href="data:image/png;base64,{b}"/>'

S2='stroke="#000" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"'; F2=f'fill="#fff" {S2}'
ART['duck']=(f'<path d="M122 150 l4 14 M126 164 l10 2 M126 164 l-6 3 M88 150 l3 14 M91 164 l10 2 M91 164 l-6 3" fill="none" {S2}/>'  # duck faces RIGHT like the other animals: tail left, head+beak right, toes right
 f'<path d="M170 112 Q178 88 156 92 Q140 96 130 104 Q110 92 72 96 Q32 100 28 74 Q14 96 20 118 Q30 152 88 154 Q142 156 160 134 Q172 124 170 112 Z" {F2}/>'
 f'<path d="M116 118 Q90 104 60 116 Q70 136 96 136 Q112 132 116 118 Z" {F2}/><path d="M104 124 Q90 120 76 126" fill="none" {S2}/>'
 f'<path d="M108 106 Q86 92 90 64 Q96 30 128 30 Q160 32 160 62 Q160 86 140 98" {F2}/><path d="M120 30 Q122 18 134 16 M128 30 Q134 22 142 24" fill="none" {S2}/>'
 f'<path d="M156 58 Q182 56 192 64 Q186 76 158 74 Z" {F2}/><path d="M158 66 Q174 68 190 65" fill="none" {S2}/>'
 f'<ellipse cx="138" cy="54" rx="6" ry="8" fill="#000"/><circle cx="140" cy="51" r="2.2" fill="#fff"/><path d="M126 70 Q130 74 134 70" fill="none" {S2}/>')
ART['rainbow']=(''.join(f'<path d="M{100-r} 140 A{r} {r*0.9:.0f} 0 0 1 {100+r} 140" fill="none" {S2}/>' for r in [96,84,72,60,48,36])
 +f'<path d="M4 140 L196 140" fill="none" stroke="#fff" stroke-width="1"/>'
 +f'<path d="M0 150 Q-6 132 12 130 Q14 116 30 120 Q40 110 52 122 Q66 124 62 140 Q60 152 44 152 L10 152 Q0 152 0 150 Z" {F2}/>'
 +f'<path d="M138 150 Q132 132 150 130 Q152 116 168 120 Q178 110 190 122 Q204 124 200 140 Q198 152 182 152 L148 152 Q138 152 138 150 Z" {F2}/>')
ART['puddle']=(f'<path d="M14 122 Q12 98 52 98 Q74 82 112 92 Q150 84 178 104 Q198 122 176 138 Q150 156 104 150 Q62 158 34 146 Q14 138 14 122 Z" {F2}/>'
 f'<ellipse cx="100" cy="122" rx="40" ry="11" fill="none" {S2}/><ellipse cx="100" cy="122" rx="20" ry="5" fill="none" {S2}/>'
 f'<path d="M60 112 Q70 106 82 108" fill="none" {S2}/><path d="M150 112 Q156 108 164 112" fill="none" {S2}/>'
 f'<path d="M100 40 Q88 60 92 70 Q100 80 108 70 Q112 60 100 40 Z" {F2}/><path d="M60 56 Q54 66 56 72 Q60 78 66 72 Q68 66 60 56 Z" {F2}/><path d="M142 50 Q136 60 138 66 Q142 72 148 66 Q150 60 142 50 Z" {F2}/>')
# ---------------- one big picture per page ----------------
ITEMS=["lion","elephant","giraffe","sheep","duck","noah","ark","cloud","rainbow","rock","puddle"]   # page id = index+1
NAMES={"noah":"NOAH","ark":"THE ARK"}
BX,BY,BW,BH=66,108,480,578          # the big drawing box (pt)
CODE_Y=757; SLOTS=[262+22*i for i in range(5)]; ANCH=[236,376]   # page-ID code: anchor bar, 5 slots (4 id bits + even parity), anchor bar
def code_bits(n):
    b=[(n>>k)&1 for k in (3,2,1,0)]; return b+[sum(b)&1]
def img_art_big(name,fw,fh):
    im=cv2.imread(f"tools/lineart/{name}.png",0); h,w=im.shape
    im=cv2.resize(im,None,fx=2,fy=2,interpolation=cv2.INTER_CUBIC); _,im=cv2.threshold(cv2.GaussianBlur(im,(0,0),1.2),150,255,cv2.THRESH_BINARY)
    ok,buf=cv2.imencode('.png',im); b=base64.b64encode(buf.tobytes()).decode()
    s=min(fw/w,fh/h); dw,dh=w*s,h*s
    return f'<image x="{(fw-dw)/2:.1f}" y="{(fh-dh)/2:.1f}" width="{dw:.1f}" height="{dh:.1f}" href="data:image/png;base64,{b}"/>'
def page_svg(n):
    name=ITEMS[n-1]; label=NAMES.get(name,name.upper()); W_,H_=W,H
    s=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="#fff"/>'
    for fx,fy in [(FM,FM),(W-FM-FID,FM),(FM,H-FM-FID),(W-FM-FID,H-FM-FID)]:
        s+=f'<rect x="{fx}" y="{fy}" width="{FID}" height="{FID}" fill="#000"/>'
    s+=f'<text x="{W/2}" y="50" font-family="Trebuchet MS, Verdana, sans-serif" font-weight="900" font-size="24" text-anchor="middle">Noah\'s Big Boat \u2022 Color the {label.title().replace('The ','')}!</text>'
    s+=f'<text x="{W/2}" y="72" font-family="Arial" font-size="12" text-anchor="middle">Color inside the box. Keep all 4 black corner squares in the photo!</text>'
    s+=f'<text x="{W/2}" y="{BY-8}" font-family="Trebuchet MS, Verdana, sans-serif" font-weight="900" font-size="15" letter-spacing="3" text-anchor="middle">{label}</text>'
    s+=f'<rect x="{BX}" y="{BY}" width="{BW}" height="{BH}" fill="none" stroke="#000" stroke-width="3"/>'
    for cx,cy,dx,dy in [(BX,BY,1,1),(BX+BW,BY,-1,1),(BX,BY+BH,1,-1),(BX+BW,BY+BH,-1,-1)]:
        s+=f'<path d="M{cx} {cy+dy*24} L{cx} {cy} L{cx+dx*24} {cy}" fill="none" stroke="#000" stroke-width="7" stroke-linecap="square"/>'
    # art: fit inside the box with a margin
    mw,mh=BW-40,BH-40
    if name in DERIVED:
        art=img_art_big(name,mw,mh)
    else:   # hand-drawn 200x170 frame, scaled to fit
        k=min(mw/200,mh/170); art=f'<g transform="translate({(mw-200*k)/2:.1f},{(mh-170*k)/2:.1f}) scale({k:.3f})">{ART[name]}</g>'
    s+=f'<g transform="translate({BX+20},{BY+20})">{art}</g>'
    s+=f'<text x="{W/2}" y="{BY+BH+28}" font-family="Arial" font-size="11" fill="#444" text-anchor="middle">Page {n} of 11 \u2022 {label.title()}</text>'
    # page-ID code (the game reads this from the photo): two anchor bars + 5 slots (filled dot = 1, empty = 0)
    for ax in ANCH: s+=f'<rect x="{ax-3.5}" y="{CODE_Y-11}" width="7" height="22" fill="#000"/>'
    for sx,bit in zip(SLOTS,code_bits(n)):
        if bit: s+=f'<circle cx="{sx}" cy="{CODE_Y}" r="6.5" fill="#000"/>'
    return s+'</svg>'
if __name__=="__main__":
    from playwright.sync_api import sync_playwright
    Path("pages/png").mkdir(parents=True,exist_ok=True); Path("pages/individual").mkdir(parents=True,exist_ok=True)
    layout={"page":[W,H],"fid":[FM,FID],"code":{"y":CODE_Y,"slots":SLOTS,"anchors":ANCH},"items":ITEMS,"pages":[{n:[BX,BY,BW,BH]} for n in ITEMS]}
    with sync_playwright() as p:
        b=p.chromium.launch(); pg=b.new_page(viewport={"width":W,"height":H},device_scale_factor=3); html=""
        for i,name in enumerate(ITEMS,1):
            svg=page_svg(i); 
            pg.set_content(f'<body style="margin:0">{svg}</body>'); pg.screenshot(path=f"pages/png/page{i:02d}_{name}.png")
            full=svg.replace(f'width="{W}" height="{H}"','width="100%" height="100%"')
            html+=f'<div style="page-break-after:always;width:8.5in;height:11in">{full}</div>'
            pg.set_content(f'<html><style>@page{{size:letter;margin:0}}body{{margin:0}}</style><body><div style="width:8.5in;height:11in">{full}</div></body></html>')
            pg.pdf(path=f"pages/individual/page{i:02d}_{name}.pdf",format="Letter",print_background=True,margin={"top":"0","bottom":"0","left":"0","right":"0"})
        pg.set_content(f'<html><style>@page{{size:letter;margin:0}}body{{margin:0}}</style><body>{html}</body></html>')
        pg.pdf(path="pages/Coloring_pages.pdf",format="Letter",print_background=True,margin={"top":"0","bottom":"0","left":"0","right":"0"})
        b.close()
    json.dump(layout,open("src/layout.json","w"),indent=1); print("wrote 11 pages")
