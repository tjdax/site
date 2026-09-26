(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var elSec = $("ts-sec");
  var elMs = $("ts-ms");
  var elIso = $("ts-iso");
  var elLocal = $("ts-local");
  var status = $("ts-status");
  var syncing = false;

  function show(text) {
    status.hidden = !text;
    status.className = "alert" + (text ? " bad" : "");
    status.textContent = text || "";
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function localValue(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function fill(date) {
    if (!date || isNaN(date.getTime())) {
      show("That is not a valid time.");
      return;
    }
    show("");
    syncing = true;
    elSec.value = String(Math.floor(date.getTime() / 1000));
    elMs.value = String(date.getTime());
    elIso.value = date.toISOString();
    elLocal.value = localValue(date);
    syncing = false;
  }

  function fromNumber(raw, seconds) {
    if (String(raw).trim() === "") return;
    var n = Number(raw);
    if (!isFinite(n)) {
      show("That is not a valid time.");
      return;
    }
    fill(new Date(seconds ? n * 1000 : n));
  }

  elSec.addEventListener("input", function () { if (!syncing) fromNumber(elSec.value, true); });
  elMs.addEventListener("input", function () { if (!syncing) fromNumber(elMs.value, false); });
  elIso.addEventListener("input", function () {
    if (syncing || !elIso.value.trim()) return;
    fill(new Date(elIso.value));
  });
  elLocal.addEventListener("input", function () {
    if (syncing || !elLocal.value) return;
    fill(new Date(elLocal.value));
  });
  $("ts-now").addEventListener("click", function () { fill(new Date()); });
  fill(new Date());
})();
