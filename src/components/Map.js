import React, { useEffect, useState, useRef  } from 'react';
import ReactDOM from 'react-dom';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from 'react-i18next'; 
import { FaSearch } from 'react-icons/fa';
import { InputGroup, FormControl } from 'react-bootstrap';
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
  const [markers, setMarkers] = useState([]); // Pollution markers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeData, setRouteData] = useState(null); 
  const locationInput = document.getElementById('location-input');
  const updateButton = document.getElementById('update-coordinates');
  //const inputRef = useRef(null);
  //const origin = [16.343972, 46.310371]; 
  const [predictions, setPredictions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [origin, setOrigin] = useState([16.343972, 46.310371]);
  const inputRef = useRef(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const mapRef = useRef(null);
  const [selectedCity, setSelectedCity] = useState(null);

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
      center: [16.367245, 45.516107],
      zoom: 7,
    });

    mapInstance.on('load', () => {

      mapInstance.addLayer({
        id: 'croatia',
        type: 'fill',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.3uijvh4v',
        },
        'source-layer': 'croatia_Croatia_Country_Bound-c7ga88',
        paint: {
          'fill-color': 'rgba(4, 71, 134, 0.3)', // Semi-transparent blue
          'fill-opacity': 0.3 // Ensure a consistent opacity
        }
      });
      
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

      mapInstance.addLayer({
        id: 'stone',
        type: 'circle',
        source: {
          type: 'vector',
          url: 'mapbox://limbo777.b7q7a9x1',
        },
        'source-layer': 'WebGis-16k5l9',
        paint: {
          'circle-radius': 4,  
          'circle-color': [
            'match',
            ['get', 'material'], 
            'Keramička i vatrostalna glina', '#D2691E', 
            'Tehničko-građevni kamen', '#808080',        
            'Građevni pijesak i šljunak', '#F4A300',   
            'Ciglarska glina', '#B74A2E',            
            'Karbonatne mineralne sirovine za industrijsku preradbu', '#4CAF50',
            '#0000FF',  
          ],
        },
        layout: {
          visibility: 'visible',
        },
      });

      let markers = [];  // Track markers globally

      mapInstance.on('click', 'stone', async (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ['stone'],
        });
      
        if (features.length > 0) {
          const feature = features[0];
          const destination = feature.geometry.coordinates; // [lng, lat]
      
          // Remove any existing markers before adding new ones
          markers.forEach(marker => marker.remove());
          markers = [];  // Clear the markers array
      
          try {
            // Fetch the optimized route from Mapbox API
            console.log(origin)
            const response = await fetch(
              `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
      
            if (data.trips && data.trips.length > 0) {
              const route = data.trips[0].geometry;  // Route geometry (GeoJSON)
              const distanceKm = (data.trips[0].distance / 1000).toFixed(2); // Distance in kilometers
      
              // Add the route to the map
              if (mapInstance.getSource('route')) {
                mapInstance.getSource('route').setData(route); // Update existing route
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
      
              // Create red pin markers for both the origin and destination
              const originMarker = new mapboxgl.Marker({ color: 'red' })
                .setLngLat(origin)
                .addTo(mapInstance);
              markers.push(originMarker);  // Add the origin marker to the array
      
              const destinationMarker = new mapboxgl.Marker({ color: 'red' })
                .setLngLat(destination)
                .addTo(mapInstance);
              markers.push(destinationMarker);
      
              const labelFeatures = [{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: origin,
                },
                properties: {
                  title: `Udaljenost do lokacije: ${distanceKm} km`,
                },
              }];
              
              const labelGeoJSON = {
                type: 'FeatureCollection',
                features: labelFeatures,
              };
              
              // Update or add the label layer
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
                    'text-offset': [6, -2.75],  // Adjust the 'y' value here to offset the label above
                    'text-anchor': 'top',
                  },
                  paint: {
                    'text-color': '#044786',
                  },
                });
              }
      
              console.log(`Udaljenost do lokacije: ${distanceKm} km`);
            } else {
              console.error('No routes found');
            }
          } catch (error) {
            console.error('Error fetching route:', error);
          }
      
          // Handle the popup with the feature information
          const {
            name = "nema podataka",
            status = "nema podataka",
            material = "nema podataka",
            manager = "nema podataka",
            exploatation_fee,
            general_data,
            all_spaces_exploatation_fields = "nema podataka",
          } = feature.properties;

          console.log(feature.properties)
      
          // Parsing exploatation_fee and general_data as they are provided in JSON string format
          const parsedExploatationFee = exploatation_fee ? JSON.parse(exploatation_fee) : {};
          const parsedGeneralData = general_data ? JSON.parse(general_data) : {};
      
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="max-height: 300px; overflow-y: scroll;">
                <h6 class="text-lg font-semibold">${name}</h6>
                <p class="text-left mb-0"><strong>Status:</strong> ${status}</p>
                <p class="text-left mb-0"><strong>Materijal:</strong> ${material}</p>
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
                <h6 class="text-lg font-semibold">Naknade za eksploataciju mineralnih sirovina</h6>
                ${parsedExploatationFee && Object.entries(parsedExploatationFee).length > 0
                  ? Object.entries(parsedExploatationFee).map(([year, fees]) => `
                      <p class="text-left mb-0"><strong>${year}:</strong></p>
                      <ul>
                        <li><strong>Fiksni iznos:</strong> ${fees?.fixed_fee || "nema podataka"}</li>
                        <li><strong>Varijabilni iznos:</strong> ${fees?.variable_fee || "nema podataka"}</li>
                        <li><strong>Namjenski iznos:</strong> ${fees?.dedicated_amount || "nema podataka"}</li>
                      </ul>
                    `).join('')
                  : "<p class='text-left mb-0'>Nema podataka.</p>"
                }                         
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
  }, [pollutionData, t, origin]);

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

  return (
    <div className="relative">
      <section id="filter-data">
      <div className="row">
        <div className="col-md-12">
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
                className="list-group position-absolute w-full"
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
    </div>
  );
}

export default Map;
