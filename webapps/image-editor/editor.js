(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var MAX = 16384;

  var stage = $("ie-stage");
  var empty = $("ie-empty");
  var frame = $("ie-frame");
  var view = $("ie-view");
  var cropEl = $("ie-crop");
  var cropLabel = $("ie-croplabel");
  var info = $("ie-info");
  var note = $("ie-note");
  var status = $("ie-status");
  var sizeEl = $("ie-size");
  var fileInput = $("ie-file");

  var elW = $("ie-w");
  var elH = $("ie-h");
  var elX = $("ie-x");
  var elY = $("ie-y");
  var elRatio = $("ie-ratio");
  var elOw = $("ie-ow");
  var elOh = $("ie-oh");
  var elOLock = $("ie-olock");
  var elFormat = $("ie-format");
  var elQ = $("ie-q");
  var elQVal = $("ie-qval");
  var elMatte = $("ie-matte");
  var matteField = $("ie-matte-field");

  var toggles = [
    $("ie-reset"), elW, elH, elX, elY, elRatio, $("ie-apply"),
    $("ie-ccw"), $("ie-cw"), $("ie-fliph"), $("ie-flipv"),
    elOw, elOh, elOLock, $("ie-match"), elFormat, elQ, elMatte, $("ie-download"),
    $("ie-fit"), $("ie-z1"), $("ie-z2")
  ];
  var zoomButtons = [$("ie-fit"), $("ie-z1"), $("ie-z2")];

  var state = { w: 0, h: 0, crop: { x: 0, y: 0, w: 0, h: 0 }, ratio: 1, name: "image", zoom: "fit" };
  var original = null;
  var outputCustom = false;
  var syncing = false;
  var estTimer = 0;
  var estToken = 0;
  var dragDepth = 0;

  if (view.toDataURL("image/webp").indexOf("data:image/webp") !== 0) {
    var webp = elFormat.querySelector('option[value="image/webp"]');
    if (webp) webp.remove();
  }

  function intOrNull(value) {
    if (String(value).trim() === "") return null;
    var n = Number(value);
    if (!isFinite(n)) return null;
    return Math.round(n);
  }

  function clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  function stemOf(name) {
    var base = String(name || "image").split(/[/\\]/).pop();
    var cut = base.replace(/\.[^.]+$/, "");
    return cut || "image";
  }

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1048576) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB";
    return (n / 1048576).toFixed(2) + " MB";
  }

  function mimeLabel(mime) {
    if (mime === "image/jpeg") return "JPEG";
    if (mime === "image/webp") return "WebP";
    return "PNG";
  }

  function showStatus(kind, text) {
    if (!text) {
      status.hidden = true;
      status.textContent = "";
      return;
    }
    status.hidden = false;
    status.className = "alert" + (kind ? " " + kind : "");
    status.textContent = text;
  }

  function setNote(text) {
    note.hidden = !text;
    note.textContent = text || "";
  }

  function enable(on) {
    for (var i = 0; i < toggles.length; i++) toggles[i].disabled = !on;
    syncFormat();
  }

  function syncFormat() {
    var png = elFormat.value === "image/png";
    var jpeg = elFormat.value === "image/jpeg";
    elQ.disabled = !state.w || png;
    elMatte.disabled = !state.w || !jpeg;
    matteField.hidden = !jpeg;
  }

  function setCrop(x, y, w, h) {
    w = clamp(Math.round(w) || 1, 1, state.w);
    h = clamp(Math.round(h) || 1, 1, state.h);
    x = clamp(Math.round(x) || 0, 0, state.w - w);
    y = clamp(Math.round(y) || 0, 0, state.h - h);
    state.crop = { x: x, y: y, w: w, h: h };
  }

  function syncCropInputs() {
    syncing = true;
    elW.value = state.crop.w;
    elH.value = state.crop.h;
    elX.value = state.crop.x;
    elY.value = state.crop.y;
    syncing = false;
  }

  function syncOutput() {
    syncing = true;
    elOw.value = state.crop.w;
    elOh.value = state.crop.h;
    syncing = false;
  }

  function updateInfo() {
    if (!state.w) {
      info.textContent = "No image yet. It stays on this device.";
      return;
    }
    var c = state.crop;
    info.textContent = state.name + " · image " + state.w + " × " + state.h + " px · selection " + c.w + " × " + c.h + " px";
  }

  function layout() {
    if (!state.w) return;
    var maxW = Math.max(1, stage.clientWidth);
    var maxH = Math.max(160, Math.round(Math.min(window.innerHeight * 0.62, 640)));
    var scale = state.zoom === "2" ? 2 : state.zoom === "1" ? 1 : Math.min(maxW / state.w, maxH / state.h);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    frame.style.width = Math.max(1, Math.round(state.w * scale)) + "px";
    frame.style.height = Math.max(1, Math.round(state.h * scale)) + "px";
  }

  function placeCrop() {
    if (!state.w) return;
    var c = state.crop;
    cropEl.style.left = (c.x / state.w * 100) + "%";
    cropEl.style.top = (c.y / state.h * 100) + "%";
    cropEl.style.width = (c.w / state.w * 100) + "%";
    cropEl.style.height = (c.h / state.h * 100) + "%";
    cropLabel.textContent = c.w + " × " + c.h;
    cropEl.setAttribute("aria-label", "Crop box, " + c.w + " by " + c.h + " pixels");
    cropLabel.hidden = cropEl.offsetWidth < 70 || cropEl.offsetHeight < 32;
  }

  function markZoom() {
    for (var i = 0; i < zoomButtons.length; i++) {
      zoomButtons[i].setAttribute("aria-pressed", String(zoomButtons[i].getAttribute("data-zoom") === state.zoom));
    }
  }

  function refreshSelection(estimate) {
    syncCropInputs();
    if (!outputCustom) syncOutput();
    placeCrop();
    updateInfo();
    if (estimate) scheduleEstimate();
  }

  function paint(source, crop) {
    var sameSize = source.width === state.w && source.height === state.h;
    view.width = source.width;
    view.height = source.height;
    var ctx = view.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0);
    state.w = view.width;
    state.h = view.height;
    if (!sameSize) outputCustom = false;
    if (crop) setCrop(crop.x, crop.y, crop.w, crop.h);
    else setCrop(0, 0, state.w, state.h);
    state.ratio = state.crop.h ? state.crop.w / state.crop.h : 1;
    syncCropInputs();
    if (!outputCustom) syncOutput();
    layout();
    placeCrop();
    updateInfo();
    syncFormat();
    markZoom();
    scheduleEstimate();
  }

  function readOutput() {
    var w = intOrNull(elOw.value);
    var h = intOrNull(elOh.value);
    if (w == null || h == null) return null;
    return { w: clamp(w, 1, MAX), h: clamp(h, 1, MAX) };
  }

  function renderOutput() {
    if (!state.w) return null;
    var size = readOutput();
    if (!size) return null;
    var c = state.crop;
    var canvas = document.createElement("canvas");
    canvas.width = size.w;
    canvas.height = size.h;
    var ctx = canvas.getContext("2d");
    if (elFormat.value === "image/jpeg") {
      ctx.fillStyle = elMatte.value || "#ffffff";
      ctx.fillRect(0, 0, size.w, size.h);
    }
    var same = size.w === c.w && size.h === c.h;
    ctx.imageSmoothingEnabled = !same;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(view, c.x, c.y, c.w, c.h, 0, 0, size.w, size.h);
    return canvas;
  }

  function scheduleEstimate() {
    clearTimeout(estTimer);
    if (!state.w) {
      sizeEl.textContent = "";
      return;
    }
    estTimer = setTimeout(runEstimate, 300);
  }

  function runEstimate() {
    var token = ++estToken;
    var mime = elFormat.value;
    var output;
    try {
      output = renderOutput();
    } catch (e) {
      return;
    }
    if (!output) return;
    sizeEl.textContent = "…";
    output.toBlob(function (blob) {
      if (token !== estToken || !blob) return;
      sizeEl.textContent = mimeLabel(mime) + " · " + output.width + " × " + output.height + " · " + formatBytes(blob.size);
    }, mime, Number(elQ.value) / 100);
  }

  function decode(file) {
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () {
        return createImageBitmap(file);
      });
    }
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }

  function canvasFromBitmap(bmp) {
    var w = bmp.naturalWidth || bmp.width;
    var h = bmp.naturalHeight || bmp.height;
    if (!w || !h) throw new Error("empty");
    var dw = w;
    var dh = h;
    var scaled = "";
    if (Math.max(w, h) > MAX) {
      var s = MAX / Math.max(w, h);
      dw = Math.max(1, Math.round(w * s));
      dh = Math.max(1, Math.round(h * s));
      scaled = "This image was scaled down to " + dw + " × " + dh + " px so the browser can edit it.";
    }
    var canvas = document.createElement("canvas");
    canvas.width = dw;
    canvas.height = dh;
    var ctx = canvas.getContext("2d");
    if (dw !== w || dh !== h) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    }
    ctx.drawImage(bmp, 0, 0, dw, dh);
    if (bmp.close) bmp.close();
    return { canvas: canvas, note: scaled };
  }

  function loadFile(file) {
    if (!file || !file.type || file.type.indexOf("image/") !== 0) {
      showStatus("bad", "Choose an image file.");
      return;
    }
    decode(file).then(function (bmp) {
      var made = canvasFromBitmap(bmp);
      original = made.canvas;
      state.name = stemOf(file.name);
      outputCustom = false;
      state.zoom = "fit";
      stage.classList.add("has-image");
      empty.hidden = true;
      frame.hidden = false;
      enable(true);
      paint(original, null);
      setNote("");
      showStatus(made.note ? "warn" : "", made.note);
    }, function () {
      showStatus("bad", "This image could not be opened.");
    });
  }

  function onSizeInput(which) {
    if (syncing || !state.w) return;
    var w = intOrNull(elW.value);
    var h = intOrNull(elH.value);
    if (w == null || h == null) return;
    if (elRatio.checked && state.ratio > 0) {
      if (which === "w") h = Math.max(1, Math.round(w / state.ratio));
      else w = Math.max(1, Math.round(h * state.ratio));
    }
    var cx = state.crop.x + state.crop.w / 2;
    var cy = state.crop.y + state.crop.h / 2;
    setCrop(Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
    setNote(state.crop.w !== w || state.crop.h !== h
      ? "The box stays inside the image, so it is " + state.crop.w + " × " + state.crop.h + " px."
      : "");
    refreshSelection(true);
  }

  function onPosInput() {
    if (syncing || !state.w) return;
    var x = intOrNull(elX.value);
    var y = intOrNull(elY.value);
    if (x == null || y == null) return;
    setCrop(x, y, state.crop.w, state.crop.h);
    setNote(state.crop.x !== x || state.crop.y !== y ? "The box stays inside the image." : "");
    refreshSelection(true);
  }

  function onOutput(which) {
    if (syncing || !state.w) return;
    outputCustom = true;
    var w = intOrNull(elOw.value);
    var h = intOrNull(elOh.value);
    if (which === "w" && w == null) return;
    if (which === "h" && h == null) return;
    if (elOLock.checked && state.crop.h) {
      var aspect = state.crop.w / state.crop.h;
      if (which === "w" && w != null) h = Math.max(1, Math.round(w / aspect));
      if (which === "h" && h != null) w = Math.max(1, Math.round(h * aspect));
    }
    if (w == null || h == null) return;
    syncing = true;
    elOw.value = clamp(w, 1, MAX);
    elOh.value = clamp(h, 1, MAX);
    syncing = false;
    scheduleEstimate();
  }

  function applyCrop() {
    var c = state.crop;
    if (c.x === 0 && c.y === 0 && c.w === state.w && c.h === state.h) {
      showStatus("", "");
      setNote("The selection is already the whole image.");
      return;
    }
    var next = document.createElement("canvas");
    next.width = c.w;
    next.height = c.h;
    var ctx = next.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(view, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
    paint(next, null);
    setNote("");
    showStatus("ok", "Cropped to " + next.width + " × " + next.height + " px.");
  }

  function transform(kind) {
    var w = state.w;
    var h = state.h;
    var c = state.crop;
    var next = document.createElement("canvas");
    var ctx;
    var mapped;
    if (kind === "cw" || kind === "ccw") {
      next.width = h;
      next.height = w;
      ctx = next.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      if (kind === "cw") ctx.setTransform(0, 1, -1, 0, h, 0);
      else ctx.setTransform(0, -1, 1, 0, 0, w);
      mapped = kind === "cw"
        ? { x: h - c.y - c.h, y: c.x, w: c.h, h: c.w }
        : { x: c.y, y: w - c.x - c.w, w: c.h, h: c.w };
    } else {
      next.width = w;
      next.height = h;
      ctx = next.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      if (kind === "fh") ctx.setTransform(-1, 0, 0, 1, w, 0);
      else ctx.setTransform(1, 0, 0, -1, 0, h);
      mapped = kind === "fh"
        ? { x: w - c.x - c.w, y: c.y, w: c.w, h: c.h }
        : { x: c.x, y: h - c.y - c.h, w: c.w, h: c.h };
    }
    ctx.drawImage(view, 0, 0);
    paint(next, mapped);
    setNote("");
  }

  function clientToImage(cx, cy) {
    var rect = frame.getBoundingClientRect();
    return {
      x: (cx - rect.left) / rect.width * state.w,
      y: (cy - rect.top) / rect.height * state.h
    };
  }

  function resizeFrom(start, dx, dy, handle, ratioOn) {
    var left = handle.indexOf("w") !== -1;
    var right = handle.indexOf("e") !== -1;
    var top = handle.indexOf("n") !== -1;
    var bottom = handle.indexOf("s") !== -1;
    var x = start.x;
    var y = start.y;
    var w = start.w;
    var h = start.h;
    if (right) w = start.w + dx;
    if (bottom) h = start.h + dy;
    if (left) w = start.w - dx;
    if (top) h = start.h - dy;
    if (ratioOn && state.ratio > 0) {
      if (left || right) h = Math.max(1, Math.round(w / state.ratio));
      else w = Math.max(1, Math.round(h * state.ratio));
    }
    if (left) x = start.x + start.w - w;
    if (top) y = start.y + start.h - h;
    if (ratioOn && !left && !right) x = start.x + Math.round((start.w - w) / 2);
    if (ratioOn && !top && !bottom) y = start.y + Math.round((start.h - h) / 2);
    setCrop(x, y, w, h);
  }

  cropEl.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || !state.w) return;
    e.preventDefault();
    var handle = e.target.getAttribute("data-h") || "";
    var origin = clientToImage(e.clientX, e.clientY);
    var start = { x: state.crop.x, y: state.crop.y, w: state.crop.w, h: state.crop.h };
    var ratioOn = elRatio.checked;
    function move(ev) {
      var p = clientToImage(ev.clientX, ev.clientY);
      if (!handle) setCrop(start.x + p.x - origin.x, start.y + p.y - origin.y, start.w, start.h);
      else resizeFrom(start, p.x - origin.x, p.y - origin.y, handle, ratioOn);
      syncCropInputs();
      if (handle && !outputCustom) syncOutput();
      placeCrop();
      updateInfo();
    }
    function end() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      scheduleEstimate();
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  });

  document.addEventListener("keydown", function (e) {
    if (!state.w) return;
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
    var step = e.shiftKey ? 10 : 1;
    var c = state.crop;
    var x = c.x;
    var y = c.y;
    if (e.key === "ArrowLeft") x -= step;
    else if (e.key === "ArrowRight") x += step;
    else if (e.key === "ArrowUp") y -= step;
    else if (e.key === "ArrowDown") y += step;
    else return;
    e.preventDefault();
    setCrop(x, y, c.w, c.h);
    setNote("");
    refreshSelection(true);
  });

  elW.addEventListener("input", function () { onSizeInput("w"); });
  elH.addEventListener("input", function () { onSizeInput("h"); });
  elX.addEventListener("input", onPosInput);
  elY.addEventListener("input", onPosInput);
  elRatio.addEventListener("change", function () {
    state.ratio = state.crop.h ? state.crop.w / state.crop.h : 1;
  });
  elOw.addEventListener("input", function () { onOutput("w"); });
  elOh.addEventListener("input", function () { onOutput("h"); });
  elFormat.addEventListener("change", function () { syncFormat(); scheduleEstimate(); });
  elQ.addEventListener("input", function () { elQVal.textContent = elQ.value; scheduleEstimate(); });
  elMatte.addEventListener("input", scheduleEstimate);

  $("ie-open").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var f = fileInput.files && fileInput.files[0];
    fileInput.value = "";
    if (f) loadFile(f);
  });
  $("ie-reset").addEventListener("click", function () {
    if (!original) return;
    outputCustom = false;
    state.zoom = "fit";
    paint(original, null);
    setNote("");
    showStatus("", "");
  });
  $("ie-apply").addEventListener("click", applyCrop);
  $("ie-cw").addEventListener("click", function () { transform("cw"); });
  $("ie-ccw").addEventListener("click", function () { transform("ccw"); });
  $("ie-fliph").addEventListener("click", function () { transform("fh"); });
  $("ie-flipv").addEventListener("click", function () { transform("fv"); });
  $("ie-match").addEventListener("click", function () {
    outputCustom = false;
    syncOutput();
    scheduleEstimate();
  });

  zoomButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state.zoom = button.getAttribute("data-zoom");
      markZoom();
      layout();
      placeCrop();
    });
  });

  $("ie-download").addEventListener("click", function () {
    var output;
    try {
      output = renderOutput();
    } catch (e) {
      showStatus("bad", "Could not create the file.");
      return;
    }
    if (!output) return;
    var mime = elFormat.value;
    var ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
    output.toBlob(function (blob) {
      if (!blob) {
        showStatus("bad", "Could not create the file.");
        return;
      }
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = state.name + "-edited." + ext;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      showStatus("ok", "Downloaded " + a.download + " (" + formatBytes(blob.size) + ").");
    }, mime, Number(elQ.value) / 100);
  });

  var app = $("ie-app");
  app.addEventListener("dragenter", function (e) {
    e.preventDefault();
    dragDepth++;
    stage.classList.add("over");
  });
  app.addEventListener("dragover", function (e) { e.preventDefault(); });
  app.addEventListener("dragleave", function () {
    dragDepth--;
    if (dragDepth <= 0) {
      dragDepth = 0;
      stage.classList.remove("over");
    }
  });
  app.addEventListener("drop", function (e) {
    e.preventDefault();
    dragDepth = 0;
    stage.classList.remove("over");
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });

  document.addEventListener("paste", function (e) {
    var items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image/") === 0) {
        var file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          loadFile(file);
        }
        return;
      }
    }
  });

  window.addEventListener("resize", function () {
    if (!state.w) return;
    layout();
    placeCrop();
  });
})();
