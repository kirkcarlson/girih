/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @version 1.0.0
 **/



IKRS.GirihCanvasHandler = function( imageObject ) {

    IKRS.Object.call( this );

    var width = 1024;
    var height = 768;
    this.canvasCenter              = new IKRS.Point2( width/2, height/2);

    this.imageObject               = imageObject;

    // this should be responsive to the size of the browser window
    this.canvasWidth               = width;
    this.canvasHeight              = height;

    this.canvas                    = document.getElementById("girih_canvas");
    // Make a back-reference for event handling
    this.canvas.girihCanvasHandler = this;
    this.context                   = this.canvas.getContext( "2d" );

    this.drawOffset                = this.canvasCenter.clone();
    this.zoomFactor                = 1.0;

    this.turtlePosition            = new IKRS.Point2( 0,0); // position of image cursor
    this.turtleAngle               = 0;                     // angle of image cursor

    this.girih                     = new IKRS.Girih(); // describes a set of tiles

    this.drawProperties            = { drawCoordinateSystem:       true,  // Currently not editable (no UI component)
				       drawBoxes:                  false,
				       drawOutlines:               true,
				       drawTextures:               true,
				       drawInnerPolygons:          true,
				       drawStrapping:              true,
				       drawStrappingType:          "basic", // can be "basic", "fancy", "random"
				       polygonColorType:           "default", // can be "random"
				       innerRandomColorFill:       false, //true
				       outerRandomColorFill:       false,
				       backgroundColor:            "#ffffff",

				       polygonStrokeColor:         "#00003f",
				       polygonSelectedStrokeColor: "#e80088",
				       polygonFillColor:           "transparent",
				       hexagonFillColor:           "#bce897",
				       decagonFillColor:           "#97dce8",
				       pentagonFillColor:          "#e8e297",
				       bowTieFillColor:            "#e89798",
				       rhombusFillColor:           "#979be8",
				       penroseRhombusFillColor:    "#ff837e",
				       simpleStrappingStrokeColor: "#00A800",
				       strappingStrokeColor:       "#000000",
				       strappingFillColor:         "#ffff00",
				       boundingBoxColor:           "#c8c8ff",
				       strappingWidth:             3, //in pixels
				       strappingStrokeWidth:       0.5, // in pixels
				       strappingGap:               1, // in pixels
				       strappingPixelFactor:       7 // ratio of line width pixels to CSS pixels
				     };
    this.properties                = { allowPenroseTile:           true,
				       drawPenroseCenterPolygon:   true
				     };

    this.lastTileCount = 0;     // counter to determine when to recompute connectors and chains
    this.lastDrawStrappingType = "";     // counter to determine when to recompute connectors and chains
    this.indent = ''; // SVG indent string
    this.eol = '\n'; // SVG end of line string

    this.adjacentTileOptionPointer = 0;

    this.canvas.onmousedown        = this.mouseDownHandler;
    this.canvas.onmouseup          = this.mouseUpHandler;
    this.canvas.onmousemove        = this.mouseMoveHandler;


    // Install a mouse wheel listener
    if( this.canvas.addEventListener ) {
	// For Mozilla
	this.canvas.addEventListener( "DOMMouseScroll", this.mouseWheelHandler, false );
    } else {
	// IE
	this.canvas.onmousewheel = mouseWheelHandler;
	document.onmousewheel = mouseWheelHandler;
    }

    window.addEventListener( "keydown",   this.keyDownHandler,   false );
};


//**** GLOBALS AND CONSTANTS USED BY VECTOR GRAPHIC METHODS ********************************
IKRS.GirihCanvasHandler.piTenths = 2 * Math.PI /20; // basic Girih angle = 18 degrees
IKRS.GirihCanvasHandler.lineSpacing = 1//5;
IKRS.GirihCanvasHandler.gap = 0.5;
IKRS.GirihCanvasHandler.lineWidth = 0//0.5;

IKRS.GirihCanvasHandler.prototype.SVG_PRECISION = 3;
const fontStyle = "font:10pt normal Helvetica, Ariel, sans-serif;";


//just to make it easier to reference within this module
var piTenths    = IKRS.GirihCanvasHandler.piTenths;


//**** MOUSE HANDLER METHODS ************************************

IKRS.GirihCanvasHandler.prototype._translateMouseEventToRelativePosition = function( parent,
										     e ) {
    var rect = parent.getBoundingClientRect();
    var left = e.clientX - rect.left - parent.clientLeft + parent.scrollLeft;
    var top  = e.clientY - rect.top  - parent.clientTop  + parent.scrollTop;

    // Add draw offset :)
    var relX = (left - this.drawOffset.x) / this.zoomFactor;
    var relY = (top  - this.drawOffset.y) / this.zoomFactor;

    return new IKRS.Point2( relX, relY );
};


IKRS.GirihCanvasHandler.prototype.mouseWheelHandler = function( e ) {

    var delta = 0;
    if (!e) {                 // For IE.
	e = window.event;
    }
    if (e.wheelDelta) {     // IE/Opera.
	delta = e.wheelDelta/120;
    } else if (e.detail) {  // Mozilla case.
	// In Mozilla, sign of delta is different than in IE.
	// Also, delta is multiple of 3.
	delta = -e.detail/3;
    }
    // If delta is nonzero, handle it.
    // Basically, delta is now positive if wheel was scrolled up,
    // and negative, if wheel was scrolled down.
    if (delta) {

	if( delta < 0 ) {
	    this.girihCanvasHandler.decreaseZoomFactor( true ); // redraw
	} else {
	    this.girihCanvasHandler.increaseZoomFactor( true ); // redraw
	}
    }
    // Prevent default actions caused by mouse wheel.
    // That might be ugly, but we handle scrolls somehow
    // anyway, so don't bother here..
    if( e.preventDefault ) {
	e.preventDefault();
    }
    e.returnValue = false;
};


IKRS.GirihCanvasHandler.prototype.mouseDownHandler = function( e ) {

    var point     = this.girihCanvasHandler._translateMouseEventToRelativePosition( this, e );

    var tileIndex = this.girihCanvasHandler._locateTileAtPoint( point );
    if( tileIndex == -1 ) {
	return;  // Hover over blank space
    }

    // Adjacent tile displayed?
    var tile             = null;
    var adjacentTile     = null;
    var hoveredTileIndex = this.girihCanvasHandler._locateHoveredTile();
    if( hoveredTileIndex != -1 ) {
	tile            = this.girihCanvasHandler.girih.tiles[ hoveredTileIndex ];

	// Check if cursor is not directly on center
	if( tile.position.distanceTo(point) > 5 ) {

	    var tileBounds   = tile.computeBounds();

	    adjacentTile = this.girihCanvasHandler._resolveCurrentAdjacentTilePreset(   tile,
											tile._props.highlightedEdgeIndex,
										    );
	}
    }

    if( adjacentTile) {
	this.girihCanvasHandler._performAddCurrentAdjacentPresetTile();
    } else {
	// No adjacent tile found for this location
	//  -> select tile

	// Clear all selection
	this.girihCanvasHandler._clearSelection();

	// Set the tile's 'selected' state
	this.girihCanvasHandler.girih.tiles[tileIndex]._props.selected = true;
	// DEBUG( "[mouseDown] tileIndex=" + tileIndex + ", selected=" + his.girihCanvasHandler.tiles[tileIndex]._props.selected );
	this.girihCanvasHandler.redraw();
    }
};


IKRS.GirihCanvasHandler.prototype.mouseUpHandler = function( e ) {

};


IKRS.GirihCanvasHandler.prototype.mouseMoveHandler = function( e ) {

    // Find old hovered tile
    var oldHoverTileIndex       = this.girihCanvasHandler._locateHoveredTile();
    var oldHoverTile            = null;
    var oldHighlightedEdgeIndex = -1;
    if( oldHoverTileIndex != -1 ) {
	oldHoverTile = this.girihCanvasHandler.girih.tiles[ oldHoverTileIndex ];  // May be null!
	oldHighlightedEdgeIndex = oldHoverTile._props.highlightedEdgeIndex;
    }

    // Locate the edge the mouse hovers over
    var point     = this.girihCanvasHandler._translateMouseEventToRelativePosition( this, e );
    //window.alert( "[mouseMoved] translated point: " + point.toString() );

    this.girihCanvasHandler._clearHovered();

    // THIS MUST BE THOUGHT ABOUT ONCE MORE
    var hoverTileIndex = this.girihCanvasHandler._locateTileAtPoint( point );
    if( hoverTileIndex == -1 ) {
	DEBUG( "[mouseMoved] CLEARED hoverTileIndex=" + hoverTileIndex );
	if( oldHoverTileIndex != hoverTileIndex ) {
	    this.girihCanvasHandler.redraw();
	}
	return;
    }
    var hoverTile      = this.girihCanvasHandler.girih.tiles[ hoverTileIndex ];

    hoverTile._props.hovered = true;  // may be the same object

    // Try to find the point from the center of the edge, with
    // a radius of half the edge's length
    var highlightedEdgeIndex = hoverTile.locateEdgeAtPoint( point,
							    hoverTile.size/2.0 * this.girihCanvasHandler.zoomFactor
							  );

    if (hoverTileIndex == undefined) { console.log( "hooverTileIndex is undefined") };
    if (highlightedEdgeIndex == undefined) { console.log( "highlightedEdgeIndex is undefined") };
    if (hoverTile.position == undefined) { console.log( "hoverTile.position is undefined")};
    if (hoverTile.connectors[highlightedEdgeIndex] == undefined) { console.log( "hoverTile.connectors{ highlightedEdge] is undefined")};
    DEBUG( "[mouseMoved] hoverTileIndex=" + hoverTileIndex +
           ", highlightedEdgeIndex=" + highlightedEdgeIndex +
           ", hoverTile.position=" + hoverTile.position.toString() +
           ", connector.position=" + hoverTile.connectors[ highlightedEdgeIndex].point.toString()
//           ", hoverTile.angle=" + _angle2constant(hoverTile.angle)
         );

    hoverTile._props.highlightedEdgeIndex = highlightedEdgeIndex;
    // Were there any changes at all?
    if( oldHoverTileIndex != hoverTileIndex || oldHighlightedEdgeIndex != highlightedEdgeIndex ) {
	this.girihCanvasHandler.redraw();
    }
};


IKRS.GirihCanvasHandler.prototype._locateTileAtPoint = function( point ) {
    for( var i = this.girih.tiles.length-1; i >= 0; i-- ) {

	// Ignore Penrose-Tile?
//if( typeof this.girih.tiles[i].tileType !== "undefined") console.log(".tileType:" + this.girih.tiles[i].tileType);
	if( this.girih.tiles[i].tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS &&
            !this.getProperties().allowPenroseTile ) {
	    continue;
	}

//if( typeof this.girih.tiles[i].containsPoint(point) !== "undefined") console.log(".containsPoint:" + this.girih.tiles[i].containsPoint(point));
	if( this.girih.tiles[i].containsPoint(point) ) {
	    return i;
	}
    }

    // Not found
    return -1;
};


IKRS.GirihCanvasHandler.prototype._locateSelectedTile = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
	if( this.girih.tiles[i]._props.selected ) {
	    return i;
	}
    }
    // Not found
    return -1;
};

IKRS.GirihCanvasHandler.prototype._locateHoveredTile = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
	if( this.girih.tiles[i]._props.hovered ) {
	    return i;
	}
    }
    return -1;
};

IKRS.GirihCanvasHandler.prototype._clearSelection = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
	this.girih.tiles[i]._props.selected             = false;
    }
};

IKRS.GirihCanvasHandler.prototype._clearHovered = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
	this.girih.tiles[i]._props.hovered = false;
	this.girih.tiles[i]._props.highlightedEdgeIndex = -1;
    }
};


//**** KEY AND BUTTON HANDLER METHODS ************************************

IKRS.GirihCanvasHandler.prototype.keyDownHandler = function( e ) {

    // right=39,  d=68
    // left=37,   a=65
    // enter=13
    // delete=46
    // space=32
    // o=79
    // t=84
    // e=69
    // window.alert( e.keyCode );
/* kirk
 add bs to delete tile 8

the following are harder to do, because there is no static mapping of index to polygon type
 add 0 to select decagon 48  ...t conflicts with texture, d conflicts with right D
 add p,5 to select pentagon 80, 53
 add h,6 to select hexagon 72, 54
 add r,4 to select rhombus 82, 52
 add b,3 to select bowtie 66, 51
 add n,2 to select bowtie 78, 50

can repeats of the above cycle through variations of the shape?
  again.. this is hard without a static mapping of indices to polygon type.
*/

    if( e.keyCode == 39 || e.keyCode == 68 ) { //right, d
	this.girihCanvasHandler.adjacentTileOptionPointer++;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 37 || e.keyCode == 65) { //left, a
	this.girihCanvasHandler.adjacentTileOptionPointer--;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 13 || e.keyCode == 32 ) { //enter, space
	this.girihCanvasHandler._performAddCurrentAdjacentPresetTile();
    } else if( e.keyCode == 46 || e.keyCode == 8 ) { // delete, backspace
	this.girihCanvasHandler._performDeleteSelectedTile();
    } else if( e.keyCode == 79 ) { //o
	this.girihCanvasHandler.drawProperties.drawOutlines = !this.girihCanvasHandler.drawProperties.drawOutlines;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 84 ) { //t
	this.girihCanvasHandler.drawProperties.drawTextures = !this.girihCanvasHandler.drawProperties.drawTextures;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 69 ) { //e
	this.girihCanvasHandler._exportSVG();
    } else if( e.keyCode == 48 ) { // 0
	this.girihCanvasHandler.adjacentTileOptionPointer = IKRS.Girih.INDEX_DECAGON;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 80 || e.keyCode == 53 ) { // p,5
	this.girihCanvasHandler.adjacentTileOptionPointer = IKRS.Girih.INDEX_PENTAGON;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 72 || e.keyCode == 54 ) { // h,6
	this.girihCanvasHandler.adjacentTileOptionPointer = IKRS.Girih.INDEX_GIRIH_HEXAGON;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 82 || e.keyCode == 52 ) { // r,4
	this.girihCanvasHandler.adjacentTileOptionPointer = IKRS.Girih.INDEX_RHOMBUS;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 66 || e.keyCode == 51 ) { // b,3
	this.girihCanvasHandler.adjacentTileOptionPointer = IKRS.Girih.INDEX_BOW_TIE;
	this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 78 || e.keyCode == 50 ) { // b,2
	this.girihCanvasHandler.adjacentTileOptionPointer = IKRS.Girih.INDEX_PENROSE_RHOMBUS;
	this.girihCanvasHandler.redraw();
    }
};


IKRS.GirihCanvasHandler.prototype.increaseZoomFactor = function( redraw ) {
    this.zoomFactor *= 1.2;
    if( redraw ) {
	this.redraw();
    }
};


IKRS.GirihCanvasHandler.prototype.decreaseZoomFactor = function( redraw ) {
    this.zoomFactor /= 1.2;
    if( redraw ) {
	this.redraw();
    }
};


//**** TILE OPERATION METHODS ************************************

IKRS.GirihCanvasHandler.prototype._resolveCurrentAdjacentTilePreset = function( currentTile,
										highlightedEdgeIndex,
									      ) {

    if( highlightedEdgeIndex == -1 ) {
	return;
    }

    var optionIndex = (this.adjacentTileOptionPointer + possiblePositions.length) % possiblePositions.length;
    var proposedPosition    = possiblePositions[ optionIndex];

/*
    //find the position of the hovered tile vertex
    var face = IKRS.Girih.TILE_FACES [currentTile.tileType][highlightedEdgeIndex];
    var vertexAngle = face.centralAngle + currentTile.angle;
    var vertexPosition = new IKRS.Point2 (
	    currentTile.position.x + face.radialCoefficient * currentTile.size * Math.cos( vertexAngle),
	    currentTile.position.y + face.radialCoefficient * currentTile.size * Math.sin( vertexAngle));

    //find the angle of the selected edge
    var edgeAngle = vertexAngle - face.angleToCenter + face.angleToNextVertex - Math.PI;

    //advance along edge the length of the proposed tile edge
    var proposedFace = IKRS.Girih.TILE_FACES [proposedPosition.tileType][proposedPosition.startVertex];
    var vertexPosition2 = new IKRS.Point2 (
	    vertexPosition.x + proposedFace.lengthCoefficient * currentTile.size * Math.cos( edgeAngle),
	    vertexPosition.y + proposedFace.lengthCoefficient * currentTile.size * Math.sin( edgeAngle));

    //find the proposed tile center from current location
    var proposedAngleToCenter = (Math.PI + edgeAngle - proposedFace.angleToNextVertex + proposedFace.angleToCenter);
    var proposedCenter = new IKRS.Point2 (
	    vertexPosition2.x + proposedFace.radialCoefficient * currentTile.size * Math.cos( proposedAngleToCenter),
	    vertexPosition2.y + proposedFace.radialCoefficient * currentTile.size * Math.sin( proposedAngleToCenter));

    //find the new tile angle
    var proposedTileAngle = proposedAngleToCenter - proposedFace.centralAngle + Math.PI;
*/
//begin new code
    //find the position of the hovered tile vertex
    var face = IKRS.Girih.TILE_FACES [currentTile.tileType][highlightedEdgeIndex];

    this.posToXY( currentTile.position.x, currentTile.position.y) // at currrent center
    this.posToAD( currentTile.angle + face.centralAngle,
		  currentTile.size * face.radialCoefficient) // at highlighted edge vertex
    this.posToaD( Math.PI + face.angleToNextVertex - face.angleToCenter,
		  currentTile.size * face.lengthCoefficient); // at next vertex

    var proposedFace = IKRS.Girih.TILE_FACES [proposedPosition.tileType][proposedPosition.startVertex];
    this.posToaD( Math.PI - proposedFace.angleToNextVertex + proposedFace.angleToCenter,
              currentTile.size * proposedFace.radialCoefficient) // at adjacent center
    proposedCenter = this.turtlePosition.clone();

//end new code

    //find the new tile angle
    //var proposedTileAngle = proposedFace.centralAngle;
console.log("turtleAngle: " + this.turtleAngle * 180/Math.PI)

    var proposedTileAngle = (this.turtleAngle + Math.PI) % (2* Math.PI); //this works for face 0
//    var proposedTileAngle = (this.turtleAngle - proposedFace.centralAngle + Math.PI) % (2* Math.PI);
console.log("proposedTileAngle: " + proposedTileAngle * 180/Math.PI)


    //create the new tile
    switch( proposedPosition.tileType ) {
    case IKRS.Girih.TILE_TYPE_DECAGON:
	var proposedTile = new IKRS.Tile.Decagon(          currentTile.size, proposedCenter, proposedTileAngle);
	break;
    case IKRS.Girih.TILE_TYPE_PENTAGON:
	var proposedTile = new IKRS.Tile.Pentagon(         currentTile.size, proposedCenter, proposedTileAngle);
	break;
    case IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON:
	var proposedTile = new IKRS.Tile.IrregularHexagon( currentTile.size, proposedCenter, proposedTileAngle);
	break;
    case IKRS.Girih.TILE_TYPE_RHOMBUS:
	var proposedTile = new IKRS.Tile.Rhombus(          currentTile.size, proposedCenter, proposedTileAngle);
	break;
    case IKRS.Girih.TILE_TYPE_BOW_TIE:
	var proposedTile = new IKRS.Tile.BowTie(           currentTile.size, proposedCenter, proposedTileAngle);
	break;
    case IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS:
	var proposedTile = new IKRS.Tile.PenroseRhombus(   currentTile.size, proposedCenter, proposedTileAngle);
	break;
    default:
	throw "Cannot create tiles from unknown tile types (" + tileType + ").";
	break;
    }

    return proposedTile;
};


IKRS.GirihCanvasHandler.prototype._performAddCurrentAdjacentPresetTile = function() {

    var hoveredTileIndex = this._locateHoveredTile();
    if( hoveredTileIndex == -1 ) {
	return;
    }

    var tile         = this.girih.tiles[ hoveredTileIndex ];
    var tileBounds   = tile.computeBounds();

    if (tile.connectors[ tile._props.highlightedEdgeIndex].isShared()) {
	return
    }

    // need to reject if the adjacent tile overlaps with any existing tile

    var adjacentTile = this._resolveCurrentAdjacentTilePreset(   tile,
								 tile._props.highlightedEdgeIndex,
							     );
    if( !adjacentTile ) {
	return;
    }

    if( adjacentTile.tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS && !this.getProperties().allowPenroseTile ) {
	DEBUG( "Penrose tile not allowed." );
	return;
    }

    this.addTile( adjacentTile );
    this.redraw();
};


IKRS.GirihCanvasHandler.prototype._performDeleteSelectedTile = function() {

    var selectedTileIndex = this._locateSelectedTile();
    if( selectedTileIndex == -1 ) {
	return;
    }

    this.girih.tiles.splice( selectedTileIndex, 1 );
    this.redraw();
};


IKRS.GirihCanvasHandler.prototype.addTile = function( tile ) {

    // Add internal properties to the tile
    tile._props = { selected:              false,
		    hovered:               false,
		    highlightedEdgeIndex:  -1,
		  };
    this.girih.addTile( tile );

    // update the connections
    this.girih.buildConnectors( this.girih.tiles); // slow but does job for now
};


//**** TILE TEXTURE METHODS ************************************

IKRS.GirihCanvasHandler.prototype.setTextureImage = function( imageObject,
							      redraw
							    ) {
    this.imageObject = imageObject;
    if( redraw ) {
	this.redraw();
    }
};


IKRS.GirihCanvasHandler.prototype._drawTextures = function( tile, imageObject, originalBounds) {
/*
    This function applies a clipped portion of an external image file to be used as the background of a tile.
    This image may be generalized texture (e.g., wood, stone, water, etc.) or it may be a very specific
    structure that incorporates features, like strapping or sub-polygon coloring, to individual tiles.
    This latter feature requires that the tile size be 50 and the imgProperties defines the portion of the
    image to clip
*/
    // inputs: imgProperties, imageObject, originalBounds
    // this is another function that may work better as a generalized polygon
    // Build absolute image bounds from relative
    this.context.save();
    var imgBounds = new IKRS.BoundingBox2( tile.imageProperties.source.x * imageObject.width,
					   (tile.imageProperties.source.x + tile.imageProperties.source.width) * imageObject.width,
					   tile.imageProperties.source.y * imageObject.height,
					   (tile.imageProperties.source.y + tile.imageProperties.source.height) * imageObject.height
					);
    var polyImageRatio = new IKRS.Point2( originalBounds.getWidth() / imgBounds.getWidth(),
					  originalBounds.getHeight() / imgBounds.getHeight()
					);

// RED FLAG!!! (kirk) this needs something in the context to clip, say a polygon
// at this point not sure what all this other stuff is doing, seems complex
// at a minimum it needs a context with the polygon scribed.
    this.context.clip();
    var imageX = this.drawOffset.x + tile.position.x * this.zoomFactor + originalBounds.xMin * this.zoomFactor;
    var imageY = this.drawOffset.y + tile.position.y * this.zoomFactor + originalBounds.yMin * this.zoomFactor;
    var imageW = (originalBounds.getWidth() + tile.imageProperties.destination.xOffset*imageObject.width*polyImageRatio.x) * this.zoomFactor;
    var imageH = (originalBounds.getHeight() + tile.imageProperties.destination.yOffset*imageObject.height*polyImageRatio.y) * this.zoomFactor;

    this.context.translate( imageX + imageW/2.0,
			    imageY + imageH/2.0
			  );

    this.context.rotate( tile.angle );

    var drawStartX = (-originalBounds.getWidth()/2.0) * this.zoomFactor;
    var drawStartY = (-originalBounds.getHeight()/2.0) * this.zoomFactor;
    this.context.drawImage( imageObject,
			    tile.imageProperties.source.x*imageObject.width,                    // source x
			    tile.imageProperties.source.y*imageObject.height,                   // source y
			    tile.imageProperties.source.width*imageObject.width,                // source width
			    tile.imageProperties.source.height*imageObject.height,              // source height
			    drawStartX + tile.imageProperties.destination.xOffset*imageObject.width*polyImageRatio.x*0.5*this.zoomFactor,         // destination x
			    drawStartY + tile.imageProperties.destination.yOffset*imageObject.height*polyImageRatio.y*0.5*this.zoomFactor,        // destination y
			    (originalBounds.getWidth() - tile.imageProperties.destination.xOffset*imageObject.width*polyImageRatio.x) * this.zoomFactor,       // destination width
			    (originalBounds.getHeight() - tile.imageProperties.destination.yOffset*imageObject.height*polyImageRatio.y) * this.zoomFactor      // destination height
			  );
    this.context.restore();
}


// **** CANVAS RENDERING ************************************

IKRS.GirihCanvasHandler.prototype._drawTile = function( tile ) {

    // Penrose tile allowed?
    if( tile.tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS && !this.getProperties().allowPenroseTile ) {
	return;
    }
    var tileBounds = tile.computeBounds();
    if( this.drawProperties.drawBoxes ) {
	this._drawBoundingBox( tile.position,
			       tileBounds,
			       tile.angle
			     );
    }

    // draw the polygon
    //if( this.drawProperties.drawOutlines || this.drawProperties.drawTextures) 
    if( this.drawProperties.drawOutlines) {
	this._drawPolygonFromFaces(tile, this.drawProperties.polygonStrokeColor)
    } else {
	this._drawPolygonFromFaces(tile, "transparent");
    }

    // the following relys on polygon context set from _drawPolygonFromFaces above
    if( this.drawProperties.drawTextures) {
       this._drawTextures( tile, this.imageObject, tileBounds)
    };


    // the following relys on polygon context set from _drawPolygonFromFaces above
    if( this.drawProperties.drawPolygonColor) {
        if (this.drawProperties.polygonColorType === "default") {
	    var tileColor = tile.fillColor;
            if (typeof tileColor === "string" && tileColor[0] === '#' && tileColor.length == 7) {
	        tileColor = tileColor +"80"; // add alpha channel
	    }
        } else if (this.drawProperties.polygonColorType === "random") {
	    var tileColor = "rgba(" +
		Math.round( Math.random()*255 ) + "," +
		Math.round( Math.random()*255 ) + "," +
		Math.round( Math.random()*255 ) + "," +
		"0.5)";
	} else {
	    var tileColor = "transparent";
	}

	this.context.fillStyle = tileColor;
	this.context.fill();
	this.context.fillOpacity = 1; // reset this for other uses
    }

    if( this.drawProperties.drawInnerPolygons ) {
	this._drawInnerTilePolygons( tile );
	this._drawOuterTilePolygons( tile );
    }

    // strapping is drawn externally...
}


IKRS.GirihCanvasHandler.prototype._drawStrapping = function( tile ) {
    if( this.drawProperties.drawStrapping) {
	if( (this.drawProperties.drawStrappingType === "fancy" ||
	     this.drawProperties.drawStrappingType === "random")) {
	    switch(tile.tileType) {
	    //The following functions are in their respective module
	    case IKRS.Girih.TILE_TYPE_PENTAGON:
		this.drawFancyPentagonStrapping( tile);
		break;
	    case IKRS.Girih.TILE_TYPE_DECAGON:
		this.drawFancyDecagonStrapping( tile);
		break;
	    case IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON:
		this.drawFancyGirihHexagonStrapping( tile);
		break;
	    case IKRS.Girih.TILE_TYPE_RHOMBUS:
		this.drawFancyRhombusStrapping( tile);
		break;
	    case IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS:
		this.drawFancyPenroseRhombusStrapping( tile);
		break;
	    case IKRS.Girih.TILE_TYPE_BOW_TIE:
		this.drawFancyBowTieStrapping( tile);
		break;
	    default:
		this._drawSimpleStrapping( tile);
		break;
	    }
	} else {
	    this._drawSimpleStrapping( tile);
	}
    };
};


//**** VECTOR MOVEMENT METHODS FOR CANVAS OR SVG ************************************

IKRS.GirihCanvasHandler.prototype.posToXY = function ( x, y) {
    this.turtlePosition.x = x;
    this.turtlePosition.y = y;
}


IKRS.GirihCanvasHandler.prototype.posToAD = function ( angle, length) {
    this.turtlePosition.x = this.turtlePosition.x + length * Math.cos(angle)
    this.turtlePosition.y = this.turtlePosition.y + length * Math.sin(angle)
    this.turtleAngle = angle;
};


IKRS.GirihCanvasHandler.prototype.posToaD = function ( angle, length) {
    this.turtlePosition.x = this.turtlePosition.x + length * Math.cos(this.turtleAngle + angle)
    this.turtlePosition.y = this.turtlePosition.y + length * Math.sin(this.turtleAngle + angle)
    this.turtleAngle = (this.turtleAngle + angle) % (2* Math.PI);
};


IKRS.GirihCanvasHandler.prototype.getTurtlePosition = function () {
    return this.turtlePosition;
}


IKRS.GirihCanvasHandler.prototype.getTurtleAngle = function () {
    return this.turtleAngle;
}


//**** VECTOR DRAWING METHODS FOR CANVAS  ************************************

/*************************************************************************
 *  moveToXY(  newX, newY)
 *  move to an absolute coordinate on the canvas
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.

 *  Parameters:
 *      newX: destination x coordinate
 *      newX: destination y coordinate

 *  Returns:
 *      None
*************************************************************************/
IKRS.GirihCanvasHandler.prototype.moveToXY = function (newX, newY) {
    this.posToXY( newX, newY);
    this.context.moveTo( (this.turtlePosition.x + this.drawOffset.x) * this.zoomFactor,
			 (this.turtlePosition.y + this.drawOffset.y) * this.zoomFactor
		       );
};


/*************************************************************************
 *  lineToXY(  newX, newY)
 *  draw a line from current postion to an absolute coordinate on the canvas
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  Parameters:
 *      newX: destination x coordinate
 *      newX: destination y coordinate
 *
 *  Returns:
 *      None
*************************************************************************/
IKRS.GirihCanvasHandler.prototype.lineToXY = function (newX, newY) {
    this.posToXY( newX, newY);
    this.context.lineTo(this.turtlePosition.x * this.zoomFactor + this.drawOffset.x,
			this.turtlePosition.y * this.zoomFactor + this.drawOffset.y);
};


/*************************************************************************
 *  lineToAD(  ang, len)
 *  draw a line from current postion to an absolute angle and distance
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  Parameters:
 *      ang: absolute angle (0 is toward East and increases clockwise)
 *           (in radians)
 *      len: lenght of line in pixels
 *
 *  Returns:
 *      None
*************************************************************************/
IKRS.GirihCanvasHandler.prototype.lineToAD = function ( angle, length) {
    this.posToAD( angle, length);
    this.context.lineTo(this.turtlePosition.x * this.zoomFactor + this.drawOffset.x,
			this.turtlePosition.y * this.zoomFactor + this.drawOffset.y);
};


/*************************************************************************
 *  lineToaD(  ang, len)
 *  draw a line from current postion to a relative angle and distance
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  Parameters:
 *      ang: relative angle (0 is in current direction increases clockwise)
 *           (in radians)
 *      len: lenght of line in pixels
 *
 *  Returns:
 *      None
*************************************************************************/
IKRS.GirihCanvasHandler.prototype.lineToaD = function ( angle, length) {
    this.posToaD( angle, length);
    this.context.lineTo(this.turtlePosition.x * this.zoomFactor + this.drawOffset.x,
			this.turtlePosition.y * this.zoomFactor + this.drawOffset.y);
};


/*************************************************************************
 *  moveToAD(  ang, len)
 *  move from current postion to an absolute angle and distance
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  Parameters:
 *      ang: absolute angle (0 is toward East and increases clockwise)
 *           (in radians)
 *      len: lenght of move in pixels
 *
 *  Returns:
 *      None
*************************************************************************/
IKRS.GirihCanvasHandler.prototype.moveToAD = function ( angle, length) {
    this.posToAD( angle, length);
    this.context.moveTo(this.turtlePosition.x * this.zoomFactor + this.drawOffset.x,
			this.turtlePosition.y * this.zoomFactor + this.drawOffset.y);
};


/*************************************************************************
 *  moveToaD(  ang, len)
 *  move from current postion to a relative angle and distance
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  Parameters:
 *      ang: relative angle (0 is in current direction increases clockwise)
 *           (in radians)
 *      len: length of move in pixels
 *
 *  Returns:
 *      None
*************************************************************************/
IKRS.GirihCanvasHandler.prototype.moveToaD = function ( angle, length) {
    this.posToaD( angle, length);
    this.context.moveTo(this.turtlePosition.x * this.zoomFactor + this.drawOffset.x,
			this.turtlePosition.y * this.zoomFactor + this.drawOffset.y);
};


//**** VECTOR DRAWING METHODS FOR SVG ************************************

IKRS.GirihCanvasHandler.prototype.svgMoveToXY = function ( x, y) {
    this.posToXY( x, y)
    return ' M'+ IKRS.round( this.turtlePosition.x, this.SVG_PRECISION) +' '+
		 IKRS.round( this.turtlePosition.y, this.SVG_PRECISION)
}


IKRS.GirihCanvasHandler.prototype.svgLineToXY = function ( x, y) {
    this.posToXY( x, y)
    return ' L'+ IKRS.round( this.turtlePosition.x, this.SVG_PRECISION) +' '+
		 IKRS.round( this.turtlePosition.y, this.SVG_PRECISION)
}


IKRS.GirihCanvasHandler.prototype.svgMoveToAD = function ( angle, length) {
    this.posToAD( angle, length);
    return ' M'+ IKRS.round( this.turtlePosition.x, this.SVG_PRECISION) +' '+
		 IKRS.round( this.turtlePosition.y, this.SVG_PRECISION)
}


IKRS.GirihCanvasHandler.prototype.svgLineToAD = function ( angle, length) {
    this.posToAD( angle, length)
    return ' L'+ IKRS.round( this.turtlePosition.x, this.SVG_PRECISION) +' '+
		 IKRS.round( this.turtlePosition.y, this.SVG_PRECISION)
};


IKRS.GirihCanvasHandler.prototype.svgMoveToaD = function ( angle, length) {
    this.posToaD( angle, length)
    return ' M'+ IKRS.round( this.turtlePosition.x, this.SVG_PRECISION) +' '+
		 IKRS.round( this.turtlePosition.y, this.SVG_PRECISION)
};


IKRS.GirihCanvasHandler.prototype.svgLineToaD = function ( angle, length) {
    this.posToaD( angle, length)
    return ' L'+ IKRS.round( this.turtlePosition.x, this.SVG_PRECISION) +' '+
		 IKRS.round( this.turtlePosition.y, this.SVG_PRECISION)
};


//**** CANVAS DRAWING METHODS ************************************

/**************************************************************************
 *  capGap -- compute the spacing for the end cap of a crossing line
 *
 *  parameters:
 *    none passed
 *
 *  returns
 *    the required spacing for the end cap in pixels
 *************************************************************************/
IKRS.GirihCanvasHandler.prototype.capGap = function () {
    return this.drawProperties.strappingWidth/2 +
	   this.drawProperties.strappingStrokeWidth /
		   this.drawProperties.strappingPixelFactor +
	   this.drawProperties.strappingGap;
}



/**************************************************************************
 *  gline -- draw a double girih line with slanted ends
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  parameters:
 *    distance is the nominal length of the line in pixels
 *    spacing is the distance between twin line centers in pixels
 *    startAngle is the cut angle at the start of the line with respect to the turtle
 *    endAngle is the cut angle at the end of the line with respect to the turtle
 *    startCap is true when a start cap is desired
 *    endCap is true when an end cap is desired
 *    fill is optional style parameter used to fill shape
 *
 *  returns:
 *************************************************************************/
IKRS.GirihCanvasHandler.prototype.gline = function( distance, spacing, startAngle, endAngle, startCap, endCap, fill) {
    var startRightDist = spacing / 2 / Math.tan( -startAngle)
    var endRightDist = spacing / 2 / Math.tan( -endAngle)
    var startLeftDist = -startRightDist
    var endLeftDist = -endRightDist
    var startDiag = Math.abs(spacing / Math.sin( startAngle))
    var endDiag = Math.abs(spacing / Math.sin( -endAngle))
    if (fill !== undefined) {
	fillColor = fill;
    } else {
	fillColor = this.drawProperties.strappingFillColor;
    }

    // stroke the segment for the fill (and connect unstroked ends)
    // lay down the color
        //beginShape()
    this.context.beginPath();
    //HOLD svgAttribute ( 'class="gfill"')
    this.lineToaD( startAngle, startDiag/2);
    this.lineToaD( -startAngle, distance + startRightDist + endRightDist);
    this.lineToaD( -endAngle, endDiag);
    this.lineToaD( endAngle + 10* piTenths, distance + startLeftDist + endLeftDist);
    this.lineToaD( startAngle - 10* piTenths, startDiag/2);
    this.lineToaD( -startAngle, 0);
    this.context.fillStyle = fillColor;
    this.context.fillOpacity = 1;
    this.context.closePath();
    this.context.fill();

    // stroke the segment for real
//color( saveColor) // to force a new segment in SVG...
//svgAttribute ( 'class="gstroke"')
    this.context.beginPath();
    if (startCap) {
	this.lineToaD( 0,0); // should not be necessary
	this.lineToaD( startAngle, startDiag/2);
    } else {
	this.moveToaD( startAngle, startDiag/2);
    }
    this.lineToaD( -startAngle,  distance + startRightDist + endRightDist);
//color( saveColor)
//svgAttribute ( 'class="gstroke"')

//color( saveColor)
//svgAttribute ( 'class="gstroke"')

    if( endCap) {
	this.lineToaD( -endAngle, endDiag);
    } else {
	this.moveToaD( -endAngle, endDiag);
    }
//color( saveColor)
//svgAttribute ( 'class="gstroke"')
    this.lineToaD( endAngle + 10* piTenths, distance + startLeftDist + endLeftDist);
//color( saveColor)
//svgAttribute ( 'class="gstroke"')
    if ( startCap) {
	this.lineToaD( startAngle - 10* piTenths, startDiag/2);
    } else {
	this.moveToaD( startAngle - 10* piTenths, startDiag/2);
    }
//color( saveColor)
//svgAttribute ( 'class="gstroke"')
    this.context.strokeStyle = this.drawProperties.strappingStrokeColor;
    this.context.fillStyle = "";
    this.context.lineWidth = this.drawProperties.strappingStrokeWidth;
    //this.context.closePath();
    this.context.stroke();

    // move to the end of the segment
    this.moveToaD( -startAngle, distance);
}


/**
 * The 'colors' object may contain:
 *  - unselectedEdgeColor
 *  - selectedEdgeColor
 *  - fillColor
 **/
IKRS.GirihCanvasHandler.prototype._drawPolygonFromPoints = function( points,
								     position,
								     angle,
								     originalBounds,
								     colors,
								     imgProperties,
								     imageObject,
								     highlightedEdgeIndex,
								     drawOutlines
								   ) {

    if( !points ) {
	return;
    }

//    this.context.save(); //needed for textures?

    this.context.beginPath();
    var point      = points[0].clone();
//    point.rotate( IKRS.Point2.ZERO_POINT, angle );
    var startPoint = point.clone();
/*
    this.context.moveTo( point.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 point.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
		       );
*/
    this.context.moveTo( point.x * this.zoomFactor + this.drawOffset.x,
			 point.y * this.zoomFactor + this.drawOffset.y
		       );

    var bounds = new IKRS.BoundingBox2( point.x, point.y, point.x, point.y );

    for( var i = 1; i < points.length; i++ ) {

	point.set( points[i] );
//	point.rotate( IKRS.Point2.ZERO_POINT, angle );
	//window.alert( "point=(" + point.x + ", "+ point.y + ")" );
/*
	this.context.lineTo( point.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			     point.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
			   );
*/
	this.context.lineTo( point.x * this.zoomFactor + this.drawOffset.x,
			     point.y * this.zoomFactor + this.drawOffset.y
			   );

// can't find reference to bounds...
	bounds.xMin = Math.min( point.x, bounds.xMin );
	bounds.xMax = Math.max( point.x, bounds.xMax );
	bounds.yMin = Math.min( point.y, bounds.yMin );
	bounds.yMax = Math.max( point.y, bounds.yMax );
    }
    // Close path
/*
    this.context.lineTo( startPoint.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 startPoint.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
		       );
*/
    this.context.lineTo( startPoint.x * this.zoomFactor + this.drawOffset.x,
			 startPoint.y * this.zoomFactor + this.drawOffset.y
		       );
    this.context.closePath();

/*
    if( this.drawProperties.drawTextures &&
	imgProperties &&
	imageObject ) {

	// Build absolute image bounds from relative
	var imgBounds = new IKRS.BoundingBox2( imgProperties.source.x * imageObject.width,
					       (imgProperties.source.x + imgProperties.source.width) * imageObject.width,
					       imgProperties.source.y * imageObject.height,
					       (imgProperties.source.y + imgProperties.source.height) * imageObject.height
					     );
	var polyImageRatio = new IKRS.Point2( originalBounds.getWidth() / imgBounds.getWidth(),
					      originalBounds.getHeight() / imgBounds.getHeight()
					    );
	//window.alert( "polyImageRatio=" + polyImageRatio );

	this.context.clip();
	var imageX = this.drawOffset.x + position.x * this.zoomFactor + originalBounds.xMin * this.zoomFactor;
	var imageY = this.drawOffset.y + position.y * this.zoomFactor + originalBounds.yMin * this.zoomFactor;
	var imageW = (originalBounds.getWidth() + imgProperties.destination.xOffset*imageObject.width*polyImageRatio.x) * this.zoomFactor;
	var imageH = (originalBounds.getHeight() + imgProperties.destination.yOffset*imageObject.height*polyImageRatio.y) * this.zoomFactor;

	this.context.translate( imageX + imageW/2.0,
				imageY + imageH/2.0
			      );

	this.context.rotate( angle );

	var drawStartX = (-originalBounds.getWidth()/2.0) * this.zoomFactor;
	var drawStartY = (-originalBounds.getHeight()/2.0) * this.zoomFactor;
	this.context.drawImage( imageObject,
				imgProperties.source.x*imageObject.width,                    // source x
				imgProperties.source.y*imageObject.height,                   // source y
				imgProperties.source.width*imageObject.width,                // source width
				imgProperties.source.height*imageObject.height,              // source height
				drawStartX + imgProperties.destination.xOffset*imageObject.width*polyImageRatio.x*0.5*this.zoomFactor,         // destination x
				drawStartY + imgProperties.destination.yOffset*imageObject.height*polyImageRatio.y*0.5*this.zoomFactor,        // destination y
				(originalBounds.getWidth() - imgProperties.destination.xOffset*imageObject.width*polyImageRatio.x) * this.zoomFactor,       // destination width
				(originalBounds.getHeight() - imgProperties.destination.yOffset*imageObject.height*polyImageRatio.y) * this.zoomFactor      // destination height
			      );
    }
*/

    // Fill polygon with color (eventually additional to texture)?
    if( colors.fillColor ) {
	//window.alert( "fillColor=" + colors.fillColor );

	this.context.fillStyle = colors.fillColor;
	this.context.fill();
    }

    // Draw outlines?
    if( drawOutlines && colors.unselectedEdgeColor ) {
	this.context.lineWidth   = 1.0;
	this.context.strokeStyle = colors.unselectedEdgeColor;
	this.context.stroke();
    }

//    this.context.restore();

};


IKRS.GirihCanvasHandler.prototype._drawPolygonFromFaces = function( tile, strokeColor) {
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var face = faces[0];
    this.context.beginPath();
    this.moveToXY( tile.position.x, tile.position.y)
    this.moveToAD( tile.angle + face.centralAngle, face.radialCoefficient * tile.size)
    this.moveToaD( Math.PI - face.angleToCenter, 0)
    for (var i = 0; i< faces.length; i++) {
	//face = faces[ i % faces.length]
	face = faces[ i]
	this.lineToaD( face.angleToNextVertex, tile.size * face.lengthCoefficient)
    }
    this.context.strokeStyle = strokeColor,
    this.context.lineWidth = "1pt";
    this.context.closePath();
    this.context.stroke();
}


IKRS.GirihCanvasHandler.prototype._drawHighlightedPolygonEdge = function( points,
									  position,
									  angle,
									  originalBounds,
									  colors,
									  imgProperties,
									  imageObject,
									  highlightedEdgeIndex,
									  drawOutlines
								   ) {

    if( !points || highlightedEdgeIndex == -1 ) {
	return;
    }

    this.context.save();

    var pointA = points[ highlightedEdgeIndex ].clone();
    var pointB = points[ highlightedEdgeIndex+1 < points.length ? highlightedEdgeIndex+1 : 0 ].clone();

//    pointA.rotate( IKRS.Point2.ZERO_POINT, angle );
//    pointB.rotate( IKRS.Point2.ZERO_POINT, angle );


    this.context.beginPath();
/*
    this.context.lineTo( pointA.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 pointA.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
		       );
    this.context.lineTo( pointB.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 pointB.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
		       );
*/
    this.context.lineTo( pointA.x * this.zoomFactor + this.drawOffset.x,
			 pointA.y * this.zoomFactor + this.drawOffset.y
		       );
    this.context.lineTo( pointB.x * this.zoomFactor + this.drawOffset.x,
			 pointB.y * this.zoomFactor + this.drawOffset.y
		       );
    this.context.closePath();
    this.context.strokeStyle = colors.selectedEdgeColor;
    this.context.lineWidth   = 3.0;
    this.context.stroke();

    this.context.restore();

};


IKRS.GirihCanvasHandler.prototype._drawPreviewTileAtHighlightedPolygonEdge = function( tile,
										       points,
										       position,
										       angle,
										       originalBounds,
										       colors,
										       imgProperties,
										       imageObject,
										       highlightedEdgeIndex,
										       drawOutlines
										     ) {

    var adjacentTile = this._resolveCurrentAdjacentTilePreset(  tile,
								highlightedEdgeIndex,
							     );
    if( !adjacentTile ) {
	return;
    }


    // Draw adjacent tile
    this.context.globalAlpha = 0.5;  // 50% transparency
    this._drawPolygonFromPoints( adjacentTile.polygon.vertices,
				 adjacentTile.position,
				 adjacentTile.angle,
				 adjacentTile.computeBounds(), // originalBounds,
				 { unselectedEdgeColor: "#888888", // null, // "#000000",
				   selectedEdgeColor:   null, // "#e80088",
				   fillColor:           null
				 },
				 adjacentTile.imageProperties,
				 this.imageObject,
				 -1,  // tile._props.highlightedEdgeIndex,
				 true // always draw the preview outlines? // this.drawProperties.drawOutlines
			       );
    this.context.globalAlpha = 1.0;  // reset to opaque

};


IKRS.GirihCanvasHandler.prototype._drawCrosshairAt = function( position,
							       isSelected
							     ) {

    if( isSelected ) {
	this.context.strokeStyle = "#FF0000";
    } else {
	this.context.strokeStyle = "#808080";
    }

    this.context.beginPath();

    var DRAW_CROSS = false; // Looks ugly
    // Draw cross?
    if( DRAW_CROSS ) {
	this.context.moveTo( position.x * this.zoomFactor + this.drawOffset.x,
			     position.y * this.zoomFactor + this.drawOffset.y - 5
			   );
	this.context.lineTo( position.x * this.zoomFactor + this.drawOffset.x,
			     position.y * this.zoomFactor + this.drawOffset.y + 5
			   );

	this.context.moveTo( position.x * this.zoomFactor + this.drawOffset.x - 5,
			     position.y * this.zoomFactor + this.drawOffset.y
			   );
	this.context.lineTo( position.x * this.zoomFactor + this.drawOffset.x + 5,
			     position.y * this.zoomFactor + this.drawOffset.y
			   );
    }

    this.context.arc( position.x * this.zoomFactor + this.drawOffset.x,
		      position.y * this.zoomFactor + this.drawOffset.y,
		      5.0,
		      0.0,
		      2 * Math.PI,
		      false
		    );

    this.context.stroke();
    this.context.closePath();
};


IKRS.GirihCanvasHandler.prototype._drawBoundingBox = function( position,
							       bounds,
							       angle ) {

    var points = [ bounds.getLeftUpperPoint(),
		   bounds.getRightUpperPoint(),
		   bounds.getRightLowerPoint(),
		   bounds.getLeftLowerPoint()
		 ];

    this.context.strokeStyle = "#c8c8ff";
    this.context.fillStyle = "";
    this._drawPolygonFromPoints( points,
				 position,
				 angle,
				 bounds,
				 { unselectedEdgeColor: this.drawProperties.polygonSelectedStrokeColor,
 				   selectedEdgeColor:   this.drawProperties.polygonSelectedStrokeColor,
				   fillColor:           null
				 },
				 null,   // imgProperties,
				 null,   // imageObject,
				 -1,     // highlightedEdgeIndex
				 true    // drawOutlines
			       );

    this.context.stroke();
};


IKRS.GirihCanvasHandler.prototype._drawCoordinateSystem = function() {

    this.context.strokeStyle = this.drawProperties.boundingBoxColor,
    this.context.beginPath();

    this.context.moveTo( this.drawOffset.x,
			 0
		       );
    this.context.lineTo( this.drawOffset.x,
			 this.canvasHeight
		       );

    this.context.moveTo( 0,
			 this.drawOffset.y
		       );
    this.context.lineTo( this.canvasWidth,
			 this.drawOffset.y
		       );

    this.context.stroke();
    this.context.closePath();
};


IKRS.GirihCanvasHandler.prototype._drawInnerTilePolygons = function( tile ) {
    for( var i = 0; i < tile.innerTilePolygons.length; i++ ) {
	if( tile.tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS &&
            !this.getProperties().drawPenroseCenterPolygon &&
            i == tile.getCenterPolygonIndex() ) {
	    continue;
	}
	this._drawInnerTile( tile, i );
    }
};


IKRS.GirihCanvasHandler.prototype._drawOuterTilePolygons = function( tile ) {
    for( var i = 0; i < tile.outerTilePolygons.length; i++ ) {
	var polygon = tile.outerTilePolygons[ i ];

	var randomColor = null;
	if( this.drawProperties.outerRandomColorFill ) {
		randomColor = "rgba(" +
			Math.round( Math.random()*255 ) + "," +
			Math.round( Math.random()*255 ) + "," +
			Math.round( Math.random()*255 ) + "," +
			"0.5)";
	}
	this._drawPolygonFromPoints( polygon.vertices,   // points,
				     tile.position,
				     tile.angle,
				     IKRS.BoundingBox2.computeFromPoints(polygon.vertices), //originalBounds,
				     { unselectedEdgeColor: null,
				       selectedEdgeColor:   null,
				       fillColor:           randomColor //"rgba(255,255,0,0.5)" //"#ffff00"
				     },    // colors,
				     null, // imgProperties,
				     null, // imageObject,
				     -1,   // highlightedEdgeIndex,
				     true  // drawOutlines
				   );
    }
};


IKRS.GirihCanvasHandler.prototype._drawInnerTile = function( tile, index ) {
    var polygon = tile.innerTilePolygons[ index ];

    var randomColor = null;
    if( this.drawProperties.innerRandomColorFill ) {
	randomColor = "rgba(" +
	    Math.round( Math.random()*255 ) + "," +
	    Math.round( Math.random()*255 ) + "," +
	    Math.round( Math.random()*255 ) + "," +
	    "0.5)";
    }
    this._drawPolygonFromPoints( polygon.vertices,   // points,
				 tile.position,
				 tile.angle,
				 IKRS.BoundingBox2.computeFromPoints(polygon.vertices), //originalBounds,
				 { unselectedEdgeColor: this.drawProperties.simpleStrappingStrokeColor,
				   selectedEdgeColor: this.drawProperties.simpleStrappingStrokeColor,
				   fillColor:           randomColor // null
				 },    // colors,
				 null, // imgProperties,
				 null, // imageObject,
				 -1,   // highlightedEdgeIndex,
				 this.drawProperties.drawStrapping  // drawOutlines
			       );

};


IKRS.GirihCanvasHandler.prototype._drawSimpleStrapping = function( tile ) {
    for( var i = 0; i < tile.innerTilePolygons.length; i++ ) {
	if( tile.tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS && !this.getProperties().drawPenroseCenterPolygon && i == tile.getCenterPolygonIndex() ) {
	    continue;
	}
	var polygon = tile.innerTilePolygons[ i ];

	this._drawPolygonFromPoints( polygon.vertices,   // points,
				     tile.position,
				     tile.angle,
				     IKRS.BoundingBox2.computeFromPoints(polygon.vertices), //originalBounds,
				     { unselectedEdgeColor: this.drawProperties.simpleStrappingStrokeColor,
				       selectedEdgeColor:   this.drawProperties.simpleStrappingStrokeColor,
				       fillColor:           null // null do not fill
				     },    // colors,
				     null, // imgProperties,
				     null, // imageObject,
				     -1,   // highlightedEdgeIndex,
				     true  // drawOutlines
				   );
    }
};


IKRS.GirihCanvasHandler.prototype._drawTiles = function() {
    // draw the basic tiles
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
	this._drawTile( this.girih.tiles[i] );
    }

    // find all chains
    if( this.drawProperties.drawStrapping &&
	   (this.drawProperties.drawStrappingType === "fancy" ||
	    this.drawProperties.drawStrappingType === "random")) {
	if (this.lastTileCount !== this.girih.tiles.length ||
	    this.lastDrawStrappingType !== this.drawProperties.drawStrappingType) { // when tile added or deleted
	    this.girih.buildConnectors( this.girih.tiles);
	    this.girih.findConnections( this.girih.tiles);
	    this.girih.findAllChains( this.girih.tiles);
	    this.lastTileCount = this.girih.tiles.length;
	}
    }
    this.lastDrawStrappingType = this.drawProperties.drawStrappingType;

    // draw the strapping
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
	var tile = this.girih.tiles[i];
	this._drawStrapping( tile);

	if( this.drawProperties.drawOutlines || tile._props.selected ) {
	    this._drawCrosshairAt( tile.position, tile._props.selected );
	}
    }

    // Finally draw the selected tile's hovering edge
    var hoveredTileIndex = this._locateHoveredTile();
    if( hoveredTileIndex != -1 ) {
	var tile = this.girih.tiles[ hoveredTileIndex ];
	var tileBounds       = tile.computeBounds()
	this._drawHighlightedPolygonEdge( tile.polygon.vertices,
					  tile.position,
					  tile.angle,
					  tileBounds,
					  { unselectedEdgeColor: "#000000",
					    selectedEdgeColor:   this.drawProperties.polygonSelectedStrokeColor,
					    fillColor:           null
					  },
					  tile.imageProperties,
					  this.imageObject,
					  tile._props.highlightedEdgeIndex,
					  this.drawProperties.drawOutlines
					);
	this._drawPreviewTileAtHighlightedPolygonEdge( tile,
						       tile.polygon.vertices,
						       tile.position,
						       tile.angle,
						       tileBounds,
						       { unselectedEdgeColor: null, // "#000000",
							 selectedEdgeColor:   null, // "#d80000",
							 fillColor:           null
						       },
						       null,//tile.imageProperties,
						       null,//this.imageObject,
						       tile._props.highlightedEdgeIndex,
						       this.drawProperties.drawOutlines
						     );
    }
};


/**
 * The drawProperties object may contain following members:
 *  - drawBoxes         (boolean)
 *  - drawOutlines      (boolean)
 *  - drawTexture       (boolean)
 *  - drawInnerPolygons (boolean)
 **/
IKRS.GirihCanvasHandler.prototype.getDrawProperties = function() {
    return this.drawProperties;
};


/**
 * The properties object may contain following members:
 *  - allowPenroseTile
*   -
 **/
IKRS.GirihCanvasHandler.prototype.getProperties = function() {
    return this.properties;
};


IKRS.GirihCanvasHandler.prototype.redraw = function() {
console.log("redraw triggered")

    this.context.fillStyle = this.getDrawProperties().backgroundColor; // "#F0F0F0";
    this.context.fillRect( 0, 0, this.canvasWidth, this.canvasHeight );

    if( this.getDrawProperties().drawCoordinateSystem ) {
	this._drawCoordinateSystem();
    }

    this._drawTiles();

};


//**** SVG DRAWING METHODS ****

IKRS.GirihCanvasHandler.prototype.getSVGPolygonFromFaces = function( tile, idStr, classStr, styleStr, boundingBox) {
// idStr is short string to uniquely identify polygon (may be "")
// classStr is short string to identify class or classes used by polygon (may be "")
// styleStr is string to apply style or other attributes to the polygon (may be "") (must include attribute name and enclose attribute in double quotes
// returns an SVG string
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var face = faces[0];
 // <polygon points="0,100 50,25 50,75 100,0" />
    var polygon = this.indent + '<polygon';
    if (idStr && idStr !== "") {
	polygon += ' id="'+ idStr +'"';
    }
    if (classStr && classStr !== "") {
	polygon += ' class="'+ classStr +'"';
    }
    if (styleStr && styleStr !== "") {
	polygon += ' '+ styleStr;
    }
    polygon += ' points="';
    //var polygon = this.indent + '<polygon id="'+ idStr +'" class="'+ classStr +' '+ styleStr +'" points="';
    // this uses the SVG primitives to move the current positon without using the return value
    this.posToXY( tile.position.x, tile.position.y);

    this.posToAD( tile.angle + face.centralAngle, face.radialCoefficient * tile.size);
    this.posToaD( Math.PI - face.angleToCenter, 0)
    var preemble = ''
    for (var i = 0; i< faces.length; i++) {
	polygon += preemble +
		   IKRS.round( this.position.x, this.SVG_PRECISION) +','+ 
		   IKRS.round( this.position.y, this.SVG_PRECISION)
        boundingBox.evaluatePoint( this.position.x, this.position.y);// important to use translated vertices
	face = faces[ i];
	this.posToaD( face.angleToNextVertex, tile.size * face.lengthCoefficient);
	preemble = ' '
    }
    polygon += '"/>' + this.eol;
console.log("svgPoly: " + polygon)
    return polygon;
}


/**************************************************************************
 *  getGlineSVG -- draw a double girih line with slanted ends to SVG
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  parameters:
 *    distance is the nominal length of the line in pixels
 *    spacing is the distance between twin line centers in pixels
 *    startAngle is the cut angle at the start of the line with respect to the turtle
 *    endAngle is the cut angle at the end of the line with respect to the turtle
 *    startCap is true when a start cap is desired
 *    endCap is true when an end cap is desired
 *    fill is optional style parameter used to fill shape
 *
 *  returns:
 *     SVG string
 *************************************************************************/
IKRS.GirihCanvasHandler.prototype.getGlineSVG = function( distance, spacing, startAngle, endAngle, startCap, endCap, fill) {
    var startRightDist = spacing / 2 / Math.tan( -startAngle)
    var endRightDist = spacing / 2 / Math.tan( -endAngle)
    var startLeftDist = -startRightDist
    var endLeftDist = -endRightDist
    var startDiag = Math.abs(spacing / Math.sin( startAngle))
    var endDiag = Math.abs(spacing / Math.sin( -endAngle))
    if (fill !== undefined) {
	fillColor = fill;
    } else {
	fillColor = this.drawProperties.strappingFillColor;
    }

    // stroke the segment for the fill (and connect unstroked ends)
//    // lay down the color
    var path = [];
    path.push( this.indent + '<path class="gfill" d="');
//'"id="' + idStr
//'"class="gfill ' + fillClassStr
    path.push('M'+ IKRS.round( this.position.x, this.SVG_PRECISION) +' '+
                    IKRS.round( this.position.y, this.SVG_PRECISION));
    path.push( this.svgLineToaD( startAngle,
                                 startDiag/2));
    path.push( this.svgLineToaD( -startAngle,
                                 distance + startRightDist + endRightDist));
    path.push( this.svgLineToaD( -endAngle,
                                 endDiag));
    path.push( this.svgLineToaD( endAngle + 10* piTenths,
                                 distance + startLeftDist + endLeftDist));
    path.push( this.svgLineToaD( startAngle - 10* piTenths,
                                 startDiag/2));
    path.push( this.svgLineToaD( -startAngle, 0));
    path.push( '"/>' + this.eol);

    // stroke the segment for real
    path.push( this.indent + '<path class="gstroke" d="');
//'"class="gstroke ' + strokeClassStr
//'"id="' + idStr
    path.push( 'M'+ IKRS.round( this.position.x, this.SVG_PRECISION) +' '+
                    IKRS.round( this.position.y, this.SVG_PRECISION));
    if (startCap) {
	path.push( this.svgLineToaD( 0,0)); // should not be necessary
	path.push( this.svgLineToaD( startAngle,
                                     startDiag/2));
    } else {
	path.push( this.svgMoveToaD( startAngle,
                                     startDiag/2, ));
    }
    path.push( this.svgLineToaD( -startAngle,
                                 distance + startRightDist + endRightDist));

    if( endCap) {
	path.push( this.svgLineToaD( -endAngle,
                                     endDiag));
    } else {
	path.push( this.svgMoveToaD( -endAngle,
                                     endDiag));
    }
    path.push( this.svgLineToaD( endAngle + 10* piTenths,
                                 distance + startLeftDist + endLeftDist));
    if ( startCap) {
	path.push( this.svgLineToaD( startAngle - 10* piTenths,
                                     startDiag/2));
    } else {
	path.push( this.svgMoveToaD( startAngle - 10* piTenths,
                                     startDiag/2));
    }

    // move to the end of the segment
    path.push( this.moveToaD( -startAngle,
                              distance));
    path.push( '"/>' + this.eol);

console.log("svgGline path:"+ path);
    return path.join("")
}


IKRS.GirihCanvasHandler.prototype.getSVG = function( options,
						     polygonStyle
						     ) {

    var buffer  = [];
    if( typeof options == "undefined" ) {
	options = {};
    }

    if( typeof options.indent == "undefined" ) {
	options.indent = "";
    }

/* kirk
this doesn't look right..
width and height should be determined by the high and low water marks of the
actual drawing, not just what is on the screen

for now the options.width and options.height are ignored
the polygonStyle is put into a svg style sheet rather than individual polygons
*/
    options.width  = this.canvasWidth;
    options.height = this.canvasHeight;
    polygonStyle = "fill-opacity:0.0; fill:white; stroke:green; stroke-width:1;";

    this.toSVG( options,
	        polygonStyle,
	        buffer
	      );
    return buffer.join( "" );
};


IKRS.GirihCanvasHandler.prototype._exportSVG = function( options,
							 polygonStyle
							 ) {
    var svg = this.getSVG();

    saveTextFile( svg, "girih.svg", "image/svg+xml" );

};


IKRS.GirihCanvasHandler.prototype._getSVGSimilarChainClasses = function() {
    var members = [];
    for (chainIndex = 0; chainIndex < this.girih.chains.length; chainIndex++) {
        chain = this.girih.chains[ chainIndex];
        //  set identity to zero padded length + 'L' if looping
        var id = '00000' + chain.links.length;
        id = id.slice(-5);
        if (chain.isLoop) {
            id = id +'L';
        }
        //  add new identities to list of chains
        if ( members.indexOf( id) <0) {
            members.push( id);
        }
    }
    members.sort();

    //generate CSS code for the chain identity lenghts
    css = "";
    for (id of members) {
console.log ( ".Chain_Length_"+ id);
	// make the id match the id generated by the SVG routines
	id = id.replace(/^0+/,'');
	if (id === '') {
	    id = '0';
	}
       css += ".Chain_Length_"+ id + ` .gfill {
    fill:rgb(` + Math.round( Math.random()*255 ) + `,` +
		 Math.round( Math.random()*255 ) + `,` +
		 Math.round( Math.random()*255 ) + `);
}
`;
    }
    console.log("CSS:"+ css);
//return CSS code string
    return css
}

IKRS.GirihCanvasHandler.prototype._getSVGMultipleChainClasses = function() {
    var members = [];
    css = '';
    // build css for chains of more than one line to do random colors
    for (chainIndex = 0; chainIndex < this.girih.chains.length; chainIndex++) {
        chain = this.girih.chains[ chainIndex];
        if (chain.links.length > 1) {
	    css += `
.Chain_`+ chainIndex + ` .gfill {
    fill:rgb(` + Math.round( Math.random()*255 ) + `,` +
		 Math.round( Math.random()*255 ) + `,` +
		 Math.round( Math.random()*255 ) + `);
}`;
	}
    }
    return css
}


IKRS.GirihCanvasHandler.prototype.getSVGForeword = function( highWater) {

    var foreword = `` +
`<svg id="girih-svg" xmlns="http://www.w3.org/2000/svg" version="1.1"
   height="` + IKRS.round( highWater.getHeight(), this.SVG_PRECISION) + `"
   width="` + IKRS.round( highWater.getWidth(), this.SVG_PRECISION) + `">
<style>
path {
    vector-effect:non-scaling-stroke;
}
polygon { /* includes inner and outer facets */
    fill:transparent;
    stroke:transparent;
    stroke-width: 1px;
}
`;
    if( this.drawProperties.drawPolygonColor) {
        if (this.drawProperties.polygonColorType === "default") {
            foreword += `` +
`.decagon{
  fill:`+ this.drawProperties.decagonFillColor + `;
  opacity:50%;
  stroke:black;
}
.pentagon{
  fill:`+ this.drawProperties.pentagonFillColor + `;
  opacity:50%;
  stroke:black;
}
.hexagon{
  fill:`+ this.drawProperties.hexagonFillColor + `;
  opacity:50%;
  stroke:black;
}
.rhombus{
  fill:`+ this.drawProperties.rhombusFillColor + `;
  opacity:50%;
  stroke:black;
}
.penrose_rhombus{
  fill:`+ this.drawProperties.penroseRhombusFillColor + `;
  opacity:50%;
  stroke:black;
}
.bow_tie{
  fill:`+ this.drawProperties.bowTieFillColor + `;
  opacity:50%;
  stroke:black;
}
`;
        } else if (this.drawProperties.polygonColorType === "random") {
            foreword += `` +
`.decagon{
  opacity:50%;
  stroke:black;
}
.pentagon{
  opacity:50%;
  stroke:black;
}
.hexagon{
  opacity:50%;
  stroke:black;
}
.rhombus{
  opacity:50%;
  stroke:black;
}
.penrose_rhombus{
  opacity:50%;
  stroke:black;
}
.bow_tie{
  opacity:50%;
  stroke:black;
}
`;
        } else { //default?
            foreword += `` +
`.decagon{
  opacity:50%;
  stroke:black;
}
.pentagon{
  opacity:50%;
  stroke:black;
}
.hexagon{
  opacity:50%;
  stroke:black;
}
.rhombus{
  opacity:50%;
  stroke:black;
}
.penrose_rhombus{
  opacity:50%;
  stroke:black;
}
.bow_tie{
  opacity:50%;
  stroke:black;
}
`
        }
    }
    foreword += `` +
`text {
    fill:black;
    font:10pt normal Helvetica, Ariel, sans-serif;
}
.gfill {
    fill: yellow;
    fill-opacity: 1;
    stroke:transparent;
    stroke-opacity: 0;
    stroke-width: 0;
}
.gstroke {
    stroke: black;
    fill: transparent;
    fill-opacity: 0; 
    stroke-linejoin: miter;
    stroke-opacity: 1;
    stroke-width:` + this.drawProperties.strappingStrokeWidth + `px;
}
.inner polygon {
    /*fill: lightyellow;*/
    /*fill:transparent;*/
}
.outer polygon {
    /*fill: aliceblue;*/
    /*fill:transparent;*/
}
`

    if (this.drawProperties.drawStrappingType === "fancy") {
	foreword += this._getSVGSimilarChainClasses();
    } else if (this.drawProperties.drawStrappingType === "random") {
	foreword += this._getSVGMultipleChainClasses();
    }

    foreword += `
svg, .background {
    width:100%;
    height:100%;
    /*fill:lightblue;*/
}
</style>

<g transform="matrix(1 0 0 1 ` +
    IKRS.round( -highWater.getXMin(), this.SVG_PRECISION) + ` ` +
    IKRS.round( -highWater.getYMin(), this.SVG_PRECISION) + `)">
`;
    return foreword;
}


IKRS.GirihCanvasHandler.prototype.getSVGAfterword = function() {
    var afterword =
`
</g>
<script>
/* for any runtime JavaScript to control or animate the girih */
/* This must be at the end of the file to execute after the girih DOM is built*/
</script>
</svg>`;
    return afterword;
}

IKRS.GirihCanvasHandler.prototype.toSVG = function( options,
				       polygonStyle,
				       buffer
				     ) {

console.log("gCH.toSVG: start");
    var returnBuffer = false;
    if( typeof buffer == "undefined" || !buffer ) {
	buffer = [];
/*
	return
    <polygon points="282.077,66.333 253.077,66.333 261.849,54.06 280.111,60.282 291.228,44.514 305.539,49.287" />
    <polygon points="271,32.242 300,32.242 291.228,44.514 272.966,38.293 261.849,54.06 247.539,49.287" />
<polygon id="tile_" class="polygon decagon" points="329,210.747 375.923,244.839 393.846,300 375.923,355.161 329,389.253 271,389.253 224.077,355.161 206.154,300 224.077,244.839 271,210.747"/>    <polygon points="352.461,nBuffer = true;
*/
    }

    if (polygonStyle === undefined) {
	polygonStyle = ""
    }
    if (fontStyle === undefined) {
	fontStyle = "font:10pt normal Helvetica, Ariel, sans-serif;"
    }
/*
    if (svgBackground != undefined && svgBackground !== "") {
	var background = '<rect class="background" width="100%" height="100%" fill="' + svgBackground + '"/>';
    } else {
	var background = ""
    }
*/

    // find all of the chains (if not already done)
    if( this.drawProperties.drawStrapping &&
	   (this.drawProperties.drawStrappingType === "fancy" ||
	    this.drawProperties.drawStrappingType === "random")) {
	if (this.lastTileCount !== this.girih.tiles.length ||
	    this.lastDrawStrappingType !== this.drawProperties.drawStrappingType) { // when tile added or deleted
	    this.girih.buildConnectors( this.girih.tiles);
	    this.girih.findConnections( this.girih.tiles);
	    this.girih.findAllChains( this.girih.tiles);
	    this.lastTileCount = this.girih.tiles.length;
	}
    }

    var highWater = new IKRS.BoundingBox3();

    var oldIndent = options.indent;
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
	var boundingBox = new IKRS.BoundingBox3()
	buffer.push( this.indent + '<g id="Tile_'+ i +'">\n');
	this.indentInc();
	this.girih.tiles[i].toSVG( options, "", buffer, boundingBox );
	this.indentDec();
	buffer.push( this.indent + '</g>\n');

	highWater.evaluatePoint(boundingBox)
console.log("gCH.toSVG: check " + buffer.length);
    }
console.log("gCH.toSVG: mid");

    options.indent = oldIndent;


    svgPreamble = this.getSVGForeword( highWater);
    svgTrailer = this.getSVGAfterword();

    // put the pieces together
    buffer.unshift( svgPreamble)
    buffer.push( svgTrailer)
//console.log("gCH.toSVG:" + buffer.join(""))
    return buffer
}


const INDENT_INCREMENT = "    ";
const NL_STRING = "\n";


IKRS.GirihCanvasHandler.prototype.indentClear = function() {
    this.indent = "";
}

IKRS.GirihCanvasHandler.prototype.indentInc = function() {
    this.indent += INDENT_INCREMENT;
}


IKRS.GirihCanvasHandler.prototype.indentDec = function() {
    this.indent = this.indent.slice( INDENT_INCREMENT.length);
}

// ### BEGIN DRAW METHOD TESTING ##############################################

IKRS.GirihCanvasHandler.prototype._drawCircleTest = function() {


    var circleA = new IKRS.Circle( IKRS.Point2.ZERO_POINT,
				   50
				 );
    var circleB = new IKRS.Circle( new IKRS.Point2( 50, 50 ),
				   75
				 );

    this._drawCircleIntersections( circleA, circleB );
};


IKRS.GirihCanvasHandler.prototype._drawCircleIntersections = function( circleA, circleB ) {

    var intersection = circleA.computeIntersectionPoints( circleB );
    if( intersection ) {
	this._drawCrosshairAt( intersection.pointA, false );
	this._drawCrosshairAt( intersection.pointB, false );
    }
    this._drawCircle( circleA );
    this._drawCircle( circleB );

};


IKRS.GirihCanvasHandler.prototype._drawCircle = function( circle ) {
    this.context.strokeStyle = "#FF0000";
    this.context.beginPath();
    this.context.arc( circle.center.x * this.zoomFactor + this.drawOffset.x,
		      circle.center.y * this.zoomFactor + this.drawOffset.y,
		      circle.radius * this.zoomFactor,
		      0,
		      2 * Math.PI
		    );
    this.context.stroke();
};


IKRS.GirihCanvasHandler.prototype._drawLineIntersectionTest = function() {

    var lineA = new IKRS.Line2( new IKRS.Point2(10, 10),
				new IKRS.Point2(120, 120)
			      );
    var lineB = new IKRS.Line2( new IKRS.Point2(100, 30),
				new IKRS.Point2(10, 150)
			      );
    this._drawLine( lineA );
    this._drawLine( lineB );
    var intersectionPoint = lineA.computeEdgeIntersection( lineB );
    if( intersectionPoint ) {
	this._drawCrosshairAt( intersectionPoint, false );
    } else {
	DEBUG( "No intersection found." );
    }
};


IKRS.GirihCanvasHandler.prototype._drawLine = function( line ) {
    this.context.beginPath();
    this.moveToXY( line.pointA.x,  line.pointA.y)
    this.lineToXY( line.pointB.x,  line.pointB.y)
    this.context.strokeStyle = "#0000FF";
    this.context.stroke();
};

// ### END DRAW METHOD TESTING ################################################

IKRS.GirihCanvasHandler.prototype.constructor = IKRS.GirihCanvasHandler;
