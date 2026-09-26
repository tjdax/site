(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var patEl = $("rx-pat");
  var textEl = $("rx-text");
  var view = $("rx-view");
  var list = $("rx-list");
  var summary = $("rx-summary");
  var status = $("rx-status");
  var timer = 0;

  function show(kind, text) {
    status.hidden = !text;
    status.className = "alert" + (kind ? " " + kind : "");
    status.textContent = text || "";
  }

  function flags() {
    var f = "g";
    if ($("rx-i").checked) f += "i";
    if ($("rx-m").checked) f += "m";
    return f;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function collect(re, text) {
    var found = [];
    var guard = 0;
    var match;
    while ((match = re.exec(text)) && guard < 400) {
      found.push({ index: match.index, text: match[0], groups: match.slice(1) });
      if (match[0] === "") {
        re.lastIndex += 1;
        if (re.lastIndex > text.length) break;
      }
      guard++;
    }
    return found;
  }

  function run() {
    var pattern = patEl.value;
    var text = textEl.value;
    show("", "");
    list.innerHTML = "";
    if (text.length > 20000) text = text.slice(0, 20000);
    if (!pattern) {
      view.textContent = text;
      summary.textContent = "Type a pattern.";
      return;
    }
    if (pattern.length > 400) {
      view.textContent = text;
      summary.textContent = "";
      show("bad", "Keep the pattern under 400 characters.");
      return;
    }
    var re;
    try {
      re = new RegExp(pattern, flags());
    } catch (e) {
      view.textContent = text;
      summary.textContent = "";
      show("bad", e.message || "That pattern is not valid.");
      return;
    }
    var found = collect(re, text);
    var html = "";
    var cursor = 0;
    for (var i = 0; i < found.length; i++) {
      var item = found[i];
      html += esc(text.slice(cursor, item.index));
      html += '<mark class="rx-hit">' + esc(item.text) + "</mark>";
      cursor = item.index + item.text.length;
      var row = document.createElement("li");
      var groups = item.groups.length ? " · groups: " + item.groups.map(function (g) { return g == null ? "—" : g; }).join(", ") : "";
      row.textContent = (i + 1) + ". at " + item.index + " · " + JSON.stringify(item.text) + groups;
      list.appendChild(row);
    }
    html += esc(text.slice(cursor));
    view.innerHTML = html;
    summary.textContent = found.length + (found.length === 1 ? " match" : " matches");
  }

  function queue() {
    clearTimeout(timer);
    timer = setTimeout(run, 80);
  }

  patEl.addEventListener("input", queue);
  textEl.addEventListener("input", queue);
  $("rx-i").addEventListener("change", run);
  $("rx-m").addEventListener("change", run);
  $("rx-sample").addEventListener("click", function () {
    patEl.value = "(\\w+)@(\\w+\\.\\w+)";
    textEl.value = "Write to tj@example.com or a@b.co today.";
    $("rx-i").checked = false;
    $("rx-m").checked = false;
    run();
  });
  run();
})();
