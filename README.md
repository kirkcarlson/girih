# Girih

Girih is a tool for playing with tiles. It is inspired by the girih tiles
invented in the 10th century or so. These tiles have been used in the
architecture of many structures in the Middle East.

Tiles are placed by moving to the edge of an existing tile, selecting the
new tile with the arrow keys (or direct select keys) and pressing <ENTER> key
or clicking the mouse. Tiles may be deleted by selecting the circle at the
center of the tile with the mouse and pressing the <DELETE> or <BACKSPACE> key.

Several options may be controlled by the pane on the right side.

# Girih development

@author   Ikaros Kappler
@date     2013-12
@modified 2015-03-19 Ikaros Kappler (SVG export added).
@version  0.1.2
@license  GPLv2.0


A Girih tesselation tool.


# Differences from the Lu-Steinhardt-Tilesets
* I added the narrow rhombus tile, which is part of the penrose set but 
  _not_ part of the original girih tile set!
* I added an octagon test but the angles do not match together.



Thanks to Cronholm144 for the gireh tile template image.
@url http://commons.wikimedia.org/wiki/File:Girih_tiles.svg


### Todo
* Use a proper drawing library (with zooming, panning, selecting, dragging, ...).
* add other tile sets: (Penrose P1, P2, Rhombus, etc.), Collidescape, Fractiles...


Changelog
=========
[2018-12-16]
 * Added the octagon tile just for testing.

[2015-10-26]
 * Added the 't' key handling for toggling textures on/off.

[2013-12-17]
 * Basic polygon- and circle-intersection, triangle datastructures for
   Point sets.

[2013-12-15]
 * Added narrow Penrose rhombus tile (not part of girihs).

[2019-12-29]
 * Fixed SVG save function.
 * made control pane narrower

[2020-04-??]
 * changed coordinate driven approach to a turtle based vector approach
 * added a Turtle object
 * added fancy girih strapping

[2020-05-14]
 * converted files to use ECMA6 classes
 * allow direct selection of polygons from keyboard


Thanks to
=========
* [FileSaver.js] Eli Grey
