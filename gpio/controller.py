# -*- encoding: utf-8 -*- 

from __future__ import print_function
import evdev
import glob
import os
import select
import stat
import sys

from evdev import ecodes as e

required_devices = [
        'platform-rotary@2-event', 
        'platform-rotary@e-event',
        'platform-rotary@18-event',
        'platform-button@4-event',
        'platform-button@7-event',
        'platform-button@11-event'
    ]

def is_device(fn):
    '''Check if ``fn`` is a readable and writable character device.'''

    if not os.path.exists(fn):
        return False

    m = os.stat(fn)[stat.ST_MODE]
    if not stat.S_ISCHR(m):
        return False

    if not os.access(fn, os.R_OK | os.W_OK):
        return False

    return True

def list_devices(input_device_dir='/dev/input/by-path/'):
    '''List readable character devices in ``input_device_dir``.'''

    fns = glob.glob('{}/*event*'.format(input_device_dir))
    fns = list(filter(is_device, fns))

    return fns

def check_devices():
    '''Check if the required devices are present'''
    devices = list_devices()
    count = 0
    for device in devices:
        if device.split('/')[4] in required_devices:
            count += 1
    if count != len(required_devices):
        print("ERROR: Missing some required input device(s)")
        sys.exit(1)

    print("Found all required devices.")
    return devices


class RotaryInputDevice(evdev.InputDevice):
    """
    Constructor
    dev: the input device path
    key_right: key event to emit when encoder is rotated right
    key_left: key event to emit when encoder is rotated left
    uinput_dev: UInput device to use to emit events
    """
    def __init__(self, dev, key_right, key_left, uinput_dev):
        super().__init__(dev)
        self.__uinput_dev = uinput_dev
        self.__key_right = key_right
        self.__key_left = key_left

    def emit_event(self, value):
        if value > 0:
            self.__uinput_dev.write(e.EV_KEY, self.__key_right, 1)
            self.__uinput_dev.write(e.EV_KEY, self.__key_right, 0)
            self.__uinput_dev.syn()
        else:
            self.__uinput_dev.write(e.EV_KEY, self.__key_left, 1)
            self.__uinput_dev.write(e.EV_KEY, self.__key_left, 0)
            self.__uinput_dev.syn()

if __name__ == '__main__':
    check_devices()
    # Setup devices
    cap = {
        e.EV_KEY : [e.KEY_H, e.KEY_L, e.KEY_LEFT, e.KEY_RIGHT, e.KEY_UP, e.KEY_DOWN],
    }
    ui = evdev.UInput(cap, name='virtual-keyboard', version=0x3)
    
    r1 = RotaryInputDevice('/dev/input/by-path/platform-rotary@2-event', e.KEY_RIGHT, e.KEY_LEFT, ui)
    r2 = RotaryInputDevice('/dev/input/by-path/platform-rotary@e-event', e.KEY_UP, e.KEY_DOWN, ui)
    r3 = RotaryInputDevice('/dev/input/by-path/platform-rotary@18-event', e.KEY_H, e.KEY_L, ui)

    devices = {
        r1.fd: r1,
        r2.fd: r2,
        r3.fd: r3,
    }
   
    # Loop forever
    # From: https://blog.ploetzli.ch/2018/ky-040-rotary-encoder-linux-raspberry-pi/
    while True:
        r, w, x = select.select(devices, [], [])
        for fd in r:
            for event in devices[fd].read():
                event = evdev.util.categorize(event)
                if isinstance(event, evdev.events.RelEvent):
                    # print("FD: {0} Value: {1}".format(fd, event.event.value))
                    devices[fd].emit_event(event.event.value)
