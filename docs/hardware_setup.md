# Hardware Setup

This page describes all the steps to get the various hardware components working.

## Components

### Heatsink

Mounting the heatsink is pretty straighforward. It came with mounting screws and brass standoffs. The
standoffs came in handy later when I had to mount the Rpi inside the radio box. I discarded the thermal
pad stickers that came with the heatsink and used some proper thermal grease. Just a tiny bit of grease is
enough. Make sure to put grease on both the CPU and the RAM chip.

### Audio DAC Hat

Initially, I mounted the Audio DAC Hat, directly on top of the GPIO Header on the RPi. Later when I installed
the Heatsink, the HAT would not sit. I then put the GPIO extender/splitter and put the HAT on top of it.

To disable the onboard speakers on the HAT, I used a blade to cut the solder joints on the board as shown in their
docs. Do this after you have verified everything is working.

### Speaker

I used a 4" mid-range speaker to get a decent frequency coverage and something that would not be too bulky to fit
in the box. Since I am only going to be playing internet streams, I didn't need a high-end audiophile quality driver.
If you can salvage a driver from an old PC speakers they might work as well. I soldered a pair of wires to the
speaker's terminals and then attached them to the speaker terminals on the HAT.

### Display

The 5" HDMI display I chose is pretty basic. It can be powered from the 5V rails on the RPI GPIO headers. I chose this
specific model for a couple of reasons
 * Displays with any kind of onscreen menu and bells and whistles tend to have a startup delay. This one turns on/off instantly.
 * The touchscreen functionality is disabled by default, unless you configure the OS to enable it. I didn't plan to
   use touchscreen and it freed up GPIO ports for other uses.
 * the back of the display has solder pads for the first 26 pins of the RPi GPIO headers and I could use these to wire up
   the encoders and relay

To connect the display, I used the 40-pin male-to-female GPIO ribbon cable and connected the 26-pin header on the
back of the display to the RPi GPIO header via the GPIO extender. Make sure you match the sides correctly so that
the pins are connected correctly. I connected the HDMI port on the display to the RPi using the micro-HDMI to HDMI
adapter.

### Relay Module

The one thing that would've been nice to have in the display was some way of controlling the backlight using GPIO.
Instead it had a simple switch in the back. Once the display is in the box there is no way to access it. A little
testing showed that the switch was wired to the 5V power supply. I could just connect a simple relay in parallel to
the switch and leave the switch in the OFF position. This way I could turn it on/off using software. All of the
simple single channel relay modules required buying a bundle of 3-4 on Amazon. So I opted for the cheapest option,
which turned out to be the dual-channel module I used.

On the relay module, ensure the jumper is connecting the JD-VCC and VCC pins. Connect 5V from the GPIO header to
relay module's VCC Pin and one of the GND pin to GND pin on the relay module. Finally connect GPIO 14 to one of the
channel input pins (IN1 or IN2). Just remember to connect the wires from the display switch to the correct channel's
'Normally Open' terminals.

![Relay Module Annotated](assets/image/../img/relay-module-annotated.jpg ':size=50%')

### Rotary Encoders

Other than the display this is the most visible off all the components and the one that adds the "retro" look. I
had trouble getting them to work reliably using some of the popular tutorials
([here](https://thepihut.com/blogs/raspberry-pi-tutorials/how-to-use-a-rotary-encoder-with-the-raspberry-pi ':target=_blank'))
that used GPIO libraries to read the encoder state to determine rotation. Eventually I found this
[blog post](https://blog.ploetzli.ch/2018/ky-040-rotary-encoder-linux-raspberry-pi/ ':target=_blank') that made it
dead simple to integrate the rotary encoders. The bonus was that the `evdev` python library used for reading the
rotary encoders also had dead simple functionality to emit keyboard events which I was going to do anyways.

The rotary encoders also have a push-to-click button which I use for additional events for the user interface.
This table shows the keyboard events emitted for each action of the rotary encoders.

| Encoder | Rotate Left | Rotate Right | Click |
|---------|-------------|--------------|-------|
| **1**   | Left Arrow  | Right Arrow  | q     |
| **2**   | Down Arrow  | Up Arrow     | p     |
| **3**   | o (zoom in) | i (zoom out) | n     |
| **4**   | l (vol down) | h (vol up)  | m     |

These keyboard events are sent to the active application/window by the OS. That would be the chromium browser in
fullscreen kiosk mode running the web app where the javascript code will handle the events and execute the
appropriate event handler to perform various actions.

This table lists the mapping of the encoder and switch pins to the GPIO Pins. I connected one of the 3v3 pins to
the `+` of the encoder pins.

| Encoder | CLK | DT | SW |
|---------|-----|----|----|
| **1**   | 10  | 9  | 11 |
| **2**   | 7   | 8  | 24 |
| **3**   | 17  | 27 | 22 |
| **4**   | 2   | 3  | 4  |

?> Note the pin numbers are not the physical pin numbers. I use the excellent [pinout.xyz](https://pinout.xyz/ ':target=_blank')
   to map from GPIO number to physical pin number.

## Development Setup

The first thing I did was to get a development setup going with a breadboard and jumper wires.
Even if you are simply going to follow this build without making any changes, I will still
recommend setting up everything first on a breadboard and get everything working before putting it
all in inside the final box. I used a RPi GPIO to Breadboard extender. You don't necessarily need
this and you can simply connect jumpers from the breadboard to the GPIO pins. The extender was
more convenient because it had labels for the GPIO pins that made it easier. Here's a picture of my
final development setup.

![Hardware Dev Setup](assets/img/retro_pi_hw_dev_setup.jpg ':size=50%')

## Software Setup

Clone the [pi-world-radio](https://github.com/trustMeIAmANinja/pi-world-radio ':target=_blank') repo to your
home directory on the Raspberry Pi

```bash
git clone https://github.com/trustMeIAmANinja/pi-world-radio ~/pi-world-radio
```

### Audio DAC Hat

Instructions for setting up the RaspiAudio HAT from their
[installation guide](https://forum.raspiaudio.com/t/mic-installation-guide/17#installation-2 ':target=_blank')

```bash
wget -O /tmp/install_raspiaudio.sh mic.raspiaudio.com
wget -O /tmp/test_raspiaudtio.sh test.raspiaudio.com
```

Review the scripts `/tmp/install_raspiaudio.sh` and `/tmp/test_raspiaudio.sh` before you proceed.

```bash
bash /tmp/install_raspiaudio.sh
```

The script will ask you to reboot the Pi. After the reboot run the test script. According to the docs this step is
necessary to actually enable the Audio HAT as a sound card.

```bash
bash /tmp/test_raspiaudio.sh
```

### Rotary Encoders

Add this snippet to `/boot/config.txt` on the RPi to enable input events from the rotary encoders. This is based on
the pin mapping I used. If you change the pin mapping, make sure up change the values in `/boot/config.txt`. With
this snippet, I only need to handle the rotation events. The click actions directly emit the configured keyboard
input event and there is nothing more to do.

```
# Setup Rotary Encoders
dtoverlay=rotary-encoder,pin_a=10,pin_b=9,relative_axis=1
dtoverlay=rotary-encoder,pin_a=7,pin_b=8,relative_axis=1
dtoverlay=rotary-encoder,pin_a=17,pin_b=27,relative_axis=1
dtoverlay=rotary-encoder,pin_a=2,pin_b=3,relative_axis=1

dtoverlay=gpio-key,gpio=11,keycode=16,label="KEY_Q"
dtoverlay=gpio-key,gpio=24,keycode=25,label="KEY_P"
dtoverlay=gpio-key,gpio=22,keycode=49,label="KEY_N"
dtoverlay=gpio-key,gpio=4,keycode=50,label="KEY_M"
```

?> You have to use sudo to edit `/boot/config.txt`.
   ```sudo vim /boot/config.txt```

To handle the rotation events of the encoders I wrote a simple python script to be run as a background service.
Next we will configure and enable this service.

Create a python virtual env and add the `evdev` pip module

```bash
python -m venv ~/.venvs/radio
source ~/.venvs/radio/bin/activate
python -m pip install evdev
```

Add the systemd service definition

```bash
sudo cp ~/pi-world-radio/files/etc/systemd/system/gpio_radio_controller.service /etc/systemd/system
sudo systemctl daemon-reload && sudo systemctl enable gpio_radio_controller.service
```
?> Make sure you update the various paths inside the service definition to match your setup

### Display

For the display to work correcly, add this snippet to `/boot/config.txt`

```
# --- start elecrow-pitft-setup  ---
hdmi_force_hotplug=1
max_usb_current=1
hdmi_drive=1
hdmi_group=2
hdmi_mode=1
hdmi_mode=87
hdmi_cvt 800 480 60 6 0 0 0
dtoverlay=ads7846,cs=1,penirq=25,penirq_pull=2,speed=50000,keep_vref_on=0,swapxy=0,pmax=255,xohms=150,xmin=200,xmax=3900,ymin=200,ymax=3900
display_rotate=0
# --- end elecrow-pitft-setup  ---
```

Reboot the RPi to pick up all the changes. If everything worked correctly you should see the console output on the
5" display.

