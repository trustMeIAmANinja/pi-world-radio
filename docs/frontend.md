# Frontend Setup

This page describe setting up the frontend app that displays on the screen of the radio.

## Features

![](assets/img/retro-pi-frontend-snapshot.jpg 'Frontend app running in a regular browser')

The app that runs in the display is a web-app and is loaded into a Chromium browser instance running fullscreen
in Kiosk Mode. There is also a backend component built in NodeJS that serves both the static content for the web
app and has some core functionality needed for the app.

The frontend has a bunch of features beyond the core ability to browse the map and play radio streams
 * Manage your favorite stations
 * Show list of favorite stations (sorted by distance from current center)
 * "Fly" to the location of a station when selected from favorites
 * View history of the last 10 stations played (does not persist on restarts)
 * Turn off the display when idle or with an input combo and turn it back on any input.
 * Plays "tuning" sounds when browsing and nothing is playing
 * All input is via the rotary knobs and the click of the knobs.

The backend
 * is a proxy for the making the calls to radio.garden to get data about channels and streams
 * provides a simple API for the favorites feature
 * provides a simple API to handle the GPIO interaction for turning the display on/off via the relay.
 * (coming soon) will provide API to reboot/power-off the RPi.

## Data Sources

### Location and Stations Data

All the data about locations with radio stations and stations at a given location come from
[Radio Garden](https://radio.garden ':target=_blank'). I download and keep a local copy of the list of locations
from Radio Garden. This is a large dataset and doesn't make sense to query every time. When you browse to a
location that has stations, the frontend queries Radio Garden for a list of stations for that location. The
frontend cannot make this query directly because of CORS restrictions and uses the backed as a proxy to get the
data. Finally when you choose a station to play, it again makes a direct request to Radio Garden which redirects
to the streaming url for that station and thats loaded into the audio player in the browser.

?> I am aware that using Radio Garden this way is very likely violating their TOS. If you are not comfortable with
   this, I would recommend you find a different way of obtaining the data.

### Maps

I use [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/guides/ ':target=_blank') and the vintage style theme from
[mapbox-gl-vintage-style](https://github.com/mapbox/mapbox-gl-vintage-style ':target=_blank') to create the map
interface. The offline Radio Garden data is loaded as a map "layer". Mapbox has a generous free tier and this app
barely causes a scratch in the free tier quota.

## Mapbox Setup

Create an account with [Mapbox](https://mapbox.com ':target=_blank'). Next get your access token for using the
API from your account [dashboard](https://account.mapbox.com/ ':target=_blank'). You will use this token later
in the app code.

To create the vintage map style, clone this github repo - [mapbox-gl-vintage-style](https://github.com/guillermodlpa/mapbox-gl-vintage-style ':target=_blank')
and follow the instructions in the repo to create your vintage style.

## Update The App Source Code

If you haven't cloned the [pi-world-radio](https://github.com/trustMeIAmANinja/pi-world-radio ':target=_blank')
repo to your home directory on the Raspberry Pi, do it now.

```bash
git clone https://github.com/trustMeIAmANinja/pi-world-radio ~/pi-world-radio
```

Edit the file `app/public/assets/js/app.js` in the cloned repo and update a couple of lines. Look for this section
in the file

```javascript
mapboxgl.accessToken = ".................................................................."
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/wrecker/clkz7vn0000n301pb1mtjho13",
  center: [-53, 35.2],
  zoom: 2.2,
  minZoom: 2.05,
  maxZoom: 12,
});
```

Replace the `......` inside the quotes with the access token from your account. Change the style attribute to point
to your version of the vintage style.

## Add Service To Run The Backend

```bash
sudo cp ~/pi-world-radio/files/etc/systemd/system/pi_radio_app.service /etc/systemd/system
sudo systemctl daemon-reload && sudo systemctl enable pi_radio_app.service.service
```

?> Make sure you update the various paths inside the service definition to match your setup

## Setup Chromium Kiosk Mode

Earlier during the OS setup, you should've installed the required packages to run X apps but no window manager or
desktop packages. Its possible to simply run a X app (like Chromium) with this setup. This way we reduce the
resources used when running the usual X desktop.

Add the `.xinitrc` file to launch chromium in kiosk mode

```bash
cp ~/pi-world-radio/files/.xinitrc ~/.xinitrc
```

Add this to the end of `~/.bashrc` on the RPi (if using bash as thr login shell).
```
if [[ ! $DISPLAY && $XDG_VTNR -eq 1 ]]; then
  startx
else
  echo "Not starting X"
fi
```

Again reboot the RPi. If everything was setup correctly after booting up you should see the browser
startup and load the radio app in fullscreen.

### Additional features

If at any point you want to restart the browser, add this file `~/.restartkiosk` and it will cause the browser to
stop and restart. Useful to reload the app after making any changes. The file will be automatically deleted.

```bash
touch ~/.restartkiosk
```

If at any point you want to end the browser session and get to the prompt on the console add file `~/.nokiosk`.
Again this file will get cleaned up automatically.

```bash
touch ~/.nokiosk
```
Both of these files can be added from an ssh login session.

To start the app again, run `startx` on the console. You cannot run `startx` from an ssh session.

## Debug The App

If you are having issues with the app and need to debug it, you can load the app in a browser on you laptop with
this url `http://<rpi-ip-address>:8001/`. Use the developer console to view any errors in the browser console.
