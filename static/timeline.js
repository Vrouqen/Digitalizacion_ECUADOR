/**
 * timeline.js - Carga dinámica desde CSV
 */

export async function initTimeline(containerId, csvUrl = 'linea_tiempo.csv') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Estado de carga
    container.className = "flex overflow-x-auto pb-8 gap-8 snap-x cursor-grab active:cursor-grabbing scrollbar-hide";
    container.innerHTML = '<div class="w-full text-center py-10 text-slate-500">Cargando datos históricos...</div>';

    try {
        // 1. Cargar el archivo CSV
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        
        // 2. Parsear el CSV
        // Separamos por saltos de línea y filtramos líneas vacías
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        
        // Regex para separar por comas, PERO ignorando las comas dentro de comillas (ej: "texto, con coma")
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        
        const timelineData = [];
        
        // Iteramos desde 1 para saltar la fila de encabezados
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(regex).map(val => val.replace(/^"|"$/g, '').trim());
            
            // Aseguramos que la fila tenga las columnas necesarias
            if (values.length >= 6) {
                timelineData.push({
                    id: values[0],
                    anio: values[1],
                    fecha: values[2],
                    titulo: values[3],
                    desc: values[4],
                    cat: values[5].toLowerCase()
                });
            }
        }

        // 3. Diccionario de colores según tu categoría en el CSV
        const categoryColors = {
            'tecnología': "bg-blue-500",
            'legal': "bg-purple-500",
            'tecnología financiera': "bg-emerald-500", // Para casos como PeiGo o DeUna
            'fintech': "bg-emerald-500"
        };

        // 4. Generar el HTML
        const html = timelineData.map(event => {
            const colorClass = categoryColors[event.cat] || 'bg-slate-400';
            const fechaLabel = event.fecha ? `- ${event.fecha}` : '';
            
            return `
                <div class="flex-none w-72 snap-center group">
                    <div class="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 py-4 group-hover:border-primary transition-colors h-full">
                        <div class="absolute -left-[9px] top-6 w-4 h-4 rounded-full ${colorClass} border-4 border-white dark:border-slate-900 shadow-sm"></div>
                        
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-500">
                            ${event.anio} ${fechaLabel}
                        </span>
                        <h3 class="text-lg font-bold text-slate-800 dark:text-white mt-1 group-hover:text-primary transition-colors">
                            ${event.titulo}
                        </h3>
                        <p class="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            ${event.desc}
                        </p>
                        
                        <span class="inline-block mt-3 px-2 py-1 text-[10px] font-bold rounded uppercase ${colorClass} bg-opacity-10 text-slate-700 dark:text-slate-300">
                            ${event.cat}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        // 5. Insertar en el DOM
        container.innerHTML = html;

        // 6. Activar la función de "arrastrar para deslizar" (Drag to scroll)
        activarDragScroll(container);

    } catch (error) {
        console.error("Error al cargar la línea de tiempo:", error);
        container.innerHTML = '<div class="w-full text-center py-10 text-red-500">Error al cargar el archivo linea_tiempo.csv</div>';
    }
}

// Función auxiliar para deslizar horizontalmente con el mouse
function activarDragScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        
        // Magia aquí: Desactiva la selección de texto en todo el contenedor mientras arrastras
        container.style.userSelect = 'none'; 
    });

    container.addEventListener('mouseleave', () => {
        isDown = false;
        // Restaura la selección de texto si el mouse sale del área
        container.style.userSelect = ''; 
    });

    container.addEventListener('mouseup', () => {
        isDown = false;
        // Restaura la selección de texto al soltar el clic
        container.style.userSelect = ''; 
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); // Previene comportamientos por defecto del navegador
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Multiplicador de velocidad
        container.scrollLeft = scrollLeft - walk;
    });
}