/**
 * Create howler instance and play steam from channelId
 */
var playStream = function (event) {
  // Unload any active player
  Howler.unload();

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
      loadingAnimation.style.display = "none";
      playingAnimation.style.display = "";
      nowPlaying.textContent = this.target.title;
      locationDisplay.textContent = this.target.location;
      playingAnimation.addEventListener("click", stopStream, false);
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
    }.bind(event)
  );

  player.once(
    "play",
    function () {
      playerActive = true;
    }.bind(event)
  );

};

/**
 * Stop streaming and set player to null
 */
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