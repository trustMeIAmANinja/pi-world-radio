# Assembling The Hardware

This page describes the final assembly steps to put together the Pi Retro World Radio.

## Front Face

### Backing Board

I used the original backing board to trace and cut a similar sized piece from a piece of board.

![](assets/img/retro_pi_front_face_board_cut.jpg ':size=50%')

I created this sketch in Autodesk Fusion 360 to help me create the 3D design for the 3D Printed pieces. I
just added some additional dimension annotations and used that to make the cutouts and drill holes on the
board

![](assets/img/retro_pi_front_sketch.jpg ':size=50%')

I used a small bit to drill lots of tiny holes close to each other for the speaker and display cutout. Then
using a dremel and a small circular blade I cut out the pieces and then sanded down the rough edges. Also marked
and drilled holes for the rotary encoder and for the 3D printed front piece.

![](assets/img/retro_pi_front_face_cutout.jpg ':size=50%')

### Grill Cloth

Using the board with the cutouts I marked the backside of the the vintage cloth to cut that. I only cutout the
part where the display will come through. For the rotary knobs I used a sharp object to punch the holes and also
the holes where the 3D printed piece will poke through. I used super glue to carefully glue the cloth onto the
board.

![](assets/img/retro_pi_front_face_grill_cloth.jpg ':size=50%')

### 3D Printed Front Frame

I designed and 3D printed a front frame for encoder + display area. There is a correspoding back frame that attaches
to the display and to the front frame to hold it all together. You can find the 3D files and Fusion 360 project in
the github repo.

![](assets/img/retro_pi_3d_frames.jpg ':size=50%')

### Mounting Inside The Box

This was a bit of challenge. The original radio had an an inner aluminium frame and the front face board was mounted
to it. I couldn't use that, so I had to improvise and figure out a way to securely mount the new front face. I
eventually decided to use small 90-degree angle brackets that would be screwed to the side walls of the box. First I
had to mark the points where the brackets would be screwed with the board inside. With a drill bit at an angle I
made some starter holes. Then I used self-tapping screws to "drill" holes in the soft wood of the box. Finally I
put the board back in and installed the angle brackets to hold it in. I used two on the speaker side and 1 on the
other side.

![](assets/img/retro_pi_inside_front_board_mount.jpg ':size=50%')


## Display

The display didn't have any mounting points to attach it to the back of the backing board. I had to improvise a bit
here. I sketched and designed frame prices that would go over the 4 standoff screws on the back of the display and
extend out to attach to the board. I then extended the design to allow the front 3d printed frame to attach to
these back frame pieces and overall I got a really good mount. I screwed the standoffs that came in the display box
to the keep the display attached to the frame pieces. I attached the 270 degree HDMI adapter to the display, a
regular HDMI cable to this which was then attached to the micro-HDMI to HDMI adapter from the RPi.

## Rotary Encoders

Using a soldering iron I de-soldered and removed the header pins that come on the rotary encoder boards because they
made it almost impossible to mount the encoders to the backing board. I soldered the jumper wires to the back of the
rotary encoders modules. Because the jumper wires were a bit too thin, I put a blob on hot glue on the wires to
prevent them from breaking off.

![](assets/img/retro_pi_rotary_encoder_stages.jpg ':size=50%')

The rotary encoders were pushed through the back side and on the front I used the washers and nuts that came with
them to securely mount them to the front frame.

![](assets/img/retro_pi_front_rotary_encoder_attach.jpg ':size=50%')

On the back side, I soldered the signal wires from the encoders to the solder pads on the back of the display.
These pads will eventually connect to GPIO header of the RPi when the GPIO ribbon cable is attached. Refer to the
pin mapping in the [hardware setup](hardware_setup?id=rotary-encoders) section. The layout of the solder pads is
mirrored as compared to the GPIO header on the RPi. So triple-check before you solder them. I took the +V and GND
connections and bunched them together and then attached a single wire to the GPIO point. I used heatshrink tubing
to secure the joints.

?> All the soldering was done with the front face board outside the box and then I carefully re-mounted the board
   back into the box.

![](assets/img/retro_pi_back_display_rotary_encoder_wiring.jpg ':size=50%')

## Speaker

To mount the speaker to the board, I looked for the shortest self-tapping screws in the hardware store. These were
a bit too long and would've poked through the grill cloth. So I added a couple of washers to keep the screws from
poking through and still hold securely to the board.

## Raspberry Pi

The heatsink for RPi came up 4 screws and 4 brass standoffs. During the development phase I used the screws from
the bottom to hold the heatsink down. For mounting the RPi into the radio box, I marked the four holes for the
mounting points on the bottom of the box and drilled four holes with a small drill bit from the outside through
the wood on the bottom. Using a bit of force i threaded the brass standoff from the inside. This gave me a nice
secure way to mount the RPi inside the radio box and the space under the board helps with ventilation and cooling
of the board.

![](assets/img/retro_pi_inside_rpi_standoff.jpg ':size=50%')

I unscrewed the heasink and thoroughly cleaned and removed the old thermal grease with some isoproply alcohol. I
re-applied fresh thermal grease and put the heasink back on. This time I put the screws from the top and screwed
them into the brass standoff.

![](assets/img/retro_pi_inside_rpi_mounted.jpg ':size=50%')

## AudioHat & GPIO Cable

The Audiohat plugged onto the GPIO header pins on the Pi and is fairly secure. It has a similar male header pins
on the top. I attached the 40-pin female-to-male GPIO ribbon cable between the headers on the Audiohat and the
26-pin female header block on the back of the display. This gets the +5V power needed for the display and forwards
the GPIO all the way to the solder pads on the back of the display where everything else is soldered on. The
wires from the speaker were screwed to one set of terminals on the Audiohat.

![](assets/img/retro_pi_inside_audiohat.jpg ':size=50%')

## Relay Board

One of the images above shows how I soldered the wires to the display backlight on/off switch. I soldered jumper
wires for the relay signalling to the solder pads on the back of the display. On the relay board side I attached
the jumper wires to the header pins and put a dab of hot glue to keep them from moving. I screwed the relay board
down to the base of the radio with some M2.5 screws and attached the wires from the display switch to the normally
open terminals.

![](assets/img/retro_pi_inside_display_relay.jpg ':size=50%')

## Power Up!

Thats it. I closed up the back with the original cover and was able to attach the usb-c power via the cutout that
was already in the back cover.


