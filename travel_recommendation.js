document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearBtn');
    const recommendationsDiv = document.getElementById('recommendations');

    // Cargar y mostrar recomendaciones al iniciar la página
    loadInitialRecommendations();

    function loadInitialRecommendations() {
        // Mostrar algunas recomendaciones destacadas al cargar la página
        fetch('travel_recommendation_api.json')
            .then(response => {
                console.log('Respuesta del fetch:', response);
                return response.json();
            })
            .then(data => {
                console.log('Datos cargados correctamente:', data);
                
                // Mostrar un destino de cada categoría
                let featuredResults = [];
                
                // Obtener una ciudad destacada
                if (data.countries && data.countries.length > 0 && data.countries[0].cities.length > 0) {
                    featuredResults.push(data.countries[0].cities[0]);
                }
                
                // Obtener un templo destacado
                if (data.temples && data.temples.length > 0) {
                    featuredResults.push(data.temples[0]);
                }
                
                // Obtener una playa destacada
                if (data.beaches && data.beaches.length > 0) {
                    featuredResults.push(data.beaches[0]);
                }
                
                // Mostrar resultados destacados
                const featuredHeader = document.createElement('h2');
                featuredHeader.textContent = 'Destinos destacados';
                featuredHeader.className = 'featured-header';
                recommendationsDiv.appendChild(featuredHeader);
                
                displayResults(featuredResults);
            })
            .catch(error => {
                console.error('Error al cargar los datos iniciales:', error);
            });
    }

    const search = () => {
        const keyword = searchInput.value.toLowerCase();
        recommendationsDiv.innerHTML = '';

        if (keyword.trim() === '') {
            loadInitialRecommendations();
            return;
        }

        fetch('travel_recommendation_api.json')
            .then(response => response.json())
            .then(data => {
                console.log(`Búsqueda para: "${keyword}"`);
                console.log('Datos del API:', data);
                
                let results = [];

                if (keyword === 'beach' || keyword === 'beaches' || keyword === 'playa' || keyword === 'playas') {
                    results = data.beaches;
                    console.log('Resultados de playas:', results);
                } else if (keyword === 'temple' || keyword === 'temples' || keyword === 'templo' || keyword === 'templos') {
                    results = data.temples;
                    console.log('Resultados de templos:', results);
                } else if (keyword === 'country' || keyword === 'countries' || keyword === 'país' || keyword === 'paises') {
                    // Aplanar todas las ciudades de todos los países
                    data.countries.forEach(country => {
                        results.push(...country.cities);
                    });
                    console.log('Resultados de países (ciudades):', results);
                } else {
                    // Búsqueda general en todas las categorías
                    data.countries.forEach(country => {
                        country.cities.forEach(city => {
                            if (city.name.toLowerCase().includes(keyword)) {
                                results.push(city);
                            }
                        });
                    });
                    data.temples.forEach(temple => {
                        if (temple.name.toLowerCase().includes(keyword)) {
                            results.push(temple);
                        }
                    });
                    data.beaches.forEach(beach => {
                        if (beach.name.toLowerCase().includes(keyword)) {
                            results.push(beach);
                        }
                    });
                    
                    console.log('Resultados de búsqueda general:', results);
                }

                displayResults(results);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                recommendationsDiv.innerHTML = 'Error al cargar las recomendaciones.';
            });
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
            
            const viewButton = document.createElement('button');
            viewButton.className = 'view-btn';
            viewButton.textContent = 'Ver más';
            viewButton.addEventListener('click', () => {
                alert(`¡Has seleccionado visitar ${item.name}!`);
            });

            content.appendChild(name);
            content.appendChild(description);
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
        recommendationsDiv.innerHTML = '';
        loadInitialRecommendations();
    };

    searchBtn.addEventListener('click', search);
    clearBtn.addEventListener('click', clearResults);
});
