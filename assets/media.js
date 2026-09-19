(()=>{
class PageLogic {constructor(props){this.props=props;this.state={};}setState(next){Object.assign(this.state,typeof next==='function'?next(this.state):next);this.update?.();}}

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.rootRef = ({current:null});
    this.headerRef = ({current:null});
    this.railRef = ({current:null});
    this.lbRef = ({current:null});
    this.lbImgRef = ({current:null});
    this.lbCapRef = ({current:null});
    this.lbCountRef = ({current:null});
    this._lb = { list: [], index: 0 };
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
      const rail = this.railRef.current;
      if (rail) {
        this._syncRail = () => { rail.style.top = Math.round(header.getBoundingClientRect().height) + 'px'; };
        this._syncRail();
        window.addEventListener('resize', this._syncRail);
        if (typeof ResizeObserver !== 'undefined') {
          this._railRO = new ResizeObserver(this._syncRail);
          this._railRO.observe(header);
        }
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(this._syncRail);
      }
    }
    this._initParallax(root);
    this._initGallery(root);
    this._initLightbox(root);
  }

  // ---- gallery filter (DOM-driven so image srcs stay literal) ----
  _initGallery(root) {
    if (!root) return;
    this._tiles = Array.from(root.querySelectorAll('[data-cat]'));
    this._filterBtns = Array.from(root.querySelectorAll('[data-filter]'));
    this._countEl = root.querySelector('[data-gallery-count]');
    this._filterBtns.forEach((b) => {
      b.addEventListener('click', () => this._applyFilter(b.getAttribute('data-filter')));
    });
    this._tiles.forEach((t) => {
      t.addEventListener('click', () => {
        const vis = this._visibleTiles();
        this._open(vis, vis.indexOf(t));
      });
    });
    this._applyFilter('All');
  }

  _applyFilter(cat) {
    if (!this._tiles) return;
    this._tiles.forEach((t) => {
      const show = cat === 'All' || t.getAttribute('data-cat') === cat;
      t.style.display = show ? 'block' : 'none';
    });
    this._filterBtns.forEach((b) => {
      const on = b.getAttribute('data-filter') === cat;
      b.style.background = on ? '#CF0000' : 'transparent';
      b.style.color = on ? '#FFFFFF' : '#4A4A4F';
      b.style.borderColor = on ? '#CF0000' : '#C9C8C2';
    });
    if (this._countEl) {
      const n = this._visibleTiles().length;
      this._countEl.textContent = n + (n === 1 ? ' image' : ' images');
    }
  }

  _visibleTiles() {
    return (this._tiles || []).filter((t) => t.style.display !== 'none');
  }

  // ---- lightbox: sources read from the live DOM, never from JS strings,
  // so they survive asset inlining in a standalone bundle ----
  _initLightbox(root) {
    if (!root) return;
    const sheets = Array.from(root.querySelectorAll('[data-sheet]'));
    Array.from(root.querySelectorAll('[data-lb-open]')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = btn.closest('[data-sheet]');
        this._open(sheets, Math.max(0, sheets.indexOf(card)));
      });
    });
    const lb = this.lbRef.current;
    if (lb) {
      Array.from(lb.querySelectorAll('[data-lb]')).forEach((btn) => {
        const act = btn.getAttribute('data-lb');
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (act === 'close') this._close();
          if (act === 'next') this._step(1);
          if (act === 'prev') this._step(-1);
        });
      });
      lb.addEventListener('click', (e) => { if (e.target === lb) this._close(); });
    }
    this._onKey = (e) => {
      const el = this.lbRef.current;
      if (!el || el.style.display === 'none') return;
      if (e.key === 'Escape') this._close();
      if (e.key === 'ArrowRight') this._step(1);
      if (e.key === 'ArrowLeft') this._step(-1);
    };
    window.addEventListener('keydown', this._onKey);
  }

  _open(cards, index) {
    if (!cards || !cards.length) return;
    this._lb.list = cards.map((c) => {
      const img = c.querySelector('img');
      return {
        src: img ? (img.currentSrc || img.src) : '',
        caption: c.getAttribute('data-caption') || (img ? img.alt : '') || ''
      };
    });
    this._lb.index = index < 0 ? 0 : index;
    const lb = this.lbRef.current;
    if (lb) lb.style.display = 'flex';
    this._paint();
  }

  _step(d) {
    const n = this._lb.list.length;
    if (!n) return;
    this._lb.index = (this._lb.index + d + n) % n;
    this._paint();
  }

  _paint() {
    const item = this._lb.list[this._lb.index];
    if (!item) return;
    const img = this.lbImgRef.current;
    if (img) {
      img.src = item.src;
      img.alt = item.caption;
      img.style.display = 'block';
    }
    if (this.lbCapRef.current) this.lbCapRef.current.textContent = item.caption;
    if (this.lbCountRef.current) this.lbCountRef.current.textContent = (this._lb.index + 1) + ' / ' + this._lb.list.length;
  }

  _close() {
    const lb = this.lbRef.current;
    if (lb) lb.style.display = 'none';
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
    if (this._syncRail) window.removeEventListener('resize', this._syncRail);
    if (this._railRO) this._railRO.disconnect();
    if (this._onKey) window.removeEventListener('keydown', this._onKey);
    if (this._onParallax) {
      window.removeEventListener('scroll', this._onParallax);
      window.removeEventListener('resize', this._onParallax);
    }
  }

  renderVals() {
    return {
      rootRef: this.rootRef,
      headerRef: this.headerRef,
      railRef: this.railRef,
      lbRef: this.lbRef,
      lbImgRef: this.lbImgRef,
      lbCapRef: this.lbCapRef,
      lbCountRef: this.lbCountRef,
      year: new Date().getFullYear(),
      phone: this.props.phone ?? '(281) 240-1222'
    };
  }
}


const app=new Component({});const bindings=[{"id":"1","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"2","kind":"text","expr":"\"Call {{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"3","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"4","kind":"text","expr":"\"© {{ year }} Shooting Range Technologies™, a division of Laser Shot, Inc. All rights reserved.\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]}];
const evaluate=(expr,scope)=>new Function(...Object.keys(scope),'evaluate','scope','return ('+expr+')')(...Object.values(scope),evaluate,scope);
function getScope(binding){let scope=app.renderVals();for(const s of binding.scopes) scope={...scope,[s.as]:evaluate(s.expr,scope)[s.index]};return scope;}
for(const el of document.querySelectorAll('[data-ref]')) app[el.dataset.ref].current=el;
function update(){for(const b of bindings){if(b.kind==='event')continue;const el=document.querySelector('[data-bind="'+b.id+'"]');const val=evaluate(b.expr,getScope(b));if(b.kind==='text')el.textContent=val;else if(b.kind==='condition'){el.style.display=val?'contents':'none';el.querySelectorAll('input,select,textarea').forEach(f=>f.disabled=!val);}else el.setAttribute(b.attr,val);}}
app.update=update;for(const b of bindings)if(b.kind==='event'){document.querySelector('[data-bind="'+b.id+'"]').addEventListener(b.attr,e=>evaluate(b.expr,getScope(b))(e));}
update();app.componentDidMount();

})();