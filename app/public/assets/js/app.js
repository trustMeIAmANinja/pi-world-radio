///////////////////////////////////////////////////////////////////////////
// CircularBuffer - https://stackoverflow.com/a/1583281

function CircularBuffer(n) {
  this._array = new Array();
  this._size = n;
}
CircularBuffer.prototype.push = function(v) {
  this._array.unshift(v);
  if (this._array.length > this._size) {
    this._array.pop()
  }
}
CircularBuffer.prototype.get = function(i) {
  if (i < 0 || i >= this._array.length) return undefined;
  return this._array[i];
}
CircularBuffer.prototype.find = function(f) {
  return this._array.find(f);
}
CircularBuffer.prototype.findIndex = function(f) {
  return this._array.findIndex(f);
}
CircularBuffer.prototype.forEach = function(f) {
  this._array.forEach(f);
}
CircularBuffer.prototype.toString = function() {
  return this._array.toString();
}
CircularBuffer.prototype.splice = function(start, deleteCount) {
  return this._array.splice(start, deleteCount);
}
CircularBuffer.prototype.load = function(stringData) {
  this._array = JSON.parse(stringData)._array;
}

///////////////////////////////////////////////////////////////////////////
// main.js

var player = null;
var staticPlayer = null;
var staticPlayerTimeout = null;
// const titleDisplay = document.getElementById('title');
const channelsWrapper = document.getElementById("channels_wrapper");
const channelsTitle = document.getElementById("channels_title");
const channels = document.getElementById("channels");
const crosshair = document.getElementById("crosshair");
const mapContainer = document.getElementById("map");
const nowPlaying = document.getElementById("now-playing")
const locationDisplay = document.getElementById("location-info");
const playingAnimation = document.getElementById("playing-animation");
const loadingAnimation = document.getElementById("loading-animation");
const volumeIconWrapper = document.getElementById("volume_wrapper");

const favWrapper = document.getElementById("fav_wrapper");
const favListWrapper = document.getElementById("fav_list_wrapper");
const favIcon = document.getElementById("fav_icon");
const favIconFilled = document.getElementById("fav_icon_filled");
const historyWrapper = document.getElementById("history_wrapper");

var rapidClickCount = 0;
var idleTime = 0;
// 1 => screen is on. 0 => screen is off.
var displayState = 0;

// Increment the idle time counter every minute.
var idleInterval = setInterval(function() { incrementIdleTime() }, 60 * 1000); // 1 minute

channelsWrapper.style.display = "none";
playingAnimation.style.display = "none";
loadingAnimation.style.display = "none";

// global mutable Vars
var channelListElems = [];
var currentChannelElem = null;
var currentChannelIndex;
var playerActive = false;
var volume = 50;

var historyList = new CircularBuffer(10);
const historySearch = what => historyList.findIndex(element => element.channelId === what);

// Mode toggle for Nav/Map
var mapMode = true;
var ignoreMapMoveOnce = false;

var isFav = false;
var favListMode = false;
var historyListMode = false;

var getChannelsDelayTimer;
// Current Center
var currentCenter = {lng: -53, lat: 35};
// Current LocationId
var currentLocationId = "";

// Elements to circle through for key 'q'
const navElements = new Array(
  channelsWrapper, favWrapper, favListWrapper, historyWrapper
);
var navElementFocusIndex = -1;

// volume icons
const volIcons = new Array(
  document.getElementById("volume_icon_0"),
  document.getElementById("volume_icon_10"),
  document.getElementById("volume_icon_30"),
  document.getElementById("volume_icon_50"),
  document.getElementById("volume_icon_70"),
  document.getElementById("volume_icon_90"),
  document.getElementById("volume_icon_100")
);

// volIconIndex - Helper to get the volume icon for a volume level
var volIconIndex = function(volume) {
  index = 0
  volume = volume;
  if (volume > 0 && volume < 10) {
    index = 1;
  } else if (volume >= 10 && volume < 30) {
    index = 2;
  } else if (volume >= 30 && volume < 50) {
    index = 3;
  } else if (volume >= 50 && volume < 70) {
    index = 4;
  } else if (volume >= 70 && volume < 90) {
    index = 5;
  } else if (volume >= 90) {
    index = 6
  }
  return index
}

var roundTo4Decimals = function (decimal) {
  return Math.round(decimal * 10000) / 10000;
}

// setVolumeIcon - Set the correct icon for the given volume
//
// @param {int} volume - the current volume between 1-100.
var setVolumeIcon = function(volume) {
  index = volIconIndex(volume);
  volIcons.forEach(function (icon, i) {
    if (i == index)  icon.style.display = ''; 
    else if (isVisible(icon)) icon.style.display = 'None';
  });
};

// setVolume - Change the current volume up or down
//
// @param {bool} up - if true raise volume, else lower.
var setVolume = function(up) {
  if (up) {
    if (volume <= 95) {
      volume += 5;
    }
  } else if (volume >= 5) {
      volume -= 5;
  }
  Howler.volume(volume/100);
  setVolumeIcon(volume);
}

// from jquery source (via https://stackoverflow.com/a/33456469)
var isVisible = function (e) {
  return !!( e.offsetWidth || e.offsetHeight || e.getClientRects().length );
}

// doXhrRequest - 
var doXhrRequest = function(requestType, url, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open(requestType, url, true);
  if (requestType == "GET") xhr.responseType = "json";
  if (data) {
    xhr.setRequestHeader('Content-Type', 'application/json');
  }
  xhr.onload = function () {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  if (data) {
    xhr.send(JSON.stringify(data));
  } else {
    xhr.send();
  }
}

// getJSON - Get JSON data via XMLHttpRequest
//
// @param {string}   url      - the url to read JSON data from
// @param {function} function - callback to execute with received data
var getJSON = function (url, callback) {
  doXhrRequest('GET', url, undefined, callback);
}

// postEmpty - POST Request without sending any data
//
// @param {string}   url      - the url to read JSON data from
// @param {function} function - callback to execute with received data
var postEmpty = function(url, callback) {
  doXhrRequest('POST', url, undefined, callback);
}

// postJSON - Post reqeust with JSON data 
//
// @param {string}   url      - the url to post JSON data to
// @param {object}   data     - the object to send as JSON
// @param {function} function - callback to execute with received response
var postJSON = function(url, data, callback) {
  doXhrRequest("POST", url, data, callback);
}

// deleteJSON - HTTP Delete with empty data
//
// @param {string}   url      - the url to read JSON data from
// @param {function} function - callback to execute with received data
var deleteJSON = function (url, callback) {
  doXhrRequest("DELETE", url, {}, callback);
}

// displayOff - send POST to /displayOff
var displayOff = function() {
  doXhrRequest("POST", '/displayOff', null, function (status, response) {
    // console.log(`displayOff: response status - ${status}`)
    data = JSON.parse(response);
    displayState = data.displayState;
  });
}

// displayOn - send POST to /displayOn
var displayOn = function() {
  doXhrRequest("POST", '/displayOn', null, function (status, response) {
    // console.log(`displayOn: response status - ${status}`)
    data = JSON.parse(response);
    displayState = data.displayState;
  });
}

// incrementIdleTime - tick up the idle counter by 1
var incrementIdleTime = function () {
  idleTime++;
  console.log(`Idle for ${idleTime} minutes`);
  if (idleTime >= 5 && displayState == 1) displayOff();
}

// https://stackoverflow.com/a/34064434
function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

// addChannelElement - Add a channel to channels list.
//                     The geo co-ordinates are only needed to attach the properties to the
//                     DOM element for other actions
//
// @param {object}  item          - oject with channel details
// @param {object}  channelId     - the id for the channel   
// @param {string}  locationName  - location name
// @param {decimal} lng           - lattitude geo coordinate for the location
// @param {decimal} lat           - longitude geo coordinate for the locationo
// @param {boolean} showLocation  - if true, show the location name under the channel name
// @param {boolean} flyToOnSelect - set the attribute. actually used by other feature 
var addChannelElement = function (item, channelId, locationName, lng, lat, showLocation=false, flyToOnSelect=false) {
  // Channel Name <div>
  channel = document.createElement("div");
  channel.classList.add("channel");

  // Channel title <p>
  channel_title = document.createElement("p");
  channel_title.classList.add("channel_title");
  channel_title.textContent = item.title;
  if (item.is_favorite) {
    flare = document.createElement("span");
    flare.classList.add("fav_flare");
    flare.textContent = htmlDecode("&hearts;");
    channel_title.append(flare);
  } 
  channel.appendChild(channel_title);

  if (showLocation) {
    channel_location = document.createElement("p");
    channel_location.classList.add("channel_location");
    channel_location.textContent = locationName;
    channel.appendChild(channel_location);
  }

  channel.channelId = channelId;
  channel.location = locationName;
  channel.lng = lng;
  channel.lat = lat;
  channel.title = item.title;
  channel.isFav = item.is_favorite;
  channel.flyToOnSelect = flyToOnSelect;
  channel.addEventListener('click', playStream, false);              
  channel.tabIndex = 0;
  channels.appendChild(channel);        
}

// clearChannelsList - clear and hide the channels list
var clearChannelsList = function () {
  channels.textContent = "";
  channelsTitle.innerHTML = "";
  channelsWrapper.style.display = "none";
  channelListElems = [];
  currentChannelElem = null;
  favListMode = false;
  historyListMode = false;
}

// getChannels Get the list of radio streams for the location.
//             the geo co-ordinates are only needed to attach the properties to the
//             DOM element for other actions
//
// @param {string}  locationId   - the radio garden location id
// @param {string}  locationName - location na
// @param {decimal} lng          - lattitude geo coordinate for the location 
// @param {decimal} lat          - longitude geo coordinate for the location
var getChannels = function (locationId, locationName, lng, lat) {
  // channel_url = `https://radio.garden/api/ara/content/page/${locationId}/channels`
  let channel_url = `/channels/${locationId}`;
  getJSON(channel_url, function (status, response) {
    if (status != null) {
      console.log("getChannels: Received HTTP Status: " + status);
    } else {
      //console.log(response.data.content[0].items[0]);
      clearChannelsList();
      channelsWrapper.style.display = "";
      var img = document.createElement("img");
      img.src = "/assets/img/signal-tower.png";
      img.classList.add('tower-icon');
      var span = document.createElement("span");
      span.textContent = locationName;
      channelsTitle.append(img);
      channelsTitle.append(span);

      response.data.content[0].items.forEach(function (item) {
        channelId = item.href.split("/").splice(-1)[0];
        addChannelElement(item, channelId, locationName, lng, lat);
      });
    }
  });
}

// selectIcon - simple helper to highlight an icon and notify its selected
//
// @param {DOMElement} element - the element to highlight
var selectIcon = function (element) {
  element.classList.add("icon_focus");
  element.dispatchEvent(new Event("selected"));
};

// toggleFavIcon - toggle the state of the Fav icon
//
// @param {bool} isFavorite - the expected state of the fav icon
var toggleFavIcon = function(isFavorite) {
  if (isFavorite) {
    favIcon.style.display = 'None';
    favIconFilled.style.display = '';
  } else {
    favIcon.style.display = ''
    favIconFilled.style.display = 'None'
  }
}

// getChannelObject - helper to wrap the current playing channel attributes in
//                    a simple object
var getChannelObject = function() {
  var obj = new Object();
  obj.channelId = player.channelId;
  obj.title = player.title;
  obj.location = player.location;
  obj.lng = player.lng;
  obj.lat = player.lat;
  return obj;
}


// addToHistory - add the currently playing channel to history list
var addToHistory = function () {
  if (player != null) {
    obj = getChannelObject();
    idx = historySearch(obj.channelId);
    if (idx >= 0) {
      historyList.splice(idx, 1);
    }
    historyList.push(obj);
  }
}

// showHistory - show the history of channels in the channels list box
var showHistory = function () {
  clearChannelsList();
  channelsWrapper.style.display = "";
  channelsTitle.textContent = "History";
  historyList.forEach(function (item) {
    addChannelElement(item, item.channelId, item.location, item.lng, item.lat, true, true);
  });
  historyListMode = true;
  navDropFocus();
  navTakeFocus();
}

// addToFavorites - Add the currently playing channel to favorites
var addToFavorites = function () {
  if (player != null) {
    obj = getChannelObject();

    postJSON("/addfavorite", obj, function (status, response) {
      if (status != null) {
        console.log("addfavorite: Received HTTP Status: " + status);
      } else {
        player.isFav = 1;
        toggleFavIcon(true);        
      }
    });
  }
}

// removeFromFavorites - Remove the currentl playing channel from favorites.
var removeFromFavorites = function () {
  if (player != null) {
    deleteJSON(`/favorite/${player.channelId}`, function (status, response) {
      if (status != null) {
        console.log(`/favorite/${player.channelId}: Received HTTP Status: ${status}`);
      } else {
        player.isFav = 0;
        toggleFavIcon(false);
      }
    });
  }
}

// handleFavoriteClick - Handle click on the favorite icon.
var handleFavoriteClick = function () {
  if (player != null) {
    if (player.isFav > 0)
      removeFromFavorites();
    else
      addToFavorites();
  }
}

// showFavorites - Get the list of favorites and display them in the
//                 channel list sorted by distance
var showFavorites = function () {
  getJSON("/favorites", function (status, response) {
    if (status != null) {
      console.log("/favorites: Received HTTP Status: " + status);
    } else {
      // console.log(response);
      currentLocationId = "";
      clearChannelsList();
      channelsWrapper.style.display = "";
      channelsTitle.textContent = "Favorites";

      response.forEach(function (item) {
        item.is_favorite = 1;
        item.distanceFromCenter = distanceBetween(map.getCenter(), item)
      });
      response.sort((f1, f2) => { return f1.distanceFromCenter - f2.distanceFromCenter })
      response.forEach(function (item) {
        addChannelElement(item, item.channelId, item.location, item.lng, item.lat, true, true);
      });
      favListMode = true;
      navDropFocus();
      navTakeFocus();
    }
  });
}

// selectTopChannel - Select and highlight the top channel in the channel list
var selectTopChannel = function () {
  channelListElems = document.getElementsByClassName("channel");
  if (channelListElems.length > 0) {
    // Select and highlight the first channel in the list
    currentChannelElem = channelListElems[0];
    currentChannelIndex = 0;
    changeHighlightedChannel();
  } 
}


// navSwitchElement - switch focus to the next/previous element in the navList
//
// @param {bool} next - if true, switch to the next element in the list or previous if false.
navSwitchElement = function(next) {
  if (next) 
    navElementFocusIndex++;
  else
    navElementFocusIndex--;

  if (navElementFocusIndex >= navElements.length) {
    navElementFocusIndex = navElements.length - 1;
    return
  } else if (navElementFocusIndex < 0) {
    navElementFocusIndex = 0;
    return
  }
  // navElements[navElementFocusIndex].dispatchEvent(event);
  navElements[navElementFocusIndex].focus();
}

// navDropFocus - make any active element in the navlist drop its focus
navDropFocus = function() {
  navElements.forEach(function (element) {
    element.blur();
  });
}

// navTakeFocus - make one of the elements in the navList be the active element with focus
navTakeFocus = function() {
  navElementFocusIndex = -1;
  navSwitchElement(true);
}

// changeHighlightedChannel - change the currently highlighted channel in the list view
//                            based on the global var currentChannelIndex.
var changeHighlightedChannel = function () {
  if (currentChannelElem != null) {
    currentChannelElem.classList.remove("channel_highlight");
  }
  currentChannelElem = channelListElems[currentChannelIndex];
  currentChannelElem.classList.add("channel_highlight");
  currentChannelElem.scrollIntoViewIfNeeded({ behavior: "smooth", block: "start", inline: "nearest" });        
}

// navigateChannelList - navigate the list of channels in the channels list view
//
// @param {bool}  up  - true to indicate up, false for down.
var navigateChannelList = function(up) {
  // Check if we have any channels to navigate 
  if (channelListElems.length <= 0) return;

  if (up) {
    if (currentChannelIndex > 0) {
      currentChannelIndex--;
      changeHighlightedChannel();
    }
  } else {
    if (currentChannelIndex < channelListElems.length - 1) {
      currentChannelIndex++;
      changeHighlightedChannel();
    }
  }
}

// playStaticNoise - play the static/tuning audio. 
//                   This will also reset the timeout to 5 seconds
var playStaticNoise = function () {
  clearTimeout(staticPlayerTimeout);
  staticPlayerTimeout = setTimeout(() => { staticPlayer.stop();}, 5 * 1000);
  if (player == null && !staticPlayer.playing()) staticPlayer.play();
}

// handleUpdown - handle the event from the up/down rotary
//                   if left is true, rotary was turned right/up, else was turned to left/down
//
// @param {event} event - the DOM event object that was triggered
// @param {bool}  up  - true to indicate up, false for down.
var handleUpDown = function(event, up) {
  if (mapMode) {
    playStaticNoise();
    if (up) {
      map.panBy([0, -20], {animate: true, duration: 100});
    } else {
      map.panBy([0, 20], {animate: true, duration: 100});
    }
  } else {
    if (document.activeElement == channelsWrapper) {
      event.stopPropagation();
      event.preventDefault();
      if (!favListMode && !historyListMode) playStaticNoise();
    }
    navigateChannelList(up);
  }
}

// handleLeftRight - handle the event from the left/right rotary
//                   if left is true, rotary was turned to left, else was turned to right
//
// @param {event} event - the DOM event object that was triggered
// @param {bool}  right  - true if turned to right, false if left.
var handleLeftRight = function(event, right) {
  if (mapMode) {
    playStaticNoise();
    if (right) {
      map.panBy([30, 0], {animate: true, duration: 100});
    } else {
      map.panBy([-30, 0], {animate: true, duration: 100});
    }
  } else {
    /*if (document.activeElement == channelsWrapper) {
      event.stopPropagation();
      event.preventDefault();
    }*/
    navSwitchElement(right);
  }
}


// handleClick - handle the click event and dispatch it to the appropriate element
//
// @param {event} event - the click event
var handleClick = function (event) {
  // if fav-icon or fav-list-icon is highlighted, send click to them
  f = document.activeElement;
  if (f == favWrapper || f == favListWrapper || f == historyWrapper) {
    f.click();
    return
  }

  // else if player is active, send click to player
  // and/or if currentChannelElem is not null, send click to it.
  if (playerActive) {
    playingAnimation.click();
  }
  if (currentChannelElem != null) {
    currentChannelElem.click();
  }        
} 

// zoomInOut - handles map zoom
//
// @param {bool} zoomIn true: zoom in. false: zoom out.
var zoomInOut = function (zoomIn) {
  if (mapMode) {
    playStaticNoise();
    currentZoom = map.getZoom();
    if (zoomIn) 
      map.easeTo({zoom: currentZoom + 1.0, speed: 0.5, duration: 1000})
    else
      map.easeTo({zoom: currentZoom - 1.0, speed: 0.5, duration: 1000})
  }
}

// switchMapMode - set the interface for the selected mode
var switchMapMode = function () {
  mapMode = !mapMode;
  if (mapMode) {
    navDropFocus();
    crosshair.style.display = 'block';
  } else {
    navTakeFocus();
    crosshair.style.display = 'none';
  }
}

let rapidClickTimeout;
var incrementClickCount = function () {
  clearTimeout(rapidClickTimeout);
  rapidClickCount++;
  rapidClickTimeout = setTimeout(() => {
    rapidClickCount = 0;
  }, 500);
}


// Keyboard events triggered by the rotary encoders
window.addEventListener("keydown", function (event) {
  // ignore key 'x' since its being emitted by xdotool
  if (event.key != "x") {
    idleTime = 0;
    if (displayState == 0) displayOn();
  }


  switch (event.key) {
    case "ArrowLeft":
      handleLeftRight(event, false);
      break;
    case "ArrowRight":
      handleLeftRight(event, true);
      break;
    case "ArrowUp":
      handleUpDown(event, true);
      break;
    case "ArrowDown":
      handleUpDown(event, false);
      break;
    case "h":
      setVolume(true);
      break;
    case "l":
      setVolume(false);
      break;
    case "i":
      zoomInOut(true);
      break
    case "o":
      zoomInOut(false);
      break;
    case "q":
      // switchMapMode();
      handleClick(event);
      break;
    case "p":
      handleClick(event);
      break;
    case "n":
      clearChannelsList();
      // Switch to map mode if not in map mode
      if (!mapMode) switchMapMode();
      // reset currentCenter
      currentCenter = {lng: -53, lat: 35};
      currentLocationId = "";
      break;
    case "m":
      if (rapidClickCount >= 2) {
        console.log("RapidClick event triggered")
        doXhrRequest("POST", '/displayToggle', null, function (status, response) {
          data = JSON.parse(response);
          displayState = data.displayState;
        });
        rapidClickCount = 0;
      } else {
        // increment to track Rapid click
        incrementClickCount();
        switchMapMode();
      }
      break;
    case "t":
      // Testing only event.
      showFavorites();
      break;
  }
});

///////////////////////////////////////////////////////////////////////////////////
//
// Initialize Mapbox

mapboxgl.accessToken = ".................................................................."
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/wrecker/clkz7vn0000n301pb1mtjho13",
  center: [-53, 35.2],
  zoom: 2.2,
  minZoom: 2.05,
  maxZoom: 12,
});
map.keyboard.disable();

// https://stackoverflow.com/a/18883819
// This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
distanceBetween = function (c1, c2) {
  var R = 6371; // km
  var dLat = toRad(c2.lat - c1.lat);
  var dLon = toRad(c2.lng - c1.lng);
  var lat1 = toRad(c1.lat);
  var lat2 = toRad(c2.lat);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
toRad = function (value) {
    return value * Math.PI / 180;
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
    layout: {
      // Make the layer visible by default.
      "visibility": "none"
    },
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
      // "circle-stroke-color": "#d32da0",
      "circle-stroke-color": "#b07126",
      "circle-stroke-width": 1,
      // The feature-state dependent circle-color expression will render
      // the color according to its magnitude when
      // a feature's hover state is set to true
      // "circle-color": "#d32da0",
      "circle-color": "#b08116",
      "circle-opacity": 0.5,
    },
  });

  map.on("click", "locations", (e) => {
    getChannels(e.features[0].properties.location_id, e.features[0].properties.title + ", " + e.features[0].properties.country,
                e.features[0].properties.lng, e.features[0].properties.lat);
    selectTopChannel();
  });

  map.on("zoomend", () => {
    zl = map.getZoom();
    if (zl >= 5.0) {
      map.setLayoutProperty("locations", "visibility", "visible");
    } else {
      map.setLayoutProperty("locations", "visibility", "none");
      clearChannelsList();
    }
  });


  map.on("moveend", () => {
    if (ignoreMapMoveOnce) {
      ignoreMapMoveOnce = false;
      return;
    }
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

//////////////////////////////////////////////////////////////////////
// player.js

staticPlayer = new Howl({
  src: ["/assets/audio/static.mp3"],
  html5: false,
  autoplay: false,
  loop: true,
  volume: volume / 100,
});


// playStream -  Create howler instance and play steam from channelId
// @param {event} event - the DOM event on the selected channel
var playStream = function (event) {
  // Unload any active player
  if (player != null) player.unload();

  playingAnimation.style.display = "none";
  loadingAnimation.style.display = "";
  nowPlaying.textContent = "Loading: " + event.target.title;
  locationDisplay.textContent = event.target.location;
  
  d = new Date();
  stream_url =
    "https://radio.garden/api/ara/content/listen/" +
    event.currentTarget.channelId +
    "/channel.mp3?" +
    new Date().valueOf();
  player = new Howl({
    src: [stream_url],
    html5: true,
    autoplay: false,
    volume: volume / 100,
  });
  // attach additional data to the player object      
  player.channelId = event.target.channelId;
  player.title = event.target.title;
  player.location = event.target.location;
  player.lng = event.target.lng;
  player.lat = event.target.lat;
  player.isFav = event.target.isFav;
  toggleFavIcon(event.target.isFav > 0);

  player.once(
    "load",
    function () {
      staticPlayer.stop();
      loadingAnimation.style.display = "none";
      playingAnimation.style.display = "";
      nowPlaying.textContent = this.target.title;
      locationDisplay.textContent = this.target.location;
      playingAnimation.addEventListener("click", stopStream, false);
      addToHistory();
      if (event.target.flyToOnSelect) {
        ignoreMapMoveOnce = true;
        map.flyTo({center: [player.lng, player.lat], curve: 1, zoom: 8, essential: true, speed: 0.7 })
      }
      player.play();
    }.bind(event)
  );

  player.once(
    "loaderror",
    function () {
      console.log("stream load error");
      loadingAnimation.style.display = "none";
      nowPlaying.textContent = "Offline: " + this.target.textContent;
      playerActive = false;
      player.unload();
      player = null;
    }.bind(event)
  );

  player.once(
    "play",
    function () {
      playerActive = true;
    }.bind(event)
  );

};

// stopStream - Stop streaming and set player to null
var stopStream = function (event) {
  if (player != null) {
    player.unload();
  }
  player = null;
  playingAnimation.style.display = "";
  nowPlaying.textContent = "Tuning...";
  locationDisplay.innerHTML = "&nbsp;";
  playingAnimation.style.display = "none";
  playerActive = false;
  toggleFavIcon(false);
};

///////////////////////////////////////////////////////////////////////////////
//  Set Initial State
displayOn();
favIconFilled.style.display = 'None';
// Initialize
setVolume(volume);
favWrapper.addEventListener("click", handleFavoriteClick);
favListWrapper.addEventListener("click", showFavorites);
historyWrapper.addEventListener("click", showHistory);

// Watch for mutations to channels list
const observer = new MutationObserver(function (mutationList, observer) {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      if (mutation.addedNodes.length) {
        selectTopChannel();
      }
    }
  }
});

observer.observe(channels, { attributes: false, childList: true, subtree: false });
