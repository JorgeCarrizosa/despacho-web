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

/* =====================================================================
   CONSENTIMIENTO GRANULAR  (v2 - 8-sept-2026)
   ---------------------------------------------------------------------
   Sustituye a la barra inferior con Aceptar/Rechazar. Dos motivos:

   1) CUMPLIMIENTO. La Guia de cookies de la AEPD (mayo 2024, p. 20) pide
      TRES mecanismos en la primera capa: a) boton de aceptar, b) boton de
      RECHAZAR "similar al anterior", y c) un boton -no necesariamente
      similar- que lleve a un panel para aceptar o rechazar "de forma
      granular, al menos en funcion de su finalidad". Ese panel solo se
      puede omitir "en aquellos casos en los que solo se utilicen cookies
      para una finalidad", y nosotros usamos DOS (analitica y publicidad),
      asi que nos aplica y no lo teniamos.

   2) MEDICION. Con el aviso en una barra inferior casi nadie elige, y sin
      eleccion el consentimiento se queda denegado: del 3 al 8-sept-2026
      Ads cobro 14 clics y GA4 no registro ni una sesion de pago. Y no hay
      red de seguridad: el modelado de conversiones de Ads pide 700 clics
      en 7 dias y el de GA4 mil eventos diarios, umbrales que este sitio
      no va a cruzar nunca. Luego lo observado directamente es el 100% de
      lo que se puede medir.

   LIMITES QUE LA GUIA IMPONE Y QUE ESTE CODIGO RESPETA:
     - Rechazar debe ofrecerse "al mismo tiempo, al mismo nivel y con la
       misma visibilidad" que Aceptar (p. 24). Aqui los TRES botones son
       SOLIDOS, del mismo tamano, tipo y grosor de borde: lo unico que
       cambia es el color de marca -Rechazar en blanco con borde azul,
       Configurar en azul, Aceptar en dorado-. La guia no prohibe que
       difieran de color; prohibe un color o contraste "obviamente
       enganoso... de forma que lleven a un consentimiento involuntario",
       y su unico ejemplo invalido es un boton de rechazar cuyo texto no
       contrasta con el propio boton y no se puede leer (p. 21).
       CAUTELA DECLARADA, decision de Jorge (8-sept): con dos botones
       rellenos de color al lado, el blanco es el MENOS saliente de los
       tres. Se compensa en lo que si es objetivo -mismo tamano, borde
       definido para que se lea como boton, y contraste AAA- pero la
       igualdad de visibilidad ya no es tan literal como con los tres
       iguales. Si alguna vez se discute, este es el punto.
     - Nada premarcado a favor de aceptar (p. 22): las dos casillas del
       panel nacen desmarcadas, y guardar sin marcar nada equivale a
       rechazar todo.
     - Bloquea la pagina hasta elegir, que la guia permite -exige incluso
       que el aviso "debera mantenerse hasta que el usuario realice la
       accion" (p. 20)- porque NO es un "muro de cookies": se puede
       rechazar y seguir navegando (p. 29).
     - Al reabrirlo desde el enlace "Cookies" del pie, cuando ya hay una
       eleccion previa, si se puede cerrar sin tocar nada.
   ===================================================================== */

window.cyaConsent = {
  leer: function(){
    try {
      var c = JSON.parse(localStorage.getItem('cya_consent') || 'null');
      if (!c || !c.ts || (Date.now() - c.ts) >= 365*24*60*60*1000) return null;
      if (c.v === 2) return c;
      /* Formato v1 ({granted:bool}): quien ya eligio NO vuelve a ser
         preguntado. Un "acepto" antiguo era acepto-todo. */
      if (typeof c.granted === 'boolean') {
        return {v:2, analitica:c.granted, publicidad:c.granted, ts:c.ts};
      }
      return null;
    } catch(e){ return null; }
  },
  aplicar: function(sel){
    gtag('consent', 'update', {
      'analytics_storage':   sel.analitica  ? 'granted' : 'denied',
      'ad_storage':          sel.publicidad ? 'granted' : 'denied',
      'ad_user_data':        sel.publicidad ? 'granted' : 'denied',
      'ad_personalization':  sel.publicidad ? 'granted' : 'denied'
    });
    /* Clarity graba la sesion entera: va con la analitica, nunca por defecto. */
    if (sel.analitica) window.cyaCargarClarity();
  },
  guardar: function(sel){
    var s = {v:2, analitica:!!sel.analitica, publicidad:!!sel.publicidad, ts:Date.now()};
    try { localStorage.setItem('cya_consent', JSON.stringify(s)); } catch(e){}
    this.aplicar(s);
    return s;
  }
};
(function(){
  var c = window.cyaConsent.leer();
  if (c) window.cyaConsent.aplicar(c);
})();

document.addEventListener('DOMContentLoaded', function(){
  /* Estilos autocontenidos: las paginas interiores llevan su CSS inline y no
     cargan estilo.css. Prefijo cya-cc- nuevo a proposito, para que la regla
     .cookie-banner que /sucesiones/ trae inline (barra inferior) no pueda
     interferir con el recuadro. */
  if (!document.getElementById('cya-cc-css')) {
    var css = document.createElement('style');
    css.id = 'cya-cc-css';
    css.textContent =
      '.cya-cc{position:fixed;inset:0;z-index:9999;background:rgba(10,10,20,.62);' +
        'display:none;align-items:center;justify-content:center;padding:20px;' +
        'font-family:"Montserrat",-apple-system,Helvetica,Arial,sans-serif}' +
      '.cya-cc.visible{display:flex}' +
      '.cya-cc-caja{background:#fff;color:#161616;max-width:620px;width:100%;' +
        'max-height:calc(100vh - 40px);overflow-y:auto;padding:34px 34px 28px;' +
        'box-shadow:0 18px 60px rgba(0,0,0,.34)}' +
      '.cya-cc-caja h2{margin:0 0 14px;font-size:17px;letter-spacing:.06em;color:#040465;' +
        'text-transform:uppercase;font-weight:600}' +
      '.cya-cc-caja p{margin:0 0 18px;font-size:13.5px;line-height:1.65;color:#3a3a46}' +
      '.cya-cc-caja a{color:#8a6d20;text-decoration:underline}' +
      '.cya-cc-btns{display:flex;gap:10px;flex-wrap:wrap}' +
      '.cya-cc-b{flex:1 1 160px;padding:14px 18px;font-size:12px;font-weight:600;' +
        'letter-spacing:.12em;text-transform:uppercase;cursor:pointer;' +
        'font-family:inherit;border:1px solid #040465;transition:opacity .2s}' +
      '.cya-cc-b:hover{opacity:.82}' +
      '.cya-cc-b.solida{border-width:1px;border-style:solid}' +
      '.cya-cc-b.blanca{background:#fff;border-color:#040465;color:#040465}' +
      '.cya-cc-b.azul{background:#040465;border-color:#040465;color:#fff}' +
      '.cya-cc-b.dorada{background:#c9a35a;border-color:#c9a35a;color:#040465}' +
      '.cya-cc-b.azul:focus-visible{outline:3px solid #c9a35a;outline-offset:2px}' +
      '.cya-cc-b.blanca:focus-visible,.cya-cc-b.dorada:focus-visible' +
        '{outline:3px solid #040465;outline-offset:2px}' +
      '.cya-cc-panel{border-top:1px solid #e4e4ea;margin:4px 0 20px;padding-top:6px}' +
      '.cya-cc-fila{display:flex;gap:12px;align-items:flex-start;padding:14px 0;' +
        'border-bottom:1px solid #f0f0f4}' +
      '.cya-cc-fila input{margin-top:3px;width:17px;height:17px;flex-shrink:0;accent-color:#040465}' +
      '.cya-cc-fila b{display:block;font-size:13px;margin-bottom:3px}' +
      '.cya-cc-fila span{font-size:12.5px;line-height:1.55;color:#5a5a66}' +
      '.cya-cc-fija{font-size:11px;text-transform:uppercase;letter-spacing:.08em;' +
        'color:#8a8a96;flex-shrink:0;margin-top:2px}' +
      '@media(max-width:560px){.cya-cc-caja{padding:24px 20px 20px}.cya-cc-b{flex:1 1 100%}}' +
      /* El FAB de WhatsApp se OCULTA mientras el aviso esta abierto, no se
         sube. Subirlo lo dejaba en la zona del pulgar con animacion de pulso
         y el 28-jul-2026 produjo una conversion que nadie envio. Las dos
         paginas de /sucesiones/ lo arreglaron inline el 2-sept; las otras 19
         seguian subiendolo porque el arreglo no llego a este fichero. */
      'body.cookie-abierta .wa-fab{opacity:0;pointer-events:none;visibility:hidden}';
    document.head.appendChild(css);
  }

  /* La barra vieja vive inline en /sucesiones/index.html y /sucesiones/ca/.
     Se retira del DOM para que no haya dos avisos compitiendo ni quede el
     markup antiguo de dos botones. */
  var vieja = document.getElementById('cookie-banner');
  if (vieja && vieja.parentNode) vieja.parentNode.removeChild(vieja);

  /* /sucesiones/ca/ esta en catalan (<html lang="ca">) y la barra vieja que
     traia inline si estaba traducida. Sin esto, el recuadro nuevo le saldria
     en castellano: seria una regresion en esa pagina. */
  var CA = (document.documentElement.lang || '').toLowerCase().indexOf('ca') === 0;
  var T = CA ? {
    tit: 'Galetes',
    p1: 'Utilitzem galetes pr&ograve;pies i de tercers per analitzar l&#39;&uacute;s del lloc web ' +
        'i mostrar-te publicitat relacionada amb les teves prefer&egrave;ncies sobre la base d&#39;un ' +
        'perfil elaborat a partir dels teus h&agrave;bits de navegaci&oacute; (per exemple, ' +
        'p&agrave;gines visitades). Pots acceptar-les, rebutjar-les o triar per finalitat, i canviar ' +
        'la teva elecci&oacute; quan vulguis des de l&#39;enlla&ccedil; &laquo;Cookies&raquo; del peu ' +
        'de p&agrave;gina. ',
    pol: 'Pol&iacute;tica de galetes',
    siempre: 'Sempre', tec: 'T&egrave;cniques',
    tecd: 'Necess&agrave;ries perqu&egrave; el web funcioni i per recordar aquesta mateixa elecci&oacute;. ' +
          'Estan exemptes de consentiment i no es poden desactivar.',
    ana: 'Anal&iacute;tiques',
    anad: 'Google Analytics i Microsoft Clarity. Ens diuen quines p&agrave;gines es visiten i com es ' +
          'recorren. El detall, a la pol&iacute;tica de galetes.',
    pub: 'Publicitat',
    pubd: 'Google Ads. Permeten saber si una visita prov&eacute; d&#39;un anunci nostre i mostrar-te ' +
          'publicitat ajustada a un perfil elaborat amb els teus h&agrave;bits de navegaci&oacute;.',
    guardar: 'Desa les prefer&egrave;ncies', rech: 'Rebutjar', conf: 'Configurar', acep: 'Acceptar'
  } : {
    tit: 'Cookies',
    p1: 'Utilizamos cookies propias y de terceros para analizar el uso del sitio web ' +
        'y mostrarte publicidad relacionada con tus preferencias sobre la base de un perfil ' +
        'elaborado a partir de tus h&aacute;bitos de navegaci&oacute;n (por ejemplo, ' +
        'p&aacute;ginas visitadas). Puedes aceptarlas, rechazarlas o elegir por finalidad, ' +
        'y cambiar tu elecci&oacute;n cuando quieras desde el enlace &laquo;Cookies&raquo; ' +
        'del pie de p&aacute;gina. ',
    pol: 'Pol&iacute;tica de cookies',
    siempre: 'Siempre', tec: 'T&eacute;cnicas',
    tecd: 'Necesarias para que la web funcione y para recordar esta misma elecci&oacute;n. ' +
          'Est&aacute;n exentas de consentimiento y no se pueden desactivar.',
    ana: 'Anal&iacute;ticas',
    anad: 'Google Analytics y Microsoft Clarity. Nos dicen qu&eacute; p&aacute;ginas se visitan y ' +
          'c&oacute;mo se recorren. El detalle, en la pol&iacute;tica de cookies.',
    pub: 'Publicidad',
    pubd: 'Google Ads. Permiten saber si una visita procede de un anuncio nuestro y mostrarte ' +
          'publicidad ajustada a un perfil elaborado con tus h&aacute;bitos de navegaci&oacute;n.',
    guardar: 'Guardar preferencias', rech: 'Rechazar', conf: 'Configurar', acep: 'Aceptar'
  };

  var caja = document.createElement('div');
  caja.className = 'cya-cc';
  caja.id = 'cya-cc';
  caja.setAttribute('role', 'dialog');
  caja.setAttribute('aria-modal', 'true');
  caja.setAttribute('aria-labelledby', 'cya-cc-tit');
  /* Redaccion calcada del ejemplo de la propia AEPD (p. 21), que declara el
     perfilado en vez de esconderlo tras "mejorar tu experiencia", formula que
     la guia rechaza expresamente (p. 18). */
  caja.innerHTML =
    '<div class="cya-cc-caja">' +
      '<h2 id="cya-cc-tit">' + T.tit + '</h2>' +
      '<p>' + T.p1 + '<a href="/privacidad.html" target="_blank" rel="noopener">' + T.pol + '</a>.</p>' +
      '<div class="cya-cc-panel" id="cya-cc-panel" hidden>' +
        '<div class="cya-cc-fila">' +
          '<span class="cya-cc-fija">' + T.siempre + '</span>' +
          '<span><b>' + T.tec + '</b>' + T.tecd + '</span>' +
        '</div>' +
        '<div class="cya-cc-fila">' +
          '<input type="checkbox" id="cya-cc-analitica">' +
          '<label for="cya-cc-analitica"><b>' + T.ana + '</b><span>' + T.anad + '</span></label>' +
        '</div>' +
        '<div class="cya-cc-fila">' +
          '<input type="checkbox" id="cya-cc-publicidad">' +
          '<label for="cya-cc-publicidad"><b>' + T.pub + '</b><span>' + T.pubd + '</span></label>' +
        '</div>' +
        '<div class="cya-cc-btns" style="margin-top:18px">' +
          '<button type="button" class="cya-cc-b solida azul" id="cya-cc-guardar">' + T.guardar + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="cya-cc-btns" id="cya-cc-btns">' +
        '<button type="button" class="cya-cc-b solida blanca" id="cya-cc-rechazar">' + T.rech + '</button>' +
        '<button type="button" class="cya-cc-b solida azul"   id="cya-cc-config">' + T.conf + '</button>' +
        '<button type="button" class="cya-cc-b solida dorada" id="cya-cc-aceptar">' + T.acep + '</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(caja);

  var panel       = document.getElementById('cya-cc-panel');
  var chkAnal     = document.getElementById('cya-cc-analitica');
  var chkPub      = document.getElementById('cya-cc-publicidad');
  var scrollOrig  = '';
  var puedeCerrar = false;   /* solo cuando ya hay eleccion previa */

  function abrir(){
    var prev = window.cyaConsent.leer();
    puedeCerrar = !!prev;
    /* Nada premarcado a favor de aceptar. Si ya eligio antes, el panel
       refleja lo que eligio. */
    chkAnal.checked = !!(prev && prev.analitica);
    chkPub.checked  = !!(prev && prev.publicidad);
    panel.hidden = true;
    caja.classList.add('visible');
    document.body.classList.add('cookie-abierta');
    scrollOrig = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    var f = document.getElementById('cya-cc-rechazar');
    if (f) f.focus();
  }
  function cerrar(sel){
    if (sel) window.cyaConsent.guardar(sel);
    caja.classList.remove('visible');
    document.body.classList.remove('cookie-abierta');
    document.documentElement.style.overflow = scrollOrig;
  }

  document.getElementById('cya-cc-aceptar').addEventListener('click', function(){
    cerrar({analitica:true, publicidad:true});
  });
  document.getElementById('cya-cc-rechazar').addEventListener('click', function(){
    cerrar({analitica:false, publicidad:false});
  });
  document.getElementById('cya-cc-config').addEventListener('click', function(){
    panel.hidden = !panel.hidden;
    if (!panel.hidden) chkAnal.focus();
  });
  /* Guardar sin marcar nada equivale a rechazarlo todo (guia, p. 22). */
  document.getElementById('cya-cc-guardar').addEventListener('click', function(){
    cerrar({analitica: chkAnal.checked, publicidad: chkPub.checked});
  });

  /* Accesibilidad: el foco no se escapa del dialogo mientras esta abierto.
     Esc solo cierra si ya habia una eleccion previa; en la primera visita no,
     porque el aviso debe mantenerse hasta que el usuario actue. */
  caja.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && puedeCerrar) { cerrar(null); return; }
    if (e.key !== 'Tab') return;
    var f = caja.querySelectorAll('button, input, a[href]');
    var vis = [];
    for (var i = 0; i < f.length; i++) if (f[i].offsetParent !== null) vis.push(f[i]);
    if (!vis.length) return;
    var pri = vis[0], ult = vis[vis.length - 1];
    if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
    else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
  });
  caja.addEventListener('mousedown', function(e){
    if (e.target === caja && puedeCerrar) cerrar(null);
  });

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
