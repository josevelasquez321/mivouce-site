(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var Sonido = (function () {
    var ctx = null;
    var activo = true;
    try { activo = localStorage.getItem("miu-sonido") !== "off"; } catch (e) {}

    function audio() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }

    function tono(freq, dur, opts) {
      if (!activo) return;
      var c = audio();
      if (!c) return;
      opts = opts || {};
      var t = c.currentTime + (opts.delay || 0);
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = opts.tipo || "sine";
      osc.frequency.setValueAtTime(freq, t);
      if (opts.hasta) osc.frequency.exponentialRampToValueAtTime(opts.hasta, t + dur);
      if (opts.vibrato) {
        var lfo = c.createOscillator();
        var lfoGain = c.createGain();
        lfo.frequency.value = opts.vibrato;
        lfoGain.gain.value = freq * 0.04;
        lfo.connect(lfoGain).connect(osc.frequency);
        lfo.start(t); lfo.stop(t + dur);
      }
      var vol = opts.vol || 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    return {
      get activo() { return activo; },
      set: function (v) {
        activo = v;
        try { localStorage.setItem("miu-sonido", v ? "on" : "off"); } catch (e) {}
      },
      tick: function () { tono(1400, 0.04, { tipo: "triangle", vol: 0.035 }); },
      pop: function () { tono(520, 0.12, { hasta: 880, tipo: "sine", vol: 0.14 }); },
      tecla: function (f) {
        tono(f, 0.22, { tipo: "triangle", vol: 0.13 });
        tono(f * 1.5, 0.28, { tipo: "sine", vol: 0.07, delay: 0.07 });
      },
      miau: function () {
        tono(620, 0.42, { hasta: 360, tipo: "sawtooth", vol: 0.05, vibrato: 7 });
        tono(1240, 0.38, { hasta: 720, tipo: "sine", vol: 0.04, vibrato: 7 });
      },
      fiesta: function () {
        [523, 659, 784, 1047].forEach(function (f, i) {
          tono(f, 0.2, { tipo: "triangle", vol: 0.1, delay: i * 0.08 });
        });
      },
      encendido: function () {
        tono(660, 0.12, { tipo: "sine", vol: 0.1 });
        tono(990, 0.16, { tipo: "sine", vol: 0.1, delay: 0.09 });
      },
      subida: function () { tono(400, 0.3, { hasta: 1200, tipo: "sine", vol: 0.08 }); }
    };
  })();

  var botonSonido = document.getElementById("soundToggle");
  function pintarSonido() {
    botonSonido.setAttribute("aria-pressed", Sonido.activo);
    botonSonido.setAttribute("aria-label", Sonido.activo ? "Silenciar sonidos" : "Activar sonidos");
  }
  pintarSonido();
  botonSonido.addEventListener("click", function () {
    Sonido.set(!Sonido.activo);
    pintarSonido();
    Sonido.encendido();
  });

  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    Sonido.pop();
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll(".btn, .nav__links a, .chip, .feature-list li, .tech__card, .brand").forEach(function (el) {
    el.addEventListener("mouseenter", Sonido.tick);
  });
  document.querySelectorAll(".btn, .nav__links a, .brand").forEach(function (el) {
    el.addEventListener("click", Sonido.pop);
  });

  var notas = { "key--celeste": 784, "key--violeta": 659, "key--naranja": 523 };
  document.querySelectorAll(".key").forEach(function (el) {
    var f = 659;
    Object.keys(notas).forEach(function (k) { if (el.classList.contains(k)) f = notas[k]; });
    el.addEventListener("mouseenter", Sonido.tick);
    el.addEventListener("click", function () {
      Sonido.tecla(f);
      el.classList.add("is-pressed");
      setTimeout(function () { el.classList.remove("is-pressed"); }, 160);
    });
  });

  document.querySelectorAll(".mode__tag kbd").forEach(function (k) {
    var f = { F6: 784, F7: 659, F8: 523 }[k.textContent.trim()];
    if (!f) return;
    k.style.cursor = "pointer";
    k.addEventListener("click", function () { Sonido.tecla(f); });
  });

  function confeti(x, y) {
    if (reduce) return;
    var colores = ["#FFC317", "#7C6CF6", "#56CCF2", "#F2994A", "#33D6A6"];
    for (var i = 0; i < 28; i++) {
      var p = document.createElement("span");
      p.className = "confetti";
      p.style.background = colores[i % colores.length];
      p.style.left = x + "px";
      p.style.top = y + "px";
      document.body.appendChild(p);
      var ang = Math.random() * Math.PI * 2;
      var dist = 60 + Math.random() * 120;
      var anim = p.animate([
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: "translate(" + Math.cos(ang) * dist + "px," + (Math.sin(ang) * dist + 120) + "px) rotate(" + (Math.random() * 720) + "deg)", opacity: 0 }
      ], { duration: 900 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.4,1)" });
      anim.onfinish = (function (n) { return function () { n.remove(); }; })(p);
    }
  }

  document.querySelectorAll(".poses li").forEach(function (li) {
    li.addEventListener("mouseenter", Sonido.tick);
    li.addEventListener("click", function (e) {
      li.classList.remove("is-boing");
      void li.offsetWidth;
      li.classList.add("is-boing");
      if (li.hasAttribute("data-confetti")) {
        Sonido.fiesta();
        confeti(e.clientX, e.clientY);
      } else {
        Sonido.miau();
      }
    });
  });

  var pets = document.querySelector(".pets__fig");
  if (pets) pets.addEventListener("click", Sonido.miau);

  var nav = document.getElementById("nav");
  var arriba = document.querySelector(".totop");
  var onScroll = function () {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
    arriba.classList.toggle("is-shown", window.scrollY > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  arriba.addEventListener("click", Sonido.subida);

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

  var glow = document.querySelector(".glow");
  if (window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", function (e) {
      glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
      glow.classList.add("is-on");
    }, { passive: true });
  }

  var saludo = document.getElementById("helloWord");
  var saludos = ["Hola", "Hello", "Bonjour", "Olá"];
  var s = 0;
  setInterval(function () {
    s = (s + 1) % saludos.length;
    saludo.classList.add("is-out");
    setTimeout(function () { saludo.textContent = saludos[s]; saludo.classList.remove("is-out"); }, 300);
  }, 2200);

  var sub = document.getElementById("f7Sub");
  var frases = ["¡Hola a todos!", "Bienvenidos", "¡Empecemos!"];
  var i = 0;
  setInterval(function () {
    i = (i + 1) % frases.length;
    sub.style.opacity = 0;
    setTimeout(function () { sub.textContent = frases[i]; sub.style.opacity = 1; }, 350);
  }, 2800);

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
