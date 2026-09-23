(function () {
  "use strict";

  var STORE = "tjdax-sudoku-v1";
  var CLUES = { easy: 40, medium: 32, hard: 26 };
  var LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
  var ALL = 0x3fe;

  var $ = function (id) { return document.getElementById(id); };
  var board = $("sd-board");
  var pad = $("sd-pad");
  var cells = [];
  var padButtons = [];

  var S = null;
  var sel = -1;
  var notesMode = false;
  var history = [];
  var runningSince = 0;
  var ticker = 0;

  function row(i) { return (i / 9) | 0; }
  function col(i) { return i % 9; }
  function box(i) { return ((i / 27) | 0) * 3 + (((i % 9) / 3) | 0); }
  function bits(m) { var c = 0; while (m) { m &= m - 1; c++; } return c; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function search(g, limit, randomize) {
    var rows = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var cols = rows.slice();
    var boxes = rows.slice();
    var empties = [];
    for (var i = 0; i < 81; i++) {
      var v = g[i];
      if (!v) { empties.push(i); continue; }
      var b = 1 << v;
      if (rows[row(i)] & b || cols[col(i)] & b || boxes[box(i)] & b) return 0;
      rows[row(i)] |= b; cols[col(i)] |= b; boxes[box(i)] |= b;
    }
    var found = 0;
    function rec() {
      var best = -1, bestMask = 0, bestCount = 10;
      for (var k = 0; k < empties.length; k++) {
        var c = empties[k];
        if (g[c]) continue;
        var m = ALL & ~(rows[row(c)] | cols[col(c)] | boxes[box(c)]);
        var n = bits(m);
        if (n < bestCount) { best = c; bestMask = m; bestCount = n; if (n <= 1) break; }
      }
      if (best === -1) { found++; return found >= limit; }
      if (!bestCount) return false;
      var digits = [];
      for (var d = 1; d <= 9; d++) if (bestMask & (1 << d)) digits.push(d);
      if (randomize) shuffle(digits);
      var r = row(best), cl = col(best), bx = box(best);
      for (var x = 0; x < digits.length; x++) {
        var bit = 1 << digits[x];
        g[best] = digits[x];
        rows[r] |= bit; cols[cl] |= bit; boxes[bx] |= bit;
        if (rec()) return true;
        rows[r] &= ~bit; cols[cl] &= ~bit; boxes[bx] &= ~bit;
        g[best] = 0;
      }
      return false;
    }
    rec();
    return found;
  }

  function generate(level) {
    var solution = new Array(81).fill(0);
    search(solution, 1, true);
    var puzzle = solution.slice();
    var clues = 81;
    var order = shuffle(Array.from({ length: 81 }, function (_, i) { return i; }));
    for (var k = 0; k < order.length && clues > CLUES[level]; k++) {
      var i = order[k];
      var keep = puzzle[i];
      puzzle[i] = 0;
      if (search(puzzle.slice(), 2, false) !== 1) puzzle[i] = keep;
      else clues--;
    }
    return {
      level: level,
      puzzle: puzzle,
      solution: solution,
      values: puzzle.slice(),
      notes: new Array(81).fill(0),
      mistakes: 0,
      hints: 0,
      elapsed: 0,
      done: false
    };
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {}
  }

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE));
      if (s && s.puzzle && s.puzzle.length === 81 && s.solution.length === 81 && CLUES[s.level]) return s;
    } catch (e) {}
    return null;
  }

  function elapsed() {
    return S.elapsed + (runningSince ? Date.now() - runningSince : 0);
  }

  function fmt(ms) {
    var t = Math.floor(ms / 1000);
    var h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    var mm = (m < 10 ? "0" : "") + m, ss = (s < 10 ? "0" : "") + s;
    return h ? h + ":" + mm + ":" + ss : mm + ":" + ss;
  }

  function startClock() {
    if (S.done || runningSince || document.hidden) return;
    runningSince = Date.now();
    clearInterval(ticker);
    ticker = setInterval(function () { $("sd-time").textContent = fmt(elapsed()); }, 500);
  }

  function stopClock() {
    if (runningSince) { S.elapsed += Date.now() - runningSince; runningSince = 0; }
    clearInterval(ticker);
    $("sd-time").textContent = fmt(S.elapsed);
  }

  function buildBoard() {
    for (var i = 0; i < 81; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.i = i;
      b.tabIndex = -1;
      cells.push(b);
      board.appendChild(b);
    }
    for (var d = 1; d <= 9; d++) {
      var p = document.createElement("button");
      p.type = "button";
      p.className = "pad-key";
      p.dataset.d = d;
      p.innerHTML = d + '<small></small>';
      padButtons.push(p);
      pad.appendChild(p);
    }
  }

  function render() {
    var sv = sel >= 0 ? S.values[sel] : 0;
    var show = $("sd-show").checked;
    var placed = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 81; i++) {
      var v = S.values[i];
      if (v && v === S.solution[i]) placed[v]++;
      var given = S.puzzle[i] !== 0;
      var cls = "cell";
      if (col(i) === 2 || col(i) === 5) cls += " c3";
      if (row(i) === 2 || row(i) === 5) cls += " r3";
      cls += given ? " given" : " user";
      if (sel >= 0) {
        if (i === sel) cls += " sel";
        else if (row(i) === row(sel) || col(i) === col(sel) || box(i) === box(sel)) cls += " peer";
        if (sv && v === sv && i !== sel) cls += " same";
      }
      if (show && v && !given && v !== S.solution[i]) cls += " wrong";
      var c = cells[i];
      c.className = cls;
      c.tabIndex = i === (sel >= 0 ? sel : 0) ? 0 : -1;
      if (v) {
        c.textContent = v;
      } else if (S.notes[i]) {
        var h = '<span class="notes">';
        for (var d = 1; d <= 9; d++) h += "<i>" + (S.notes[i] & (1 << d) ? d : "") + "</i>";
        c.innerHTML = h + "</span>";
      } else {
        c.textContent = "";
      }
      c.setAttribute("aria-label", "Row " + (row(i) + 1) + ", column " + (col(i) + 1) + ", " +
        (v ? v : "empty") + (given ? ", given" : ""));
    }
    for (var k = 0; k < 9; k++) {
      var left = 9 - placed[k + 1];
      padButtons[k].querySelector("small").textContent = left ? left : "";
      padButtons[k].disabled = S.done || !left;
    }
    $("sd-level").textContent = LABEL[S.level];
    $("sd-mistakes").textContent = S.mistakes;
    $("sd-notes").textContent = "Notes: " + (notesMode ? "on" : "off");
    $("sd-notes").setAttribute("aria-pressed", notesMode ? "true" : "false");
    $("sd-undo").disabled = !history.length || S.done;
    $("sd-diff").value = S.level;
    var msg = $("sd-msg");
    if (S.done) {
      msg.hidden = false;
      msg.textContent = "Solved! " + LABEL[S.level] + " in " + fmt(S.elapsed) + " with " +
        S.mistakes + (S.mistakes === 1 ? " mistake" : " mistakes") + " and " +
        S.hints + (S.hints === 1 ? " hint." : " hints.");
    } else {
      msg.hidden = true;
    }
  }

  function snapshot() {
    history.push({ values: S.values.slice(), notes: S.notes.slice(), sel: sel });
    if (history.length > 300) history.shift();
  }

  function clearPeerNotes(i, v) {
    var bit = 1 << v;
    for (var k = 0; k < 81; k++) {
      if (row(k) === row(i) || col(k) === col(i) || box(k) === box(i)) S.notes[k] &= ~bit;
    }
  }

  function afterChange() {
    var solved = true;
    for (var i = 0; i < 81; i++) if (S.values[i] !== S.solution[i]) { solved = false; break; }
    if (solved) { stopClock(); S.done = true; }
    save();
    render();
  }

  function input(v) {
    if (sel < 0 || S.done || S.puzzle[sel]) return;
    startClock();
    if (notesMode) {
      if (S.values[sel]) return;
      snapshot();
      S.notes[sel] ^= 1 << v;
    } else {
      if (S.values[sel] === v) return;
      snapshot();
      S.values[sel] = v;
      S.notes[sel] = 0;
      if (v !== S.solution[sel]) S.mistakes++;
      else clearPeerNotes(sel, v);
    }
    afterChange();
  }

  function erase() {
    if (sel < 0 || S.done || S.puzzle[sel]) return;
    if (!S.values[sel] && !S.notes[sel]) return;
    snapshot();
    S.values[sel] = 0;
    S.notes[sel] = 0;
    afterChange();
  }

  function undo() {
    if (!history.length || S.done) return;
    var h = history.pop();
    S.values = h.values;
    S.notes = h.notes;
    sel = h.sel;
    save();
    render();
  }

  function hint() {
    if (S.done) return;
    var target = -1;
    if (sel >= 0 && !S.puzzle[sel] && S.values[sel] !== S.solution[sel]) target = sel;
    if (target < 0) {
      var open = [];
      for (var i = 0; i < 81; i++) if (S.values[i] !== S.solution[i]) open.push(i);
      if (!open.length) return;
      target = open[Math.floor(Math.random() * open.length)];
    }
    startClock();
    snapshot();
    sel = target;
    S.values[target] = S.solution[target];
    S.notes[target] = 0;
    clearPeerNotes(target, S.solution[target]);
    S.hints++;
    afterChange();
    cells[target].focus();
  }

  function select(i) {
    sel = i;
    render();
    cells[i].focus();
  }

  function newGame(level) {
    if (S) stopClock();
    $("sd-new").disabled = true;
    $("sd-new").textContent = "Generating...";
    setTimeout(function () {
      S = generate(level);
      history = [];
      sel = -1;
      notesMode = false;
      $("sd-new").disabled = false;
      $("sd-new").textContent = "New game";
      $("sd-time").textContent = "00:00";
      save();
      render();
      startClock();
    }, 30);
  }

  function restart() {
    stopClock();
    S.values = S.puzzle.slice();
    S.notes = new Array(81).fill(0);
    S.mistakes = 0;
    S.hints = 0;
    S.elapsed = 0;
    S.done = false;
    history = [];
    save();
    render();
    startClock();
  }

  board.addEventListener("click", function (e) {
    var c = e.target.closest(".cell");
    if (c) select(+c.dataset.i);
  });

  pad.addEventListener("click", function (e) {
    var p = e.target.closest(".pad-key");
    if (p && !p.disabled) input(+p.dataset.d);
  });

  $("sd-erase").addEventListener("click", erase);
  $("sd-undo").addEventListener("click", undo);
  $("sd-hint").addEventListener("click", hint);
  $("sd-notes").addEventListener("click", function () { notesMode = !notesMode; render(); });
  $("sd-new").addEventListener("click", function () { newGame($("sd-diff").value); });
  $("sd-restart").addEventListener("click", restart);
  $("sd-show").addEventListener("change", render);

  document.addEventListener("keydown", function (e) {
    var tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k >= "1" && k <= "9") { input(+k); e.preventDefault(); return; }
    if (k === "Backspace" || k === "Delete" || k === "0") { erase(); e.preventDefault(); return; }
    if (k === "n" || k === "N") { notesMode = !notesMode; render(); return; }
    var move = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[k];
    if (move !== undefined && board.contains(document.activeElement)) {
      e.preventDefault();
      var i = sel < 0 ? 0 : sel;
      if (move === -1 && col(i) === 0) i += 8;
      else if (move === 1 && col(i) === 8) i -= 8;
      else i = (i + move + 81) % 81;
      select(i);
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stopClock(); save(); }
    else if (S && !S.done) startClock();
  });
  window.addEventListener("pagehide", function () { if (S) { stopClock(); save(); } });

  buildBoard();
  S = load();
  if (S) {
    render();
    $("sd-time").textContent = fmt(S.elapsed);
    if (!S.done) startClock();
  } else {
    newGame("medium");
  }
})();
