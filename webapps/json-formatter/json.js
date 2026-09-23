(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var src = $("js-in");
  var out = $("js-out");
  var status = $("js-status");
  var lastText = "";
  var lastError = null;

  var SAMPLE = '{"name":"TJDAX","tools":["Sudoku","JSON Formatter","QR Code Generator"],' +
    '"free":true,"users":null,"bigId":12345678901234567890,"price":0.0,' +
    '"meta":{"created":"2026-09-23","tags":{"b":2,"a":1}}}';

  function ParseError(message, pos) { this.message = message; this.pos = pos; }

  function parse(text) {
    var i = 0, n = text.length;

    function fail(msg, at) { throw new ParseError(msg, at === undefined ? i : at); }
    function ws() {
      while (i < n) {
        var c = text.charCodeAt(i);
        if (c === 32 || c === 10 || c === 13 || c === 9) i++;
        else break;
      }
    }
    function describe(c) {
      if (c === undefined) return "end of input";
      if (c === "'") return "single quote (JSON strings need double quotes)";
      return "character '" + c + "'";
    }
    function string() {
      var start = i++;
      for (;;) {
        if (i >= n) fail("Unterminated string", start);
        var c = text[i];
        if (c === '"') { i++; break; }
        if (c === "\\") {
          var e = text[i + 1];
          if (e && '"\\/bfnrt'.indexOf(e) >= 0) i += 2;
          else if (e === "u") {
            if (!/^[0-9a-fA-F]{4}$/.test(text.substr(i + 2, 4))) fail("Invalid \\u escape (needs 4 hex digits)");
            i += 6;
          } else fail("Invalid escape sequence \\" + (e || ""));
        } else if (c < " ") {
          fail("Unescaped control character in string (use \\n or \\t)");
        } else i++;
      }
      return { t: "s", raw: text.slice(start, i) };
    }
    var NUM = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
    function number() {
      NUM.lastIndex = i;
      var m = NUM.exec(text);
      if (!m) fail("Invalid number");
      if (m[0] === "0" || m[0] === "-0") {
        var next = text[i + m[0].length];
        if (next >= "0" && next <= "9") fail("Numbers can't have leading zeros");
      }
      var end = i + m[0].length;
      var after = text[end];
      if (after === "." || after === "e" || after === "E") fail("Invalid number", end);
      i = end;
      return { t: "n", raw: m[0] };
    }
    function literal(word) {
      if (text.substr(i, word.length) !== word) fail("Unexpected " + describe(text[i]));
      i += word.length;
      return { t: "l", raw: word };
    }
    function value() {
      ws();
      var c = text[i];
      if (c === "{") return object();
      if (c === "[") return array();
      if (c === '"') return string();
      if (c === "-" || (c >= "0" && c <= "9")) return number();
      if (c === "t") return literal("true");
      if (c === "f") return literal("false");
      if (c === "n") return literal("null");
      fail(c === undefined ? "Unexpected end of input, expected a value" : "Unexpected " + describe(c) + ", expected a value");
    }
    function object() {
      i++;
      var members = [];
      ws();
      if (text[i] === "}") { i++; return { t: "o", m: members }; }
      for (;;) {
        ws();
        if (text[i] !== '"') {
          if (text[i] === "}" && members.length) fail("Trailing comma is not allowed");
          fail("Expected a property name in double quotes, found " + describe(text[i]));
        }
        var key = string();
        ws();
        if (text[i] !== ":") fail("Expected ':' after property name, found " + describe(text[i]));
        i++;
        members.push([key, value()]);
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "}") { i++; return { t: "o", m: members }; }
        fail("Expected ',' or '}', found " + describe(text[i]));
      }
    }
    function array() {
      i++;
      var items = [];
      ws();
      if (text[i] === "]") { i++; return { t: "a", m: items }; }
      for (;;) {
        ws();
        if (text[i] === "]" && items.length) fail("Trailing comma is not allowed");
        items.push(value());
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "]") { i++; return { t: "a", m: items }; }
        fail("Expected ',' or ']', found " + describe(text[i]));
      }
    }

    if (text.charCodeAt(0) === 0xfeff) i = 1;
    var root = value();
    ws();
    if (i < n) fail("Unexpected " + describe(text[i]) + " after the end of the JSON value");
    return root;
  }

  function keyOf(raw) {
    try { return JSON.parse(raw); } catch (e) { return raw; }
  }

  function serialize(node, indent, sortKeys) {
    var parts = [];
    var nl = indent ? "\n" : "";
    var colon = indent ? ": " : ":";
    function walk(v, pad) {
      if (v.t === "o" || v.t === "a") {
        var open = v.t === "o" ? "{" : "[", close = v.t === "o" ? "}" : "]";
        if (!v.m.length) { parts.push(open + close); return; }
        var list = v.m;
        if (v.t === "o" && sortKeys) {
          list = list.slice().sort(function (a, b) {
            var x = keyOf(a[0].raw), y = keyOf(b[0].raw);
            return x < y ? -1 : x > y ? 1 : 0;
          });
        }
        var inner = pad + indent;
        parts.push(open + nl);
        for (var k = 0; k < list.length; k++) {
          parts.push(inner);
          if (v.t === "o") { parts.push(list[k][0].raw, colon); walk(list[k][1], inner); }
          else walk(list[k], inner);
          if (k < list.length - 1) parts.push(",");
          parts.push(nl);
        }
        parts.push(pad + close);
      } else {
        parts.push(v.raw);
      }
    }
    walk(node, "");
    return parts.join("");
  }

  function lineCol(text, pos) {
    var line = 1, last = -1;
    for (var k = 0; k < pos && k < text.length; k++) if (text.charCodeAt(k) === 10) { line++; last = k; }
    return { line: line, col: pos - last };
  }

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(text) {
    if (text.length > 400000) return escapeHtml(text);
    return escapeHtml(text).replace(
      /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g,
      function (m, str, isKey, num, lit) {
        if (str) return '<span class="' + (isKey ? "tk" : "ts") + '">' + str + "</span>" + (isKey || "");
        if (num) return '<span class="tn">' + num + "</span>";
        return '<span class="tl">' + lit + "</span>";
      }
    );
  }

  function size(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(2) + " MB";
  }

  function indentValue() {
    var v = $("js-indent").value;
    return v === "tab" ? "\t" : " ".repeat(+v);
  }

  function setStatus(kind, text) {
    status.className = "alert " + kind;
    status.textContent = text;
    status.hidden = false;
  }

  function run(minify, jump) {
    var text = src.value;
    lastError = null;
    if (!text.trim()) {
      lastText = "";
      out.textContent = "";
      status.hidden = true;
      $("js-copy").disabled = $("js-download").disabled = true;
      return;
    }
    var tree;
    try {
      tree = parse(text);
    } catch (e) {
      if (!(e instanceof ParseError)) {
        setStatus("bad", e instanceof RangeError ? "This JSON is nested too deeply to format in the browser." : "Could not read this input.");
        return;
      }
      var lc = lineCol(text, e.pos);
      lastError = e.pos;
      var lineStart = text.lastIndexOf("\n", e.pos - 1) + 1;
      var lineEnd = text.indexOf("\n", e.pos);
      var line = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd);
      var offset = e.pos - lineStart;
      var from = Math.max(0, offset - 40);
      var snippet = (from ? "..." : "") + line.slice(from, offset + 40).replace(/\t/g, " ");
      var caret = " ".repeat(offset - from + (from ? 3 : 0)) + "^";
      setStatus("bad", "Invalid JSON at line " + lc.line + ", column " + lc.col + ": " + e.message + ".");
      out.innerHTML = '<span class="err">' + escapeHtml(snippet + "\n" + caret) + "</span>";
      lastText = "";
      $("js-copy").disabled = $("js-download").disabled = true;
      if (jump) {
        src.focus();
        src.setSelectionRange(e.pos, Math.min(e.pos + 1, text.length));
      }
      return;
    }
    try {
      lastText = serialize(tree, minify ? "" : indentValue(), $("js-sort").checked);
    } catch (e) {
      lastText = "";
      out.textContent = "";
      setStatus("bad", "This JSON is nested too deeply to format in the browser.");
      $("js-copy").disabled = $("js-download").disabled = true;
      return;
    }
    out.innerHTML = highlight(lastText);
    var bytes = new Blob([lastText]).size;
    setStatus("ok", "Valid JSON. " + (minify ? "Minified" : "Formatted") + " to " + size(bytes) +
      (minify ? "" : ", " + (lastText.split("\n").length) + " lines") + ".");
    $("js-copy").disabled = $("js-download").disabled = false;
  }

  $("js-format").addEventListener("click", function () { run(false, true); });
  $("js-minify").addEventListener("click", function () { run(true, true); });
  $("js-indent").addEventListener("change", function () { if (lastText) run(false, false); });
  $("js-sort").addEventListener("change", function () { if (src.value.trim()) run(false, false); });
  $("js-sample").addEventListener("click", function () { src.value = SAMPLE; run(false, false); });
  $("js-clear").addEventListener("click", function () { src.value = ""; run(false, false); src.focus(); });

  src.addEventListener("paste", function () { setTimeout(function () { run(false, false); }, 0); });
  src.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(false, true); }
  });

  $("js-copy").addEventListener("click", function () {
    var btn = this;
    var done = function () { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy"; }, 1400); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(lastText).then(done, fallback);
    } else fallback();
    function fallback() {
      var t = document.createElement("textarea");
      t.value = lastText;
      t.setAttribute("readonly", "");
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(t);
    }
  });

  $("js-download").addEventListener("click", function () {
    var url = URL.createObjectURL(new Blob([lastText], { type: "application/json" }));
    var a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
})();
