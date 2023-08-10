// Initialize Mapbox
mapboxgl.accessToken =
  "..................mEiOiJjbGs2Z21lcmExMnU2M3Ntcmp2OHRjeW5lIn0.fNANgrI1muCpqjAiIN40hA";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/wrecker/clkz7vn0000n301pb1mtjho13",
  center: [-53, 35.2],
  zoom: 2.2,
  minZoom: 2.05,
  maxZoom: 12,
});
map.keyboard.disable();

// Global to hold timer var
var getChannelsDelayTimer;
// Current Center
var currentCenter = map.getCenter();
// Current LocationId
var currentLocationId = "";

var roundTo4Decimals = function (decimal) {
  return Math.round(decimal * 10000) / 10000;
}

// Returns true if c1 and c2 are significantly different
var compareCoordinates = function (c1, c2) {
  return roundTo4Decimals(c1.lng) != roundTo4Decimals(c2.lng) || roundTo4Decimals(c1.lat) != roundTo4Decimals(c2.lat)
}

var getChannelsAtCenter = function () {
  width = 20;
  height = 20;
  const point = map.project(map.getCenter());
  const features = map.queryRenderedFeatures(
    [
      [point.x - width / 2, point.y - height / 2],
      [point.x + width / 2, point.y + height / 2],
    ],
    { layers: ["locations"] }
  );
  if (features.length > 0) {
    if (currentLocationId != features[0].properties.location_id) {
      getChannels(features[0].properties.location_id,
                  features[0].properties.title + ", " + features[0].properties.country,
	                features[0].properties.lng, features[0].properties.lat);
      currentLocationId = features[0].properties.location_id;
    }
  } else {
    clearChannelsList();
    currentLocationId = "";
  }
  currentCenter = map.getCenter();
}

// When the map loads, add the radio.garden data
map.on("load", () => {
  map.addSource("locations", {
    type: "geojson",
    data: "/assets/js/geo_json.min.json",
    generateId: true, // This ensures that all features have unique IDs
  });

  // Add locations as a layer and style it
  map.addLayer({
    id: "locations",
    type: "circle",
    source: "locations",
    paint: {
      // The feature-state dependent circle-radius expression will render
      // the radius size according to its magnitude when
      // a feature's hover state is set to true
      //'circle-radius': 5,
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        // zoom is 5 (or less) -> circle radius will be 1px
        5,
        1,
        // zoom is 20 (or greater) -> circle radius will be 10px
        20,
        40,
      ],
      "circle-stroke-color": "#d32da0",
      "circle-stroke-width": 1,
      // The feature-state dependent circle-color expression will render
      // the color according to its magnitude when
      // a feature's hover state is set to true
      "circle-color": "#d32da0",
      "circle-opacity": 0.5,
    },
  });

  map.on("click", "locations", (e) => {
    getChannels(e.features[0].properties.location_id, e.features[0].properties.title + ", " + e.features[0].properties.country,
                e.features[0].properties.lng, e.features[0].properties.lat);
    selectTopChannel();
  });

  map.on("moveend", () => {
    if (ignoreMapMoveOnce) {
      ignoreMapMoveOnce = false;
      return;
    }
    console.log(map.getCenter());
    // check if map center has moved significantly
    // typically zoom-in/out will not change center
    if (compareCoordinates(currentCenter, map.getCenter())) {    
      clearTimeout(getChannelsDelayTimer);
      currentZoom = map.getZoom()
      if (currentZoom >= 5.0) { 
        getChannelsDelayTimer = setTimeout(getChannelsAtCenter, 500);
      }
    }
  });    
});
