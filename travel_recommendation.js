document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const recommendationsDiv = document.getElementById('recommendations');

    // Palabras clave aceptadas (case-insensitive; se usa toLowerCase() en runtime)
    const BEACH_KEYWORDS = new Set(['beach', 'beaches', 'playa', 'playas']);
    const TEMPLE_KEYWORDS = new Set(['temple', 'temples', 'templo', 'templos']);
    const COUNTRY_KEYWORDS = new Set(['country', 'countries', 'pais', 'país', 'paises']);

    // --- Opcional: reloj por recomendación ---
    // Opciones comunes para mostrar hora local
    const CLOCK_OPTIONS = { hour12: true, hour: 'numeric', minute: 'numeric', second: 'numeric' };

    // Mapeo básico de destinos a zonas horarias IANA (según los datos del JSON)
    function getTimeZoneForItem(name) {
        const n = (name || '').toLowerCase();
        // Ciudades de Australia
        if (n.includes('sydney')) return 'Australia/Sydney';
        if (n.includes('melbourne')) return 'Australia/Melbourne';
        // Ciudades de Japón
        if (n.includes('tokyo') || n.includes('kyoto') || n.includes('japan')) return 'Asia/Tokyo';
        // Brasil
        if (n.includes('rio de janeiro') || n.includes('são paulo') || n.includes('sao paulo') || n.includes('brazil')) return 'America/Sao_Paulo';
        // Playas
        if (n.includes('bora bora') || n.includes('french polynesia')) return 'Pacific/Tahiti';
        // Templos
        if (n.includes('angkor') || n.includes('cambodia')) return 'Asia/Phnom_Penh';
        if (n.includes('taj mahal') || n.includes('india')) return 'Asia/Kolkata';
        return null; // sin zona horaria conocida
    }

    function formatLocalTime(tz) {
        try {
            return new Date().toLocaleTimeString('en-US', { ...CLOCK_OPTIONS, timeZone: tz });
        } catch { return ''; }
    }

    // Control de intervalos activos para evitar fugas cuando se regeneran resultados
    const activeClocks = [];
    function clearActiveClocks() {
        activeClocks.forEach(id => clearInterval(id));
        activeClocks.length = 0;
    }

    // Cache en memoria para evitar múltiples fetch y errores intermitentes
    let dataCache = null;
    async function getData() {
        try {
            if (dataCache) return dataCache;
            const res = await fetch('travel_recommendation_api.json', { cache: 'no-store' });
            console.log('Respuesta del fetch:', res);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log('Datos cargados correctamente:', data);
            dataCache = data;
            return data;
        } catch (err) {
            console.error('Error al obtener datos:', err);
            throw err;
        }
    }

    // Cargar y mostrar recomendaciones al iniciar la página
    loadInitialRecommendations();

    async function loadInitialRecommendations() {
        try {
            clearActiveClocks();
            const data = await getData();
            let featuredResults = [];
            if (data.countries?.[0]?.cities?.[0]) featuredResults.push(data.countries[0].cities[0]);
            if (data.temples?.[0]) featuredResults.push(data.temples[0]);
            if (data.beaches?.[0]) featuredResults.push(data.beaches[0]);

            const featuredHeader = document.createElement('h2');
            featuredHeader.textContent = 'Destinos destacados';
            featuredHeader.className = 'featured-header';
            recommendationsDiv.innerHTML = '';
            recommendationsDiv.appendChild(featuredHeader);
            displayResults(featuredResults);
        } catch (error) {
            console.error('Error al cargar los datos iniciales:', error);
            recommendationsDiv.innerHTML = '<div class="no-results">No se pudieron cargar los datos iniciales.</div>';
        }
    }

    const search = async () => {
        const keyword = (searchInput.value || '').toLowerCase().trim();
        clearActiveClocks();
        recommendationsDiv.innerHTML = '';

        if (keyword === '') {
            loadInitialRecommendations();
            return;
        }

        try {
            const data = await getData();
            console.log(`Búsqueda para: "${keyword}"`);
            let results = [];

            if (BEACH_KEYWORDS.has(keyword)) {
                results = data.beaches || [];
                console.log('Resultados de playas:', results);
            } else if (TEMPLE_KEYWORDS.has(keyword)) {
                results = data.temples || [];
                console.log('Resultados de templos:', results);
            } else if (COUNTRY_KEYWORDS.has(keyword)) {
                (data.countries || []).forEach(country => {
                    results.push(...(country.cities || []));
                });
                console.log('Resultados de países (ciudades):', results);
            } else {
                (data.countries || []).forEach(country => {
                    if (country.name?.toLowerCase().includes(keyword)) {
                        results.push(...(country.cities || []));
                    }
                    (country.cities || []).forEach(city => {
                        if (city.name?.toLowerCase().includes(keyword)) results.push(city);
                    });
                });
                (data.temples || []).forEach(temple => {
                    if (temple.name?.toLowerCase().includes(keyword)) results.push(temple);
                });
                (data.beaches || []).forEach(beach => {
                    if (beach.name?.toLowerCase().includes(keyword)) results.push(beach);
                });
                console.log('Resultados de búsqueda general:', results);
            }

            displayResults(results);
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            recommendationsDiv.innerHTML = `<div class="no-results">Error al cargar las recomendaciones: ${error?.message || ''}</div>`;
        }
    };

    const displayResults = (results) => {
        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No se encontraron resultados.';
            recommendationsDiv.appendChild(noResults);
            return;
        }

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'recommendations-grid';
        
        results.forEach(item => {
            const recommendation = document.createElement('div');
            recommendation.classList.add('recommendation');

            const imageContainer = document.createElement('div');
            imageContainer.className = 'recommendation-image';
            
            const image = document.createElement('img');
            image.src = item.imageUrl;
            image.alt = item.name;
            image.onerror = function() {
                // Si la imagen no carga, usar una imagen de respaldo
                this.onerror = null;
                this.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800';
                console.log(`Error al cargar la imagen para ${item.name}, usando imagen de respaldo`);
            };
            
            imageContainer.appendChild(image);

            const content = document.createElement('div');
            content.className = 'recommendation-content';
            
            const name = document.createElement('h3');
            name.textContent = item.name;

            const description = document.createElement('p');
            description.textContent = item.description;

            // --- Hora local del destino (opcional) ---
            const tz = getTimeZoneForItem(item.name);
            let timeWrapper = null;
            if (tz) {
                timeWrapper = document.createElement('div');
                timeWrapper.className = 'local-time';
                const label = document.createElement('span');
                label.textContent = 'Hora local: ';
                const timeEl = document.createElement('strong');
                function updateClock() { timeEl.textContent = formatLocalTime(tz); }
                updateClock();
                const id = setInterval(updateClock, 1000);
                activeClocks.push(id);
                timeWrapper.appendChild(label);
                timeWrapper.appendChild(timeEl);
            }
            
            const viewButton = document.createElement('button');
            viewButton.className = 'view-btn';
            viewButton.textContent = 'Ver más';
            viewButton.addEventListener('click', () => {
                alert(`¡Has seleccionado visitar ${item.name}!`);
            });

            content.appendChild(name);
            content.appendChild(description);
            if (timeWrapper) content.appendChild(timeWrapper);
            content.appendChild(viewButton);

            recommendation.appendChild(imageContainer);
            recommendation.appendChild(content);

            resultsContainer.appendChild(recommendation);
        });
        
        recommendationsDiv.appendChild(resultsContainer);
        
        console.log(`Se mostraron ${results.length} resultados`);
    };

    const clearResults = () => {
        searchInput.value = '';
        clearActiveClocks();
        recommendationsDiv.innerHTML = '';
        loadInitialRecommendations();
    };

    searchBtn.addEventListener('click', search);
    clearBtn.addEventListener('click', () => { searchInput.value = ''; clearActiveClocks(); loadInitialRecommendations(); });

    // Requisito: solo buscar al hacer clic (sin Enter)
});
