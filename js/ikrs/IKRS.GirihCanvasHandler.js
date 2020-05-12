/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2020-05-12 Kirk Carlson (converted to use Turtle and Indent classes; and cleanup)
 * @version 1.0.0
 **/


IKRS.GirihCanvasHandler = function( imageObject ) {

    IKRS.Object.call( this );

    this.imageObject               = imageObject; // texture for tiles

    this.canvas                    = document.getElementById("girih_canvas");
    this.canvasWidth               = this.canvas.width;
    this.canvasHeight              = this.canvas.height;
    this.canvasCenter              = new IKRS.Point2( this.canvasWidth/2, this.canvasHeight/2);
    // Make a back-reference for event handling
    this.canvas.girihCanvasHandler = this;

    this.context                   = this.canvas.getContext( "2d" );

    this.drawOffset                = this.canvasCenter.clone();
    this.zoomFactor                = 1.0;

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

            adjacentTile = this.girihCanvasHandler._resolveCurrentAdjacentTilePreset(
                     tile,
                     tile._props.highlightedEdgeIndex,
                   );
        }
    }

    if( adjacentTile) {
        this.girihCanvasHandler._performAddCurrentAdjacentPresetTile();
    } else { // No adjacent tile found for this location
        this.girihCanvasHandler._clearSelection();
        this.girihCanvasHandler.girih.tiles[tileIndex]._props.selected = true;
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

    if (highlightedEdgeIndex >= 0) {
        if (hoverTileIndex == undefined) {
            console.log( "hooverTileIndex is undefined");
        };
        if (highlightedEdgeIndex == undefined) {
            console.log( "highlightedEdgeIndex is undefined");
        };
        if (hoverTile.position == undefined) {
            console.log( "hoverTile.position is undefined");
        };
        if (hoverTile.connectors[highlightedEdgeIndex] == undefined) {
            console.log( "hoverTile.connectors{ highlightedEdge] is undefined");
        };
        DEBUG( "[mouseMoved] hoverTileIndex=" + hoverTileIndex +
               ", highlightedEdgeIndex=" + highlightedEdgeIndex +
               ", hoverTile.position=" + hoverTile.position.toString() +
               ", connector.position=" + hoverTile.connectors[ highlightedEdgeIndex].point.toString()
             );

        hoverTile._props.highlightedEdgeIndex = highlightedEdgeIndex;
        // Were there any changes at all?
        if( oldHoverTileIndex != hoverTileIndex || oldHighlightedEdgeIndex != highlightedEdgeIndex ) {
            this.girihCanvasHandler.redraw();
        }
    }
};


IKRS.GirihCanvasHandler.prototype._locateTileAtPoint = function( point ) {
    for( var i = this.girih.tiles.length-1; i >= 0; i-- ) {

        // Ignore Penrose-Tile?
        if( this.girih.tiles[i].tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS &&
            !this.getProperties().allowPenroseTile ) {
            continue;
        }

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
    // maps various keycodes to actions
    if( e.keyCode == 39 || e.keyCode == 68 ) { //right, d
        this.girihCanvasHandler.adjacentTileOptionPointer++;
        this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 37 || e.keyCode == 65) { //left, a
        this.girihCanvasHandler.adjacentTileOptionPointer =
                (this.girihCanvasHandler.adjacentTileOptionPointer +
                possiblePositions.length - 1) % possiblePositions.length;
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

    var optionIndex = (this.adjacentTileOptionPointer + possiblePositions.length) %
            possiblePositions.length;
    var proposedPosition    = possiblePositions[ optionIndex];

    //find the position of the hovered tile vertex
    var face = IKRS.Girih.TILE_FACES [currentTile.tileType][highlightedEdgeIndex];
    var turtle = new Turtle();

    turtle.toXY( currentTile.position.x, currentTile.position.y) // at currrent center
    turtle.toAD( currentTile.angle + face.centralAngle,
                  currentTile.size * face.radialCoefficient) // at highlighted edge vertex
    turtle.toaD( Math.PI + face.angleToNextVertex - face.angleToCenter,
                  currentTile.size * face.lengthCoefficient); // at next vertex

    var proposedFace = IKRS.Girih.TILE_FACES [proposedPosition.tileType]
                                             [proposedPosition.startVertex];
    turtle.toaD( Math.PI - proposedFace.angleToNextVertex + proposedFace.angleToCenter,
              currentTile.size * proposedFace.radialCoefficient) // at adjacent center
    var proposedCenter = turtle.position;


    var proposedTileAngle = (turtle.angle - proposedFace.centralAngle +
                             Math.PI) % (2* Math.PI);


    //create the new tile
    var proposedTile;
    switch( proposedPosition.tileType ) {
    case IKRS.Girih.TILE_TYPE_DECAGON:
        proposedTile = new Decagon( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case IKRS.Girih.TILE_TYPE_PENTAGON:
        proposedTile = new Pentagon( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON:
        proposedTile = new IrregularHexagon( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case IKRS.Girih.TILE_TYPE_RHOMBUS:
        proposedTile = new Rhombus( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case IKRS.Girih.TILE_TYPE_BOW_TIE:
        proposedTile = new BowTie( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS:
        proposedTile = new PenroseRhombus( currentTile.size, proposedCenter, proposedTileAngle);
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
    this.lastTileCount = -1; //force redo of connectors
    this.redraw();
};


IKRS.GirihCanvasHandler.prototype.addTile = function( tile ) {

    // Add internal properties to the tile
    tile._props = { selected:              false,
                    hovered:               false,
                    highlightedEdgeIndex:  -1,
                  };
    this.girih.addTile( tile );
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
    var imgBounds = new IKRS.BoundingBox2(
            tile.imageProperties.source.x * imageObject.width,
            (tile.imageProperties.source.x + tile.imageProperties.source.width) * imageObject.width,
            tile.imageProperties.source.y * imageObject.height,
            (tile.imageProperties.source.y + tile.imageProperties.source.height) * imageObject.height
          );
    var polyImageRatio = new IKRS.Point2(
            originalBounds.getWidth() / imgBounds.getWidth(),
            originalBounds.getHeight() / imgBounds.getHeight()
          );

// RED FLAG!!! (kirk) this needs something in the context to clip, say a polygon
// at this point not sure what all this other stuff is doing, seems complex
// at a minimum it needs a context with the polygon scribed.
    this.context.clip();
    var imageX = this.drawOffset.x + tile.position.x * this.zoomFactor +
            originalBounds.xMin * this.zoomFactor;
    var imageY = this.drawOffset.y + tile.position.y * this.zoomFactor +
            originalBounds.yMin * this.zoomFactor;
    var imageW = (originalBounds.getWidth() +
            tile.imageProperties.destination.xOffset * imageObject.width * polyImageRatio.x) *
            this.zoomFactor;
    var imageH = (originalBounds.getHeight() +
            tile.imageProperties.destination.yOffset*imageObject.height*polyImageRatio.y) *
            this.zoomFactor;

    this.context.translate( imageX + imageW/2.0,
                            imageY + imageH/2.0
                          );

    this.context.rotate( tile.angle );

    var drawStartX = (-originalBounds.getWidth()/2.0) * this.zoomFactor;
    var drawStartY = (-originalBounds.getHeight()/2.0) * this.zoomFactor;
    this.context.drawImage(
            imageObject,
            tile.imageProperties.source.x * imageObject.width,             // source x
            tile.imageProperties.source.y * imageObject.height,            // source y
            tile.imageProperties.source.width * imageObject.width,         // source width
            tile.imageProperties.source.height * imageObject.height,       // source height
            drawStartX + tile.imageProperties.destination.xOffset *
                imageObject.width * polyImageRatio.x * 0.5 * this.zoomFactor, // destination x
            drawStartY + tile.imageProperties.destination.yOffset *
                imageObject.height * polyImageRatio.y * 0.5 * this.zoomFactor,// destination y
            (originalBounds.getWidth() - tile.imageProperties.destination.xOffset *
                imageObject.width * polyImageRatio.x) * this.zoomFactor,   // destination width
            (originalBounds.getHeight() - tile.imageProperties.destination.yOffset *
                imageObject.height * polyImageRatio.y) * this.zoomFactor   // destination height
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
        this._drawTileFromFaces(tile, this.drawProperties.polygonStrokeColor)
    } else {
        this._drawTileFromFaces(tile, "transparent");
    }

    // the following relys on polygon context set from _drawTileFromFaces above
    if( this.drawProperties.drawTextures) {
       this._drawTextures( tile, this.imageObject, tileBounds)
    };


    // the following relys on polygon context set from _drawTileFromFaces above
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

            tile.drawFancyStrapping( this.context, {
                     capGap: this.capGap(),
                     strappingWidth: this.drawProperties.strappingWidth,
                     strappingStrokeWidth: this.drawProperties.strappingStrokeWidth,
                     strappingStrokeColor: this.drawProperties.strappingStrokeColor,
                     strappingFillColor: this.drawProperties.strappingFillColor,
                                  });

        } else {
            this._drawSimpleStrapping( tile);
        }
    };
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
 *  _findStrapSegmentPoints -- find the points for a double girih strap segment
 *
 *  parameters:
 *    options (sub parameters are named and can be in any order)
 *      distance is the nominal length of the line in pixels (required)
 *      spacing is the distance between twin line centers in pixels
 *      startAngle is the cut angle at the start of the line with respect to the turtle
 *      endAngle is the cut angle at the end of the line with respect to the turtle
 *      startCap is true when a start cap is desired
 *      endCap is true when an end cap is desired
 *      fillStyle is optional style parameter used to fill shape
 *      fillOpacity is optional style parameter used to fill shape
 *
 *      turtle is a turtle object and is required
 *          turtle.position is the start point
 *          turtle.angle is the segment angle
 *
 *  returns:
 *    an array of 7 points:
 *       1               2
 *       0,5             6
 *       4               3
 *    turtle.position is the end point
 *    turtle.angle is the segment angle
 *************************************************************************/
_findStrapSegmentPoints = function( {
                                      //distance,
                                      spacing = 4,
                                      startAngle = Math.PI/2,
                                      endAngle = Math.PI/2,
                                      startCap = true,
                                      endCap = true,
                                      fillStyle = this.drawProperties.strappingFillColor,
                                      fillOpacity = 1,
                                    }) {
    // compute the real distances and angles needed
    var options = arguments[0];
    var startRightDist = options.spacing / 2 / Math.tan( -options.startAngle);
    var endRightDist = options.spacing / 2 / Math.tan( -options.endAngle);
    var startLeftDist = -startRightDist;
    var endLeftDist = -endRightDist;
    var startDiag = Math.abs( options.spacing / Math.sin( options.startAngle));
    var endDiag = Math.abs( options.spacing / Math.sin( -options.endAngle));
    var points = [];

    // just exactly which turtle is this routine using? it is working OK
    points.push( turtle.position); //start point 0
    points.push( turtle.toaD( options.startAngle, startDiag/2).position); //half of start cap 1
    points.push( turtle.toaD( -options.startAngle,
                     options.distance + startRightDist + endRightDist).position); // left side 2
    points.push( turtle.toaD( -options.endAngle, endDiag).position); // end cap 3
    points.push( turtle.toaD( options.endAngle + 10* piTenths,
                     options.distance + startLeftDist + endLeftDist).position); // right side 4
    points.push( turtle.toaD( options.startAngle - 10* piTenths,
                     startDiag/2).position); // other half of start cap 5
    points.push( turtle.toaD( -options.startAngle, options.distance).position); // end of segment 6

    return points;
}


/**************************************************************************
 *  drawStrapSegment -- draw a double girih strap segment with slanted ends
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  parameters: (parameters are named and can be in any order)
 *    canvasContext is the canvas to be drawn upon
 *    options is a dictionary with the following:
 *      distance is the nominal length of the line in pixels (required)
 *      spacing is the distance between twin line centers in pixels
 *      startAngle is the cut angle at the start of the line with respect to the turtle
 *      endAngle is the cut angle at the end of the line with respect to the turtle
 *      startCap is true when a start cap is desired
 *      endCap is true when an end cap is desired
 *      fillStyle is optional style parameter used to fill shape
 *      fillOpacity is optional style parameter used to fill shape
 *      strokeStroke is optional style of the stroked line
 *      strokeOpacity is optional opacity of the stroked line (0..1)
 *      strokeWidth is optional width of the stroked line in pixels
 *      turtle is a turtle object and is required
 *          turtle.position is the start point
 *          turtle.angle is the segment angle
 *
 *  returns:
 *    turtle.position is the end point
 *    turtle.angle is the segment angle
 *************************************************************************/
IKRS.GirihCanvasHandler.prototype.drawStrapSegment = function( canvasContext, {
        //distance,
        spacing = 4,
        startAngle = Math.PI/2,
        endAngle = Math.PI/2,
        startCap = true,
        endCap = true,
        fillStyle = this.drawProperties.strappingFillColor,
        fillOpacity = 1,
        strokeStyle = this.drawProperties.strappingStrokeColor,
        strokeLineWidth = this.drawProperties.strappingStrokeWidth,
    }) {
    var options = arguments[1];
    var points = _findStrapSegmentPoints( options); // uses the turtle

    var zoomFactor = this.zoomFactor;
    var drawOffset = this.drawOffset;
    canvasContext.lineToPoint = function ( point) {
        canvasContext.lineTo( point.x * zoomFactor + drawOffset.x,
                              point.y * zoomFactor + drawOffset.y)
    }

    canvasContext.moveToPoint = function ( point) {
        canvasContext.moveTo( point.x * zoomFactor + drawOffset.x,
                              point.y * zoomFactor + drawOffset.y)
    }

    canvasContext.beginPath();
    canvasContext.moveToPoint( points [4]); //start
    canvasContext.lineToPoint( points [1]); // start cap
    canvasContext.lineToPoint( points [2]); // left side
    canvasContext.lineToPoint( points [3]); // end cap
    canvasContext.lineToPoint( points [4]); // right side
    //canvasContext.lineWidth = 0;
    canvasContext.fillStyle = options.fillStyle;
    canvasContext.fillOpacity = 1;
    canvasContext.closePath();
    canvasContext.fill();

    // stroke the segment for the lines
    canvasContext.beginPath();
/*
    if (startCap) {
        canvasContext.lineToPoint( points [0]); //half of start cap, should not be necessary
        canvasContext.lineToPoint( points [1]); //half of start cap
    } else {
        canvasContext.moveToPoint( points [1]); //half of start cap
    }
    canvasContext.lineToPoint( points [2]); // left side
    if( endCap) {
        canvasContext.lineToPoint( points [3]); // end cap
    } else {
        canvasContext.moveToPoint( points [3]); // end cap
    }
    canvasContext.lineToPoint( points [4]); // right side
    if ( startCap) {
        canvasContext.lineToPoint( points [0]); // restore angle
    } else {
        canvasContext.moveToPoint( points [0]); // restore angle
    }
*/

    if (startCap) {
        canvasContext.moveToPoint( points [4]); //half of start cap, should not be necessary
        canvasContext.lineToPoint( points [1]); //half of start cap
    } else {
        canvasContext.moveToPoint( points [1]); //half of start cap
    }
    canvasContext.lineToPoint( points [2]); // left side
    if( endCap) {
        canvasContext.lineToPoint( points [3]); // end cap
    } else {
        canvasContext.moveToPoint( points [3]); // no end cap
    }
    canvasContext.lineToPoint( points [4]); // right side
    canvasContext.strokeStyle = options.strokeStyle;
    //this.context.fillStyle = "";
    canvasContext.lineWidth = options.strokeLineWidth;
    canvasContext.stroke();
}


const IKRS_SVG_DECIMALS = 3;

function _round (number, decimals = IKRS_SVG_DECIMALS) {
    var rounder = Math.pow( 10, decimals);
    return Math.round(number * rounder) / rounder;
}

function svgPointString( point) {
   return _round( point.x) +' '+ _round( point.y);
}


/**************************************************************************
 *  getStrapSegmentSVG -- get the SVG for a girih strap segment
 *
 *  parameters:
 *    options (parameters are named and can be in any order)
 *      distance is the nominal length of the line in pixels (required)
 *      spacing is the distance between twin line centers in pixels
 *      startAngle is the cut angle at the start of the line with respect to the turtle
 *      endAngle is the cut angle at the end of the line with respect to the turtle
 *      startCap is true when a start cap is desired
 *      endCap is true when an end cap is desired
 *      fillStyle is optional style parameter used to fill shape
 *      fillOpacity is optional style parameter used to fill shape
 *      strokeStroke is optional style of the stroked line
 *      strokeOpacity is optional opacity of the stroked line (0..1)
 *      strokeWidth is optional width of the stroked line in pixels
 *      segmentClass is a string naming the segment
 *      turtle is a turtle object and is required
 *        turtle.position is the start point
 *        turtle.angle is the segment angle
 *    buffer to hold the SVG strings produced
 *    indent object to access indentation
 *
 *  returns:
 *    turtle.position is the end point
 *    turtle.angle is the segment angle
 *************************************************************************/
IKRS.GirihCanvasHandler.prototype.getStrapSegmentSVG = function(  options, buffer, indent) {
    var points = _findStrapSegmentPoints( options); // uses the turtle
    var svgLine = [] ;

    svgLine.push( svgString = indent.now + '<path class="gfill '+ options.segmentClass +'" d="');
    svgLine.push( 'M' + svgPointString( points[0])); // start point
    svgLine.push( 'M' + svgPointString( points[1])); // half start cap
    svgLine.push( 'M' + svgPointString( points[2])); // left side
    svgLine.push( 'M' + svgPointString( points[3])); // end cap
    svgLine.push( 'M' + svgPointString( points[4])); // right side
    svgLine.push( 'M' + svgPointString( points[0])); // other half start cap
    svgLine.push( '"/>' + indent.eol);
    buffer.push( svgLine.join( ""));

    // stroke the segment for the lines
    var svgLine = [] ;
    svgLine.push( indent.now + '<path class="gstroke '+ options.segmentClass +'" d="');
    // ...handle individual style for this segment
    if (options.startCap) {
        svgLine.push( 'M' + svgPointString( points [0])); //half of start cap
        svgLine.push( 'L' + svgPointString( points [1])); //half of start cap
    } else {
        svgLine.push( 'M' + svgPointString( points [1])); //start of left side
    }
    svgLine.push( 'L' + svgPointString( points [2])); // left side
    if( options.endCap) {
        svgLine.push( 'L' + svgPointString( points [3])); // end cap
    } else {
        svgLine.push( 'M' + svgPointString( points [3])); // end cap
    }
    svgLine.push( 'L' + svgPointString( points [4])); // right side
    if ( options.startCap) {
        svgLine.push( 'L' + svgPointString( points [0])); // other half of start cap
    }
    svgLine.push( '"/>' + indent.eol);
    buffer.push( svgLine.join( ""));

    return
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

    this.context.beginPath();
    var point      = points[0].clone();
    var startPoint = point.clone();
    this.context.moveTo( point.x * this.zoomFactor + this.drawOffset.x,
                         point.y * this.zoomFactor + this.drawOffset.y
                       );

    var bounds = new IKRS.BoundingBox2( point.x, point.y, point.x, point.y );

    for( var i = 1; i < points.length; i++ ) {

        point.set( points[i] );
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
};




IKRS.GirihCanvasHandler.prototype._drawTileFromFaces = function( tile, strokeColor) {
    var turtle = new Turtle();
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var face = faces[0];


    this.context.beginPath();
    turtle.toXY( tile.position.x, tile.position.y);
    turtle.toAD( tile.angle + face.centralAngle,
                              face.radialCoefficient * tile.size);
    this.context.moveTo( turtle.position.x * this.zoomFactor + this.drawOffset.x,
                         turtle.position.y * this.zoomFactor + this.drawOffset.y)

    turtle.toaD( Math.PI - face.angleToCenter, 0);
    for (var i = 0; i< faces.length; i++) {
        //face = faces[ i % faces.length]
        face = faces[ i]
        turtle.toaD( face.angleToNextVertex, tile.size * face.lengthCoefficient);
        this.context.lineTo( turtle.position.x * this.zoomFactor + this.drawOffset.x,
                             turtle.position.y * this.zoomFactor + this.drawOffset.y)
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

    var pointA = points[ highlightedEdgeIndex ].clone();
    var pointB = points[ highlightedEdgeIndex+1 < points.length ? highlightedEdgeIndex+1 : 0 ].clone();

    this.context.beginPath();
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
        if( tile.tileType == IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS &&
                !this.getProperties().drawPenroseCenterPolygon &&
                i == tile.getCenterPolygonIndex() ) {
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
    if (this.lastTileCount !== this.girih.tiles.length ||
        this.lastDrawStrappingType !== this.drawProperties.drawStrappingType) { // when tile added or deleted
        this.girih.buildAllConnectors( this.girih.tiles);
        this.girih.findConnections( this.girih.tiles);
        this.girih.findAllChains( this.girih.tiles);
        this.lastTileCount = this.girih.tiles.length;
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
    // in case the canvas has resized...
    this.canvasWidth               = this.canvas.width;
    this.canvasHeight              = this.canvas.height;

    this.context.fillStyle = this.getDrawProperties().backgroundColor; // "#F0F0F0";
    this.context.fillRect( 0, 0, this.canvasWidth, this.canvasHeight );

    if( this.getDrawProperties().drawCoordinateSystem ) {
        this._drawCoordinateSystem();
    }

    this._drawTiles();

};


//**** SVG DRAWING METHODS ****

IKRS.GirihCanvasHandler.prototype.getSVGTileFromFaces = function( tile, idStr, classStr, styleStr, boundingBox) {
// idStr is short string to uniquely identify polygon (may be "")
// classStr is short string to identify class or classes used by polygon (may be "")
// styleStr is string to apply style or other attributes to the polygon (may be "")
//     (must include attribute name and enclose attribute in double quotes
// returns an SVG string
    var turtle = new Turtle();
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
    turtle.toXY( tile.position.x, tile.position.y);

    turtle.toAD( tile.angle + face.centralAngle, face.radialCoefficient * tile.size);
    turtle.toaD( Math.PI - face.angleToCenter, 0)
    var preemble = ''
    for (var i = 0; i< faces.length; i++) {
        polygon += preemble +
                   IKRS.round( turtle.position.x, this.SVG_PRECISION) +','+ 
                   IKRS.round( turtle.position.y, this.SVG_PRECISION)
        boundingBox.evaluatePoint( turtle.position.x, turtle.position.y);// important to use translated vertices
        face = faces[ i];
        turtle.toaD( face.angleToNextVertex, tile.size * face.lengthCoefficient);
        preemble = ' ';
    }
    polygon += '"/>' + this.eol;
//console.log("svgPoly: " + polygon)
    return polygon;
}


IKRS.GirihCanvasHandler.prototype.getSVG = function( options,
                                                     polygonStyle
                                                   ) {

    var buffer  = [];
    if( typeof options == "undefined" ) {
        options = this.drawProperties;
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
        // make the id match the id generated by the SVG routines
        id = id.replace(/^0+/,'');
        if (id === '') {
            id = '0';
        }
       css += ".chain_length_"+ id + ` .gfill {
    fill:rgb(` + Math.round( Math.random()*255 ) + `,` +
                 Math.round( Math.random()*255 ) + `,` +
                 Math.round( Math.random()*255 ) + `);
}
`;
    }
    return css
}

IKRS.GirihCanvasHandler.prototype._getSVGMultipleChainClasses = function() {
    var members = [];
    css = '';
    // build css for chains of more than one line to do random colors
    for (chainIndex = 0; chainIndex < this.girih.chains.length; chainIndex++) {
        chain = this.girih.chains[ chainIndex];
        if (chain.links.length > 1) {
            //**HERE DOCUMENT***
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

    //**HERE DOCUMENT***
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

    if (this.drawProperties.drawStrappingType === "fancy" ) {
        foreword += this._getSVGSimilarChainClasses();
    } else if (this.drawProperties.drawStrappingType === "random") {
        foreword += this._getSVGSimilarChainClasses();
        foreword += this._getSVGMultipleChainClasses();
    }

    //**HERE DOCUMENT***
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
    //**HERE DOCUMENT***
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

    var indent = new Indent( "    ", "\n");
    var returnBuffer = false;
    if( typeof buffer == "undefined" || !buffer ) {
        buffer = [];
    }

    if (polygonStyle === undefined) {
        polygonStyle = ""
    }
    if (fontStyle === undefined) {
        fontStyle = "font:10pt normal Helvetica, Ariel, sans-serif;"
    }

    // find all of the chains (if not already done)
    if( this.drawProperties.drawStrapping &&
           (this.drawProperties.drawStrappingType === "fancy" ||
            this.drawProperties.drawStrappingType === "random")) {
        if (this.lastTileCount !== this.girih.tiles.length ||
            this.lastDrawStrappingType !== this.drawProperties.drawStrappingType) { // when tile added or deleted
            this.girih.buildAllConnectors( this.girih.tiles);
            this.girih.findConnections( this.girih.tiles);
            this.girih.findAllChains( this.girih.tiles);
            this.lastTileCount = this.girih.tiles.length;
        }
    }

    var highWater = new IKRS.BoundingBox3();

    for( var i = 0; i < this.girih.tiles.length; i++ ) {
        var boundingBox = new IKRS.BoundingBox3()
        buffer.push( indent.now + '<g id="Tile_'+ i +'">' + indent.eol);
        indent.inc();
        this.girih.tiles[i].toSVG( options, "", buffer, boundingBox, indent );
        indent.dec();
        buffer.push( indent.now + '</g>'+ indent.eol);

        highWater.evaluatePoint(boundingBox)
    }


    svgPreamble = this.getSVGForeword( highWater);
    svgTrailer = this.getSVGAfterword();

    // put the pieces together
    buffer.unshift( svgPreamble)
    buffer.push( svgTrailer)
    return buffer
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
