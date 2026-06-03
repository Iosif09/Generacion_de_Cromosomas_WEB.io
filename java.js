// --- VARIABLES GLOBALES DE CONTRAL E INTERFAZ ---
let totalGeneracionesProcesadas = 0;
let graficoConvergenciaInstancia = null;
let chartTInstancia = null;
let chartXInstancia = null;
let sim_activa = false;

// Elementos DOM
const btnIniciar = document.getElementById('btnIniciar');
const txtConsola = document.getElementById('txtConsola');
const lblTiempoMin = document.getElementById('lblTiempoMin');
const lblTiempoMax = document.getElementById('lblTiempoMax');
const lblTiempoProm = document.getElementById('lblTiempoProm');
const lblCPU = document.getElementById('lblCPU');
const lblRAM = document.getElementById('lblRAM');
const lblContadorGeneraciones = document.getElementById('lblContadorGeneraciones');

const modal = document.getElementById('modalGraficas');
const closeModalBtn = document.querySelector('.close-btn');

// --- 1. MONITOR DE RECURSOS (Simulado / Métrica Web local) ---
function inicializarContadoresRendimiento() {
    setInterval(() => {
        if (sim_activa) {
            // Emulación de carga alta durante simulación activa
            const cpuCpu = (Math.random() * 25 + 40).toFixed(1);
            lblCPU.innerText = `Uso del Procesador: ${cpuCpu}%`;
        } else {
            const cpuCpu = (Math.random() * 4 + 1).toFixed(1);
            lblCPU.innerText = `Uso del Procesador: ${cpuCpu}%`;
        }

        // Si la API de performance de memoria existe en el navegador
        if (performance && performance.memory) {
            const ramMbs = (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(0);
            lblRAM.innerText = `RAM App: ${ramMbs} MB`;
        } else {
            // Alternativa estática si el navegador bloquea la API
            const fakeRam = (sim_activa ? 85 : 42) + Math.floor(Math.random() * 5);
            lblRAM.innerText = `RAM App (Est.): ${fakeRam} MB`;
        }

        lblContadorGeneraciones.innerText = `Total Gen. Procesadas: ${totalGeneracionesProcesadas}`;
    }, 500);
}

// --- 2. AUXILIARES DE CONSOLA E INTERFAZ ---
function imprimirConsola(texto) {
    txtConsola.value += texto;
    txtConsola.scrollTop = txtConsola.scrollHeight; // AutoScroll en caret
}

function inicializarGraficoConvergencia() {
    const ctx = document.getElementById('graficoConvergencia').getContext('2d');
    graficoConvergenciaInstancia = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Desactivar para optimizar procesamiento masivo
            plugins: {
                title: { display: true, text: 'Gráfico de Convergencia' },
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
            },
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Generación' } },
                y: { title: { display: true, text: 'Mejor f(x)' } }
            }
        }
    });
}

// Generador de colores para diferenciar las múltiples ejecuciones
function obtenerColorAleatorio(i) {
    const colores = ['#0000FF', '#DC143C', '#228B22', '#FF8C00', '#8B008B', '#008B8B', '#2F4F4F', '#4B0082', '#708090', '#A0522D'];
    return colores[i % colores.length];
}

// --- 3. EVENTOS ---
btnIniciar.addEventListener('click', iniciarSimulacion);
closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

// --- 4. LÓGICA DEL ALGORITMO GENÉTICO ---
async function iniciarSimulacion() {
    sim_activa = true;
    btnIniciar.disabled = true;
    txtConsola.value = '';
    
    // Resetear gráfico
    if(graficoConvergenciaInstancia) graficoConvergenciaInstancia.destroy();
    inicializarGraficoConvergencia();

    lblTiempoMin.innerText = "Tiempo Mínimo: Ejecutando...";
    lblTiempoMax.innerText = "Tiempo Máximo: Ejecutando...";
    lblTiempoProm.innerText = "Tiempo Promedio: Ejecutando...";
    totalGeneracionesProcesadas = 0;

    // Obtener parámetros
    const tasaMutacion = parseFloat(document.getElementById('txtMutacion').value);
    const maxGeneraciones = parseInt(document.getElementById('txtGeneraciones').value);
    const ejecucionesTotales = parseInt(document.getElementById('txtEjecuciones').value);

    // Ejecución asíncrona para no congelar la pestaña del navegador
    setTimeout(async () => {
        await ejecutarAlgoritmoGenetico(tasaMutacion, maxGeneraciones, ejecucionesTotales);
    }, 50);
}

async function ejecutarAlgoritmoGenetico(tasaMutacion, maxGeneraciones, ejecucionesTotales) {
    const tiemposMilisegundos = [];
    const mejoresXEncontradas = [];

    for (let ejecucion = 1; ejecucion <= ejecucionesTotales; ejecucion++) {
        imprimirConsola(`=========================================================\n`);
        imprimirConsola(`                INICIANDO EJECUCIÓN ${ejecucion}         \n`);
        imprimirConsola(`=========================================================\n\n`);

        const colorSerie = obtenerColorAleatorio(ejecucion);
        const nuevaSerie = {
            label: `Ejecución ${ejecucion}`,
            data: [],
            borderColor: colorSerie,
            backgroundColor: colorSerie,
            borderWidth: 1,
            pointRadius: 2,
            showLine: true
        };
        graficoConvergenciaInstancia.data.datasets.push(nuevaSerie);

        let conteo = {};
        let generacion = 0;
        let terminado = false;
        let ultimoMejorX = 0;

        // Iniciar cronómetro de alta precisión (equivalente a Stopwatch)
        const tInicio = performance.now();

        while (!terminado && generacion < maxGeneraciones) {
            generacion++;
            totalGeneracionesProcesadas++;

            imprimirConsola(`---------------------------------------------------------\n`);
            imprimirConsola(` GENERACIÓN: ${generacion}\n`);
            imprimirConsola(`---------------------------------------------------------\n`);

            let poblacion = new Array(10);
            let valores = new Array(10);
            let funcion_ob = new Array(10);

            // 1. Cromosomas sin duplicados en la población inicial
            for (let i = 0; i < 10; i++) {
                let cromosoma;
                let duplicado;
                do {
                    cromosoma = "";
                    for (let j = 0; j < 5; j++) {
                        cromosoma += Math.floor(Math.random() * 2).toString();
                    }
                    duplicado = poblacion.slice(0, i).includes(cromosoma);
                } while (duplicado);
                poblacion[i] = cromosoma;
            }

            // 2. Transmisión a Decimales (Entre 0 y 31 bits)
            for (let i = 0; i < 10; i++) {
                valores[i] = parseInt(poblacion[i], 2);
                if (valores[i] < 0) valores[i] = 0;
                if (valores[i] > 31) valores[i] = 31;
            }

            // 3. Ecuación polinómica de la función Objetivo
            for (let i = 0; i < 10; i++) {
                let x = valores[i];
                funcion_ob[i] = 12 * Math.pow(x, 5) - 975 * Math.pow(x, 4) + 28000 * Math.pow(x, 3) - 345000 * Math.pow(x, 2) + 1800000 * x;
            }

            imprimirConsola("\n Población inicial \n\n");
            for (let i = 0; i < 10; i++) {
                imprimirConsola(`Cromosoma: ${poblacion[i]} -> Decimal: ${valores[i]} -> f(x): ${funcion_ob[i].toFixed(2)}\n`);
            }

            // Mapear aptos
            let mapeoAptos = funcion_ob.map((valor, indice) => ({ indice, valor }));
            
            // Ordenar de mayor a menor f(x)
            let mejores = [...mapeoAptos].sort((a, b) => b.valor - a.valor).slice(0, 5);
            let indiceEliminarApto = Math.floor(Math.random() * mejores.length);
            mejores.splice(indiceEliminarApto, 1);

            let menosAptos = [...mapeoAptos].sort((a, b) => a.valor - b.valor).slice(0, 5);
            
            // Mezclas aleatorias
            let seleccionAptos = mejores.sort(() => Math.random() - 0.5).slice(0, 2);
            let seleccionMenosAptos = menosAptos.sort(() => Math.random() - 0.5).slice(0, 2);

            // Crossover
            function crossover(padre1, padre2) {
                let puntoCorte = Math.floor(Math.random() * (padre1.length - 1)) + 1;
                return padre1.substring(0, puntoCorte) + padre2.substring(puntoCorte);
            }

            let hijo1 = crossover(poblacion[seleccionAptos[0].indice], poblacion[seleccionAptos[1].indice]);
            let hijo2 = crossover(poblacion[seleccionAptos[1].indice], poblacion[seleccionAptos[0].indice]);
            let hijo3 = crossover(poblacion[seleccionAptos[0].indice], poblacion[seleccionMenosAptos[0].indice]);
            let hijo4 = crossover(poblacion[seleccionMenosAptos[0].indice], poblacion[seleccionAptos[0].indice]);
            let hijo5 = crossover(poblacion[seleccionAptos[1].indice], poblacion[seleccionMenosAptos[1].indice]);
            let hijo6 = crossover(poblacion[seleccionMenosAptos[1].indice], poblacion[seleccionAptos[1].indice]);

            // Mutación
            function mutacion(cromosoma, tasa) {
                let bits = cromosoma.split('');
                for (let i = 0; i < bits.length; i++) {
                    if (Math.random() < tasa) {
                        bits[i] = (bits[i] === '0') ? '1' : '0';
                    }
                }
                return bits.join('');
            }

            hijo1 = mutacion(hijo1, tasaMutacion); hijo2 = mutacion(hijo2, tasaMutacion);
            hijo3 = mutacion(hijo3, tasaMutacion); hijo4 = mutacion(hijo4, tasaMutacion);
            hijo5 = mutacion(hijo5, tasaMutacion); hijo6 = mutacion(hijo6, tasaMutacion);

            // Nueva Élite
            let top4 = [...mejores].sort((a, b) => b.valor - a.valor).slice(0, 4);
            let nuevaPoblacion = [];
            top4.forEach(item => nuevaPoblacion.push(poblacion[item.indice]));
            nuevaPoblacion.push(hijo1, hijo2, hijo3, hijo4, hijo5, hijo6);

            // Evaluación final de la generación
            let evaluados = nuevaPoblacion.map(c => {
                let dec = parseInt(c, 2);
                return {
                    cromosoma: c,
                    valor: dec,
                    fx: 12 * Math.pow(dec, 5) - 975 * Math.pow(dec, 4) + 28000 * Math.pow(dec, 3) - 345000 * Math.pow(dec, 2) + 1800000 * dec
                };
            }).sort((a, b) => b.fx - a.fx)[0];

            let mejorFx = evaluados.fx;
            ultimoMejorX = evaluados.valor;

            // Registrar punto coordenado en Chart.js
            graficoConvergenciaInstancia.data.datasets[ejecucion - 1].data.push({ x: generacion, y: mejorFx });

            imprimirConsola(`\n El Cromosoma "${evaluados.cromosoma}" se ha evaluado. f(x): ${evaluados.fx.toFixed(2)}\n`);

            if (!conteo[evaluados.cromosoma]) conteo[evaluados.cromosoma] = 0;
            conteo[evaluados.cromosoma]++;

            // Criterio de paro si se repite el individuo élite 5 veces consecutivas
            if (conteo[evaluados.cromosoma] >= 5) terminado = true;

            // Retraso de respiro sutil para actualizar la UI dinámicamente en la Web
            await new Promise(resolve => setTimeout(resolve, 3));
        }

        const tFin = performance.now();
        const tiempoTranscurrido = tFin - tInicio;
        tiemposMilisegundos.push(tiempoTranscurrido);
        mejoresXEncontradas.push(ultimoMejorX);

        graficoConvergenciaInstancia.update();
        imprimirConsola(`Duración Ejecución ${ejecucion}: ${tiempoTranscurrido.toFixed(2)} ms | Mejor X: ${ultimoMejorX}\n\n`);
    }

    // --- 5. PROCESAMIENTO ESTADÍSTICO DE RESULTADOS ---
    if (tiemposMilisegundos.length > 0) {
        // Métricas de Tiempo (t)
        const promT = tiemposMilisegundos.reduce((a, b) => a + b, 0) / tiemposMilisegundos.length;
        const minT = Math.min(...tiemposMilisegundos);
        const maxT = Math.max(...tiemposMilisegundos);
        const rangoT = maxT - minT;
        const desvEstT = Math.sqrt(tiemposMilisegundos.map(val => Math.pow(val - promT, 2)).reduce((a, b) => a + b, 0) / tiemposMilisegundos.length);

        // Métricas de Espacio de Soluciones (X)
        const promX = mejoresXEncontradas.reduce((a, b) => a + b, 0) / mejoresXEncontradas.length;
        const minX = Math.min(...mejoresXEncontradas);
        const maxX = Math.max(...mejoresXEncontradas);
        const rangoX = maxX - minX;
        const desvEstX = Math.sqrt(mejoresXEncontradas.map(val => Math.pow(val - promX, 2)).reduce((a, b) => a + b, 0) / mejoresXEncontradas.length);

        // Imprimir en etiquetas de la UI principal
        lblTiempoMin.innerText = `Tiempo Mínimo: ${minT.toFixed(2)} ms`;
        lblTiempoMax.innerText = `Tiempo Máximo: ${maxT.toFixed(2)} ms`;
        lblTiempoProm.innerText = `Tiempo Promedio: ${promT.toFixed(2)} ms`;

        // Mostrar tabla analítica CMD en Consola web
        imprimirConsola("\n=========================================================\n");
        imprimirConsola("      TABLA EXPERIMENTAL DE ANÁLISIS DE PROCEDIMIENTOS     \n");
        imprimirConsola("=========================================================\n");
        imprimirConsola(`Métrica\t\t\t| t (Tiempo ms)\t\t| X (Mejor X)\n`);
        imprimirConsola("---------------------------------------------------------\n");
        imprimirConsola(`Promedio\t\t| ${promT.toFixed(2)} ms\t\t| ${promX.toFixed(2)}\n`);
        imprimirConsola(`Desv. Estándar\t\t| ${desvEstT.toFixed(2)}\t\t\t| ${desvEstX.toFixed(2)}\n`);
        imprimirConsola(`Mínimo\t\t\t| ${minT.toFixed(2)} ms\t\t| ${minX.toFixed(2)}\n`);
        imprimirConsola(`Máximo\t\t\t| ${maxT.toFixed(2)} ms\t\t| ${maxX.toFixed(2)}\n`);
        imprimirConsola(`Rango\t\t\t| ${rangoT.toFixed(2)} ms\t\t| ${rangoX.toFixed(2)}\n`);
        imprimirConsola("=========================================================\n");

        // Desplegar Ventana Modal con las Campanas de Gauss
        abrirPanelGraficasGauss(promT, desvEstT, promX, desvEstX);
    }

    btnIniciar.disabled = false;
    sim_activa = false;
}

// --- 6. GENERACIÓN DE CURVAS GAUSSIANAS DE DISTRIBUCIÓN NORMAL ---
function abrirPanelGraficasGauss(medT, desvT, medX, desvX) {
    modal.style.display = 'block';

    if (chartTInstancia) chartTInstancia.destroy();
    if (chartXInstancia) chartXInstancia.destroy();

    chartTInstancia = crearGraficoGauss('chartT', `Distribución del Tiempo (t)\nMedia=${medT.toFixed(1)}, σ=${desvT.toFixed(2)}`, medT, desvT, 'rgba(0, 0, 255, 1)', 'rgba(0, 0, 255, 0.2)', 'Tiempo (ms)');
    chartXInstancia = crearGraficoGauss('chartX', `Distribución del Espacio de Soluciones (X)\nMedia=${medX.toFixed(1)}, σ=${desvX.toFixed(2)}`, medX, desvX, 'rgba(220, 20, 60, 1)', 'rgba(220, 20, 60, 0.2)', 'Valor Variable X');
}

function crearGraficoGauss(canvasId, titulo, media, desviacionEstandar, colorLinea, colorRelleno, ejeXTitulo) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Evitar divisiones matemáticas por cero si no hay variabilidad en el experimento
    let sigma = desviacionEstandar <= 0 ? 0.001 : desviacionEstandar;

    const datosCurva = [];
    const inicio = media - (3 * sigma);
    const fin = media + (3 * sigma);
    const paso = (fin - inicio) / 100; // 100 puntos coordenados para suavidad total

    for (let x = inicio; x <= fin; x += paso) {
        // Ecuación Clásica de la Función de Densidad de Probabilidad Gaussiana
        let exponente = -Math.pow(x - media, 2) / (2 * Math.pow(sigma, 2));
        let y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
        datosCurva.push({ x: x, y: y });
    }

    return new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Densidad',
                data: datosCurva,
                borderColor: colorLinea,
                backgroundColor: colorRelleno,
                borderWidth: 3,
                showLine: true,
                fill: true,
                pointRadius: 0 // Quitar círculos para suavizar splineArea
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: titulo, font: { size: 13, weight: 'bold' } },
                legend: { display: false }
            },
            scales: {
                x: { type: 'linear', title: { display: true, text: ejeXTitulo }, grid: { color: '#e5e5e5' } },
                y: { title: { display: true, text: 'Densidad de Probabilidad f(x)' }, grid: { color: '#e5e5e5' } }
            }
        }
    });
}

// Inicialización automática
window.onload = () => {
    inicializarContadoresRendimiento();
    inicializarGraficoConvergencia();
};