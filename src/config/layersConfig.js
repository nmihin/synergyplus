const layersConfig = [
  {
    id: 'croatia',
    type: 'fill',
    source: {
      type: 'vector',
      url: 'mapbox://limbo777.3uijvh4v',
    },
    sourceLayer: 'croatia_Croatia_Country_Bound-c7ga88',
    paint: {
      'fill-color': 'rgba(4, 71, 134, 0.3)',
      'fill-opacity': 0.3
    },
    layout: {
      visibility: 'visible',
    },
  },
  {
    id: 'counties',
    type: 'line',
    source: {
      type: 'vector',
      url: 'mapbox://limbo777.dqg000hv',
    },
    sourceLayer: 'zup-9cdau9',
    paint: {
      'line-color': '#044786',
      'line-width': 2,
    },
    layout: {
      visibility: 'none',
    },
  },
  {
    id: 'roads',
    type: 'line',
    source: {
      type: 'vector',
      url: 'mapbox://limbo777.4s9h2zhx',
    },
    sourceLayer: 'europe-road-2vsqhc',
    paint: {
      'line-color': '#111',
      'line-width': 1,
    },
    layout: {
      visibility: 'none',
    },
  },
  {
    id: 'railways',
    type: 'line',
    source: {
      type: 'vector',
      url: 'mapbox://limbo777.aqisum0b',
    },
    sourceLayer: 'europe-rail-road-044x6d',
    paint: {
      'line-color': '#1E66A8',
      'line-width': 1,
    },
    layout: {
      visibility: 'none',
    },
  },
  {
    id: 'industry',
    type: 'circle',
    source: {
      type: 'vector',
      url: 'mapbox://limbo777.cg3arnwd',
    },
    sourceLayer: 'cementare-3vo6f9',
    paint: {
      'circle-color': '#00C0FD',
      'circle-radius': 4,
    },
    layout: {
      visibility: 'none',
    },
  },
  {
    id: 'stone',
    type: 'circle',
    source: {
      type: 'vector',
      url: 'mapbox://limbo777.9qd311cw',
    },
    sourceLayer: 'JISMS_WebGis_podaci_updated-96gt90',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'], // Use linear interpolation
        ['get', 'capacity'], // Property to use for dynamic sizing
        20, 4, // When capacity is 20, radius is 4
        80, 10 // When capacity is 80, radius is 10
      ],
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
      'circle-opacity': 0.5,
    },
    layout: {
      visibility: 'visible',
    },
  }
];

export default layersConfig;
