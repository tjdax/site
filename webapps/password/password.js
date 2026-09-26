(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var out = $("pw-out");
  var lenEl = $("pw-len");
  var lenVal = $("pw-lenval");
  var status = $("pw-status");

  var SETS = {
    upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
    lower: "abcdefghijkmnopqrstuvwxyz",
    num: "23456789",
    sym: "!@#$%^&*-_=+?"
  };
  var FULL = {
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lower: "abcdefghijklmnopqrstuvwxyz",
    num: "0123456789",
    sym: "!@#$%^&*-_=+?"
  };

  function show(text) {
    status.hidden = !text;
    status.className = "alert" + (text ? " bad" : "");
    status.textContent = text || "";
  }

  function chosen() {
    var avoid = $("pw-avoid").checked;
    var bank = avoid ? SETS : FULL;
    var parts = [];
    ["upper", "lower", "num", "sym"].forEach(function (key) {
      if ($("pw-" + key).checked) parts.push(bank[key]);
    });
    return parts;
  }

  function pick(chars, n, rnd) {
    var s = "";
    for (var i = 0; i < n; i++) s += chars[rnd[i] % chars.length];
    return s;
  }

  function generate() {
    var parts = chosen();
    var length = Math.min(64, Math.max(8, Number(lenEl.value) || 16));
    lenEl.value = String(length);
    lenVal.textContent = String(length);
    if (!parts.length) {
      out.value = "";
      show("Turn on at least one character set.");
      $("pw-copy").disabled = true;
      return;
    }
    show("");
    var all = parts.join("");
    var count = length;
    var rnd = new Uint32Array(count + parts.length);
    crypto.getRandomValues(rnd);
    var chars = pick(all, count, rnd).split("");
    if (count >= parts.length) {
      for (var i = 0; i < parts.length; i++) {
        chars[i] = parts[i][rnd[count + i] % parts[i].length];
      }
      for (var j = chars.length - 1; j > 0; j--) {
        var k = rnd[j % rnd.length] % (j + 1);
        var tmp = chars[j];
        chars[j] = chars[k];
        chars[k] = tmp;
      }
    }
    out.value = chars.join("");
    $("pw-copy").disabled = false;
  }

  lenEl.addEventListener("input", function () {
    lenVal.textContent = lenEl.value;
    generate();
  });
  ["upper", "lower", "num", "sym", "avoid"].forEach(function (key) {
    $("pw-" + key).addEventListener("change", generate);
  });
  $("pw-go").addEventListener("click", generate);
  $("pw-copy").addEventListener("click", function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () {
      show("");
      status.hidden = false;
      status.className = "alert ok";
      status.textContent = "Copied.";
    }, function () {
      out.focus();
      out.select();
    });
  });
  generate();
})();
