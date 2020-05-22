/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @version 1.0.0
 **/

console.log(" full restart")
var girihCanvasHandler = null;
var defaultTextureImage = null;


function adjustCanvasSize () {
    var canvasPaneWidth = document.getElementById("canvasPane");
    var girihCanvas = document.getElementById("girih_canvas");
    girihCanvas.width = canvasPane.clientWidth;
    girihCanvas.height = canvasPane.clientHeight;
}


window.onresize = function () {
    adjustCanvasSize();
    redrawGirih();
}

function onLoad() {
    console.log( "onLoad")
    // adjust the size of the canvas
    adjustCanvasSize();
/*
    var w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth; // variations for cross browser support

    var h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight; // variations for cross browser support 

    var controlPaneWidth = document.getElementById("controlPane").clientWidth
    var girihCanvas = document.getElementById("girih_canvas")
    console.log("changing canvas to "+ (w-controlPaneWidth + "x" + h + "px"));
    //canvasWidth = (w - controlPaneWidth)
    //canvasHeight = h

    var canvasPaneWidth = document.getElementById("canvasPane");
    var girihCanvas = document.getElementById("girih_canvas");
    girihCanvas.width = canvasPane.clientWidth;
    girihCanvas.height = canvasPane.clientHeight;

*/
    // Load girih template image
    defaultTextureImage = new Image();
    
    defaultTextureImage.onload = function() {
	girihCanvasHandler = new GirihCanvasHandler( defaultTextureImage );
	var tileSize = Girih.DEFAULT_EDGE_LENGTH;


	// Make a test tiles
	_makeTest_Decagon( tileSize );
	_makeTest_BowTie( tileSize );
	_makeTest_Pentagon( tileSize );
	_makeTest_IrregularHexagon( tileSize );
	_makeTest_Rhombus( tileSize );
	_makeTest_PenroseRhombus( tileSize );

	// THIS DOES NOT WORK OUT (just a test)
	// _makeTest_Octagon( tileSize );
			
	girihCanvasHandler.drawOffset.setXY( 200, 200 ); 
	redrawGirih();
    };
    defaultTextureImage.src = "img/500px-Girih_tiles.Penrose_compatible_extended.png";

}


function _angle2constant( angle ) {

    var factor = Math.floor( angle/Girih.MINIMAL_ANGLE );
    var remainder = angle % Girih.MINIMAL_ANGLE;
    
    var result = "";
    if( factor == 0 ) result = "0";
    else              result = factor + "*Girih.MINIMAL_ANGLE";

    if( remainder != 0 ) {
	if( factor == 0 )        result = "" + remainder;
	else if( remainder > 0 ) result += " + " + remainder;
	else                     result += " - " + Math.abs(remainder);
    }	

    return result;
}


function _makeTest_Decagon( tileSize ) {
    // Make a test decagon
    var deca = new Decagon( tileSize, 
			    new Point2(300,300),  // position
			    0.0
			  );
    girihCanvasHandler.addTile( deca );
}


function _makeTest_BowTie( tileSize ) {
    // Make a test bow-tie
    var tie = new BowTie( tileSize,
			  new Point2(57.7319, 110.9594),  // position
			  0.0 // Girih.MINIMAL_ANGLE*6
			);
    girihCanvasHandler.addTile( tie );
}


function _makeTest_Pentagon( tileSize ) {
console.log("_makeTest_Pentagon");
    // Make a test pentagon
    var penta = new Pentagon( tileSize,
			      new Point2(479, 52),   // position
			      0.0
			    );
    girihCanvasHandler.addTile( penta );
}


function _makeTest_IrregularHexagon( tileSize ) {
console.log("_makeTest_Hexagon");
    // Make a test pentagon
    var hexa = new IrregularHexagon( tileSize,
				     new Point2(151.577, -33.4546 ), //161.1, -32.2),   // position
				     0.0
				   );
    girihCanvasHandler.addTile( hexa );
}


function _makeTest_Rhombus( tileSize ) {
console.log("_makeTest_Rhombus");
    // Make a test pentagon
    var rhomb = new Rhombus( tileSize,
			     new Point2(18.2, 328),   // position
			     0.0
			   );
    girihCanvasHandler.addTile( rhomb );
}


function _makeTest_PenroseRhombus( tileSize ) {
	var penrose = new PenroseRhombus( tileSize,
					  new Point2(276.5385,49.2873), 
					  0.0
					);
	girihCanvasHandler.addTile( penrose );
}


// THIS IS NOT PART OF A PROPER GIRIH.
function _makeTest_Octagon( tileSize ) {
    // Make a test octagon
    var octa = new Tile.Octagon( tileSize,
					new Point2(18.2+600, 328-130),   // position
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
    return false;
}

function moveLeft() {
    girihCanvasHandler.drawOffset.x += 50; 
    redrawGirih();
    return false;
}

function moveRight() {
    girihCanvasHandler.drawOffset.x -= 50;
    redrawGirih();
    return false;
}

function moveUp() {
    girihCanvasHandler.drawOffset.y += 50; 
    redrawGirih();
    return false;
}

function moveDown() {
    girihCanvasHandler.drawOffset.y -= 50;
    redrawGirih();
    return false;
}

function rotateLeft() {
    rotateByAmount( -Girih.MINIMAL_ANGLE );
    return false;
}

function rotateRight() {
    rotateByAmount( Girih.MINIMAL_ANGLE );
    return false;
}

function rotateByAmount( amount ) {

    var rotateAll = document.forms[ "rotation_form" ].elements[ "rotate_type" ].value === "all"; //true;
    var index     = girihCanvasHandler._locateSelectedTile();

    if( rotateAll ) {
        // center on the selected tile or current coordinate center as selected.. can use function?
        // center position is expressed as absolute coordinates
        var centerType = girihCanvasHandler.drawProperties.axesType;
        if (centerType === "none" || centerType === "canvas") {
            var index = girihCanvasHandler._locateSelectedTile();
            if (index !== -1) {
                tile = girihCanvasHandler.girih.tiles[ index]
                angle = tile.angle;
                center = tile.position.clone();
            } else { // tile not selected, find center of canvas
                center = new Point2( (girihCanvasHandler.canvasCenter.x -
                             girihCanvasHandler.drawOffset.x) / girihCanvasHandler.zoomFactor,
                             (girihCanvasHandler.canvasCenter.y -
                             girihCanvasHandler.drawOffset.y) / girihCanvasHandler.zoomFactor);
                angle = girihCanvasHandler.angle;
            }
        } else if (centerType === "absolute") {
            center = new Point2( 0,0);
            angle = girihCanvasHandler.angle;
        } else if (centerType === "circumcenter") {
            center = girihCanvasHandler.circumcircle.center.clone();
            angle = girihCanvasHandler.angle;
        }
        tmpCenter = center;

/*
	if( index == -1 ) {
            var tmpCenter = new Point2(
                 (girihCanvasHandler.canvasCenter.x -
                 girihCanvasHandler.drawOffset.x) / girihCanvasHandler.zoomFactor,
                 (girihCanvasHandler.canvasCenter.y -
                 girihCanvasHandler.drawOffset.y) / girihCanvasHandler.zoomFactor);
	} else {
	    var tmpCenter = girihCanvasHandler.girih.tiles[ index ].position;
	}
*/
	for( var i = 0; i < girihCanvasHandler.girih.tiles.length; i++ ) {
	    var tmpTile = girihCanvasHandler.girih.tiles[i];
	    tmpTile.position.rotate( tmpCenter, amount );
	    tmpTile.angle += amount;

	    //rotate base, inner and outer polygons
	    _rotatePolygon( tmpTile.polygon, tmpCenter, amount);
	    _rotatePolygons( tmpTile.innerTilePolygons, tmpCenter, amount);
	    _rotatePolygons( tmpTile.outerTilePolygons, tmpCenter, amount);
	}

        // not wholely right because dependent on rotation center...
        girihCanvasHandler.angle += amount;
    } else { // rotate a single tile
	if( index == -1 ) {
	    DEBUG( "No tile selected." );
	    return;
	}
        var tile = girihCanvasHandler.girih.tiles[ index ];
	tmpCenter = tile.position;
	tile.position.rotate( tmpCenter, amount );
	tile.angle += amount;

	//rotate base, inner and outer polygons
	_rotatePolygon( tile.polygon, tmpCenter, amount);
	_rotatePolygons( tile.innerTilePolygons, tmpCenter, amount);
	_rotatePolygons( tile.outerTilePolygons, tmpCenter, amount);
    }

    //DEBUG( "" + Girih.rad2deg(tile.angle) + "&deg;" );


    /*
    var first = true;
    for( var i = 0; i < girihCanvasHandler.girih.tiles.length; i++ ) {
	if( girihCanvasHandler.girih.tiles[i]._props.selected ) {
	    girihCanvasHandler.gitih.tiles[i].angle += (Girih.MINIMAL_ANGLE);	    
	    if( first )
		document.getElementById("debug").innerHTML = "" + Girih.rad2deg(girihCanvasHandler.girih.tiles[i].angle) + "&deg;";
	    first = false;
	}
    }
    */
    redrawGirih();
};


function translateTilesToNewCenter( offset ) {
    // for all tiles
    for (tile of girihCanvasHandler.girih.tiles) {
        // translate tile
        tile.position.add( offset);

        // translate base, inner and outer polygons
        tile.polygon.translate( offset);
        for (polygon of tile.innerTilePolygons) {
            polygon.translate( offset);
        }
        for (polygon of tile.outerTilePolygons) {
            polygon.translate( offset);
        }
    }
}


function _rotatePolygons( polygonArray, center, angle) {
    if (polygonArray !== undefined) {
	for (var i = 0; i < polygonArray.length; i++) {
	    _rotatePolygon( polygonArray[i], center, angle)
	}
    }
    return false;
}


function _rotatePolygon( polygon, center, angle) {
    for (var j = 0; j < polygon.vertices.length; j++) {
	polygon.vertices[j] = polygon.vertices[j].rotate(center, angle)
    }
    return false;
}


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
    return false;
};


function lessStrapWidth () {
    girihCanvasHandler.drawProperties.strappingWidth -= 0.25;
    if (girihCanvasHandler.drawProperties.strappingWidth <0)
        girihCanvasHandler.drawProperties.strappingWidth = 0;
    this.document.getElementById("strapWidth").value =
            girihCanvasHandler.drawProperties.strappingWidth;
    redrawGirih();
    return false;
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
        girihCanvasHandler.drawProperties.strappingPixelFactor = 0.25;
    this.document.getElementById("pixelFactor").value =
            girihCanvasHandler.drawProperties.strappingPixelFactor;
    redrawGirih();
};


function recenterTile() {
    var index     = girihCanvasHandler._locateSelectedTile();
    if (index != -1) {
        translateTilesToNewCenter( girihCanvasHandler.girih.tiles[ index].
                position.clone().multiplyScalar(-1 ));
        girihCanvasHandler.drawOffset = new Point2( girihCanvasHandler.canvas.width/2,
                                                    girihCanvasHandler.canvas.height/2);
        redrawGirih();
        console.log( "recenter on the selected tile");
    }
}

function recenterCanvas() {
    // current center = (canvasCenter -drawOffset)/zoomFactor
    var x = (girihCanvasHandler.canvas.width/2 - girihCanvasHandler.drawOffset.x)/
             girihCanvasHandler.zoomFactor;
    var y = (girihCanvasHandler.canvas.height/2 - girihCanvasHandler.drawOffset.y)/
             girihCanvasHandler.zoomFactor;
    translateTilesToNewCenter( new Point2( -x, -y));
    girihCanvasHandler.drawOffset = new Point2( girihCanvasHandler.canvas.width/2,
                                                girihCanvasHandler.canvas.height/2);
    redrawGirih();
    console.log( "recenter on the current canvas center");
}

function recenterCircumcenter() {
    translateTilesToNewCenter( girihCanvasHandler.circumcircle.center.clone().
            multiplyScalar(-1 ));
    girihCanvasHandler.drawOffset = new Point2( girihCanvasHandler.canvas.width/2,
                                                girihCanvasHandler.canvas.height/2);
    redrawGirih();
    console.log( "recenter on the current circumcenter");
}


/*
angle functions
        x   y
quad 1  +   +  straight angle
quad 2  -   +  180 -angle
quad 3  -   -  180 + angle
quad 4  +   -  - angle

base = 0
if x<0 base = 180
if sign x = sign y  base + angle
else base - angle

*/
function getAngle( x, y) {
    var angle = Math.atan( y/x);
    if (x < 0) {
        angle += Math.PI;
    }
    if (angle <0) {
        angle += 2* Math.PI;
    }
    return angle
}


function renumberRadially() {
    var i;
    var radTiles = [];
    var orderedTiles = [];
    console.log( "renumber the tiles radially for the current center and angle");
    i = 0;
    for ( tile of girihCanvasHandler.girih.tiles) {
        var posRadius = Math.sqrt ( tile.position.x * tile.position.x +
                                 tile.position.y * tile.position.y);
        var posAngle = getAngle( tile.position.x, tile.position.y);
        console.log( "tile["+ i +"]:"+ tile.position + " rad:" + posRadius +" ang:"+ posAngle);
        radTiles.push ( {
                          index: i,
                          radius: posRadius,
                          angle: posAngle,
                        } );
        i++;
    }

    radTiles.sort( function( a,b) {
                                    if (Math.abs(a.radius - b.radius) < .005) {
                                        return a.angle - b.angle
                                    } else {
                                        return a.radius - b.radius
                                    }
                                  }  )
    var i = 0;
    for ( radTile of radTiles) {
        orderedTiles.push( girihCanvasHandler.girih.tiles[ radTile.index ]);
        console.log( "radTiles ["+ i +"]:"+ radTile.index + " rad:" + radTile.radius +" ang:"+ radTiles[i].angle);
        i++;
    }
    girihCanvasHandler.girih.tiles = orderedTiles;
    redrawGirih();
}


function renumberTangentially() {
    var i, j, midsector, angle, radius, localAngle, midRadius, midBeam;
    var tanTiles = [];
    var orderedTiles = [];
    console.log( "renumber the tiles tangentially for the current center and angle");
    console.log( "angle:"+ girihCanvasHandler.angle);
    // figure out what sector the tile is in base on its angle
    i = 0;
    for (tile of girihCanvasHandler.girih.tiles) {
        var numberOfSectors = girihCanvasHandler.drawProperties.symmetryType;
        if (numberOfSectors === "none" || numberOfSectors === "2fold")     {
            numberOfSectors = 4;
        } else if (numberOfSectors === "5fold") {
            numberOfSectors = 5;
        } else if (numberOfSectors === "10fold") {
            numberOfSectors = 10;
        }
        // angle is the angle of the tile w.r.t. 0,0 angle 0
        angle = getAngle( tile.position.x, tile.position.y);
        // radius is the normal radius of the tile position w.r.t 0,0
        radius = Math.sqrt( tile.position.x * tile.position.x +
                            tile.position.y * tile.position.y)
        for (j=0; j< numberOfSectors; j++) {
            if (angle < (j+1)* 2* Math.PI/numberOfSectors) { // in this sector)
                midSectorAngle = (j+0.5)* 2* Math.PI/numberOfSectors;
                localAngle = angle - midSectorAngle;
                // midRadius is the radius on the mid sector line forming right angle to beam
                midRadius = radius * Math.cos( localAngle)
                // midBeam is the distance from  the mid sector line to the tile
                midBeam = radius * Math.sin( localAngle)
                girihCanvasHandler.girih.tiles[i].sector = j;
                break;
            }
        }
        tanTiles.push ( {
                          index: i,
                          midRadius: midRadius,
                          midBeam: midBeam,
                          angle: angle,
                        } );
        console.log( "index:"+ i +" sector:"+ j +" localAngle:"+ localAngle +" angle:"+ angle +" radius:"+ radius);
        i++;
    }
    tanTiles.sort( function( a,b) {
                                    if (Math.abs(a.midRadius - b.midRadius) < .005) {
                                        return a.angle - b.angle
                                    } else {
                                        return a.midRadius - b.midRadius
                                    }
                                  } )
    for ( tanTile of tanTiles) {
        orderedTiles.push( girihCanvasHandler.girih.tiles[ tanTile.index ]);
        console.log( "tanTiles ["+ i +"]:"+ tanTile.index + " rad:" + tanTile.midRadius +" beam:"+ tanTile.midBeam);
    }
    girihCanvasHandler.girih.tiles = orderedTiles;
    redrawGirih();
}


function resetAngleRight() {
    console.log( "reset the angle to the midpoint of the right side");
    girihCanvasHandler.angle = 0;
    redrawGirih();
}

function resetAngleTop() {
    console.log( "reset the angle to the midpoint of the top");
    girihCanvasHandler.angle = -Math.PI/2;
    redrawGirih();
}

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

    girihCanvasHandler.drawProperties.strappingGap          = parseFloat(document.forms["girih_form"].elements["strapGap"].value);
    girihCanvasHandler.drawProperties.strappingWidth        = parseFloat(document.forms["girih_form"].elements["strapWidth"].value);
    girihCanvasHandler.drawProperties.strappingStrokeWidth  = parseFloat(document.forms["girih_form"].elements["strapStrokeWidth"].value);
    girihCanvasHandler.drawProperties.strappingPixelFactor  = parseFloat(document.forms["girih_form"].elements["pixelFactor"].value);

    girihCanvasHandler.drawProperties.axesType          = document.forms["extras"].elements["axes"].value;
    girihCanvasHandler.drawProperties.symmetryType      = document.forms["extras"].elements["symmetry"].value;
    girihCanvasHandler.drawProperties.drawSymmetrically     = document.forms["extras"].elements["draw_symmetrically"].checked;
    girihCanvasHandler.drawProperties.drawCircumcircle      = document.forms["extras"].elements["draw_circumcircle"].checked;
    girihCanvasHandler.drawProperties.drawTileOrder         = document.forms["extras"].elements["draw_tile_order"].checked;

    // Then trigger redraw
    girihCanvasHandler.redraw();
//console.log( "strapGap: " + girihCanvasHandler.getDrawProperties().strappingGap);
//console.log( "strapWidth: " + girihCanvasHandler.getDrawProperties().strappingWidth);
//console.log( "strapStrokeWidth: " + girihCanvasHandler.getDrawProperties().strappingStrokeWidth);
//console.log( "strapPixelFactor: " + girihCanvasHandler.getDrawProperties().strappingPixelFactor);
}

function DEBUG( msg ) {
   this.document.getElementById("debug").innerHTML = msg;
}

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
	var tilesJSON = girihCanvasHandler.girih.getJSON()

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
		girihCanvasHandler.girih = new GirihClass // clear girihCanvasHandler.girih.tiles.
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
