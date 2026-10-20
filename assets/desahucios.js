/* Motor de las dos herramientas de /desahucios/ (sin interfaz: la pinta
   /desahucios/assets/desahucios-ui.js). Se carga con defer.

   1) precio(): honorarios del despacho por fases, con IVA.
      Regla interna del despacho (tabla v2, 28-sept-2026, pendiente de
      validar por Marisa): los criterios del ICAB de 3-3-2020 que usaba la
      casa en su hoja de calculo. Grado 5 (verbal y verbales especiales) =
      1/3 x 0,8^4 = 13,653 % de la cuantia; sin oposicion, el 60 % (8,192 %);
      con vista, el 100 %. La cuantia es una anualidad de renta, o la deuda
      si es mayor (arts. 251.9.a y 252.2.a, ultimo parrafo, LEC).
      Los criterios del ICAB estan sin efecto desde el 1-10-2024: aqui son
      una regla INTERNA de precios, nunca se citan en la web.

   2) granTenedor(): tres respuestas (ley catalana, ley estatal, lo que no
      cambia) con la norma que decide cada una.
      - Llei 24/2015 art. 5.9 y 5.9 ter, redaccion de la Llei 11/2026, art. 103
        (DOGC 9706, 13-7-2026); DT 5.a: no se aplica a contratos anteriores al
        31-7-2026. Redaccion anterior (BOE-A-2015-9725, version de 2023):
        juridicas con mas de 10 viviendas; fisicas con mas de 15.
      - Llei 18/2007 art. 3.s.4.t (Llei 11/2026): fisicas «de deu» inmuebles
        (diez o mas): discrepancia con la Llei 24/2015 («mes de deu»).
      - Ley 12/2023 art. 3.k: mas de 10 inmuebles residenciales (sin garajes ni
        trasteros) o mas de 1.500 m2; 5 o mas en UNA MISMA zona tensionada si
        la comunidad lo particulariza (Cataluna: TER/800/2024 y TER/2408/2024,
        cada una su zona; no se suman entre zonas: informe conjunto DGTJ-AHC de
        24-3-2026, pregunta 5). Los municipios de cada zona llegan en `datos`
        (/desahucios/assets/zonas-tensionadas.js, generado de
        08_zonas_tensionadas.md); las declaraciones en tramite o pendientes de su publicacion en el BOE nunca cuentan,
        solo avisan.
   Verificado el 28-9-2026 y el 20-10-2026. Al cambiar una norma: tocar CONFIG y los tests
   (capa2_automatizacion/tests/web/desahucios.test.mjs). */
(function (global) {
  'use strict';

  var CONFIG = {
    verificado: '2026-10-20',
    iva: 0.21,
    grado5: (1 / 3) * Math.pow(0.8, 4),   // 13,653 %
    sinOposicion: 0.6,                     // 60 % del grado
    faseprevia: 300,
    demandadoAdicional: 125,
    minimoJudicial: 750,
    minimoVista: 400,
    rentaMediaBcn: 1160,                   // media de l'Incasol usada si no hay renta (precario)
    fechaCorte: '2026-07-31',              // DT 5.a Llei 24/2015
    gtNuevo: { cataluna: 5, espana: 10 },  // 5 o mas en Cat.; mas de 10 en Espana
    gtAntiguo: { juridica: 10, fisica: 15 },
    estatal: { inmuebles: 10, zona: 5 }
  };

  function r5(x) { return Math.round(x / 5) * 5; }
  function conIva(x) { return Math.round(x * (1 + CONFIG.iva) * 100) / 100; }
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = String(v == null ? '' : v).replace(/\s|€/g, '');
    // «1.250,5» o «1250.5»: el ultimo separador es el decimal si le siguen 1-2 cifras
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
    var n = parseFloat(s);
    return isFinite(n) && n > 0 ? n : 0;
  }

  /* opciones: { renta, deuda, demandados, sociedad } */
  function precio(o) {
    o = o || {};
    var renta = num(o.renta), deuda = num(o.deuda);
    var demandados = Math.max(1, Math.floor(num(o.demandados) || 1));
    var anualidad = renta * 12;
    var cuantia = Math.max(anualidad, deuda);
    var baseDeuda = deuda > anualidad;
    var g = CONFIG.grado5;
    var previa = CONFIG.faseprevia + CONFIG.demandadoAdicional * (demandados - 1);
    var judicial = Math.max(CONFIG.minimoJudicial, r5(g * CONFIG.sinOposicion * cuantia));
    var vista = Math.max(CONFIG.minimoVista, r5(g * (1 - CONFIG.sinOposicion) * cuantia));
    var total = previa + judicial;
    return {
      renta: renta, deuda: deuda, cuantia: cuantia, baseDeuda: baseDeuda,
      demandados: demandados,
      previa: previa, judicial: judicial, total: total, vista: vista,
      previaIva: conIva(previa), judicialIva: conIva(judicial),
      totalIva: conIva(total), vistaIva: conIva(vista),
      minimoAplicado: judicial === CONFIG.minimoJudicial,
      mensualidades: renta > 0 ? judicial / renta : null,
      tasa: o.sociedad ? 150 : 0
    };
  }

  /* ---------- zonas tensionadas ---------- */
  // Sin acentos, minúsculas y con el artículo movido: «Masnou, el» = «el Masnou» = «masnou»
  function normaliza(t) {
    var s = String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[’´`]/g, "'").replace(/\s+/g, ' ').trim();
    var m = s.match(/^(.*), (el|la|els|les|l'|los|las|lo)$/);
    if (m) s = m[1];
    return s.replace(/^(el|la|els|les|los|las|lo) /, '').replace(/^l'/, '').replace(/[^a-z0-9' ]/g, '').trim();
  }
  var _ind = null, _indDe = null;
  function indice(datos) {
    if (_indDe === datos) return _ind;
    var porIne = {}, porNombre = {};
    datos.m.forEach(function (x) {
      porIne[x[0]] = x;
      [x[1]].concat(x[3] || []).forEach(function (n) { var k = normaliza(n); if (!porNombre[k]) porNombre[k] = x; });
    });
    _ind = { ine: porIne, nombre: porNombre }; _indDe = datos;
    return _ind;
  }
  // Devuelve el municipio exacto o null (la interfaz ofrece la lista para elegir)
  function municipio(texto, datos) {
    datos = datos || global.CYA_ZONAS; if (!datos) return null;
    var x = indice(datos).nombre[normaliza(texto)];
    return x ? { ine: x[0], nombre: x[1], claves: x[2] ? x[2].split(' ') : [] } : null;
  }
  function activa(z, f) { return z.estado === 'vigente' && z.desde <= f && (!z.hasta || f <= z.hasta); }
  // Etiqueta de un municipio a una fecha: zona activa, y lo que está en trámite
  function zonaDe(ine, datos, f) {
    datos = datos || global.CYA_ZONAS;
    var x = indice(datos).ine[ine], Z = datos.zonas, ks = x && x[2] ? x[2].split(' ') : [];
    var act = ks.filter(function (k) { return activa(Z[k], f); })[0] || null;
    var r = { clave: act, id: act ? Z[act].id : null, desde: act ? Z[act].desde : null, res: act ? Z[act].res : null,
              sale: false, propuesta: null, vencida: null };
    ks.forEach(function (k) {
      var z = Z[k];
      var sigue = Object.keys(Z).some(function (o) { return Z[o].id === z.id && activa(Z[o], f); });
      if (z.estado === 'vigente' && z.hasta && f > z.hasta && !act && !sigue) r.vencida = { id: z.id, hasta: z.hasta };
      if ((z.estado === 'pendiente_boe' || z.estado === 'en_tramite') && !act && !ks.some(function (o) { return Z[o].id === z.id && Z[o].estado === 'vigente'; })) r.propuesta = z.id;
    });
    // Sale con la prórroga propuesta: está en una zona activa que tiene prórroga en trámite y no figura en ella
    if (act) {
      var prorroga = Object.keys(Z).filter(function (k) { return k !== act && Z[k].id === Z[act].id && Z[k].desde && Z[k].desde > f; })[0];
      if (prorroga && ks.indexOf(prorroga) < 0) r.sale = Z[prorroga].desde;
    }
    return r;
  }
  // filas: [{ine, n}] · desconocidas: nº de viviendas en Cataluña sin municipio
  function cuentaZonas(filas, desconocidas, datos, f) {
    var porZona = {}, futuro = {}, propuesta = {}, fuera = 0, res = {}, munis = {}, salen = [], vencidas = {};
    filas.forEach(function (fi) {
      var n = num(fi.n), z = zonaDe(fi.ine, datos, f), nom = indice(datos).ine[fi.ine][1];
      if (!n) return;
      if (z.id) {
        porZona[z.id] = (porZona[z.id] || 0) + n; res[z.id] = z.res;
        (munis[z.id] = munis[z.id] || []).push(nom);
        if (z.sale) salen.push(nom); else futuro[z.id] = (futuro[z.id] || 0) + n;
      } else {
        fuera += n;
        if (z.vencida) vencidas[z.vencida.id] = z.vencida.hasta;
        if (z.propuesta) { var p = propuesta[z.propuesta] = propuesta[z.propuesta] || { n: 0, munis: [] }; p.n += n; p.munis.push(nom); }
      }
    });
    var ids = Object.keys(porZona), max = 0, zmax = null, total = 0;
    ids.forEach(function (id) { total += porZona[id]; if (porZona[id] > max) { max = porZona[id]; zmax = id; } });
    var futMax = 0; Object.keys(futuro).forEach(function (id) { futMax = Math.max(futMax, futuro[id]); });
    return { porZona: porZona, fuera: fuera, desconocidas: num(desconocidas), max: max, zmax: zmax, total: total,
             res: res, munis: munis, salen: salen, futMax: futMax, propuesta: propuesta, vencidas: vencidas, fecha: f };
  }

  /* d: { titular: 'fisica'|'juridica'|'financiera', excepcion: bool,
          cat: n, resto: n, m2: 'si'|'no'|'nose', zona: n|null,
          cotitular: 'si'|'no'|'nose', contrato: 'antes'|'despues'|'' (sin contrato concreto: las dos),
          problema: 'impago'|'fin'|'otro',
          filas: [{ine, n}], desconocidas: n, fecha: 'AAAA-MM-DD', datos }
     Con `filas`, las viviendas de Cataluña son la suma de las filas y de las
     desconocidas, y la zona se calcula municipio a municipio; sin ellas, se
     usan `cat` y `zona` (número ya contado por el usuario). */
  function granTenedor(d) {
    d = d || {};
    var datos = d.datos || global.CYA_ZONAS, fecha = d.fecha || new Date().toISOString().slice(0, 10);
    var zonas = null;
    if (d.filas && datos) {
      zonas = cuentaZonas(d.filas, d.desconocidas, datos, fecha);
      d.cat = d.filas.reduce(function (a, fi) { return a + num(fi.n); }, 0) + zonas.desconocidas;
    }
    var cat = num(d.cat), esp = cat + num(d.resto);
    var zona = (d.zona === null || d.zona === '' || d.zona === undefined) ? null : num(d.zona);
    var titular = d.titular || 'fisica';
    var nuevo, antiguo, avisos = [];
    // Comunidad o herencia sin repartir: se computa como persona física por sus cuotas, con aviso
    if (titular === 'comunidad') { titular = 'fisica'; avisos.push('comunidad'); }

    // Ley catalana, redaccion de la Llei 11/2026 (contratos desde el 31-7-2026)
    if (titular === 'financiera') {
      nuevo = { r: 'si', regla: 'art. 5.9.a y c Llei 24/2015' };
    } else if (titular === 'juridica' && d.excepcion) {
      nuevo = { r: 'no', regla: 'excepciones del art. 5.9.b Llei 24/2015' };
    } else if (esp > CONFIG.gtNuevo.espana || cat >= CONFIG.gtNuevo.cataluna) {
      nuevo = { r: 'si', regla: titular === 'fisica' ? 'art. 5.9.d Llei 24/2015' : 'art. 5.9.b Llei 24/2015' };
    } else {
      nuevo = { r: 'no', regla: titular === 'fisica' ? 'art. 5.9.d Llei 24/2015' : 'art. 5.9.b Llei 24/2015' };
      if (titular === 'fisica' && esp === 10) avisos.push('diez');
    }

    // Redaccion anterior (contratos firmados antes del 31-7-2026, DT 5.a)
    if (titular === 'financiera') antiguo = 'si';
    else if (titular === 'juridica') antiguo = d.excepcion ? 'no' : (esp > CONFIG.gtAntiguo.juridica ? 'si' : 'no');
    else {
      // Redacción anterior del 5.9.d: «propietarias» de más de 15 viviendas (el usufructo no cuenta), o copropietaria
      // con cuota de más de 1.500 m² de SUELO. La casilla de los 1.500 m² construidos no basta: «depende», con aviso.
      var espAnt = Math.max(0, esp - num(d.usufructo));
      if (espAnt > CONFIG.gtAntiguo.fisica) antiguo = 'si';
      else if (d.m2 === 'si') { antiguo = 'depende'; avisos.push('m2_antiguo'); }
      else antiguo = 'no';
      if (num(d.usufructo) && esp > CONFIG.gtAntiguo.fisica && espAnt <= CONFIG.gtAntiguo.fisica) avisos.push('usufructo_antiguo');
    }

    var cataluna;
    if (d.contrato !== 'antes' && d.contrato !== 'despues') {
      // Sin un contrato concreto: la condición es por contrato (DT 5.ª), así que se dan las dos respuestas;
      // si coinciden, una sola. `doble` marca que no se preguntó por un contrato.
      cataluna = nuevo.r === antiguo
        ? { r: nuevo.r, regla: nuevo.regla + ' y redacción anterior (DT 5.ª)', doble: true, futuro: nuevo.r, antiguo: antiguo }
        : { r: 'depende', regla: 'DT 5.ª Llei 24/2015: la definición de 2026 solo rige para los contratos desde el 31-7-2026', doble: true, futuro: nuevo.r, antiguo: antiguo };
    } else if (d.contrato === 'antes') {
      cataluna = { r: antiguo, regla: 'redacción anterior del art. 5.9 (DT 5.ª Llei 24/2015)', futuro: nuevo.r, regla_futuro: nuevo.regla };
      if (antiguo === 'no' && nuevo.r === 'si') avisos.push('solo_futuro');
    } else {
      cataluna = { r: nuevo.r, regla: nuevo.regla };
    }

    // Ley estatal (lo que se declara en la demanda, art. 439.6.b LEC)
    var estatal;
    if (esp > CONFIG.estatal.inmuebles || d.m2 === 'si') {
      estatal = { r: 'si', regla: 'art. 3.k Ley 12/2023' };
    } else if (zonas) {
      var Zs = CONFIG.estatal.zona;
      if (zonas.max >= Zs) {
        estatal = { r: 'si', regla: 'art. 3.k Ley 12/2023 y Res. ' + zonas.res[zonas.zmax] + ' (zona tensionada ' + zonas.zmax.replace('ZMRT', '') + ')', zona: zonas.zmax };
        if (zonas.futMax < Zs && zonas.salen.length) avisos.push('cambio_2027_sale');
      } else if (zonas.desconocidas && zonas.max + zonas.desconocidas >= Zs) {
        estatal = { r: 'depende', regla: 'depende de dónde estén las viviendas sin municipio' };
      } else {
        estatal = { r: 'no', regla: 'art. 3.k Ley 12/2023' };
        if (zonas.total >= Zs) avisos.push('zonas_separadas');
        if (d.m2 === 'nose') avisos.push('m2');
      }
      if (zonas.max < Zs && Object.keys(zonas.propuesta).some(function (id) { return zonas.propuesta[id].n >= Zs; })) avisos.push('zona_propuesta');
      if (Object.keys(zonas.vencidas).length) avisos.push('vencida');
    } else if (zona !== null && zona >= CONFIG.estatal.zona) {
      estatal = { r: 'si', regla: 'art. 3.k Ley 12/2023 y Res. TER/800/2024 (zona tensionada)' };
    } else if (zona === null && cat >= CONFIG.estatal.zona) {
      estatal = { r: 'depende', regla: 'depende de cuántas estén en zona tensionada' };
    } else {
      estatal = { r: 'no', regla: 'art. 3.k Ley 12/2023' };
      if (d.m2 === 'nose') avisos.push('m2');
    }

    if (d.cotitular === 'si') avisos.push('cotitular');
    if (d.cotitular === 'nose') avisos.push('cotitular_nose');
    if (cat !== Math.floor(cat) || num(d.resto) !== Math.floor(num(d.resto))) avisos.push('cuotas');

    return { cat: cat, esp: esp, zona: zona, titular: d.titular || 'fisica', problema: d.problema || 'impago',
             contrato: d.contrato || null, cataluna: cataluna, estatal: estatal, avisos: avisos, zonas: zonas };
  }

  /* Un campo numérico es válido si está vacío o es un número no negativo escrito
     como lo escribe una persona (1.250,50 · 1250.5 · 3). Nada de «cinco», «1e5» ni «-2». */
  function valido(v) {
    var s = String(v == null ? '' : v).trim().replace(/\s|€/g, '');
    if (s === '') return true;
    return /^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+([.,]\d+)?$/.test(s);
  }

  var api = { CONFIG: CONFIG, precio: precio, granTenedor: granTenedor, valido: valido, municipio: municipio,
              zonaDe: zonaDe, normaliza: normaliza, _num: num, _r5: r5 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CYA_DESAHUCIOS = api;
})(typeof window !== 'undefined' ? window : globalThis);
