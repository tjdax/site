(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var left = $("df-a");
  var right = $("df-b");
  var out = $("df-out");
  var summary = $("df-summary");
  var status = $("df-status");
  var LIMIT = 800;

  function esc(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function linesOf(text) {
    var src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if ($("df-trim").checked) {
      src = src.split("\n").map(function (line) { return line.replace(/[ \t]+$/g, ""); }).join("\n");
    }
    return src.split("\n");
  }

  function diffLines(a, b) {
    var n = a.length;
    var m = b.length;
    var dp = new Array((n + 1) * (m + 1));
    function at(i, j) { return dp[i * (m + 1) + j]; }
    function set(i, j, v) { dp[i * (m + 1) + j] = v; }
    var i, j;
    for (i = n; i >= 0; i--) {
      for (j = m; j >= 0; j--) {
        if (i === n || j === m) set(i, j, 0);
        else if (a[i] === b[j]) set(i, j, at(i + 1, j + 1) + 1);
        else set(i, j, Math.max(at(i + 1, j), at(i, j + 1)));
      }
    }
    var rows = [];
    i = 0;
    j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { rows.push([" ", a[i]]); i++; j++; }
      else if (at(i + 1, j) >= at(i, j + 1)) { rows.push(["-", a[i]]); i++; }
      else { rows.push(["+", b[j]]); j++; }
    }
    while (i < n) rows.push(["-", a[i++]]);
    while (j < m) rows.push(["+", b[j++]]);
    return rows;
  }

  function render() {
    var a = linesOf(left.value);
    var b = linesOf(right.value);
    var note = "";
    if (a.length > LIMIT || b.length > LIMIT) {
      a = a.slice(0, LIMIT);
      b = b.slice(0, LIMIT);
      note = "Only the first " + LIMIT + " lines of each side are compared.";
    }
    status.hidden = !note;
    status.className = "alert warn";
    status.textContent = note;

    if (!left.value && !right.value) {
      out.innerHTML = "";
      summary.textContent = "Paste the two texts to compare them.";
      return;
    }

    var rows = diffLines(a, b);
    var added = 0;
    var removed = 0;
    var same = 0;
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      var kind = rows[i][0];
      var cls = kind === "+" ? "diff-add" : kind === "-" ? "diff-del" : "diff-same";
      if (kind === "+") added++;
      else if (kind === "-") removed++;
      else same++;
      html += '<div class="diff-line ' + cls + '"><b>' + kind + '</b><span>' + esc(rows[i][1]) + '</span></div>';
    }
    out.innerHTML = html;
    summary.textContent = added + " added · " + removed + " removed · " + same + " unchanged";
  }

  var timer = 0;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 150);
  }

  left.addEventListener("input", schedule);
  right.addEventListener("input", schedule);
  $("df-trim").addEventListener("change", render);
  $("df-go").addEventListener("click", render);
  $("df-sample").addEventListener("click", function () {
    left.value = "alpha\nbeta\ngamma";
    right.value = "alpha\nBETA\ngamma\ndelta";
    render();
  });
  summary.textContent = "Paste the two texts to compare them.";
})();
