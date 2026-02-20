// static/tuti_dashboard.js

export async function initTutiDashboard() {
    console.log("Iniciando Dashboard Tuti...");

    // 1. CARGA Y PROCESAMIENTO DE DATOS DESDE CSV
    const response = await fetch('./data/negocios.csv');
    const csvText = await response.text();
    
    // Parseo manual sencillo de CSV
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim());
    
    const rawData = rows.slice(1).map(row => {
        const values = row.split(',');
        return {
            anio: parseInt(values[1]),
            empresa: values[2].trim(),
            ventas: parseFloat(values[3]),
            perdida: parseFloat(values[4]),
            activo: parseFloat(values[5]),
            inventario: parseFloat(values[6])
        };
    });

    // Agrupar por empresa
    const dataTuti = rawData.filter(d => d.empresa === 'TUTI').sort((a, b) => a.anio - b.anio);
    const dataFavorita = rawData.filter(d => d.empresa.includes('Favorita')).sort((a, b) => a.anio - b.anio);
    const dataTia = rawData.filter(d => d.empresa.includes('Tía')).sort((a, b) => a.anio - b.anio);

    const years = dataTuti.map(d => d.anio);

    // 2. ACTUALIZACIÓN DE KPIs
    const totalVentasTuti = dataTuti.reduce((acc, curr) => acc + curr.ventas, 0);
    const ahorroAcumulado = totalVentasTuti * 0.02; // 2% de comisión evitada

    document.getElementById('cashSavingsKPI').innerText = `+$${ahorroAcumulado.toFixed(1)}M`;
    document.getElementById('tutiSalesKPI').innerText = `$${dataTuti[dataTuti.length - 1].ventas.toFixed(1)}`;
    
    // Rotación = Ventas / Inventario (Manejando división por cero en años iniciales)
    const ultimoInv = dataTuti[dataTuti.length - 1].inventario;
    const ultimaVenta = dataTuti[dataTuti.length - 1].ventas;
    const rotacion2024 = ultimoInv > 0 ? (ultimaVenta / ultimoInv).toFixed(1) : 0;
    document.getElementById('tutiTurnoverKPI').innerText = `${rotacion2024}x`;

    // 3. GRÁFICOS

    // --- GRÁFICO 1: COMPARATIVA VENTAS ---
    const ctxSales = document.getElementById('chartComparisonSales');
    if (ctxSales) {
        new Chart(ctxSales, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    { label: 'Tuti (Efectivo)', data: dataTuti.map(d => d.ventas), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.4, borderWidth: 3 },
                    { label: 'Tía', data: dataTia.map(d => d.ventas), borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.4 },
                    { label: 'Favorita', data: dataFavorita.map(d => d.ventas), borderColor: '#ef4444', tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }
        });
    }

    // --- GRÁFICO 2: EFICIENCIA (ROTACIÓN DE ACTIVOS 2024) ---
    const ctxEff = document.getElementById('chartEfficiency');
    if (ctxEff) {
        const effData = [
            dataTuti[5].ventas / dataTuti[5].activo,
            dataTia[5].ventas / dataTia[5].activo,
            dataFavorita[5].ventas / dataFavorita[5].activo
        ];

        new Chart(ctxEff, {
            type: 'bar',
            data: {
                labels: ['Tuti (Rápido)', 'Tía (Medio)', 'Favorita (Lento)'],
                datasets: [{
                    label: 'Rotación de Activos (Veces al año)',
                    data: effData,
                    backgroundColor: ['#8b5cf6', '#f59e0b', '#ef4444'],
                    borderRadius: 5
                }]
            },
            options: { 
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                plugins: { legend: { display: false } }
            }
        });
    }

    // --- GRÁFICO 3: VELOCIDAD DE INVENTARIO VS AHORRO (EL NUEVO GRÁFICO) ---
    const ctxInv = document.getElementById('chartInventorySavings');
    if (ctxInv) {
        // Calcular rotación por año (Ventas / Inventario)
        const rotacionHistorica = dataTuti.map(d => d.inventario > 0 ? (d.ventas / d.inventario) : 0);
        
        // Calcular ahorro acumulado año a año
        let acumulado = 0;
        const ahorroHistorico = dataTuti.map(d => {
            acumulado += (d.ventas * 0.02);
            return acumulado;
        });

        new Chart(ctxInv, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Rotación Inventario (Veces)',
                        data: rotacionHistorica,
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Ahorro Acumulado ($M)',
                        data: ahorroHistorico,
                        borderColor: '#10b981', // Emerald green para el ahorro
                        backgroundColor: '#10b981',
                        borderWidth: 3,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Veces al año' } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Ahorro ($M)' }, grid: { drawOnChartArea: false } }
                }
            }
        });
    }

    // --- GRÁFICO 4: MARKET SHARE ---
    const ctxShare = document.getElementById('chartMarketShare');
    if (ctxShare) {
        const marketTotals = years.map((_, i) => dataTuti[i].ventas + dataTia[i].ventas + dataFavorita[i].ventas);
        const getShare = (data) => data.map((d, i) => (d.ventas / marketTotals[i]) * 100);

        new Chart(ctxShare, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    { label: 'Tuti', data: getShare(dataTuti), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.8)', fill: true, pointRadius: 0, borderWidth: 0 },
                    { label: 'Tía', data: getShare(dataTia), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.6)', fill: true, pointRadius: 0, borderWidth: 0 },
                    { label: 'Favorita', data: getShare(dataFavorita), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.4)', fill: true, pointRadius: 0, borderWidth: 0 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { stacked: true, max: 100, title: { display: true, text: '%' } } },
                plugins: { tooltip: { mode: 'index', intersect: false } }
            }
        });
    }
}