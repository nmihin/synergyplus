import React, { useEffect, useState, useRef  } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next'; 
import FilterData from './FilterData';
import { toast, ToastContainer } from "react-toastify";
import layersConfig from '../config/layersConfig';
import { registerMapClickEvents } from '../events/mapClickEvents';
import * as turf from '@turf/turf';
import axios from 'axios';
import "../assets/ReactToastify.css";
import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'mapbox-gl/dist/mapbox-gl.css';
import '../assets/styles.css';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;

function Map() {
  const [map, setMap] = useState(null);
  const [layers, setLayers] = useState([
    { id: 'counties', name: 'Županije', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'roads', name: 'Ceste', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'railways', name: 'Željeznice', visible: false, type: 'infrastructure', typeName: 'Infrastruktura' },
    { id: 'industry', name: 'Cementare', visible: false, type: 'industry', typeName: 'Industrija' },
    { id: 'stone', name: 'Sirovine', visible: true, type: 'materials', typeName: 'Mineralne sirovine' },
  ]);
  const { t } = useTranslation();
  const [markers, setMarkers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [origin, setOrigin] = useState([16.343972, 46.310371]);
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const [materialOrders, setMaterialOrders] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  //INFOBIP
  const [to, setTo] = useState('+385915251864');
  const [message, setMessage] = useState('Link na rutu: https://goo.gl/maps/DM8WB3uCF8i85tpD9');

  const materials = [
    { material: 'Keramička i vatrostalna glina', color: '#D2691E' },
    { material: 'Tehničko-građevni kamen', color: '#808080'},
    { material: 'Građevni pijesak i šljunak', color: '#F4A300'},
    { material: 'Ciglarska glina', color: '#B74A2E' },
    { material: 'Karbonatne mineralne sirovine za industrijsku preradbu', color: '#4CAF50' },
  ];

  useEffect(() => {
    const mapInstance = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v10',
      center: [16.367245, 45.516107],
      zoom: 7,
    });

    mapInstance.on('load', () => {

      new mapboxgl.Marker({ color: 'red' }) 
      .setLngLat(origin)
      .addTo(mapInstance);

      layersConfig.forEach((layer) => {
        mapInstance.addLayer({
          id: layer.id,
          type: layer.type,
          source: layer.source,
          'source-layer': layer.sourceLayer,
          paint: layer.paint,
          layout: layer.layout,
        });
      });

      // Register click events
      registerMapClickEvents(mapInstance, origin, t);

      setMap(mapInstance);
      mapInstanceRef.current = mapInstance;
    });

    return () => mapInstance.remove();
  }, [t, origin]);

  const toggleLayer = (layerId) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );

    if (map) {
      const visibility = layers.find((layer) => layer.id === layerId)?.visible
      ? 'none'
      : 'visible';

      map.setLayoutProperty(layerId, 'visibility', visibility);
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


  // LOCATION SEARCH
  useEffect(() => {
    if (window.google) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=`+process.env.REACT_APP_GOOGLE_MAP+`&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsGoogleMapsLoaded(true); // Set flag to true when API is loaded
    };

    script.onerror = () => {
      console.error("Error loading Google Maps API.");
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);  // Clean up the script tag on unmount
    };
  }, []);

  const fetchPredictions = async (inputValue) => {
    if (!inputValue) return;

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(inputValue)}.json?access_token=${mapboxgl.accessToken}&country=HR`;

    try {
      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        setPredictions(data.features); // Set predictions from Mapbox geocoding API
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };

  // Effect to initialize the input autocomplete
  useEffect(() => {
    if (inputRef.current) {
      const inputElement = inputRef.current;
      inputElement.addEventListener("input", (e) => {
        fetchPredictions(e.target.value);
      });
    }

    return () => {
      if (inputRef.current) {
        const inputElement = inputRef.current;
        inputElement.removeEventListener("input", fetchPredictions);
      }
    };
  }, []);

  const handleSelectPlace = (place) => {
    setSelectedPlace(place.place_name);
    setPredictions([]); // Clear predictions after selection

    const [lng, lat] = place.center; // Mapbox returns [longitude, latitude]
    setOrigin([lng, lat]);

    // Update map view with selected place
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 12,
      });

      new mapboxgl.Marker().setLngLat([lng, lat]).addTo(mapRef.current); // Add marker
    }

    console.log("Selected Coordinates:", [lng, lat]);
  };

  const handleMaterialChange = (index, material, value) => {
    const updatedLocations = [...selectedLocations];
    updatedLocations[index] = {
      material,
      quantity: value,
      coordinates: materials[index]?.coordinates, // Add predefined coordinates for each material
    };
    setSelectedLocations(updatedLocations);
  };

  const createOrder = () => {
    console.log('Narudžba:', materialOrders);
    toast.success('Narudžba kreirana!', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const createOptimizedRoute = async () => {
    const mapInstance = mapInstanceRef.current;
  
    if (selectedLocations.length === 0) {
      toast.error('Molim odaberite minimalno jednu sirovinu za kreiranje narudžbe.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
  
    // Fetch features from the 'stone' layer
    const stoneLayerId = 'stone';
    const stoneLayerFeatures = mapInstance.querySourceFeatures(stoneLayerId, {
      sourceLayer: 'WebGis-16k5l9',
    });
  
    // Add coordinates to selectedLocations based on material match
    const updatedLocations = selectedLocations.map((location) => {
      if (!location || !location.material) {
        console.warn('Invalid location skipped:', location);
        return location;
      }
      const matchedFeature = stoneLayerFeatures.find(
        (feature) => feature.properties.material === location.material
      );
      if (matchedFeature) {
        const [lng, lat] = matchedFeature.geometry.coordinates;
        return { ...location, coordinates: [lng, lat] };
      }
      console.warn('No matching feature found for location:', location);
      return location;
    });
    
    // Filter out locations without coordinates
    const validLocations = updatedLocations.filter((loc) => loc.coordinates);
  
    if (validLocations.length === 0) {
      toast.error('Nema pronađenih lokacija za odabrane sirovine.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
  
    // Prepare waypoints
    const waypointCoordinates = validLocations.map((loc) => loc.coordinates.join(','));
    const waypoints = waypointCoordinates.join(';');
  
    try {
      const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${origin.join(
        ','
      )};${waypoints}?overview=full&geometries=geojson&roundtrip=true&access_token=${mapboxgl.accessToken}`;
  
      const response = await fetch(url);
      const data = await response.json();
  
      if (data.trips && data.trips.length > 0) {
        const route = data.trips[0].geometry;
        const distanceKm = (data.trips[0].distance / 1000).toFixed(2);
  
        if (mapInstance.getSource('route')) {
          mapInstance.getSource('route').setData(route);
        } else {
          mapInstance.addSource('route', { type: 'geojson', data: route });
  
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

        const labelFeatures = [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: origin, // Place the label at the start of the route (origin)
            },
            properties: {
              title: `Ukupna udaljenost: ${distanceKm} km`, // Display the total distance in kilometers
            },
          },
        ];

        const labelGeoJSON = {
          type: 'FeatureCollection',
          features: labelFeatures,
        };
  
        // Update or add the label layer
        if (mapInstance.getSource('distance-labels')) {
          mapInstance.getSource('distance-labels').setData(labelGeoJSON); // Update existing label
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
            paint: {
              'text-color': '#044786',
            },
          });
        }
  
        toast.success(`Optimizirana ruta kreirana! Totalna udaljenost: ${distanceKm} km.`, {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        toast.error('Ruta se ne može generirati.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching optimized route:', error);
    }
  };

  const sendSMS = async () => {
    try {
        const response = await axios.post('http://localhost:3001/send-sms', { to, message });

        if (response.data.success) {
            toast.success('Poruka poslana!', {
                position: 'top-right',
                autoClose: 3000,
            });
        } else {
            toast.error(`Greška: ${response.data.error}`, {
                position: 'top-right',
                autoClose: 3000,
            });
        }
    } catch (error) {
        toast.error(`Greška: ${error.message}`, {
            position: 'top-right',
            autoClose: 3000,
        });
    }
  };

  return (
    <div className="relative">
      <FilterData
        inputRef={inputRef}
        predictions={predictions}
        handleSelectPlace={handleSelectPlace}
        selectedPlace={selectedPlace}
        setSelectedPlace={setSelectedPlace}
        materials={materials}
        handleMaterialChange={handleMaterialChange}
        createOptimizedRoute={createOptimizedRoute}
        createOrder={createOrder}
        sendSMS={sendSMS}
      />
      <div id="map" style={{ width: '100%', height: '800px' }}></div>
      {/* Layer control panel */}
      <div
        className="absolute p-4 bg-white rounded-md shadow-lg top-4 right-4"
        style={{ width: '250px' }}
      >
        <div>
          {Object.keys(groupedLayers).map((type) => (
            <div key={type}>
              <h6 className="layer-type-title">{groupedLayers[type][0].typeName}</h6>
              {groupedLayers[type].map((layer) => (
                <div key={layer.id} className="mb-2 form-check d-flex align-items-center">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={layer.id}
                    checked={layer.visible}
                    onChange={() => toggleLayer(layer.id)}
                  />
                  <label className="text-left form-check-label ms-2" htmlFor={layer.id}>
                    {layer.name}
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Map;
