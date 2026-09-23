(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("qr-canvas");
  var status = $("qr-status");
  var current = null;
  var queued = false;

  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

  function wifiEscape(s) { return s.replace(/([\\;,:"])/g, "\\$1"); }

  function payload() {
    var type = $("qr-type").value;
    if (type === "text") return $("qr-text").value;
    if (type === "url") {
      var u = $("qr-url").value.trim();
      if (!u) return "";
      return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : "https://" + u;
    }
    if (type === "wifi") {
      var ssid = $("qr-ssid").value;
      if (!ssid) return "";
      var sec = $("qr-sec").value;
      var s = "WIFI:T:" + sec + ";S:" + wifiEscape(ssid) + ";";
      if (sec !== "nopass") s += "P:" + wifiEscape($("qr-pass").value) + ";";
      if ($("qr-hidden").checked) s += "H:true;";
      return s + ";";
    }
    if (type === "email") {
      var to = $("qr-to").value.trim();
      if (!to) return "";
      var q = [];
      if ($("qr-subject").value) q.push("subject=" + encodeURIComponent($("qr-subject").value));
      if ($("qr-body").value) q.push("body=" + encodeURIComponent($("qr-body").value));
      return "mailto:" + to + (q.length ? "?" + q.join("&") : "");
    }
    if (type === "phone") {
      var p = $("qr-phone").value.replace(/[^\d+]/g, "");
      return p ? "tel:" + p : "";
    }
    return "";
  }

  function luminance(hex) {
    var c = [1, 3, 5].map(function (k) {
      var v = parseInt(hex.substr(k, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function setStatus(kind, text) {
    status.className = "alert " + kind;
    status.textContent = text;
    status.hidden = !text;
  }

  function setDownloads(on) {
    $("qr-png").disabled = $("qr-svg").disabled = !on;
    if ($("qr-copy")) $("qr-copy").disabled = !on;
  }

  function draw() {
    queued = false;
    var data = payload();
    var fg = $("qr-fg").value, bg = $("qr-bg").value;
    var margin = +$("qr-margin").value;
    var size = +$("qr-size").value;
    $("qr-size-out").textContent = size + " px";

    if (!data) {
      current = null;
      canvas.width = canvas.height = 0;
      $("qr-empty").hidden = false;
      $("qr-info").textContent = "";
      setStatus("", "");
      setDownloads(false);
      return;
    }

    var q;
    try {
      q = qrcode(0, $("qr-ec").value);
      q.addData(data, "Byte");
      q.make();
    } catch (e) {
      current = null;
      canvas.width = canvas.height = 0;
      $("qr-empty").hidden = false;
      $("qr-info").textContent = "";
      setStatus("bad", "That's too much data for one QR code. Shorten it, or choose a lower error correction level.");
      setDownloads(false);
      return;
    }

    var count = q.getModuleCount();
    var total = count + margin * 2;
    var cell = Math.max(1, Math.floor(size / total));
    var dim = cell * total;
    canvas.width = canvas.height = dim;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = fg;
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (q.isDark(r, c)) ctx.fillRect((c + margin) * cell, (r + margin) * cell, cell, cell);
      }
    }
    current = { q: q, count: count, margin: margin, fg: fg, bg: bg, dim: dim };
    $("qr-empty").hidden = true;
    canvas.setAttribute("aria-label", "QR code for: " + (data.length > 120 ? data.slice(0, 120) + "..." : data));
    $("qr-info").textContent = "Version " + ((count - 17) / 4) + " (" + count + "\u00d7" + count +
      " modules), PNG " + dim + "\u00d7" + dim + " px, " + new Blob([data]).size + " bytes of data.";

    var lf = luminance(fg), lb = luminance(bg);
    var ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
    if (lf > lb) setStatus("warn", "Light code on a dark background: many scanners can't read this. Use a darker code color.");
    else if (ratio < 3) setStatus("warn", "Low contrast between the code and background colors. Some phones may not scan it.");
    else if (margin < 2) setStatus("warn", "A quiet zone smaller than 2 modules can make the code hard to scan.");
    else setStatus("", "");
    setDownloads(true);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  }

  function svgText() {
    var k = current, total = k.count + k.margin * 2, d = [];
    for (var r = 0; r < k.count; r++) {
      for (var c = 0; c < k.count; c++) {
        if (k.q.isDark(r, c)) d.push("M" + (c + k.margin) + " " + (r + k.margin) + "h1v1h-1z");
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total +
      '" width="' + k.dim + '" height="' + k.dim + '" shape-rendering="crispEdges">' +
      '<rect width="100%" height="100%" fill="' + k.bg + '"/>' +
      '<path fill="' + k.fg + '" d="' + d.join("") + '"/></svg>';
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function showFields() {
    var type = $("qr-type").value;
    var groups = document.querySelectorAll("[data-type]");
    for (var i = 0; i < groups.length; i++) groups[i].hidden = groups[i].getAttribute("data-type") !== type;
    $("qr-pass-wrap").hidden = $("qr-sec").value === "nopass";
  }

  $("qr-type").addEventListener("change", function () { showFields(); schedule(); });
  $("qr-sec").addEventListener("change", function () { showFields(); schedule(); });
  document.querySelector(".qr-form").addEventListener("input", schedule);
  document.querySelector(".qr-form").addEventListener("change", schedule);

  $("qr-png").addEventListener("click", function () {
    if (current) canvas.toBlob(function (b) { download(b, "qr-code.png"); }, "image/png");
  });
  $("qr-svg").addEventListener("click", function () {
    if (current) download(new Blob([svgText()], { type: "image/svg+xml" }), "qr-code.svg");
  });

  var copyBtn = $("qr-copy");
  if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write && window.isSecureContext) {
    copyBtn.hidden = false;
    copyBtn.addEventListener("click", function () {
      if (!current) return;
      canvas.toBlob(function (b) {
        navigator.clipboard.write([new ClipboardItem({ "image/png": b })]).then(function () {
          copyBtn.textContent = "Copied!";
          setTimeout(function () { copyBtn.textContent = "Copy image"; }, 1400);
        }, function () {
          setStatus("warn", "Your browser blocked copying the image. Use Download PNG instead.");
        });
      }, "image/png");
    });
  }

  showFields();
  draw();
})();
