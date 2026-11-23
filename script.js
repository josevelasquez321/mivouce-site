// MiuVoice · interacciones de la página
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Menú móvil
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Borde del menú al hacer scroll
  var nav = document.getElementById("nav");
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Animación de entrada
  var items = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  if (reduce) return;

  // Subtítulo del modo Audio del PC (F7)
  var sub = document.getElementById("f7Sub");
  var frases = ["¡Hola a todos!", "Bienvenidos", "¡Empecemos!"];
  var i = 0;
  setInterval(function () {
    i = (i + 1) % frases.length;
    sub.style.opacity = 0;
    setTimeout(function () { sub.textContent = frases[i]; sub.style.opacity = 1; }, 350);
  }, 2800);

  // Burbujas del modo Conversación (F8)
  var a = document.querySelector(".bubble--a");
  var b = document.querySelector(".bubble--b");
  var dialogos = [
    ["EN", "Where are you from?", "ES", "¿De dónde eres?"],
    ["EN", "I'm from Toronto!", "ES", "¡Soy de Toronto!"],
    ["EN", "Nice to meet you!", "ES", "¡Encantado de conocerte!"]
  ];
  var j = 0;
  setInterval(function () {
    j = (j + 1) % dialogos.length;
    var d = dialogos[j];
    a.style.opacity = b.style.opacity = 0;
    setTimeout(function () {
      a.innerHTML = "<small>" + d[0] + "</small>" + d[1];
      b.innerHTML = "<small>" + d[2] + "</small>" + d[3];
      a.style.opacity = b.style.opacity = 1;
    }, 350);
  }, 3400);
})();
