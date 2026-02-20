// static/graficos_exportaciones.js

export async function initExportServicesChart() {
    const ctx = document.getElementById('exportServicesChart');
    if (!ctx) return;

    try {
        // 1. Cargar datos del CSV
        const response = await fetch('./data/servicios_exportacion(millones_dolares).csv');
        const csvText = await response.text();
        
        // Parsear CSV
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        // Omitir header, mapear datos
        const data = rows.slice(1).map(row => {
            const cols = row.split(',').map(val => parseFloat(val.trim()));
            return {
                anio: cols[1],
                teleco_credito: cols[3],
                teleco_debito: cols[4],
                info_credito: cols[6],
                info_debito: cols[7],
                informacion_credito: cols[9],
                informacion_debito: cols[10]
            };
        });

        // Solo usar datos de 2016 en adelante (para que no quede muy apretado)
        const filteredData = data.filter(d => !isNaN(d.anio) && d.anio >= 2016);
        const years = filteredData.map(d => d.anio);

        let currentChart = null;

        // Función para dibujar el gráfico
        function renderChart(sector) {
            let creditoData, debitoData, titulo;

            // Extraer datos según el sector seleccionado
            if (sector === 'informatica') {
                creditoData = filteredData.map(d => d.info_credito);
                debitoData = filteredData.map(d => d.info_debito);
                titulo = 'Servicios Informáticos';
            } else if (sector === 'telecomunicaciones') {
                creditoData = filteredData.map(d => d.teleco_credito);
                debitoData = filteredData.map(d => d.teleco_debito);
                titulo = 'Telecomunicaciones';
            } else {
                creditoData = filteredData.map(d => d.informacion_credito);
                debitoData = filteredData.map(d => d.informacion_debito);
                titulo = 'Servicios de Información';
            }

            // Destruir gráfico previo si existe
            if (currentChart) {
                currentChart.destroy();
            }

            // Crear nuevo gráfico
            currentChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: 'Crédito (Exportaciones)',
                            data: creditoData,
                            backgroundColor: '#10b981', // emerald-500
                            borderRadius: 4,
                            barPercentage: 0.8,
                            categoryPercentage: 0.4
                        },
                        {
                            label: 'Débito (Importaciones)',
                            data: debitoData,
                            backgroundColor: '#fb7185', // rose-400
                            borderRadius: 4,
                            barPercentage: 0.8,
                            categoryPercentage: 0.4
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
                        legend: {
                            display: false // Ocultamos porque ya tenemos la leyenda custom HTML
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: $${context.raw.toFixed(1)}M`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(148, 163, 184, 0.1)' // slate-400 con opacidad
                            },
                            ticks: {
                                color: '#94a3b8',
                                callback: function(value) {
                                    return '$' + value;
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#94a3b8'
                            }
                        }
                    }
                }
            });

            // Actualizar el texto de la conclusión según el sector
            const conclusionText = document.getElementById('exportConclusionText');
            if (conclusionText) {
                if (sector === 'informatica') {
                    conclusionText.innerHTML = `Ecuador mantiene una <strong>fuerte dependencia externa</strong> en software. Aunque las exportaciones tecnológicas (crédito) intentan despegar, las importaciones (débito) de servicios y licencias informáticas son inmensamente superiores año tras año.`;
                } else if (sector === 'telecomunicaciones') {
                    conclusionText.innerHTML = `En telecomunicaciones, la balanza muestra una estructura diferente. El país genera <strong>más ingresos (crédito) de los que gasta (débito)</strong> en pagos hacia el exterior por servicios de red, demostrando una infraestructura local más consolidada.`;
                } else {
                    conclusionText.innerHTML = `Los servicios de información representan el sector <strong>más pequeño</strong>. Mantiene un flujo deficitario constante, reflejando el consumo de bases de datos y plataformas de información extranjeras por sobre la oferta local.`;
                }
            }
        }

        // Render inicial (Informática por defecto)
        renderChart('informatica');

        // Escuchar cambios en el selector
        const filterSelect = document.getElementById('serviceSectorFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                renderChart(e.target.value);
            });
        }

    } catch (error) {
        console.error("Error cargando los datos de exportación:", error);
    }
}