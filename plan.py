import json
t=json.load(open('/Users/yasseenkilani/unit3d/build/trace.json'))
def P(p): return (p[0]*119+105, p[1]*119+412)
def path(pts): return "M"+" L".join(f"{x:.0f} {y:.0f}" for x,y in map(P,pts))+" Z"
walls=" ".join(path(w['outer'])+"".join(" "+path(h) for h in w.get('holes',[])) for w in t['walls'])
fac="M"+" L".join(f"{x:.0f} {y:.0f}" for x,y in map(P,t['facade']))
# route in plan px
route=[(600,1440),(600,1180),(592,980),(700,820),(800,640),(700,520),(640,330),(540,360),(540,640),(560,900),(500,1060),(400,1040),(300,880),(220,700),(290,420)]
def smooth(pts):
    d=f"M{pts[0][0]} {pts[0][1]}"
    for i in range(1,len(pts)-1):
        mx=(pts[i][0]+pts[i+1][0])/2; my=(pts[i][1]+pts[i+1][1])/2
        d+=f" Q{pts[i][0]} {pts[i][1]} {mx:.0f} {my:.0f}"
    d+=f" L{pts[-1][0]} {pts[-1][1]}"; return d
pins=[(640,500,'1'),(760,800,'2'),(700,1170,'3'),(380,1000,'4'),(250,700,'5'),(350,1360,'6')]
json.dump(dict(walls=walls,fac=fac,route=smooth(route),pins=pins),open('plan.json','w'))
print(len(walls),smooth(route)[:80])
