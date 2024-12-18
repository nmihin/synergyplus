import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next'; // Keep the import for useTranslation
import 'mapbox-gl/dist/mapbox-gl.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/styles.css';
import { OpenAI } from 'openai';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY, 
  dangerouslyAllowBrowser: true, 
});

function Map() {
  const [map, setMap] = useState(null);
  const [pollutionData, setPollutionData] = useState([]);
  const [layers, setLayers] = useState([
    { id: 'counties', name: 'Županije', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'roads', name: 'Ceste', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'railways', name: 'Željeznice', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'pollution', name: 'Onečišćenje', visible: false, type: 'data', typeName: 'Podaci' },
  ]);
  const { t } = useTranslation(); // Use the hook to get translations
  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'good':
        return 'bg-green-500'; 
      case 'moderate':
        return 'bg-yellow-500';
      case 'bad':
        return 'bg-red-500'; 
      default:
        return 'bg-gray-400'; 
    }
  };

  useEffect(() => {
    const fetchPollutionData = async () => {
      try {
        // Construct the API URL with refine query for "Croatia"
        const url = '/api/explore/v2.1/catalog/datasets/worldwide-pollution/records?limit=20&refine=country%3A%22Croatia%22';
    
        // Fetch data from the OpenDataSoft API
        const response = await fetch(url, {
          method: 'GET', // Use GET method
          headers: {
            'Content-Type': 'application/json', // Ensure the content type is JSON
            // If authentication is required, add your API key or token here:
            // 'Authorization': `Bearer YOUR_API_KEY`
          },
        });
    
        // Check if response is okay (status 200)
        if (!response.ok) {
          // Log and throw error if response status is not OK
          const errorText = await response.text();  // Read the error response
          console.error('Error fetching pollution data:', errorText);
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
    
        // Parse the JSON data from the response
        const data = await response.json();
    
        // Log the fetched data to verify
        console.log(data);
    
        // Store the fetched records in state
        setPollutionData(data.records); // Assuming the 'records' field contains the pollution data
      } catch (error) {
        // Handle any errors that occur during the fetch
        console.error('Error fetching pollution data:', error);
      }
    };
    
    

    fetchPollutionData();

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

          popup.setLngLat(coordinates)
          .setHTML(`
            <h6 class="text-lg font-semibold text-left">${t('pollution.title')}</h6>
            <p class="text-left mb-1">
              <strong>${t('pollution.main_pollutant')}:</strong> ${properties.dominant || 'N/A'}
            </p>
            <p class="text-left mb-1">
              <strong>${t('pollution.co_level')}:</strong> 
              <span class="flex items-center">
                <span class="w-2.5 h-2.5 rounded-full mr-2 ${getCategoryColor(properties.category_co)}"></span>
                ${t(`pollution.categories.${properties.category_co?.toLowerCase()}`) || 'N/A'} - ${properties.value_co || 'N/A'}
              </span>
            </p>
            <p class="text-left mb-1">
              <strong>${t('pollution.no2_level')}:</strong> 
              <span class="flex items-center">
                <span class="w-2.5 h-2.5 rounded-full mr-2 ${getCategoryColor(properties.category_no2)}"></span>
                ${t(`pollution.categories.${properties.category_no2?.toLowerCase()}`) || 'N/A'} - ${properties.value_no2 || 'N/A'}
              </span>
            </p>
            <p class="text-left mb-1">
              <strong>${t('pollution.o3_level')}:</strong> 
              <span class="flex items-center">
                <span class="w-2.5 h-2.5 rounded-full mr-2 ${getCategoryColor(properties.category_o3)}"></span>
                ${t(`pollution.categories.${properties.category_o3?.toLowerCase()}`) || 'N/A'} - ${properties.value_o3 || 'N/A'}
              </span>
            </p>
            <p class="text-left mb-1">
              <strong>${t('pollution.pm25_level')}:</strong> 
              <span class="flex items-center">
                <span class="w-2.5 h-2.5 rounded-full mr-2 ${getCategoryColor(properties.category_pm25)}"></span>
                ${properties.value_pm5 || 'N/A'} - ${t(`pollution.categories.${properties.category_pm25?.toLowerCase()}`) || 'N/A'}
              </span>
            </p>
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
  }, [t]);

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
