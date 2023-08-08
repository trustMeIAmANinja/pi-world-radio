// Initialize Mapbox
mapboxgl.accessToken =
  "....REPLACE WITH ACCESS TOKEN ....";
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

getChannelsAtCenter = function () {
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
    getChannels(features[0].properties.location_id,
                features[0].properties.title + ", " + features[0].properties.country,
	        features[0].properties.lat, features[0].properties.lng);
  } else {
    // titleDisplay.textContent = '';
    channels.textContent = "";
    channelsTitle.innerHTML = "";
    channelsWrapper.style.display = "none";
    channelListElems = [];
    currentChannelElem = null;
  }
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
    // console.log(e);
    getChannels(e.features[0].properties.location_id, e.features[0].properties.title + ", " + e.features[0].properties.country,
                e.features[0].properties.lat, e.features[0].properties.lng);
    selectTopChannel();
  });

  map.on("moveend", () => {
    if (ignoreMapMoveOnce) {
      ignoreMapMoveOnce = false;
      return;
    }
    clearTimeout(getChannelsDelayTimer);
    currentZoom = map.getZoom()
    if (currentZoom < 5.0) return;
    getChannelsDelayTimer = setTimeout(getChannelsAtCenter, 500);
  });    
});
