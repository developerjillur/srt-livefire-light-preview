(() => {
  'use strict';
  document.documentElement.classList.add('js');
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('a[href],button:not(:disabled),input,select,textarea,[tabindex="0"]')]
        .filter(control => control.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
  });
  const menu = document.querySelector('#mobile-menu');
  const menuTrigger = document.querySelector('[data-menu-open]');
  if (menu && menuTrigger) {
    menuTrigger.addEventListener('click', () => {
      menu.showModal();
      document.body.classList.add('menu-open');
      menuTrigger.setAttribute('aria-expanded', 'true');
      menu.querySelector('[data-menu-close]').focus();
    });
    menu.querySelector('[data-menu-close]').addEventListener('click', () => menu.close());
    menu.addEventListener('close', () => {
      document.body.classList.remove('menu-open');
      menuTrigger.setAttribute('aria-expanded', 'false');
      menuTrigger.focus();
    });
    menu.addEventListener('click', event => {
      if (event.target === menu) {
        const rect = menu.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right) menu.close();
      }
    });
    matchMedia('(min-width:1051px)').addEventListener('change', event => {
      if (event.matches && menu.open) menu.close();
    });
  }
  document.querySelectorAll('.nav-disclosure').forEach(disclosure => {
    disclosure.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        disclosure.open = false;
        disclosure.querySelector('summary').focus();
      }
    });
    document.addEventListener('click', event => {
      if (!disclosure.contains(event.target)) disclosure.open = false;
    });
    disclosure.addEventListener('focusout', event => {
      if (!disclosure.contains(event.relatedTarget)) disclosure.open = false;
    });
  });

  const tabList = document.querySelector('[data-range-tabs]');
  if (tabList) {
    const tabs = [...tabList.querySelectorAll('button')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    const desktop = matchMedia('(min-width:761px)');
    let selected = 0;
    const select = index => {
      selected = index;
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = desktop.matches && i !== index;
      });
    };
    const layout = () => {
      tabList.hidden = !desktop.matches;
      panels.forEach(panel => {
        if (desktop.matches) {
          panel.setAttribute('role', 'tabpanel');
          panel.tabIndex = 0;
        } else {
          panel.removeAttribute('role');
          panel.tabIndex = -1;
        }
      });
      select(selected);
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          select(next);
          tabs[next].focus();
        }
      });
    });
    desktop.addEventListener('change', layout);
    layout();
  }

  const lightbox = document.querySelector('#image-viewer');
  if (lightbox) {
    let opener;
    let group = [];
    let index = 0;
    const largeImage = lightbox.querySelector('img');
    const caption = lightbox.querySelector('[data-image-caption]');
    const directLink = lightbox.querySelector('.original-link');
    const counter = lightbox.querySelector('[data-image-count]');
    const controls = lightbox.querySelector('.gallery-controls');
    const show = next => {
      index = (next + group.length) % group.length;
      const link = group[index];
      largeImage.src = link.href;
      largeImage.alt = link.querySelector('img').alt;
      caption.textContent = largeImage.alt;
      directLink.href = link.href;
      counter.textContent = `${index + 1} / ${group.length}`;
      controls.hidden = group.length < 2;
    };
    document.querySelectorAll('[data-gallery]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        const container = link.closest('.gallery-grid');
        group = container ? [...container.querySelectorAll('[data-gallery]')] : [link];
        show(group.indexOf(link));
        lightbox.showModal();
        document.body.classList.add('image-open');
        lightbox.querySelector('[data-image-close]').focus();
      });
    });
    lightbox.querySelector('[data-image-previous]').addEventListener('click', () => show(index - 1));
    lightbox.querySelector('[data-image-next]').addEventListener('click', () => show(index + 1));
    lightbox.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        show(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    lightbox.querySelector('[data-image-close]').addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => {
      if (event.target !== lightbox) return;
      const rect = lightbox.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
    });
    lightbox.addEventListener('close', () => {
      document.body.classList.remove('image-open');
      opener?.focus();
    });
  }

  document.querySelectorAll('[data-video]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const frame = link.closest('.video-frame');
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + link.dataset.video + '?autoplay=1&rel=0';
      iframe.title = link.getAttribute('aria-label').replace(/^Play /, '');
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.replaceChildren(iframe);
      iframe.focus();
    });
  });

  const formRoot = document.getElementById('hubspot-form');
  if (formRoot) {
    const status = document.getElementById('form-status');
    let ready = false;
    const failed = () => {
      if (ready) return;
      status.dataset.state = 'error';
      status.replaceChildren();
      status.append('The enquiry form could not load. Please ');
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'retry-form';
      retry.textContent = 'reload this page';
      retry.addEventListener('click', () => location.reload());
      const phone = document.createElement('a');
      phone.href = 'tel:+12812401222';
      phone.textContent = '(281) 240-1222';
      status.append(retry, ' or call ', phone, '.');
    };
    const timer = setTimeout(failed, 16000);
    const script = document.createElement('script');
    script.src = 'https://js.hsforms.net/forms/embed/v2.js';
    script.async = true;
    script.onerror = failed;
    script.onload = () => {
      if (!window.hbspt?.forms) return failed();
      window.hbspt.forms.create({
        region: 'na1',
        portalId: '3339122',
        formId: '1b1cadbb-f229-465c-a6a6-0c63440d7e0c',
        target: '#hubspot-form',
        onFormReady: () => {
          ready = true;
          clearTimeout(timer);
          status.dataset.state = 'loaded';
          formRoot.querySelectorAll('iframe').forEach(frame => frame.title = 'SRT enquiry form');
        }
      });
    };
    document.head.append(script);
  }
})();
