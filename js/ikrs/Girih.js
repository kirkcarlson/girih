/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2020-02-20 Kirk Carlson added tileTypes array and logic to find adjacent with angles
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 * @date 2020-05-11 Kirk Carlson (restructured globals in changing from old object structure)
 **/


class GirihClass {
    constructor () {
        // Add tiles and chains
        this._tiles = [];
        this._chains = [];
    }

    get chains() {
        return this._chains;
    }

    get tiles() {
        return this._tiles;
    }

    addTile( tile ) {
        this._tiles.push( tile );
    }


    addChain( chain ) {
        this._chains.push( chain );
    }


    deleteAllChains() {
        this._chains = [];
    }

    getJSON = function() {
        return JSON.stringify( _minimizeTiles( this._tiles));
    }
};


_minimizeTiles = function ( tiles) {
    // returns an array of mimimized file objects that is the essence of the passed tile array object

    mimimizedTiles = []
    // for each tile
    for (i = 0; i<tiles.length; i++) {
        // get the essense of the tile position
        var tileType = tiles [i].tileType;
        var size =     tiles [i].size;
        var x =        Girih.round(tiles [i].position.x, 3);
        var y =        Girih.round(tiles [i].position.y, 3);
        var angle =    Girih.round(tiles [i].angle, 6); //angle is small number so more digits needed

        mimimizedTiles.push ({ "tileType": tileType,
                    "size": size,
                    "x": x,
                    "y": y,
                    "angle": angle
                  });
    }
    return mimimizedTiles
}



GirihClass.prototype.setTilesJSON = function( jsonFile) {
    // file is a json file with minimal information about tiles

    var tiles = JSON.parse (jsonFile); // gets an array of simplified tile objects
    if ( !Array.isArray( tiles)) {
    }
    for (var i=0; i < tiles.length; i++) {
        var tileType = tiles [i].tileType;
        var size =     tiles [i].size;
        var position = new Point2( tiles[i].x, tiles[i].y); // fills out point methods
        var angle =    tiles [i].angle;
        var tile = undefined;
        if (tileType === undefined) {
            console.log( "JSON file format not specifying tile type")
            return
        }
        switch (tileType) {
        case (Girih.TILE_TYPE.DECAGON):
            tile = new Decagon( size, position, angle) // fills polygon methods
            break;
        case (Girih.TILE_TYPE.IRREGULAR_HEXAGON):
            tile = new IrregularHexagon( size, position, angle) // fills polygon methods
            break;
        case (Girih.TILE_TYPE.PENTAGON):
            tile = new Pentagon( size, position, angle) // fills polygon methods
            break;
        case (Girih.TILE_TYPE.RHOMBUS):
            tile = new Rhombus( size, position, angle) // fills polygon methods
            break;
        case (Girih.TILE_TYPE.PENROSE_RHOMBUS):
            tile = new PenroseRhombus( size, position, angle) // fills polygon methods
            break;
        case (Girih.TILE_TYPE.BOW_TIE):
            tile = new BowTie( size, position, angle) // fills polygon methods
            break;
        default:
            console.log("unexpected tile type")
            break;
        }
        if (tile !== undefined) {
            girihCanvasHandler.addTile( tile );
        }
    }
}


GirihClass.prototype.buildAllConnectors = function() {
    console.log ('build the connectors');
    console.log("Number of tiles:"+ this.tiles.length)
    for (var i=0; i<this.tiles.length; i++) { // all tiles
        tile = this.tiles[i];
        tile.connectors = []; // clear any existing connectors on the tile
        for (var j=0; j<tile.polygon.vertices.length; j++) { // all sides of each tile
            var edge = tile.polygon.getEdgeAt( j);
            var midpoint = new Point2 ((edge.pointA.x + edge.pointB.x)/2,
                                            (edge.pointA.y + edge.pointB.y)/2);
            var connector = new Connector( j, midpoint);
            tile.connectors.push( connector);
        }
    }

    var DEBUG = false;
    // print out the connections
    if ( DEBUG) {
        for (var i=0; i<this.tiles.length; i++) {
            connectors = this.tiles[i].connectors;
            for (var j=0; j<connectors.length; j++) {
                console.log ("polygon=:"+ i + " connector:"+ j + " " + connectors[j].toString())
            }
        }
    }
}


GirihClass.prototype.findConnections = function() {
    console.log ('find the connections');
    // find a minimum distance to check in detail (about two decagon diameters)
    if (this.tiles.length == 0) {
        return;
    }
    var bigRadius = Girih.TILE_FACES[ Girih.TILE_TYPE.DECAGON][0].radialCoefficient * this.tiles[0].size; // radius of decagon
    var fineDistance = 2.1 * bigRadius



    // find connectors at the same position
    for (var i=0; i<this.tiles.length; i++) {
        var tileI = this.tiles[i];
        var connectors = tileI.connectors;
        for (var j=0; j<connectors.length; j++) {
            var point = connectors[j].point;
            var startK = i;
            var startL = j+1;
            var lowX =  tileI.position.x - fineDistance
            var highX = tileI.position.x + fineDistance
            var lowY =  tileI.position.y - fineDistance
            var highY = tileI.position.y + fineDistance
            if (j === connectors.length - 1) {
                startL = 0
                startK = i+1
            }
            for (var k=startK; k<this.tiles.length; k++) {
                var tileK = this.tiles[k];
                if (tileK.position.x > lowX && tileK.position.x < highX &&
                    tileK.position.y > lowY && tileK.position.y < highY) {

                    for (var l=startL; l<tileK.connectors.length; l++) {
                        if (point.inRange( tileK.connectors[l].point, Girih.EPSILON)) {
                            // ensure that a third connector is not shared
                            if (connectors[j].isShared()) {
                                throw " connector is already shared: "+ i +","+ j +" "+ k +","+ l;
                            } else if (tileK.connectors[l].isShared()) {
                                throw " shared connector is already shared: "+ k +","+ l;
                            } else {
                            // mark both connectors as shared
                                connectors[j].sharedConnectorLink = new Link (k, l);
                                tileK.connectors[l].sharedConnectorLink = new Link (i, j);
                            }
                        }
                    }
                }
                startL = 0
            }
        }
    } //find connectors loop
}


GirihClass.prototype.walkChain = function( tileIndex, connectorIndex, startConnector, chainNumber, CW) {
    var tile = this.tiles[ tileIndex]; // (tail)
    var connector = startConnector;
    // create a new chain
    var chain = new Chain( chainNumber);
    // while connector on traversed link is shared and not looping
    connector.setChainID( CW, chainNumber);
    var startLink = new Link ( tileIndex, connectorIndex); // (tail)
    connector = tile.connectors[ connector.getInternalLink( CW, tile.tileType)]; // (head)
    var looping = false;
    while (connector.isShared() && !looping) { //
        // add link to chain
        connector.setChainID( !CW, chainNumber);
        var link = new Link( tileIndex, connector.headLink( CW, tile.tileType));
        chain.addLink( link);

        // move to the adjacent polygon and connector
        tileIndex = connector.sharedConnectorLink.polygonIndex;
        tile = this.tiles[ tileIndex];
        connector = tile.connectors[ connector.sharedConnectorLink.connectorIndex]; // (tail)
        CW = !CW // flip transverse direction every polygon

        // verify that connector is not on another chain (tail)
        if (connector.isOnChain( CW)) {
            if (connector.getChainID(CW) === chainNumber) {
                looping = true;
                chain.markLoop();
            } else {
                throw ' connector has chain ' + connector.toString() + (CW?" CW":" CCW");
            }
        } else {
            connector.setChainID( CW, chainNumber);
            connector = tile.connectors[ connector.getInternalLink( CW, tile.tileType)]; // (head)
        }
    }

    if (!connector.isShared() ) { // not looping, i.e., last link of chain
        var link = new Link( tileIndex, connector.headLink( CW, tile.tileType));
        chain.addLink( link);
        connector.setChainID( !CW, chainNumber);
    }
    this.addChain( chain);
}


GirihClass.prototype.findAllChains = function() {
    //find all of the chains in the design and list them
    // a object should start with the girihCanvasHandler, but code is written for the chain class
    // this function walks through all of the connectors on each tile... a fairly high level function
    // not a Chain level function

    console.log ('find all chains');
    // for all connectors in the figure
    var chainNumber = 0;
    this.deleteAllChains();

    // check all tiles for unshared connectors (begin of non-looping chains)
    for (var i=0; i<this.tiles.length; i++) {
        var tile = this.tiles[i];
        for( var j=0; j<tile.connectors.length; j++) {
            var connector = tile.connectors[j]; // (tail)
            // if the connector is not shared
            if ( !connector.isShared()) { //starting tail!
                // for both cw and ccw directions
                for (var k=0; k<2; k++) {
                    var CW = [ true, false ] [ k ];
                    var startLink = new Link ( i, j); // (tail)
                    // reset tile and connector because changed within the loop
                    // verify that connector is not on another chain (tail)
                    if ( !connector.isOnChain( CW)) {
                        this.walkChain( i, j, tile.connectors[j], chainNumber, CW)
                        chainNumber = chainNumber + 1;
                    }
                } //done walking in either direction
            } //else connnector shared
        }
    }

    // check all tiles for unchained connectors (begin of looping chains)
    for (var i=0; i<this.tiles.length; i++) {
        tile = this.tiles[ i]; // (tail)
        for( var j=0; j<tile.connectors.length; j++) {
            connector = tile.connectors[j]; // (tail)
            for (var k=0; k<2; k++) { // check both CW and CCW
                var CW = [ true, false ] [ k ];
                // if the connector is already on a chain
                if ( !connector.isOnChain( CW)) { //starting tail!
                    this.walkChain( i, j, tile.connectors[j], chainNumber, CW)
                    chainNumber = chainNumber + 1;
                }
            }
        }
    }

    // select the color for each chain (gray for single link chains, black and white reserved)
    for (var i=0; i<this.chains.length; i++) {
        var chain = this.chains[i];
        if( girihCanvasHandler.drawProperties.drawStrappingType === "random") {
            if (chain.links.length === 1) {
                chain.fillColor = "#e0e0e0"; // light gray
            } else {
                // stay away from white and black, 16 values top and bottom
                // white is normal background color
                // black is reserved for chain selection
                chain.fillColor = "rgba(" +
                        (64+ Math.round( Math.random()*255-64-16 )) + "," +
                        (64+ Math.round( Math.random()*255-64-16 )) + "," +
                        (64+ Math.round( Math.random()*255-64-16 )) + "," +
                        "1)";
            }
        } else {
           chain.fillColor = girihCanvasHandler.drawProperties.strappingFillColor;
        }
    }

    var DEBUG = false;
    if (DEBUG) {
        for (var i=0; i<girihCanvasHandler.girih.chains.length; i++) {
            var chain = girihCanvasHandler.girih.chains[i];
            if (chain.links.length > 1) {
                //console.log (chain.toString());
                console.log ("Chain "+ i + " links:"+ chain.links.length);
            }
        }
    }
}

SVG_DECIMALS=  3; // here for the forward reference

const Girih = { // an object with various global defines
    // not exactly the best way to declare globals...
    SVG_DECIMALS:                SVG_DECIMALS,

    PI_TENTHS:                  Math.PI/10, // 18 degrees
    MINIMAL_ANGLE:              Math.PI/10, // 18 degrees
    EPSILON:                    2.0e-3,
    DEFAULT_EDGE_LENGTH:        58,


    // the TILE_TYPE defines the types of tiles supported
    TILE_TYPE:  {
        UNKNOWN:            -1,
        DECAGON:            0,
        PENTAGON:           1,
        IRREGULAR_HEXAGON:  2,
        GIRIH_HEXAGON:      2,
        RHOMBUS:            3,
        BOW_TIE:            4,
        // This is not part of the actual girih tile set!
        PENROSE_RHOMBUS:    5,
    },


    // the TILE_TYPE_NAMES are used in some outouts requiring tile type names
    // order corresponds to TILE_TYPE above
    TILE_TYPE_NAMES:  [
        "decagon",
        "pentagon",
        "hexagon",
        "rhombus",
        "bow_tie",
        "penrose_rhombus"
    ],

    // the Faces describe the angles and lengths assocated with each face of a tile
    // order corresponds to TILE_TYPE above
    TILE_FACES:  [
        Decagon.getFaces(),
        Pentagon.getFaces(),
        IrregularHexagon.getFaces(),
        Rhombus.getFaces(),
        BowTie.getFaces(),
        PenroseRhombus.getFaces(),
    ],


    // possiblePositions define the possible orientations of tiles for insertion
    // the following index definitions are into the possiblePositions array (hard coded).
    POSSIBLES_INDEX: {
        DECAGON:          0,
        PENTAGON:         1,
        GIRIH_HEXAGON:    2,
        BOW_TIE:          5,
        RHOMBUS:          8,
        PENROSE_RHOMBUS: 10
    },

    possiblePositions: [],

    degToRad:  function( deg ) {
        return deg * (Math.PI/180.0);
    },

    radToDeg: function( rad ) {
        return (rad * 180.0) / Math.PI
    },

    // round is used to limit the number of digits included in the SVG output
    round:  function( n, digits = SVG_DECIMALS) {
        // round n to the digits number of digits right of decimal point
        // n is the number to be rounded
        // digits is the number of digits
        if (digits === undefined) {
          digits = 0
        }
        var magnitude = Math.pow( 10, digits)
        return Math.round( n * magnitude) / magnitude
    }
}
Girih.possiblePositions= [
//                                   tileType, vertex number, matesWithLeftVertex
    new PossiblePosition ( Girih.TILE_TYPE.DECAGON,         0, true),
    new PossiblePosition ( Girih.TILE_TYPE.PENTAGON,        0, true),
    new PossiblePosition ( Girih.TILE_TYPE.GIRIH_HEXAGON,   2, true),
    new PossiblePosition ( Girih.TILE_TYPE.GIRIH_HEXAGON,   3, true),
    new PossiblePosition ( Girih.TILE_TYPE.GIRIH_HEXAGON,   4, true),
    new PossiblePosition ( Girih.TILE_TYPE.BOW_TIE,         2, true),
    new PossiblePosition ( Girih.TILE_TYPE.BOW_TIE,         1, true),
    new PossiblePosition ( Girih.TILE_TYPE.BOW_TIE,         0, true),
    new PossiblePosition ( Girih.TILE_TYPE.RHOMBUS,         0, true),
    new PossiblePosition ( Girih.TILE_TYPE.RHOMBUS,         1, true),
    new PossiblePosition ( Girih.TILE_TYPE.PENROSE_RHOMBUS, 0, true),
    new PossiblePosition ( Girih.TILE_TYPE.PENROSE_RHOMBUS, 1, true),
];
