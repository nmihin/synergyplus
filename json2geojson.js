#!/usr/bin/env node

const fs = require('fs');

// Get input and output file names
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node convert.js input.json output.geojson');
  process.exit(1);
}

// Read the input JSON file
const rawData = fs.readFileSync(inputFile, 'utf8');
const data = JSON.parse(rawData);

// Transform JSON to GeoJSON
const features = data.map((item) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [item.longitude, item.latitude],
  },
  properties: {
    ...item, // Include all other properties from the original object
    longitude: undefined, // Remove longitude from properties
    latitude: undefined,  // Remove latitude from properties
  },
}));

const geojson = {
  type: 'FeatureCollection',
  features,
};

// Write the GeoJSON to the output file
fs.writeFileSync(outputFile, JSON.stringify(geojson, null, 2));
console.log(`GeoJSON has been saved to ${outputFile}`);
