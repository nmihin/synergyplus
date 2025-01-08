import React, { useEffect, useState, useRef  } from 'react';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next'; 
import FilterData from './FilterData';
import { toast, ToastContainer } from "react-toastify";
import layersConfig from '../config/layersConfig';
import { registerMapClickEvents } from '../events/mapClickEvents';
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
  const [message, setMessage] = useState("");

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
      registerMapClickEvents(mapInstance, origin, t, setMessage);

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
  
    if (!selectedLocations || selectedLocations.length === 0) {
      toast.error('Molim odaberite minimalno jednu sirovinu za kreiranje narudžbe.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
  
    // Filter out invalid or undefined entries
    const filteredLocations = selectedLocations.filter((loc) => loc && loc.material && loc.quantity);
    if (filteredLocations.length === 0) {
      console.warn('No valid locations in selectedLocations.');
      toast.error('Molim odaberite važeće lokacije za kreiranje narudžbe.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
  
    console.log('Filtered Locations:', filteredLocations);
  
    // Fetch features from the 'stone' layer
    const stoneLayerId = 'stone';
    const stoneLayerFeatures = mapInstance.querySourceFeatures(stoneLayerId, {
      sourceLayer: 'JISMS_WebGis_podaci_updated-96gt90',
    });
  
    if (!stoneLayerFeatures || stoneLayerFeatures.length === 0) {
      console.error('No features found in stoneLayerFeatures.');
      toast.error('Nema dostupnih značajki u sloju.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
  
    console.log('Stone Layer Features:', stoneLayerFeatures);
  
    // Function to calculate distance using Haversine formula
    const calculateDistance = (coords1, coords2) => {
      const toRadians = (deg) => (deg * Math.PI) / 180;
      const [lng1, lat1] = coords1;
      const [lng2, lat2] = coords2;
  
      const R = 6371; // Earth's radius in km
      const dLat = toRadians(lat2 - lat1);
      const dLng = toRadians(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    };
  
    // Map and find the closest feature with sufficient capacity
    const updatedLocations = filteredLocations
      .map((location) => {
        const validFeatures = stoneLayerFeatures.filter(
          (feature) =>
            feature.properties.material === location.material &&
            feature.properties.capacity >= parseFloat(location.quantity) // Check capacity
        );
  
        if (validFeatures.length > 0) {
          // Find the closest feature to the origin
          const closestFeature = validFeatures.reduce((closest, feature) => {
            const featureCoords = feature.geometry.coordinates;
            const distance = calculateDistance(location.coordinates || origin, featureCoords);
  
            if (!closest || distance < closest.distance) {
              return { feature, distance };
            }
            return closest;
          }, null);
  
          if (closestFeature) {
            const { capacity } = closestFeature.feature.properties;
            const [lng, lat] = closestFeature.feature.geometry.coordinates;
            return { ...location, coordinates: [lng, lat], capacity };
          }
        } else {
          console.warn('No matching features with sufficient capacity for location:', location);
        }
  
        return null; // Exclude locations without sufficient capacity
      })
      .filter(Boolean);
  
    // Filter out locations without coordinates

    console.log(updatedLocations)
    console.log(selectedLocations)
    console.log(stoneLayerFeatures)

    const validLocations = updatedLocations.filter((loc) => loc.coordinates);
    if (validLocations.length === 0) {
      toast.error('Nema pronađenih lokacija sa dovoljnim kapacitetom za odabrane sirovine.', {
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
  
        // Generate Google Maps link
        const googleMapsBaseUrl = "https://www.google.com/maps/dir/";
        const googleMapsWaypoints = validLocations
          .map((loc) => `${loc.coordinates[1]},${loc.coordinates[0]}`)
          .join("/");
  
        const googleMapsUrl = `${googleMapsBaseUrl}${origin[1]},${origin[0]}/${googleMapsWaypoints}`;
  
        setMessage(`Link na rutu: ${googleMapsUrl}`);
  
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
              title: `Ukupna udaljenost dolokacija i natrag: ${distanceKm} km`, // Display the total distance in kilometers
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

    const baseUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : 'https://synergyplus-yjck.vercel.app';
    
    try {
      const response = await axios.post(`${baseUrl}/send-sms`, { to, message });
        
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
