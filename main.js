(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
/* which films exist: media/films.json lists them, e.g. ["media/pilot-1.mp4"] */
let filmsP=null; const hasFilm=src=>(filmsP||(filmsP=fetch('media/films.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]))).then(l=>Array.isArray(l)&&l.includes(src));

/* nav, scroll progress line */
const nav=$('#nav'); const prog=document.createElement('i'); prog.className='prog'; nav.append(prog);
const flight=$('#flight');
function onScroll(){
  nav.classList.toggle('solid',scrollY>40);
  const max=document.documentElement.scrollHeight-innerHeight;
  prog.style.transform='scaleX('+(max>0?scrollY/max:0)+')';
}

/* put the camera on a route */
function place(svg,p){
  const route=$('.route',svg), cam=$('.cam',svg); if(!cam) return;
  const len=route.getTotalLength(), l=len*clamp(p);
  const a=route.getPointAtLength(l), b=route.getPointAtLength(Math.min(len,l+4)), c=route.getPointAtLength(Math.max(0,l-4));
  cam.setAttribute('transform',`translate(${a.x} ${a.y}) rotate(${Math.atan2(b.y-c.y,b.x-c.x)*180/Math.PI+90})`);
}

/* hero route loop (home) */
const heroSvg=$('.plan-hero');
if(heroSvg){
  const tc=$('#heroTc'), room=$('#heroRoom'), route=$('.route',heroSvg);
  const rooms=[[0,'Front door'],[.07,'Hallway'],[.13,'Kitchen'],[.22,'Living room'],[.44,'Balcony'],[.62,'Bedroom'],[.92,'Finishing shot']];
  const t0=performance.now();
  const tick=now=>{
    const DUR=24000,HOLD=2500,t=(now-t0)%(DUR+HOLD),p=clamp(t/DUR);
    route.style.strokeDashoffset=1-p; place(heroSvg,p);
    tc.textContent='00:'+String(Math.round(p*58)).padStart(2,'0');
    let r=rooms[0][1]; for(const [at,n] of rooms) if(p>=at) r=n; room.textContent=r;
    requestAnimationFrame(tick);
  };
  if(reduce){route.style.strokeDashoffset=0;place(heroSvg,.55);tc.textContent='00:58';room.textContent='Whole home'}
  else requestAnimationFrame(tick);
}

/* sample slots become players when the video file exists */
$$('.sample[data-video]').forEach(async el=>{
  const src=el.dataset.video, poster=el.dataset.poster;
  if(!await hasFilm(src)) return;
  const frame=$('.frame',el), v=document.createElement('video');
  v.src=src; v.poster=poster; v.playsInline=true; v.muted=true; v.loop=true; v.preload='metadata';
  frame.prepend(v); el.classList.add('live');
  const pm=$('.plan-mini',frame); if(pm) pm.style.display='none';
  const b=document.createElement('button'); b.className='play'; b.setAttribute('aria-label','Play '+$('h3',el).textContent); frame.append(b);
  b.addEventListener('click',()=>{v.play();b.style.display='none';v.controls=true});
});

/* mobile menu */
{const b=$('.menu-btn'),mn=$('#menu');
 if(b&&mn){const set=o=>{b.setAttribute('aria-expanded',o);mn.hidden=!o;nav.classList.toggle('menu-open',o)};
  b.addEventListener('click',()=>set(b.getAttribute('aria-expanded')!=='true'));
  $$('a',mn).forEach(a=>a.addEventListener('click',()=>set(false)));
  addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
  matchMedia('(min-width:1001px)').addEventListener('change',e=>{if(e.matches)set(false)})}}

/* "Watch a walkthrough": plays the sample in a window when the film exists, otherwise opens the samples page */
$$('[data-play]').forEach(a=>a.addEventListener('click',async e=>{
  e.preventDefault();
  const src='media/pilot-1.mp4';
  if(!await hasFilm(src)){location.href=a.href;return}
  const m=document.createElement('div'); m.className='modal'; m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('aria-label','Sample walkthrough');
  m.innerHTML='<button class="x" aria-label="Close">\u00d7</button><video controls autoplay playsinline></video>';
  const v=$('video',m); v.src=src; v.poster='media/pilot-1.jpg';
  const close=()=>{v.pause();removeEventListener('keydown',k);m.remove()};
  const k=ev=>{if(ev.key==='Escape')close();else if(ev.key==='Tab'){const f=$$('button,video',m),i=f.indexOf(document.activeElement);ev.preventDefault();f[(i+(ev.shiftKey?-1:1)+f.length)%f.length].focus()}}; $('.x',m).onclick=close; m.addEventListener('click',ev=>{if(ev.target===m)close()});
  addEventListener('keydown',k);
  const prev=document.activeElement; document.body.append(m); $('.x',m).focus();
  new MutationObserver(()=>{if(!document.body.contains(m)&&prev&&prev.focus)prev.focus()}).observe(document.body,{childList:true});
}));

/* settings: fill these in when the back-end and WhatsApp number exist */
const CONFIG={
  API:'',        // back-end base URL, e.g. https://api.viewz.me  (empty = front end only)
  WHATSAPP:''    // business number, digits only with country code, e.g. 9715XXXXXXXX
};

/* WhatsApp buttons */
$$('[data-wa]').forEach(a=>{
  const note=a.parentElement&&a.parentElement.querySelector('.wa-off');
  if(CONFIG.WHATSAPP){
    a.href='https://wa.me/'+CONFIG.WHATSAPP+'?text='+encodeURIComponent(a.dataset.waText||'Hi Viewz, ');
    a.target='_blank'; a.rel='noopener noreferrer';
  }else{
    a.classList.add('is-off'); a.setAttribute('aria-disabled','true'); if(note) note.hidden=false;
    a.addEventListener('click',e=>e.preventDefault());
  }
});

const api=(path,opt)=>fetch(CONFIG.API+path,Object.assign({headers:{'Content-Type':'application/json'},credentials:'omit'},opt));
const normPhone=v=>{let s=(v||'').replace(/[\s\-().]/g,'');
  s=s.replace(/^(\+?971)\(0\)/,'$1').replace(/^(\+?971)0(?=\d{9}$)/,'$1');
  if(s.startsWith('00'))s='+'+s.slice(2);
  else if(/^05\d{8}$/.test(s))s='+971'+s.slice(1);
  else if(/^971\d{9}$/.test(s))s='+'+s;
  return s};
const okPhone=s=>/^\+[1-9]\d{7,14}$/.test(s)&&(!s.startsWith('+971')||/^\+971[2-9]\d{8}$/.test(s));

/* order form */
const form=$('#orderForm'), msg=$('#formMsg');
if(form){
  const T0=Date.now(), verify=$('#verify'); let quoteId=null, busy=false;
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(form)), errs={};
    d.phone=normPhone(d.wa);
    if(!/^https?:\/\/\S+\.\S+$/.test((d.link||'').trim())) errs.link='Paste the full listing link, starting with https://';
    if(!(d.name||'').trim()) errs.name='Tell us who to reply to.';
    if((d.email||'').trim()&&!/^\S+@\S+\.\S+$/.test(d.email.trim())) errs.email='That email does not look right.';
    if(!okPhone(d.phone)) errs.wa='Enter your WhatsApp number with country code, like +971 50 123 4567.';
    if(d.consent!=='yes') errs.consent='Tick this so we can message you.';
    $$('.err',form).forEach(x=>{const k=x.dataset.for,inp=form.querySelector('[name="'+k+'"]');
      x.id='err-'+k; x.textContent=errs[k]||''; if(inp){inp.setAttribute('aria-describedby',x.id); inp.setAttribute('aria-invalid',errs[k]?'true':'false')}});
    const keys=Object.keys(errs);
    if(keys.length){msg.textContent='';const f=form.querySelector('[name="'+keys[0]+'"]');if(f)f.focus();return}
    if(d.hp_x7){msg.textContent='Got it.';return}          // honeypot: bots fill this, people never see it
    if(CONFIG.API){
      if(busy) return; busy=true; const sb=form.querySelector('[type=submit]'); sb.disabled=true;
      msg.textContent='Sending…';
      try{
        const r=await api('/quote',{method:'POST',body:JSON.stringify({link:d.link.trim(),name:d.name.trim(),email:(d.email||'').trim(),phone:d.phone,consent:true,elapsed:Date.now()-T0})});
        if(!r.ok)throw 0; const j=await r.json();
        if(j.needsCode&&verify){quoteId=j.id;$('#vNum').textContent=d.phone;verify.hidden=false;msg.textContent='';$('#vCode').focus()}
        else{msg.textContent='Got it. We will message you on WhatsApp with a price, delivery date and route.';form.reset()}
      }catch(_){msg.textContent='That did not send. Please try again in a moment.'}
      finally{busy=false; sb.disabled=false}
    }else{
      const body=`Listing: ${d.link}\nName: ${d.name}\nEmail: ${d.email}\nWhatsApp: ${d.phone}`;
      location.href='mailto:dev@viewz.me?subject='+encodeURIComponent('Viewz quote request')+'&body='+encodeURIComponent(body);
      msg.textContent='Your email app should open with the details. If it does not, email the listing link to dev@viewz.me.';
    }
  });
  const vb=$('#vBtn'); const vc=$('#vCode');
  if(vc) vc.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(vb)vb.click()}});
  if(vb) vb.addEventListener('click',async()=>{
    const code=($('#vCode').value||'').trim();
    if(!/^\d{6}$/.test(code)){msg.textContent='Enter the 6-digit code.';return}
    if(vb.disabled) return; vb.disabled=true;
    msg.textContent='Checking…';
    try{const r=await api('/verify',{method:'POST',body:JSON.stringify({id:quoteId,code})}); if(!r.ok)throw 0;
      verify.hidden=true; form.reset(); msg.textContent='Confirmed. We will message you on WhatsApp with a price, delivery date and route.'}
    catch(_){msg.textContent='That code did not match. Check it and try again.'}
    finally{vb.disabled=false}
  });
}

if($('#payCard')) addEventListener('hashchange',()=>location.reload());
/* payment page: the card is entered on the payment provider's own page, never here */
const payCard=$('#payCard');
if(payCard){
  const show=(id,on)=>{const el=$(id); if(el) el.hidden=!on};
  const fill=q=>{$('#pListing').textContent=q.listing||'-';$('#pDelivery').textContent=q.delivery||'-';$('#pFormats').textContent=q.formats||'-';
    $('#pTotal').textContent=(q.currency||'AED')+' '+q.price; show('#payEmpty',false); show('#payBody',true)};
  const pb=$('#payBtn'), pm=$('#payMsg');
  const id=new URLSearchParams(location.search).get('q')||'';
  if(location.hash==='#preview'){
    show('#payFlag',true);
    fill({listing:'Example listing, Dubai',delivery:'Within 3 working days',formats:'Landscape and vertical',currency:'AED',price:'0,000'});
    pb.disabled=true; pb.textContent='Pay securely (preview)';
  }else if(CONFIG.API&&/^[A-Za-z0-9_-]{8,64}$/.test(id)){
    api('/quote/'+id).then(r=>{if(!r.ok)throw 0;return r.json()}).then(q=>{
      if(q.status==='paid'){show('#payEmpty',false);show('#payBody',true);fill(q);pb.disabled=true;pb.textContent='Paid';pm.textContent='This quote is already paid. Thank you.';return}
      if(q.status!=='open'&&q.status!=='pending'&&q.status!=='unpaid')throw 0;
      if(!(Number(String(q.price).replace(/,/g,''))>0))throw 0;
      fill(q)}).catch(()=>{const e=$('#payEmpty'); if(e){$('h2',e).textContent='This payment link is not valid any more.'; $('p',e).textContent='It may have expired or been replaced. Message us on WhatsApp and we will send you a fresh link.'}});
    pb.addEventListener('click',async()=>{
      pb.disabled=true; pm.textContent='Opening secure payment…';
      try{const r=await api('/checkout',{method:'POST',body:JSON.stringify({id})}); if(!r.ok)throw 0; const j=await r.json();
        const u=new URL(j.url); if(u.protocol!=='https:'||u.hostname!=='checkout.stripe.com')throw 0;   // only ever go to the provider's page
        location.href=u.href}
      catch(_){pb.disabled=false;pm.textContent='We could not open the payment page. Please try again, or message us.'}
    });
  }
}

addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll); onScroll();
})();
