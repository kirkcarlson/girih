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

    this.position                  = new IKRS.Point2( 0,0);
    this.angle                     = 0;

    this.girih                     = new IKRS.Girih();

    this.drawProperties            = { drawCoordinateSystem:       true,  // Currently not editable (no UI component)
				       drawBoxes:                  false,
				       drawOutlines:               true,
				       drawTextures:               true,
				       drawInnerPolygons:          true,
				       drawStrapping:              true,
				       drawStrappingType:          "simple",
				       innerRandomColorFill:       false, //true
				       outerRandomColorFill:       false,
				       backgroundColor:            "#ffffff",

				       polygonStrokeColor:         "#00003f",
				       polygonSelectedStrokeColor: "#e80088",
				       polygonFillColor:           "#ffffff",
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


// globals used by the vector graphics
IKRS.GirihCanvasHandler.piTenths = 2 * Math.PI /20; // basic Girih angle = 18 degrees
IKRS.GirihCanvasHandler.lineSpacing = 1//5;
IKRS.GirihCanvasHandler.gap = 0.5;
IKRS.GirihCanvasHandler.lineWidth = 0//0.5;

var piTenths    = IKRS.GirihCanvasHandler.piTenths;
//var lineSpacing = IKRS.GirihCanvasHandler.lineSpacing;
//var gap         = IKRS.GirihCanvasHandler.gap;
//var lineWidth   = IKRS.GirihCanvasHandler.lineWidth;
//var cGap        = IKRS.GirihCanvasHandler.cGap;


IKRS.GirihCanvasHandler.prototype.setTextureImage = function( imageObject,
							      redraw
							    ) {
    this.imageObject = imageObject;
    if( redraw ) {
	this.redraw();
    }
};

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

    if( !adjacentTile) {
	// Not adjacent tile found for this location
	//  -> select tile

	// Clear all selection
	this.girihCanvasHandler._clearSelection();

	// Set the tile's 'selected' state
	this.girihCanvasHandler.girih.tiles[tileIndex]._props.selected = true;
	// DEBUG( "[mouseDown] tileIndex=" + tileIndex + ", selected=" + his.girihCanvasHandler.tiles[tileIndex]._props.selected );
	this.girihCanvasHandler.redraw();
    } else {
	this.girihCanvasHandler._performAddCurrentAdjacentPresetTile();
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

    DEBUG( "[mouseMoved] hoverTileIndex=" + hoverTileIndex + ", highlightedEdgeIndex=" + highlightedEdgeIndex + ", hoverTile.position=" + hoverTile.position.toString() + ", hoverTile.angle=" + _angle2constant(hoverTile.angle) );

    hoverTile._props.highlightedEdgeIndex = highlightedEdgeIndex;
    // Were there any changes at all?
    if( oldHoverTileIndex != hoverTileIndex || oldHighlightedEdgeIndex != highlightedEdgeIndex ) {
	this.girihCanvasHandler.redraw();
    }
};

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
    }
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

IKRS.GirihCanvasHandler.prototype.old_resolveCurrentAdjacentTilePreset = function( tileType,
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

    if( !points || highlightedEdgeIndex == -1 ) {
	return;
    }

    // Adjacent tile presets available for this tile/edge/option?
    if( !IKRS.Girih.TILE_ALIGN[tileType] ) {
	return;
    }

    if( !IKRS.Girih.TILE_ALIGN[tileType][highlightedEdgeIndex] ) {
	return;
    }

    var presets = IKRS.Girih.TILE_ALIGN[tileType][highlightedEdgeIndex];

    // Has any adjacent tiles at all?
    // (should, but this prevents the script from raising unwanted exceptions)
    if( !presets || presets.length == 0 ) {
	return null;
    }


    var optionIndex = this.adjacentTileOptionPointer % presets.length;
    if( optionIndex < 0 ) {
	optionIndex = presets.length + optionIndex;
    }

    var tileAlign      = presets[optionIndex];


    var tile = tileAlign.createTile();

    // Make position relative to the hovered tile
    tile.position.add( position );
    tile.position.rotate( position, angle );
    tile.angle += angle;

    return tile;
};

IKRS.GirihCanvasHandler.prototype._resolveCurrentAdjacentTilePreset = function( currentTile,
										highlightedEdgeIndex,
									      ) {

/*
currentTile, //.tileType, .position, .angle
highlightedEdgeIndex,
*/
    if( highlightedEdgeIndex == -1 ) {
	return;
    }


    //var presets = IKRS.Girih.TILE_ALIGN[tileType][highlightedEdgeIndex];

/*
    this.tileType   = tileType;
    this.edgeLength = edgeLength;
    this.position   = position;
    this.angle      = angle;
*/

    // want to use the possibles, which are the same for all tiles and edges
    var optionIndex = (this.adjacentTileOptionPointer + possiblePositions.length) % possiblePositions.length;
    var optionIndex = (this.adjacentTileOptionPointer + possiblePositions.length) % possiblePositions.length;
    var proposedPosition    = possiblePositions[ optionIndex];
//PossiblePosition = function ( tileType, startVertex, matesWithLeftVertex) {


    //find the position of the hovered tile vertex
    var face = IKRS.Girih.TILE_TYPES [currentTile.tileType][highlightedEdgeIndex];
console.log("edge:"+ highlightedEdgeIndex +" face:"+ face.toString() +" size:"+ currentTile.size +" position:"+ currentTile.position.toString());

    var vertexAngle = face.centralAngle + currentTile.angle;

    var vertexPosition = new IKRS.Point2 (
            currentTile.position.x + face.radialCoefficient * currentTile.size * Math.cos( vertexAngle),
            currentTile.position.y + face.radialCoefficient * currentTile.size * Math.sin( vertexAngle));
    //find the angle of the selected edge
    //var edgeAngle = vertexAngle - face.angleToCenter + face.angleToNextVertex;
    var edgeAngle = vertexAngle - face.angleToCenter + face.angleToNextVertex - Math.PI;

    //advance along edge the length of the proposed tile edge
    var proposedFace = IKRS.Girih.TILE_TYPES [proposedPosition.tileType][proposedPosition.startVertex];
    var vertexPosition2 = new IKRS.Point2 (
            vertexPosition.x + proposedFace.lengthCoefficient * currentTile.size * Math.cos( edgeAngle),
            vertexPosition.y + proposedFace.lengthCoefficient * currentTile.size * Math.sin( edgeAngle));

    //find the proposed tile center from current location
    //var proposedAngleToCenter = (edgeAngle + proposedFace.angleToNextVertex - proposedFace.angleToCenter);
    //var proposedAngleToCenter = (edgeAngle - proposedFace.angleToCenter);
    var proposedAngleToCenter = (Math.PI + edgeAngle - proposedFace.angleToNextVertex + proposedFace.angleToCenter);
    var proposedCenter = new IKRS.Point2 (
            vertexPosition2.x + proposedFace.radialCoefficient * currentTile.size * Math.cos( proposedAngleToCenter),
            vertexPosition2.y + proposedFace.radialCoefficient * currentTile.size * Math.sin( proposedAngleToCenter));
    //find the new tile angle
    //var proposedTileAngle = proposedAngleToCenter + proposedFace.centralAngle;
    var proposedTileAngle = proposedAngleToCenter - proposedFace.centralAngle + Math.PI;
    //create the new tile (position, angle)
console.log("new center:"+ proposedCenter.toString() + " hover vertex:" + vertexPosition.toString())


    switch( proposedPosition.tileType ) {
    case IKRS.Girih.TILE_TYPE_DECAGON:
	var proposedTile = new IKRS.Tile.Decagon(          currentTile.size, proposedCenter, proposedTileAngle, "#FFF" );
	break;
    case IKRS.Girih.TILE_TYPE_PENTAGON:
	var proposedTile = new IKRS.Tile.Pentagon(         currentTile.size, proposedCenter, proposedTileAngle, "#FFF" );
	break;
    case IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON:
	var proposedTile = new IKRS.Tile.IrregularHexagon( currentTile.size, proposedCenter, proposedTileAngle, "#FFF" );
	break;
    case IKRS.Girih.TILE_TYPE_RHOMBUS:
	var proposedTile = new IKRS.Tile.Rhombus(          currentTile.size, proposedCenter, proposedTileAngle, "#FFF" );
	break;
    case IKRS.Girih.TILE_TYPE_BOW_TIE:
	var proposedTile = new IKRS.Tile.BowTie(           currentTile.size, proposedCenter, proposedTileAngle, "#FFF" );
	break;
    case IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS:
	var proposedTile = new IKRS.Tile.PenroseRhombus(   currentTile.size, proposedCenter, proposedTileAngle, "#FFF" );
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

    // Finally: the adjacent tile position might not be acurate.
    //          Make some fine tuning.
/*
    var currentEdgePointA = tile.getTranslatedVertex( tile._props.highlightedEdgeIndex );
    var currentEdgePointB = tile.getTranslatedVertex( tile._props.highlightedEdgeIndex+1 );
    var tolerance         = 5.0;
    var adjacentEdgeIndex = adjacentTile.locateAdjacentEdge( currentEdgePointA,
							     currentEdgePointB,
							     tolerance
							   );
    var adjacentEdgePointA;
    var adjacentEdgePointB;
    var pointDifferences;
    // Swap edge points?
    if( adjacentEdgeIndex != -1 ) {

	// An even edge.
	adjacentEdgePointA = adjacentTile.getTranslatedVertex( adjacentEdgeIndex );
	adjacentEdgePointB = adjacentTile.getTranslatedVertex( adjacentEdgeIndex+1 );

    } else if( (adjacentEdgeIndex = adjacentTile.locateAdjacentEdge(currentEdgePointB,currentEdgePointA,tolerance)) != -1 ) {

	// An odd edge: Swapped points (reverse edge)
	adjacentEdgePointA = adjacentTile.getTranslatedVertex( adjacentEdgeIndex+1 );
	adjacentEdgePointB = adjacentTile.getTranslatedVertex( adjacentEdgeIndex );
    }

    if( adjacentEdgeIndex != -1 ) {

	pointDifferences = [ adjacentEdgePointA.clone().sub( currentEdgePointA ),
			     adjacentEdgePointB.clone().sub( currentEdgePointB )
			   ];
	// Calculate average difference
	var avgDifference = IKRS.Point2.ZERO_POINT.clone();
	for( var i = 0; i < pointDifferences.length; i++ ) {
	    avgDifference.add( pointDifferences[i] );
	}
	avgDifference.x /= pointDifferences.length;
	avgDifference.y /= pointDifferences.length;
	adjacentTile.position.sub( avgDifference );
    }
*/

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


IKRS.GirihCanvasHandler.prototype._locateTileAtPoint = function( point ) {

    for( var i = this.girih.tiles.length-1; i >= 0; i-- ) {

	// Ignore Penrose-Tile?
//if( typeof this.girih.tiles[i].tileType !== "undefined") console.log(".tileType:" + this.girih.tiles[i].tileType);
	if( this.girih.tiles[i].tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS && !this.getProperties().allowPenroseTile ) {
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
    //if( this.drawProperties.drawOutlines || this.drawProperties.drawTextures) {
    if( this.drawProperties.drawOutlines) {
	this.drawPolygonFromFaces(tile, this.drawProperties.polygonStrokeColor)
    } else {
	//this.drawPolygonFromFaces(tile, this.drawProperties.backgroundColor)
//	this.drawPolygonFromFaces(tile, tileColor)
	this.drawPolygonFromFaces(tile, "transparent");
    }

    // the following relys on polygon context set from drawPolygonFromFaces above
    if( this.drawProperties.drawTextures) {
       this._drawTextures( tile, this.imageObject, tileBounds)
    };


    // the following relys on polygon context set from drawPolygonFromFaces above
    if( this.drawProperties.drawPolygonColor) {
        if (this.drawProperties.polygonColorType === "default") {
	    var tileColor = tile.fillColor;
            if (typeof tileColor === "string" && tileColor[0] === '#') {
	        tileColor = tile.fillColor +"80"; // add alpha channel
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
             this.drawProperties.drawStrappingType === "colored")) {
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
    this.position.x = newX;
    this.position.y = newY;
    this.context.moveTo( (this.position.x + this.drawOffset.x) * this.zoomFactor,
			 (this.position.y + this.drawOffset.y) * this.zoomFactor
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
    this.position.x = newX;
    this.position.y = newY;
/// this.context.moveTo( point.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
    this.context.lineTo( (this.position.x + this.drawOffset.x) * this.zoomFactor,
			 (this.position.y + this.drawOffset.y) * this.zoomFactor
		       );
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
IKRS.GirihCanvasHandler.prototype.lineToAD = function ( ang, len) {
    var newX = this.position.x + len * Math.cos(ang)
    var newY = this.position.y + len * Math.sin(ang)
/// this.context.lineTo( point.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
    this.context.lineTo(newX * this.zoomFactor + this.drawOffset.x,
			newY * this.zoomFactor + this.drawOffset.y);
    this.position.x = newX;
    this.position.y = newY;
    this.angle = ang;
};


/*************************************************************************
 *  lineToAD(  ang, len)
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
IKRS.GirihCanvasHandler.prototype.lineToaD = function ( ang, len) {
    var newX = this.position.x + len * Math.cos(this.angle + ang)
    var newY = this.position.y + len * Math.sin(this.angle + ang)
    this.context.lineTo(newX * this.zoomFactor + this.drawOffset.x,
			newY * this.zoomFactor + this.drawOffset.y);
    this.position.x = newX;
    this.position.y = newY;
    this.angle = this.angle + ang;
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
IKRS.GirihCanvasHandler.prototype.moveToAD = function ( ang, len) {
    var newX = this.position.x + len * Math.cos(ang)
    var newY = this.position.y + len * Math.sin(ang)
    this.position.x = newX;
    this.position.y = newY;
    this.angle = ang;
    this.context.moveTo(newX * this.zoomFactor + this.drawOffset.x,
			newY * this.zoomFactor + this.drawOffset.y);
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
IKRS.GirihCanvasHandler.prototype.moveToaD = function ( ang, len) {
    var newX = this.position.x + len * Math.cos(this.angle + ang)
    var newY = this.position.y + len * Math.sin(this.angle + ang)
    this.position.x = newX;
    this.position.y = newY;
    this.angle = this.angle + ang;
    this.context.moveTo(newX * this.zoomFactor + this.drawOffset.x,
			newY * this.zoomFactor + this.drawOffset.y);
};


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
    this.context.fill();
    this.context.closePath();

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
    this.context.stroke();
    this.context.closePath();

    // move to the end of the segment
    this.moveToaD( -startAngle, distance);
}


//kirk test code end

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

    this.context.save();

    this.context.beginPath();
    var point      = points[0].clone();
    point.rotate( IKRS.Point2.ZERO_POINT, angle );
    var startPoint = point.clone();
    this.context.moveTo( point.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 point.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
		       );


    var bounds = new IKRS.BoundingBox2( point.x, point.y, point.x, point.y );

    for( var i = 1; i < points.length; i++ ) {

	point.set( points[i] );
	point.rotate( IKRS.Point2.ZERO_POINT, angle );
	//window.alert( "point=(" + point.x + ", "+ point.y + ")" );
	this.context.lineTo( point.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			     point.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
			   );

	bounds.xMin = Math.min( point.x, bounds.xMin );
	bounds.xMax = Math.max( point.x, bounds.xMax );
	bounds.yMin = Math.min( point.y, bounds.yMin );
	bounds.yMax = Math.max( point.y, bounds.yMax );
    }
    // Close path
    this.context.lineTo( startPoint.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 startPoint.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
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

    this.context.restore();

};


IKRS.GirihCanvasHandler.prototype.drawPolygonFromFaces = function( tile, strokeColor) {
    var faces = IKRS.Girih.TILE_TYPES [tile.tileType];
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
    this.context.stroke();
    this.context.closePath();
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

    pointA.rotate( IKRS.Point2.ZERO_POINT, angle );
    pointB.rotate( IKRS.Point2.ZERO_POINT, angle );


    this.context.beginPath();
    this.context.lineTo( pointA.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 pointA.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
		       );
    this.context.lineTo( pointB.x * this.zoomFactor + this.drawOffset.x + position.x * this.zoomFactor,
			 pointB.y * this.zoomFactor + this.drawOffset.y + position.y * this.zoomFactor
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
		      Math.PI*2.0,
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
				 -1,     // hightlightedEdgeIndex
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
	if( tile.tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS && !this.getProperties().drawPenroseCenterPolygon && i == tile.getCenterPolygonIndex() ) {
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
            this.drawProperties.drawStrappingType === "colored")) {
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

    this.context.fillStyle = this.getDrawProperties().backgroundColor; // "#F0F0F0";
    this.context.fillRect( 0, 0, this.canvasWidth, this.canvasHeight );

    if( this.getDrawProperties().drawCoordinateSystem ) {
	this._drawCoordinateSystem();
    }

    this._drawTiles();

};


// ### BEGIN TESTING ##############################################
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
		      Math.PI*2
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
    // Draw line A
    this.context.moveTo( line.pointA.x * this.zoomFactor + this.drawOffset.x,
			 line.pointA.y * this.zoomFactor + this.drawOffset.y
		       );
    this.context.lineTo( line.pointB.x * this.zoomFactor + this.drawOffset.x,
			 line.pointB.y * this.zoomFactor + this.drawOffset.y
		       );

    this.context.strokeStyle = "#0000FF";
    this.context.stroke();
};

// ### END TESTING ################################################

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

    this.girih.toSVG( options,
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

IKRS.GirihCanvasHandler.prototype.constructor = IKRS.GirihCanvasHandler;
