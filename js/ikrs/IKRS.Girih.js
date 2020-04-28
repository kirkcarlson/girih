/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2020-02-20 Kirk Carlson added tileTypes array and logic to find adjacent with angles
 
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

IKRS.Girih.prototype.deleteAllChains = function() {
    this.chains = [];
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
	var x =        IKRS.round(tiles [i].position.x, 3);
	var y =        IKRS.round(tiles [i].position.y, 3);
	var angle =    IKRS.round(tiles [i].angle, 6); //angle is small number so more digits needed

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


IKRS.Girih.prototype.buildConnectors = function( tiles) {
    console.log ('build the connectors');
    console.log("Number of tiles:"+ tiles.length)
    for (var i=0; i<tiles.length; i++) { // all tiles
	tiles[i].connectors = []; // clear any existing connectors
	for (var j=0; j<tiles[i].polygon.vertices.length; j++) { // all sides of each tile
	    var edge = tiles[i].polygon.getEdgeAt( j);
	    var midpoint = new IKRS.Point2 ((edge.pointA.x + edge.pointB.x)/2, (edge.pointA.y + edge.pointB.y)/2);
console.log ("connector "+ j + ": "+ edge.pointA +" -- "+ edge.pointB +" == "+ midpoint)
	    // ignoring pan, zoom and overall rotation for the midpoints
	    //midpoint.rotate( IKRS.Point2.ZERO_POINT, tiles[i].angle ).addXY( tiles[i].position.x, tiles[i].position.y);
	    var connector = new IKRS.Connector( j, midpoint);
	    tiles[i].connectors.push( connector);
	}
    }

    var DEBUG = false;
    // print out the connections
    if ( DEBUG) {
	for (var i=0; i<tiles.length; i++) {
	    connectors = tiles[i].connectors;
	    for (var j=0; j<connectors.length; j++) {
		console.log ("polygon=:"+ i + " connector:"+ j + " " + connectors[j].toString())
	    }
	}
    }
}


IKRS.Girih.prototype.findConnections = function( tiles, chains) {
    console.log ('find the connections');
    // find connectors at the same position
    for (var i=0; i<tiles.length; i++) {
	connectors = tiles[i].connectors;
	for (var j=0; j<connectors.length; j++) {
	    var point = connectors[j].point;
	    var startK = i;
	    var startL = j+1;
	    if (j === connectors.length - 1) {
		startL = 0
		startK = i+1
	    }
	    for (var k=startK; k<tiles.length; k++) {
		for (var l=startL; l<tiles[k].connectors.length; l++) {
/*
console.log("x,y:"+
IKRS.round( point.x, IKRS.Girih.SVG_PRECISION) + "," +
IKRS.round( point.y, IKRS.Girih.SVG_PRECISION) + " polyA:" + i + "-"+ j + " polyB:" + k + "-" + l +"x,y:" +
IKRS.round( tiles[k].connectors[l].point.x, IKRS.Girih.SVG_PRECISION)  + "," +
IKRS.round( tiles[k].connectors[l].point.y, IKRS.Girih.SVG_PRECISION));
*/
		    if (point.inRange( tiles[k].connectors[l].point, IKRS.Girih.EPSILON)) {
/*
			console.log("Match x,y:"+
IKRS.round( point.x, IKRS.Girih.SVG_PRECISION) + "," +
IKRS.round( point.y, IKRS.Girih.SVG_PRECISION) + " " +
IKRS.round( tiles[k].connectors[l].point.x, IKRS.Girih.SVG_PRECISION) + "," +
IKRS.round( tiles[k].connectors[l].point.y, IKRS.Girih.SVG_PRECISION) + " " + " polyA:" + i + "-"+ j + " polyB:" + k + "-" + l);
*/
			console.log("common connectors: "+ + i + ","+ j + " " + k + "," + l);
			// ensure that a third connector is not shared
			if (connectors[j].isShared()) {
			    throw " connector is already shared: "+ i +","+ j +" "+ k +","+ l;
			} else if (tiles[k].connectors[l].isShared()) {
			    throw " shared connector is already shared: "+ k +","+ l;
			} else {
			// mark both connectors as shared
			    connectors[j].setShared( new IKRS.Link (k, l));
			    tiles[k].connectors[l].setShared( new IKRS.Link (i, j));
			}
		    }
		}
		startL = 0
	    }
	}
    } //find connectors loop
}


IKRS.Girih.prototype.walkChain = function( tiles, tileIndex, connectorIndex, startConnector, chainNumber, CW) {
    var tile = tiles[ tileIndex]; // (tail)
    var connector = startConnector;
    // create a new chain
    var chain = new IKRS.Chain( chainNumber);
    // while connector on traversed link is shared and not looping
    connector.setChainID( CW, chainNumber);
    startLink = new IKRS.Link ( tileIndex, connectorIndex); // (tail)
//console.log( "set first ChainID connector:" + tileIndex + "," + connector.connectorIndex + " direction:" + (CW?"CW":"CCW") + " chain:"+chainNumber)
    connector = tile.connectors[ connector.getInternalLink( CW, tile.tileType)]; // (head)
    var looping = false
    while (connector.isShared() && !looping) { //
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
// this is ok in a loop if the connector chainID CW === chainNumber
	    if (connector.getChainID(CW) === chainNumber) {
		looping = true;
		chain.markLoop();
	    } else {
		throw ' connector has chain ' + connector.toString() + (CW?" CW":" CCW");
	    }
	} else {
	    connector.setChainID( CW, chainNumber);
console.log( "set loop begin ChainID connector:" + tileIndex + "," + connector.connectorIndex + " direction:" + (CW?"CW":"CCW") + " chain:"+chainNumber)
	    connector = tile.connectors[ connector.getInternalLink( CW, tile.tileType)]; // (head)
	}
    }
    if (!connector.isShared() ) { // last link of chain..
	var link = new IKRS.Link( tileIndex, connector.headLink( CW, tile.tileType));
	chain.addLink( link);
//console.log ("addLink chain:"+ chainNumber + " link:" + link.toString())
	connector.setChainID( !CW, chainNumber);
//console.log( "set last ChainID connector:" + tileIndex + "," + connector.connectorIndex + " direction:" + (!CW?"CW":"CCW") + " chain:"+chainNumber)
    } else if (looping) {
	//var link = new IKRS.Link( tileIndex, connector.headLink( CW, tile.tileType));
	//chain.addLink( link);
//console.log( "set last ChainID connector for loop:" + tileIndex + "," + connector.connectorIndex + " direction:" + (!CW?"CW":"CCW") + " chain:"+chainNumber)
	////chain.markLoop();
	// mark the connector in the first tile
//	connector = tile.connectors[ connector.sharedConnectorLink.connectorIndex]; // (tail)
//	connector.setChainID( CW, chainNumber);
    }
    chain.setSVGClass( "Chain_"+ chainNumber +" chainLength_" + chain.links.length);
    if (looping) {
	chain.addSVGClass( "loopedChain");
    }
    girihCanvasHandler.girih.addChain( chain);
}


IKRS.Girih.prototype.findAllChains = function( tiles) {
    //find all of the chains in the design and list them
    // a object should start with the girihCanvasHandler, but code is written for the chain class
    // this function walks through all of the connectors on each tile... a fairly high level function
    // not a Chain level function

    console.log ('find all chains');
    // for all connectors in the figure
    var chainNumber = 0;
    girihCanvasHandler.girih.deleteAllChains();

    // loop looking for unshared connectors (begin of non-looping chains)
    var tiles = girihCanvasHandler.girih.tiles;
    for (var i=0; i<tiles.length; i++) {
	var tile = tiles[i];
	for( var j=0; j<tile.connectors.length; j++) {
	    var connector = tile.connectors[j]; // (tail)
	    // if the connector is not shared
	    if ( !connector.isShared()) { //starting tail!
		// for both cw and ccw directions
		for (var k=0; k<2; k++) {
		    var CW = [ true, false ] [ k ];
		    var startLink = new IKRS.Link ( i, j); // (tail)
		    // reset tile and connector because changed within the loop
		    // verify that connector is not on another chain (tail)
		    if ( !connector.isOnChain( CW)) {
			this.walkChain( tiles, i, j, tile.connectors[j], chainNumber, CW)
			chainNumber = chainNumber + 1;
		    }
		} //done walking in either direction
	    } //else connnector shared
	}
    }

    // loop looking for unchained connectors (begin of looping chains)
    for (var i=0; i<tiles.length; i++) {
	tile = tiles[ i]; // (tail)
	for( var j=0; j<tile.connectors.length; j++) {
	    connector = tile.connectors[j]; // (tail)
	    for (var k=0; k<2; k++) { // check both CW and CCW
		var CW = [ true, false ] [ k ];
	        // if the connector is already on a chain
	        if ( !connector.isOnChain( CW)) { //starting tail!
		    this.walkChain( tiles, i, j, tile.connectors[j], chainNumber, CW)
		    chainNumber = chainNumber + 1;
	        }
	    }
	}
    }

    // select the color for each chain (gray for single link chains, black and white reserved)
    for (var i=0; i<girihCanvasHandler.girih.chains.length; i++) {
	var chain = girihCanvasHandler.girih.chains[i];
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

    var DEBUG = true;
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


IKRS.Girih.deg2rad = function( deg ) {
    return deg * (Math.PI/180.0);
};

IKRS.Girih.rad2deg = function( rad ) {
    return (rad * 180.0) / Math.PI
};


// 18.0 * (Math.PI/180.0);
IKRS.Girih.MINIMAL_ANGLE = IKRS.Girih.deg2rad(18.0); 
IKRS.Girih.EPSILON       = 1.0e-3;
IKRS.Girih.DEFAULT_EDGE_LENGTH          = 58;


IKRS.Girih.TILE_TYPE_UNKNOWN            = -1;
IKRS.Girih.TILE_TYPE_DECAGON            = 0;
IKRS.Girih.TILE_TYPE_PENTAGON           = 1;
IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON  = 2;
IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON      = 2;
IKRS.Girih.TILE_TYPE_RHOMBUS            = 3;
IKRS.Girih.TILE_TYPE_BOW_TIE            = 4;
// This is not part of the actual girih tile set!
IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS    = 5;
//IKRS.Girih.TILE_TYPE_OCTAGON            = 6;

IKRS.Girih.TILE_FACES                   = Array(6);
IKRS.Girih.TILE_FACES [ IKRS.Girih.TILE_TYPE_DECAGON] =         IKRS.Tile.Decagon.getFaces();
IKRS.Girih.TILE_FACES [ IKRS.Girih.TILE_TYPE_PENTAGON] =        IKRS.Tile.Pentagon.getFaces();
IKRS.Girih.TILE_FACES [ IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON] =   IKRS.Tile.IrregularHexagon.getFaces();
IKRS.Girih.TILE_FACES [ IKRS.Girih.TILE_TYPE_RHOMBUS] =         IKRS.Tile.Rhombus.getFaces();
IKRS.Girih.TILE_FACES [ IKRS.Girih.TILE_TYPE_BOW_TIE] =         IKRS.Tile.BowTie.getFaces();
IKRS.Girih.TILE_FACES [ IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS] = IKRS.Tile.PenroseRhombus.getFaces();

//const svgBackground = "";

IKRS.Girih.prototype.constructor = IKRS.Girih;
