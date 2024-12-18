import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from '../locales/translations.json'; 
import 'mapbox-gl/dist/mapbox-gl.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/styles.css';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      hr: {
        translation: translations,
      },
    },
    lng: 'hr', 
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
  });

mapboxgl.accessToken = 'pk.eyJ1IjoibGltYm83NzciLCJhIjoiY2pqZ3Q4b2I0MG1keDN2bGcxMnZkeHpwYyJ9.xzM2vWikDaCZyqP_yt7VVg';

function Map() {
  const [map, setMap] = useState(null);
  const [layers, setLayers] = useState([
    { id: 'counties', name: 'Županije', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'roads', name: 'Ceste', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'railways', name: 'Željeznice', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'pollution', name: 'Onečišćenje', visible: false, type: 'data', typeName: 'Podaci' },
  ]);

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
          visibility: 'none',
        },
      });
      

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
          visibility: 'none',
        },
      });

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
          visibility: 'none',
        },
      });

      // Add the pollution layer
      mapInstance.addLayer({
        id: 'pollution',
        type: 'circle',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.2ydd5w3k',
        },
        'source-layer': 'worldwide-pollution-do9oi2',
        paint: {
          'circle-color': '#00C0FD',
          'circle-radius': 4,
        },
        layout: {
          visibility: 'none',
        },
      });

      // Add a popup for the 'pollution' layer on hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      });

      mapInstance.on('mouseenter', 'pollution', (e) => {
        if (e.features && e.features.length > 0) {
          const properties = e.features[0].properties;
          const coordinates = e.features[0].geometry.coordinates.slice();

          console.log(e)

          // Set the popup content
          popup
            .setLngLat(coordinates)
            .setHTML(`
              <h6>Podaci onečišćenja</h6>
              <p><strong>Glavni onečišćivać:</strong> ${properties.dominant || 'N/A'}</p>
              <p><strong>CO razina:</strong> ${properties.category_co || 'N/A'} - ${properties.value_co || 'N/A'}</p>
              <p><strong>NO2 razina:</strong> ${properties.category_no2 || 'N/A'} - ${properties.value_no2 || 'N/A'}</p>
              <p><strong>O3 razina:</strong> ${properties.category_o3 || 'N/A'} - ${properties.value_o3 || 'N/A'}</p>
              <p><strong>Razina onečišćenja (PM2.5):</strong> ${properties.value_pm5 || 'N/A'} - ${properties.category_pm25 || 'N/A'}</p>
            `)
            .addTo(mapInstance);

          // Change the cursor style
          mapInstance.getCanvas().style.cursor = 'pointer';
        }
      });

      mapInstance.on('mouseleave', 'pollution', () => {
        // Remove the popup and reset the cursor style
        popup.remove();
        mapInstance.getCanvas().style.cursor = '';
      });

      setMap(mapInstance);
    });

    return () => mapInstance.remove();
  }, []);

  const toggleLayer = (layerId) => {
    if (map) {
      const visibility = map.getLayoutProperty(layerId, 'visibility');
      map.setLayoutProperty(layerId, 'visibility', visibility === 'visible' ? 'none' : 'visible');

      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        )
      );
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
