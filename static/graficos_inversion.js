// static/graficos_inversion.js

export async function initInvestmentChart() {
    const ctx = document.getElementById('commsInvestmentChart');
    if (!ctx) return;

    try {
        // 1. Cargar ambos CSVs en paralelo
        const [vabRes, invRes] = await Promise.all([
            fetch('./data/VAB(millones_dolares).csv'),
            fetch('./data/inversion_directa(miles_dolares).csv')
        ]);

        const vabText = await vabRes.text();
        const invText = await invRes.text();

        // 2. Parsear CSV de VAB (En Millones)
        const vabData = {};
        vabText.split('\n').slice(1).forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 3) {
                const year = parseInt(cols[1]);
                const val = parseFloat(cols[2]);
                if (!isNaN(year)) vabData[year] = val;
            }
        });

        // 3. Parsear CSV de Inversión (Convertir de Miles a Millones / 1000)
        const invData = {};
        invText.split('\n').slice(1).forEach(row => {
            const cols = row.split(',');
            if (cols.length >= 3) {
                const year = parseInt(cols[1]);
                const val = parseFloat(cols[2]) / 1000; 
                if (!isNaN(year)) invData[year] = val;
            }
        });

        // 4. Vamos a graficar desde el año 2000 hasta el 2024
        const years = Array.from({length: 26}, (_, i) => 2000 + i);

        // Mapear los datos al rango de años
        const datasetVAB = years.map(y => vabData[y] !== undefined ? vabData[y] : null);
        const datasetINV = years.map(y => invData[y] !== undefined ? invData[y] : null);

        // 5. Calcular crecimiento del último año de inversión (2023 vs 2024)
        const ied2023 = invData[2023];
        const ied2025 = invData[2025];
        if (ied2023 && ied2025) {
            const growth = ((ied2025 - ied2023) / Math.abs(ied2023)) * 100;
            const badge = document.getElementById('iedGrowthBadge');
            if (badge) {
                const sign = growth >= 0 ? '+' : '';
                badge.innerText = `IED 2025: ${sign}${growth.toFixed(1)}%`;
                
                // Cambiar colores si es negativo o positivo
                if (growth < 0) {
                    badge.className = "inline-block px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-full";
                }
            }
        }

        // 6. Dibujar el Gráfico con Ejes Dobles
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        type: 'line',
                        label: 'VAB ($ Millones)',
                        data: datasetVAB,
                        borderColor: '#166ee9', // Azul Primario
                        backgroundColor: '#166ee9',
                        borderWidth: 3,
                        tension: 0.3,
                        pointRadius: 2,
                        yAxisID: 'yVAB', // Se asocia al eje derecho
                    },
                    {
                        type: 'bar',
                        label: 'Inversión Extranjera ($ Miles)',
                        data: datasetINV,
                        backgroundColor: 'rgba(13, 148, 136, 0.7)', // Teal de tu diseño
                        borderRadius: 4,
                        yAxisID: 'yIED' // Se asocia al eje izquierdo
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: $${ctx.raw ? ctx.raw.toFixed(1) : 0}M`
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxTicksLimit: 12, color: '#94a3b8' }
                    },
                    yIED: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Inversión ($M)' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    yVAB: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'VAB ($M)' },
                        grid: { drawOnChartArea: false }, // Evita doble rejilla
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });

    } catch (e) {
        console.error("Error cargando gráficos de inversión y VAB:", e);
    }
}