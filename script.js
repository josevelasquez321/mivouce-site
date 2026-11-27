(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var I18N = window.MIU_I18N;

  var idioma = (function () {
    var guardado = null;
    try { guardado = localStorage.getItem("miu-idioma"); } catch (e) {}
    if (guardado && I18N.langs.indexOf(guardado) !== -1) return guardado;
    var nav = (navigator.languages || [navigator.language || "es"]);
    for (var n = 0; n < nav.length; n++) {
      var c = String(nav[n]).slice(0, 2).toLowerCase();
      if (I18N.langs.indexOf(c) !== -1) return c;
    }
    return "es";
  })();

  function t(k) {
    var e = I18N.t[k];
    if (!e) return "";
    return e[idioma] || e.es;
  }

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
    var etiqueta = t(Sonido.activo ? "sound.mute" : "sound.unmute");
    botonSonido.setAttribute("aria-label", etiqueta);
    botonSonido.setAttribute("title", etiqueta);
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
    toggle.setAttribute("aria-label", t(open ? "menu.close" : "menu.open"));
    Sonido.pop();
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  var langBtn = document.getElementById("langBtn");
  var langMenu = document.getElementById("langMenu");
  var langCode = document.getElementById("langCode");
  var opciones = langMenu.querySelectorAll("[data-lang]");

  function abrirIdiomas(abrir) {
    langMenu.hidden = !abrir;
    langBtn.setAttribute("aria-expanded", abrir);
    if (abrir) {
      var actual = langMenu.querySelector('[aria-checked="true"]') || opciones[0];
      actual.focus();
    }
  }

  function aplicarIdioma() {
    document.documentElement.lang = idioma;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n"));
    });
    ["alt", "aria-label"].forEach(function (attr) {
      document.querySelectorAll("[data-i18n-" + attr + "]").forEach(function (el) {
        el.setAttribute(attr, t(el.getAttribute("data-i18n-" + attr)));
      });
    });
    document.title = "MiuVoice · " + t("hero.eyebrow");
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("hero.lead"));
    langCode.textContent = idioma.toUpperCase();
    langBtn.setAttribute("aria-label", t("lang.label") + ": " + I18N.names[idioma]);
    opciones.forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute("data-lang") === idioma);
    });
    toggle.setAttribute("aria-label", t(links.classList.contains("is-open") ? "menu.close" : "menu.open"));
    pintarDescripcion();
    pintarSonido();
    mostrarFrases();
  }

  langBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    abrirIdiomas(langMenu.hidden);
    Sonido.pop();
  });
  opciones.forEach(function (b, idx) {
    b.addEventListener("mouseenter", Sonido.tick);
    b.addEventListener("click", function () {
      idioma = b.getAttribute("data-lang");
      try { localStorage.setItem("miu-idioma", idioma); } catch (e) {}
      aplicarIdioma();
      abrirIdiomas(false);
      langBtn.focus();
      Sonido.encendido();
    });
    b.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); opciones[(idx + 1) % opciones.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); opciones[(idx - 1 + opciones.length) % opciones.length].focus(); }
    });
  });
  document.addEventListener("click", function (e) {
    if (!langMenu.hidden && !document.getElementById("lang").contains(e.target)) abrirIdiomas(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !langMenu.hidden) { abrirIdiomas(false); langBtn.focus(); }
  });

  var chips = document.querySelectorAll(".chips .chip");
  var chipDesc = document.getElementById("chipDesc");

  function pintarDescripcion() {
    var sel = document.querySelector('.chips .chip[aria-checked="true"]');
    var texto = t(sel.getAttribute("data-desc"));
    var n = sel.getAttribute("data-n");
    if (n) texto = texto.split("{n}").join(n);
    chipDesc.innerHTML = texto;
  }

  chips.forEach(function (chip, idx) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) {
        c.classList.toggle("chip--on", c === chip);
        c.setAttribute("aria-checked", c === chip);
        c.tabIndex = c === chip ? 0 : -1;
      });
      Sonido.tecla(440 + idx * 55);
      chipDesc.classList.add("is-swap");
      setTimeout(function () { pintarDescripcion(); chipDesc.classList.remove("is-swap"); }, 150);
    });
    chip.addEventListener("keydown", function (e) {
      var paso = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!paso) return;
      e.preventDefault();
      var sig = chips[(idx + paso + chips.length) % chips.length];
      sig.focus();
      sig.click();
    });
    chip.tabIndex = idx === 0 ? 0 : -1;
  });

  var sub = document.getElementById("f7Sub");
  var a = document.querySelector(".bubble--a");
  var b = document.querySelector(".bubble--b");
  var fi = 0;
  var di = 0;

  function mostrarFrases() {
    sub.textContent = I18N.f7[idioma][fi];
    var otro = idioma === "en" ? "es" : "en";
    a.innerHTML = "<small>" + otro.toUpperCase() + "</small>" + I18N.conv[otro][di];
    b.innerHTML = "<small>" + idioma.toUpperCase() + "</small>" + I18N.conv[idioma][di];
  }

  aplicarIdioma();

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
  var saludos = ["Hola", "Hello", "Bonjour", "Olá", "Hallo", "Ciao"];
  var s = 0;
  setInterval(function () {
    s = (s + 1) % saludos.length;
    saludo.classList.add("is-out");
    setTimeout(function () { saludo.textContent = saludos[s]; saludo.classList.remove("is-out"); }, 300);
  }, 2200);

  setInterval(function () {
    fi = (fi + 1) % I18N.f7[idioma].length;
    sub.style.opacity = 0;
    setTimeout(function () { sub.textContent = I18N.f7[idioma][fi]; sub.style.opacity = 1; }, 350);
  }, 2800);

  setInterval(function () {
    di = (di + 1) % I18N.conv[idioma].length;
    a.style.opacity = b.style.opacity = 0;
    setTimeout(function () { mostrarFrases(); a.style.opacity = b.style.opacity = 1; }, 350);
  }, 3400);
})();
