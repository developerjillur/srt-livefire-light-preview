(()=>{
class PageLogic {constructor(props){this.props=props;this.state={};}setState(next){Object.assign(this.state,typeof next==='function'?next(this.state):next);this.update?.();}}

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.rootRef = ({current:null});
    this.headerRef = ({current:null});
    this.state = { source: '', sent: false };
  }

  componentDidMount() {
    const root = this.rootRef.current;
    this._initMenu(root);
    const header = this.headerRef.current;
    if (header) {
      this._onScroll = () => {
        header.style.boxShadow = window.scrollY > 40 ? '0 12px 34px rgba(0,0,0,0.08)' : 'none';
      };
      window.addEventListener('scroll', this._onScroll, { passive: true });
      this._onScroll();
    }
    this._initParallax(root);
  }

  _initParallax(root) {
    if (!root) return;
    const el = root.querySelector('[data-parallax]');
    if (!el) return;
    const sec = el.parentElement;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    const frame = () => {
      ticking = false;
      if (this._heroMobile) return;
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      if (r.bottom < -300 || r.top > vh + 300) return;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
      const vis = 1 - Math.abs(p);
      el.style.transform = 'translate3d(0,' + (-p * 34).toFixed(2) + 'px,0) scale(' + (1.02 + vis * 0.06).toFixed(4) + ')';
      el.style.opacity = '1';
    };
    this._onParallax = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    };
    window.addEventListener('scroll', this._onParallax, { passive: true });
    window.addEventListener('resize', this._onParallax);
    frame();
  }


  // mobile menu: imperative so every page's logic class gets it identically
  _initMenu(root) {
    if (!root) return;
    const btn = root.querySelector('[data-menu-toggle]');
    const nav = root.querySelector('[data-menu-nav]');
    if (!btn || !nav) return;
    const links = Array.from(nav.children);
    const navCss = nav.style.cssText;
    const linkCss = links.map((a) => a.style.cssText);
    const bars = Array.from(btn.children);
    let open = false;
    const mq = window.matchMedia('(max-width: 960px)');
    const apply = () => {
      const mobile = mq.matches;
      btn.style.display = mobile ? 'flex' : 'none';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (bars.length === 3) {
        bars[0].style.transform = open ? 'translateY(7px) rotate(45deg)' : '';
        bars[1].style.opacity = open ? '0' : '';
        bars[2].style.transform = open ? 'translateY(-7px) rotate(-45deg)' : '';
      }
      if (mobile) {
        nav.style.cssText = navCss;
        nav.style.display = open ? 'flex' : 'none';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.flex = 'none';
        nav.style.flexDirection = 'column';
        nav.style.alignItems = 'stretch';
        nav.style.justifyContent = 'flex-start';
        nav.style.gap = '0';
        nav.style.padding = '6px clamp(18px,4vw,64px) 22px';
        nav.style.background = '#FFFFFF';
        nav.style.borderBottom = '1px solid #E2E1DC';
        nav.style.boxShadow = '0 18px 40px rgba(0,0,0,0.08)';
        links.forEach((a, i) => {
          a.style.cssText = linkCss[i];
          const isCta = i === links.length - 1;
          const isActive = linkCss[i].indexOf('border-bottom:2px solid') !== -1;
          a.style.borderLeft = '0';
          a.style.display = 'block';
          a.style.textAlign = isCta ? 'center' : 'left';
          a.style.padding = isCta ? '16px 22px' : '15px 0';
          a.style.fontSize = '14px';
          if (!isActive && !isCta) a.style.borderBottom = '1px solid #EDECE7';
          if (isCta) a.style.marginTop = '14px';
        });
      } else {
        open = false;
        nav.style.cssText = navCss;
        links.forEach((a, i) => { a.style.cssText = linkCss[i]; });
      }
    };
    this._menuToggle = () => { open = !open; apply(); };
    btn.addEventListener('click', this._menuToggle);
    links.forEach((a) => a.addEventListener('click', () => { if (open) { open = false; apply(); } }));
    this._menuMQ = mq;
    this._menuApply = apply;
    if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
    apply();
  }


  // hero: under 1100px stack copy → photo band → stats so text never sits on the photo
  _initHero(root) {
    const sec = root && root.querySelector('#top');
    if (!sec) return;
    const photo = sec.querySelector('[data-hero-photo]');
    const wash = sec.querySelector('[data-hero-wash]');
    const copy = sec.querySelector('[data-hero-copy]');
    if (!photo || !wash || !copy) return;
    const base = { photo: photo.style.cssText, wash: wash.style.cssText };
    const parent = photo.parentNode;
    const marker = document.createComment('hero-photo');
    parent.insertBefore(marker, photo);
    const mq = window.matchMedia('(max-width: 1100px)');
    let stacked = false;
    const apply = () => {
      if (mq.matches) {
        this._heroMobile = true;
        if (!stacked) {
          // photo becomes a real block directly under the copy; controls/stats follow in flow
          parent.insertBefore(photo, copy.nextSibling);
          stacked = true;
        }
        photo.style.cssText = base.photo;
        photo.style.position = 'relative';
        photo.style.inset = 'auto';
        photo.style.top = 'auto';
        photo.style.left = 'auto';
        photo.style.width = '100%';
        photo.style.height = '260px';
        photo.style.transform = 'none';
        photo.style.opacity = '1';
        photo.style.overflow = 'hidden';
        photo.style.zIndex = '0';
        photo.style.marginTop = '40px';
        photo.style.display = 'block';
        photo.style.objectFit = 'cover';
        wash.style.background = 'transparent';
      } else {
        this._heroMobile = false;
        if (stacked) { parent.insertBefore(photo, marker.nextSibling); stacked = false; }
        photo.style.cssText = base.photo;
        wash.style.cssText = base.wash;
      }
    };
    this._heroApply = apply;
    this._heroMQ = mq;
    if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
    window.addEventListener('resize', apply);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
    apply();
  }

  componentWillUnmount() {
    if (this._heroApply) {
      window.removeEventListener('resize', this._heroApply);
      if (this._heroMQ) { if (this._heroMQ.removeEventListener) this._heroMQ.removeEventListener('change', this._heroApply); else this._heroMQ.removeListener(this._heroApply); }
    }
    if (this._menuMQ && this._menuApply) {
      if (this._menuMQ.removeEventListener) this._menuMQ.removeEventListener('change', this._menuApply); else this._menuMQ.removeListener(this._menuApply);
    }
    if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
    if (this._onParallax) {
      window.removeEventListener('scroll', this._onParallax);
      window.removeEventListener('resize', this._onParallax);
    }
  }

  renderVals() {
    return {
      rootRef: this.rootRef,
      headerRef: this.headerRef,
      year: new Date().getFullYear(),
      phone: this.props.phone ?? '(281) 240-1222',
      sources: ['Please select…', 'Referral', 'Search engine', 'Social Media', 'Trade Show', 'Existing customer', 'Other'],
      socials: ['Please select…', 'YouTube', 'Facebook', 'Instagram', 'LinkedIn', 'X / Twitter'],
      tradeShows: ['Please select…', 'SHOT Show', 'AUSA', 'SOFIC', 'IACP', 'Other show'],
      showSocial: this.state.source === 'Social Media',
      showTradeShow: this.state.source === 'Trade Show',
      showOther: this.state.source === 'Other',
      pickSource: (e) => this.setState({ source: e.target.value }),
      submit: (e) => { e.preventDefault(); this.setState({ sent: true }); },
      reset: () => this.setState({ sent: false, source: '' }),
      submitted: this.state.sent,
      notSubmitted: !this.state.sent,
      sites: [
        { tag: 'Head office', city: 'Stafford, TX', body: 'Laser Shot HQ and SRT home base — 4214 Bluebonnet Dr., Stafford, TX 77477.', img: 'assets/ab-facility.jpg', alt: 'Interior of the SRT head office facility' },
        { tag: 'Fabrication', city: 'Sugar Land, TX', body: 'A 20,000-square-foot fabrication facility where every module is welded and proofed.', img: 'assets/mr-fabrication.jpg', alt: 'Range module under fabrication in Sugar Land' },
        { tag: 'Proving ground', city: 'Richmond, TX', body: 'Our own private 100-acre live-fire range testing complex and shoot house.', img: 'assets/ab-shophouse.jpg', alt: 'Shoot house at the SRT live-fire testing complex' }
      ]
    };
  }
}


const app=new Component({});const bindings=[{"id":"1","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"2","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"3","kind":"condition","expr":"notSubmitted","scopes":[]},{"id":"4","kind":"event","expr":"submit","scopes":[],"attr":"submit"},{"id":"5","kind":"event","expr":"pickSource","scopes":[],"attr":"change"},{"id":"6","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"sources","index":0}],"attr":"value"},{"id":"7","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sources","index":0}]},{"id":"8","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"sources","index":1}],"attr":"value"},{"id":"9","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sources","index":1}]},{"id":"10","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"sources","index":2}],"attr":"value"},{"id":"11","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sources","index":2}]},{"id":"12","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"sources","index":3}],"attr":"value"},{"id":"13","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sources","index":3}]},{"id":"14","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"sources","index":4}],"attr":"value"},{"id":"15","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sources","index":4}]},{"id":"16","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"sources","index":5}],"attr":"value"},{"id":"17","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sources","index":5}]},{"id":"18","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"sources","index":6}],"attr":"value"},{"id":"19","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sources","index":6}]},{"id":"20","kind":"condition","expr":"showSocial","scopes":[]},{"id":"21","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"socials","index":0}],"attr":"value"},{"id":"22","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"socials","index":0}]},{"id":"23","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"socials","index":1}],"attr":"value"},{"id":"24","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"socials","index":1}]},{"id":"25","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"socials","index":2}],"attr":"value"},{"id":"26","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"socials","index":2}]},{"id":"27","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"socials","index":3}],"attr":"value"},{"id":"28","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"socials","index":3}]},{"id":"29","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"socials","index":4}],"attr":"value"},{"id":"30","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"socials","index":4}]},{"id":"31","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"socials","index":5}],"attr":"value"},{"id":"32","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"socials","index":5}]},{"id":"33","kind":"condition","expr":"showTradeShow","scopes":[]},{"id":"34","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"tradeShows","index":0}],"attr":"value"},{"id":"35","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"tradeShows","index":0}]},{"id":"36","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"tradeShows","index":1}],"attr":"value"},{"id":"37","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"tradeShows","index":1}]},{"id":"38","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"tradeShows","index":2}],"attr":"value"},{"id":"39","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"tradeShows","index":2}]},{"id":"40","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"tradeShows","index":3}],"attr":"value"},{"id":"41","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"tradeShows","index":3}]},{"id":"42","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"tradeShows","index":4}],"attr":"value"},{"id":"43","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"tradeShows","index":4}]},{"id":"44","kind":"attribute","expr":"s","scopes":[{"as":"s","expr":"tradeShows","index":5}],"attr":"value"},{"id":"45","kind":"text","expr":"\"{{ s }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"tradeShows","index":5}]},{"id":"46","kind":"condition","expr":"showOther","scopes":[]},{"id":"47","kind":"condition","expr":"submitted","scopes":[]},{"id":"48","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"49","kind":"event","expr":"reset","scopes":[],"attr":"click"},{"id":"50","kind":"attribute","expr":"s.alt","scopes":[{"as":"s","expr":"sites","index":0}],"attr":"aria-label"},{"id":"50","kind":"attribute","expr":"\"position:relative;aspect-ratio:16/10;overflow:hidden;background-color:#FFFFFF;background-image:url({{ s.img }});background-size:cover;background-position:center;background-repeat:no-repeat\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":0}],"attr":"style"},{"id":"51","kind":"text","expr":"\"{{ s.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":0}]},{"id":"52","kind":"text","expr":"\"{{ s.city }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":0}]},{"id":"53","kind":"text","expr":"\"{{ s.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":0}]},{"id":"54","kind":"attribute","expr":"s.alt","scopes":[{"as":"s","expr":"sites","index":1}],"attr":"aria-label"},{"id":"54","kind":"attribute","expr":"\"position:relative;aspect-ratio:16/10;overflow:hidden;background-color:#FFFFFF;background-image:url({{ s.img }});background-size:cover;background-position:center;background-repeat:no-repeat\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":1}],"attr":"style"},{"id":"55","kind":"text","expr":"\"{{ s.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":1}]},{"id":"56","kind":"text","expr":"\"{{ s.city }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":1}]},{"id":"57","kind":"text","expr":"\"{{ s.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":1}]},{"id":"58","kind":"attribute","expr":"s.alt","scopes":[{"as":"s","expr":"sites","index":2}],"attr":"aria-label"},{"id":"58","kind":"attribute","expr":"\"position:relative;aspect-ratio:16/10;overflow:hidden;background-color:#FFFFFF;background-image:url({{ s.img }});background-size:cover;background-position:center;background-repeat:no-repeat\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":2}],"attr":"style"},{"id":"59","kind":"text","expr":"\"{{ s.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":2}]},{"id":"60","kind":"text","expr":"\"{{ s.city }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":2}]},{"id":"61","kind":"text","expr":"\"{{ s.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":2}]},{"id":"62","kind":"text","expr":"\"Call {{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"63","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"64","kind":"text","expr":"\"© {{ year }} Shooting Range Technologies™, a division of Laser Shot, Inc. All rights reserved.\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]}];
const evaluate=(expr,scope)=>new Function(...Object.keys(scope),'evaluate','scope','return ('+expr+')')(...Object.values(scope),evaluate,scope);
function getScope(binding){let scope=app.renderVals();for(const s of binding.scopes) scope={...scope,[s.as]:evaluate(s.expr,scope)[s.index]};return scope;}
for(const el of document.querySelectorAll('[data-ref]')) app[el.dataset.ref].current=el;
function update(){for(const b of bindings){if(b.kind==='event')continue;const el=document.querySelector('[data-bind="'+b.id+'"]');if(!el)continue;const val=evaluate(b.expr,getScope(b));if(b.kind==='text')el.textContent=val;else if(b.kind==='condition'){el.style.display=val?'contents':'none';el.querySelectorAll('input,select,textarea').forEach(f=>f.disabled=!val);}else el.setAttribute(b.attr,val);}}
app.update=update;for(const b of bindings)if(b.kind==='event'){document.querySelector('[data-bind="'+b.id+'"]')?.addEventListener(b.attr,e=>evaluate(b.expr,getScope(b))(e));}
update();app.componentDidMount();

})();