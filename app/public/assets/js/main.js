var player = null;
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
const zoomIconWrapper = document.getElementById("zoom_wrapper");

const favWrapper = document.getElementById("fav_wrapper");
const favListWrapper = document.getElementById("fav_list_wrapper");
const favIcon = document.getElementById("fav_icon");
const favIconFilled = document.getElementById("fav_icon_filled");

const iconList = new Array(zoomIconWrapper, volumeIconWrapper);

var iconSelected = 0;
var rapidClickCount = 0;

channelsWrapper.style.display = "none";
playingAnimation.style.display = "none";
loadingAnimation.style.display = "none";

// global mutable Vars
var channelListElems = [];
var currentChannelElem = null;
var currentChannelIndex;
var playerActive = false;
var volume = 50;

// Mode toggle for Nav/Map
var mapMode = true;
var ignoreMapMoveOnce = false;

// Mode toggle for zoom/volume
var zoomMode = true;

var isFav = false;

// Elements to circle through for key 'q'
const navElements = new Array(
  channelsWrapper, favWrapper, favListWrapper
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

// Get JSON data via XMLHttpRequest
//
// @param {string}   url      - the url to read JSON data from
// @param {function} function - callback to execute with received data
var getJSON = function (url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "json";
  xhr.onload = function () {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
}

var doXhrRequest = function(requestType, url, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open(requestType, url, true);
  if (data) {
    xhr.responseType = "json";
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

var postEmpty = function(url, callback) {
  doXhrRequest('POST', url, undefined, callback);
}

// Post JSON data via XMLHttpRequest
//
// @param {string}   url      - the url to post JSON data to
// @param {object}   data     - the object to send as JSON
// @param {function} function - callback to execute with received response
var postJSON = function(url, data, callback) {
  doXhrRequest("POST", url, data, callback);
}

var deleteJSON = function (url, callback) {
  doXhrRequest("DELETE", url, {}, callback);
}

// https://stackoverflow.com/a/34064434
function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

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
      channels.textContent = "";
      channelsTitle.innerHTML = "";
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
};

var toggleFavIcon = function(isFavorite) {
  if (isFavorite) {
    favIcon.style.display = 'None';
    favIconFilled.style.display = '';
  } else {
    favIcon.style.display = ''
    favIconFilled.style.display = 'None'
  }

}

// addToFavorites - Add the currently playing channel to favorites
var addToFavorites = function () {
  if (player != null) {
    var obj = new Object();
    obj.channelId = player.channelId;
    obj.title = player.title;
    obj.location = player.location;
    obj.lng = player.lng;
    obj.lat = player.lat;

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

var handleFavoriteClick = function () {
  if (player != null) {
    if (player.isFav > 0)
      removeFromFavorites();
    else
      addToFavorites();
  }
}

var showFavorites = function () {
  getJSON("/favorites", function (status, response) {
    if (status != null) {
      console.log("/favorites: Received HTTP Status: " + status);
    } else {
      // console.log(response);
      channelsTitle.innerHTML = "";
      channels.textContent = "";
      channelsWrapper.style.display = "";
      channelsTitle.textContent = "Favorites";

      response.forEach(function (item) {
        item.is_favorite = 1;
        addChannelElement(item, item.channelId, item.location, item.lng, item.lat, true, true);
      });
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

// selectIcon - simple helper to highlight the icons in the top right and notify its selected
var selectIcon = function (element) {
  element.classList.add("icon_focus");
  element.dispatchEvent(new Event("selected"));
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

// handleUpdown - handle the event from the up/down rotary
//                   if left is true, rotary was turned right/up, else was turned to left/down
//
// @param {event} event - the DOM event object that was triggered
// @param {bool}  up  - true to indicate up, false for down.
var handleUpDown = function(event, up) {
  if (mapMode) {
    if (up) {
      map.panBy([0, -15], {animate: true, duration: 100});
    } else {
      map.panBy([0, 15], {animate: true, duration: 100});
    }
  } else {
    if (document.activeElement == channelsWrapper) {
      event.stopPropagation();
      event.preventDefault();
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
    if (right) {
      map.panBy([15, 0], {animate: true, duration: 100});
    } else {
      map.panBy([-15, 0], {animate: true, duration: 100});
    }
  } else {
    /*if (document.activeElement == channelsWrapper) {
      event.stopPropagation();
      event.preventDefault();
    }*/
    navSwitchElement(right);
  }
}

// handleHighLow - handle the event from the high/low rotary
//                 if high is true, either volume is raised or map is zoomed it.
//                 if high is false, volume is lowered or map is zoomed out.
//
// @param {event} event - the DOM event object that was triggered
// @param {bool}  high  - true if the event was go higher, otherwise go lower 
var handleHighLow = function (event, high) {
  if (!mapMode || !zoomMode) {
    // Volume control
    setVolume(high);
  } else {
    zoomInOut(high);
  }
}

// handleClick - handle the click event and dispatch it to the appropriate element
//
// @param {event} event - the click event
var handleClick = function (event) {
  // if fav-icon or fav-list-icon is highlighted, send click to them
  f = document.activeElement;
  if (f == favWrapper || f == favListWrapper) {
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
  if (mapMode && zoomMode) {
    currentZoom = map.getZoom();
    if (zoomIn) 
      map.easeTo({zoom: currentZoom + 0.75, speed: 0.5, duration: 1000})
    else
      map.easeTo({zoom: currentZoom - 0.75, speed: 0.5, duration: 1000})
  }
}

let rapidClickTimeout;
var incrementClickCount = function () {
  clearTimeout(rapidClickTimeout);
  rapidClickCount++;
  rapidClickTimeout = setTimeout(() => {
    rapidClickCount = 0;
  }, "500");
}


// Keyboard events triggered by the rotary encoders
window.addEventListener("keydown", function (event) {
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
      handleHighLow(event, true);
      break;
    case "l":
      handleHighLow(event, false);
      break;
    case "t":
      // Testing only event.
      showFavorites();
      break;
  }
});

// Keyboard events triggered by the push button on the rotary encoder
window.addEventListener("keypress", function (event) {
  currentZoom = map.getZoom();
  switch (event.key) {
    case "q":
      mapMode = !mapMode;
      if (mapMode) {
        navDropFocus();
        crosshair.style.display = 'block';
      } else {
        navTakeFocus();
        crosshair.style.display = 'none';
      }
      break;
    case "p":
      handleClick(event);
      break;
    case "n":
      if (rapidClickCount >= 2) {
        console.log("RapidClick event triggered")
        doXhrRequest("POST", '/displayToggle', null, function (status, response) {
          console.log(`toggleDisplay: response status - ${status}`)
        }); 
        rapidClickCount = 0;
      } else {
        // increment to track Rapid click              
        incrementClickCount();

        iconList.forEach(function (icon) {
          icon.classList.remove("icon_focus")
        });

        if (iconSelected < iconList.length - 1) {
          iconSelected += 1;
        } else {
          iconSelected = 0;
        }
        selectIcon(iconList[iconSelected]);
      }
      break;
  }
});

/******************************************************************************
 * Set Initial State
 ******************************************************************************/
favIconFilled.style.display = 'None';
// At the start we will be in mapMode
selectIcon(zoomIconWrapper);
// Initialize
setVolume(volume);
// Attach event handler for the top right icons when selected.
iconList.forEach(function (element) {
  element.addEventListener("selected", function (event) {
    if (event.target == zoomIconWrapper)
      zoomMode = true;
    if (event.target == volumeIconWrapper)
      zoomMode = false;
  });
});

favWrapper.addEventListener("click", handleFavoriteClick);
favListWrapper.addEventListener("click", showFavorites);

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
