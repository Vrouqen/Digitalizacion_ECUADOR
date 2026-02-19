/**
 * graficos_egdi.js - Carga dinámica, diseño adaptado y leyendas interactivas
 */

export async function initEgdiCharts(egdiCanvasId, epiCanvasId, csvUrl = './data/EGDI_EPI.csv') {
    const egdiCtx = document.getElementById(egdiCanvasId);
    const epiCtx = document.getElementById(epiCanvasId);
    
    if (!egdiCtx || !epiCtx) return;

    try {
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 5) {
                data.push({
                    anio: values[1], pais: values[2],
                    egdi: parseFloat(values[3]), epi: parseFloat(values[4])
                });
            }
        }

        const labels = [...new Set(data.map(d => d.anio))].sort((a, b) => parseInt(a) - parseInt(b));
        
        const getSeries = (country, metric) => labels.map(year => {
            const record = data.find(d => d.pais === country && d.anio === year);
            return record ? record[metric] : null;
        });

        const getRegionalAvg = (metric) => labels.map(year => {
            const ec = data.find(d => d.pais === 'Ecuador' && d.anio === year);
            const co = data.find(d => d.pais === 'Colombia' && d.anio === year);
            const ar = data.find(d => d.pais === 'Argentina' && d.anio === year);
            let sum = 0, count = 0;
            if(ec) { sum += ec[metric]; count++; }
            if(co) { sum += co[metric]; count++; }
            if(ar) { sum += ar[metric]; count++; }
            return count > 0 ? sum / count : null;
        });

        const createChartConfig = (metric) => {
            return {
                type: 'line',
                data: {
                    labels: labels,
                    // EL ORDEN AQUÍ DEBE COINCIDIR CON EL data-index DEL HTML
                    datasets: [
                        { // Index 0: Ecuador
                            label: 'Ecuador', data: getSeries('Ecuador', metric),
                            borderColor: '#166ee9', backgroundColor: 'rgba(22, 110, 233, 0.15)',
                            borderWidth: 4, pointBackgroundColor: '#166ee9', pointBorderColor: '#fff',
                            pointBorderWidth: 2, pointRadius: 5, fill: true, tension: 0.4
                        },
                        { // Index 1: Colombia
                            label: 'Colombia', data: getSeries('Colombia', metric),
                            borderColor: '#f59e0b', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4
                        },
                        { // Index 2: Argentina
                            label: 'Argentina', data: getSeries('Argentina', metric),
                            borderColor: '#0ea5e9', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4
                        },
                        { // Index 3: Suecia
                            label: 'Suecia', data: getSeries('Suecia', metric),
                            borderColor: '#8b5cf6', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4
                        },
                        { // Index 4: Regional Avg
                            label: 'Regional Avg', data: getRegionalAvg(metric),
                            borderColor: '#94a3b8', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index', intersect: false, backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#fff', bodyColor: '#cbd5e1', borderColor: '#334155', borderWidth: 1, padding: 12
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true, max: 1,
                            grid: { color: '#e2e8f0', drawBorder: false },
                            border: { dash: [4, 4] }, ticks: { color: '#94a3b8', font: { size: 10 } }
                        },
                        x: {
                            grid: { display: false, drawBorder: false },
                            ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
                        }
                    },
                    interaction: { mode: 'nearest', axis: 'x', intersect: false }
                }
            };
        };

        // 1. Guardamos las instancias de los gráficos en variables
        const chartEGDI = new Chart(egdiCtx, createChartConfig('egdi'));
        const chartEPI = new Chart(epiCtx, createChartConfig('epi'));

        // 2. Función para conectar tu HTML con Chart.js
        function activarLeyendas(chartInstance, claseBoton) {
            const botones = document.querySelectorAll(`.${claseBoton}`);
            
            botones.forEach(boton => {
                boton.addEventListener('click', (e) => {
                    e.preventDefault(); // Evita que la página salte si hay algún link
                    
                    const index = parseInt(boton.getAttribute('data-index'), 10);
                    const isVisible = chartInstance.isDatasetVisible(index);
                    
                    if (isVisible) {
                        // Oculta la línea con la animación nativa de Chart.js
                        chartInstance.hide(index); 
                        // Apaga el botón visualmente (CSS hará la transición suave)
                        boton.classList.add('opacity-40', 'grayscale');
                    } else {
                        // Muestra la línea con la animación nativa de Chart.js
                        chartInstance.show(index); 
                        // Enciende el botón
                        boton.classList.remove('opacity-40', 'grayscale');
                    }
                    
                    // ⚠️ CRUCIAL: No usamos chartInstance.update() aquí.
                    // hide() y show() ya disparan la animación solas.
                });
            });
        }

        // 3. Activamos las leyendas para cada gráfico
        activarLeyendas(chartEGDI, 'legend-btn-egdi');
        activarLeyendas(chartEPI, 'legend-btn-epi');

    } catch (error) {
        console.error("Error al cargar o procesar EGDI/EPI:", error);
    }
}