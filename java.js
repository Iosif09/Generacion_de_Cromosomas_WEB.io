// Elementos UI
const btnIniciar = document.getElementById('btnIniciar');
const btnDetener = document.getElementById('btnDetener');
const btnReiniciar = document.getElementById('btnReiniciar');
const consola = document.getElementById('consola');
const tablaHistorial = document.querySelector('#tablaHistorial tbody');

// Gráfica Chart.js
let chartConvergencia;
let chartData = { datasets: [] };

// Variables de Control
let detenerProceso = false;
let totalGeneracionesProcesadas = 0;
let simulacionEnCurso = false;

function inicializarGrafico() {
    const ctx = document.getElementById('graficoConvergencia').getContext('2d');
    chartConvergencia = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false, // Desactivar animaciones para rendimiento
            scales: {
                x: { type: 'linear', title: { display: true, text: 'Generación' } },
                y: { title: { display: true, text: 'Mejor f(x)' } }
            }
        }
    });
}

function imprimirConsola(texto) {
    consola.value += texto;
    consola.scrollTop = consola.scrollHeight;
}

// Simulación de delay para no bloquear el navegador
const sleep = ms => new Promise(r => setTimeout(r, ms));

function calcularFitness(x, tipoFuncion) {
    switch (tipoFuncion) {
        case 0: return 12 * Math.pow(x, 5) - 975 * Math.pow(x, 4) + 28000 * Math.pow(x, 3) - 345000 * Math.pow(x, 2) + 1800000 * x;
        case 1: return 80 - Math.pow(x - 8, 2);
        case 2: return 120 - Math.pow(x - 15, 2);
        case 3: return 200 - Math.pow(x - 27, 2);
        default: return 0;
    }
}

// Monitoreo simulado de recursos
setInterval(() => {
    if (window.performance && window.performance.memory) {
        const ramMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        document.getElementById('lblRAM').innerText = `RAM Heap JS: ${ramMB} MB`;
    }
    document.getElementById('lblContadorGeneraciones').innerText = `Total Gen. Procesadas: ${totalGeneracionesProcesadas}`;
}, 500);

async function ejecutarAlgoritmoGenetico() {
    const tasaMutacion = parseFloat(document.getElementById('txtMutacion').value);
    const maxGeneraciones = parseInt(document.getElementById('txtGeneraciones').value);
    const ejecucionesTotales = parseInt(document.getElementById('txtEjecuciones').value);
    const tipoFuncion = parseInt(document.getElementById('cbFunciones').value);

    let tiemposMilisegundos = [];
    let mejoresXEncontradas = [];
    let mejoresCromosomas = [];
    let mejoresFxEncontradas = [];
    let overallBestFx = -Infinity;
    let overallBestChromosome = "";

    for (let ejecucion = 1; ejecucion <= ejecucionesTotales; ejecucion++) {
        if (detenerProceso) break;

        imprimirConsola(`=========================================================\n`);
        imprimirConsola(`                INICIANDO EJECUCIÓN ${ejecucion}         \n`);
        imprimirConsola(`=========================================================\n\n`);

        // Crear nueva serie para la gráfica
        const colorHex = '#' + Math.floor(Math.random()*16777215).toString(16);
        let dataset = {
            label: `Ejecución ${ejecucion}`,
            data: [],
            borderColor: colorHex,
            borderWidth: 1,
            pointRadius: 2,
            fill: false
        };
        chartData.datasets.push(dataset);
        chartConvergencia.update();

        let conteo = {};
        let generacion = 0;
        let terminado = false;
        let ultimoMejorX = 0;
        let ultimoMejorFx = 0;
        let ultimoMejorCromosoma = "";

        const startTime = performance.now();

        while (!terminado && generacion < maxGeneraciones) {
            if (detenerProceso) break;

            generacion++;
            totalGeneracionesProcesadas++;

            imprimirConsola(`---------------------------------------------------------\n`);
            imprimirConsola(` GENERACIÓN: ${generacion}\n`);
            imprimirConsola(`---------------------------------------------------------\n`);

            let poblacion = [];
            let valores = [];
            let funcion_ob = [];

            // Crear población inicial
            for (let i = 0; i < 10; i++) {
                let cromosoma;
                let duplicado;
                do {
                    cromosoma = "";
                    for (let j = 0; j < 5; j++) cromosoma += Math.floor(Math.random() * 2).toString();
                    duplicado = poblacion.includes(cromosoma);
                } while (duplicado);
                poblacion.push(cromosoma);
            }

            for (let i = 0; i < 10; i++) {
                let val = parseInt(poblacion[i], 2);
                val = Math.max(0, Math.min(31, val));
                valores.push(val);
                funcion_ob.push(calcularFitness(val, tipoFuncion));
            }

            imprimirConsola("\n Población inicial \n\n");
            for (let i = 0; i < 10; i++) {
                imprimirConsola(`Cromosoma: ${poblacion[i]} -> Decimal: ${valores[i]} -> f(x): ${funcion_ob[i]}\n`);
            }

            // Ordenar por fitness
            let poblacionEvaluada = poblacion.map((c, i) => ({ indice: i, valor: funcion_ob[i], cromosoma: c }));
            poblacionEvaluada.sort((a, b) => b.valor - a.valor);

            let mejores = poblacionEvaluada.slice(0, 5);
            let indiceEliminarApto = Math.floor(Math.random() * mejores.length);
            if (mejores.length > 1) mejores.splice(indiceEliminarApto, 1);

            let menosAptos = poblacionEvaluada.slice(5).sort((a, b) => a.valor - b.valor);
            
            const shuffle = array => array.sort(() => 0.5 - Math.random());
            let seleccionAptos = shuffle([...mejores]).slice(0, 2);
            let seleccionMenosAptos = shuffle([...menosAptos]).slice(0, 2);

            const crossover = (p1, p2) => {
                let punto = Math.floor(Math.random() * (p1.length - 1)) + 1;
                return p1.substring(0, punto) + p2.substring(punto);
            };

            let hijo1 = crossover(poblacion[seleccionAptos[0].indice], poblacion[seleccionAptos[1].indice]);
            let hijo2 = crossover(poblacion[seleccionAptos[1].indice], poblacion[seleccionAptos[0].indice]);
            let hijo3 = crossover(poblacion[seleccionAptos[0].indice], poblacion[seleccionMenosAptos[0].indice]);
            let hijo4 = crossover(poblacion[seleccionMenosAptos[0].indice], poblacion[seleccionAptos[0].indice]);
            let hijo5 = crossover(poblacion[seleccionAptos[seleccionAptos.length - 1].indice], poblacion[seleccionMenosAptos[seleccionMenosAptos.length - 1].indice]);
            let hijo6 = crossover(poblacion[seleccionMenosAptos[seleccionMenosAptos.length - 1].indice], poblacion[seleccionAptos[seleccionAptos.length - 1].indice]);

            const mutacion = (cromosoma) => {
                let bits = cromosoma.split('');
                for (let i = 0; i < bits.length; i++) {
                    if (Math.random() < tasaMutacion) bits[i] = (bits[i] === '0') ? '1' : '0';
                }
                return bits.join('');
            };

            hijo1 = mutacion(hijo1); hijo2 = mutacion(hijo2);
            hijo3 = mutacion(hijo3); hijo4 = mutacion(hijo4);
            hijo5 = mutacion(hijo5); hijo6 = mutacion(hijo6);

            let top4 = poblacionEvaluada.slice(0, 4);
            let nuevaPoblacion = top4.map(item => item.cromosoma);
            nuevaPoblacion.push(hijo1, hijo2, hijo3, hijo4, hijo5, hijo6);

            let evaluadosFinales = nuevaPoblacion.map(c => {
                let v = parseInt(c, 2);
                if (v > 31) v = 31;
                return { Cromosoma: c, Valor: v, Fx: calcularFitness(v, tipoFuncion) };
            }).sort((a, b) => b.Fx - a.Fx)[0];

            let mejorFx = evaluadosFinales.Fx;
            ultimoMejorX = evaluadosFinales.Valor;
            ultimoMejorFx = evaluadosFinales.Fx;
            ultimoMejorCromosoma = evaluadosFinales.Cromosoma;

            dataset.data.push({ x: generacion, y: mejorFx });
            chartConvergencia.update();

            imprimirConsola(`\n El Cromosoma "${evaluadosFinales.Cromosoma}" (X=${evaluadosFinales.Valor}) se ha evaluado. f(x): ${evaluadosFinales.Fx}\n`);

            conteo[evaluadosFinales.Cromosoma] = (conteo[evaluadosFinales.Cromosoma] || 0) + 1;
            if (conteo[evaluadosFinales.Cromosoma] >= 5) terminado = true;

            await sleep(5); 
        }

        const endTime = performance.now();
        const tiempoTranscurrido = endTime - startTime;

        if (!detenerProceso) {
            tiemposMilisegundos.push(tiempoTranscurrido);
            mejoresXEncontradas.push(ultimoMejorX);
            mejoresCromosomas.push(ultimoMejorCromosoma);
            mejoresFxEncontradas.push(ultimoMejorFx);
            
            imprimirConsola(`Duración Ejecución ${ejecucion}: ${tiempoTranscurrido.toFixed(2)} ms | Mejor X: ${ultimoMejorX}\n\n`);

            const row = tablaHistorial.insertRow();
            row.insertCell(0).innerText = ejecucion;
            row.insertCell(1).innerText = ultimoMejorCromosoma;
            row.insertCell(2).innerText = ultimoMejorX;
            row.insertCell(3).innerText = ultimoMejorFx.toFixed(2);

            if (ultimoMejorFx > overallBestFx) {
                overallBestFx = ultimoMejorFx;
                overallBestChromosome = ultimoMejorCromosoma;
                document.getElementById('lblBestMain').innerText = `Mejor Global: ${overallBestChromosome} (X=${ultimoMejorX}, f=${ultimoMejorFx.toFixed(2)})`;
            }
        }
    }

    if (detenerProceso) {
        imprimirConsola("\n=========================================================\n");
        imprimirConsola("         SIMULACIÓN DETENIDA POR EL USUARIO              \n");
        imprimirConsola("=========================================================\n");
        document.getElementById('lblTiempoMin').innerText = "Min: Cancelado";
        document.getElementById('lblTiempoMax').innerText = "Max: Cancelado";
        document.getElementById('lblTiempoProm').innerText = "Avg: Cancelado";
    } else if (tiemposMilisegundos.length > 0) {
        const sumT = tiemposMilisegundos.reduce((a, b) => a + b, 0);
        const promT = sumT / tiemposMilisegundos.length;
        const minT = Math.min(...tiemposMilisegundos);
        const maxT = Math.max(...tiemposMilisegundos);

        document.getElementById('lblTiempoMin').innerText = `Min: ${minT.toFixed(2)} ms`;
        document.getElementById('lblTiempoMax').innerText = `Max: ${maxT.toFixed(2)} ms`;
        document.getElementById('lblTiempoProm').innerText = `Avg: ${promT.toFixed(2)} ms`;

        imprimirConsola("\n=========================================================\n");
        imprimirConsola("      RESUMEN ESTADÍSTICO DE PROCEDIMIENTOS              \n");
        imprimirConsola("=========================================================\n");
        imprimirConsola(`Promedio Tiempo: ${promT.toFixed(2)} ms\n`);
    }

    btnIniciar.disabled = false;
    btnReiniciar.disabled = false;
    btnDetener.disabled = true;
    simulacionEnCurso = false;
}

// Eventos de Botones
btnIniciar.addEventListener('click', () => {
    btnIniciar.disabled = true;
    btnReiniciar.disabled = true;
    btnDetener.disabled = false;
    detenerProceso = false;
    simulacionEnCurso = true;

    consola.value = '';
    tablaHistorial.innerHTML = '';
    chartData.datasets = [];
    chartConvergencia.update();
    
    document.getElementById('lblTiempoMin').innerText = "Min: Ejecutando...";
    document.getElementById('lblTiempoMax').innerText = "Max: Ejecutando...";
    document.getElementById('lblTiempoProm').innerText = "Avg: Ejecutando...";
    totalGeneracionesProcesadas = 0;

    ejecutarAlgoritmoGenetico();
});

btnDetener.addEventListener('click', () => {
    detenerProceso = true;
    btnDetener.disabled = true;
    imprimirConsola("\n[!] Solicitud de detención enviada. Esperando ciclo actual...\n");
});

btnReiniciar.addEventListener('click', () => {
    consola.value = '';
    chartData.datasets = [];
    chartConvergencia.update();
    tablaHistorial.innerHTML = '';
    
    document.getElementById('lblTiempoMin').innerText = "Min: ---";
    document.getElementById('lblTiempoMax').innerText = "Max: ---";
    document.getElementById('lblTiempoProm').innerText = "Avg: ---";
    document.getElementById('lblBestMain').innerText = "Mejor Global: ---";
    
    totalGeneracionesProcesadas = 0;
    detenerProceso = false;
    imprimirConsola("[*] Interfaz y contadores reiniciados exitosamente.\n");
});

// Iniciar
window.onload = inicializarGrafico;