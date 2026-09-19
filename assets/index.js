(()=>{
class PageLogic {constructor(props){this.props=props;this.state={};}setState(next){Object.assign(this.state,typeof next==='function'?next(this.state):next);this.update?.();}}

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.rootRef = ({current:null});
    this.headerRef = ({current:null});
    this.counterRef = ({current:null});
    this._i = 0;
  }

  componentDidMount() {
    const root = this.rootRef.current;
    this._initMenu(root);
    this._initHeader();
    this._initCarousel(root);
    this._initReveal(root);
    this._initCardZoom(root);
  }

  _initHeader() {
    const header = this.headerRef.current;
    if (!header) return;
    this._onScroll = () => {
      header.style.boxShadow = window.scrollY > 40 ? '0 10px 30px rgba(27,27,30,0.08)' : 'none';
    };
    window.addEventListener('scroll', this._onScroll, { passive: true });
    this._onScroll();
  }

  _initCarousel(root) {
    if (!root) return;
    const slides = Array.from(root.querySelectorAll('[data-slide]'));
    const copies = Array.from(root.querySelectorAll('[data-copy]'));
    const dots = Array.from(root.querySelectorAll('[data-dot]'));
    if (!slides.length) return;
    const paint = () => {
      slides.forEach((s, k) => { s.style.opacity = k === this._i ? '1' : '0'; });
      copies.forEach((c, k) => {
        const on = k === this._i;
        // outgoing copy clears before the incoming arrives, so two headlines never read at once
        c.style.transition = 'opacity .32s ease, transform .32s ease';
        c.style.transitionDelay = on ? '.3s' : '0s';
        c.style.opacity = on ? '1' : '0';
        c.style.transform = on ? 'none' : 'translateY(14px)';
        c.style.pointerEvents = on ? 'auto' : 'none'; c.inert = !on; c.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach((d, k) => {
        d.style.width = k === this._i ? '46px' : '22px';
        d.style.background = k === this._i ? '#CF0000' : '#C9C8C2';
      });
      if (this.counterRef.current) this.counterRef.current.textContent = '0' + (this._i + 1) + ' / 0' + slides.length;
    };
    const go = (n) => { this._i = (n + slides.length) % slides.length; paint(); };
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); this._restart(go); }));
    Array.from(root.querySelectorAll('[data-nav]')).forEach((b) => {
      b.addEventListener('click', () => {
        go(this._i + (b.getAttribute('data-nav') === 'next' ? 1 : -1));
        this._restart(go);
      });
    });
    this._go = go;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this._timer = setInterval(() => go(this._i + 1), 7000);
    paint();
  }

  _restart(go) {
    if (this._timer) clearInterval(this._timer);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this._timer = setInterval(() => go(this._i + 1), 7000);
  }

  _initReveal(root) {
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const nodes = Array.from(root.querySelectorAll('[data-reveal]'));
    nodes.forEach((n) => {
      n.style.opacity = '0';
      n.style.transform = 'translateY(18px)';
      n.style.transition = 'opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)';
    });
    this._io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.style.opacity = '1';
        e.target.style.transform = 'none';
        this._io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    nodes.forEach((n) => this._io.observe(n));
    this._revealFallback = setTimeout(() => nodes.forEach((n) => { n.style.opacity = '1'; n.style.transform = 'none'; }), 1600);
  }

  _initCardZoom(root) {
    if (!root) return;
    Array.from(root.querySelectorAll('a[data-card] img')).forEach((img) => {
      const card = img.closest('a[data-card]');
      if (!card) return;
      card.addEventListener('mouseenter', () => { img.style.transform = 'scale(1.05)'; });
      card.addEventListener('mouseleave', () => { img.style.transform = 'none'; });
    });
  }

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
        nav.style.boxShadow = '0 18px 40px rgba(27,27,30,0.1)';
        links.forEach((a, i) => {
          a.style.cssText = linkCss[i];
          const isCta = i === links.length - 1;
          a.style.borderLeft = '0';
          a.style.display = 'block';
          a.style.textAlign = isCta ? 'center' : 'left';
          a.style.padding = isCta ? '16px 22px' : '15px 0';
          a.style.fontSize = '14px';
          if (!isCta) a.style.borderBottom = '1px solid #EDECE7';
          if (isCta) a.style.marginTop = '14px';
        });
      } else {
        open = false;
        nav.style.cssText = navCss;
        links.forEach((a, i) => { a.style.cssText = linkCss[i]; });
      }
    };
    btn.addEventListener('click', () => { open = !open; apply(); });
    links.forEach((a) => a.addEventListener('click', () => { if (open) { open = false; apply(); } }));
    this._menuMQ = mq;
    this._menuApply = apply;
    if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply);
    apply();
  }

  componentWillUnmount() {
    if (this._onScroll) window.removeEventListener('scroll', this._onScroll);
    if (this._io) this._io.disconnect();
    if (this._revealFallback) clearTimeout(this._revealFallback);
    if (this._timer) clearInterval(this._timer);
    if (this._menuMQ && this._menuApply) {
      if (this._menuMQ.removeEventListener) this._menuMQ.removeEventListener('change', this._menuApply); else this._menuMQ.removeListener(this._menuApply);
    }
  }

  renderVals() {
    return {
      rootRef: this.rootRef,
      headerRef: this.headerRef,
      counterRef: this.counterRef,
      year: new Date().getFullYear(),
      phone: this.props.phone ?? '(281) 240-1222',
      showTestRange: this.props.showTestRange ?? true,
      showTrustedRail: this.props.showTrustedRail ?? true,
      stats: [
        { value: '2005', label: 'Building live-fire since' },
        { value: '70+', label: 'Combined years of experience' },
        { value: '100', label: 'Acre live-fire test complex' },
        { value: '20,000', label: 'Ft² fabrication facility' }
      ],
      clients: ['U.S. Military — All Branches', 'SOCOM', 'Canadian Special Forces', 'DHS / ICE / Border Patrol', 'Federal Reserve', 'Sturm, Ruger & Co.', 'Law Enforcement'],
      disciplines: [
        { title: 'Design', body: 'Range layout, ballistic engineering and SDZ analysis for the site you actually have.' },
        { title: 'Fabricate', body: 'Built and proofed in our own 20,000 ft² Texas facility — not outsourced.' },
        { title: 'Equip', body: 'Targetry, traps, ventilation and control systems, integrated and commissioned.' },
        { title: 'Support', body: 'Installation, training and lifecycle service for the life of the facility.' }
      ],
      specs: [
        { tag: 'Containment', title: '360° positive ballistic containment', body: 'AR500 armor plate steel construction with a zero surface-danger-zone footprint.' },
        { tag: 'Air quality', title: '99.97% HEPA filtration', body: 'Ventilation designed and balanced to OSHA, NIOSH, EPA, NAVFAC and NEHC criteria.' },
        { tag: 'Distance', title: 'Up to 100 meters, containerized', body: 'Modified 40-ft containers connect end-to-end to reach full qualification distance.' },
        { tag: 'Mobility', title: '53′ DOT-approved semi-trailer', body: 'Self-contained 10 m range that moves over the road without special permitting.' },
        { tag: 'Proving ground', title: '100-acre live-fire complex', body: 'Systems are tested under live fire before they are ever handed over.' },
        { tag: 'Partners', title: 'Integrated with the industry', body: 'Meggitt, Savage Range Systems, Paragon Tactical, Range Systems, Crestron and Mancom.' }
      ]
    };
  }
}


const app=new Component({});const bindings=[{"id":"1","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"2","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":0}]},{"id":"3","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":0}]},{"id":"4","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":1}]},{"id":"5","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":1}]},{"id":"6","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":2}]},{"id":"7","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":2}]},{"id":"8","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":3}]},{"id":"9","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"stats","index":3}]},{"id":"10","kind":"condition","expr":"showTrustedRail","scopes":[]},{"id":"11","kind":"text","expr":"\"{{ client }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"client","expr":"clients","index":0}]},{"id":"12","kind":"text","expr":"\"{{ client }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"client","expr":"clients","index":1}]},{"id":"13","kind":"text","expr":"\"{{ client }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"client","expr":"clients","index":2}]},{"id":"14","kind":"text","expr":"\"{{ client }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"client","expr":"clients","index":3}]},{"id":"15","kind":"text","expr":"\"{{ client }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"client","expr":"clients","index":4}]},{"id":"16","kind":"text","expr":"\"{{ client }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"client","expr":"clients","index":5}]},{"id":"17","kind":"text","expr":"\"{{ client }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"client","expr":"clients","index":6}]},{"id":"18","kind":"text","expr":"\"{{ d.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":0}]},{"id":"19","kind":"text","expr":"\"{{ d.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":0}]},{"id":"20","kind":"text","expr":"\"{{ d.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":1}]},{"id":"21","kind":"text","expr":"\"{{ d.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":1}]},{"id":"22","kind":"text","expr":"\"{{ d.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":2}]},{"id":"23","kind":"text","expr":"\"{{ d.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":2}]},{"id":"24","kind":"text","expr":"\"{{ d.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":3}]},{"id":"25","kind":"text","expr":"\"{{ d.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"d","expr":"disciplines","index":3}]},{"id":"26","kind":"condition","expr":"showTestRange","scopes":[]},{"id":"27","kind":"text","expr":"\"{{ spec.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":0}]},{"id":"28","kind":"text","expr":"\"{{ spec.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":0}]},{"id":"29","kind":"text","expr":"\"{{ spec.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":0}]},{"id":"30","kind":"text","expr":"\"{{ spec.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":1}]},{"id":"31","kind":"text","expr":"\"{{ spec.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":1}]},{"id":"32","kind":"text","expr":"\"{{ spec.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":1}]},{"id":"33","kind":"text","expr":"\"{{ spec.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":2}]},{"id":"34","kind":"text","expr":"\"{{ spec.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":2}]},{"id":"35","kind":"text","expr":"\"{{ spec.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":2}]},{"id":"36","kind":"text","expr":"\"{{ spec.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":3}]},{"id":"37","kind":"text","expr":"\"{{ spec.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":3}]},{"id":"38","kind":"text","expr":"\"{{ spec.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":3}]},{"id":"39","kind":"text","expr":"\"{{ spec.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":4}]},{"id":"40","kind":"text","expr":"\"{{ spec.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":4}]},{"id":"41","kind":"text","expr":"\"{{ spec.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":4}]},{"id":"42","kind":"text","expr":"\"{{ spec.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":5}]},{"id":"43","kind":"text","expr":"\"{{ spec.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":5}]},{"id":"44","kind":"text","expr":"\"{{ spec.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"spec","expr":"specs","index":5}]},{"id":"45","kind":"text","expr":"\"Call {{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"46","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"47","kind":"text","expr":"\"© {{ year }} Shooting Range Technologies™, a division of Laser Shot, Inc. All rights reserved.\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]}];
const evaluate=(expr,scope)=>new Function(...Object.keys(scope),'evaluate','scope','return ('+expr+')')(...Object.values(scope),evaluate,scope);
function getScope(binding){let scope=app.renderVals();for(const s of binding.scopes) scope={...scope,[s.as]:evaluate(s.expr,scope)[s.index]};return scope;}
for(const el of document.querySelectorAll('[data-ref]')) app[el.dataset.ref].current=el;
function update(){for(const b of bindings){if(b.kind==='event')continue;const el=document.querySelector('[data-bind="'+b.id+'"]');const val=evaluate(b.expr,getScope(b));if(b.kind==='text')el.textContent=val;else if(b.kind==='condition'){el.style.display=val?'contents':'none';el.querySelectorAll('input,select,textarea').forEach(f=>f.disabled=!val);}else el.setAttribute(b.attr,val);}}
app.update=update;for(const b of bindings)if(b.kind==='event'){document.querySelector('[data-bind="'+b.id+'"]').addEventListener(b.attr,e=>evaluate(b.expr,getScope(b))(e));}
update();app.componentDidMount();

})();