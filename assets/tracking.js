/* Tracking compartido de TODO el sitio carrizosayalmazor.com
   (web principal + /sucesiones). Google Ads + GA4 + Microsoft Clarity,
   los tres bajo Consent Mode v2 y el banner de cookies.

   Cargar en el <head> de cada pagina, SIN async:
       <script src="/assets/tracking.js"></script>
   Tiene que ser sincrono para que el consent por defecto (denegado) quede
   fijado ANTES de que cargue gtag.js.

   El banner y su CSS se inyectan solos si la pagina no los trae, asi que
   este fichero funciona tal cual en cualquier pagina del sitio.
   -------------------------------------------------------------------------
   PARA ACTIVAR LA MEDICION: rellenar los dos IDs de aqui debajo.
   Mientras esten vacios, GA4 y Clarity NO se cargan y no pasa nada:
   la etiqueta de Google Ads sigue funcionando igual que hasta ahora.  */

window.CYA_MEDICION = {
  ga4:     'G-V75SJGHLB6',   /* GA4 - propiedad "Carrizosa y Almazor", flujo "Web principal" */
  clarity: 'y91ikd7crb'      /* Microsoft Clarity - proyecto "Carrizosa y Almazor" */
};

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

/* GA4: se configura sobre el mismo gtag. Consent Mode se encarga de que no
   escriba cookies mientras el visitante no acepte. */
if (window.CYA_MEDICION.ga4) {
  gtag('config', window.CYA_MEDICION.ga4);
}

/* Clarity graba sesiones (dato personal), asi que NO se carga hasta que el
   visitante acepta. Se llama desde cyaConsent.guardar() y al cargar si ya
   habia aceptado antes. */
window.cyaCargarClarity = function(){
  var id = window.CYA_MEDICION.clarity;
  if (!id || window.__cyaClarityCargado) return;
  window.__cyaClarityCargado = true;
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, 'clarity', 'script', id);
};

window.CYA_ADS = {
  id: 'AW-17531743025',
  labels: {
    formulario: '-y4FCJbXs6QcELHW5KdB',
    telefono:   'fgGVCOjVicocELHW5KdB',
    whatsapp:   'cpHyCOvVicocELHW5KdB',
    email:      '8mP1CJS6wuwcELHW5KdB'   /* accion 'Email Landing', creada 2-sept-2026 */
  }
};
/* Dispara un contacto a los DOS destinos.

   Hasta el 28-ago-2026 esta funcion solo avisaba a Google Ads, asi que GA4
   media audiencia pero NO media contactos: formulario, telefono y WhatsApp no
   salian en ningun informe suyo. Se añade el evento de GA4 aqui mismo.

   Cada tipo lleva nombre de evento propio (contacto_formulario, etc.) a
   proposito: los nombres nuevos aparecen solos en el informe de Eventos de
   GA4, mientras que un parametro requiere darlo de alta como dimension
   personalizada. Y va con send_to explicito para que el evento de GA4 no se
   cuele en la etiqueta de Ads, que comparte el mismo gtag.  */
window.cyaConversion = function(tipo){
  if (window.CYA_MEDICION && window.CYA_MEDICION.ga4) {
    gtag('event', 'contacto_' + tipo, {
      'send_to': window.CYA_MEDICION.ga4,
      'metodo': tipo
    });
  }
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
      window.cyaCargarClarity();
    }
  }
};
(function(){
  var c = window.cyaConsent.leer();
  if (c && c.granted) window.cyaConsent.guardar(true);
})();

document.addEventListener('DOMContentLoaded', function(){
  // Estilos del banner autocontenidos: las paginas interiores llevan su CSS
  // inline y no cargan estilo.css, asi que sin esto el banner sale sin estilo
  // y el Aceptar/Rechazar no lo oculta (quitar .visible no hace nada sin
  // display:none).
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
      /* Con el banner abierto (z-index 100 > 90), el FAB de WhatsApp quedaba
         tapado justo en la primera visita. Se eleva mientras dure. */
      'body.cookie-abierta .wa-fab{bottom:130px}' +
      '@media(max-width:680px){body.cookie-abierta .wa-fab{bottom:205px}}';
    document.head.appendChild(css);
  }
  // Banner de cookies (mismo markup y clases que las paginas que lo traen)
  var banner = document.getElementById('cookie-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML =
      '<div class="cookie-inner">' +
      '<p class="cookie-text">Utilizamos cookies propias y de terceros para medir la audiencia del sitio y la eficacia de nuestra publicidad. ' +
      'No se activan si usted no lo acepta, y puede cambiar su elecci&oacute;n en cualquier momento desde el enlace &laquo;Cookies&raquo; del pie de p&aacute;gina. ' +
      '<a href="/privacidad.html" target="_blank" rel="noopener">M&aacute;s informaci&oacute;n</a></p>' +
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

  // Conversiones por clic: telefono y WhatsApp
  document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
    a.addEventListener('click', function(){ cyaConversion('telefono'); });
  });
  var wa = document.querySelector('.wa-fab');
  if (wa) wa.addEventListener('click', function(){ cyaConversion('whatsapp'); });

  /* El CUARTO canal, que hasta hoy no medía nada (1-sept-2026).
     La pagina de /sucesiones/ —destino de los anuncios— ofrece el correo del
     despacho en 4 enlaces mailto:. Quien pulsa ahi nos escribe y no deja rastro
     en Ads, en GA4 ni en ningun sitio: un email por mailto: es indistinguible de
     cualquier otro correo que entre al buzon. En la ronda de julio eso significa
     que un contacto por esa via se contaba como CERO.

     Se mide como los otros tres, y desde el 2-sept-2026 tambien en Ads: la
     accion 'Email Landing' ya existe y su etiqueta esta arriba en CYA_ADS.labels
     (objetivo Contacto, junto al telefono y WhatsApp; Recuento=Una, ventana
     post-clic 30 dias como las otras tres, para que los cuatro canales sean
     comparables). Verificado en vivo con Tag Assistant ese mismo dia que los
     otros tres canales disparan y llegan a Ads con su nombre.

     Aviso que vale para los cuatro canales: esto mide el CLIC en el enlace, no
     el correo enviado. Mide intencion. */
  document.querySelectorAll('a[href^="mailto:"]').forEach(function(a){
    a.addEventListener('click', function(){ cyaConversion('email'); });
  });
});
