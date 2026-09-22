(function(){
  var canvas = document.getElementById('fx');
  var glow   = document.getElementById('glow');
  var ctx    = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var nodes = [], LINK = 140, raf = null;
  var mouse = { x: -9999, y: -9999, active: false };
  var target = { x: 0, y: 0 }, eased = { x: 0, y: 0 };

  function resize(){
    w = window.innerWidth; h = window.innerHeight;
    canvas.width  = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build(){
    var count = Math.min(110, Math.round(w * h / 15000));
    nodes = [];
    for (var i = 0; i < count; i++){
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .28,
        vy: (Math.random() - .5) * .28,
        r: Math.random() * 1.4 + .6
      });
    }
  }

  function draw(){
    ctx.clearRect(0, 0, w, h);

    // ease the parallax offset toward the cursor
    eased.x += (target.x - eased.x) * .06;
    eased.y += (target.y - eased.y) * .06;

    var i, j, a, b, dx, dy, d2, d;

    for (i = 0; i < nodes.length; i++){
      a = nodes[i];
      if (!reduce){ a.x += a.vx; a.y += a.vy; }

      if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
      if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;

      // gentle push away from the pointer
      if (mouse.active){
        dx = a.x - mouse.x; dy = a.y - mouse.y; d2 = dx*dx + dy*dy;
        if (d2 < 16000 && d2 > 1){
          d = Math.sqrt(d2);
          a.x += (dx / d) * (1 - d / 126) * 1.6;
          a.y += (dy / d) * (1 - d / 126) * 1.6;
        }
      }
    }

    // links
    for (i = 0; i < nodes.length; i++){
      a = nodes[i];
      var ax = a.x + eased.x, ay = a.y + eased.y;
      for (j = i + 1; j < nodes.length; j++){
        b = nodes[j];
        dx = a.x - b.x; dy = a.y - b.y; d2 = dx*dx + dy*dy;
        if (d2 < LINK * LINK){
          d = Math.sqrt(d2);
          var o = (1 - d / LINK) * .30;
          ctx.strokeStyle = 'rgba(120,165,255,' + o.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(b.x + eased.x, b.y + eased.y);
          ctx.stroke();
        }
      }

      // link to the pointer itself
      if (mouse.active){
        dx = a.x - mouse.x; dy = a.y - mouse.y; d = Math.sqrt(dx*dx + dy*dy);
        if (d < 200){
          ctx.strokeStyle = 'rgba(34,211,238,' + ((1 - d / 200) * .38).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = 'rgba(190,215,255,.7)';
      ctx.beginPath();
      ctx.arc(ax, ay, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  function onMove(x, y){
    mouse.x = x; mouse.y = y; mouse.active = true;
    target.x = (x / w - .5) * -26;
    target.y = (y / h - .5) * -26;
    glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', function(e){ onMove(e.clientX, e.clientY); });
  window.addEventListener('mouseleave', function(){ mouse.active = false; });
  window.addEventListener('touchmove', function(e){
    if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  document.addEventListener('visibilitychange', function(){
    if (document.hidden){ cancelAnimationFrame(raf); raf = null; }
    else if (!raf){ raf = requestAnimationFrame(draw); }
  });

  resize();
  raf = requestAnimationFrame(draw);
})();
