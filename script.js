(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  var header = document.getElementById('siteHeader');
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');

  if (btn && header) {
    btn.addEventListener('click', function () {
      var isOpen = header.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', String(isOpen));
      btn.textContent = isOpen ? 'Close' : 'Menu';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        header.classList.remove('nav-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = 'Menu';
      }
    });
  }

  /* Interactive Mouse Coordinates for Ambient Glow & Card Spotlight */
  var mouseGlow = document.getElementById('mouseGlow');
  var cards = document.querySelectorAll('.card');

  if (!reduceMotion) {
    window.addEventListener('mousemove', function (e) {
      var x = e.clientX;
      var y = e.clientY;
      if (mouseGlow) {
        mouseGlow.style.left = x + 'px';
        mouseGlow.style.top = y + 'px';
      }
    }, { passive: true });

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var cx = e.clientX - rect.left;
        var cy = e.clientY - rect.top;
        card.style.setProperty('--mouse-card-x', cx + 'px');
        card.style.setProperty('--mouse-card-y', cy + 'px');
      }, { passive: true });
    });
  }

  /* IntersectionObserver for Staggered Scroll Reveal */
  var revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(function (el, index) {
      el.style.transitionDelay = (index % 4 * 70) + 'ms';
      observer.observe(el);
    });
  }

  /* Scroll Progress, Sticky Header Glass, and Timeline Progress */
  var progressBar = document.querySelector('.scroll-progress');
  var timeline = document.querySelector('.timeline');
  var timelineItems = timeline ? Array.prototype.slice.call(timeline.children) : [];
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  var photo = document.querySelector('.hero-photo');
  var ticking = false;

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () {
        var vh = window.innerHeight;
        var maxScroll = document.documentElement.scrollHeight - vh;
        var scrollY = window.scrollY;

        // Progress bar
        if (progressBar && maxScroll > 0) {
          var progress = Math.min(1, Math.max(0, scrollY / maxScroll));
          progressBar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
        }

        // Header style
        if (header) {
          header.classList.toggle('is-scrolled', scrollY > 30);
        }

        // Nav active link tracking
        var currentSection = '';
        sections.forEach(function (sec) {
          var r = sec.getBoundingClientRect();
          if (r.top <= vh * 0.35 && r.bottom > vh * 0.35) {
            currentSection = sec.id;
          }
        });

        navLinks.forEach(function (a) {
          var href = a.getAttribute('href');
          var isActive = href === '#' + currentSection;
          a.classList.toggle('is-active', isActive);
          if (isActive) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });

        // Timeline animated indicator
        if (timeline) {
          var tr = timeline.getBoundingClientRect();
          var focus = vh * 0.6;
          var p = Math.min(1, Math.max(0, (focus - tr.top) / tr.height));
          timeline.style.setProperty('--p', p.toFixed(3));
          timelineItems.forEach(function (li) {
            li.classList.toggle('is-passed', li.getBoundingClientRect().top < focus);
          });
        }

        // Subtle hero photo parallax
        if (photo && !reduceMotion) {
          photo.style.setProperty('--py', (Math.min(scrollY, 500) * 0.05).toFixed(1) + 'px');
        }

        ticking = false;
      });
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Fallback image handler */
  function showFallback(img) {
    var box = document.createElement('div');
    var isProfile = img.getAttribute('data-fallback') === 'profile';
    box.className = 'fallback ' + (isProfile ? 'fallback-profile' : 'fallback-work');
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', img.getAttribute('alt') || '');
    var label = img.getAttribute('data-fallback-label') || '';
    if (isProfile) {
      var circle = document.createElement('span');
      circle.textContent = label;
      box.appendChild(circle);
    } else {
      box.textContent = label;
    }
    img.replaceWith(box);
  }

  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) {
      showFallback(img);
    } else {
      img.addEventListener('error', function () { showFallback(img); }, { once: true });
    }
  });

  // Copyright year
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  /* Interactive Animated Circuit / Node Particle Network Canvas */
  var canvas = document.getElementById('circuit-particles');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var width = 0;
    var height = 0;
    var dpr = window.devicePixelRatio || 1;
    var particles = [];
    var packets = [];
    var mouse = { x: -9999, y: -9999, radius: 200, active: false };

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      particles = [];
      packets = [];
      // Tuned particle count relative to screen area for richer interconnected density without clutter
      var area = width * height;
      var count = Math.max(65, Math.min(130, Math.floor(area / 11500)));

      for (var i = 0; i < count; i++) {
        var isHub = Math.random() < 0.24; // Hub nodes act as system/API junctions
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (isHub ? 0.7 : 0.95),
          vy: (Math.random() - 0.5) * (isHub ? 0.7 : 0.95),
          baseRadius: isHub ? (Math.random() * 1.6 + 2.5) : (Math.random() * 1.3 + 1.2),
          isHub: isHub,
          pulseAngle: Math.random() * Math.PI * 2,
          pulseSpeed: 0.035 + Math.random() * 0.045,
          colorType: Math.random() < 0.65 ? 'cyan' : 'blue' // '#00D4FF' or '#5A94F5'
        });
      }

      // Increased pool of data pulse packets traveling along lines for more active data flow
      var packetCount = Math.floor(count * 0.6);
      for (var p = 0; p < packetCount; p++) {
        packets.push({
          pairIndex: 0,
          progress: Math.random(),
          speed: 0.012 + Math.random() * 0.018,
          active: false
        });
      }
    }

    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });

    window.addEventListener('mouseleave', function () {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    var maxDist = 145;
    var maxDistSq = maxDist * maxDist;

    function renderCircuit() {
      ctx.clearRect(0, 0, width, height);

      // Update particle positions
      var len = particles.length;
      for (var i = 0; i < len; i++) {
        var p = particles[i];

        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulseAngle += p.pulseSpeed;

          // Wrap edges smoothly
          if (p.x < -20) p.x = width + 20;
          else if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          else if (p.y > height + 20) p.y = -20;

          // Dynamic mouse interactive reaction
          if (mouse.active) {
            var dxm = p.x - mouse.x;
            var dym = p.y - mouse.y;
            var distMouseSq = dxm * dxm + dym * dym;
            var mouseRadSq = mouse.radius * mouse.radius;
            if (distMouseSq < mouseRadSq && distMouseSq > 0.01) {
              var distM = Math.sqrt(distMouseSq);
              var force = (1 - distM / mouse.radius) * 2.2;
              p.x += (dxm / distM) * force;
              p.y += (dym / distM) * force;
            }
          }
        }
      }

      // Draw connection lines & orthogonal circuit traces
      var connectedPairs = [];
      for (var i = 0; i < len; i++) {
        var p1 = particles[i];

        // Connect with cursor if in proximity
        if (mouse.active) {
          var mdx = p1.x - mouse.x;
          var mdy = p1.y - mouse.y;
          var mDistSq = mdx * mdx + mdy * mdy;
          if (mDistSq < 185 * 185) {
            var mDist = Math.sqrt(mDistSq);
            var mAlpha = (1 - mDist / 185) * 0.48;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = 'rgba(0, 212, 255, ' + mAlpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        for (var j = i + 1; j < len; j++) {
          var p2 = particles[j];
          var dx = p2.x - p1.x;
          var dy = p2.y - p1.y;
          var distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            var dist = Math.sqrt(distSq);
            var alpha = (1 - dist / maxDist) * 0.35;
            connectedPairs.push({ p1: i, p2: j });

            ctx.beginPath();
            // Circuit trace logic: occasional orthogonal bends for tech circuit look
            var isOrthogonal = (i + j) % 6 === 0;
            if (isOrthogonal) {
              var midX = p1.x + dx * 0.5;
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(midX, p1.y);
              ctx.lineTo(midX, p2.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = 'rgba(0, 212, 255, ' + (alpha * 0.8).toFixed(3) + ')';
              ctx.lineWidth = 0.95;
            } else {
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              var isCyan = (i + j) % 2 === 0;
              ctx.strokeStyle = isCyan 
                ? 'rgba(0, 212, 255, ' + alpha.toFixed(3) + ')' 
                : 'rgba(47, 111, 219, ' + (alpha * 1.15).toFixed(3) + ')';
              ctx.lineWidth = 0.8;
            }
            ctx.stroke();
          }
        }
      }

      // Update & Draw Data Packets along circuits with lively flow
      if (!reduceMotion && connectedPairs.length > 0) {
        for (var k = 0; k < packets.length; k++) {
          var pkt = packets[k];
          if (!pkt.active || pkt.pairIndex >= connectedPairs.length) {
            pkt.pairIndex = Math.floor(Math.random() * connectedPairs.length);
            pkt.progress = 0;
            pkt.active = true;
          }

          var pair = connectedPairs[pkt.pairIndex];
          if (pair) {
            var nodeA = particles[pair.p1];
            var nodeB = particles[pair.p2];

            pkt.progress += pkt.speed;
            if (pkt.progress >= 1) {
              pkt.active = false;
              continue;
            }

            var px = nodeA.x + (nodeB.x - nodeA.x) * pkt.progress;
            var py = nodeA.y + (nodeB.y - nodeA.y) * pkt.progress;

            // Draw glowing data pulse packet
            ctx.beginPath();
            ctx.arc(px, py, 2.4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#00D4FF';
            ctx.shadowBlur = 9;
            ctx.fill();
            ctx.shadowBlur = 0; // reset shadow
          } else {
            pkt.active = false;
          }
        }
      }

      // Draw Nodes & Hub Junctions
      for (var n = 0; n < len; n++) {
        var pt = particles[n];
        var pulse = Math.sin(pt.pulseAngle);
        var r = pt.baseRadius + (reduceMotion ? 0 : pulse * 0.7);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.6, r), 0, Math.PI * 2);

        if (pt.isHub) {
          ctx.fillStyle = '#00D4FF';
          ctx.shadowColor = '#00D4FF';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Outer circuit junction ring
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, r + 3.4, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = pt.colorType === 'cyan' ? 'rgba(0, 212, 255, 0.9)' : 'rgba(90, 148, 245, 0.9)';
          ctx.fill();
        }
      }

      if (!reduceMotion) {
        requestAnimationFrame(renderCircuit);
      }
    }

    if (!reduceMotion) {
      requestAnimationFrame(renderCircuit);
    } else {
      renderCircuit();
    }
  }
})();
