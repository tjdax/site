(function () {
  var footer = document.querySelector("footer");
  if (!footer) return;

  var ROUND_TREE =
    '<svg viewBox="0 0 120 160" aria-hidden="true">' +
    '<path d="M52 150 L56 92 L64 92 L68 150 Z" fill="#9a5b2c" stroke="#1b1b1b" stroke-width="4" stroke-linejoin="round"/>' +
    '<g stroke="#1b1b1b" stroke-width="8" fill="#1b1b1b">' +
    '<circle cx="60" cy="42" r="30"/><circle cx="32" cy="66" r="26"/><circle cx="88" cy="66" r="26"/><circle cx="60" cy="80" r="26"/>' +
    '</g>' +
    '<g fill="#3fa34d">' +
    '<circle cx="60" cy="42" r="30"/><circle cx="32" cy="66" r="26"/><circle cx="88" cy="66" r="26"/><circle cx="60" cy="80" r="26"/>' +
    '</g>' +
    '<g fill="#6cc860"><circle cx="50" cy="32" r="11"/><circle cx="26" cy="58" r="8"/><circle cx="80" cy="56" r="8"/></g>' +
    '</svg>';

  var PINE_TREE =
    '<svg viewBox="0 0 120 160" aria-hidden="true">' +
    '<rect x="53" y="118" width="14" height="34" fill="#9a5b2c" stroke="#1b1b1b" stroke-width="4"/>' +
    '<g fill="#2f8a44" stroke="#1b1b1b" stroke-width="4" stroke-linejoin="round">' +
    '<path d="M60 70 L104 126 L16 126 Z"/><path d="M60 38 L96 92 L24 92 Z"/><path d="M60 8 L86 58 L34 58 Z"/>' +
    '</g>' +
    '<g fill="#5dbb46"><path d="M60 16 L70 38 L56 38 Z"/><path d="M60 48 L74 76 L54 76 Z"/></g>' +
    '</svg>';

  var SHEEP =
    '<svg viewBox="0 0 110 80" aria-hidden="true">' +
    '<g class="legs" fill="#2b2b2b" stroke="#1b1b1b" stroke-width="3">' +
    '<rect class="leg a" x="24" y="52" width="9" height="24" rx="4"/><rect class="leg b" x="38" y="52" width="9" height="24" rx="4"/>' +
    '<rect class="leg b" x="60" y="52" width="9" height="24" rx="4"/><rect class="leg a" x="74" y="52" width="9" height="24" rx="4"/>' +
    '</g>' +
    '<g stroke="#1b1b1b" stroke-width="7" fill="#1b1b1b">' +
    '<circle cx="30" cy="36" r="17"/><circle cx="48" cy="26" r="18"/><circle cx="68" cy="30" r="17"/>' +
    '<circle cx="40" cy="48" r="15"/><circle cx="62" cy="48" r="15"/><circle cx="18" cy="44" r="10"/>' +
    '</g>' +
    '<g fill="#ffffff">' +
    '<circle cx="30" cy="36" r="17"/><circle cx="48" cy="26" r="18"/><circle cx="68" cy="30" r="17"/>' +
    '<circle cx="40" cy="48" r="15"/><circle cx="62" cy="48" r="15"/><circle cx="18" cy="44" r="10"/>' +
    '</g>' +
    '<g stroke="#1b1b1b" stroke-width="3">' +
    '<ellipse cx="80" cy="22" rx="8" ry="4" transform="rotate(-25 80 22)" fill="#3a3a3a"/>' +
    '<ellipse cx="88" cy="36" rx="14" ry="17" fill="#3a3a3a"/>' +
    '<ellipse cx="102" cy="26" rx="8" ry="4" transform="rotate(25 102 26)" fill="#3a3a3a"/>' +
    '<circle cx="86" cy="30" r="7" fill="#ffffff"/><circle cx="97" cy="31" r="6" fill="#ffffff"/>' +
    '</g>' +
    '<circle class="pupil" cx="88" cy="31" r="2.6" fill="#1b1b1b"/><circle class="pupil" cx="98" cy="32" r="2.4" fill="#1b1b1b"/>' +
    '<circle cx="46" cy="18" r="5" fill="#ffffff" stroke="#1b1b1b" stroke-width="3"/>' +
    '<path d="M86 45 Q92 49 97 44" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>' +
    '</svg>';

  var meadow = document.createElement("div");
  meadow.className = "meadow";
  meadow.innerHTML =
    '<div class="tree t1">' + ROUND_TREE + "</div>" +
    '<div class="tree t2">' + PINE_TREE + "</div>" +
    '<div class="tree t3">' + ROUND_TREE + "</div>" +
    '<div class="tree t4">' + ROUND_TREE + "</div>" +
    '<button class="sheep" type="button" aria-label="Sheep. Click it and it runs away.">' +
    '<span class="baa" aria-hidden="true">Baa!</span>' +
    '<span class="sheep-body">' + SHEEP + "</span>" +
    "</button>";
  footer.insertBefore(meadow, footer.firstChild);
  footer.classList.add("has-meadow");

  var sheep = meadow.querySelector(".sheep");
  var body = sheep.querySelector(".sheep-body");
  var x = 0;
  var facing = 1;
  var timer = 0;

  function bounds() {
    var max = meadow.clientWidth - sheep.offsetWidth - 8;
    return { min: 8, max: Math.max(8, max) };
  }

  function place(nx) {
    x = nx;
    sheep.style.transform = "translateX(" + x + "px)";
  }

  function face(dir) {
    facing = dir;
    body.style.transform = "scaleX(" + dir + ")";
  }

  function flee() {
    var b = bounds();
    var span = b.max - b.min;
    var minJump = Math.min(span * 0.35, 260);
    var target = x;
    for (var i = 0; i < 12 && Math.abs(target - x) < minJump; i++) {
      target = b.min + Math.random() * span;
    }
    face(target >= x ? 1 : -1);
    var dur = Math.round(500 + Math.abs(target - x) * 1.1);
    sheep.style.transitionDuration = dur + "ms";
    sheep.classList.add("running");
    place(target);
    clearTimeout(timer);
    timer = setTimeout(function () {
      sheep.classList.remove("running");
    }, dur);
  }

  sheep.addEventListener("click", flee);

  var start = bounds();
  sheep.style.transitionDuration = "0ms";
  place(start.min + (start.max - start.min) * 0.45);
  face(-1);

  window.addEventListener("resize", function () {
    var b = bounds();
    if (x > b.max) place(b.max);
  });
})();
