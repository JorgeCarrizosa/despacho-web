/* Tracking compartido — Google Ads (gtag) + Consent Mode v2 + banner de cookies.
   Lo usan las páginas interiores; index.html lleva su propia copia inline.
   Cargar con <script src="/assets/tracking.js"></script> en el <head> (síncrono,
   para que el consent default quede fijado antes de que cargue gtag.js). */

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied',
  'wait_for_update': 500
});
gtag('set', 'ads_data_redaction', true);
gtag('set', 'url_passthrough', true);

(function(){
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17531743025';
  document.head.appendChild(s);
})();
gtag('js', new Date());
gtag('config', 'AW-17531743025');

window.CYA_ADS = {
  id: 'AW-17531743025',
  labels: {
    formulario: '-y4FCJbXs6QcELHW5KdB',
    telefono:   'fgGVCOjVicocELHW5KdB',
    whatsapp:   'cpHyCOvVicocELHW5KdB'
  }
};
window.cyaConversion = function(tipo){
  var etiqueta = window.CYA_ADS.labels[tipo];
  if(!etiqueta) return;
  gtag('event','conversion',{'send_to': window.CYA_ADS.id + '/' + etiqueta});
};

window.cyaConsent = {
  leer: function(){
    try {
      var c = JSON.parse(localStorage.getItem('cya_consent') || 'null');
      if (c && (Date.now() - c.ts) < 365*24*60*60*1000) return c;
    } catch(e) {}
    return null;
  },
  guardar: function(acepta){
    try { localStorage.setItem('cya_consent', JSON.stringify({granted: acepta, ts: Date.now()})); } catch(e) {}
    if (acepta) {
      gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
    }
  }
};
(function(){
  var c = window.cyaConsent.leer();
  if (c && c.granted) window.cyaConsent.guardar(true);
})();

document.addEventListener('DOMContentLoaded', function(){
  // Estilos del banner autocontenidos: las guias interiores llevan su CSS inline
  // y no cargan estilo.css, asi que sin esto el banner sale sin estilo y el
  // Aceptar/Rechazar no lo oculta (quitar .visible no hace nada sin display:none).
  if (!document.getElementById('cya-cookie-css')) {
    var css = document.createElement('style');
    css.id = 'cya-cookie-css';
    css.textContent =
      '.cookie-banner{position:fixed;left:0;right:0;bottom:0;z-index:100;background:var(--ink,#1c1c24);color:#fff;padding:20px 32px;display:none;box-shadow:0 -6px 24px rgba(0,0,0,.18);font-family:"Montserrat",-apple-system,Helvetica,Arial,sans-serif}' +
      '.cookie-banner.visible{display:block}' +
      '.cookie-inner{max-width:1240px;margin:0 auto;display:flex;gap:28px;align-items:center;justify-content:space-between;flex-wrap:wrap}' +
      '.cookie-text{font-size:13px;line-height:1.6;color:rgba(255,255,255,.85);max-width:760px;min-width:260px;flex:1;margin:0}' +
      '.cookie-text a{color:#c9a35a;text-decoration:underline}' +
      '.cookie-actions{display:flex;gap:12px;flex-shrink:0}' +
      '.cookie-btn{padding:13px 24px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:opacity .2s;border:1px solid rgba(255,255,255,.6);font-family:inherit}' +
      '.cookie-btn:hover{opacity:.85}' +
      '.cookie-btn.aceptar{background:#c9a35a;border-color:#c9a35a;color:#040465}' +
      '.cookie-btn.rechazar{background:transparent;color:#fff}' +
      '@media(max-width:680px){.cookie-banner{padding:16px 22px}.cookie-inner{gap:14px}.cookie-actions{width:100%}.cookie-btn{flex:1;text-align:center;padding:14px 10px}}' +
      /* Con el banner abierto (z-index 100 > 90), el FAB de WhatsApp quedaba tapado
         justo en la primera visita — la del clic de Ads. Se eleva mientras dure. */
      'body.cookie-abierta .wa-fab{bottom:130px}' +
      '@media(max-width:680px){body.cookie-abierta .wa-fab{bottom:205px}}';
    document.head.appendChild(css);
  }
  // Banner de cookies (mismo markup y clases que index.html)
  var banner = document.getElementById('cookie-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML =
      '<div class="cookie-inner">' +
      '<p class="cookie-text">Utilizamos cookies de Google Ads únicamente para medir la eficacia de nuestra publicidad. ' +
      'No se activan si usted no lo acepta, y puede cambiar su elección en cualquier momento desde el enlace «Cookies» del pie de página. ' +
      '<a href="https://www.carrizosayalmazor.com/privacidad.html" target="_blank" rel="noopener">Más información</a></p>' +
      '<div class="cookie-actions">' +
      '<button class="cookie-btn rechazar" id="cookie-rechazar">Rechazar</button>' +
      '<button class="cookie-btn aceptar" id="cookie-aceptar">Aceptar</button>' +
      '</div></div>';
    document.body.appendChild(banner);
  }
  function abrir(){
    banner.classList.add('visible');
    document.body.classList.add('cookie-abierta');
  }
  function cerrar(acepta){
    window.cyaConsent.guardar(acepta);
    banner.classList.remove('visible');
    document.body.classList.remove('cookie-abierta');
  }
  document.getElementById('cookie-aceptar').addEventListener('click', function(){ cerrar(true); });
  document.getElementById('cookie-rechazar').addEventListener('click', function(){ cerrar(false); });
  window.cyaCookiePrefs = abrir;
  if (window.cyaConsent.leer() === null) abrir();

  // Conversiones por clic: teléfono y WhatsApp
  document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
    a.addEventListener('click', function(){ cyaConversion('telefono'); });
  });
  var wa = document.querySelector('.wa-fab');
  if (wa) wa.addEventListener('click', function(){ cyaConversion('whatsapp'); });
});
