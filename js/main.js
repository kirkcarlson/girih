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
    /*
let's try to figure this out
Propotion = (centerx -drawOffset1)/width of image)
propotion =  (centerx -drawOffset2)/(1.2* width of image)

1.2* (centerx -drawOffset1) = (centerx -drawOffset2)
(1.2-1)* centerx = drawOffset1 -drawOffset2
drawOffset2 = drawOffset1 -.2*centerx

really need the image width, not the screen width
try again

point is to stay where it is
point is determined by its position and drawOffset
in zoom postion will move from origin by 1.2 * position
draw offset should decrease to compensate

second problem is that the origin move from the center as well
this distance is the positional coordinate of the center
This is tied to the zoom factor, so
drawOffset + center position*zoom factor = canvas center

for starting out
center position = canvas center -draw offset
zooming in:
center position = (canvas center -drawOffset) /zoom factor

solving for change in draw offset
center position1 = (canvas center -drawOffset1) /zoom factor1
center position2 = (canvas center -drawOffset2) /zoom factor2
(canvas center -drawOffset2) /zoom factor2 =  (canvas center -drawOffset1) /zoom factor
let zoom factor 1 be 1 and zoom factor 2 be 1.2



position1 + drawOffset2 = center
1.2* postion1 + x * drawOffset1 = center
x = (center - 1.2* position1) /drawOffset1
*/
    var index     = girihCanvasHandler._locateSelectedTile();
    if( index == -1 ) { // no tile selected, use center
        var ax = (girihCanvasHandler.canvasCenter.x - girihCanvasHandler.drawOffset.x ) / girihCanvasHandler.zoomFactor;
        girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x  - 0.2 * girihCanvasHandler.zoomFactor * ax
        var ay = (girihCanvasHandler.canvasCenter.y - girihCanvasHandler.drawOffset.y ) / girihCanvasHandler.zoomFactor
        girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y  - 0.2 * girihCanvasHandler.zoomFactor * ay

        girihCanvasHandler.zoomFactor = 1.2 * girihCanvasHandler.zoomFactor
/*
        var factor = girihCanvasHandler.canvasCenter.x - 1.2* tmpCenter.x;
        girihCanvasHandler.drawOffset.x = factor * girihCanvasHandler.drawOffset.x;
        factor = girihCanvasHandler.canvasCenter.y - 1.2* tmpCenter.y;
        girihCanvasHandler.drawOffset.y = factor * girihCanvasHandler.drawOffset.y;
*/
    } else {
        //girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x / 1.2;
        //             girihCanvasHandler.canvasCenter.x -
        //girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x / 1.2;
        //girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y / 1.2;

        //girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x -
        //                                  0.2* girihCanvasHandler.canvasCenter.x;
        //girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y -
        //                                  0.2* girihCanvasHandler.canvasCenter.y;

        girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x  -
                0.2 * girihCanvasHandler.zoomFactor * girihCanvasHandler.girih.tiles[ index].position.x;
        girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y  -
                0.2 * girihCanvasHandler.zoomFactor * girihCanvasHandler.girih.tiles[ index].position.y;
        girihCanvasHandler.zoomFactor *= 1.2;

//        var ax = (girihCanvasHandler.canvasCenter.x - girihCanvasHandler.drawOffset.x ) / girihCanvasHandler.zoomFactor;
//        girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x -
//                                          0.2* girihCanvasHandler.canvasCenter.x;
//        girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y -
//                                          0.2* girihCanvasHandler.canvasCenter.y;
    }
console.log( "zoom: " + girihCanvasHandler.zoomFactor)
    redrawGirih();
}

function decreaseZoom() {
    /*
let's try to figure this out
Propotion = (centerx -drawOffset1)/width of image)
propotion =  (centerx -drawOffset2)/(width of image/1.2)

(centerx -drawOffset1)/1.2 = (centerx -drawOffset2)
(1/1.2-1)* centerx = drawOffset1 -drawOffset2
(1/1.2-1.2/1.2)* centerx = drawOffset1 -drawOffset2
(-0.2/1.2)* centerx = drawOffset1 -drawOffset2
drawOffset2 = drawOffset1 +.2/1.2*centerx
*/
    var index     = girihCanvasHandler._locateSelectedTile();
    if( index == -1 ) { // no tile selected, use center
        var ax = (girihCanvasHandler.canvasCenter.x - girihCanvasHandler.drawOffset.x ) / girihCanvasHandler.zoomFactor;
        girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x  + 0.2/1.2 * girihCanvasHandler.zoomFactor * ax
        var ay = (girihCanvasHandler.canvasCenter.y - girihCanvasHandler.drawOffset.y ) / girihCanvasHandler.zoomFactor
        girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y  + 0.2/1.2 * girihCanvasHandler.zoomFactor * ay

        girihCanvasHandler.zoomFactor = girihCanvasHandler.zoomFactor / 1.2

console.log( "zoom: " + girihCanvasHandler.zoomFactor)


    } else {
        girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x  +
                0.2/1.2 * girihCanvasHandler.zoomFactor * girihCanvasHandler.girih.tiles[ index].position.x;
        girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y  +
                0.2/1.2 * girihCanvasHandler.zoomFactor * girihCanvasHandler.girih.tiles[ index].position.y;

        girihCanvasHandler.zoomFactor /= 1.2;

        //girihCanvasHandler.drawOffset.x = girihCanvasHandler.drawOffset.x +
        //                                  0.167* girihCanvasHandler.canvasCenter.x;
        //girihCanvasHandler.drawOffset.y = girihCanvasHandler.drawOffset.y +
        //                                  0.167* girihCanvasHandler.canvasCenter.y;
    }
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

    var rotateAll = document.forms[ "rotation_form" ].elements[ "rotate_type" ].value === "all"; //true;
    var index     = girihCanvasHandler._locateSelectedTile();

    if( rotateAll ) {

	if( index == -1 ) {
            var tmpCenter = new IKRS.Point2(
                 (girihCanvasHandler.canvasCenter.x -
                 girihCanvasHandler.drawOffset.x) / girihCanvasHandler.zoomFactor,
                 (girihCanvasHandler.canvasCenter.y -
                 girihCanvasHandler.drawOffset.y) / girihCanvasHandler.zoomFactor);
console.log( "canvasCenter="+ girihCanvasHandler.canvasCenter.toString() +" drawOffset="+ girihCanvasHandler.drawOffset.toString() +" tempCenter="+ tmpCenter.toString())

	    for( var i = 0; i < girihCanvasHandler.girih.tiles.length; i++ ) {
	        var tmpTile = girihCanvasHandler.girih.tiles[i];
	        tmpTile.position.rotate( tmpCenter, amount );
	        tmpTile.angle += amount;
	    }
	} else { // tile selected

            var tile = girihCanvasHandler.girih.tiles[ index ];

	    for( var i = 0; i < girihCanvasHandler.girih.tiles.length; i++ ) {
	        var tmpTile = girihCanvasHandler.girih.tiles[i];
	        tmpTile.position.rotate( tile.position, amount ); 
	        tmpTile.angle += amount; 
	    }
	}
    } else { // rotate a single tile
	if( index == -1 ) {
	    DEBUG( "No tile selected." );
	    return;
	}
        var tile = girihCanvasHandler.girih.tiles[ index ];
	tile.angle += amount;
    }

    //DEBUG( "" + IKRS.Girih.rad2deg(tile.angle) + "&deg;" );


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
};

function moreStrapGap () {
    girihCanvasHandler.drawProperties.strappingGap += 0.25;
    this.document.getElementById("strapGap").value =
           girihCanvasHandler.drawProperties.strappingGap;
    redrawGirih();
    return false;
};

function lessStrapGap () {
    girihCanvasHandler.drawProperties.strappingGap -= 0.25;
    if (girihCanvasHandler.drawProperties.strappingGap <0)
        girihCanvasHandler.drawProperties.strappingGap = 0;
    this.document.getElementById("strapGap").value =
            girihCanvasHandler.drawProperties.strappingGap;
    redrawGirih();
    return false;
};


function moreStrapWidth () {
    girihCanvasHandler.drawProperties.strappingWidth += 0.25;
    this.document.getElementById("strapWidth").value =
            girihCanvasHandler.drawProperties.strappingWidth;
    redrawGirih();
};


function lessStrapWidth () {
    girihCanvasHandler.drawProperties.strappingWidth -= 0.25;
    if (girihCanvasHandler.drawProperties.strappingWidth <0)
        girihCanvasHandler.drawProperties.strappingWidth = 0;
    this.document.getElementById("strapWidth").value =
            girihCanvasHandler.drawProperties.strappingWidth;
    redrawGirih();
};


function moreStrapStrokeWidth () {
    girihCanvasHandler.drawProperties.strappingStrokeWidth += 0.25;
    this.document.getElementById("strapStrokeWidth").value =
            girihCanvasHandler.drawProperties.strappingStrokeWidth;
    redrawGirih();
};


function lessStrapStrokeWidth () {
    girihCanvasHandler.drawProperties.strappingStrokeWidth -= 0.25;
    if (girihCanvasHandler.drawProperties.strappingStrokeWidth <0)
        girihCanvasHandler.drawProperties.strappingStrokeWidth = 0;
    this.document.getElementById("strapStrokeWidth").value =
            girihCanvasHandler.drawProperties.strappingStrokeWidth;
    redrawGirih();
};


function morePixelFactor () {
    girihCanvasHandler.drawProperties.strappingPixelFactor += 0.25;
    this.document.getElementById("pixelFactor").value =
            girihCanvasHandler.drawProperties.strappingPixelFactor;
    redrawGirih();
};


function lessPixelFactor () {
    girihCanvasHandler.drawProperties.strappingPixelFactor -= 0.25;
    if (girihCanvasHandler.drawProperties.strappingPixelFactor <0.25)
        girihCanvasHandler.drawProperties.strappingStrokeWidth = 0.25;
    this.document.getElementById("strapPixelFactor").value =
            girihCanvasHandler.drawProperties.strappingPixelFactor;
    redrawGirih();
};


console.log( "mSG: " + typeof moreStrapGap);
console.log( "mSG: " + moreStrapGap.toString());
function redrawGirih() {

    // Fetch the form settings and apply them to the handler's draw options
    girihCanvasHandler.getDrawProperties().drawBoxes             = document.forms["girih_form"].elements["draw_boxes"].checked;
    girihCanvasHandler.getDrawProperties().drawOutlines          = document.forms["girih_form"].elements["draw_outlines"].checked;

    girihCanvasHandler.getDrawProperties().drawTextures          = document.forms["girih_form"].elements["draw_textures"].checked;
    // custom/default texture_type affects only the image file used

    girihCanvasHandler.getDrawProperties().drawPolygonColor      = document.forms["girih_form"].elements["draw_polygon_color"].checked;
    girihCanvasHandler.getDrawProperties().polygonColorType      = document.forms["girih_form"].elements["polygon_color_type"].value;

    girihCanvasHandler.getDrawProperties().drawInnerPolygons     = document.forms["girih_form"].elements["draw_inner_polygons"].checked;
    girihCanvasHandler.getDrawProperties().outerRandomColorFill  = document.forms["girih_form"].elements["outer_random_color_fill"].checked;
    girihCanvasHandler.getDrawProperties().innerRandomColorFill  = document.forms["girih_form"].elements["inner_random_color_fill"].checked;

    girihCanvasHandler.getDrawProperties().drawStrapping         = document.forms["girih_form"].elements["draw_strapping"].checked;
    girihCanvasHandler.getDrawProperties().drawStrappingType     = document.forms["girih_form"].elements["draw_strapping_type"].value;


    girihCanvasHandler.getProperties().allowPenroseTile          = document.forms["girih_form"].elements["allow_penrose_tile"].checked;
    //girihCanvasHandler.getProperties().drawPenroseCenterPolygon  = document.forms["girih_form"].elements["draw_penrose_center_polygon"].checked;

    this.document.getElementById("strapGap").value =
            girihCanvasHandler.drawProperties.strappingGap;
    this.document.getElementById("strapWidth").value =
            girihCanvasHandler.drawProperties.strappingWidth;
    this.document.getElementById("strapStrokeWidth").value =
            girihCanvasHandler.drawProperties.strappingStrokeWidth;
    this.document.getElementById("pixelFactor").value =
            girihCanvasHandler.drawProperties.strappingPixelFactor;

    girihCanvasHandler.getDrawProperties().strappingGap          = parseFloat(document.forms["girih_form"].elements["strapGap"].value);
    girihCanvasHandler.getDrawProperties().strappingWidth        = parseFloat(document.forms["girih_form"].elements["strapWidth"].value);
    girihCanvasHandler.getDrawProperties().strappingStrokeWidth  = parseFloat(document.forms["girih_form"].elements["strapStrokeWidth"].value);
    girihCanvasHandler.getDrawProperties().strappingPixelFactor  = parseFloat(document.forms["girih_form"].elements["pixelFactor"].value);

    // Then trigger redraw
    girihCanvasHandler.redraw();
console.log( "strapGap: " + girihCanvasHandler.getDrawProperties().strappingGap);
console.log( "strapWidth: " + girihCanvasHandler.getDrawProperties().strappingWidth);
console.log( "strapStrokeWidth: " + girihCanvasHandler.getDrawProperties().strappingStrokeWidth);
console.log( "strapPixelFactor: " + girihCanvasHandler.getDrawProperties().strappingPixelFactor);
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
console.log( "mSG: " + typeof moreStrapGap);
