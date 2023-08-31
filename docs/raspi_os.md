# Raspberry Pi OS Setup

This page describes setting up the OS for the Raspberry Pi

## Choosing the OS type

Raspberry Pi publishes their own distribution of Linux thats based on Debian and simply
called [Raspberry Pi OS](https://www.raspberrypi.com/software/ ':target=_blank').
It was previously known as Raspbian.

I didn't need a full desktop setup for this build. So I first installed the Lite Version
which doesn't contain any of the packages for the GUI. Later on I installed the minimal
set of packages needed to just launch Chromium. One of the things I wanted was the ability
to manage Wifi connections remotely. For this I found [Dave Steele's Comitup](https://davesteele.github.io/comitup/).
Trying to install Comitup on top of the default Lite install didn't work well because it
required changing the default networking manager. Then i realized that Comitup has its own
pre-configured image of Raspberry Pi OS Lite with Comitup setup. So I switched to using
the Lite Image from Comitup and it worked like a charm.

## Burn the OS to SD Card

Download the Lite Image from [here](https://davesteele.github.io/comitup/ ':target=_blank') and
follow the instructions from
[Raspberry Pi Official Docs](https://www.raspberrypi.com/documentation/computers/getting-started.html#using-raspberry-pi-imager ':target=_blank')
to burn the image to a SD card

When you have the Raspberry Pi Imager open, and after you have selected the image to install,
open the 'Advanced Options' menu and update/set some of the settings

* Enable SSH (though Comitup says its enabled by default in the image)
  * Add your ssh public key if you have that
* Enable 'Username and password'
  * Set username to radio (or anything else you prefer)
  * Set a password
* Enable 'Set Locale settings' and choose appropriate values

Click 'Save' and burn the image. Once done, pop the SD card into Pi and power it up.

?> It will be helpful to have the Pi plugged into a regular monitor and have a keyboard attached at this stage.

## Configure the OS

### Setup Wifi

Following the instructions from [Comitup](https://github.com/davesteele/comitup/wiki/Tutorial ':target=_blank')
and configure the Wifi on the Pi to connect it to a network with Internet access.

If you need to get the IP Address of the RPi on the Wifi and you don't have a keyboard and monitor attached,
refer to the [Remote Access](https://www.raspberrypi.com/documentation/computers/remote-access.html ':target=_blank')
section of the Raspberry Pi Docs.

?> The rest of the instructions for this build assumes the Pi has access to the internet and you can SSH to the Pi
   to run commands in a shell.

### Install additional software

```bash
sudo apt install git python3-setuptools python3-venv xdotool unclutter chromium-browser \
  xserver-xorg-video-all xserver-xorg-input-all xserver-xorg-core xinit x11-xserver-utils \
  fonts-noto-color-emoji
```

?> I use `vim` for editing files when in a shell and installed that using apt. Wherever I use `vim` substitute with
   your editor of choice.

Instructions from NodeSource to [install NodeJS](https://github.com/nodesource/distributions#debinstall ':target=_blank')

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x > /tmp/setup_18.x.sh
sudo -E bash /tmp/setup_18.x.sh && sudo apt-get install -y nodejs
```

!> Always be wary of downloading scripts and directly piping to bash. Unless you absolutely trust the source,
   always download the script and review the code before executing it. In the command above, make sure you review
   `/tmp/setup_18.x.sh` before executing it.

### Autologin

Using `raspi-config` I configured the only user `radio` to be logged in automatically.

```bash
sudo raspi-config
```
System Options -> Boot / Auto Login -> Console Autologin.
Move the selection to 'Finish' using the TAB key and hit ENTER. Choose 'Yes' for reboot and verify on next boot you
are auto logged in to the console.

## OS Tweaks

### Setup Zram

During the normal operation of the OS, there is constant writing of logs and these writes typically go to /var/log
and on the Pi thats going to `/var/log`. Over time the constant write is known to cause SD Card failures. For my
use-case I don't care much for logs and decided to setup a ZRAM drive that will put all log writes to RAM instead
of the SD Card. The downside is anything written to ZRAM will be lost on a reboot, unless you explicitly sync it
back to disk.

Follow the instructions at [https://github.com/ecdye/zram-config](https://github.com/ecdye/zram-config ':target=_blank')
to setup ZRAM.

### Set hostname

Comitup by default sets the hostname and the Wifi AP to something like `comitup-nnn`. I changed it to show something
    more suitable.

```
sudo vim /etc/comitup.conf
```
Change the `ap_name` config key to your preference. I changed it to `pi-radio`.

```
sudo vim /etc/hostname
```
Change the hostname in this file to match what you want. Reboot to pick the changes.


