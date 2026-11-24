import json,math,numpy as np,sys
from PIL import Image,ImageDraw
from scipy import ndimage as ndi
t=json.load(open('/Users/yasseenkilani/unit3d/build/trace.json'))
P=lambda p:(p[0]*119+105,p[1]*119+412)
W,H=1000,1700
m=Image.new('L',(W,H),0);dr=ImageDraw.Draw(m)
for w in t['walls']:
    dr.polygon([P(p) for p in w['outer']],fill=1)
    for h in w.get('holes',[]): dr.polygon([P(p) for p in h],fill=0)
wall=np.asarray(m)>0;clear=ndi.distance_transform_edt(~wall)
# waypoints in half-scale preview coords (x2 -> plan px)
wp=json.load(open('wp.json'))
pts=[(x*2,y*2) for x,y in wp]
def cr_pts(pts,n=14):
    out=[]
    for k in range(len(pts)-1):
        p0=pts[max(0,k-1)];p1=pts[k];p2=pts[k+1];p3=pts[min(len(pts)-1,k+2)]
        for s in range(n):
            u=s/n;u2=u*u;u3=u2*u
            out.append(tuple(0.5*((2*p1[i])+(-p0[i]+p2[i])*u+(2*p0[i]-5*p1[i]+4*p2[i]-p3[i])*u2+(-p0[i]+3*p1[i]-3*p2[i]+p3[i])*u3) for i in(0,1)))
    out.append(pts[-1]);return out
dense=cr_pts(pts)
bad=[(round(p[0]/2),round(p[1]/2)) for p in dense if clear[int(p[1]),int(p[0])]<16]
print('min clearance',min(clear[int(p[1]),int(p[0])] for p in dense),'bad',bad[::6][:20])
im=Image.new('RGB',(W,H),'#0E1E14');dd=ImageDraw.Draw(im)
im.paste((235,228,214),mask=Image.fromarray((wall*255).astype('uint8')))
for g in range(0,500,50):
    dd.line([(g*2,0),(g*2,H)],fill=(40,70,50));dd.line([(0,g*2),(W,g*2)],fill=(40,70,50));dd.text((g*2+2,2),str(g),fill=(200,200,120));dd.text((2,g*2+2),str(g),fill=(200,200,120))
dd.line(dense,fill=(180,209,151),width=5)
for i,p in enumerate(pts):dd.ellipse([p[0]-4,p[1]-4,p[0]+4,p[1]+4],fill=(255,120,80))
im.resize((600,1020)).save('/private/tmp/claude-501/-Users-yasseenkilani--openjarvis-src/d3d3467e-24a1-41e4-bbed-9fd8b3e548c0/scratchpad/flow.png')
if len(sys.argv)>1:
    d=json.load(open('plan.base.json'))
    sm=dense[::3]+[dense[-1]]
    s=f"M{sm[0][0]:.0f} {sm[0][1]:.0f}"
    for k in range(len(sm)-1):
        p0=sm[max(0,k-1)];p1=sm[k];p2=sm[k+1];p3=sm[min(len(sm)-1,k+2)]
        s+=f" C{p1[0]+(p2[0]-p0[0])/6:.0f} {p1[1]+(p2[1]-p0[1])/6:.0f} {p2[0]-(p3[0]-p1[0])/6:.0f} {p2[1]-(p3[1]-p1[1])/6:.0f} {p2[0]:.0f} {p2[1]:.0f}"
    d['route']=s;json.dump(d,open('plan.json','w'));print('written')
