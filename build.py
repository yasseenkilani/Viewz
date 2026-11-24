import json,re,glob,os
p=json.load(open('plan.json'))
FAC=[(82,412),(150,404),(290,390),(432,372),(520,364),(576,358),(722,347),(868,338),(945,334)]
MAIN=FAC+[(975,1298),(836,1310),(836,1440),(685,1452),(548,1470),(380,1478),(378,1250),(98,1250)]
FLOOR="M"+" L".join(f"{x} {y}" for x,y in MAIN)+" Z"
BAL="M65 88 L950 40 L948 334 L868 338 L722 347 L576 358 L520 364 L432 372 L290 390 L150 404 L95 392 L75 250 Z"
LABELS=[(500,215,'Balcony'),(830,520,'Living'),(790,1140,'Kitchen'),(200,1000,'Bedroom')]
def plan(cls,mini=False):
    labels="".join(f'<text class="rl" x="{x}" y="{y}" text-anchor="middle">{t}</text>' for x,y,t in LABELS)
    pins="".join(f'<g class="pin"><circle cx="{x}" cy="{y}" r="22"/><text x="{x}" y="{y+6}" text-anchor="middle">{n}</text></g>' for x,y,n in p['pins'])
    cam='' if mini else '<g class="cam"><path class="cone" d="M0 0 L-70 -150 Q0 -190 70 -150 Z"/><circle r="15"/></g>'
    role='aria-hidden="true"' if mini else 'role="img" aria-label="Floor plan with the camera route drawn through the home"'
    return f'''<svg class="plan {cls}" viewBox="40 30 980 1510" {role}>
<g class="depth"><path d="{p['walls']}" transform="translate(10 14)"/><path d="{p['walls']}" transform="translate(20 28)"/></g>
<path class="bal" d="{BAL}"/><path class="floor" d="{FLOOR}"/>
<path class="walls" d="{p['walls']}" fill-rule="evenodd"/>
<path class="glass" d="{p['fac']}"/>{labels}
<g class="pins">{pins}</g>
<path class="route-base" d="{p['route']}" pathLength="1"/>
<path class="route" d="{p['route']}" pathLength="1"/>{cam}
</svg>'''
LOGO=open('logo.svg').read()
PAGES=[('index','Home'),('how-it-works','How it works'),('why-viewz','Why Viewz'),('who-its-for','Who it\'s for'),('get-started','Request a quote')]
NAV=[('index.html#screening','Screening room'),('index.html#process','Behind the film'),('how-it-works.html','How it works'),('index.html#questions','FAQs')]
SHELL='''<!doctype html>
<html lang="en" data-type="service">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>@@TITLE@@</title>
<meta name="description" content="@@DESC@@">
<meta name="page-type" content="service"><meta name="site-kind" content="other">
<meta property="og:title" content="@@TITLE@@"><meta property="og:description" content="@@DESC@@"><meta property="og:type" content="website"><meta property="og:image" content="img/living.jpg">
<meta name="theme-color" content="#0E1E14">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="studio.css">
</head>
<body class="@@BODY@@">
<a class="skip" href="#main">Skip to content</a>
<header class="nav@@NAVDARK@@" id="nav">
  <a class="brand" href="index.html" aria-label="Viewz home"><img class="lg lg-l" src="img/logo-light.png" alt="Viewz"><img class="lg lg-d" src="img/logo-dark.png" alt=""></a>
  <nav aria-label="Main">@@LINKS@@</nav>
  <div class="nav-r"><a class="btn btn-sm" href="get-started.html">Request a quote</a><button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu"><i></i><i></i></button></div>
  <div class="menu" id="menu" hidden><nav aria-label="Menu">@@MLINKS@@</nav></div>
</header>
<main id="main">
@@BODY_HTML@@
</main>
<footer class="foot">
  <div class="wrap foot-grid">
    <div><a class="brand light" href="index.html"><img class="lg lg-d" src="img/logo-dark.png" alt="Viewz"></a><p>AI walkthrough videos for Dubai property. Videos are AI-generated and labelled as such.</p></div>
    <nav aria-label="Footer">@@FLINKS@@</nav>
    <p class="small"><a href="privacy.html">Privacy</a> · <a data-wa data-wa-text="Hi Viewz, " href="#">WhatsApp</a> · viewz.me · © 2026 Viewz</p>
  </div>
</footer>
<script src="main.js"></script>
<script src="studio.js"></script>
</body></html>'''
for f in glob.glob('pages/*.html'):
    name=os.path.basename(f)[:-5]; src=open(f).read()
    title=re.search(r'<!--TITLE:(.*?)-->',src).group(1); desc=re.search(r'<!--DESC:(.*?)-->',src).group(1)
    dark='<!--DARKNAV-->' in src
    noidx='<!--NOINDEX-->' in src
    body=re.sub(r'<!--(TITLE|DESC|NOINDEX):?.*?-->\n?','',src).replace('<!--DARKNAV-->\n','')
    body=body.replace('{{PLAN_HERO}}',plan('plan-hero')).replace('{{PLAN_STAGE}}',plan('plan-stage')).replace('{{PLAN_MINI}}',plan('plan-mini',True))
    cur=' aria-current="page"'
    links="".join('<a href="%s"%s>%s</a>'%(h,cur if h==name+'.html' else '',l) for h,l in NAV)
    mlinks=links+'<a href="get-started.html">Request a quote</a>'
    flinks="".join(f'<a href="{n}.html">{l}</a>' for n,l in PAGES)
    h=SHELL.replace('@@TITLE@@',title).replace('@@DESC@@',desc).replace('@@BODY@@','page-'+name).replace('@@NAVDARK@@',' on-dark' if dark else '').replace('@@LINKS@@',links).replace('@@FLINKS@@',flinks).replace('@@MLINKS@@',mlinks).replace('@@LOGO@@',LOGO).replace('@@BODY_HTML@@',body)
    if noidx: h=h.replace('<meta name="theme-color"','<meta name="robots" content="noindex,nofollow"><meta name="theme-color"',1)
    open(name+'.html','w').write(h)
    print('built',name)
