(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var input = $("md-in");
  var view = $("md-view");
  var timer = 0;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(s) {
    var text = esc(s);
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    return text;
  }

  function render(src) {
    var lines = String(src).replace(/\r\n/g, "\n").split("\n");
    var html = "";
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (line.trim().slice(0, 3) === "```") {
        var buf = [];
        i++;
        while (i < lines.length && lines[i].trim().slice(0, 3) !== "```") {
          buf.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        html += "<pre><code>" + esc(buf.join("\n")) + "</code></pre>";
        continue;
      }
      if (!line.trim()) {
        i++;
        continue;
      }
      var heading = /^(#{1,4})\s+(.*)$/.exec(line);
      if (heading) {
        var level = heading[1].length;
        html += "<h" + level + ">" + inline(heading[2]) + "</h" + level + ">";
        i++;
        continue;
      }
      if (/^>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }
        html += "<blockquote><p>" + quote.map(inline).join("<br>") + "</p></blockquote>";
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        html += "<ul>";
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          html += "<li>" + inline(lines[i].replace(/^\s*[-*]\s+/, "")) + "</li>";
          i++;
        }
        html += "</ul>";
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        html += "<ol>";
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          html += "<li>" + inline(lines[i].replace(/^\s*\d+\.\s+/, "")) + "</li>";
          i++;
        }
        html += "</ol>";
        continue;
      }
      var para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|>\s?|\s*[-*]\s+|\s*\d+\.\s+|```)/.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      html += "<p>" + para.map(inline).join("<br>") + "</p>";
    }
    return html || "<p></p>";
  }

  function update() {
    view.innerHTML = render(input.value);
  }

  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(update, 60);
  });
  $("md-sample").addEventListener("click", function () {
    input.value = "# Hello\n\nA **bold** word and an *italic* one.\n\n- First\n- Second\n\n```\nalert(1)\n```\n\nSee [TJDAX](https://tjdax.github.io/site/).";
    update();
  });
  update();
})();
