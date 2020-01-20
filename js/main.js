/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @version 1.0.0
 **/

var girihCanvasHandler = null;
var defaultTextureImage = null;


function onLoad() {
    // adjust the size of the canvas
    var w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth; // variations for cross browser support

    var h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight; // variations for cross browser support 

    var controlPaneWidth = document.getElementById("controlPane").clientWidth
    var girihCanvas = document.getElementById("girih_canvas")
    console.log("changing canvas to "+ (w-controlPaneWidth + "x" + h + "px"));
    //girihCanvas.width = (w - controlPaneWidth) +"px"
    //girihCanvas.height = h +"px"


    // Load girih template image
    defaultTextureImage = new Image();
    
    defaultTextureImage.onload = function() {
	girihCanvasHandler = new IKRS.GirihCanvasHandler( defaultTextureImage );
	var tileSize = IKRS.Girih.DEFAULT_EDGE_LENGTH;


	// Make a test penrose-rhombus
	var penrose = new IKRS.Tile.PenroseRhombus( tileSize,
						    new IKRS.Point2(276.5385,49.2873), 
						    0.0
					  );
	girihCanvasHandler.addTile( penrose );
	_makeTest_Decagon_BowTie( tileSize );
	_makeTest_Pentagon( tileSize );
	_makeTest_IrregularHexagon( tileSize );
	_makeTest_Rhombus( tileSize );

	// THIS DOES NOT WORK OUT (just a test)
	// _makeTest_Octagon( tileSize );
			
	girihCanvasHandler.drawOffset.setXY( 200, 200 ); 
	redrawGirih();
    };
    defaultTextureImage.src = "img/500px-Girih_tiles.Penrose_compatible_extended.png";

}

function _displayTileAlign( centerTile,
			    referenceTile
			  ) {

    var differencePoint = new IKRS.Point2( referenceTile.position.x - centerTile.position.x,
					   referenceTile.position.y - centerTile.position.y
					 );
    var totalAngle      = centerTile.angle + referenceTile.angle;
    DEBUG( "[tileAlign] new IKRS.TileAlign( IKRS.Girih.DEFAULT_EDGE_LENGTH,\n" + 
	   "                                new IKRS.Point2( " + differencePoint.x + ", " + differencePoint.y + "),\n" +
	   "                                " + _angle2constant(totalAngle) + " );\n"
	 );
}

function _angle2constant( angle ) {

    var factor = Math.floor( angle/IKRS.Girih.MINIMAL_ANGLE );
    var remainder = angle % IKRS.Girih.MINIMAL_ANGLE;
    
    var result = "";
    if( factor == 0 ) result = "0";
    else              result = factor + "*IKRS.Girih.MINIMAL_ANGLE";

    if( remainder != 0 ) {
	if( factor == 0 )        result = "" + remainder;
	else if( remainder > 0 ) result += " + " + remainder;
	else                     result += " - " + Math.abs(remainder);
    }	

    return result;
}

function _makeTest_Decagon_BowTie( tileSize ) {
console.log("_makeTest_Decagon_BowTie");
    // Make a test decagon
    var deca = new IKRS.Tile.Decagon( tileSize, 
				      new IKRS.Point2(300,300),  // position
				      0.0
				    );
    // Make a test bow-tie
    var tieA = new IKRS.Tile.BowTie( tileSize,
				     new IKRS.Point2(333, 200),  // position
				     0.0
				  );
    var tieB = new IKRS.Tile.BowTie( tileSize,
				     new IKRS.Point2(386, 238),  // position
				     IKRS.Girih.MINIMAL_ANGLE*2
				   );
    var tieC = new IKRS.Tile.BowTie( tileSize,
				     new IKRS.Point2(386, 238),  // position
				     IKRS.Girih.MINIMAL_ANGLE*2
				   );
    var tie = new IKRS.Tile.BowTie( tileSize,
				    new IKRS.Point2(385, 184),  // position
				    0 // IKRS.Girih.MINIMAL_ANGLE*6
				  );
    //tie.position.add( new IKRS.Point2(200, 200) );
    tie.position.setXY( 57.7319, 110.9594 ); // 100, 150 );
    girihCanvasHandler.addTile( deca );
    girihCanvasHandler.addTile( tie );
    
    _displayTileAlign( deca, tie );
}

function _makeTest_Pentagon( tileSize ) {
console.log("_makeTest_Pentagon");
    // Make a test pentagon
    var penta = new IKRS.Tile.Pentagon( tileSize,
					new IKRS.Point2(479, 52),   // position
					0.0
				      );
    girihCanvasHandler.addTile( penta );
}

function _makeTest_IrregularHexagon( tileSize ) {
console.log("_makeTest_Hextagon");
    // Make a test pentagon
    var hexa = new IKRS.Tile.IrregularHexagon( tileSize,
						new IKRS.Point2(151.577, -33.4546 ), //161.1, -32.2),   // position
						0.0
					      );
    girihCanvasHandler.addTile( hexa );
}

function _makeTest_Rhombus( tileSize ) {
console.log("_makeTest_Rhombus");
    // Make a test pentagon
    var rhomb = new IKRS.Tile.Rhombus( tileSize,
					new IKRS.Point2(18.2, 328),   // position
					0.0
				      );
    girihCanvasHandler.addTile( rhomb );
}

// THIS IS NOT PART OF A PROPER GIRIH.
function _makeTest_Octagon( tileSize ) {
    // Make a test octagon
    var octa = new IKRS.Tile.Octagon( tileSize,
					new IKRS.Point2(18.2+600, 328-130),   // position
					0.0
				      );
    girihCanvasHandler.addTile( octa );
}

function increaseZoom() {
    girihCanvasHandler.zoomFactor *= 1.2;
    redrawGirih();
}

function decreaseZoom() {
    girihCanvasHandler.zoomFactor /= 1.2;
    redrawGirih();
}

function moveLeft() {
    girihCanvasHandler.drawOffset.x += 50; 
    redrawGirih();
}

function moveRight() {
    girihCanvasHandler.drawOffset.x -= 50;
    redrawGirih();
}

function moveUp() {
    girihCanvasHandler.drawOffset.y += 50; 
    redrawGirih();
}

function moveDown() {
    girihCanvasHandler.drawOffset.y -= 50;
    redrawGirih();
}

function rotateLeft() {
    rotateByAmount( -IKRS.Girih.MINIMAL_ANGLE );
}

function rotateRight() {
    rotateByAmount( IKRS.Girih.MINIMAL_ANGLE );
}

function rotateByAmount( amount ) {

    var index     = girihCanvasHandler._locateSelectedTile();
    if( index == -1 ) {
	DEBUG( "No tile selected." );
	return;
    }

    var tile      = girihCanvasHandler.girih.tiles[ index ];
    var rotateAll = document.forms[ "rotation_form" ].elements[ "rotate_all" ].checked; //true;

    if( rotateAll ) {
	for( var i = 0; i < girihCanvasHandler.girih.tiles.length; i++ ) {
	    var tmpTile = girihCanvasHandler.girih.tiles[i];
	    tmpTile.position.rotate( tile.position, amount ); 
	    tmpTile.angle += amount; 
	}
    } else {
	tile.angle += amount; 
    } 
    
    DEBUG( "" + IKRS.Girih.rad2deg(tile.angle) + "&deg;" );
	

    /*
    var first = true;
    for( var i = 0; i < girihCanvasHandler.girih.tiles.length; i++ ) {
	if( girihCanvasHandler.girih.tiles[i]._props.selected ) {
	    girihCanvasHandler.gitih.tiles[i].angle += (IKRS.Girih.MINIMAL_ANGLE);	    
	    if( first )
		document.getElementById("debug").innerHTML = "" + IKRS.Girih.rad2deg(girihCanvasHandler.girih.tiles[i].angle) + "&deg;";
	    first = false;
	}
    }
    */
    redrawGirih();
}

function redrawGirih() {
    
    // Fetch the form settings and apply them to the handler's draw options
    girihCanvasHandler.getDrawProperties().drawBoxes             = document.forms["girih_form"].elements["draw_boxes"].checked;
    girihCanvasHandler.getDrawProperties().drawOutlines          = document.forms["girih_form"].elements["draw_outlines"].checked;
    girihCanvasHandler.getDrawProperties().drawTextures          = document.forms["girih_form"].elements["draw_textures"].checked;
    girihCanvasHandler.getDrawProperties().drawInnerPolygons     = document.forms["girih_form"].elements["draw_inner_polygons"].checked;
    girihCanvasHandler.getDrawProperties().drawStrapping         = document.forms["girih_form"].elements["draw_strapping"].checked;
    girihCanvasHandler.getDrawProperties().useFancyStrapping     = document.forms["girih_form"].elements["use_fancy_strapping"].checked;

    girihCanvasHandler.getDrawProperties().outerRandomColorFill      = document.forms["girih_form"].elements["outer_random_color_fill"].checked;
    girihCanvasHandler.getDrawProperties().innerRandomColorFill      = document.forms["girih_form"].elements["inner_random_color_fill"].checked;

    girihCanvasHandler.getProperties().allowPenroseTile          = document.forms["girih_form"].elements["allow_penrose_tile"].checked;    
    //girihCanvasHandler.getProperties().drawPenroseCenterPolygon  = document.forms["girih_form"].elements["draw_penrose_center_polygon"].checked;

  
    // Then trigger redraw
    girihCanvasHandler.redraw();
}

/*
function DEBUG( msg ) {
    this.document.getElementById("debug").innerHTML = msg;
}
*/

window.addEventListener( "load", onLoad );



function exportSVG() {
    var svg = girihCanvasHandler.getSVG( { indent: "" }, // options
					 null            // style
				       );
				      
    
    downloadFilename = document.getElementById( "downloadFilename");
    saveAs(
	new Blob([svg], {type : "image/svg+xml"}),
	(downloadFilename.value || downloadFilename.placeholder) + ".svg"
    );
    return false;
}

function exportTiles() {
    var tilesJSON = girihCanvasHandler.girih.getTilesJSON()

    downloadFilename = document.getElementById( "downloadFilename");
    saveAs(
        new Blob([tilesJSON], {type : "application/json"}),
        (downloadFilename.value || downloadFilename.placeholder) + ".json"
    );
    console.log ("exportTiles fired!");

    return false;
}

//TEST SUPPORT



//END TEST SUPPORT

class ObjectCounter {
    arrays;
    arrayElements;
    functions;
    objects;
    other;
    all;

    constructor () {
         this.arrays = 0;
         this.arrayElements = 0;
         this.functions = 0;
         this.objects = 0;
         this.other = 0;
         this.all = 0;
    }
}


function importTiles(e) {
    var file = e.target.files[0];
    if (!file) {
	console.log( "importTiles bad file!")
	return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
	var contents = e.target.result;
	girihCanvasHandler.girih = new IKRS.Girih // not sure if other parameters are lost by doing this, but want to clear girihCanvasHandler.girih.tiles.
	girihCanvasHandler.girih.setTilesJSON( contents);
	redrawGirih();
    };
    reader.readAsText(file);
}

/* now the exercise is to walk the saved object to find the base polygons tiles.
   Create the new base polygon tile (and internal polygons) and add to a new object array
   see if the created object has similar structure as the original
function something () {
    findStructure("", existingGirihObject, 0);
    break structure of existingGirihObject into a savable object
    convert saveable object to JSON file
    convert JSON file to loadedGirihObject
    converted loadedGirihObject to filledOutGirihObject
    findStructure("", filledOutGirihObject, 0);

function findStructure ( obj, limit) {
    for each object in given object
        findStructure( obj1, limit)
    for each array in given object
        sumarize # of elements and structure of first element
        what is in each element, what is in the overall elements ... min max total

}
*/



//function used in debugging and exploring objects
// this walks down an object tree and lists the locations of all functions
// these functions must be replaced when the JSON is loaded....
function findFunctions( basename, obj, count) {
    var entryCount = count.all
    count.all = count.all + 1;
    if (typeof obj === "object") {
        if (Array.isArray( obj)) {
            //console.log( "is an array")
            count.arrays = count.arrays + 1;
            for (var i=0; i< obj.length; i++) {
                //console.log( "findFunctions (" + basename + "[" + i + "]")
                count = findFunctions ( basename + "[" + i + "]", obj[ i], count)
                count.arrayElements = count.arrayElements + 1;
            }
        } else {
            //console.log( "is an object")
            for (var key in obj) {
                //console.log( "findFunctions (" + basename + "." + key)
                count = findFunctions( basename + "." + key, obj[ key], count)
                count.objects = count.objects + 1;
            }
        }
    } else if (typeof obj === "function") {
        count.functions = count.functions + 1;
        //console.log( basename +": function")
    } else {
        count.other = count.other + 1;
        //console.log( "is something else: " + typeof obj);
    }
    if (entryCount === 0) {
        console.log( "  processed "+ count.all + " items, arrays:" + count.arrays +
                " array elements:" + count.arrayElements + " objects:" + count.objects +
                " functions:" + count.functions + " other:" + count.other)
    }
    return count
};

window.onload = function(){
    document.getElementById("importButton").addEventListener('change', importTiles, false);
};
