(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var picker = $("cl-pick");
  var hexEl = $("cl-hex");
  var rEl = $("cl-r");
  var gEl = $("cl-g");
  var bEl = $("cl-b");
  var hEl = $("cl-h");
  var sEl = $("cl-s");
  var lEl = $("cl-l");
  var chip = $("cl-chip");
  var status = $("cl-status");
  var syncing = false;

  function clamp(n, lo, hi) {
    n = Number(n);
    if (!isFinite(n)) return lo;
    return Math.min(hi, Math.max(lo, Math.round(n)));
  }

  function show(text) {
    status.hidden = !text;
    status.className = "alert" + (text ? " bad" : "");
    status.textContent = text || "";
  }

  function hexByte(n) {
    return ("0" + clamp(n, 0, 255).toString(16)).slice(-2);
  }

  function parseHex(value) {
    var h = String(value).trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(h)) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h = 0;
    var s = 0;
    var l = (max + min) / 2;
    var d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function hue(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    if (s === 0) {
      var v = Math.round(l * 255);
      return [v, v, v];
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var hk = h / 360;
    return [
      Math.round(hue(p, q, hk + 1 / 3) * 255),
      Math.round(hue(p, q, hk) * 255),
      Math.round(hue(p, q, hk - 1 / 3) * 255)
    ];
  }

  function paint(r, g, b) {
    var hex = "#" + hexByte(r) + hexByte(g) + hexByte(b);
    var hsl = rgbToHsl(r, g, b);
    syncing = true;
    picker.value = hex;
    hexEl.value = hex;
    rEl.value = r;
    gEl.value = g;
    bEl.value = b;
    hEl.value = hsl[0];
    sEl.value = hsl[1];
    lEl.value = hsl[2];
    chip.style.background = hex;
    syncing = false;
    show("");
  }

  picker.addEventListener("input", function () {
    if (syncing) return;
    var rgb = parseHex(picker.value);
    if (rgb) paint(rgb[0], rgb[1], rgb[2]);
  });
  hexEl.addEventListener("input", function () {
    if (syncing) return;
    var rgb = parseHex(hexEl.value);
    if (!rgb) {
      show("Use a 3 or 6 digit hex color.");
      return;
    }
    paint(rgb[0], rgb[1], rgb[2]);
  });
  function fromRgb() {
    if (syncing) return;
    paint(clamp(rEl.value, 0, 255), clamp(gEl.value, 0, 255), clamp(bEl.value, 0, 255));
  }
  rEl.addEventListener("input", fromRgb);
  gEl.addEventListener("input", fromRgb);
  bEl.addEventListener("input", fromRgb);
  function fromHsl() {
    if (syncing) return;
    var rgb = hslToRgb(Number(hEl.value), Number(sEl.value), Number(lEl.value));
    paint(rgb[0], rgb[1], rgb[2]);
  }
  hEl.addEventListener("input", fromHsl);
  sEl.addEventListener("input", fromHsl);
  lEl.addEventListener("input", fromHsl);
  paint(29, 29, 31);
})();
