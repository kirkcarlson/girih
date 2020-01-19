/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 
 **/


IKRS.Girih = function() {
    
    IKRS.Object.call( this );
    
    // Add tiles and chains
    this.tiles = [];
    this.chains = [];

};

IKRS.Girih.prototype.addTile = function( tile ) {
    this.tiles.push( tile );
};

IKRS.Girih.prototype.addChain = function( chain ) {
    this.chains.push( chain );
};

IKRS.Girih.prototype._minimizeTiles = function ( tiles) {
    // returns an object that is the essence of the passed tile object
    // returns an array of mimimized file objects that is the essence of the passed tile object

    obj = []
    // for each tile
    for (i = 0; i<tiles.length; i++) {
        // get the essense of the tile position
        var tileType = tiles [i].tileType;
        var size =     tiles [i].size;
        var x =        tiles [i].position.x;
        var y =        tiles [i].position.y;
        var angle =    tiles [i].angle;

        obj.push ({ "tileType": tileType,
                    "size": size,
                    "x": x,
                    "y": y,
                    "angle": angle
                  });
    }
    return obj
}

IKRS.Girih.prototype.getTilesJSON = function() {
    // returns json for the minimal information about tiles
    return JSON.stringify( this._minimizeTiles( this.tiles));
};

IKRS.Girih.prototype.setTilesJSON = function( jsonFile) {
    // file is a json file with minimal information about tiles

    var tiles = JSON.parse (jsonFile); // expected to be an array of tile objects
    if ( !Array.isArray( tiles)) {
    }
    for (var i=0; i < tiles.length; i++) {
	var tileType = tiles [i].tileType;
	var size =     tiles [i].size;
	var position = new IKRS.Point2( tiles[i].x, tiles[i].y); // fills out point methods
	var angle =    tiles [i].angle;
	var tile = undefined;
	if (tileType === undefined) {
	    console.log( "JSON file format not specifying tile type")
	    return
	}
	switch (tileType) {
	case (IKRS.Girih.TILE_TYPE_DECAGON):
	    //console.log("Decagon( size:" + size + " x:" + position.x + " y:" + position.y, " angle:" + angle)
	    tile = new IKRS.Tile.Decagon( size, position, angle) // fills polygon methods
	    break;
	case (IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON):
	    //console.log("IrregularHexagon( size:" + size + " x:" + position.x + " y:" + position.y, " angle:" + angle)
	    tile = new IKRS.Tile.IrregularHexagon( size, position, angle) // fills polygon methods
	    break;
	case (IKRS.Girih.TILE_TYPE_PENTAGON):
	    //console.log("Pentagon( size:" + size + " x:" + position.x + " y:" + position.y, " angle:" + angle)
	    tile = new IKRS.Tile.Pentagon( size, position, angle) // fills polygon methods
	    break;
	case (IKRS.Girih.TILE_TYPE_RHOMBUS):
	    //console.log("Rhombus( size:" + size + " x:" + position.x + " y:" + position.y, " angle:" + angle)
	    tile = new IKRS.Tile.Rhombus( size, position, angle) // fills polygon methods
	    break;
	case (IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS):
	    //console.log("Penrose Rhombus( size:" + size + " x:" + position.x + " y:" + position.y, " angle:" + angle)
	    tile = new IKRS.Tile.PenroseRhombus( size, position, angle) // fills polygon methods
	    break;
	case (IKRS.Girih.TILE_TYPE_BOW_TIE):
	    //console.log("Bow Tie( size:" + size + " x:" + position.x + " y:" + position.y, " angle:" + angle)
	    tile = new IKRS.Tile.BowTie( size, position, angle) // fills polygon methods
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


IKRS.Girih.prototype.findAllChains = function() {
    // for all connectors in the figure
    var chainNumber = 0;
    girihCanvasHandler.girih.chains = []; // delete existing chains
    for (var i=0; i<girihCanvasHandler.girih.tiles.length; i++) {
	var tileType = girihCanvasHandler.girih.tiles[i].tileType;
	for( var j=0; j<girihCanvasHandler.girih.tiles[i].connectors.length; j++) {
	    var tileIndex = i;
	    var tile = girihCanvasHandler.girih.tiles[ tileIndex]; // (tail)
	    var connector = tile.connectors[j]; // (tail)
	    var startLink = new IKRS.Link ( tileIndex, j); // (tail)
	    // if the connector is not shared
	    if ( !connector.isShared()) { //starting tail!
		// for both cw and ccw directions
		for (var k=0; k<2; k++) {
		    var CW = [ true, false ] [ k ];
		    // reset tile and connector because changed within the loop
		    var tileIndex = i;
		    var tile = girihCanvasHandler.girih.tiles[ tileIndex]; // (tail)
		    // verify that connector is not on another chain (tail)
		    var connector = tile.connectors[j]; // (tail)
			    if ( !connector.isOnChain( CW)) {
			// create a new chain
			var chain = new IKRS.Chain( chainNumber);
			// while connector on traversed link is shared and not looping
			connector.setChainID( CW, chainNumber);
console.log( "set first ChainID connector:" + tileIndex + "," + connector.connectorIndex + " direction:" + (CW?"CW":"CCW") + " chain:"+chainNumber)
			connector = tile.connectors[ connector.getInternalLink( CW, tile.tileType)]; // (head)
			while (connector.isShared() && !connector.isOnChain( !CW)) { // also tests looping
			    // add link to chain
			    connector.setChainID( !CW, chainNumber);
console.log( "set loop end ChainID connector:" + tileIndex + "," + connector.connectorIndex + " direction:" + (!CW?"CW":"CCW") + " chain:"+chainNumber)
			    var link = new IKRS.Link( tileIndex, connector.headLink( CW, tile.tileType));
				    chain.addLink( link);
console.log ("addLink chain:"+ chainNumber + " link:" + link.toString())
			    // move to the adjacent polygon and connector
			    tileIndex = connector.sharedConnectorLink.polygonIndex;
			    tile = girihCanvasHandler.girih.tiles[ tileIndex]
			    connector = tile.connectors[ connector.sharedConnectorLink.connectorIndex]; // (tail)
			    CW = !CW // flip transverse direction every polygon
			    // verify that connector is not on another chain (tail)
			    if (connector.isOnChain( CW)) {
				throw 'connector has chain' + connector.toString() + (CW?" CW":" CCW");
			    }
			    connector.setChainID( CW, chainNumber);
console.log( "set loop begin ChainID connector:" + tileIndex + "," + connector.connectorIndex + " direction:" + (CW?"CW":"CCW") + " chain:"+chainNumber)
			    connector = tile.connectors[ connector.getInternalLink( CW, tile.tileType)]; // (head)
			}
			if (!connector.isShared()) { // last link of chain..
			    var link = new IKRS.Link( tileIndex, connector.headLink( CW, tile.tileType));
			    chain.addLink( link);
console.log ("addLink chain:"+ chainNumber + " link:" + link.toString())
			    connector.setChainID( !CW, chainNumber);
console.log( "set last ChainID connector:" + tileIndex + "," + connector.connectorIndex + " direction:" + (!CW?"CW":"CCW") + " chain:"+chainNumber)
			}
			if (startLink.isEqual( link)) {
			    chain.markLoop();
console.log ("looping chain:"+ chainNumber)
			}
			girihCanvasHandler.girih.addChain( chain);
			chainNumber = chainNumber + 1;
		    }
		} //done walking in either direction
	    } //else connnector shared
	}
    }
}


IKRS.Girih.deg2rad = function( deg ) {
    return deg * (Math.PI/180.0);
};

IKRS.Girih.rad2deg = function( rad ) {
    return (rad * 180.0) / Math.PI
};


// 18.0 * (Math.PI/180.0);
IKRS.Girih.MINIMAL_ANGLE = IKRS.Girih.deg2rad(18.0); 

IKRS.Girih.EPSILON       = 1.0e-6;


IKRS.Girih.TILE_TYPE_UNKNOWN            = -1;
IKRS.Girih.TILE_TYPE_DECAGON            = 0;
IKRS.Girih.TILE_TYPE_PENTAGON           = 1;
IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON  = 2;
IKRS.Girih.TILE_TYPE_RHOMBUS            = 3;
IKRS.Girih.TILE_TYPE_BOW_TIE            = 4;
// This is not part of the actual girih tile set!
IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS    = 5;
IKRS.Girih.TILE_TYPE_OCTAGON            = 6;


// Prepare the tile alignment matrix:
// [ actual_tile ] x [ edge_index ] x [ successor_index ] = tile_align
IKRS.Girih.TILE_ALIGN                  = Array();

IKRS.Girih.DEFAULT_EDGE_LENGTH         = 58;

// The decagon has 10 edges
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_DECAGON ] = Array(10);
// Define adjacent tiles allowed on edge 0 of the decagon
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_DECAGON ][0] = [    
    // The decagon has only one possible alignment on the edge (10 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 104, -144), 0 ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 75, -104), 0 ),   
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 104, -89), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 71, -99), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 52, -127), 6*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 75, -89), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 61, -99), 6*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -99), 0 ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 84, -61), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 84, -116), 6*IKRS.Girih.MINIMAL_ANGLE ),
    
    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 83, -73), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 43, -101), 4*IKRS.Girih.MINIMAL_ANGLE )
];
// Note that the decagon has a 5|10-axis symmetry. All other 9 edges behave the same.
for( var i = 1; i < 10; i++ ) {
    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_DECAGON ][ i ] = [];
    for( var e = 0; e < IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_DECAGON ][0].length; e++ ) {

	var tileAlign = IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_DECAGON ][0][e].clone();
	tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, i*2*IKRS.Girih.MINIMAL_ANGLE );
	tileAlign.angle += i*2*IKRS.Girih.MINIMAL_ANGLE;
	IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_DECAGON ][ i ].push( tileAlign );

    }
}



IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENTAGON ] = Array(5);
// Define adjacent tiles allowed on edge 0 of the pentagon
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENTAGON ][0] = [  
    // The decagon 
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 122, -39.5), 0 ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 75, -24), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 88.5, 4.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 70, -22.5), 6*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 70, -56), 8*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 66.5, -12.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 61, -29), 8*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 38, -45.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 57.5, 15), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 89.5, -28.5), 8*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 61, 4), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 47, -39), 6*IKRS.Girih.MINIMAL_ANGLE )
];
// Note that the pentagon has a 5-axis symmetry. All other 4 edges behave the same.
for( var i = 1; i < 5; i++ ) {
    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENTAGON ][ i ] = [];
    for( var e = 0; e < IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENTAGON ][0].length; e++ ) {

	var tileAlign = IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENTAGON ][0][e].clone();
	tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, i*4*IKRS.Girih.MINIMAL_ANGLE );
	tileAlign.angle += i*4*IKRS.Girih.MINIMAL_ANGLE;
	IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENTAGON ][ i ].push( tileAlign );

    }
}


IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ] = Array(6);
// Define adjacent tiles allowed on edge 0 of the pentagon
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][0] = [  
    // The decagon 
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -133.5), 0 ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -84), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 64, -88.5), 0 ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -78), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 0.5, -88.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 23.5, -72.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 41.5, -72.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 65, -55), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32.5, -99), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 0.5, -55), 8*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 55, -61), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 9, -61), 2*IKRS.Girih.MINIMAL_ANGLE )
    
];
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][1] = [ 
    // The decagon 
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 136, 10.5), 0 ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 90, -4.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 104, -33.5), 0 ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 84, -5.5), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 84.5, 27.5), -4*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 81.5, -17), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 76, 0), -4*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 71.5, -43.5), -6*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 104, 0), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 52.5, 17), -4*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 75, -33), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 61, 9), -4*IKRS.Girih.MINIMAL_ANGLE )    

];
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][2] = [  
    // The decagon 
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 72, 99), 0 ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 43, 60), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 20, 82), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 40, 54.5), 0 ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 71, 43.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 29.5, 55), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 43, 44.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 52.5, 17), -4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 52.5, 71.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 0.5, 55), 8*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 11, 55), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 49, 28), 0*IKRS.Girih.MINIMAL_ANGLE )   
];
// Note that the hexagon has a 3|6-axis symmetry. All other 3 edges behave the same.
for( var e = 3; e < 6; e++ ) {
    
    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][ e ] = [];
    for( var i = 0; i < IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][ e-3 ].length; i++ ) {

	var tileAlign = IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][e-3][i].clone();
	tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, 10*IKRS.Girih.MINIMAL_ANGLE );
	tileAlign.angle += 10*IKRS.Girih.MINIMAL_ANGLE;
	if( e == 4 )  // It's a bit unprecise
	    tileAlign.position.x += 2.0;
	else
	    tileAlign.position.x += 1.0;
	IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][ e ].push( tileAlign );
	
    }
}


IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_RHOMBUS ] = Array(4);
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_RHOMBUS ][0] = [  
    // The decagon 
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -9, 116.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -9, 67), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -41, 72), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -8.5, 61), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 23, 71.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -18, 55), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 0, 55), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -41.5, 38.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -9, 82.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 23, 38.5), 8*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -32, 45), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 14, 45), 2*IKRS.Girih.MINIMAL_ANGLE )   
];
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_RHOMBUS ][1] = [  
    // The decagon 
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -113.5, -27.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -66.5, -12.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -81, 17), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -61.5, -10.5), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -61, -44.5), -4*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -57.5, 0), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -52.5, -17), 6*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -81, -17), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -49, 27.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -29, -34), 6*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -52, 16), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -38, -27), -4*IKRS.Girih.MINIMAL_ANGLE )   
];
// Note that the rhombus has a 2-axis symmetry. All other 2 edges behave the same.
for( var e = 2; e < 4; e++ ) {
    
    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_RHOMBUS ][ e ] = [];
    for( var i = 0; i < IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_RHOMBUS ][ e-2 ].length; i++ ) {

	var tileAlign = IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_RHOMBUS ][e-2][i].clone();
	tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, 10*IKRS.Girih.MINIMAL_ANGLE );
	tileAlign.angle += 10*IKRS.Girih.MINIMAL_ANGLE;
	//if( e == 4 )  // It's a bit unprecise
	//    tileAlign.position.x += 2.0;
	//else
	//    tileAlign.position.x += 1.0;
	IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_RHOMBUS ][ e ].push( tileAlign );
	
    }
}


IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ] = Array(6);
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ][0] = [  
    // The pentagon has only one possible alignment on the edge (10 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -99.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -50.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 64, -55), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -45), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 0, -55), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 41, -38), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 23, -38), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 64, -21), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 32, -65.5), 4*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 55, -28), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 9, -28), 2*IKRS.Girih.MINIMAL_ANGLE )   
];
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ][1] = [
    // The pentagon has only one possible alignment on the edge (10 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 136, 44.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 90, 29), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 104, 0), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 84.5, 27.5), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 84.5, 61.5), -4*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 81, 17), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 75.5, 34), -4*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 104, 34), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 72, -10.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 52, 51), -4*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 75, 0), -2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 62, 44), -4*IKRS.Girih.MINIMAL_ANGLE ) 
];
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ][2] = [
    // The decagon 
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -32, 99.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -3.5, 59), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 20, 82), 6*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 0, 55), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -32, 44.25), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -3.5, 44.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 11, 55), 6*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 39.5, 55), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -12, 72), 6*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -9, 28), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 29, 55), 4*IKRS.Girih.MINIMAL_ANGLE )
];

// Note that the bow tie has a 3|6-axis symmetry. All other 3 edges behave the same.
for( var e = 3; e < 6; e++ ) {
    
    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ][ e ] = [];
    for( var i = 0; i < IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ][ e-3 ].length; i++ ) {

	var tileAlign = IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ][e-3][i].clone();
	tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, 10*IKRS.Girih.MINIMAL_ANGLE );
	tileAlign.angle += 10*IKRS.Girih.MINIMAL_ANGLE;
	//if( e == 4 )  // It's a bit unprecise
	//    tileAlign.position.x += 2.0;
	//else
	//    tileAlign.position.x += 1.0;
	IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_BOW_TIE ][ e ].push( tileAlign );
	
    }
}


// Note that the bow tie has a 3|6-axis symmetry. All other 3 edges behave the same.
/*
for( var t = 3; t < 6; t++ ) {
    for( var e = 1; e < 6; e++ ) {
	IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][ t-3 ] = [];
	for( var i = 0; i < IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][t].length; i++ ) {

	    var tileAlign = IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][0][e].clone();
	    tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, e*4*IKRS.Girih.MINIMAL_ANGLE );
	    tileAlign.angle += e*4*IKRS.Girih.MINIMAL_ANGLE;
	    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON ][ e ].push( tileAlign );

	}
    }
}
*/

IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS ] = Array(4);
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS ][0] = [  
    // The decagon -9, 116.5  ........ (-15, -10)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -24, 106.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -24, 57), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -56, 62), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -23.5, 51), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 8, 61.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -32, 45), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -15, 45), 4*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -56.5, 28.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -24, 72.5), 4*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( 8, 28.5), 8*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -47, 35), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -1, 35), 2*IKRS.Girih.MINIMAL_ANGLE )   
];
IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS ][1] = [  
    // The decagon -113.5, -27.5 ......... (32, -45)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_DECAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -81.5, -72.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The pentagon has only one possible alignment on the edge (5 times the same)
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENTAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -52.5, -32.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    // The irregular hexagon
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -81, -17), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -48.5, -27.5), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -81, -17), 2*IKRS.Girih.MINIMAL_ANGLE ),
    // The rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -52.5, -16.5), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -38, -27), 8*IKRS.Girih.MINIMAL_ANGLE ),
    // The bow tie
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -61.5, -44), 2*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -61, 10), 6*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_BOW_TIE, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -9, -27), 8*IKRS.Girih.MINIMAL_ANGLE ),

    // The Penrose-Rhombus
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -59, 0), 0*IKRS.Girih.MINIMAL_ANGLE ),
    new IKRS.TileAlign( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, IKRS.Girih.DEFAULT_EDGE_LENGTH, new IKRS.Point2( -20, -27), -2*IKRS.Girih.MINIMAL_ANGLE )   
];
// Note that the rhombus has a 2-axis symmetry. All other 2 edges behave the same.
for( var e = 2; e < 4; e++ ) {
    
    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS ][ e ] = [];
    for( var i = 0; i < IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS ][ e-2 ].length; i++ ) {

	var tileAlign = IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS ][e-2][i].clone();
	tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, 10*IKRS.Girih.MINIMAL_ANGLE );
	tileAlign.angle += 10*IKRS.Girih.MINIMAL_ANGLE;
	//if( e == 4 )  // It's a bit unprecise
	//    tileAlign.position.x += 2.0;
	//else
	//    tileAlign.position.x += 1.0;
	IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS ][ e ].push( tileAlign );
	
    }
}

/*
// Note that the decagon has a 5|10-axis symmetry. All other 9 edges behave the same.
for( var t = 0; t < IKRS.Girih.TILE_ALIGN.length; t++ ) {
    for( var e = 1; e < IKRS.Girih.EDGE_COUNT[t]; e++ ) {
	IKRS.Girih.TILE_ALIGN[ t ][ i ] = [];
	for( var j = 0; j < IKRS.Girih.TILE_ALIGN[ t ][0].length; j++ ) {
	    
	    var tileAlign = IKRS.Girih.TILE_ALIGN[ t ][0][j].clone();
	    tileAlign.position.rotate( IKRS.Point2.ZERO_POINT, e*2*IKRS.Girih.MINIMAL_ANGLE );
	    tileAlign.angle += e*2*IKRS.Girih.MINIMAL_ANGLE;
	    IKRS.Girih.TILE_ALIGN[ IKRS.Girih.TILE_TYPE_DECAGON ][ e ].push( tileAlign );
	    
	}
    }
}
*/


// round is used to limit the number of digits included in the SVG output
IKRS.Girih.round = function( n, digits) {
    // round n to the digits number of digits right of decimal point
    // n is the number to be rounded
    // digits is the number of digits
    if (digits === undefined) {
      digits = 0
    }
    var magnitude = Math.pow( 10, digits)
    return Math.round( n * magnitude) / magnitude
}

IKRS.Girih.SVG_PRECISION = 3;
const svgBackground = "";
const fontStyle = "font:10pt normal Helvetica, Ariel, sans-serif;";

IKRS.Girih.prototype.toSVG = function( options,
                                       polygonStyle,
                                       buffer
                                     ) {

    var returnBuffer = false;
    if( typeof buffer == "undefined" || !buffer ) {
        buffer = [];
        returnBuffer = true;
    }

    if (polygonStyle === undefined) {
        polygonStyle = ""
    }
    if (fontStyle === undefined) {
        fontStyle = "font:10pt normal Helvetica, Ariel, sans-serif;"
    }
    if (svgBackground != undefined && svgBackground !== "") {
        var background = '<rect width="100%" height="100%" fill="' + svgBackground + '"/>';
    } else {
        var background = ""
    }
    var highWater = new IKRS.BoundingBox3()

    var oldIndent = options.indent;
    options.indent += "    ";
    for( var i = 0; i < this.tiles.length; i++ ) {
        var boundingBox = new IKRS.BoundingBox3()
        this.tiles[i].toSVG( options, "", buffer, boundingBox );

        highWater.evaluatePoint(boundingBox)
    }

    options.indent = oldIndent;


var svgPreamble = `<svg id="girih-svg" xmlns="http://www.w3.org/2000/svg" version="1.1"
    height="` + IKRS.Girih.round( highWater.getHeight(), IKRS.Girih.SVG_PRECISION) + `"
    width="` + IKRS.Girih.round( highWater.getWidth(), IKRS.Girih.SVG_PRECISION) + `">
<style>
path {
    fill:none;
    vector-effect:non-scaling-stroke;
}
polygon {
    ` + polygonStyle + `
}
text {
    fill:black;
    ` + fontStyle + `
}
</style>

<g transform="matrix(1 0 0 1 ` +
    IKRS.Girih.round( -highWater.getXMin(), IKRS.Girih.SVG_PRECISION) + ` ` +
    IKRS.Girih.round( -highWater.getYMin(), IKRS.Girih.SVG_PRECISION) + `)">
`
svgTrailer = `
</g>
<script>
/* for any runtime JavaScript to control or animate the girih */
/* This must be at the end of the file to execute after the girih DOM is built*/
</script>
</svg>`

    // put the pieces together
    buffer.unshift( svgPreamble)
    buffer.push( svgTrailer)
    return buffer
}

IKRS.Girih.prototype.constructor = IKRS.Girih;
