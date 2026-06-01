document.getElementById('btn-explorar').addEventListener('click', function() {
  const portada = document.getElementById('portada');
  const sistema = document.getElementById('contenido-sistema');

  // 1. Desvanece la portada con opacidad suave
  portada.classList.add('desvanecer');

  // 2. Intercambia las vistas al terminar la animación sin parpadeos blancos
  setTimeout(() => {
    portada.classList.add('oculto');
    sistema.classList.remove('oculto');
    window.scrollTo(0, 0);
  }, 600);
});
// ==========================================================================
// LÓGICA DE CONTROL DE ESCENARIOS - SURISIM BOLIVIA
// ==========================================================================

// Objeto con los datos exactos extraídos de la captura de pantalla
const escenariosCrisis = {
  basal: {
    ingreso: 4500,
    dolar: 6.96,
    escasez: 0,
    sustitucion: -10,
    miembros: 4
  },
  cambiaria: {
    ingreso: 3500,
    dolar: 13.00,
    escasez: 15,
    sustitucion: -20,
    miembros: 4
  },
  horticola: {
    ingreso: 3800,
    dolar: 9.50,
    escasez: 80,
    sustitucion: -40,
    miembros: 5
  },
  tormenta: {
    ingreso: 2800,
    dolar: 15.50,
    escasez: 90,
    sustitucion: -5,
    miembros: 5
  }
};

/**
 * Función para cargar los parámetros de un escenario en los inputs del simulador
 * @param {string} claveEscenario - Nombre del escenario seleccionado
 */
function cargarEscenario(claveEscenario) {
  const datos = escenariosCrisis[claveEscenario];
  
  if (!datos) {
    console.error("El escenario seleccionado no existe.");
    return;
  }

  // 1. Inyección de valores en los inputs del formulario (Asegúrate de que los IDs coincidan)
  if (document.getElementById('input-ingreso')) {
    document.getElementById('input-ingreso').value = datos.ingreso;
  }
  if (document.getElementById('input-dolar')) {
    document.getElementById('input-dolar').value = datos.dolar;
  }
  if (document.getElementById('input-escasez')) {
    document.getElementById('input-escasez').value = datos.escasez;
  }
  if (document.getElementById('input-sustitucion')) {
    document.getElementById('input-sustitucion').value = datos.sustitucion;
  }
  if (document.getElementById('input-miembros')) {
    document.getElementById('input-miembros').value = datos.miembros;
  }

  // 2. Gestión visual del estado "CARGADO" en las tarjetas
  actualizarEstadoVisualTarjetas(claveEscenario);

  // 3. Lanzar el cálculo matemático automáticamente al cargar (Opcional)
  if (typeof calcularSimulacion === 'function') {
    calcularSimulacion();
  }
  
  console.log(`✅ Escenario [${claveEscenario}] cargado con éxito en el simulador.`);
}

/**
 * Cambia dinámicamente las clases CSS y el texto de los botones para reflejar cuál está activo
 */
function actualizarEstadoVisualTarjetas(claveActiva) {
  // Buscamos todas las tarjetas de perfil dentro de la sección de casos
  const tarjetas = document.querySelectorAll('.tarjeta-perfil');
  
  // Mapeo simple para identificar las posiciones según el orden del HTML
  const indices = { basal: 0, cambiaria: 1, horticola: 2, tormenta: 3 };
  const indiceActivo = indices[claveActiva];

  tarjetas.forEach((tarjeta, index) => {
    const boton = tarjeta.querySelector('button');
    
    if (index === indiceActivo) {
      // Aplicar estilo activo/seleccionado de la captura
      tarjeta.classList.add('perfil-activo');
      
      // Agregar el punto de notificación si no existe
      if (!tarjeta.querySelector('.punto-notificacion-rojo')) {
        const punto = document.createElement('div');
        punto.className = 'punto-notificacion-rojo';
        tarjeta.appendChild(punto);
      }

      // Transformar el botón a modo "CARGADO"
      if (boton) {
        boton.className = 'btn-escenario-cargado';
        boton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          CARGADO
        `;
      }
    } else {
      // Restaurar tarjetas inactivas
      tarjeta.classList.remove('perfil-activo');
      
      const puntoExistente = tarjeta.querySelector('.punto-notificacion-rojo');
      if (puntoExistente) puntoExistente.remove();

      if (boton) {
        boton.className = 'btn-simular-scenario'; // Mantiene la clase CSS de estilos.css
        boton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          SIMULAR ESCENARIO
        `;
      }
    }
  });
}
// ==========================================================================
// CONTROLADOR COMPLETO DEL SIMULADOR - SURISIM BOLIVIA
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  inicializarControlesDeslizantes();
  calcularSimulacion(); // Cómputo inicial simulado
});

function inicializarControlesDeslizantes() {
  const inputs = [
    { id: 'input-ingreso', valId: 'val-ingreso', sufijo: ' Bs. / mes' },
    { id: 'input-miembros', valId: 'val-miembros', sufijo: ' Personas' },
    { id: 'input-dolar', valId: 'val-dolar', sufijo: ' Bs. / USD' },
    { id: 'input-escasez', valId: 'val-escasez', sufijo: '% de Escasez' },
    { id: 'input-sustitucion', valId: 'val-sustitucion', sufijo: '% Sustituido' },
    { id: 'input-gastos', valId: 'val-gastos', sufijo: '% No Esenciales' }
  ];

  inputs.forEach(control => {
    const elInput = document.getElementById(control.id);
    if (elInput) {
      elInput.addEventListener('input', (e) => {
        // Actualizar etiqueta textual de inmediato
        document.getElementById(control.valId).innerText = parseFloat(e.target.value).toLocaleString('de-DE') + control.sufijo;
        // Lanzar motor de cálculo matemático
        calcularSimulacion();
      });
    }
  });
}

function calcularSimulacion() {
  // Captura de valores actuales desde los inputs
  const ingreso = parseFloat(document.getElementById('input-ingreso')?.value || 2800);
  const miembros = parseInt(document.getElementById('input-miembros')?.value || 5);
  const dolar = parseFloat(document.getElementById('input-dolar')?.value || 15.50);
  const escasez = parseFloat(document.getElementById('input-escasez')?.value || 90);
  const sustitucion = parseFloat(document.getElementById('input-sustitucion')?.value || 5);
  const gastosReducidos = parseFloat(document.getElementById('input-gastos')?.value || 5);

  // --- MODELO MATEMÁTICO DE PRECIOS POPULARES ---
  // Canasta basal normal aproximada de referencia en Bolivia para familias
  const costoBasalReferencia = 3830; 
  
  // Factores multiplicadores de la inflación de costos
  const factorDolar = 1 + ((dolar - 6.96) / 6.96) * 0.45; // Elasticidad cambiaria ponderada
  const factorDiesel = 1 + (escasez / 100) * 0.35;         // Impacto logístico de transporte
  const factorMitigacion = 1 - (sustitucion / 100) * 0.15 - (gastosReducidos / 100) * 0.10;

  // Cálculo final ponderado de la canasta simulada
  let costoCanastaSimulada = costoBasalReferencia * factorDolar * factorDiesel * factorMitigacion;
  
  // Ajuste por número de miembros familiares
  costoCanastaSimulada = costoCanastaSimulada * (0.7 + (miembros * 0.06));

  const saldoPresupuesto = ingreso - costoCanastaSimulada;
  const porcentajeAlza = ((costoCanastaSimulada - costoBasalReferencia) / costoBasalReferencia) * 100;
  
  // Poder de compra real inversamente proporcional al incremento de costos
  let poderCompra = Math.round((costoBasalReferencia / costoCanastaSimulada) * 100);
  if(poderCompra > 100) poderCompra = 100;

  // --- RENDERIZACIÓN DE RESULTADOS EN PANTALLA ---
  if(document.getElementById('res-presupuesto')) {
    document.getElementById('res-presupuesto').innerText = `${Math.round(saldoPresupuesto).toLocaleString('de-DE')} Bs.`;
    // Cambiar color de alerta según déficit o superávit
    document.getElementById('res-presupuesto').style.color = saldoPresupuesto < 0 ? '#ff3333' : '#2ecc71';
  }
  if(document.getElementById('res-promedio')) document.getElementById('res-promedio').innerText = `${Math.round(costoCanastaSimulada).toLocaleString('de-DE')} Bs.`;
  if(document.getElementById('res-alza')) document.getElementById('res-alza').innerText = `+${Math.round(porcentajeAlza)}%`;
  if(document.getElementById('res-poder')) {
    document.getElementById('res-poder').innerText = `${poderCompra}%`;
    document.getElementById('sub-poder').innerText = `Pérdida real: ${100 - poderCompra}% de valor`;
    document.getElementById('prog-poder').style.width = `${poderCompra}%`;
  }

  // Ajustar diagnóstico dinámico según resultados reales de estrés económico
  actualizarCajaDiagnostico(saldoPresupuesto, porcentajeAlza);

  // Dibujar los resultados matemáticos en el lienzo gráfico
  dibujarGraficoTemporal(costoBasalReferencia, costoCanastaSimulada);
}

function actualizarCajaDiagnostico(saldo, alza) {
  const txtDiag = document.getElementById('txt-diagnostico-dinamico');
  if (!txtDiag) return;

  if (saldo < -2000) {
    txtDiag.innerText = "Situación crítica extrema en el hogar. El desabastecimiento severo de combustibles y la disparidad del dólar paralelo devalúan drásticamente las remuneraciones. Existe riesgo inminente de inseguridad alimentaria familiar.";
  } else if (saldo < 0) {
    txtDiag.innerText = "Tensión financiera moderada. Los ingresos familiares cubren de forma muy justa la adquisición de víveres esenciales. Se aconseja incrementar las estrategias de sustitución nacional ('Hecho en Bolivia').";
  } else {
    txtDiag.innerText = "Presupuesto familiar en rango estable. La composición del ingreso u optimización de canastas mitiga efectivamente los impactos de la inflación importada del mercado paralelo actual.";
  }
}

// --- MOTOR GRÁFICO NATIVO EN CANVAS (image_60a282.png) ---
function dibujarGraficoTemporal(basal, crisis) {
  const canvas = document.getElementById('graficoSimulacion');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Limpiar lienzo anterior
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const paddingLeft = 60;
  const paddingBottom = 40;
  const graphWidth = canvas.width - paddingLeft - 20;
  const graphHeight = canvas.height - paddingBottom - 20;

  // Dibujar líneas guía de fondo (Eje Y)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const lineasGuia = [0, 0.25, 0.5, 0.75, 1];
  
  lineasGuia.forEach(ratio => {
    const y = 20 + graphHeight * (1 - ratio);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();

    // Textos de referencia monetaria a la izquierda
    ctx.fillStyle = '#475569';
    ctx.font = '10px sans-serif';
    const valorReferencia = Math.round(crisis * 1.1 * ratio);
    ctx.fillText(`${valorReferencia.toLocaleString('de-DE')} Bs.`, 10, y + 4);
  });

  // Dibujar etiquetas de meses (Eje X)
  const pasoX = graphWidth / (meses.length - 1);
  meses.forEach((mes, idx) => {
    const x = paddingLeft + (idx * pasoX);
    ctx.fillStyle = '#475569';
    ctx.font = '10px sans-serif';
    ctx.fillText(mes, x - 10, canvas.height - 15);
  });

  // --- 1. LÍNEA CANASTA BASAL NORMAL (Línea segmentada gris) ---
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]); // Estilo segmentado
  ctx.beginPath();
  meses.forEach((_, idx) => {
    const x = paddingLeft + (idx * pasoX);
    // Simular pequeña variación aleatoria estacional sutil
    const variacionBasal = basal + Math.sin(idx) * 50;
    const y = canvas.height - paddingBottom - ((variacionBasal / (crisis * 1.1)) * graphHeight);
    if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // --- 2. LÍNEA COSTO EN CRISIS (Línea continua roja con puntos) ---
  ctx.setLineDash([]); // Restaurar línea continua
  ctx.strokeStyle = '#ff3333';
  ctx.lineWidth = 2.5;
  
  let puntosCrisis = [];
  meses.forEach((_, idx) => {
    const x = paddingLeft + (idx * pasoX);
    // Simulación mes a mes con fluctuaciones reales del mercado
    const fluctuacion = crisis + Math.sin(idx * 1.5) * 120 + (idx * 15);
    const y = canvas.height - paddingBottom - ((fluctuacion / (crisis * 1.1)) * graphHeight);
    puntosCrisis.push({x, y});
  });

  ctx.beginPath();
  puntosCrisis.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Dibujar círculos sobre los puntos clave de la crisis
  puntosCrisis.forEach(pt => {
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Leyenda interna del gráfico en la esquina superior izquierda
  ctx.fillStyle = '#ff3333';
  ctx.beginPath(); ctx.arc(80, 25, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText('Costo de Canasta en Crisis', 90, 28);

  ctx.strokeStyle = '#475569';
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(250, 25); ctx.lineTo(270, 25); ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.setLineDash([]);
  ctx.fillText('Canasta Basal Normal', 278, 28);
}
// ==========================================================================
// EVALUADOR DEL CUESTIONARIO DE COMPRENSIÓN ECONÓMICA
// ==========================================================================

function evaluarCuestionario(event) {
  // Evitar que la página se recargue por el submit del formulario
  event.preventDefault();

  const bloquesPregunta = document.querySelectorAll('.bloque-pregunta');
  let todasRespondidas = true;
  let aciertos = 0;

  // 1. Verificar si todas las preguntas tienen una opción marcada
  bloquesPregunta.forEach((bloque, index) => {
    const seleccionada = bloque.querySelector(`input[name="p${index + 1}"]:checked`);
    if (!seleccionada) {
      todasRespondidas = false;
    }
  });

  if (!todasRespondidas) {
    const txtAyuda = document.getElementById('txt-ayuda-evaluacion');
    if (txtAyuda) {
      txtAyuda.innerText = "❌ Por favor, responda todas las preguntas antes de calificar.";
      txtAyuda.style.color = "#ff3333";
    }
    return;
  }

  // 2. Procesar respuestas y aplicar estilos visuales exactos
  bloquesPregunta.forEach((bloque, index) => {
    const respuestaCorrecta = bloque.getAttribute('data-respuesta-correcta');
    const radioSeleccionado = bloque.querySelector(`input[name="p${index + 1}"]:checked`);
    const valorSeleccionado = radioSeleccionado.value;
    
    const todasLasOpciones = bloque.querySelectorAll('.opcion-respuesta');
    const cajaFeedback = bloque.querySelector('.feedback-pregunta');

    // Limpiar clases previas de intentos anteriores
    todasLasOpciones.forEach(opcion => {
      opcion.classList.remove('opcion-correcta-marcada', 'opcion-incorrecta-marcada');
    });

    if (valorSeleccionado === respuestaCorrecta) {
      // Marcado Correcto
      radioSeleccionado.closest('.opcion-respuesta').classList.add('opcion-correcta-marcada');
      cajaFeedback.className = "feedback-pregunta val-ok";
      cajaFeedback.innerText = "✓ ¡Correcto!";
      aciertos++;
    } else {
      // Marcado Incorrecto
      radioSeleccionado.closest('.opcion-respuesta').classList.add('opcion-incorrecta-marcada');
      
      // Mostrar visualmente dónde estaba la respuesta correcta para retroalimentación
      todasLasOpciones.forEach(opcion => {
        if(opcion.querySelector('input').value === respuestaCorrecta) {
          opcion.classList.add('opcion-correcta-marcada');
        }
      });

      cajaFeedback.className = "feedback-pregunta val-error";
      cajaFeedback.innerText = `✗ Incorrecto. La opción correcta era la ${respuestaCorrecta}.`;
    }
  });

  // 3. Mostrar resumen global de la evaluación en el pie del panel
  const txtAyuda = document.getElementById('txt-ayuda-evaluacion');
  if (txtAyuda) {
    txtAyuda.innerText = `Resultados: ${aciertos} de ${bloquesPregunta.length} correctas.`;
    txtAyuda.style.color = aciertos === bloquesPregunta.length ? "#2ecc71" : "#ff9f43";
  }
}
// ===================================================
// CONTROLADOR DE CASOS DE ESTUDIO INTERACTIVOS
// ===================================================
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Diccionario de datos con los valores exactos requeridos por la guía docente
  const escenariosDePrueba = {
    1: {
      // Caso 1: Reserva de carburante
      reserva: 10000,
      consumo: 1200,
      reabastecimiento: 300,
      critico: 2000
    },
    2: {
      // Caso 2: Aumento del precio de alimentos (Diferencia de variaciones)
      precioAnteriorArroz: 8,  precioActualArroz: 11,  cantArroz: 10,
      precioAnteriorPapa: 7,   precioActualPapa: 10,   cantPapa: 8,
      precioAnteriorAceite: 12, precioActualAceite: 18, cantAceite: 4
    },
    3: {
      // Caso 3: Transporte con desvío
      distanciaNormal: 10,
      distanciaDesvio: 16,
      costoKm: 2,
      viajesSemana: 5
    },
    4: {
      // Caso 4: Presupuesto familiar
      presupuesto: 500,
      totalCompra: 580
    },
    5: {
      // Caso 5: Rumor de escasez
      demandaNormal: 100,
      aumentoRumor: 40, // Representa el 40%
      stockDisponible: 120
    },
    6: {
      // Caso 6: Tormenta Perfecta (Tu escenario avanzado combinado)
      dolarParalelo: 15.50,
      escasezDiesel: 90,
      sustitucionLocal: 5,
      miembrosHogar: 5
    }
  };

  // 2. Seleccionar todos los botones de simulación dentro de la cuadrícula de casos
  const botonesSimular = document.querySelectorAll(".grid-casos-seis .btn-simular-caso");

  botonesSimular.forEach((boton, indice) => {
    boton.addEventListener("click", () => {
      const numeroCaso = indice + 1;
      const datos = escenariosDePrueba[numeroCaso];
      
      console.log(`Cargando Caso de Estudio ${numeroCaso}...`, datos);
      
      // Ejecutar la carga de datos según el caso seleccionado
      cargarDatosEnTablero(numeroCaso, datos);
    });
  });

  // 3. Función encargada de mapear los datos hacia tus inputs/sliders existentes
  function cargarDatosEnTablero(caso, datos) {
    
    // Alerta visual de carga exitosa
    const notificacion = document.createElement("div");
    notificacion.style.cssText = "position:fixed; bottom:20px; right:20px; background:#e63946; color:#fff; padding:12px 24px; border-radius:8px; font-weight:bold; z-index:9999; font-family:sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.3);";
    notificacion.innerText = `✅ Caso ${caso} inyectado al simulador con éxito`;
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 2500);

    // Mapeo condicional hacia tus controles reales del DOM
    switch(caso) {
      case 1:
        // Intenta buscar tus inputs de combustible (ajusta los ID según los tuyos si varían)
        if(document.getElementById("input-reserva")) document.getElementById("input-reserva").value = datos.reserva;
        if(document.getElementById("input-consumo")) document.getElementById("input-consumo").value = datos.consumo;
        if(document.getElementById("input-reabastecimiento")) document.getElementById("input-reabastecimiento").value = datos.reabastecimiento;
        if(document.getElementById("input-nivel-critico")) document.getElementById("input-nivel-critico").value = datos.critico;
        break;

      case 2:
        // Configura los precios del mercado simulado
        if(document.getElementById("precio-arroz")) document.getElementById("precio-arroz").value = datos.precioActualArroz;
        if(document.getElementById("precio-papa")) document.getElementById("precio-papa").value = datos.precioActualPapa;
        if(document.getElementById("precio-aceite")) document.getElementById("precio-aceite").value = datos.precioActualAceite;
        break;

      case 3:
        // Carga las variables de transporte y logística
        if(document.getElementById("distancia-normal")) document.getElementById("distancia-normal").value = datos.distanciaNormal;
        if(document.getElementById("distancia-desvio")) document.getElementById("distancia-desvio").value = datos.distanciaDesvio;
        if(document.getElementById("costo-kilometro")) document.getElementById("costo-kilometro").value = datos.costoKm;
        break;

      case 4:
        // Setea los techos del presupuesto del hogar
        if(document.getElementById("presupuesto-hogar")) document.getElementById("presupuesto-hogar").value = datos.presupuesto;
        if(document.getElementById("costo-compra")) document.getElementById("costo-compra").value = datos.totalCompra;
        break;

      case 5:
        // Simula el factor pánico / especulación por rumores
        if(document.getElementById("slider-especulacion")) document.getElementById("slider-especulacion").value = datos.aumentoRumor;
        if(document.getElementById("stock-almacen")) document.getElementById("stock-almacen").value = datos.stockDisponible;
        break;

      case 6:
        // Inyecta las variables macro de la Tormenta Perfecta
        if(document.getElementById("slider-dolar")) document.getElementById("slider-dolar").value = datos.dolarParalelo;
        if(document.getElementById("slider-diesel")) document.getElementById("slider-diesel").value = datos.escasezDiesel;
        if(document.getElementById("slider-sustitucion")) document.getElementById("slider-sustitucion").value = datos.sustitucionLocal;
        if(document.getElementById("input-miembros")) document.getElementById("input-miembros").value = datos.miembrosHogar;
        break;
    }

    // DISPARADOR CRUCIAL: Fuerza a tu simulador principal a recalcular 
    // y refrescar las gráficas o pantallas en caliente.
    // Llama aquí a la función principal de tu proyecto (por ejemplo: actualizarSimulacion() o calcularTodo())
    if (typeof actualizarSimuladorGeneral === "function") {
        actualizarSimuladorGeneral(); 
    } else if (typeof calcularResultados === "function") {
        calcularResultados();
    }
  }
})
// ==========================================
// CONTROLADOR DE PESTAÑAS (TABS)
// ==========================================
function cambiarPestañaSimulador(indice) {
  const paneles = document.querySelectorAll('.sim-panel-individual');
  const botones = document.querySelectorAll('.sim-tab-btn');
  
  paneles.forEach((panel, idx) => {
    if (idx === indice) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  botones.forEach((btn, idx) => {
    if (idx === indice) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ==========================================
// MOTORES DE CÁLCULO EN TIEMPO REAL
// ==========================================

// ESCENARIO A: CARBURANTES
function calcularEscenarioA() {
  const inicial = parseFloat(document.getElementById('simA-inicial').value) || 0;
  const consumo = parseFloat(document.getElementById('simA-consumo').value) || 0;
  const reabastecimiento = parseFloat(document.getElementById('simA-reabastecimiento').value) || 0;
  const critico = parseFloat(document.getElementById('simA-critico').value) || 0;

  const variacionNeto = consumo - reabastecimiento;
  let targetDiv = document.getElementById('simA-resultado-dinamico');
  let html = "";

  if (variacionNeto <= 0) {
    html = `
      <div class="sim-metric-line">Consumo diario Normal vs Alto: <span>Estable</span></div>
      <div class="sim-alert-box success">✅ Abastecimiento Sostenible: El ingreso de combustible diario cubre la demanda. La reserva no disminuirá.</div>
    `;
  } else {
    const diasDuracion = inicial / variacionNeto;
    const diasHastaCritico = (inicial - critico) / variacionNeto;

    html = `
      <div class="sim-metric-line">Consumo Neto Negativo: <span>${variacionNeto.toFixed(0)} Litros/día</span></div>
      <div class="sim-metric-line">Autonomía de la Reserva: <span>${diasDuracion.toFixed(1)} días</span></div>
      <div class="sim-metric-line">Llegada a Nivel Crítico: <span>En ${diasHastaCritico > 0 ? diasHastaCritico.toFixed(1) : 0} días</span></div>
    `;

    if (inicial <= critico) {
      html += `<div class="sim-alert-box danger">⚠️ ALERTA INMEDIATA: La reserva actual está en niveles críticos de desabastecimiento.</div>`;
    } else if (diasDuracion <= 3) {
      html += `<div class="sim-alert-box danger">⚠️ ALERTA: Carburante próximo a agotarse por completo en menos de 72 horas.</div>`;
    }
  }
  targetDiv.innerHTML = html;
}

// ESCENARIO B: ALIMENTOS
function calcularEscenarioB() {
  const producto = document.getElementById('simB-producto').value || "Producto";
  const pInicial = parseFloat(document.getElementById('simB-precioInicial').value) || 0;
  const pActual = parseFloat(document.getElementById('simB-precioActual').value) || 0;
  const cantidad = parseFloat(document.getElementById('simB-cantidadSemana').value) || 0;
  const semanas = parseFloat(document.getElementById('simB-semanas').value) || 0;

  const incremento = pActual - pInicial;
  const porcentaje = pInicial > 0 ? (incremento / pInicial) * 100 : 0;
  const gastoSemanalActual = pActual * cantidad;
  const gastoMensualTotal = gastoSemanalActual * semanas;
  const diferenciaTotalPeriodo = incremento * cantidad * semanas;

  document.getElementById('simB-resultado-dinamico').innerHTML = `
    <div class="sim-metric-line">Variación de Precio (${producto}): <span>+${incremento.toFixed(2)} Bs</span></div>
    <div class="sim-metric-line">Porcentaje de Inflación: <span>${porcentaje.toFixed(1)}%</span></div>
    <div class="sim-metric-line">Gasto Semanal Actual: <span>${gastoSemanalActual.toFixed(2)} Bs</span></div>
    <div class="sim-metric-line">Gasto en el Período (${semanas} sem): <span>${gastoMensualTotal.toFixed(2)} Bs</span></div>
    <div class="sim-alert-box danger">🚨 Impacto Familiar: Se está gastando de más un total de <span>+${diferenciaTotalPeriodo.toFixed(2)} Bs</span> por variaciones de precios.</div>
  `;
}

// ESCENARIO C: TRANSPORTE
function calcularEscenarioC() {
  const dNorm = parseFloat(document.getElementById('simC-distanciaNormal').value) || 0;
  const dDesv = parseFloat(document.getElementById('simC-distanciaDesvio').value) || 0;
  const cKm = parseFloat(document.getElementById('simC-costoKm').value) || 0;
  const viajes = parseFloat(document.getElementById('simC-viajesSemana').value) || 0;

  const costoNormalSemana = dNorm * cKm * viajes;
  const costoDesvioSemana = dDesv * cKm * viajes;
  const diferenciaSemana = costoDesvioSemana - costoNormalSemana;
  const gastoAdicionalMensual = diferenciaSemana * 4;

  document.getElementById('simC-resultado-dinamico').innerHTML = `
    <div class="sim-metric-line">Costo en Ruta Convencional: <span>${costoNormalSemana.toFixed(2)} Bs/sem</span></div>
    <div class="sim-metric-line">Costo con Desvíos / Bloqueos: <span>${costoDesvioSemana.toFixed(2)} Bs/sem</span></div>
    <div class="sim-metric-line">Diferencia Operativa Semanal: <span>+${diferenciaSemana.toFixed(2)} Bs</span></div>
    <div class="sim-alert-box danger">🛣️ Sobrecargo Mensual Logístico: Incremento total de <span>+${gastoAdicionalMensual.toFixed(2)} Bs/mes</span> debido a las rutas extendidas.</div>
  `;
}

// ESCENARIO D: COMPRAS FAMILIARES
function calcularEscenarioD() {
  const presupuesto = parseFloat(document.getElementById('simD-presupuesto').value) || 0;
  const totalCompra = parseFloat(document.getElementById('simD-totalCompra').value) || 0;

  const saldoRestante = presupuesto - totalCompra;
  let html = `
    <div class="sim-metric-line">Total Evaluado de Compra: <span>${totalCompra.toFixed(2)} Bs</span></div>
  `;

  if (saldoRestante >= 0) {
    html += `
      <div class="sim-metric-line">Saldo Excedente en Caja: <span>${saldoRestante.toFixed(2)} Bs</span></div>
      <div class="sim-alert-box success">✅ El presupuesto ALCANZA plenamente para cubrir los alimentos básicos.</div>
    `;
  } else {
    html += `
      <div class="sim-metric-line">Monto Faltante (Déficit): <span style="color:#f87171;">${Math.abs(saldoRestante).toFixed(2)} Bs</span></div>
      <div class="sim-alert-box danger">🚨 El presupuesto NO ALCANZA. Se requiere financiamiento adicional o sustitución de bienes.</div>
    `;
  }
  document.getElementById('simD-resultado-dinamico').innerHTML = html;
}

// ESCENARIO E: RUMOR Y PÁNICO
function calcularEscenarioE() {
  const dNormal = parseFloat(document.getElementById('simE-demandaNormal').value) || 0;
  const pctRumor = parseFloat(document.getElementById('simE-porcentajeRumor').value) || 0;
  const stock = parseFloat(document.getElementById('simE-stock').value) || 0;

  const nuevaDemanda = dNormal * (1 + (pctRumor / 100));
  const diferenciaDemanda = nuevaDemanda - dNormal;
  const stockRestante = stock - nuevaDemanda;

  let html = `
    <div class="sim-metric-line">Nueva Demanda Proyectada: <span>${nuevaDemanda.toFixed(0)} unidades</span></div>
    <div class="sim-metric-line">Sobredemanda por Pánico: <span>+${diferenciaDemanda.toFixed(0)} unidades</span></div>
  `;

  if (stockRestante < 0) {
    html += `
      <div class="sim-metric-line">Inventario Residual: <span>0 unidades</span></div>
      <div class="sim-alert-box danger">🚨 QUIEBRE DE STOCK: La demanda especulativa supera el inventario disponible por ${Math.abs(stockRestante).toFixed(0)} unidades.</div>
    `;
  } else {
    html += `
      <div class="sim-metric-line">Inventario Residual en Almacén: <span>${stockRestante.toFixed(0)} unidades</span></div>
      <div class="sim-alert-box success">✅ Abastecimiento Controlado: El stock amortigua el shock de demanda.</div>
    `;
  }
  document.getElementById('simE-resultado-dinamico').innerHTML = html;
}

// ESCENARIO F: PODER ADQUISITIVO
function calcularEscenarioF() {
  const ingreso = parseFloat(document.getElementById('simF-ingreso').value) || 0;
  const gAnt = parseFloat(document.getElementById('simF-gastoAnterior').value) || 0;
  const gAct = parseFloat(document.getElementById('simF-gastoActual').value) || 0;

  const aumentoGasto = gAct - gAnt;
  const perdidaPoderAdquisitivo = ingreso > 0 ? (aumentoGasto / ingreso) * 100 : 0;
  const saldoAntes = ingreso - gAnt;
  const saldoDespues = ingreso - gAct;

  let nivelAfectacion = "Bajo";
  if (saldoDespues < 0) nivelAfectacion = "Crítico / Endeudamiento Familiar 🚨";
  else if (perdidaPoderAdquisitivo > 20) nivelAfectacion = "Alto Impacto Estructural";
  else if (perdidaPoderAdquisitivo > 10) nivelAfectacion = "Moderado";

  document.getElementById('simF-resultado-dinamico').innerHTML = `
    <div class="sim-metric-line">Aumento Neto de Gastos: <span>+${aumentoGasto.toFixed(2)} Bs</span></div>
    <div class="sim-metric-line">Pérdida de Poder Adquisitivo: <span>${perdidaPoderAdquisitivo.toFixed(1)}% del Salario</span></div>
    <div class="sim-metric-line">Capacidad de Ahorro Previa: <span>${saldoAntes.toFixed(2)} Bs</span></div>
    <div class="sim-metric-line">Capacidad de Ahorro Actual: <span>${saldoDespues.toFixed(2)} Bs</span></div>
    <div class="sim-alert-box ${saldoDespues < 0 ? 'danger' : 'success'}">Nivel de Afectación: <span>${nivelAfectacion}</span></div>
  `;
}

// Inicialización Automática de los Cálculos al cargar el script
document.addEventListener("DOMContentLoaded", () => {
  calcularEscenarioA();
  calcularEscenarioB();
  calcularEscenarioC();
  calcularEscenarioD();
  calcularEscenarioE();
  calcularEscenarioF();
});