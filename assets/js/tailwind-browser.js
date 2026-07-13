(function() {
  var themeStyle = document.createElement("style");
  themeStyle.type = "text/tailwindcss";
  themeStyle.textContent = window.tailwindTheme || "";
  document.head.appendChild(themeStyle);

  var script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";
  document.head.appendChild(script);
})();
