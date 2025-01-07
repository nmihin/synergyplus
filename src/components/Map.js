import React, { useEffect, useState, useRef  } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next'; 
import { FaSearch } from 'react-icons/fa';
import { InputGroup, FormControl, Form, Button, Row, Col } from 'react-bootstrap';
import { toast, ToastContainer } from "react-toastify";
import layersConfig from './../config/layersConfig';
import { registerMapClickEvents } from './../events/mapClickEvents';
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
  const [pollutionData, setPollutionData] = useState(null);
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

  const apiUrl = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/worldwide-pollution/records?limit=100&refine=country%3A%22Croatia%22';

  const materials = [
    { material: 'Keramička i vatrostalna glina', color: '#D2691E', coordinates: [15.996913, 46.050043] },
    { material: 'Tehničko-građevni kamen', color: '#808080', coordinates: [16.403424, 46.157390] },
    { material: 'Građevni pijesak i šljunak', color: '#F4A300', coordinates: [16.297936, 46.333998] },
    { material: 'Ciglarska glina', color: '#B74A2E', coordinates: [16.2619, 46.2453] },
    { material: 'Karbonatne mineralne sirovine za industrijsku preradbu', color: '#4CAF50', coordinates: [16.142347, 46.333528] },
  ];

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
  }, [pollutionData, t, origin]);

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
        toast.error(error.message, {
          position: 'top-right',  // Toast position
          autoClose: 3000,        // Auto-close time in milliseconds
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
                new mapboxgl.Popup({ maxWidth: '400px' }).setHTML(`
                  <h6 class="text-lg font-semibold text-left">${t('pollution.title')}</h6>
                  <p class="text-left mb-0">
                    <strong>${t('pollution.main_pollutant')}:</strong> ${dominant || 'N/A'}
                  </p>
                  <p class="text-left mb-0">
                    <strong>${t('pollution.co_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_co)};"></span>
                      ${t(`pollution.categories.${category_co.toLowerCase()}`)} - ${value_co || 'N/A'}
                    </span>
                    <p class="text-left text-[10px]">Visoke razine CO često su povezane s područjima gustog prometa.</p>
                  </p>
                  <p class="text-left mb-0">
                    <strong>${t('pollution.no2_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_no2)};"></span>
                      ${t(`pollution.categories.${category_no2.toLowerCase()}`)} - ${value_no2 || 'N/A'}
                    </span>
                    <p class="text-left text-[10px]">Povišene razine često su povezane s urbanim područjima s velikim prometom.</p>
                  </p>
                  <p class="text-left mb-0">
                    <strong>${t('pollution.o3_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_o3)};"></span>
                      ${t(`pollution.categories.${category_o3.toLowerCase()}`)} - ${value_o3 || 'N/A'}
                    </span>
                    <p class="text-left text-[10px]">Jako podložan temperaturi i sunčevoj svjetlosti, s vrhuncima u poslijepodnevnim satima.</p>
                  </p>
                  <p class="text-left mb-0">
                    <strong>${t('pollution.pm25_level')}:</strong> 
                    <span class="flex items-center">
                      <span class="w-2.5 h-2.5 rounded-full mr-2" style="background-color: ${getCategoryColor(category_pm25)};"></span>
                      ${t(`pollution.categories.${category_pm25.toLowerCase()}`)} - ${value_pm5 || 'N/A'}
                    </span>
                    <p class="text-left text-[10px]">PM2.5 često korelira s CO i NO u područjima s intenzivnom aktivnošću sagorijevaju goriva.</p>
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
      position: 'top-right',  // You can change the position if needed
      autoClose: 3000,        // The toast will auto-close after 3 seconds
    });
    // Add logic to handle the order (e.g., save to the backend)
  };

  const createOptimizedRoute = async () => {
    const mapInstance = mapInstanceRef.current;

    if (selectedLocations.length === 0) {
      toast.error('Molim odaberite minimalno jednu sirovinu za kreiranje narudžbe.', {
        position: 'top-right',  // Toast position
        autoClose: 3000,        // Auto-close time in milliseconds
      });
      return;
    }

    try {
      const origin = [16.367245, 45.516107]; // Example origin (this can be dynamic too)
      const waypoints = selectedLocations
        .filter((loc) => loc.quantity > 0)
        .map((loc) => loc.coordinates.join(','))
        .join(';');

      const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${origin.join(
        ','
      )};${waypoints};${origin.join(',')}?overview=full&geometries=geojson&roundtrip=true&access_token=${mapboxgl.accessToken}`;

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

        toast.success(`Optimizirana ruta kreirana! Totalna udaljenost: ${distanceKm} km.`, {
          position: 'top-right',  // Toast position
          autoClose: 3000,        // Auto-close time in milliseconds
        });
      } else {
        toast.error(`Ruta se ne može generirati.`, {
          position: 'top-right',  // Toast position
          autoClose: 3000,        // Auto-close time in milliseconds
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
      <section id="filter-data">
      <div className="row">
        {/* FILTER */}
        <div className="col-md-12 z-10">
            <InputGroup className="pl-4 pr-4 pt-4">
              <InputGroup.Text>    <FaSearch /></InputGroup.Text>

              <FormControl
                ref={inputRef}
                value={selectedPlace.replace(", Croatia", "")} 
                onChange={(e) => setSelectedPlace(e.target.value)} // Update input value
                placeholder="Upiši lokaciju..."
                aria-label="Lokacija"
              />
            </InputGroup>
            {predictions.length > 0 && (
              <ul
                className="list-group position-absolute w-full pl-4 pr-4"
              >
                {predictions.map((prediction) => (
                  <li
                  key={prediction.id}
                  className="list-group-item list-group-item-action"
                  style={{ textAlign: "left" }}  // Align the text to the left
                  onClick={() => handleSelectPlace(prediction)}
                >
                  {prediction.place_name.replace(", Croatia", "")}
                </li>
                ))}
              </ul>
            )}
        </div>
        {/* ORDER */}
        <div className="col-md-12 mt-4">
      <h5>Odaberi sirovine</h5>
      <Form>
        {materials.map((item, index) => (
          <Form.Group as={Row} key={index} className="mb-3 align-items-center pr-4">
            <Col md={8} className="relative">
            <div
                style={{
                  top:0,
                  bottom:0,
                  left: '1.75rem',
                  position: 'absolute',
                  backgroundColor: item.color,
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  margin: 'auto'
                }}
              ></div>
              <Form.Label className="pl-8 float-left mb-0" style={{ fontSize: '14px', lineHeight: '1', textAlign: 'left' }}>
                {item.material}
              </Form.Label>
            </Col>
            <Col md={4}>
              <InputGroup>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="kg"
                  onChange={(e) =>
                    handleMaterialChange(index, item.material, e.target.value)
                  }
                />
              </InputGroup>
            </Col>
          </Form.Group>
        ))}
        <div className="row pl-4 pr-4">
          <div className="col-md-12 z-10">
            <Button className="w-full mb-2" variant="primary" onClick={createOptimizedRoute}>
              Kreiraj optimiziranu rutu
            </Button>
          </div>
          <div className="col-md-12 z-10 mb-2">
            <Button className="w-full" variant="secondary" onClick={createOrder}>
              Kreiraj narudžbu
            </Button>
          </div>
          <div className="col-md-12 z-10">
            <Button className="w-full" variant="secondary" onClick={sendSMS}>
              Pošalji rutu
            </Button>
          </div>
        </div>
      </Form>
    </div>
        </div>
      </section>
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
