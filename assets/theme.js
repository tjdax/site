(function () {
  var KEY = "tjdax-theme";
  var root = document.documentElement;
  var current = "modern";
  try {
    if (localStorage.getItem(KEY) === "cartoon") current = "cartoon";
  } catch (e) {}

  function apply(theme) {
    current = theme;
    root.classList.toggle("theme-cartoon", theme === "cartoon");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "cartoon" ? "#fed90f" : "#f5f5f7");
  }

  apply(current);

  document.addEventListener("DOMContentLoaded", function () {
    var foot = document.querySelector("footer .foot");
    if (!foot) return;

    var box = document.createElement("div");
    box.className = "theme-switch";
    box.innerHTML =
      '<span class="theme-label" id="theme-label">Theme</span>' +
      '<span class="seg" role="group" aria-labelledby="theme-label">' +
      '<button type="button" data-theme="modern">Modern</button>' +
      '<button type="button" data-theme="cartoon">Cartoon</button>' +
      "</span>";
    var buttons = box.querySelectorAll("button");

    function sync() {
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-theme") === current));
      }
    }

    box.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-theme]");
      if (!btn) return;
      var theme = btn.getAttribute("data-theme");
      if (theme === current) return;
      apply(theme);
      try {
        localStorage.setItem(KEY, theme);
      } catch (err) {}
      sync();
      document.dispatchEvent(new CustomEvent("tjdax:theme", { detail: theme }));
    });

    sync();
    foot.appendChild(box);
  });
})();
