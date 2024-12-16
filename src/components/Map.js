import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl'; // Import Mapbox GL JS
import '../assets/styles.css'; // Assuming you're using the same CSS file for styling

// Set the Mapbox access token (you can also place this in an environment variable for security)
mapboxgl.accessToken = 'pk.eyJ1IjoibGltYm83NzciLCJhIjoiY2pqZ3Q4b2I0MG1keDN2bGcxMnZkeHpwYyJ9.xzM2vWikDaCZyqP_yt7VVg';

function Map() {
  useEffect(() => {
    // Initialize the map when the component is mounted
    const map = new mapboxgl.Map({
      container: 'map', // The id of the HTML element to render the map
      style: 'mapbox://styles/mapbox/light-v10', // Set gray/white style
      center: [15.2, 45.1], // Center the map on Croatia (Longitude, Latitude)
      zoom: 7, // Set zoom level
    });

    // Add custom layers using the tilesets provided
    map.on('load', () => {
      // Add first tileset
      map.addSource('tileset-1', {
        type: 'raster',
        tiles: [
          'https://api.mapbox.com/styles/v1/limbo777/4s9h2zhx/tiles/{z}/{x}/{y}?access_token=' + mapboxgl.accessToken,
        ],
        tileSize: 256,
      });
      map.addLayer({
        id: 'tileset-1',
        type: 'raster',
        source: 'tileset-1',
        paint: {
          'raster-opacity': 0.8, // Adjust the opacity of the tileset if needed
        },
      });

      // Add second tileset
      map.addSource('tileset-2', {
        type: 'raster',
        tiles: [
          'https://api.mapbox.com/styles/v1/limbo777/aqisum0b/tiles/{z}/{x}/{y}?access_token=' + mapboxgl.accessToken,
        ],
        tileSize: 256,
      });
      map.addLayer({
        id: 'tileset-2',
        type: 'raster',
        source: 'tileset-2',
        paint: {
          'raster-opacity': 0.8, // Adjust opacity as needed
        },
      });

      // Add third tileset
      map.addSource('tileset-3', {
        type: 'raster',
        tiles: [
          'https://api.mapbox.com/styles/v1/limbo777/2ydd5w3k/tiles/{z}/{x}/{y}?access_token=' + mapboxgl.accessToken,
        ],
        tileSize: 256,
      });
      map.addLayer({
        id: 'tileset-3',
        type: 'raster',
        source: 'tileset-3',
        paint: {
          'raster-opacity': 0.8, // Adjust opacity as needed
        },
      });
    });

    // Cleanup the map instance on component unmount
    return () => map.remove();
  }, []);

  return (
    <div id="map" style={{ width: '100%', height: '800px' }}></div> // Map container
  );
}

export default Map;
