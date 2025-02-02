(function () {
  'use strict';

  // Delete the class 'preload' from the body when the page is loaded
  window.addEventListener('DOMContentLoaded', event => {
    document.body.classList.remove('preload');
  });

  // Load a script from a URL and return a promise
  // @param {string} src
  // @returns {Promise}
  const loadScript = src => new Promise((resolve, reject) => {
    const $script = document.createElement('script');
    $script.src = src;
    $script.onload = resolve;
    $script.onerror = reject;
    document.body.appendChild($script);
  });

  // Load a stylesheet from a URL and return a promise
  // @param {string} href
  // @returns {Promise}
  const loadStyle = href => new Promise((resolve, reject) => {
    const $link = document.createElement('link');
    $link.href = href;
    $link.rel = 'stylesheet';
    $link.onload = resolve;
    $link.onerror = reject;
    document.head.appendChild($link);
  });

  // Decode HTML entities
  // @param {string} string
  // @returns {string}
  const decodeHtml = string => {
    return string.replace(/\\x(\w{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  };

  // Check if the element is in the viewport
  // @param {Object} element - The element object
  // @param {Function} fn - The function to execute
  // @param {Object} options - The options object
  function isObserver(element, fn, options) {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          fn();
          observer.unobserve(entry.target);
        }
      });
    }, {
      ...options
    });
    observer.observe(element);
  }

  // Check if the current date exceeded the expiration date
  // @param {string} key - The key of the localStorage
  // @return {boolean}
  const isExpired = key => {
    const date = localStorage.getItem(key);
    if (date) {
      const now = new Date();
      const diff = now - new Date(date);
      const days = diff / 1000 / 60 / 60 / 24;
      return days > 7;
    }
    return true;
  };

  const REG_EXP = /cookieOptions\.(\w+)\) \|\| '(.+)'/g;
  const cookieJs = '/js/cookienotice.js';
  const textarea = document.getElementById('bjs');
  const loadCookieScript = () => {
    const textareaContent = textarea.value;
    const cookieOptions = window.cookieOptions || {};
    const Default = {};
    textareaContent.replace(REG_EXP, (_, key, value) => {
      Default[key] = decodeHtml(value);
    });
    if (textareaContent.includes(cookieJs)) {
      loadScript(new URL(cookieJs, window.location.origin).href).then(() => {
        const {
          msg = Default.msg,
          close = Default.close,
          learn = Default.learn,
          link = Default.link
        } = cookieOptions;
        if (typeof window.cookieChoices?.showCookieConsentBar === 'function') {
          // eslint-disable-next-line no-undef
          cookieChoices.showCookieConsentBar(msg, close, learn, link);
        }
      }).catch(err => {
        console.error(err);
      });
    }
  };
  if (textarea) {
    loadCookieScript();
    textarea.remove();
  }

  const rootMargin = '200px';
  function loadDisqus(container) {
    const {
      shortname,
      postUrl,
      postId
    } = container.dataset;
    window.disqus_config = function () {
      this.page.url = postUrl;
      this.page.identifier = postId;
    };
    const script = document.createElement('script');
    script.src = `https://${shortname}.disqus.com/embed.js`;
    script.setAttribute('data-timestamp', +new Date());
    document.head.appendChild(script);
  }
  function initDisqus() {
    const DISQUS = document.getElementById('disqus_thread');
    const DISQUS_BUTTON = document.getElementById('disqus_btn');
    const DISQUS_COMMENT_COUNT = document.querySelector('.disqus-comment-count');
    if (DISQUS_COMMENT_COUNT) {
      const {
        shortname
      } = DISQUS_COMMENT_COUNT.dataset;
      loadScript(`https://${shortname}.disqus.com/count.js`);
    }
    if (!DISQUS) return;
    if (DISQUS_BUTTON) {
      DISQUS_BUTTON.onclick = () => {
        loadDisqus(DISQUS);
        DISQUS_BUTTON.remove();
      };
    } else {
      isObserver(DISQUS, () => {
        loadDisqus(DISQUS);
      }, {
        rootMargin
      });
    }
  }
  initDisqus();

  const navElements = document.querySelectorAll('.nav');
  const ACTIVE_CLASS$1 = 'is-open';
  let isEventListenerActive = false;

  // Remove the underscore from the subnav links
  // @param {NodeList} links - The link elements
  function handleSubnavLinks(links) {
    links.forEach(link => {
      link.textContent = link.textContent.trim().replace(/^_+/, '');
    });
  }
  navElements.forEach(nav => {
    const subnavLinks = nav.querySelectorAll('.nav-subnav .nav-link');
    const subnavToggles = nav.querySelectorAll('.has-subnav .nav-item-toggle');
    handleSubnavLinks(subnavLinks);
    subnavToggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        toggle.parentNode.classList.toggle(ACTIVE_CLASS$1);
        const isOpen = nav.querySelector(`.${ACTIVE_CLASS$1}`);
        if (isOpen && !isEventListenerActive) {
          document.addEventListener('click', clickOutside);
          isEventListenerActive = true;
        }
      });
    });
    function clickOutside(event) {
      if (!nav.contains(event.target)) {
        nav.querySelectorAll('.has-subnav').forEach(item => {
          item.classList.remove(ACTIVE_CLASS$1);
        });
        document.removeEventListener('click', clickOutside);
        isEventListenerActive = false;
      }
    }
  });

  const buttons = document.querySelectorAll('[data-outside]');
  const ACTIVE_CLASS = 'is-active';

  // Toggle the target element
  // @param {HTMLElement} button - The button element
  function outsideClick(button) {
    if (!button) return;
    const target = document.getElementById(button.dataset.outside);
    const affected = document.getElementById(button.dataset.affected);
    if (!target) return;
    function toggleClasses() {
      button.classList.toggle(ACTIVE_CLASS);
      target.classList.toggle(ACTIVE_CLASS);
      if (affected) affected.classList.toggle(ACTIVE_CLASS);
      if (button.classList.contains(ACTIVE_CLASS)) {
        document.addEventListener('click', clickOutside);
        return;
      }
      document.removeEventListener('click', clickOutside);
    }
    button.addEventListener('click', toggleClasses);
    function clickOutside(event) {
      if (!target.contains(event.target) && !button.contains(event.target)) {
        toggleClasses();
        document.removeEventListener('click', clickOutside);
      }
    }
    const closeButton = target.querySelector('[data-close]');
    if (closeButton) {
      closeButton.addEventListener('click', toggleClasses);
    }
  }
  buttons.forEach(button => {
    outsideClick(button);
  });

  const POST_BODY_CLASS = '.post-body';

  const BLOG_ID = document.querySelector('meta[name="home-blog-admin"]');
  const CSS = 'https://www.blogger.com/dyn-css/authorization.css?targetBlogID=';
  if (BLOG_ID) {
    window.onload = () => {
      const blogId = BLOG_ID.getAttribute('content');
      loadStyle(`${CSS}${blogId}`);
    };
  }

})();
