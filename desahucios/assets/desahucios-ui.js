/* Interfaz de /desahucios/: menú, formulario de cribado, calculadora y
   comprobador. El cálculo vive en /assets/desahucios.js (con tests).
   La validación de nombre y contacto, los campos ocultos de origen y las
   conversiones por clic las pone /assets/tracking.js, que se carga antes.
   Eventos nuevos (05_ux §3.1): form_perfil, derivacion_inquilino,
   herramienta_resultado; y contacto_formulario con perfil y situación. */
(function(){
  'use strict';
  var PROTO = !!window.CYA_PROTOTIPO;
  var CA = document.documentElement.lang === 'ca';
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function evento(nombre, params){
    params = params || {};
    if (PROTO) { try { console.log('[prototipo] evento', nombre, params); } catch(e){} return; }
    if (window.CYA_MEDICION && window.CYA_MEDICION.ga4 && window.gtag) {
      params.send_to = window.CYA_MEDICION.ga4;
      window.gtag('event', nombre, params);
    }
  }
  window.cyaEventoDesahucios = evento;

  /* Prototipo: barra de aviso y marcas de lo pendiente. Nada de esto existe
     en el dominio real (CYA_PROTOTIPO lo fija el tracking.js del prototipo). */
  if (PROTO) {
    document.documentElement.classList.add('proto');
    var barra = document.createElement('div');
    barra.className = 'proto-barra';
    barra.innerHTML = CA
      ? 'PROTOTIP LOCAL · no publicat · el que està en àmbar és pendent · <a href="/_interno/plan_desahucios.html">Veure el pla</a>'
      : 'PROTOTIPO LOCAL · no publicado · lo marcado en ámbar está pendiente · <a href="/_interno/plan_desahucios.html">Ver el plan de la sección</a>';
    document.body.insertBefore(barra, document.body.firstChild);
  }

  /* Menú móvil: se abre con el botón y se cierra con Escape o al elegir un enlace */
  $$('.nav-toggle').forEach(function(b){
    var l = document.getElementById(b.getAttribute('aria-controls'));
    var poner = function(abierto){
      b.classList.toggle('open', abierto);
      if (l) l.classList.toggle('open', abierto);
      b.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    };
    b.addEventListener('click', function(){ poner(!b.classList.contains('open')); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && b.classList.contains('open')) { poner(false); b.focus(); }
    });
    if (l) $$('a', l).forEach(function(a){ a.addEventListener('click', function(){ poner(false); }); });
  });

  /* Errores junto al campo (no alert): el mensaje se lee con el lector de pantalla y el foco va al campo */
  function errorEn(ancla, msg, foco){
    var p = ancla.parentNode.querySelector('.err-campo[data-para="' + ancla.id + '"]');
    if (!p) {
      p = document.createElement('p');
      p.className = 'err-campo'; p.setAttribute('role', 'alert'); p.setAttribute('data-para', ancla.id);
      ancla.insertAdjacentElement('afterend', p);
    }
    p.textContent = msg; p.classList.remove('oculto');
    ancla.setAttribute('aria-invalid', 'true');
    if (foco && foco.focus) foco.focus();
  }
  function limpiarError(ancla){
    var p = ancla.parentNode.querySelector('.err-campo[data-para="' + ancla.id + '"]');
    if (p) p.classList.add('oculto');
    ancla.removeAttribute('aria-invalid');
  }

  var eur0 = new Intl.NumberFormat(CA ? 'ca-ES' : 'es-ES', {maximumFractionDigits:0, useGrouping:'always'});
  var eur2 = new Intl.NumberFormat(CA ? 'ca-ES' : 'es-ES', {minimumFractionDigits:2, maximumFractionDigits:2, useGrouping:'always'});
  function euros(n, dec){ return (dec ? eur2 : eur0).format(n) + ' €'; }
  function eurosIva(n){ return (Math.round(n) === n ? eur0.format(n) : eur2.format(n)) + ' €'; }

  /* ---------- FORMULARIO DE CRIBADO ---------- */
  var form = document.getElementById('contacto-form');
  if (form) {
    var cuerpo = $('.form-cuerpo', form);
    var deriv = $('.derivacion', form);
    var btn = $('.form-submit', form);
    var ok = $('.msg.ok', form), err = $('.msg.err', form);

    // Rellenar desde la URL (?situacion=impago&renta=1000-1250) o desde la calculadora
    try {
      var q = new URLSearchParams(location.search);
      ['situacion','renta_tramo','viviendas_cat','perfil'].forEach(function(n){
        var v = q.get(n); if (!v) return;
        var r = form.querySelector('input[name="' + n + '"][value="' + v + '"]');
        if (r) { r.checked = true; var d = r.closest('details'); if (d) d.open = true; }
      });
    } catch(e){}

    $$('input[name="perfil"]', form).forEach(function(r){
      r.addEventListener('change', function(){
        // 7-oct-2026: «Inquilino» ya no deriva ni bloquea el envío (decisión de Jorge: el despacho decide caso por caso).
        evento('form_perfil', {perfil: r.value});
      });
    });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      ok.classList.remove('show'); err.classList.remove('show');
      var perfil = (form.querySelector('input[name="perfil"]:checked') || {}).value;
      var situacion = (form.querySelector('input[name="situacion"]:checked') || {}).value;
      var fsPerfil = $('#fs-perfil', form), fsSit = $('#fs-situacion', form), priv = $('#privacidad', form);
      [fsPerfil, fsSit, priv.closest('label')].forEach(function(x){ if (x) limpiarError(x); });
      // 7-oct-2026: «Usted es…» y «¿Qué ocurre?» pasan a ser opcionales (decisión de Jorge).
      if (!priv.checked) {
        errorEn(priv.closest('label'), CA ? 'Cal acceptar la Política de Privacitat.' : 'Hace falta aceptar la Política de Privacidad.', priv);
        return;
      }
      btn.disabled = true;
      var texto = btn.textContent;
      btn.textContent = CA ? 'Enviant…' : 'Enviando…';
      var fin = function(exito){
        btn.disabled = false; btn.textContent = texto;
        if (exito) {
          ok.classList.add('show'); form.reset();
          if (cuerpo) cuerpo.classList.remove('oculto');
          if (window.cyaConversion) window.cyaConversion('formulario');
          evento('contacto_formulario_detalle', {perfil: perfil, situacion: situacion});
        } else { err.classList.add('show'); }
      };
      if (PROTO) {
        // En el prototipo NO se envía nada: se enseña lo que se mandaría.
        var datos = {};
        new FormData(form).forEach(function(v, k){ if (k !== 'access_key') datos[k] = v; });
        try { console.log('[prototipo] envío simulado a Web3Forms:', datos); } catch(e2){}
        setTimeout(function(){ fin(true); }, 400);
        return;
      }
      fetch('https://api.web3forms.com/submit', {method:'POST', body:new FormData(form)})
        .then(function(r){ return r.json(); })
        .then(function(d){ fin(!!d.success); })
        .catch(function(){ fin(false); });
    });
  }

  /* ---------- CALCULADORA DE PRECIO ---------- */
  var calc = document.getElementById('calc-precio');
  if (calc && window.CYA_DESAHUCIOS) {
    var D = window.CYA_DESAHUCIOS;
    var cRenta = $('#c-renta'), cDeuda = $('#c-deuda'), cFiador = $('#c-fiador'),
        cSoc = $('#c-sociedad'), cMeses = $('#c-meses'), cHab = $('#c-habitual');
    var enviado = false;
    var pinta = function(){
      [cRenta, cDeuda, cMeses].forEach(limpiarError);
      var malos = [cRenta, cDeuda, cMeses].filter(function(i){ return !D.valido(i.value); });
      var renta = D._num(cRenta.value);
      var rentaInvalida = malos.length || !renta;
      if (rentaInvalida) {
        malos.forEach(function(i){ errorEn(i, 'Escriba un número, por ejemplo 950 o 1.250,50.'); });
        // Sin una renta válida no hay precio: una cifra inventada es peor que ninguna
        $('#r-total').textContent = '—';
        $('#r-sub').textContent = malos.length ? 'Corrija la cifra marcada.' : 'Escriba la renta mensual; si no hay renta (precario), la renta de mercado del piso.';
        $('#r-desglose').innerHTML = ''; $('#r-aviso').classList.add('oculto');
        return;
      }
      var inq = +((calc.querySelector('input[name="c-inquilinos"]:checked') || {}).value || 1);
      var demandados = inq + (cFiador.checked ? 1 : 0);
      var p = D.precio({ renta: renta, deuda: cDeuda.value, demandados: demandados, sociedad: cSoc.checked });
      $('#r-total').textContent = eurosIva(p.totalIva);
      var m = p.mensualidades;
      $('#r-sub').textContent = 'Sin oposición del inquilino. La fase judicial equivale a ' +
        (Math.abs(m - 1) < 0.05 ? 'una mensualidad de su renta' : (m.toFixed(1).replace('.', ',') + ' mensualidades de su renta')) + ', sin IVA.';
      var filas = [
        ['Fase previa (requerimientos y negociación previa' + (demandados > 1 ? ', ' + demandados + ' demandados' : '') + ')', eurosIva(p.previaIva)],
        ['Fase judicial, hasta el lanzamiento', eurosIva(p.judicialIva)],
      ];
      var html = filas.map(function(f){ return '<div class="fila"><span>' + f[0] + '</span><b>' + f[1] + '</b></div>'; }).join('');
      html += '<div class="fila si-ocurre"><span>Solo si se opone y hay juicio</span><b>+ ' + eurosIva(p.vistaIva) + '</b></div>';
      html += '<div class="fila si-ocurre"><span>Aparte: procurador (estimación)</span><b>180-485 €</b></div>';
      if (cHab.checked) html += '<div class="fila si-ocurre"><span>Solo si hay que alegar por vulnerabilidad</span><b>+ 302,50 €</b></div>';
      html += '<div class="fila si-ocurre"><span>Aparte: burofaxes y registro</span><b>~' + (40 + 36 * demandados) + ' €</b></div>';
      if (p.tasa) html += '<div class="fila si-ocurre"><span>Tasa judicial (solo sociedades)</span><b>150 €</b></div>';
      $('#r-desglose').innerHTML = html;
      var av = [];
      if (renta > 10000) av.push('<p>Compruebe la cifra: ' + euros(renta) + ' al mes es una renta muy alta.</p>');
      if (p.baseDeuda) av.push('<p>La deuda supera un año de renta: la fase judicial se calcula sobre la deuda (art. 252.2.ª LEC), no sobre la renta.</p>');
      if (p.minimoAplicado) av.push('<p>Con esta renta se aplica el importe mínimo de la fase judicial.</p>');
      // RDL 29/2026 (7-oct-2026): si se deroga, quitar la segunda frase (ver ESTADO_RDL29 en construir_desahucios.py).
      if (cHab.checked) av.push('<p>Si es la vivienda habitual del inquilino, el juzgado avisa a los servicios sociales y, si es vulnerable, puede suspender el proceso hasta dos meses (cuatro si usted es una sociedad). Desde el 8 de octubre, además, la Administración tiene dos meses para ofrecer otra vivienda al inquilino o pagarle a usted la deuda y las costas (norma provisional).</p>');
      var meses = D._num(cMeses.value);
      var dec = renta % 1 !== 0;
      av.push('<p><b>Lo que cuesta esperar:</b> cada mes sin cobrar son ' + euros(renta, dec) + '.' + (meses ? ' Lleva ' + euros(renta * meses, dec) + ' sin cobrar.' : '') + '</p>');
      var aviso = $('#r-aviso');
      aviso.innerHTML = av.join('');
      aviso.classList.toggle('oculto', av.length === 0);
      var tramo = renta < 750 ? '0-750' : renta < 1000 ? '750-1000' : renta < 1250 ? '1000-1250' : renta < 1500 ? '1250-1500' : '1500-mas';
      var cta = $('#r-cta');
      if (cta) cta.setAttribute('href', '/desahucios/?situacion=impago&renta_tramo=' + tramo + '#contacto');
      if (!enviado) { enviado = true; evento('herramienta_resultado', {herramienta: 'precio', resultado: tramo}); }
    };
    [cRenta, cDeuda, cMeses].forEach(function(i){ i.addEventListener('input', pinta); });
    [cFiador, cSoc, cHab].concat($$('input[name="c-inquilinos"]', calc)).forEach(function(i){ i.addEventListener('change', pinta); });
    pinta();
  }

  /* ---------- COMPROBADOR DE GRAN TENEDOR ---------- */
  var gt = document.getElementById('gt-form');
  if (gt && window.CYA_DESAHUCIOS) {
    var T = CA ? {
      si: 'Sí', no: 'No', depende: 'Depèn',
      cat: 'Llei catalana (Llei 24/2015 i Llei 18/2007)', est: 'Llei estatal (el que es declara a la demanda)', igual: 'El que no canvia',
      falta: 'Indiqui en quins municipis té habitatges i quants.'
    } : {
      si: 'Sí', no: 'No', depende: 'Depende',
      cat: 'Ley catalana (Llei 24/2015 y Llei 18/2007)', est: 'Ley estatal (lo que se declara en la demanda)', igual: 'Lo que no cambia',
      falta: 'Indique en qué municipios tiene viviendas y cuántas.'
    };
    var val = function(n){ var e = gt.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : ''; };
    $$('input[name="titular"]', gt).forEach(function(r){
      r.addEventListener('change', function(){ $('#gt-excepcion-f').classList.toggle('oculto', val('titular') !== 'juridica'); });
    });
    var V = function(x){ return T[x]; };
    var D = window.CYA_DESAHUCIOS, ZD = window.CYA_ZONAS, HOY = new Date().toISOString().slice(0, 10);
    var fmtF = function(iso){ var p = String(iso).split('-'); return (+p[2]) + '-' + (+p[1]) + '-' + p[0]; };
    var numZ = function(id){ return id ? id.replace('ZMRT', '') : ''; };
    if (ZD) $('#gt-lista').innerHTML = ZD.m.map(function(x){ return '<option value="' + x[1].replace(/"/g, '&quot;') + '">'; }).join('');
    // Etiqueta junto a cada municipio: en qué zona está hoy y qué hay en trámite
    var etiqueta = function(m){
      var z = D.zonaDe(m.ine, ZD, HOY), t;
      if (z.id) {
        t = (ES0 ? 'Zona tensionada ' : 'Zona tensionada ') + numZ(z.id) + (ES0 ? ' (desde el ' : ' (des del ') + fmtF(z.desde) + ')';
        if (z.sale) t += ES0 ? '. Sale de la zona en marzo de 2027' : '. En surt el març de 2027';
      } else {
        t = ES0 ? 'No está en zona tensionada' : 'No és en zona tensionada';
        if (z.propuesta) t += ES0 ? '. Entra en la nueva zona ' + numZ(z.propuesta) + ' cuando se publique en el BOE' : '. Entra a la nova zona ' + numZ(z.propuesta) + ' quan es publiqui al BOE';
        if (z.vencida) t += ES0 ? '. La declaración venció el ' + fmtF(z.vencida.hasta) : '. La declaració va vèncer el ' + fmtF(z.vencida.hasta);
      }
      return t;
    };
    var ES0 = !CA, nFila = 0;
    var fmtN = function(x){ return String(Math.round(x * 100) / 100).replace('.', ','); };
    var anadirFila = function(){
      var i = nFila++, d = document.createElement('div');
      d.className = 'gt-fila';
      d.innerHTML = '<input class="txt gt-muni" id="gt-muni-' + i + '" list="gt-lista" autocomplete="off" aria-label="' + (ES0 ? 'Municipio' : 'Municipi') + '" placeholder="' + (ES0 ? 'Municipio (p. ej. Barcelona)' : 'Municipi (p. ex. Barcelona)') + '">' +
        '<input class="txt gt-n" id="gt-n-' + i + '" inputmode="decimal" autocomplete="off" aria-label="' + (ES0 ? 'Viviendas en ese municipio' : 'Habitatges en aquest municipi') + '" placeholder="' + (ES0 ? 'nº' : 'núm.') + '">' +
        '<button type="button" class="gt-quitar" aria-label="' + (ES0 ? 'Quitar este municipio' : 'Treure aquest municipi') + '">×</button>' +
        '<p class="gt-etq" aria-live="polite"></p>';
      $('#gt-filas').appendChild(d);
      var mu = d.querySelector('.gt-muni'), et = d.querySelector('.gt-etq');
      var mira = function(){
        var m = mu.value.trim() ? D.municipio(mu.value, ZD) : null;
        et.textContent = m ? etiqueta(m) : (mu.value.trim() ? (ES0 ? 'No encuentro ese municipio de Cataluña: elíjalo de la lista.' : 'No trobo aquest municipi de Catalunya: triï’l de la llista.') : '');
        et.classList.toggle('mal', !!mu.value.trim() && !m);
        if (m) { mu.removeAttribute('aria-invalid'); if (mu.value !== m.nombre && document.activeElement !== mu) mu.value = m.nombre; }
      };
      mu.addEventListener('input', mira); mu.addEventListener('change', mira); mu.addEventListener('blur', mira);
      d.querySelector('.gt-quitar').addEventListener('click', function(){
        if ($$('.gt-fila', gt).length > 1) d.remove(); else { mu.value = ''; d.querySelector('.gt-n').value = ''; mira(); }
      });
      return d;
    };
    anadirFila(); anadirFila();
    $('#gt-anadir').addEventListener('click', function(){ anadirFila().querySelector('.gt-muni').focus(); });

    var pintar = function(r){
      var ES = !CA, c = r.cataluna, e = r.estatal, h = '';
      var tarjeta = function(clase, ley, v, cuerpo, regla){
        return '<div class="veredicto ' + clase + '"><div class="ley">' + ley + '</div><div class="v">' + v + '</div>' + cuerpo +
               (regla ? '<p class="regla">' + regla + '</p>' : '') + '</div>';
      };
      // 1. Ley catalana
      var cuerpo = '';
      var ANT = ES ? 'la definición anterior exige más de 15 viviendas en propiedad a una persona física y más de 10 a una sociedad'
                   : "la definició anterior exigeix més de 15 habitatges en propietat a una persona física i més de 10 a una societat";
      if (c.doble && c.r === 'depende') {
        cuerpo += ES
          ? '<p>Depende del contrato. La ley catalana va contrato a contrato mientras convivan las dos definiciones:</p><ul class="dos-resp"><li>Contratos firmados desde el 31-7-2026: <b>' + V(c.futuro) + '</b>.</li><li>Contratos anteriores: <b>' + V(c.antiguo) + '</b> (' + ANT + ').</li></ul>'
          : "<p>Depèn del contracte. La llei catalana va contracte a contracte mentre convisquin les dues definicions:</p><ul class=\"dos-resp\"><li>Contractes signats des del 31-7-2026: <b>" + V(c.futuro) + '</b>.</li><li>Contractes anteriors: <b>' + V(c.antiguo) + '</b> (' + ANT + ').</li></ul>';
      } else if (c.doble && r.titular !== 'financiera') {
        cuerpo += ES ? '<p>La misma respuesta para los contratos firmados antes y después del 31-7-2026.</p>'
                     : '<p>La mateixa resposta per als contractes signats abans i després del 31-7-2026.</p>';
      } else if (r.titular === 'financiera') {
        cuerpo += ES ? '<p>Las entidades financieras y los fondos son grandes tenedores con cualquiera de las dos definiciones, la anterior y la de 2026.</p>'
                     : '<p>Les entitats financeres i els fons són grans tenidors amb qualsevol de les dues definicions, l’anterior i la de 2026.</p>';
      } else if (r.contrato === 'antes') {
        cuerpo += ES
          ? '<p>Para <b>este</b> contrato, firmado antes del 31-7-2026, la definición nueva no se aplica (DT 5.ª): cuenta la anterior, que exige más de 10 viviendas a las sociedades y más de 15 a las personas físicas.</p><p>Para los contratos que firme desde el 31-7-2026: <b>' + V(c.futuro) + '</b>.</p>'
          : "<p>Per a <b>aquest</b> contracte, signat abans del 31-7-2026, la definició nova no s'aplica (DT 5a): compta l'anterior, que exigeix més de 10 habitatges a les societats i més de 15 a les persones físiques.</p><p>Per als contractes que signi des del 31-7-2026: <b>" + V(c.futuro) + '</b>.</p>';
      }
      var esGt = c.r === 'si' || (c.doble && c.futuro === 'si');
      var soloNuevos = c.r === 'depende' ? (ES ? 'En los contratos firmados desde el 31-7-2026: a' : 'En els contractes signats des del 31-7-2026: a') : (ES ? 'A' : 'A');
      if (esGt && r.problema === 'impago') {
        cuerpo += ES
          ? '<p>' + soloNuevos + 'ntes de demandar por impago, la ley catalana menciona una oferta de alquiler social a inquilinos en riesgo de exclusión residencial (art. 5.2 Llei 24/2015). Para demandar no hace falta: el Tribunal Constitucional ha dicho que Cataluña no puede exigirla como paso previo al juicio.</p>'
          : '<p>' + soloNuevos + "bans de demandar per impagament, la llei catalana esmenta una oferta de lloguer social als llogaters en risc d'exclusió residencial (art. 5.2 Llei 24/2015). Per demandar no cal: el Tribunal Constitucional ha dit que Catalunya no la pot exigir com a pas previ al judici.</p>";
      } else if (esGt && r.problema === 'fin') {
        cuerpo += ES ? '<p>La oferta de alquiler social del art. 5.2 se refiere al desahucio por impago, no al fin de contrato.</p>'
                     : "<p>L'oferta de lloguer social de l'art. 5.2 es refereix al desnonament per impagament, no al final de contracte.</p>";
      }
      if (r.avisos.indexOf('m2_antiguo') >= 0) cuerpo += ES
        ? '<p class="aviso">Para los contratos anteriores al 31-7-2026 no bastan los 1.500 m² construidos: la definición anterior pide ser copropietario con una cuota que represente más de 1.500 m² de suelo de viviendas. Con ese dato, consúltelo.</p>'
        : "<p class=\"aviso\">Per als contractes anteriors al 31-7-2026 no n'hi ha prou amb els 1.500 m² construïts: la definició anterior demana ser copropietari amb una quota que representi més de 1.500 m² de sòl d'habitatges. Amb aquesta dada, consulti-ho.</p>";
      if (r.avisos.indexOf('usufructo_antiguo') >= 0) cuerpo += ES
        ? '<p class="aviso">Para los contratos anteriores al 31-7-2026 solo cuentan las viviendas de su propiedad, no las que tiene en usufructo.</p>'
        : "<p class=\"aviso\">Per als contractes anteriors al 31-7-2026 només compten els habitatges de la seva propietat, no els que té en usdefruit.</p>";
      if (r.avisos.indexOf('diez') >= 0) cuerpo += ES
        ? '<p class="aviso">Tiene exactamente 10 viviendas en España. La Llei 24/2015 exige «más de diez» y la Llei 18/2007 dice «de diez»: para una ley no es gran tenedor y para la otra podría serlo. Consúltelo.</p>'
        : "<p class=\"aviso\">Té exactament 10 habitatges a Espanya. La Llei 24/2015 exigeix «més de deu» i la Llei 18/2007 diu «de deu»: per a una llei no és gran tenidor i per a l'altra podria ser-ho. Consulti-ho.</p>";
      h += tarjeta(c.r, T.cat, V(c.r), cuerpo, c.regla);
      // 2. Ley estatal
      var cu2 = '';
      if (e.r === 'no') cu2 = ES ? '<p>En la demanda tendrá que declarar que no lo es y aportar una certificación del Registro de la Propiedad con sus inmuebles (art. 439.6.b LEC).</p>'
                                 : '<p>A la demanda haurà de declarar que no ho és i aportar un certificat del Registre de la Propietat amb els seus immobles (art. 439.6.b LEC).</p>';
      else if (e.r === 'si') cu2 = ES ? '<p>Hay que declararlo en la demanda. Si su inquilino es vulnerable y pide la prórroga extraordinaria de un año, usted está obligado a aceptarla (art. 10.2 LAU). La prórroga de hasta dos años del decreto de octubre, para inquilinos al corriente de pago, le obliga sea o no gran tenedor (norma provisional).</p>'
                                      : "<p>Cal declarar-ho a la demanda. Si el seu llogater és vulnerable i demana la pròrroga extraordinària d'un any, vostè està obligat a acceptar-la (art. 10.2 LAU). La pròrroga de fins a dos anys del decret d’octubre, per a llogaters al corrent de pagament, l’obliga sigui o no gran tenidor (norma provisional).</p>";
      else cu2 = ES ? '<p>Depende de dónde estén las viviendas de las que no ha indicado el municipio: si con ellas llega a 5 en una misma zona tensionada, lo es.</p>'
                    : '<p>Depèn d’on siguin els habitatges dels quals no ha indicat el municipi: si amb ells arriba a 5 en una mateixa zona tensionada, ho és.</p>';
      var z = r.zonas;
      if (z) {
        var partes = Object.keys(z.porZona).sort().map(function(id){ return (ES ? 'Zona tensionada ' : 'Zona tensionada ') + numZ(id) + ': ' + fmtN(z.porZona[id]); });
        if (z.fuera) partes.push((ES ? 'Fuera de zona: ' : 'Fora de zona: ') + fmtN(z.fuera));
        if (z.desconocidas) partes.push((ES ? 'Sin municipio: ' : 'Sense municipi: ') + fmtN(z.desconocidas));
        if (partes.length) cu2 = '<p class="desglose">' + partes.join(' · ') + '</p>' + cu2;
        if (r.avisos.indexOf('zonas_separadas') >= 0) cu2 += ES
          ? '<p class="aviso">Tiene ' + fmtN(z.total) + ' viviendas en zonas tensionadas, pero repartidas entre zonas distintas. Para la Generalitat no se suman: las cinco tienen que estar en la misma zona (informe de la Dirección General de Tributos y la Agencia de la Vivienda de 24-3-2026). Es un criterio administrativo que un juzgado podría no seguir: consúltelo antes de declararlo en una demanda.</p>'
          : '<p class="aviso">Té ' + fmtN(z.total) + ' habitatges en zones tensionades, però repartits entre zones diferents. Per a la Generalitat no se sumen: els cinc han de ser a la mateixa zona (informe de la Direcció General de Tributs i Joc i l’Agència de l’Habitatge de 24-3-2026). És un criteri administratiu que un jutjat podria no seguir: consulti-ho abans de declarar-ho en una demanda.</p>';
        if (r.avisos.indexOf('cambio_2027_sale') >= 0) cu2 += ES
          ? '<p class="aviso">La Generalitat ha prorrogado la zona 1 sin ' + z.salen.join(', ') + ' (DOGC de 19-10-2026). Desde marzo de 2027 dejará de ser gran tenedor por esta vía.</p>'
          : '<p class="aviso">La Generalitat ha prorrogat la zona 1 sense ' + z.salen.join(', ') + ' (DOGC de 19-10-2026). Des del març de 2027 deixarà de ser gran tenidor per aquesta via.</p>';
        if (r.avisos.indexOf('zona_propuesta') >= 0) {
          var pm = []; Object.keys(z.propuesta).forEach(function(id){ pm = pm.concat(z.propuesta[id].munis); });
          cu2 += ES ? '<p class="aviso">La Generalitat ha declarado una nueva zona tensionada que incluye ' + pm.join(', ') + ' (DOGC de 19-10-2026). Cuando el Ministerio la publique en el BOE, pasará a ser gran tenedor.</p>'
                    : '<p class="aviso">La Generalitat ha declarat una nova zona tensionada que inclou ' + pm.join(', ') + ' (DOGC de 19-10-2026). Quan el Ministeri la publiqui al BOE, passarà a ser gran tenidor.</p>';
        }
        if (r.avisos.indexOf('vencida') >= 0) cu2 += ES ? '<p class="aviso">La declaración de zona tensionada de alguno de sus municipios ha vencido. Compruebe si se ha prorrogado antes de fiarse de este resultado.</p>'
                                                        : '<p class="aviso">La declaració de zona tensionada d’algun dels seus municipis ha vençut. Comprovi si s’ha prorrogat abans de refiar-se d’aquest resultat.</p>';
      }
      if (r.avisos.indexOf('m2') >= 0) cu2 += ES ? '<p class="regla">Salvo que sus inmuebles residenciales superen en total los 1.500 m² construidos.</p>' : '<p class="regla">Llevat que els seus immobles residencials superin en total els 1.500 m² construïts.</p>';
      h += tarjeta(e.r, T.est, V(e.r), cu2, e.regla);
      // 3. Lo que no cambia
      var cu3 = ES
        ? '<p>La suspensión ordinaria del proceso si el inquilino es vulnerable (art. 441.6 LEC) dura hasta 2 meses si usted es persona física y 4 si es una sociedad, sea o no gran tenedor. La nueva del decreto de octubre (norma provisional) sí mira cuántas viviendas tiene. Cuando no se aplica el pago por la Administración (normalmente, fuera del impago), si usted es persona física con dos viviendas o menos, la falta de ingresos del inquilino no basta para suspender.</p>'
        : "<p>La suspensió ordinària del procés si el llogater és vulnerable (art. 441.6 LEC) dura fins a 2 mesos si vostè és persona física i 4 si és una societat, sigui o no gran tenidor. La nova del decret d’octubre (norma provisional) sí que mira quants habitatges té. Quan no s’aplica el pagament per l’Administració (normalment, fora de l’impagament), si vostè és persona física amb dos habitatges o menys, la manca d’ingressos del llogater no és suficient per suspendre.</p>";
      if (r.avisos.indexOf('cotitular') >= 0) cu3 += ES ? '<p>El piso que comparte con un gran tenedor queda sujeto a las obligaciones de gran tenedor aunque usted no lo sea (art. 5.9 ter, regla 2.ª).</p>' : '<p>El pis que comparteix amb un gran tenidor queda subjecte a les obligacions de gran tenidor encara que vostè no ho sigui (art. 5.9 ter, regla 2a).</p>';
      if (r.avisos.indexOf('cotitular_nose') >= 0) cu3 += ES ? '<p>Si algún piso lo comparte con una entidad financiera, un fondo o alguien con muchas viviendas, ese piso puede quedar sujeto a las obligaciones de gran tenedor (art. 5.9 ter, regla 2.ª).</p>' : "<p>Si algun pis el comparteix amb una entitat financera, un fons o algú amb molts habitatges, aquest pis pot quedar subjecte a les obligacions de gran tenidor (art. 5.9 ter, regla 2a).</p>";
      if (r.avisos.indexOf('comunidad') >= 0) cu3 += ES ? '<p>Si el propietario es una comunidad o una herencia ya aceptada pero sin repartir, lo razonable es que cada partícipe cuente su parte; la ley no lo resuelve expresamente. Una herencia todavía no aceptada no computa, según la Generalitat. Consúltelo.</p>' : "<p>Si el propietari és una comunitat o una herència ja acceptada però sense repartir, el raonable és que cada partícip compti la seva part; la llei no ho resol expressament. Una herència encara no acceptada no computa, segons la Generalitat. Consulti-ho.</p>";
      if (r.avisos.indexOf('cuotas') >= 0) cu3 += ES ? '<p>Ha contado partes de viviendas: se suman y solo cuentan por su total (1,5 = una vivienda y media).</p>' : "<p>Ha comptat parts d'habitatges: se sumen i només compten pel total (1,5 = un habitatge i mig).</p>";
      h += tarjeta('depende', T.igual, ES ? 'Sea o no gran tenedor' : 'Sigui o no gran tenidor', cu3, '');
      h += ES
        ? '<p class="limites">Resultado orientativo con los datos que ha indicado, según la legislación vigente el 20-10-2026 y las zonas tensionadas en vigor hoy (mapa revisado el ' + fmtF(ZD ? ZD.v : '2026-09-28') + '). No sustituye al estudio de su caso. Para el impuesto de transmisiones hay otra definición de gran tenedor, que aquí no se calcula.</p><a class="tool-cta" href="/desahucios/?viviendas_cat=' + (r.cat >= 5 ? '5mas' : (r.cat >= 2 ? '2-4' : '1')) + '#contacto">Consultar mi caso · primera consulta gratuita</a>'
        : "<p class=\"limites\">Resultat orientatiu amb les dades indicades, segons la legislació vigent el 20-10-2026 i les zones tensionades en vigor avui (mapa revisat el " + fmtF(ZD ? ZD.v : '2026-09-28') + "). No substitueix l'estudi del seu cas. Per a l'impost de transmissions hi ha una altra definició de gran tenidor, que aquí no es calcula.</p><a class=\"tool-cta\" href=\"/desahucios/ca/#contacte\">Consultar el meu cas · primera consulta gratuïta</a>";
      return h;
    };

    gt.addEventListener('submit', function(e){
      e.preventDefault();
      var errM = $('#gt-munis-err', gt);
      var restoEl = $('#gt-resto', gt), descEl = $('#gt-desc', gt);
      [restoEl, descEl].forEach(limpiarError);
      $$('.gt-fila input', gt).forEach(function(i){ i.removeAttribute('aria-invalid'); });
      errM.classList.add('oculto');
      var mal = function(el, msg){ el.setAttribute('aria-invalid', 'true'); errM.textContent = msg; errM.classList.remove('oculto'); el.focus(); };
      var NUM = CA ? 'Escrigui un número, per exemple 3 o 2,5.' : 'Escriba un número, por ejemplo 3 o 2,5.';
      var filas = [], fallo = false;
      $$('.gt-fila', gt).some(function(f){
        var mu = f.querySelector('.gt-muni'), n = f.querySelector('.gt-n');
        if (!mu.value.trim() && !n.value.trim()) return false;
        var m = D.municipio(mu.value, ZD);
        if (!m) { mal(mu, CA ? 'Triï el municipi de la llista.' : 'Elija el municipio de la lista.'); return fallo = true; }
        if (!n.value.trim()) { mal(n, CA ? 'Indiqui quants habitatges té a ' + m.nombre + '.' : 'Indique cuántas viviendas tiene en ' + m.nombre + '.'); return fallo = true; }
        if (!D.valido(n.value)) { mal(n, NUM); return fallo = true; }
        filas.push({ ine: m.ine, n: n.value });
        return false;
      });
      if (fallo) return;
      var malo = [restoEl, descEl].filter(function(i){ return !D.valido(i.value); })[0];
      if (malo) { errorEn(malo, NUM, malo); return; }
      if (!filas.length && !D._num(descEl.value) && !D._num(restoEl.value)) { mal($('.gt-muni', gt), T.falta); return; }
      var r = D.granTenedor({
        titular: val('titular') || 'fisica',
        excepcion: $('#gt-excepcion', gt).checked,
        filas: filas, desconocidas: descEl.value, resto: restoEl.value, datos: ZD, fecha: HOY,
        m2: val('m2') || 'no', usufructo: ($('#gt-usuf', gt) || {}).value || 0,
        cotitular: val('cotitular') || 'no', contrato: val('contrato'),
        problema: val('problema') || 'impago'
      });
      var out = $('#gt-resultado');
      out.innerHTML = pintar(r);
      out.classList.remove('oculto');
      out.scrollIntoView({behavior: 'smooth', block: 'start'});
      evento('herramienta_resultado', {herramienta: 'gran_tenedor', resultado: r.cataluna.r + '/' + r.estatal.r});
    });
  }
})();
