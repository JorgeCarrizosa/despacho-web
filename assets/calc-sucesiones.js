/* ===========================================================================
   Impuesto sobre Sucesiones y Donaciones de Cataluña — motor de cálculo.

   Fuente ÚNICA y verificada: Decreto Legislativo 1/2024, de 12 de marzo, por
   el que se aprueba el libro sexto del Código tributario de Catalunya
   (DOGC 9122 de 14-03-2024 · BOE-A-2024-6951, BOE núm. 87 de 09-04-2024),
   texto consolidado. Cada tabla lleva al lado el artículo del que sale.

   OJO al citar: este decreto DEROGÓ la Ley 19/2010 con efectos de 15 de marzo
   de 2024, así que los antiguos arts. 57, 58 y 58 bis ya no son cita válida.
   Equivalencias: 57 -> 633-1 · 58 -> 633-3 · 58 bis -> 633-4 · 2 -> 631-2.

   Vive en un solo fichero a propósito: hasta el 16-09-2026 había dos
   implementaciones distintas del mismo cálculo en tres páginas, y cuando
   cambie la ley hay que poder tocar un sitio y no buscarlas.

   Verificado numéricamente contra el articulado; los casos de prueba están en
   la suite que acompaña a este fichero.
   =========================================================================== */
(function (global) {
  'use strict';

  /* --- Art. 633-1. Tarifa general -----------------------------------------
     Tramos como [anchura_del_tramo, tipo%]. Acumulados: 50.000 / 150.000 /
     400.000 / 800.000, y de ahí en adelante el 32 %.                        */
  var TARIFA = [[50000, 7], [100000, 11], [250000, 17], [400000, 24]];
  var TIPO_ULTIMO = 32;

  /* --- Art. 633-3. Coeficientes multiplicadores por patrimonio preexistente
     Los grupos III y IV tienen coeficiente fijo sea cual sea el patrimonio. */
  var COEF_I_II = [
    [500000, 1.0000],      // de 0 a 500.000
    [2000000, 1.1000],     // de 500.000,01 a 2.000.000
    [4000000, 1.1500],     // de 2.000.000,01 a 4.000.000
    [Infinity, 1.2000]     // más de 4.000.000
  ];
  var COEF_III = 1.5882;
  var COEF_IV = 2.0000;

  /* --- Art. 633-4.2. Bonificación: porcentajes MARGINALES por tramos de
     BASE IMPONIBLE (no liquidable). El resultado es la media ponderada.     */
  var BONIF_GI = [[100000, 99], [100000, 97], [100000, 95], [200000, 90],
                  [250000, 80], [250000, 70], [500000, 60], [500000, 50],
                  [500000, 40], [500000, 25], [Infinity, 20]];
  var BONIF_GII = [[100000, 60], [100000, 55], [100000, 50], [200000, 45],
                   [250000, 40], [250000, 35], [500000, 30], [500000, 25],
                   [500000, 20], [500000, 10], [Infinity, 0]];

  /* --- Art. 631-2. Reducción por parentesco ------------------------------ */
  var REDUCCION_PARENTESCO = {
    conyuge: 100000,       // Grupo II - cónyuge (y pareja estable, art. 634-1)
    hijo: 100000,          // Grupo II - hijo o hija
    descendiente: 50000,   // Grupo II - resto de descendientes (nietos...)
    ascendiente: 30000,    // Grupo II - ascendientes
    grupo3: 8000,          // Grupo III - colaterales 2.º y 3.er grado
    grupo4: 0              // Grupo IV - sin reducción
    // Grupo I (menores de 21) se calcula aparte: depende de la edad.
  };

  /* Grupo de parentesco de cada opción, a efectos de coeficiente y bonificación. */
  var GRUPO = {
    conyuge: 2, menor21: 1, hijo: 2, descendiente: 2,
    ascendiente: 2, grupo3: 3, grupo4: 4
  };

  function escalonado(base, tramos, tipoUltimo) {
    var total = 0, resto = base;
    for (var i = 0; i < tramos.length && resto > 0; i++) {
      var t = Math.min(resto, tramos[i][0]);
      total += t * tramos[i][1] / 100;
      resto -= t;
    }
    if (resto > 0) total += resto * tipoUltimo / 100;
    return total;
  }

  /* Art. 633-4.2: "porcentaje medio ponderado que resulte de la aplicación
     para cada tramo de base imponible de los siguientes porcentajes".

     Art. 633-4.5: "el porcentaje medio ponderado resultante debe tener solo
     dos decimales, de modo que se aproximan las milésimas a la centésima más
     próxima: si la milésima es igual o inferior a 5, se mantiene la centésima;
     si es superior a 5, se aproxima a la centésima superior."

     ------------------------------------------------------------------------
     LA NORMA SE CONTRADICE A SÍ MISMA, y conviene dejarlo escrito:
     el porcentaje medio del grupo II a una base de 2.000.000 € es exactamente
     35,875. Aplicando la regla LITERAL del apartado 5 (milésima = 5, "se
     mantiene la centésima") saldría 35,87 — pero la TABLA del propio
     art. 633-4.2.b publica 35,88 en ese umbral.

     Se usa el redondeo a la centésima más próxima, que es lo que dice la
     primera frase del apartado y lo único que reproduce las VEINTE cifras
     publicadas por el BOE (comprobado una a una en la suite). La coletilla del
     "igual o inferior a 5" solo desempata, y en el único punto donde el empate
     se da de verdad la Administración publica el valor superior.
     Impacto de la discrepancia: unas decenas de euros en bases muy altas.
     ------------------------------------------------------------------------ */
  function redondeoLegal(pct) {
    return Math.round(pct * 100) / 100;
  }

  function bonificacionMedia(baseImponible, tabla) {
    if (baseImponible <= 0) return 0;
    var suma = 0, resto = baseImponible;
    for (var i = 0; i < tabla.length && resto > 0; i++) {
      var t = Math.min(resto, tabla[i][0]);
      suma += t * tabla[i][1];
      resto -= t;
    }
    return redondeoLegal(suma / baseImponible);
  }

  function coeficiente(grupo, patrimonio) {
    if (grupo === 3) return COEF_III;
    if (grupo === 4) return COEF_IV;
    var p = Math.max(0, Number(patrimonio) || 0);
    for (var i = 0; i < COEF_I_II.length; i++) {
      if (p <= COEF_I_II[i][0]) return COEF_I_II[i][1];
    }
    return COEF_I_II[COEF_I_II.length - 1][1];
  }

  /**
   * datos = {
   *   herencia:   número. Valor total heredado (base imponible).
   *   parentesco: 'conyuge'|'menor21'|'hijo'|'descendiente'|'ascendiente'|'grupo3'|'grupo4'
   *   edad:       número. Solo si parentesco === 'menor21'.
   *   vivienda:   número. Valor de la vivienda habitual del causante que se
   *               hereda, YA INCLUIDO dentro de `herencia`. 0 si no la hereda.
   *   patrimonio: número. Patrimonio preexistente del heredero.
   *   situacion:  ''|'discap33'|'discap65'|'mayor75'
   * }
   */
  function calcular(datos) {
    var herencia = Math.max(0, Number(datos.herencia) || 0);
    var clave = datos.parentesco || 'hijo';
    var grupo = GRUPO[clave] || 2;
    var detalle = [];
    var noAplicadas = [];

    // 1. Reducción por parentesco (art. 631-2)
    var rParentesco;
    if (clave === 'menor21') {
      // "100.000, más 12.000 euros por cada año de menos de veintiuno que
      //  tenga el causahabiente, hasta un límite de 196.000 euros"
      var edad = Math.max(0, Math.min(20, Number(datos.edad)));
      if (isNaN(Number(datos.edad))) edad = 20;
      rParentesco = Math.min(100000 + 12000 * (21 - edad), 196000);
    } else {
      rParentesco = REDUCCION_PARENTESCO[clave];
      if (rParentesco === undefined) rParentesco = 0;
    }
    if (rParentesco > 0) detalle.push({ concepto: 'Parentesco', importe: rParentesco, art: '631-2' });

    // 2. Reducción por vivienda habitual (art. 631-17): 95 %, límite 500.000
    //    por el valor conjunto. El mínimo individual de 180.000 solo entra al
    //    prorratear entre varios sujetos pasivos, y aquí calculamos uno.
    //
    //    Quién puede aplicarla: el art. 631-17 la reserva a cónyuge,
    //    descendientes, ascendientes y colaterales del causante, así que el
    //    grupo IV (colaterales de 4.º grado y extraños) queda fuera.
    //
    //    Y los COLATERALES (grupo III) tienen un requisito propio que es fácil
    //    pasar por alto, art. 631-18.2: "deben ser mayores de sesenta y cinco
    //    años y deben haber convivido con el causante como mínimo los dos años
    //    anteriores a su muerte". Sin eso no les corresponde.
    var rVivienda = 0;
    var vivienda = Math.max(0, Number(datos.vivienda) || 0);
    var puedeVivienda = (grupo !== 4) &&
                        (grupo !== 3 || datos.colateralConviviente === true);
    if (vivienda > 0 && puedeVivienda) {
      rVivienda = Math.min(vivienda * 0.95, 500000);
      detalle.push({ concepto: 'Vivienda habitual', importe: rVivienda, art: '631-17' });
    } else if (vivienda > 0) {
      // Se ha pedido y NO procede. Hay que decirlo: si la cifra entra y el
      // resultado no se mueve sin explicación, parece que la calculadora falla.
      noAplicadas.push({ concepto: 'Vivienda habitual', art: '631-17',
                         motivo: grupo === 4 ? 'vivienda_grupo4' : 'vivienda_colateral' });
    }

    // 3. Discapacidad (art. 631-3) o persona mayor de 75 (art. 631-4).
    //    El art. 631-4.2 las declara incompatibles entre sí.
    var rPersonal = 0;
    if (datos.situacion === 'discap33') { rPersonal = 275000; detalle.push({ concepto: 'Discapacidad ≥ 33 %', importe: rPersonal, art: '631-3' }); }
    else if (datos.situacion === 'discap65') { rPersonal = 650000; detalle.push({ concepto: 'Discapacidad ≥ 65 %', importe: rPersonal, art: '631-3' }); }
    else if (datos.situacion === 'mayor75' && grupo === 2) { rPersonal = 275000; detalle.push({ concepto: '75 años o más', importe: rPersonal, art: '631-4' }); }
    else if (datos.situacion === 'mayor75') {
      // El art. 631-4 la reserva a "personas del grupo II": un hermano de 78
      // años la elige y no le corresponde. Mismo silencio que el anterior.
      noAplicadas.push({ concepto: '75 años o más', art: '631-4', motivo: 'edad_solo_grupo2' });
    }

    var reducciones = rParentesco + rVivienda + rPersonal;
    var baseLiquidable = Math.max(0, herencia - reducciones);

    // 4. Cuota íntegra (art. 633-1) sobre la base LIQUIDABLE
    var cuotaIntegra = escalonado(baseLiquidable, TARIFA, TIPO_ULTIMO);

    // 5. Cuota tributaria (art. 633-3) = íntegra x coeficiente
    var coef = coeficiente(grupo, datos.patrimonio);
    var cuotaTributaria = cuotaIntegra * coef;

    // 6. Bonificación (art. 633-4) sobre la BASE IMPONIBLE, no la liquidable
    var bonif = 0;
    if (clave === 'conyuge') bonif = 99;                       // art. 633-4.1
    else if (grupo === 1) bonif = bonificacionMedia(herencia, BONIF_GI);
    else if (grupo === 2) bonif = bonificacionMedia(herencia, BONIF_GII);
    // Grupos III y IV: el art. 633-4 no les reconoce bonificación.

    var aPagar = cuotaTributaria * (1 - bonif / 100);

    return {
      baseImponible: herencia,
      reducciones: reducciones,
      detalleReducciones: detalle,
      noAplicadas: noAplicadas,
      baseLiquidable: baseLiquidable,
      cuotaIntegra: cuotaIntegra,
      coeficiente: coef,
      cuotaTributaria: cuotaTributaria,
      bonificacion: bonif,
      aPagar: Math.max(0, aPagar)
    };
  }

  var api = { calcular: calcular, bonificacionMedia: bonificacionMedia,
              redondeoLegal: redondeoLegal,
              coeficiente: coeficiente, TARIFA: TARIFA, BONIF_GI: BONIF_GI,
              BONIF_GII: BONIF_GII, REDUCCION_PARENTESCO: REDUCCION_PARENTESCO };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.CYA_SUCESIONES = api;
})(typeof window !== 'undefined' ? window : this);
