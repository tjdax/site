(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var input = $("en-in");
  var output = $("en-out");
  var status = $("en-status");
  var copyBtn = $("en-copy");

  function show(kind, text) {
    status.hidden = !text;
    status.className = "alert" + (kind ? " " + kind : "");
    status.textContent = text || "";
  }

  function setOut(text) {
    output.textContent = text;
    copyBtn.disabled = !text;
  }

  function bytesToB64(bytes) {
    var bin = "";
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function b64ToBytes(text) {
    var clean = String(text).replace(/\s/g, "");
    var bin = atob(clean);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = [];
    for (var i = 0; i < 16; i++) h.push(("0" + b[i].toString(16)).slice(-2));
    return h.slice(0, 4).join("") + "-" + h.slice(4, 6).join("") + "-" + h.slice(6, 8).join("") + "-" + h.slice(8, 10).join("") + "-" + h.slice(10, 16).join("");
  }

  function run(kind) {
    var text = input.value;
    show("", "");
    try {
      if (kind === "b64e") {
        setOut(bytesToB64(new TextEncoder().encode(text)));
      } else if (kind === "b64d") {
        if (!text.trim()) { show("bad", "Paste Base64 to decode."); return; }
        setOut(new TextDecoder().decode(b64ToBytes(text)));
      } else if (kind === "urle") {
        setOut(encodeURIComponent(text));
      } else if (kind === "urld") {
        if (!text) { show("bad", "Paste an encoded URL to decode."); return; }
        setOut(decodeURIComponent(text));
      } else if (kind === "uuid") {
        setOut(uuid());
      }
    } catch (e) {
      setOut("");
      show("bad", kind.indexOf("b64") === 0 ? "That is not valid Base64." : "That text could not be decoded.");
    }
  }

  $("en-b64e").addEventListener("click", function () { run("b64e"); });
  $("en-b64d").addEventListener("click", function () { run("b64d"); });
  $("en-urle").addEventListener("click", function () { run("urle"); });
  $("en-urld").addEventListener("click", function () { run("urld"); });
  $("en-uuid").addEventListener("click", function () { run("uuid"); });
  $("en-sha").addEventListener("click", function () {
    show("", "");
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.value)).then(function (buf) {
      var bytes = new Uint8Array(buf);
      var hex = "";
      for (var i = 0; i < bytes.length; i++) hex += ("0" + bytes[i].toString(16)).slice(-2);
      setOut(hex);
    }, function () {
      setOut("");
      show("bad", "SHA-256 is not available in this browser.");
    });
  });

  copyBtn.addEventListener("click", function () {
    var text = output.textContent;
    if (!text) return;
    var done = function () { show("ok", "Copied."); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else {
      fallback(text);
      done();
    }
  });

  function fallback(text) {
    var area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  $("en-sample").addEventListener("click", function () {
    input.value = "Hello, TJDAX";
    run("b64e");
  });
})();
