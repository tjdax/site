(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var fileInput = $("md-file");
  var rows = $("md-rows");
  var summary = $("md-summary");
  var status = $("md-status");
  var download = $("md-download");
  var preview = $("md-preview");
  var current = null;
  var previewUrl = "";

  var DROP = { 0xE1: 1, 0xED: 1, 0xFE: 1 };
  var PNG_DROP = { tEXt: 1, zTXt: 1, iTXt: 1, eXIf: 1, tIME: 1 };
  var ORIENT = {
    1: "Horizontal",
    3: "Rotated 180°",
    6: "Rotated 90° clockwise",
    8: "Rotated 90° counter-clockwise"
  };

  function show(kind, text) {
    status.hidden = !text;
    status.className = "alert" + (kind ? " " + kind : "");
    status.textContent = text || "";
  }

  function u16(bytes, offset, le) {
    return le ? bytes[offset] | (bytes[offset + 1] << 8) : (bytes[offset] << 8) | bytes[offset + 1];
  }

  function u32(bytes, offset, le) {
    if (le) return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
    return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
  }

  function ascii(bytes, offset, count) {
    var chars = [];
    var end = Math.min(bytes.length, offset + count);
    for (var i = offset; i < end; i++) {
      if (bytes[i] === 0) break;
      chars.push(String.fromCharCode(bytes[i]));
    }
    return chars.join("");
  }

  function rational(bytes, offset, le) {
    var den = u32(bytes, offset + 4, le);
    if (!den) return 0;
    return u32(bytes, offset, le) / den;
  }

  function readIfd(tiff, offset, le, into) {
    if (offset + 2 > tiff.length) return;
    var count = u16(tiff, offset, le);
    var pos = offset + 2;
    var gpsAt = 0;
    var exifAt = 0;
    for (var i = 0; i < count; i++) {
      var entry = pos + i * 12;
      if (entry + 12 > tiff.length) break;
      var tag = u16(tiff, entry, le);
      var type = u16(tiff, entry + 2, le);
      var n = u32(tiff, entry + 4, le);
      var unit = type === 3 ? 2 : type === 4 || type === 9 ? 4 : type === 5 || type === 10 ? 8 : 1;
      var size = unit * n;
      var at = size <= 4 ? entry + 8 : u32(tiff, entry + 8, le);
      if (tag === 0x8769) exifAt = u32(tiff, entry + 8, le);
      else if (tag === 0x8825) gpsAt = u32(tiff, entry + 8, le);
      else pushTag(into, tiff, le, tag, type, n, at);
    }
    if (exifAt) readIfd(tiff, exifAt, le, into);
    if (gpsAt) readGps(tiff, gpsAt, le, into);
  }

  function pushTag(into, tiff, le, tag, type, n, at) {
    var labels = {
      0x010F: "Camera make",
      0x0110: "Camera model",
      0x0131: "Software",
      0x0132: "Date",
      0x9003: "Date taken",
      0x0112: "Orientation",
      0x829A: "Exposure",
      0x829D: "Aperture",
      0x8827: "ISO"
    };
    if (!labels[tag] || at >= tiff.length) return;
    var value = "";
    if (tag === 0x0112) value = ORIENT[u16(tiff, at, le)] || String(u16(tiff, at, le));
    else if (tag === 0x829A) {
      var sec = rational(tiff, at, le);
      value = sec > 0 && sec < 1 ? "1/" + Math.round(1 / sec) + " s" : sec + " s";
    } else if (tag === 0x829D) value = "f/" + rational(tiff, at, le).toFixed(1);
    else if (tag === 0x8827) value = String(type === 3 ? u16(tiff, at, le) : u32(tiff, at, le));
    else value = ascii(tiff, at, n);
    if (value) into.push([labels[tag], value]);
  }

  function readGps(tiff, offset, le, into) {
    if (offset + 2 > tiff.length) return;
    var count = u16(tiff, offset, le);
    var lat = null;
    var lon = null;
    var latRef = "";
    var lonRef = "";
    var pos = offset + 2;
    for (var i = 0; i < count; i++) {
      var entry = pos + i * 12;
      if (entry + 12 > tiff.length) break;
      var tag = u16(tiff, entry, le);
      var n = u32(tiff, entry + 4, le);
      var at = n * (tag === 2 || tag === 4 ? 8 : 1) <= 4 && tag !== 2 && tag !== 4 ? entry + 8 : u32(tiff, entry + 8, le);
      if (tag === 1 || tag === 3) {
        var ref = ascii(tiff, entry + 8, 2);
        if (tag === 1) latRef = ref;
        else lonRef = ref;
      } else if ((tag === 2 || tag === 4) && at + 24 <= tiff.length) {
        var d = rational(tiff, at, le);
        var m = rational(tiff, at + 8, le);
        var s = rational(tiff, at + 16, le);
        var dec = d + m / 60 + s / 3600;
        if (tag === 2) lat = dec;
        else lon = dec;
      }
    }
    if (lat == null || lon == null) return;
    if (latRef === "S") lat = -lat;
    if (lonRef === "W") lon = -lon;
    into.push(["Location", lat.toFixed(5) + ", " + lon.toFixed(5)]);
  }

  function parseExif(payload) {
    if (payload.length < 8) return [];
    var head = ascii(payload, 0, 4);
    if (head !== "Exif") return [];
    var tiff = payload.subarray(6);
    var le = tiff[0] === 0x49;
    if (u16(tiff, 2, le) !== 42) return [];
    var found = [];
    readIfd(tiff, u32(tiff, 4, le), le, found);
    return found;
  }

  function walkJpeg(bytes) {
    if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) throw new Error("not jpeg");
    var segs = [];
    var i = 2;
    while (i < bytes.length - 1) {
      if (bytes[i] !== 0xFF) throw new Error("bad marker");
      while (bytes[i] === 0xFF) i++;
      var marker = bytes[i++];
      if (marker === 0xD9) {
        segs.push({ marker: marker, start: i - 2, end: i });
        break;
      }
      if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
        segs.push({ marker: marker, start: i - 2, end: i });
        continue;
      }
      if (i + 1 >= bytes.length) throw new Error("short");
      var len = (bytes[i] << 8) | bytes[i + 1];
      if (marker === 0xDA) {
        var start = i - 2;
        var k = i + len;
        while (k < bytes.length - 1) {
          if (bytes[k] === 0xFF) {
            var next = bytes[k + 1];
            if (next === 0x00) { k += 2; continue; }
            if (next === 0xFF) { k++; continue; }
            if (next >= 0xD0 && next <= 0xD7) { k += 2; continue; }
            segs.push({ marker: 0xDA, start: start, end: k });
            i = k;
            break;
          }
          k++;
        }
        if (k >= bytes.length - 1) throw new Error("no eoi");
        continue;
      }
      segs.push({ marker: marker, start: i - 2, end: i + len });
      i += len;
    }
    return segs;
  }

  function concat(parts) {
    var total = 0;
    for (var i = 0; i < parts.length; i++) total += parts[i].length;
    var out = new Uint8Array(total);
    var pos = 0;
    for (var j = 0; j < parts.length; j++) {
      out.set(parts[j], pos);
      pos += parts[j].length;
    }
    return out;
  }

  function inspectJpeg(bytes) {
    var segs = walkJpeg(bytes);
    var found = [];
    var removed = 0;
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      if (!DROP[seg.marker]) continue;
      removed += seg.end - seg.start;
      var payload = bytes.subarray(seg.start + 4, seg.end);
      if (seg.marker === 0xE1) {
        var name = ascii(payload, 0, 5);
        if (name === "Exif") found = found.concat(parseExif(payload));
        else if (ascii(payload, 0, 4) === "http") found.push(["XMP", "Present"]);
        else found.push(["APP1 metadata", "Present"]);
      } else if (seg.marker === 0xED) found.push(["IPTC", "Present"]);
      else if (seg.marker === 0xFE) {
        var comment = ascii(payload, 0, payload.length);
        if (comment) found.push(["Comment", comment]);
      }
    }
    var parts = [bytes.subarray(0, 2)];
    for (var j = 0; j < segs.length; j++) {
      if (!DROP[segs[j].marker]) parts.push(bytes.subarray(segs[j].start, segs[j].end));
    }
    return { found: found, bytes: concat(parts), mime: "image/jpeg", ext: "jpg", removed: removed };
  }

  function u32be(bytes, offset) {
    return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
  }

  function inspectPng(bytes) {
    var sig = [137, 80, 78, 71, 13, 10, 26, 10];
    for (var s = 0; s < 8; s++) if (bytes[s] !== sig[s]) throw new Error("not png");
    var found = [];
    var parts = [bytes.subarray(0, 8)];
    var removed = 0;
    var i = 8;
    while (i + 12 <= bytes.length) {
      var len = u32be(bytes, i);
      var type = ascii(bytes, i + 4, 4);
      var end = i + 12 + len;
      if (end > bytes.length) throw new Error("short png");
      if (PNG_DROP[type]) {
        removed += end - i;
        if (type === "tEXt") {
          var data = bytes.subarray(i + 8, i + 8 + len);
          var nul = 0;
          while (nul < data.length && data[nul] !== 0) nul++;
          found.push([ascii(data, 0, nul) || "Text", ascii(data, nul + 1, data.length)]);
        } else if (type === "eXIf") found.push(["EXIF", "Present"]);
        else if (type === "tIME") found.push(["Modified time", "Present"]);
        else found.push([type, "Present"]);
      } else {
        parts.push(bytes.subarray(i, end));
      }
      i = end;
      if (type === "IEND") break;
    }
    return { found: found, bytes: concat(parts), mime: "image/png", ext: "png", removed: removed };
  }

  function render(result, file) {
    current = result;
    download.disabled = false;
    var html = "";
    var list = result.found.length ? result.found : [["Metadata", "None found"]];
    for (var i = 0; i < list.length; i++) {
      html += "<div><b>" + escapeHtml(list[i][0]) + "</b><span>" + escapeHtml(list[i][1]) + "</span></div>";
    }
    rows.innerHTML = html;
    summary.textContent = file.name + " · " + formatBytes(file.size) + (result.removed ? " · " + formatBytes(result.removed) + " of metadata can be removed" : " · nothing to remove");
  }

  function escapeHtml(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
    return (n / 1048576).toFixed(2) + " MB";
  }

  function stem(name) {
    return String(name || "image").replace(/\.[^.]+$/, "") || "image";
  }

  function load(file) {
    if (!file || !file.type || file.type.indexOf("image/") !== 0) {
      show("bad", "Choose an image file.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    preview.hidden = false;
    preview.src = previewUrl;
    file.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf);
      var result;
      try {
        if (bytes[0] === 0xFF && bytes[1] === 0xD8) result = inspectJpeg(bytes);
        else if (bytes[0] === 137 && bytes[1] === 80) result = inspectPng(bytes);
        else {
          current = null;
          download.disabled = true;
          rows.innerHTML = "";
          summary.textContent = file.name;
          show("warn", "JPEG and PNG can be cleaned without recompressing. This file is a different format.");
          return;
        }
      } catch (e) {
        show("bad", "This image could not be read.");
        return;
      }
      result.name = stem(file.name);
      render(result, file);
      show(result.found.length ? "" : "ok", result.found.length ? "" : "No camera, location, or comment data was found.");
    }, function () {
      show("bad", "This image could not be read.");
    });
  }

  download.addEventListener("click", function () {
    if (!current) return;
    var blob = new Blob([current.bytes], { type: current.mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = current.name + "-clean." + current.ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    show("ok", "Downloaded " + a.download + ".");
  });

  $("md-open").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (file) load(file);
  });

  var dragDepth = 0;
  var app = $("md-app");
  app.addEventListener("dragenter", function (e) { e.preventDefault(); dragDepth++; });
  app.addEventListener("dragover", function (e) { e.preventDefault(); });
  app.addEventListener("dragleave", function () { dragDepth--; });
  app.addEventListener("drop", function (e) {
    e.preventDefault();
    dragDepth = 0;
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) load(file);
  });
})();
