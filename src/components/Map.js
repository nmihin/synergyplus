import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/styles.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibGltYm83NzciLCJhIjoiY2pqZ3Q4b2I0MG1keDN2bGcxMnZkeHpwYyJ9.xzM2vWikDaCZyqP_yt7VVg';

function Map() {
  const [map, setMap] = useState(null);
  const [layers, setLayers] = useState([
    { id: 'roads', name: 'Roads', visible: true },
    { id: 'railways', name: 'Railways', visible: true },
    { id: 'pollution', name: 'Pollution', visible: true },
  ]);

  useEffect(() => {
    // Initialize the map when the component is mounted
    const mapInstance = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [15.2, 45.1],
      zoom: 7,
    });

    mapInstance.on('load', () => {
      // Add map layers
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
          'line-width': 2,
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
          'line-color': '#E1E2DB',
          'line-width': 2,
        },
      });

      mapInstance.addLayer({
        id: 'pollution',
        type: 'circle',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.2ydd5w3k',
        },
        'source-layer': 'worldwide-pollution-do9oi2',
        paint: {
          'circle-color': '#006acc',
          'circle-radius': 4,
        },
        layout: {
          visibility: 'visible',
        },
      });
    });

    setMap(mapInstance);

    return () => mapInstance.remove();
  }, []);

  const toggleLayer = (layerId) => {
    if (map) {
      const visibility = map.getLayoutProperty(layerId, 'visibility');
      map.setLayoutProperty(layerId, 'visibility', visibility === 'visible' ? 'none' : 'visible');

      // Update the layer visibility state
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        )
      );
    }
  };

  return (
    <div className="relative">
      <div id="map" style={{ width: '100%', height: '600px' }}></div>

      {/* Layer control panel */}
      <div
        className="absolute top-4 right-4 bg-white shadow-lg rounded-md p-4"
        style={{ width: '250px' }}
      >
        <h5 className="font-bold mb-3">Layers</h5>
        <div>
          {layers.map((layer) => (
            <div key={layer.id} className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={layer.id}
                checked={layer.visible}
                onChange={() => toggleLayer(layer.id)}
              />
              <label className="form-check-label" htmlFor={layer.id}>
                {layer.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Map;
