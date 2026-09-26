(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var face = $("fc-face");
  var status = $("fc-status");
  var startBtn = $("fc-start");
  var pauseBtn = $("fc-pause");
  var volume = $("fc-volume");
  var custom = $("fc-minutes");
  var pageTitle = document.title;

  var duration = 25 * 60 * 1000;
  var remaining = duration;
  var endAt = 0;
  var timer = 0;
  var running = false;
  var audio = null;
  var gain = null;
  var source = null;
  var sound = "off";

  function show(text) {
    status.hidden = !text;
    status.className = "alert ok";
    status.textContent = text || "";
  }

  function format(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function paint() {
    face.textContent = format(remaining);
    document.title = running || remaining !== duration ? format(remaining) + " · Focus timer" : pageTitle;
  }

  function setDuration(mins, pressed) {
    duration = Math.round(mins * 60 * 1000);
    remaining = duration;
    running = false;
    clearInterval(timer);
    endAt = 0;
    paint();
    show("");
    var buttons = document.querySelectorAll(".fc-presets button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i] === pressed));
    }
    if (!pressed) {
      for (var j = 0; j < buttons.length; j++) buttons[j].setAttribute("aria-pressed", "false");
    }
  }

  function tick() {
    remaining = endAt - Date.now();
    if (remaining <= 0) {
      remaining = 0;
      running = false;
      clearInterval(timer);
      paint();
      beep();
      show("Time's up.");
      return;
    }
    paint();
  }

  function ensureAudio() {
    if (audio) return;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio = new Ctx();
    gain = audio.createGain();
    gain.connect(audio.destination);
    applyVolume();
  }

  function applyVolume() {
    if (!gain) return;
    gain.gain.value = (Number(volume.value) / 100) * 0.18;
  }

  function makeBuffer(kind) {
    var rate = audio.sampleRate;
    var length = rate * 2;
    var buffer = audio.createBuffer(1, length, rate);
    var data = buffer.getChannelData(0);
    var i;
    if (kind === "white") {
      for (i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else if (kind === "brown") {
      var brown = 0;
      for (i = 0; i < length; i++) {
        brown = (brown + (Math.random() * 2 - 1) * 0.02) / 1.02;
        data[i] = brown * 3.5;
      }
    } else {
      for (i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
      var drops = 90;
      for (var n = 0; n < drops; n++) {
        var at = Math.floor(Math.random() * length);
        var amp = 0.4 + Math.random() * 0.8;
        var dur = 300 + Math.floor(Math.random() * 1200);
        for (var k = 0; k < dur && at + k < length; k++) {
          data[at + k] += (Math.random() * 2 - 1) * amp;
          amp *= 0.96;
        }
      }
    }
    return buffer;
  }

  function playSound() {
    if (!audio || sound === "off") {
      stopSound();
      return;
    }
    if (audio.state === "suspended") audio.resume();
    stopSound();
    source = audio.createBufferSource();
    source.buffer = makeBuffer(sound);
    source.loop = true;
    source.connect(gain);
    source.start();
  }

  function stopSound() {
    if (!source) return;
    try { source.stop(); } catch (e) {}
    source.disconnect();
    source = null;
  }

  function beep() {
    ensureAudio();
    if (!audio) return;
    var osc = audio.createOscillator();
    var g = audio.createGain();
    osc.frequency.value = 880;
    osc.connect(g);
    g.connect(audio.destination);
    var now = audio.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  startBtn.addEventListener("click", function () {
    if (running) return;
    if (remaining <= 0) remaining = duration;
    ensureAudio();
    playSound();
    running = true;
    endAt = Date.now() + remaining;
    clearInterval(timer);
    timer = setInterval(tick, 200);
    show("");
    paint();
  });

  pauseBtn.addEventListener("click", function () {
    if (!running) return;
    remaining = Math.max(0, endAt - Date.now());
    running = false;
    clearInterval(timer);
    paint();
  });

  $("fc-reset").addEventListener("click", function () {
    running = false;
    clearInterval(timer);
    remaining = duration;
    stopSound();
    paint();
    show("");
  });

  document.querySelector(".fc-presets").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-min]");
    if (!btn) return;
    custom.value = btn.getAttribute("data-min");
    setDuration(Number(btn.getAttribute("data-min")), btn);
    if (sound !== "off") stopSound();
  });

  custom.addEventListener("input", function () {
    var mins = Number(custom.value);
    if (!isFinite(mins) || mins < 1) return;
    setDuration(Math.min(180, mins), null);
  });

  document.querySelector(".fc-sounds").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-sound]");
    if (!btn) return;
    sound = btn.getAttribute("data-sound");
    var buttons = document.querySelectorAll(".fc-sounds button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i] === btn));
    }
    if (running || source) {
      ensureAudio();
      playSound();
    }
  });

  volume.addEventListener("input", function () {
    $("fc-vol").textContent = volume.value;
    applyVolume();
  });
  paint();
})();
