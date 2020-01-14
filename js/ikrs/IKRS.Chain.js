/*
 * A chain is a set of connected girih strapping segments
 *
 * @author Kirk Carlson
 * @date 2020-01-02
 * @version 1.0.0
 **/

/*
Connectors are at the midpoint of each side of each polygon.
On a polygon, a link moves from an entry connector clockwise to another connector
which it dives under.
There are two links at each connector:
    one moves off a polygon counter clockwise onto the adjacent polygon clockwise
    one moves off the adjacent polygon counter clockwise onto the polygon clockwise
Chains may either:
    loop
    start and stop at the edge of the collected polygons

Links are identified by their parent polygon ID and a polygon link ID which is the
polygon edge ID. This identification is included in an SVG class designation. A link
may be more than one segment.

Links include the SVG class designation of the chain that they are a member. To
facilitate coloring of symmetric patterns, an SVG class for the number of elements
in the containing chain is also included.

Find chains
/   clear the connector list ... this guarrenty different identifiers, would like to nail them down somehow, see below
/   for all polygons
/       for all connectors on polygon
/           if connector not on connector list
/               add connector to connector list
                add polygon ID and link ID to connector as CCW
/           else
                if only one link on in connector
/                   add polygon ID and link ID to connector as CW
                    add internal CW link to Cw connector
--how does this work?
                else
                    report error
    // find the chains
want to use internal link to find other connector on polygon

for all connectors
  if the connector is in same location as another connector
    put the connector onto the chain list as CW links
    put the connector onto the chain list as CCW links

assuming a clean list of chains
This assumption may need to be revisited to keep chain numbers consistent as
the girih grows.
    if the connector is not shared with another connector
      if the internally connected connector is not shared with another connector
         create a new chain
         add the link to the chain
         add the chain to list of single chains
      else if connector is not on any chain list
         create a new chain
         add the link to the new chain
         move to the new polygon via the connector
         // walk the chain
         loop until connector is not shared
           if the internall connected connector is not shared with another connector
             add the link to the chain
             close the chain ??
           else
             add the link to the chain
             move to the new polygon via the connector

walk through the list of chains
  add a SVG class name for the length of the chain to each chain


Structure of connector list
    separate list
        by polygon and edge/connector
    use the list of polygons
        just add the edge/connector list

    each connector has:
        internal mate
        external mate if found
        chain identifier (class)

Structure of chain list:
    list of chains
        list of links (nice if this is clockwise wrt the center of the figure
        chain identifier (class)
        isLoop



example
central decagon 0
surrounded by 5 decagons numbered 1 to five from 1 o'clock
edges numbered from 0 from 12 o'clock

decagon cw
  0 --> 2
  1 --> 3
  2 --> 4
  3 --> 5
  4 --> 6
  5 --> 7
  6 --> 8
  7 --> 9
  8 --> 0
  9 --> 1

decagon ccw
  0 --> 8
  1 --> 9
  2 --> 0
  3 --> 1
  4 --> 2
  5 --> 3
  6 --> 4
  7 --> 5
  8 --> 5
  9 --> 7

Connectors
  polygon 0 connector 0  cw to 2  connect to polygon 5 connector 5
  polygon 0 connector 1  cw to 3
  polygon 0 connector 2  cw to 4  connect to polygon 1 connector 7
  polygon 0 connector 3  cw to 5
  polygon 0 connector 4  cw to 6  connect to polygon 2 connector 9
  polygon 0 connector 5  cw to 7
  polygon 0 connector 6  cw to 8  connect to polygon 3 connector 1
  polygon 0 connector 7  cw to 9
  polygon 0 connector 8  cw to 0  connect to polygon 4 connector 3
  polygon 0 connector 9  cw to 1

  polygon 1 connector 7  cw to 9  connect to polygon 0 connector 4
  polygon 2 connector 9  cw to 1  connect to polygon 0 connector 6
  polygon 3 connector 1  cw to 3  connect to polygon 0 connector 8
  polygon 4 connector 3  cw to 5  connect to polygon 0 connector 0
  polygon 5 connector 5  cw to 7  connect to polygon 0 connector 2

chains
    most have only one connection in the connector list so are on and off length 1

    five are more interesting:
    chain 0:
        polygon 1 connector 3 -->5 cw
        polygon 0 connector 0 -->8 ccw
        polygon 5 connector 3 -->5 cw
    chain 1:
        polygon 1 connector 7 -->5 ccw
        polygon 0 connector 0 -->2 cw
        polygon 2 connector 7 -->5 ccw
    chain 1':
        polygon 2 connector 5 -->7 cw  duplicate with chain 1!
        polygon 0 connector 2 -->0 ccw
        polygon 1 connector 5 -->7 cw
    chain 2:
        polygon 2 connector 9 -->7 ccw
        polygon 0 connector 2 -->4 cw
        polygon 3 connector 9 -->7 ccw
    chain 2':
        polygon 3 connector 7 -->9 cw  duplicate with chain 3!
        polygon 0 connector 4 -->2 ccw
        polygon 1 connector 7 -->9 cw
    chain 3:
        polygon 3 connector 1 -->9 ccw
        polygon 0 connector 4 -->6 cw
        polygon 1 connector 1 -->9 ccw
    chain 3':
        polygon 4 connector 9 -->1 cw  duplicate with chain 5!
        polygon 0 connector 6 -->4 ccw
        polygon 1 connector 9 -->1 cw
    chain 4:
        polygon 4 connector 3 -->1 ccw
        polygon 0 connector 6 -->8 cw
        polygon 5 connector 3 -->1 ccw
    chain 4':
        polygon 5 connector 1 -->3 cw  duplicate with chain 7!
        polygon 0 connector 8 -->6 ccw
        polygon 4 connector 1 -->3 cw
    chain 4'':
        polygon 5 connector 5 -->3 ccw duplicate with chain 0!
        polygon 0 connector 8 -->0 cw
        polygon 0 connector 5 -->3 ccw

This almost looks like traversing the list starting clockwise is an easy way
to traverse all links without having to traverse all links twice.

sort of proof
    all edge connectors have a cw and ccw internal connection
    the sum of all edge connectors will have an equal number of cw and ccw internal connections
    you cannot cross connect cw and ccw
    loops can be traversed cw or ccw without prejudice (animating a loop or chain will make a difference in appearance)

cw first means
    mark the connection as visited
    move across the internal link (ccw) to then next connnector
    move to that connector
above list looks like:
   chain 0
      poly 1 con 3
      poly 0 con 8
      poly 5 con 3
   chain 1
      poly 1 con 5
      poly 0 con 0
      poly 2 con 5
   chain 2
      poly 1 con 7
      poly 0 con 2
      poly 3 con 7
   chain 3
      poly 3 con 9
      poly 0 con 4
      poly 1 con 9
   chain 4
      poly 4 con 1
      poly 0 con 6
      poly 5 con 1


polygon id="polygon xxx" class ="decagon"
girth class="polygon_xxx_link_y chain_zzz chain_length_3"
   path class="gline"
   path class="gfill"


how to fix identifiers for polygons, and chains
- the polygon problem can be solved by including an identifier that is saved.
It can start with the initial index, but that may change over time as polygons
are added and deleted. It could be master polygon identifier that is incremented
each time a polygon is created, but that too would have to be saved.
- chains are a little different. They are somewhat dynamic as they change
quite a bit as polygons are added and deleted. Not sure if they would be
maintained in real time or only when producing the SVG files.
The problem comes when they are used in a .css file, you want to lock them
down. This is important for shapes like shower hooks and bottle openers.

Try this. The short ones, especially of length 1, are of little importance and
will change frequently. In general, the longer ones will either be stable or
will get longer as changes are made. So maybe existing chains get saved with
an identifier. When the chains are regenerated, the existing identifiers are
used where possible.

How would that work? Lets say you have a girih with chains identified and
you make changes to it. If a chain exists in its entirety, keep the identifier.
If chain exists as a subset of a chain, keep the identifier of the longest
subset. Work through the old chains from longest to shortest. One could free
unused identifiers, especially short ones. Provide identifiers for any
new chain without an identifier. The chain and its identifiers will have to
be saved and restored.


PLAN OF ATTACK

get something simple to work:
   build the list of connectors with midpoints
   print the list of connectors

   add to it, repeat
*/

/*
class Link { // too many similar names, very confusing
    // identifies a link in a chain
    polygonIndex; // index of tile in girih.tiles lists
    strapIndex; // index of strap in something.strap list should be same as faceID; this link moves clockwise within polygon

// problem with using polygonIndex is that polygons may be deleted and that would require renumbering all links
    constructor( polygonNumber, strapNumber) {
        this.polygonIndex = polygonNumber;
        this.strapIndex = strapNumber;
    }
}

....within tile
    //polygon
    //connectors
         connectorId// ... this can be the index into the array
         externalLinkCWlink // normal out
         externalLinkCCWlink // normal in ... should not need 
         X // use point??
         Y
         chainID

        addConnector( x, y..point?.., id) { // is this a constructor since it is mostly invariant
            this.connectorId = id
            this.x = x;
            this.y = y;
*/

IKRS.Chain = function( id, classStr) {

    IKRS.Object.call( this);

    this.chainID = id // number, index into chains[]
    this.classStr = "Chain_"+ id // SVG class string
    this.links = [] // array of link
    this.isLoop = false;
};

IKRS.Chain.prototype.addSVGClass = function( className) {
    this.classStr = this.classStr + className
}

IKRS.Chain.prototype.setSVGClass = function( className) {
    this.classStr = className
}

IKRS.Chain.prototype.addLink = function( link) {
    this.links.push( link)
}

IKRS.Chain.prototype.markLoop = function() {
    this.isLoop = true;
}

IKRS.Chain.prototype.unmarkLoop = function() {
    this.isLoop = false;
}

/*
IKRS.Chain.prototype.findChainForLink = function( link) {
    for all chains
       for all links in chain
          if link matches link in chain
             return chain number
    return
}
*/

function findSharedConnector(x,y) { // returns with a list of connectors at the same coordinates
    var connectors = []
    for (var i=0; i<tiles.length; i++) {
        conns = tiles[i].connectors.length;
        for (var j=0; j<conns.length; j++) {
/*
            if (cons[j].x === x && cons[j].y === y) { // may should be using point and its primatives to accept close enough
                connectors.push( {"polygon": tiles[i].polygonID, "connector": cons[j].connectorID});
            }
//ALT
*/
            if( conns[j].point.inRange( point, IKRS.Girih.EPSILON)) {
                connectors.push( {"polygon": tiles[i].polygonID, "connector": cons[j].connectorID});
            }
        }
    }
    return connectors;
}


IKRS.Chain.prototype.toString = function() {
    var chainStr = "Chain " + this.chainID + " (" + this.classStr + ") " + this.links.length + " links"
    if (this.isLoop) {
        chainStr += " looping";
    }
    chainStr += " [";
    var preamble = "";
    for (var i=0; i< this.links.length; i++) {
        chainStr += preamble + this.links[ i].polygonIndex +","+ this.links[ i].connectorIndex;
        preamble = ", ";
    }
    return chainStr + "]";
}
