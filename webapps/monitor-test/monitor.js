(function () {
  var screen = document.getElementById("mt-screen");
  var fill = document.getElementById("mt-fill");
  var label = document.getElementById("mt-label");
  var grid = document.getElementById("mt-grid");
  var custom = document.getElementById("mt-custom");
  var HINT_MS = 2500;

  var BLACKS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32];
  var WHITES = BLACKS.map(function (v) { return 255 - v; }).reverse();

  function gray(v) {
    return "rgb(" + v + "," + v + "," + v + ")";
  }

  function stepsBg(values) {
    var w = 100 / values.length;
    var stops = values.map(function (v, i) {
      return gray(v) + " " + (i * w).toFixed(3) + "% " + ((i + 1) * w).toFixed(3) + "%";
    });
    return "linear-gradient(90deg," + stops.join(",") + ")";
  }

  function stepsHtml(values, text) {
    return '<div class="mt-steps">' + values.map(function (v) {
      return '<div style="background:' + gray(v) + ";color:" + text + '">' + v + "</div>";
    }).join("") + "</div>";
  }

  var BARS =
    "linear-gradient(90deg,#000,#fff) 0 0/100% 25% no-repeat," +
    "linear-gradient(90deg,#000,#f00) 0 33.333%/100% 25% no-repeat," +
    "linear-gradient(90deg,#000,#0f0) 0 66.667%/100% 25% no-repeat," +
    "linear-gradient(90deg,#000,#00f) 0 100%/100% 25% no-repeat";

  var PATTERNS = [
    { name: "White", check: "Dead or dim pixels, uniformity", bg: "#ffffff" },
    { name: "Black", check: "Stuck pixels, backlight bleed", bg: "#000000" },
    { name: "Red", check: "Stuck or dead red subpixels", bg: "#ff0000" },
    { name: "Green", check: "Stuck or dead green subpixels", bg: "#00ff00" },
    { name: "Blue", check: "Stuck or dead blue subpixels", bg: "#0000ff" },
    { name: "Cyan", check: "Mixed-color pixels and tint", bg: "#00ffff" },
    { name: "Magenta", check: "Mixed-color pixels and tint", bg: "#ff00ff" },
    { name: "Yellow", check: "Mixed-color pixels and tint", bg: "#ffff00" },
    { name: "Gray 50%", check: "Uniformity and smudged areas", bg: "#808080" },
    { name: "Gray gradient", check: "Banding in grays", bg: "linear-gradient(90deg,#000,#fff)" },
    { name: "Color gradients", check: "Banding in red, green, and blue", bg: BARS },
    { name: "Black levels", check: "Shadow detail, 0 to 32", bg: stepsBg(BLACKS), html: stepsHtml(BLACKS, "#6e6e6e") },
    { name: "White levels", check: "Highlight detail, 223 to 255", bg: stepsBg(WHITES), html: stepsHtml(WHITES, "#8a8a8a") },
    { name: "Custom color", check: "Any color you pick", custom: true }
  ];

  function bgOf(p) {
    return p.custom ? custom.value : p.bg;
  }

  var swatchFills = [];
  PATTERNS.forEach(function (p, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "mt-swatch";
    b.innerHTML = '<i aria-hidden="true"></i><b></b><span></span>';
    b.querySelector("b").textContent = p.name;
    b.querySelector("span").textContent = p.check;
    b.querySelector("i").style.background = bgOf(p);
    swatchFills[i] = b.querySelector("i");
    b.addEventListener("click", function () { open(i, b); });
    grid.appendChild(b);
  });

  custom.addEventListener("input", function () {
    var last = PATTERNS.length - 1;
    swatchFills[last].style.background = custom.value;
    if (!screen.hidden && index === last) render();
  });

  var index = 0;
  var trigger = null;
  var hintTimer = 0;

  function render() {
    var p = PATTERNS[index];
    fill.innerHTML = p.html || "";
    fill.style.background = p.html ? "" : bgOf(p);
    label.textContent = (index + 1) + " / " + PATTERNS.length + "  " + p.name + " \u00b7 " + p.check;
  }

  function showHint() {
    screen.classList.remove("idle");
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { screen.classList.add("idle"); }, HINT_MS);
  }

  function go(step) {
    index = (index + step + PATTERNS.length) % PATTERNS.length;
    render();
    showHint();
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function open(i, from) {
    index = i;
    trigger = from || null;
    render();
    screen.hidden = false;
    document.body.classList.add("mt-lock");
    var req = screen.requestFullscreen || screen.webkitRequestFullscreen;
    if (req) {
      try {
        var r = req.call(screen);
        if (r && r.catch) r.catch(function () {});
      } catch (e) {}
    }
    screen.focus();
    showHint();
  }

  function close() {
    if (screen.hidden) return;
    screen.hidden = true;
    document.body.classList.remove("mt-lock");
    clearTimeout(hintTimer);
    var from = trigger;
    function refocus() {
      if (from) from.focus();
    }
    var exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (fullscreenElement() && exit) {
      var r = exit.call(document);
      if (r && r.then) r.then(refocus, refocus);
      else setTimeout(refocus, 100);
    } else {
      refocus();
    }
  }

  function onFullscreenChange() {
    if (!fullscreenElement()) close();
  }
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);

  document.getElementById("mt-start").addEventListener("click", function () { open(0, this); });
  document.getElementById("mt-prev").addEventListener("click", function () { go(-1); });
  document.getElementById("mt-next").addEventListener("click", function () { go(1); });
  document.getElementById("mt-exit").addEventListener("click", close);

  screen.addEventListener("click", function (e) {
    if (e.target.closest(".mt-hint")) return;
    go(e.clientX < screen.clientWidth / 3 ? -1 : 1);
  });
  screen.addEventListener("mousemove", showHint);

  document.addEventListener("keydown", function (e) {
    if (screen.hidden) return;
    var k = e.key;
    if ((k === " " || k === "Enter") && e.target.closest && e.target.closest(".mt-hint button")) return;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === " " || k === "Enter") go(1);
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace") go(-1);
    else if (k === "Escape") close();
    else return;
    e.preventDefault();
  });
})();
