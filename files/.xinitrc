#!/bin/sh
xset -dpms
xset s off
xset s noblank

unclutter -idle 0.5 &

rm -rf ~/.nokiosk

start_chromium_kiosk () {
  sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences
  sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences

  /usr/bin/chromium-browser http://localhost:8001 --window-size=800,480 --window-position=0,0 \
    --start-fullscreen --kiosk --incognito --noerrdialogs --disable-translate --no-first-run \
    --fast --fast-start --disable-infobars --disable-features=TranslateUI --disk-cache-dir=/dev/null \
    --disable-session-crashed-bubble --disable-component-update \
    --simulate-outdated-no-au='Tue, 31 Dec 2099 23:59:59 GMT' --password-store=basic &

  # Wait 10 seconds and then click somewhere in the middle
  # to make the web-page receive keyboard events
  sleep 10
  xdotool mousemove 500 300 click 1
}

start_chromium_kiosk

# At any point to break-out and end the session add 
# the ~/.nokiosk file.
while [ ! -f ~/.nokiosk ]; do
  # xdotool keydown ctrl+Tab; xdotool keyup ctrl+Tab;
  xdotool keydown x; xdotool keyup x;
  sleep 5
    
  # Check if there is a restart file
  if [ -f ~/.restartkiosk ]; then
    rm ~/.restartkiosk
    killall /usr/lib/chromium-browser/chromium-browser
    sleep 2
    start_chromium_kiosk
  fi
done

#pkill ddchromium
killall /usr/lib/chromium-browser/chromium-browser
