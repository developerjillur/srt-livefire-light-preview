(()=>{
class PageLogic {constructor(props){this.props=props;this.state={};}setState(next){Object.assign(this.state,typeof next==='function'?next(this.state):next);this.update?.();}}

class Component extends PageLogic {
  constructor(props) {
    super(props);
    this.rootRef = ({current:null});
    this.headerRef = ({current:null});
    this.railRef = ({current:null});
    this.state = { open: { 0: true } };
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
    if (this._onParallax) {
      window.removeEventListener('scroll', this._onParallax);
      window.removeEventListener('resize', this._onParallax);
    }
  }

  renderVals() {
    const topics = [
      { title: 'Materials', body: 'All of the materials used in SRT ranges are of the finest quality, from the steel which contains the bullets to the finishes in the control room. As an example, we don\u2019t just take the steel mill at their word on hardness testing of our AR steel. SRT is the only range manufacturer that ensures specified containment level by audit-testing EVERY sheet of AR steel before we accept it. All pieces, which are cut from the audited mother sheets and used for critical containment, receive a permanent, water jet engraving of the mill test certificate number. This number can always be traced back to two independent Brinnell hardness tests \u2014 the mill\u2019s and our audit test.' },
      { title: 'Seams and joint integrity', body: 'Seams are always a potential weak point, but because of the precision of our water jet (about .005” accuracy and .001” repeatability), and the fact that water jet cutting leaves no Heat Affected Zones (HAZ), the seams where modules join each other are near perfect, without any discernible gaps, and the steel is the full AR500 hardness all the way to the cut edge. SRT\u2019s unique joint design further ensures seam integrity by placing structure behind every seam, outside of the ballistic containment envelope.' },
      { title: 'No tripping hazards', body: 'Other manufacturers use the ‘fish scale’ method of overlapping steel plates to save fabrication costs and because their equipment lacks the precision to produce a gapless joint. While not so critical on walls and ceilings, this overlapping creates a potential trip hazard on floor surfaces, creating a dangerous situation for tactical move-and-shoot style training. All of SRT\u2019s Modular Range floors are precision butt-joined just like the walls, so that they are even and flush. The last thing you want to have happen is a trip and fall with a loaded firearm!' },
      { title: 'Bullet traps', body: 'SRT ranges offer three different styles of bullet trap in steel or rubber \u2014 none of which have vertical lane separators and therefore ALL of which allow for safe, close-in target engagement without the ricochet danger inherent to some other manufacturer\u2019s trap offerings. Every trap we offer is rated to 7.62 x 51 ammo and a few can even take .50 BMG. Some traps are available with automated bullet collection and dust collection options as well.' },
      { title: 'Ventilation & filtration', body: 'All SRT ranges employ professionally-designed, time-tested, fully compliant (OSHA/NIOSH/EPA/NEHC/NAVFAC) ventilation systems with HEPA filtration to ensure airborne contaminants are removed from the shooters\u2019 breathing zone and deposited where they can be properly and safely disposed or recycled. The proper airflow for the shooters helps keep the OSHA/NIOSH folks happy, while the HEPA filtration allays any environmental concerns.' },
      { title: 'Design', body: 'SRT\u2019s designs maximize the usable space. In the case of our Modular Range for example, we decided to build modules from the ground up rather than simply modify shipping containers and hang traditional ceiling baffles inside. This fresh approach allowed us to maximize the modules\u2019 overall height based on available transport options and highway height restrictions. Plus our unique ceiling design produces an automatic very low-angle ‘baffled’ effect, while still leaving protected alcoves for lighting, sprinklers, etc., and our clear ceiling height at more than 8\u2032. Others make ranges with much lower ceiling heights due to the physical restrictions of shipping containers and the placement of baffles on the inside.' },
      { title: 'Choice', body: 'When you opt for a SRT Shooting Range Facility, you get choices so that you can customize your range with the equipment that suits your need or helps you meet the requirements of your training need best. SRT has cooperative agreements with all of the leaders in the industry such as Savage Range Systems, Meggitt Training Systems, Mancom, Paragon Tactical and Range Systems. Every SRT Range either includes or offers as an available option, Laser Shot\u2019s Thermal Shot live-fire, virtual (projected, animated video) targetry \u2014 even available as a continuous video wall up to 40\u2032 wide! This is the same state-of-the-art system used by U.S. and foreign Special Forces. If you\u2019d like to mix and match range equipment, no problem; tell us what you like and we\u2019ll make it work \u2014 and we\u2019ll get you the best price.' },
      { title: 'Warranty / service', body: 'All SRT ranges come with the best warranty coverage and available maintenance and service plans in the business. We guarantee the systems for one year; the structure for five years and the exterior for ten years! Extended plans are also available to meet your needs. Best of all, instead of sending you off to one place for one system and somewhere else for another, we service all portions of the warranty in-house. So if you desire a one-stop shop approach to range purchase, warranty, maintenance, and service, we\u2019ve got you covered.' }
    ];

    return {
      rootRef: this.rootRef,
      headerRef: this.headerRef,
      railRef: this.railRef,
      year: new Date().getFullYear(),
      phone: this.props.phone ?? '(281) 240-1222',
      heroStats: [
        { value: '2005', label: 'Building live-fire since' },
        { value: '70+', label: 'Combined years of experience' },
        { value: '100', label: 'Acre live-fire test complex' },
        { value: '20,000', label: 'Ft² fabrication facility' }
      ],
      sectionNav: [
        { href: '#story', label: 'Who we are' },
        { href: '#turnkey', label: 'Turn-key' },
        { href: '#facilities', label: 'Facilities' },
        { href: '#safety', label: 'Safety' },
        { href: '#why', label: 'Why SRT?' },
        { href: '#warranty', label: 'Warranty' }
      ],
      products: [
        { tag: 'MSAR', title: 'Modular Ranges', body: 'Up to ten lanes, open tactical floor plan.', href: 'modular-ranges.html' },
        { tag: '53′ Trailer', title: 'Mobile Ranges', body: 'Self-contained, over-the-road, 10 m.', href: 'mobile-ranges.html' },
        { tag: '40′ Units', title: 'Container Ranges', body: 'Drop-in, end-to-end to 100 m.', href: 'container-ranges.html' },
        { tag: 'Tactical', title: 'Shoot Houses', body: 'Many networked systems, multiple rooms.', href: 'index.html#ranges' }
      ],
      videoWall: [
        { tag: 'Modular Range', value: '40′ wide', body: 'A continuous Thermal Shot™ video wall spanning the full bay.' },
        { tag: 'Mobile & Container', value: '8′ system', body: 'Both platforms accommodate a single 8′ wide system.' },
        { tag: 'Shoot Houses', value: 'Networked', body: 'Designed to accommodate many networked systems in multiple rooms.' }
      ],
      partners: ['Meggitt Training Systems', 'Savage Range Systems', 'Paragon Tactical', 'Range Systems', 'Crestron Automation', 'Mancom', 'Range Ventilation Design, Inc.'],
      sites: [
        { city: 'Stafford, TX', what: 'Laser Shot HQ — SRT home base' },
        { city: 'Sugar Land, TX', what: '20,000 square foot fabrication facility' },
        { city: 'Richmond, TX', what: 'Private 100 acre live-fire testing complex and shoot house' }
      ],
      warranty: [
        { term: '1 year', what: 'Systems', note: 'Every range system, guaranteed and serviced in-house.' },
        { term: '5 years', what: 'Structure', note: 'The steel structure of the range itself.' },
        { term: '10 years', what: 'Exterior', note: 'Weatherproofing facade, roof and finishes.' }
      ],
      whySrt: topics.map((t, i) => ({
        n: '0' + (i + 1),
        title: t.title,
        body: t.body,
        open: !!this.state.open[i],
        mark: this.state.open[i] ? '–' : '+',
        toggle: () => this.setState((s) => ({ open: Object.assign({}, s.open, { [i]: !s.open[i] }) }))
      }))
    };
  }
}


const app=new Component({});const bindings=[{"id":"1","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"2","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":0}]},{"id":"3","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":0}]},{"id":"4","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":1}]},{"id":"5","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":1}]},{"id":"6","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":2}]},{"id":"7","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":2}]},{"id":"8","kind":"text","expr":"\"{{ stat.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":3}]},{"id":"9","kind":"text","expr":"\"{{ stat.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"stat","expr":"heroStats","index":3}]},{"id":"10","kind":"attribute","expr":"item.href","scopes":[{"as":"item","expr":"sectionNav","index":0}],"attr":"href"},{"id":"11","kind":"text","expr":"\"{{ item.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"item","expr":"sectionNav","index":0}]},{"id":"12","kind":"attribute","expr":"item.href","scopes":[{"as":"item","expr":"sectionNav","index":1}],"attr":"href"},{"id":"13","kind":"text","expr":"\"{{ item.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"item","expr":"sectionNav","index":1}]},{"id":"14","kind":"attribute","expr":"item.href","scopes":[{"as":"item","expr":"sectionNav","index":2}],"attr":"href"},{"id":"15","kind":"text","expr":"\"{{ item.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"item","expr":"sectionNav","index":2}]},{"id":"16","kind":"attribute","expr":"item.href","scopes":[{"as":"item","expr":"sectionNav","index":3}],"attr":"href"},{"id":"17","kind":"text","expr":"\"{{ item.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"item","expr":"sectionNav","index":3}]},{"id":"18","kind":"attribute","expr":"item.href","scopes":[{"as":"item","expr":"sectionNav","index":4}],"attr":"href"},{"id":"19","kind":"text","expr":"\"{{ item.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"item","expr":"sectionNav","index":4}]},{"id":"20","kind":"attribute","expr":"item.href","scopes":[{"as":"item","expr":"sectionNav","index":5}],"attr":"href"},{"id":"21","kind":"text","expr":"\"{{ item.label }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"item","expr":"sectionNav","index":5}]},{"id":"22","kind":"attribute","expr":"p.href","scopes":[{"as":"p","expr":"products","index":0}],"attr":"href"},{"id":"23","kind":"text","expr":"\"{{ p.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":0}]},{"id":"24","kind":"text","expr":"\"{{ p.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":0}]},{"id":"25","kind":"text","expr":"\"{{ p.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":0}]},{"id":"26","kind":"attribute","expr":"p.href","scopes":[{"as":"p","expr":"products","index":1}],"attr":"href"},{"id":"27","kind":"text","expr":"\"{{ p.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":1}]},{"id":"28","kind":"text","expr":"\"{{ p.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":1}]},{"id":"29","kind":"text","expr":"\"{{ p.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":1}]},{"id":"30","kind":"attribute","expr":"p.href","scopes":[{"as":"p","expr":"products","index":2}],"attr":"href"},{"id":"31","kind":"text","expr":"\"{{ p.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":2}]},{"id":"32","kind":"text","expr":"\"{{ p.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":2}]},{"id":"33","kind":"text","expr":"\"{{ p.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":2}]},{"id":"34","kind":"attribute","expr":"p.href","scopes":[{"as":"p","expr":"products","index":3}],"attr":"href"},{"id":"35","kind":"text","expr":"\"{{ p.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":3}]},{"id":"36","kind":"text","expr":"\"{{ p.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":3}]},{"id":"37","kind":"text","expr":"\"{{ p.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"products","index":3}]},{"id":"38","kind":"text","expr":"\"{{ v.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":0}]},{"id":"39","kind":"text","expr":"\"{{ v.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":0}]},{"id":"40","kind":"text","expr":"\"{{ v.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":0}]},{"id":"41","kind":"text","expr":"\"{{ v.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":1}]},{"id":"42","kind":"text","expr":"\"{{ v.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":1}]},{"id":"43","kind":"text","expr":"\"{{ v.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":1}]},{"id":"44","kind":"text","expr":"\"{{ v.tag }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":2}]},{"id":"45","kind":"text","expr":"\"{{ v.value }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":2}]},{"id":"46","kind":"text","expr":"\"{{ v.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"v","expr":"videoWall","index":2}]},{"id":"47","kind":"text","expr":"\"{{ p }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"partners","index":0}]},{"id":"48","kind":"text","expr":"\"{{ p }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"partners","index":1}]},{"id":"49","kind":"text","expr":"\"{{ p }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"partners","index":2}]},{"id":"50","kind":"text","expr":"\"{{ p }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"partners","index":3}]},{"id":"51","kind":"text","expr":"\"{{ p }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"partners","index":4}]},{"id":"52","kind":"text","expr":"\"{{ p }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"partners","index":5}]},{"id":"53","kind":"text","expr":"\"{{ p }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"p","expr":"partners","index":6}]},{"id":"54","kind":"text","expr":"\"{{ s.city }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":0}]},{"id":"55","kind":"text","expr":"\"{{ s.what }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":0}]},{"id":"56","kind":"text","expr":"\"{{ s.city }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":1}]},{"id":"57","kind":"text","expr":"\"{{ s.what }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":1}]},{"id":"58","kind":"text","expr":"\"{{ s.city }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":2}]},{"id":"59","kind":"text","expr":"\"{{ s.what }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"s","expr":"sites","index":2}]},{"id":"60","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":0}],"attr":"click"},{"id":"61","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":0}]},{"id":"62","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":0}]},{"id":"63","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":0}]},{"id":"64","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":0}]},{"id":"65","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":0}]},{"id":"66","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":1}],"attr":"click"},{"id":"67","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":1}]},{"id":"68","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":1}]},{"id":"69","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":1}]},{"id":"70","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":1}]},{"id":"71","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":1}]},{"id":"72","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":2}],"attr":"click"},{"id":"73","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":2}]},{"id":"74","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":2}]},{"id":"75","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":2}]},{"id":"76","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":2}]},{"id":"77","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":2}]},{"id":"78","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":3}],"attr":"click"},{"id":"79","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":3}]},{"id":"80","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":3}]},{"id":"81","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":3}]},{"id":"82","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":3}]},{"id":"83","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":3}]},{"id":"84","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":4}],"attr":"click"},{"id":"85","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":4}]},{"id":"86","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":4}]},{"id":"87","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":4}]},{"id":"88","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":4}]},{"id":"89","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":4}]},{"id":"90","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":5}],"attr":"click"},{"id":"91","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":5}]},{"id":"92","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":5}]},{"id":"93","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":5}]},{"id":"94","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":5}]},{"id":"95","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":5}]},{"id":"96","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":6}],"attr":"click"},{"id":"97","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":6}]},{"id":"98","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":6}]},{"id":"99","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":6}]},{"id":"100","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":6}]},{"id":"101","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":6}]},{"id":"102","kind":"event","expr":"w.toggle","scopes":[{"as":"w","expr":"whySrt","index":7}],"attr":"click"},{"id":"103","kind":"text","expr":"\"{{ w.n }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":7}]},{"id":"104","kind":"text","expr":"\"{{ w.title }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":7}]},{"id":"105","kind":"text","expr":"\"{{ w.mark }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":7}]},{"id":"106","kind":"condition","expr":"w.open","scopes":[{"as":"w","expr":"whySrt","index":7}]},{"id":"107","kind":"text","expr":"\"{{ w.body }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"whySrt","index":7}]},{"id":"108","kind":"text","expr":"\"{{ w.term }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":0}]},{"id":"109","kind":"text","expr":"\"{{ w.what }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":0}]},{"id":"110","kind":"text","expr":"\"{{ w.note }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":0}]},{"id":"111","kind":"text","expr":"\"{{ w.term }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":1}]},{"id":"112","kind":"text","expr":"\"{{ w.what }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":1}]},{"id":"113","kind":"text","expr":"\"{{ w.note }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":1}]},{"id":"114","kind":"text","expr":"\"{{ w.term }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":2}]},{"id":"115","kind":"text","expr":"\"{{ w.what }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":2}]},{"id":"116","kind":"text","expr":"\"{{ w.note }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[{"as":"w","expr":"warranty","index":2}]},{"id":"117","kind":"text","expr":"\"Call {{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"118","kind":"text","expr":"\"{{ phone }}\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]},{"id":"119","kind":"text","expr":"\"© {{ year }} Shooting Range Technologies™, a division of Laser Shot, Inc. All rights reserved.\".replace(/{{([\\s\\S]*?)}}/g, (_,e)=>evaluate(e,scope)?? \"\")","scopes":[]}];
const evaluate=(expr,scope)=>new Function(...Object.keys(scope),'evaluate','scope','return ('+expr+')')(...Object.values(scope),evaluate,scope);
function getScope(binding){let scope=app.renderVals();for(const s of binding.scopes) scope={...scope,[s.as]:evaluate(s.expr,scope)[s.index]};return scope;}
for(const el of document.querySelectorAll('[data-ref]')) app[el.dataset.ref].current=el;
function update(){for(const b of bindings){if(b.kind==='event')continue;const el=document.querySelector('[data-bind="'+b.id+'"]');if(!el)continue;const val=evaluate(b.expr,getScope(b));if(b.kind==='text')el.textContent=val;else if(b.kind==='condition'){el.style.display=val?'contents':'none';el.querySelectorAll('input,select,textarea').forEach(f=>f.disabled=!val);}else el.setAttribute(b.attr,val);}}
app.update=update;for(const b of bindings)if(b.kind==='event'){document.querySelector('[data-bind="'+b.id+'"]')?.addEventListener(b.attr,e=>evaluate(b.expr,getScope(b))(e));}
update();app.componentDidMount();

})();