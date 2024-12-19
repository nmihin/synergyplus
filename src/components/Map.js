import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next'; 
import 'mapbox-gl/dist/mapbox-gl.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/styles.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

function Map() {
  const [map, setMap] = useState(null);
  const [layers, setLayers] = useState([
    { id: 'counties', name: 'Županije', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'roads', name: 'Ceste', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'railways', name: 'Željeznice', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'chargingstations', name: 'Punionice', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'pollution', name: 'Onečišćenje', visible: false, type: 'data', typeName: 'Podaci' },
    { id: 'industry', name: 'Cementare', visible: false, type: 'industry', typeName: 'Industrija' },
  ]);
  const { t } = useTranslation();
  const [pollutionData, setPollutionData] = useState(null);
  const [markers, setMarkers] = useState([]); // Pollution markers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/worldwide-pollution/records?limit=100&refine=country%3A%22Croatia%22';

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'good':
        return '#66ef00'; // Green
      case 'moderate':
        return '#e6fc00'; // Yellow
      case 'bad':
        return '#f44336'; // Red
      default:
        return '#d1fa00'; // Default yellow
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setPollutionData(result.results);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const mapInstance = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [15.2, 45.1],
      zoom: 7,
    });

    mapInstance.on('load', () => {
      // Add the counties layer
      mapInstance.addLayer({
        id: 'counties',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.dqg000hv',
        },
        'source-layer': 'zup-9cdau9',
        paint: {
          'line-color': '#044786',
          'line-width': 2,
        },
        layout: {
          visibility: 'none', // Set initial visibility to 'none'
        },
      });

      // Add the roads layer
      mapInstance.addLayer({
        id: 'roads',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.4s9h2zhx',
        },
        'source-layer': 'europe-road-2vsqhc',
        paint: {
          'line-color': '#111',
          'line-width': 1,
        },
        layout: {
          visibility: 'none', // Set initial visibility to 'none'
        },
      });

      // Add the railways layer
      mapInstance.addLayer({
        id: 'railways',
        type: 'line',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.aqisum0b',
        },
        'source-layer': 'europe-rail-road-044x6d',
        paint: {
          'line-color': '#1E66A8',
          'line-width': 1,
        },
        layout: {
          visibility: 'none', // Set initial visibility to 'none'
        },
      });

      // Add the charging stations layer with popups
      mapInstance.addLayer({
        id: 'chargingstations',
        type: 'circle',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.2j7np18a',
        },
        'source-layer': 'Geoportal_elektricne_punionic-7m6rfn',
        paint: {
          'circle-color': '#00C0FD',
          'circle-radius': 4,
        },
        layout: {
          visibility: 'none',
        },
      });

      // Add the industry layer with popups
      mapInstance.addLayer({
        id: 'industry',
        type: 'circle',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.cg3arnwd',
        },
        'source-layer': 'cementare-3vo6f9',
        paint: {
          'circle-color': '#00C0FD',
          'circle-radius': 4,
        },
        layout: {
          visibility: 'none',
        },
      });

      // Add a click event listener for the industry layer to show popups
      mapInstance.on('click', 'industry', (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['industry'],
        });

        if (features.length > 0) {
          const feature = features[0];
          const { name, address, company, color } = feature.properties;

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

      setMap(mapInstance);
    });

    return () => mapInstance.remove();
  }, [pollutionData, t]);

  const toggleLayer = (layerId) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );

    if (map) {
      if (layerId === 'pollution') {
        // Handle pollution markers visibility
        if (!markers.length) {
          const newMarkers = pollutionData.map((record) => {
            const {
              value_co,
              value_o3,
              value_pm5,
              value_pm25,
              value_no2,
              color,
              dominant,
              category_co,
              category_o3,
              category_pm25,
              category_no2,
            } = record;

            const marker = new mapboxgl.Marker({ color })
              .setLngLat([record.geopoint.lon, record.geopoint.lat])
              .setPopup(
                new mapboxgl.Popup().setHTML(`
                  <h6 class="text-lg font-semibold text-left">${t('pollution.title')}</h6>
                  <p class="text-left mb-1">
                    <strong>${t('pollution.main_pollutant')}:</strong> ${dominant || 'N/A'}
                  </p>
                  <p class="text-left mb-1">
                    <strong>${t('pollution.co_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_co)};"></span>
                      ${t(`pollution.categories.${category_co.toLowerCase()}`)} - ${value_co || 'N/A'}
                    </span>
                  </p>
                  <p class="text-left mb-1">
                    <strong>${t('pollution.no2_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_no2)};"></span>
                      ${t(`pollution.categories.${category_no2.toLowerCase()}`)} - ${value_no2 || 'N/A'}
                    </span>
                  </p>
                  <p class="text-left mb-1">
                    <strong>${t('pollution.o3_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_o3)};"></span>
                      ${t(`pollution.categories.${category_o3.toLowerCase()}`)} - ${value_o3 || 'N/A'}
                    </span>
                  </p>
                  <p class="text-left mb-1">
                    <strong>${t('pollution.pm25_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_pm25)};"></span>
                      ${t(`pollution.categories.${category_pm25.toLowerCase()}`)} - ${value_pm5 || 'N/A'}
                    </span>
                  </p>
                `)         
              );
            return marker;
          });

          setMarkers(newMarkers);
          newMarkers.forEach((marker) => marker.addTo(map)); // Add markers to the map
        } else {
          // Toggle the visibility of pollution markers
          markers.forEach((marker) => {
            if (marker.getElement().style.display === 'none') {
              marker.getElement().style.display = '';
            } else {
              marker.getElement().style.display = 'none';
            }
          });
        }
      } else {
        // Toggle visibility of other layers (counties, roads, railways)
        const visibility = layers.find((layer) => layer.id === layerId)?.visible
          ? 'none'
          : 'visible';

        map.setLayoutProperty(layerId, 'visibility', visibility);
      }
    }
  };

  // Group layers by type
  const groupedLayers = layers.reduce((acc, layer) => {
    if (!acc[layer.type]) {
      acc[layer.type] = [];
    }
    acc[layer.type].push(layer);
    return acc;
  }, {});

  return (
    <div className="relative">
      <div id="map" style={{ width: '100%', height: '600px' }}></div>

      {/* Layer control panel */}
      <div
        className="absolute top-4 right-4 bg-white shadow-lg rounded-md p-4"
        style={{ width: '250px' }}
      >
        <div>
          {Object.keys(groupedLayers).map((type) => (
            <div key={type}>
              <h6 className="layer-type-title">{groupedLayers[type][0].typeName}</h6>
              {groupedLayers[type].map((layer) => (
                <div key={layer.id} className="form-check mb-2 d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={layer.id}
                    checked={layer.visible}
                    onChange={() => toggleLayer(layer.id)}
                  />
                  <label className="form-check-label ms-2" htmlFor={layer.id}>
                    {layer.name}
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Map;
