#!/usr/bin/env python3
"""Make fake 'kid-colored phone photos' of the two printable pages (for testing the in-game photo pipeline).
Usage: python3 test/simulate.py OUTDIR
Writes photo_page1.jpg, photo_page2.jpg (normal), and variants: rot90, rot180, tilt30, small, dark, blank, nodots."""
import json, sys, cv2, numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent; out=Path(sys.argv[1] if len(sys.argv)>1 else ROOT/'test'/'photos'); out.mkdir(parents=True,exist_ok=True)
L=json.load(open(ROOT/'src'/'layout.json')); S=3
PAL=[(40,40,230),(30,160,250),(40,220,250),(60,180,60),(220,120,40),(180,60,150),(60,100,160),(200,200,90),(120,120,120)]
def colored(i,seed=7):
    rng=np.random.default_rng(seed+i); img=cv2.imread(str(ROOT/'pages'/f'page{i+1}.png'))
    for (x,y,w,h) in L['pages'][i].values():
        sub=img[(y+5)*S:(y+h-5)*S,(x+5)*S:(x+w-5)*S]
        white=(cv2.cvtColor(sub,cv2.COLOR_BGR2GRAY)>128).astype(np.uint8)
        n,lab,st,_=cv2.connectedComponentsWithStats(white,connectivity=4); bgl=lab[2,2]
        for k in range(1,n):
            if k==bgl or st[k,4]<30 or rng.random()<0.12: continue
            c=np.array(PAL[rng.integers(len(PAL))])+rng.integers(-25,25,3); sub[lab==k]=np.clip(c,0,255)
        for _ in range(2):
            p=(int(rng.integers(40,sub.shape[1]-40)),int(rng.integers(40,sub.shape[0]-40)))
            cv2.ellipse(sub,p,(18,6),int(rng.integers(180)),0,360,tuple(int(v) for v in PAL[rng.integers(len(PAL))]),-1)
    return img
def photo(img,seed,OW=2600,OH=3400,scale=1.0,rot=0,dark=1.0,jit=90):
    rng=np.random.default_rng(seed); h,w=img.shape[:2]
    src=np.float32([[0,0],[w,0],[0,h],[w,h]]); j=lambda: rng.uniform(-jit,jit)
    base=np.float32([[250+j(),300+j()],[2330+j(),220+j()],[200+j(),3150+j()],[2420+j(),3080+j()]])
    c=np.float32([OW/2,OH/2]); dst=(base-c)*scale+c
    if rot:
        a=np.deg2rad(rot); R=np.array([[np.cos(a),-np.sin(a)],[np.sin(a),np.cos(a)]],np.float32); dst=((dst-c)@R.T)+c
    M=cv2.getPerspectiveTransform(src,dst.astype(np.float32))
    table=np.full((OH,OW,3),(70,100,140),np.uint8)
    ph=cv2.warpPerspective(img,M,(OW,OH),dst=table,borderMode=cv2.BORDER_TRANSPARENT)
    yy,xx=np.mgrid[0:OH,0:OW]; light=(0.72+0.33*(xx/OW)*(1-0.4*yy/OH))*dark
    ph=ph*light[...,None]*np.array([0.95,1.0,1.05]); ph=ph+rng.normal(0,6,ph.shape)
    return cv2.GaussianBlur(np.clip(ph,0,255).astype(np.uint8),(5,5),0)
def save(name,im,wh=None):
    if wh: im=cv2.resize(im,wh,interpolation=cv2.INTER_AREA)
    cv2.imwrite(str(out/name),im,[cv2.IMWRITE_JPEG_QUALITY,85])
for i in (0,1):
    img=colored(i); n=i+1
    save(f'photo_page{n}.jpg',photo(img,10+i))
    save(f'photo_page{n}_rot90.jpg',cv2.rotate(photo(img,20+i),cv2.ROTATE_90_CLOCKWISE))      # phone held sideways
    save(f'photo_page{n}_rot180.jpg',cv2.rotate(photo(img,30+i),cv2.ROTATE_180))               # upside down
    save(f'photo_page{n}_tilt30.jpg',photo(img,40+i,scale=0.8,rot=30))                         # page turned 30 degrees
    save(f'photo_page{n}_small.jpg',photo(img,50+i,scale=0.6),(1300,1700))                     # page small in frame, low-res
    save(f'photo_page{n}_dark.jpg',photo(img,60+i,dark=0.6))                                   # dim room
# no dots (page-ID covered) -> should fall back to the manual Page 1/2 picker
img=colored(0); img[int(770*S):,:]=255; save('photo_nodots.jpg',photo(img,70))
# not a worksheet at all / corners cut off
save('photo_blank.jpg',np.full((1500,1100,3),(180,190,200),np.uint8))
crop=photo(colored(0),80)[600:2400,500:2100]; save('photo_cutoff.jpg',crop)
print('wrote',len(list(out.glob('*.jpg'))),'photos to',out)
