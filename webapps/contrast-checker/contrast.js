(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var fg = $("ct-fg");
  var bg = $("ct-bg");
  var fgHex = $("ct-fghex");
  var bgHex = $("ct-bghex");
  var preview = $("ct-preview");
  var ratioEl = $("ct-ratio");
  var syncing = false;

  function lin(channel) {
    var c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function contrast(a, b) {
    var L1 = luminance(a);
    var L2 = luminance(b);
    var light = Math.max(L1, L2);
    var dark = Math.min(L1, L2);
    return (light + 0.05) / (dark + 0.05);
  }

  function normalize(value) {
    var hex = String(value).trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    return "#" + hex.toLowerCase();
  }

  function paint() {
    var a = normalize(fg.value);
    var b = normalize(bg.value);
    if (!a || !b) return;
    var ratio = contrast(a, b);
    ratioEl.textContent = (Math.round(ratio * 100) / 100).toFixed(2) + " : 1";
    preview.style.color = a;
    preview.style.background = b;
    var checks = [
      ["ct-aa", ratio >= 4.5],
      ["ct-aal", ratio >= 3],
      ["ct-aaa", ratio >= 7],
      ["ct-aaal", ratio >= 4.5]
    ];
    for (var i = 0; i < checks.length; i++) {
      var el = $(checks[i][0]);
      var pass = checks[i][1];
      el.className = "grade " + (pass ? "pass" : "fail");
      el.querySelector("span").textContent = pass ? "Pass" : "Fail";
    }
  }

  function fromPicker(picker, field) {
    if (syncing) return;
    syncing = true;
    field.value = picker.value;
    syncing = false;
    paint();
  }

  function fromField(field, picker) {
    if (syncing) return;
    var hex = normalize(field.value);
    if (!hex) return;
    syncing = true;
    picker.value = hex;
    field.value = hex;
    syncing = false;
    paint();
  }

  fg.addEventListener("input", function () { fromPicker(fg, fgHex); });
  bg.addEventListener("input", function () { fromPicker(bg, bgHex); });
  fgHex.addEventListener("input", function () { fromField(fgHex, fg); });
  bgHex.addEventListener("input", function () { fromField(bgHex, bg); });

  $("ct-swap").addEventListener("click", function () {
    var a = fg.value;
    fg.value = bg.value;
    bg.value = a;
    fgHex.value = fg.value;
    bgHex.value = bg.value;
    paint();
  });

  document.querySelector(".ct-presets").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-fg]");
    if (!btn) return;
    fg.value = btn.getAttribute("data-fg");
    bg.value = btn.getAttribute("data-bg");
    fgHex.value = fg.value;
    bgHex.value = bg.value;
    paint();
  });

  fgHex.value = fg.value;
  bgHex.value = bg.value;
  paint();
})();
