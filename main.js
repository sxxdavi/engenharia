/* ==========================================================================
   Chaant Engenharia — Script principal
   Depende de config.js (window.SITE) e, na página inicial, de imoveis.js.
   ========================================================================== */
(function () {
  "use strict";

  var SITE = window.SITE || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Utilidades ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function whatsappUrl(mensagem) {
    var url = "https://wa.me/" + (SITE.whatsapp || "");
    return mensagem ? url + "?text=" + encodeURIComponent(mensagem) : url;
  }

  function escapeHtml(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Links de contato vindos do config.js ---------- */
  function aplicarContatos() {
    $all("[data-wa]").forEach(function (el) {
      el.href = whatsappUrl(el.getAttribute("data-wa-msg") || "");
      el.target = "_blank";
      el.rel = "noopener";
    });
    $all("[data-instagram]").forEach(function (el) {
      if (SITE.instagram) { el.href = SITE.instagram; el.target = "_blank"; el.rel = "noopener"; }
    });
    $all("[data-tel-texto]").forEach(function (el) { el.textContent = SITE.whatsappExibicao || ""; });
    $all("[data-ig-texto]").forEach(function (el) { el.textContent = SITE.instagramUsuario || "Instagram"; });
    $all("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Menu mobile e cabeçalho ---------- */
  function iniciarMenu() {
    var botao = $(".nav-toggle");
    var menu = $("#menu");
    if (!botao || !menu) return;

    function alternar(abrir) {
      botao.setAttribute("aria-expanded", String(abrir));
      botao.querySelector(".sr").textContent = abrir ? "Fechar menu" : "Abrir menu";
      menu.classList.toggle("is-open", abrir);
    }

    botao.addEventListener("click", function () {
      alternar(botao.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) alternar(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { alternar(false); botao.focus(); }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function () { alternar(false); });
  }

  /* ---------- Comparador antes/depois ---------- */
  function iniciarComparador() {
    var caixa = $("[data-compare]");
    if (!caixa) return;
    var range = $("input[type=range]", caixa);
    var rafId = null;

    function definir(valor) { caixa.style.setProperty("--pos", valor + "%"); }
    function cancelar() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

    range.addEventListener("input", function () { cancelar(); definir(range.value); });
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
      caixa.addEventListener(ev, cancelar, { passive: true });
    });

    // Entrada: a imagem "antes" cobre tudo e recua até o meio, uma única vez.
    if (reduceMotion) { definir(range.value); return; }
    var inicio = 100, fim = Number(range.value), duracao = 1500, atraso = 700, t0 = null;
    definir(inicio);
    function passo(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / duracao, 1);
      var suave = 1 - Math.pow(1 - p, 3);
      definir(inicio + (fim - inicio) * suave);
      if (p < 1) rafId = requestAnimationFrame(passo); else rafId = null;
    }
    setTimeout(function () { rafId = requestAnimationFrame(passo); }, atraso);
  }

  /* ---------- Lightbox (ampliar imagens) ---------- */
  function iniciarLightbox() {
    if (!$("[data-zoom]") && !window.IMOVEIS) return;
    var dialog = document.createElement("dialog");
    dialog.className = "lightbox";
    dialog.setAttribute("aria-label", "Imagem ampliada");
    dialog.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Fechar imagem"><i class="icon i-close"></i></button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(dialog);

    var img = $("img", dialog);
    var legenda = $("figcaption", dialog);

    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target.closest(".lightbox-close")) dialog.close();
    });

    document.addEventListener("click", function (e) {
      var alvo = e.target.closest("[data-zoom]");
      if (!alvo) return;
      img.src = alvo.getAttribute("data-zoom");
      img.alt = alvo.getAttribute("data-alt") || "";
      legenda.textContent = alvo.getAttribute("data-caption") || "";
      if (typeof dialog.showModal === "function") dialog.showModal();
    });
  }

  /* ---------- Lista de imóveis com filtro (página inicial) ---------- */
  function iniciarImoveis() {
    var grade = $("#imoveis-grid");
    var lista = window.IMOVEIS;
    if (!grade || !lista) return;

    grade.innerHTML = lista.map(function (im) {
      var msg = "Olá! Vi o projeto \"" + im.titulo + "\" no site da Chaant Engenharia e gostaria de conversar.";
      return (
        '<article class="imovel" data-cat="' + escapeHtml(im.categoria) + '">' +
          '<button class="zoom" type="button" data-zoom="' + escapeHtml(im.img) + '" data-alt="' + escapeHtml(im.alt) +
            '" data-caption="' + escapeHtml(im.titulo) + '" aria-label="Ampliar imagem: ' + escapeHtml(im.titulo) + '">' +
            '<img src="' + escapeHtml(im.img) + '" alt="' + escapeHtml(im.alt) + '" loading="lazy" style="object-position:' + escapeHtml(im.posicao || "50% 50%") + '">' +
            '<span class="badge">' + escapeHtml(im.selo) + '</span>' +
          '</button>' +
          '<div class="imovel-body">' +
            '<h3>' + escapeHtml(im.titulo) + '</h3>' +
            '<p>' + escapeHtml(im.texto) + '</p>' +
            '<div class="imovel-foot">' +
              '<a class="btn btn-primary btn-sm" href="' + whatsappUrl(msg) + '" target="_blank" rel="noopener">Falar sobre este projeto</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    var status = $("#imoveis-status");
    var chips = $all("[data-filter]");
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var filtro = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
        var visiveis = 0;
        $all(".imovel", grade).forEach(function (card) {
          var mostrar = filtro === "todos" || card.getAttribute("data-cat") === filtro;
          card.hidden = !mostrar;
          if (mostrar) visiveis++;
        });
        if (status) status.textContent = visiveis + (visiveis === 1 ? " projeto encontrado" : " projetos encontrados");
      });
    });
  }

  /* ---------- Nossos clientes: fotos das obras e depoimentos ---------- */
  function iniciarClientes() {
    var grade = $("#clientes-grid");
    var lista = window.CLIENTES;
    if (!grade) return;

    if (!lista || !lista.length) {
      grade.innerHTML =
        '<div class="clientes-empty">' +
          '<h3>Em breve, as obras dos nossos clientes</h3>' +
          '<p>Estamos reunindo as fotos e os depoimentos de quem já construiu com a Chaant. Se a sua obra foi feita por nós, mande as fotos pelo WhatsApp e, com a sua autorização, publicamos aqui.</p>' +
          '<a class="btn btn-primary btn-sm" href="' + whatsappUrl("Olá! Minha obra foi feita pela Chaant Engenharia. Quero enviar fotos e um depoimento para o site.") + '" target="_blank" rel="noopener">' +
            '<i class="icon i-whatsapp" aria-hidden="true"></i>Enviar minhas fotos</a>' +
        '</div>';
      return;
    }

    grade.innerHTML = lista.map(function (cli) {
      var fotos = (cli.fotos || []).map(function (src) {
        return '<button class="zoom" type="button" data-zoom="' + escapeHtml(src) + '" data-alt="Obra de ' + escapeHtml(cli.obra || cli.nome) +
          '" data-caption="' + escapeHtml(cli.nome) + (cli.local ? " — " + escapeHtml(cli.local) : "") + '" aria-label="Ampliar foto da obra de ' + escapeHtml(cli.nome) + '">' +
          '<img src="' + escapeHtml(src) + '" alt="Obra de ' + escapeHtml(cli.obra || cli.nome) + '" loading="lazy"></button>';
      }).join("");
      var quote = cli.depoimento ? '<p class="cliente-quote">\u201C' + escapeHtml(cli.depoimento) + '\u201D</p>' : "";
      var local = cli.local ? '<p class="cliente-local"><i class="icon i-pin" aria-hidden="true"></i>' + escapeHtml(cli.local) + '</p>' : "";
      return (
        '<article class="cliente">' +
          '<div class="cliente-fotos">' + fotos + '</div>' +
          '<div class="cliente-body">' +
            '<h3>' + escapeHtml(cli.nome) + (cli.obra ? " — " + escapeHtml(cli.obra) : "") + '</h3>' +
            local + quote +
          '</div>' +
        '</article>'
      );
    }).join("");
  }

  /* ---------- Busca rápida (envia para o WhatsApp) ---------- */
  function iniciarBusca() {
    var form = $("#busca-form");
    if (!form) return;
    var botoes = $all("[data-modo]", form.parentNode);
    var modo = "Comprar uma casa";
    var inicial = $("[data-modo][aria-pressed=true]", form.parentNode);
    if (inicial) modo = inicial.getAttribute("data-modo");
    botoes.forEach(function (b) {
      b.addEventListener("click", function () {
        modo = b.getAttribute("data-modo");
        botoes.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var detalhe = form.elements.detalhe.value.trim();
      var msg = "Olá! Vim pelo site da Chaant Engenharia e tenho interesse em: " + modo + "." +
        (detalhe ? " " + detalhe : "");
      window.open(whatsappUrl(msg), "_blank", "noopener");
    });
  }

  /* ---------- Formulário de contato (envia para o WhatsApp) ---------- */
  function iniciarContato() {
    var form = $("#contato-form");
    if (!form) return;
    var status = $("#form-status");

    var tel = form.elements.telefone;
    tel.addEventListener("input", function () {
      var d = tel.value.replace(/\D/g, "").slice(0, 11);
      if (d.length > 6) tel.value = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
      else if (d.length > 2) tel.value = "(" + d.slice(0, 2) + ") " + d.slice(2);
      else tel.value = d;
    });

    function erro(campo, texto) {
      var alvo = $("#erro-" + campo.name);
      campo.setAttribute("aria-invalid", texto ? "true" : "false");
      if (alvo) alvo.textContent = texto || "";
      return !texto;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var ok = true;
      ok = erro(f.nome, f.nome.value.trim().length < 2 ? "Digite seu nome." : "") && ok;
      var digitos = f.telefone.value.replace(/\D/g, "");
      ok = erro(f.telefone, digitos.length < 10 ? "Digite um telefone com DDD." : "") && ok;
      ok = erro(f.mensagem, f.mensagem.value.trim().length < 5 ? "Conte em poucas palavras o que você precisa." : "") && ok;

      if (!ok) {
        status.textContent = "Corrija os campos destacados para continuar.";
        var primeiro = form.querySelector('[aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        return;
      }

      var msg =
        "Olá! Meu nome é " + f.nome.value.trim() + ".\n" +
        "Assunto: " + f.interesse.value + "\n" +
        "Telefone: " + f.telefone.value + "\n\n" +
        f.mensagem.value.trim();
      status.textContent = "Abrindo o WhatsApp com a sua mensagem…";
      window.open(whatsappUrl(msg), "_blank", "noopener");
    });
  }

  /* ---------- Perguntas frequentes: abre uma por vez ---------- */
  function iniciarFaq() {
    var itens = $all(".faq details");
    itens.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        itens.forEach(function (outro) { if (outro !== item) outro.open = false; });
      });
    });
  }

  /* ---------- Início ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    aplicarContatos();
    iniciarMenu();
    iniciarComparador();
    iniciarImoveis();
    iniciarClientes();
    iniciarLightbox();
    iniciarBusca();
    iniciarContato();
    iniciarFaq();
  });
})();
