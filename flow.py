# flowing, room-covering camera route: base A* path + curl/orbit loops, smoothed
import json,re,math,numpy as np
from PIL import Image,ImageDraw
from scipy import ndimage as ndi
d=json.load(open('plan.json'))
t=json.load(open('/Users/yasseenkilani/unit3d/build/trace.json'))
P=lambda p:(p[0]*119+105,p[1]*119+412)
W,H=1000,1700
m=Image.new('L',(W,H),0);dr=ImageDraw.Draw(m)
for w in t['walls']:
    dr.polygon([P(p) for p in w['outer']],fill=1)
    for h in w.get('holes',[]): dr.polygon([P(p) for p in h],fill=0)
wall=np.asarray(m)>0
clear=ndi.distance_transform_edt(~wall)
base=[tuple(map(float,x)) for x in re.findall(r'[ML]\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)',d['route'])]
# resample
def resample(pts,step):
    out=[pts[0]];acc=0
    for a,b in zip(pts,pts[1:]):
        L=math.dist(a,b)
        while acc+L>=step:
            f=(step-acc)/L;a=(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f);out.append(a);L=math.dist(a,b);acc=0
        acc+=L
    out.append(pts[-1]);return out
B=resample(base,24)
def ok(p,c=26):
    x,y=int(p[0]),int(p[1]);return 0<=x<W and 0<=y<H and clear[y,x]>=c
def nearbase(p):return min(math.dist(p,q) for q in B[::2])<170
# orbit anchors as fractions of path
anchors=[.10,.22,.31,.42,.52,.63,.74,.84]
out=[];last=0;N=len(B)
loops=[]
for fa in anchors:
    i=int(fa*(N-1));A=B[i];A2=B[min(N-1,i+2)];A0=B[max(0,i-2)]
    tx,ty=A2[0]-A0[0],A2[1]-A0[1];n=math.hypot(tx,ty);tx/=n;ty/=n
    best=None
    for r in (95,80,68,56,46):
        for side in (1,-1):
            nx,ny=-ty*side,tx*side;C=(A[0]+nx*r,A[1]+ny*r)
            pts=[]
            a0=math.atan2(A[1]-C[1],A[0]-C[0])
            # direction so circle tangent at A matches path tangent
            for k in range(0,37):
                a=a0+side*(-1)*2*math.pi*k/36 if False else a0+(-side)*2*math.pi*k/36
                pts.append((C[0]+r*math.cos(a),C[1]+r*math.sin(a)))
            # tangent check
            tg=(pts[1][0]-pts[0][0],pts[1][1]-pts[0][1])
            if tg[0]*tx+tg[1]*ty<0: pts=[(C[0]+r*math.cos(a0-(a-a0)),C[1]+r*math.sin(a0-(a-a0))) for a,(_,_) in zip([a0+(-side)*2*math.pi*k/36 for k in range(37)],pts)]
            if all(ok(p) and nearbase(p) for p in pts): best=pts;break
        if best:break
    loops.append((i,best))
res=[];prev=0
for i,l in loops:
    res+=B[prev:i]
    if l: res+=l[:-1]
    prev=i
res+=B[prev:]
# smooth: gaussian on coordinates, then keep clearance
arr=np.array(res);sm=np.stack([ndi.gaussian_filter1d(arr[:,0],2.2,mode='nearest'),ndi.gaussian_filter1d(arr[:,1],2.2,mode='nearest')],1)
sm[0]=arr[0];sm[-1]=arr[-1]
bad=sum(1 for p in sm if not ok(p,14))
print('loops',[bool(l) for _,l in loops],'pts',len(sm),'badpts',bad)
# catmull-rom -> cubic bezier
def cr(pts):
    s=f"M{pts[0][0]:.0f} {pts[0][1]:.0f}"
    for k in range(len(pts)-1):
        p0=pts[max(0,k-1)];p1=pts[k];p2=pts[k+1];p3=pts[min(len(pts)-1,k+2)]
        c1=(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6);c2=(p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6)
        s+=f" C{c1[0]:.0f} {c1[1]:.0f} {c2[0]:.0f} {c2[1]:.0f} {p2[0]:.0f} {p2[1]:.0f}"
    return s
d['route']=cr([tuple(p) for p in sm[::2]]+[tuple(sm[-1])])
json.dump(d,open('plan.json','w'))
# overlay preview
im=Image.new('RGB',(W,H),'#0E1E14');dd=ImageDraw.Draw(im)
im.paste((235,228,214),mask=Image.fromarray((wall*255).astype('uint8')))
dd.line([tuple(p) for p in sm],fill=(180,209,151),width=5)
im.resize((500,850)).save('/private/tmp/claude-501/-Users-yasseenkilani--openjarvis-src/d3d3467e-24a1-41e4-bbed-9fd8b3e548c0/scratchpad/flow.png')
