/* Mundo de UDA: fundo das telas. Desde 06/11/2026 (pedido dele) sem fagulhas e sem o d20: só um sombreado parado.
   O d20 do Início virou o mundo em 3D (js/globo.js). SMBrasa.cena("brasas") = sombreado; SMBrasa.cena(null) = sem fundo. */
const SMBrasa = (() => {
  let el = null;
  function cena(nome) {
    if (!el) { el = document.createElement("div"); el.className = "sm-fundo"; el.setAttribute("aria-hidden", "true"); document.body.prepend(el) }
    el.hidden = !nome; document.body.dataset.cena = nome || "";
    el.style.background = "radial-gradient(ellipse 95% 55% at 50% 108%,rgba(255,130,50,.14),rgba(255,80,20,.045) 45%,rgba(0,0,0,0) 75%),"
      + "radial-gradient(ellipse 80% 45% at 50% -8%,rgba(70,130,255,.07),rgba(0,0,0,0) 70%)";
  }
  return { cena };
})();
