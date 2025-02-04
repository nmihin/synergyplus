import mapboxgl from 'mapbox-gl';

export function registerMapClickEvents(mapInstance, origin, t, setMessage) {
  let markers = []; // Track markers globally

  // Click event for the 'stone' layer
  
  mapInstance.on('click', 'stone', async (e) => {
    const features = mapInstance.queryRenderedFeatures(e.point, {
      layers: ['stone'],
    });

    if (features.length > 0) {
      const feature = features[0];
      const destination = feature.geometry.coordinates; // [lng, lat]

      const googleMapsUrl = `https://www.google.com/maps/dir/${origin[1]},${origin[0]}/${destination[1]},${destination[0]}`;
      setMessage(`Link na rutu: ${googleMapsUrl}`);

      // Remove any existing markers before adding new ones
      markers.forEach((marker) => marker.remove());
      markers = []; // Clear the markers array

      try {
        const response = await fetch(
          `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.trips && data.trips.length > 0) {
          const route = data.trips[0].geometry;
          const distanceKm = (data.trips[0].distance / 1000).toFixed(2);

          if (mapInstance.getSource('route')) {
            mapInstance.getSource('route').setData(route);
          } else {
            mapInstance.addSource('route', {
              type: 'geojson',
              data: route,
            });

            mapInstance.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#007cbf',
                'line-width': 2,
              },
            });
          }

          // Add markers for origin and destination
          const originMarker = new mapboxgl.Marker({ color: 'red' })
            .setLngLat(origin)
            .addTo(mapInstance);
          markers.push(originMarker);

          const destinationMarker = new mapboxgl.Marker({ color: 'red' })
            .setLngLat(destination)
            .addTo(mapInstance);
          markers.push(destinationMarker);

          // Add distance label
          const labelFeatures = [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: origin },
              properties: { title: `Udaljenost do lokacije i natrag: ${distanceKm} km` },
            },
          ];
          const labelGeoJSON = {
            type: 'FeatureCollection',
            features: labelFeatures,
          };

          if (mapInstance.getSource('distance-labels')) {
            mapInstance.getSource('distance-labels').setData(labelGeoJSON);
          } else {
            mapInstance.addSource('distance-labels', {
              type: 'geojson',
              data: labelGeoJSON,
            });

            mapInstance.addLayer({
              id: 'distance-labels',
              type: 'symbol',
              source: 'distance-labels',
              layout: {
                'text-field': ['get', 'title'],
                'text-size': 12,
                'text-offset': [6, -2.75],
                'text-anchor': 'top',
              },
              paint: { 'text-color': '#044786' },
            });
          }
        }
      } catch (error) {
        console.error('Error fetching route:', error);
      }

      // Show popup with feature information
      const {
        name = 'nema podataka',
        status = 'nema podataka',
        material = 'nema podataka',
        manager = 'nema podataka',
        capacity = 'nema podataka',
        exploatation_fee,
        general_data,
        all_spaces_exploatation_fields = 'nema podataka',
      } = feature.properties;

      const parsedGeneralData = general_data ? JSON.parse(general_data) : {};

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="max-height: 300px; overflow-y: scroll;">
            <h6 class="text-lg font-semibold">${name}</h6>
            <p class="text-left mb-0"><strong>Status:</strong> ${status}</p>
            <p class="text-left mb-0"><strong>Materijal:</strong> ${material}</p>
            <p class="text-left mb-0"><strong>Dostupno tona tjedno:</strong> ${capacity}</p>
            <p class="text-left mb-0"><strong>Upravitelj:</strong> ${manager}</p>
            <hr>
            <h6 class="text-lg font-semibold">Ovlaštenik</h6>
            <p class="text-left mb-0"><strong>Naziv:</strong> ${parsedGeneralData.name || "nema podataka"}</p>
            <p class="text-left mb-0"><strong>OIB:</strong> ${parsedGeneralData.OIB || "nema podataka"}</p>
            <p class="text-left mb-0"><strong>Adresa:</strong> 
              ${parsedGeneralData.street || "nema podataka"}, 
              ${parsedGeneralData.postal_number || "nema podataka"} 
              ${parsedGeneralData.settlement || "nema podataka"}, 
              ${parsedGeneralData.state || "nema podataka"}
            </p>
            <hr>
            <p class="text-left mb-0">
              <strong>Svi istražni prostori i eksploatacijska polja:</strong> 
              ${all_spaces_exploatation_fields === "Yes" ? "Da" : all_spaces_exploatation_fields === "No" ? "Ne" : all_spaces_exploatation_fields}
            </p>
          </div>
        `)
        .addTo(mapInstance);
    }
  });
  
  // Click event for the 'industry' layer
  mapInstance.on('click', 'industry', (e) => {
    const features = mapInstance.queryRenderedFeatures(e.point, {
      layers: ['industry'],
    });

    if (features.length > 0) {
      const feature = features[0];
      const { name, address, company } = feature.properties;

      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
            <h6 class="text-lg font-semibold">${name}</h6>
            <p><strong>${t('industry.address')}:</strong> ${address}</p>
            <p><strong>${t('industry.company')}:</strong> ${company}</p>
        `)
        .addTo(mapInstance);
    }
  });
}
