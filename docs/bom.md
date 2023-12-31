

This is the breakdown of the hardware that went into the final build. There are additional
pieces that I used in the process of building that I already on hand. Those are also
listed in the next section.

## Bill Of Materials

All the prices listed here are what I paid for them (before any taxes/shipping) and don't reflect current pricing. Links do not contain any affiliate marketing code.

| Item   | Price | Link | Notes |
|--------|-------|------|-------|
| Raspberry Pi 4 2GB | $45 | https://www.adafruit.com/product/4292 | |
| RaspiAudio DAC HAT | $25 | https://www.amazon.com/dp/B09JK728MB | |
| 5" Screen | $26 | https://www.amazon.com/dp/B07NRYPZM1 | |
| USB-C 20W Power Adapter & Cable | ~$10-$15| | I had a couple of spares. Any good 20W adapter and usb-c cable will work |
| 32GB Micro SD Card | $6 | https://www.amazon.com//dp/B08J4HJ98L | Came as a 2-pack for $12 |
| 270 Degree HDMI Adapter | $5 | https://www.amazon.com/dp/B0BWHHSMTZ | the 270 Degree is important because of how the HDMI port on the screen is oriented |
| Micro HDMI Adapter | $5 | https://www.amazon.com/dp/B07K21HSQX | Came as a 2-pack for $10 |
| Short HDMI Cable | $9 | - | Had one lying around |
| Heatsink for Rpi 4 | $7 | https://www.amazon.com/dp/B08N5VZN8R | See Notes |
| GPIO Extender | $9 | https://www.amazon.com/dp/B0BDF48FWM | Needed to install Audio HAT on top of heatsink |
| 40pin Male to Female GPIO Cable | $4 | https://www.amazon.com/dp/B07CGM83QL | Came as a 2-pack for $8 |
| Thermal Compound | $5 | | Don't use the thermal stickers that come with the heatsink. Any quality thermal compound typically used in PC builds will work |
| Relay Module | $7 | https://www.amazon.com/dp/B0057OC6D8 | Only one channel was used, but was cheapest option that didn't require buying a bundle |
| Donor Radio Box | $30 | Ebay - KLH Model Twenty One | See Notes |
| Vintage Grill Cloth | $12 | Etsy | Search for Vintage Speaker Grill cloth |
| 4" Midrange Speaker | $25 | https://www.amazon.com/dp/B00RC3Z9H2 | See notes |
| Spare wood or board for front face | - | - |Had some leftover board. Might be able to find something free/cheap in the discard bin in any home improvement store |
| Rotary Encoders | $10 | https://www.amazon.com/dp/B07FJQH1F7 | |
| Assortment of M2.5 and short screws | - | Depends on how you mount the hardware |
| Small Angle Brackets | $2 | - | |
| Wires | - | - | I used jumper wires that i got with the rotary encoders for most of the wiring |

### Notes

 * Heatsink: The Raspberry Pi4 tends to run a little hotter than previous boards. During development
   I saw idle temp of around 52&deg;C and it would rise once I started running chromium and playing
   audio. Since the board was going to be in an enclosed box, I decided to put a good quality
   heatsink to help with cooling. Using quality thermal compound and the head-sink, I immediately
   saw idle temps go down to 40-41&deg;C and even under normal load it never went above 50&deg;C
 * Donor Radio: I was looking for an old radio where the speaker was off to the side and there is
   enough room to cutout a window to embed the 5" screen. The model in the original Hackaday
   project would've been perfect but I couldn't find it on ebay or other sites. So I kept searching
   ebay for "vintage radio" and came across the [KLH Model Twenty One](https://www.radiomuseum.org/r/klh_klh_twenty_one_21.html ':target=_blank')
   This particular model looked very much like what I was looking for and I got lucky when I found
   a listing where it was being sold for cheap because it was not working. My original plan was to re-use
   the front face that came with the donor radio. But the placement of the screen in the original board would
   make the existing holes for the knobs off-center. I also decided I wanted to use a fourth rotary knob. I
   decided to make a new front face with some leftover board pieces I had lying around. Ultimately it might
   have been cheaper to simply build the whole box. Anyways atleast I can claim I used the bones of a real
   vintage radio.
 * Speaker & Grill Cloth: You maybe able to source this on the cheap if you go hunting in thrift stores for
   old spearkers and salvage the cloth and decent speaker drivers.

## Other Materials for Development

These are the materials that I used when testing out the build and developing the software.

 * Breadboard
 * Lots of jumper wires
 * 40-pin Breadboard GPIO Extender
 * Electrical wires

## Tools

The tools I used

 * Dremel Rotary tool
 * Drill machine and drill bits
 * Sander and blades for Dremel
 * Digital Multimeter
 * Soldering Iron and Solder
 * Wire Stripper
 * Scissors
 * Super Glue, hot glue and glue gun.
 * 91% Isopropyl Alcohol.
 * Precision Screw driver set
 * Digital Calipers
 * Autodesk Fusion 360 for designing the 3D parts and laying out the design for the front face.
 * 3D printer (Creality Ender3) for printing the 3D printed parts.
