/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2020-05-12 Kirk Carlson (converted to use Turtle and Indent classes; and cleanup)
 * @version 1.0.0
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/

class GirihCanvasHandler {
    constructor( imageObject ) {

        this.imageObject               = imageObject; // texture for tiles

        this.canvas                    = document.getElementById("girih_canvas");
        this.canvasWidth               = this.canvas.width;
        this.canvasHeight              = this.canvas.height;
        this.canvasCenter              = new Point2( this.canvasWidth/2, this.canvasHeight/2);
        // Make a back-reference for event handling
        this.canvas.girihCanvasHandler = this;

        this.context                   = this.canvas.getContext( "2d" );

        this.drawOffset                = this.canvasCenter.clone();
        this.zoomFactor                = 1.0;
        this.angle                     = 0; // angle of the image relative to coordinate
        this.circumcircle              = undefined; // circle containing all tiles

        this.girih                     = new GirihClass(); // describes a set of tiles

        this.drawProperties            = { drawCoordinateSystem:       true,  // Currently not editable (no UI component)
                                           drawBoxes:                  false,
                                           drawOutlines:               true,
                                           drawTextures:               true,
                                           drawInnerPolygons:          true,
                                           drawStrapping:              true,
                                           drawStrappingType:          "basic", // can be "basic", "fancy", "random"
                                           drawTileOrder:              false,
                                           drawCircumcircle:           "basic", // can be "basic", "fancy", "random"
                                           axesType:                   "absolute", // can be "none", "canvas", "absolute", "circumcenter"
                                           symmetry:                   "none", // can be "none", "2-fold", "5-fold", "10-fold"
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
            this.canvas.addEventListener( "wheel", this.mouseWheelHandler, false );
        } else {
            // IE
            this.canvas.onmousewheel = mouseWheelHandler;
            document.onmousewheel = mouseWheelHandler;
        }

        window.addEventListener( "keydown",   this.keyDownHandler,   false );
    }
};


//**** GLOBALS AND CONSTANTS USED BY VECTOR GRAPHIC METHODS ********************************

GirihCanvasHandler.piTenths = 2 * Math.PI /20; // basic Girih angle = 18 degrees
GirihCanvasHandler.lineSpacing = 1//5;
GirihCanvasHandler.gap = 0.5;
GirihCanvasHandler.lineWidth = 0//0.5;

GirihCanvasHandler.prototype.SVG_PRECISION = 3;
const fontStyle = "font:10pt normal Helvetica, Ariel, sans-serif;";


//just to make it easier to reference within this module
var piTenths    = GirihCanvasHandler.piTenths;


//**** MOUSE HANDLER METHODS ************************************

GirihCanvasHandler.prototype._translateMouseEventToRelativePosition = function( parent,
                                                                                     e ) {
    var rect = parent.getBoundingClientRect();
    var left = e.clientX - rect.left - parent.clientLeft + parent.scrollLeft;
    var top  = e.clientY - rect.top  - parent.clientTop  + parent.scrollTop;

    // Add draw offset :)
    var relX = (left - this.drawOffset.x) / this.zoomFactor;
    var relY = (top  - this.drawOffset.y) / this.zoomFactor;

    return new Point2( relX, relY );
};


GirihCanvasHandler.prototype.mouseWheelHandler = function( e ) {

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


GirihCanvasHandler.prototype.mouseDownHandler = function( e ) {

    var point     = this.girihCanvasHandler._translateMouseEventToRelativePosition( this, e );

    var tileIndex = this.girihCanvasHandler._locateTileAtPoint( point );
    if( tileIndex == -1 ) {
        girihCanvasHandler._clearSelection();
        girihCanvasHandler.redraw();
        return;  // click on blank space
    }

    // Adjacent tile displayed?
    var tile             = null;
    var adjacentTile     = null;
    var hoveredTileIndex = this.girihCanvasHandler._locateHoveredTile();
    if( hoveredTileIndex != -1 ) {
        tile            = this.girihCanvasHandler.girih.tiles[ hoveredTileIndex ];

        // Check if cursor is directly on center
        if( tile.position.distanceTo(point) < 8 ) {
            this.girihCanvasHandler._clearSelection();
            tile._props.selected = true;
            girihCanvasHandler.redraw();
        } else {

//            var tileBounds   = tile.computeBounds();

            adjacentTile = this.girihCanvasHandler._resolveCurrentAdjacentTilePreset(
                     tile,
                     tile._props.highlightedEdgeIndex,
                   );
            if( adjacentTile) {
                this.girihCanvasHandler._performAddCurrentAdjacentPresetTile();
//    } else { // No adjacent tile found for this location
//        this.girihCanvasHandler._clearSelection();
//        this.girihCanvasHandler.girih.tiles[tileIndex]._props.selected = true;
//        this.girihCanvasHandler.redraw();
            }
        }
    }
};


GirihCanvasHandler.prototype.mouseUpHandler = function( e ) {

};


GirihCanvasHandler.prototype.mouseMoveHandler = function( e ) {

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


GirihCanvasHandler.prototype._locateTileAtPoint = function( point ) {
    for( var i = this.girih.tiles.length-1; i >= 0; i-- ) {

        // Ignore Penrose-Tile?
        if( this.girih.tiles[i].tileType == Girih.TILE_TYPE.PENROSE_RHOMBUS &&
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


GirihCanvasHandler.prototype._locateSelectedTile = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
        if( this.girih.tiles[i]._props.selected ) {
            return i;
        }
    }
    // Not found
    return -1;
};


GirihCanvasHandler.prototype._locateHoveredTile = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
        if( this.girih.tiles[i]._props.hovered ) {
            return i;
        }
    }
    return -1;
};


GirihCanvasHandler.prototype._clearSelection = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
        this.girih.tiles[i]._props.selected = false;
    }
};


GirihCanvasHandler.prototype._clearHovered = function() {
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
        this.girih.tiles[i]._props.hovered = false;
        this.girih.tiles[i]._props.highlightedEdgeIndex = -1;
    }
};


//**** KEY AND BUTTON HANDLER METHODS ************************************

GirihCanvasHandler.prototype.keyDownHandler = function( e ) {
    // maps various keycodes to actions
    if( e.keyCode == 39 || e.keyCode == 68 ) { //right, d
        this.girihCanvasHandler.adjacentTileOptionPointer++;
        this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 37 || e.keyCode == 65) { //left, a
        this.girihCanvasHandler.adjacentTileOptionPointer =
                (this.girihCanvasHandler.adjacentTileOptionPointer +
                Girih.possiblePositions.length - 1) % Girih.possiblePositions.length;
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
        this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.DECAGON;
        this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 80 || e.keyCode == 53 ) { // p,5
        this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.PENTAGON;
        this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 72 || e.keyCode == 54 ) { // h,6
        if ( this.girihCanvasHandler.adjacentTileOptionPointer == Girih.POSSIBLES_INDEX.GIRIH_HEXAGON) {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.GIRIH_HEXAGON +1
        } else if ( this.girihCanvasHandler.adjacentTileOptionPointer == Girih.POSSIBLES_INDEX.GIRIH_HEXAGON +1) {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.GIRIH_HEXAGON +2
        } else {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.GIRIH_HEXAGON;
        }
        this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 82 || e.keyCode == 52 ) { // r,4
        if ( this.girihCanvasHandler.adjacentTileOptionPointer == Girih.POSSIBLES_INDEX.RHOMBUS) {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.RHOMBUS +1
        } else {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.RHOMBUS;
        }
        this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 66 || e.keyCode == 51 ) { // b,3
        if ( this.girihCanvasHandler.adjacentTileOptionPointer == Girih.POSSIBLES_INDEX.BOW_TIE) {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.BOW_TIE +1
        } else if ( this.girihCanvasHandler.adjacentTileOptionPointer == Girih.POSSIBLES_INDEX.BOW_TIE +1) {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.BOW_TIE +2
        } else {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.BOW_TIE;
        }
        this.girihCanvasHandler.redraw();
    } else if( e.keyCode == 78 || e.keyCode == 50 ) { // b,2
        if ( this.girihCanvasHandler.adjacentTileOptionPointer == Girih.POSSIBLES_INDEX.PENROSE_RHOMBUS) {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.PENROSE_RHOMBUS +1
        } else {
            this.girihCanvasHandler.adjacentTileOptionPointer = Girih.POSSIBLES_INDEX.PENROSE_RHOMBUS;
        }
        this.girihCanvasHandler.redraw();
    }
};


GirihCanvasHandler.prototype.increaseZoomFactor = function( redraw ) {
    this.zoomFactor *= 1.2;
    if( redraw ) {
        this.redraw();
    }
};


GirihCanvasHandler.prototype.decreaseZoomFactor = function( redraw ) {
    this.zoomFactor /= 1.2;
    if( redraw ) {
        this.redraw();
    }
};


//**** TILE OPERATION METHODS ************************************

GirihCanvasHandler.prototype._resolveCurrentAdjacentTilePreset = function( currentTile,
                                                                                highlightedEdgeIndex,
                                                                              ) {

    if( highlightedEdgeIndex == -1 ) {
        return;
    }

    var optionIndex = (this.adjacentTileOptionPointer + Girih.possiblePositions.length) %
            Girih.possiblePositions.length;
    var proposedPosition    = Girih.possiblePositions[ optionIndex];

    //find the position of the hovered tile vertex
    var face = Girih.TILE_FACES [currentTile.tileType][highlightedEdgeIndex];
    var turtle = new Turtle();

    turtle.toXY( currentTile.position.x, currentTile.position.y) // at current center
    turtle.toAD( currentTile.angle + face.centralAngle,
                  currentTile.size * face.radialCoefficient) // at highlighted edge vertex
    turtle.toaD( Math.PI + face.angleToNextVertex - face.angleToCenter,
                  currentTile.size * face.lengthCoefficient); // at next vertex

    var proposedFace = Girih.TILE_FACES [proposedPosition.tileType]
                                        [proposedPosition.startVertex];
    turtle.toaD( Math.PI - proposedFace.angleToNextVertex + proposedFace.angleToCenter,
              currentTile.size * proposedFace.radialCoefficient) // at adjacent center
    var proposedCenter = turtle.position;

    var proposedTileAngle = (turtle.angle - proposedFace.centralAngle +
                             Math.PI) % (2* Math.PI);


    //create the new tile
    var proposedTile;
    switch( proposedPosition.tileType ) {
    case Girih.TILE_TYPE.DECAGON:
        proposedTile = new Decagon( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case Girih.TILE_TYPE.PENTAGON:
        proposedTile = new Pentagon( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case Girih.TILE_TYPE.IRREGULAR_HEXAGON:
        proposedTile = new IrregularHexagon( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case Girih.TILE_TYPE.RHOMBUS:
        proposedTile = new Rhombus( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case Girih.TILE_TYPE.BOW_TIE:
        proposedTile = new BowTie( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    case Girih.TILE_TYPE.PENROSE_RHOMBUS:
        proposedTile = new PenroseRhombus( currentTile.size, proposedCenter, proposedTileAngle);
        break;
    default:
        throw "Cannot create tiles from unknown tile types (" + tileType + ").";
        break;
    }

    return proposedTile;
};


GirihCanvasHandler.prototype._performAddCurrentAdjacentPresetTile = function() {

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

    if( adjacentTile.tileType == Girih.TILE_TYPE.PENROSE_RHOMBUS && !this.getProperties().allowPenroseTile ) {
        DEBUG( "Penrose tile not allowed." );
        return;
    }

    this.addTile( adjacentTile );
    this.redraw();
};


GirihCanvasHandler.prototype._performDeleteSelectedTile = function() {

    var selectedTileIndex = this._locateSelectedTile();
    if( selectedTileIndex == -1 ) {
        return;
    }

    this.girih.tiles.splice( selectedTileIndex, 1 );
    this.lastTileCount = -1; //force redo of connectors
    this.redraw();
};


GirihCanvasHandler.prototype.addTile = function( tile ) {

    // Add internal properties to the tile
    tile._props = { selected:              false,
                    hovered:               false,
                    highlightedEdgeIndex:  -1,
                  };
    this.girih.addTile( tile );
};


//**** TILE TEXTURE METHODS ************************************

GirihCanvasHandler.prototype.setTextureImage = function( imageObject,
                                                              redraw
                                                            ) {
    this.imageObject = imageObject;
    if( redraw ) {
        this.redraw();
    }
};


GirihCanvasHandler.prototype.drawTextures = function( tile, imageObject, originalBounds) {
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
    var imgBounds = new BoundingBox2(
            tile.imageProperties.source.x * imageObject.width,
            (tile.imageProperties.source.x + tile.imageProperties.source.width) * imageObject.width,
            tile.imageProperties.source.y * imageObject.height,
            (tile.imageProperties.source.y + tile.imageProperties.source.height) * imageObject.height
          );
    var polyImageRatio = new Point2(
            originalBounds.width / imgBounds.width,
            originalBounds.height / imgBounds.height
          );

// RED FLAG!!! (kirk) this needs something in the context to clip, say a polygon
// at this point not sure what all this other stuff is doing, seems complex
// at a minimum it needs a context with the polygon scribed.
    this.context.clip();
    var imageX = this.drawOffset.x + tile.position.x * this.zoomFactor +
            originalBounds.xMin * this.zoomFactor;
    var imageY = this.drawOffset.y + tile.position.y * this.zoomFactor +
            originalBounds.yMin * this.zoomFactor;
    var imageW = (originalBounds.width +
            tile.imageProperties.destination.xOffset * imageObject.width * polyImageRatio.x) *
            this.zoomFactor;
    var imageH = (originalBounds.height +
            tile.imageProperties.destination.yOffset*imageObject.height*polyImageRatio.y) *
            this.zoomFactor;

    this.context.translate( imageX + imageW/2.0,
                            imageY + imageH/2.0
                          );

    this.context.rotate( tile.angle );

    var drawStartX = (-originalBounds.width/2.0) * this.zoomFactor;
    var drawStartY = (-originalBounds.height/2.0) * this.zoomFactor;
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
            (originalBounds.width - tile.imageProperties.destination.xOffset *
                imageObject.width * polyImageRatio.x) * this.zoomFactor,   // destination width
            (originalBounds.height - tile.imageProperties.destination.yOffset *
                imageObject.height * polyImageRatio.y) * this.zoomFactor   // destination height
          );
    this.context.restore();
}


// **** CANVAS RENDERING ************************************
// leaving the functions that directly interact with the canvas


GirihCanvasHandler.prototype.drawPolygonFromPoints =
        function( {
                    // vertices, strokeColor, fillColor,
                    strokeWidth = 1.0,
                    fillOpacity = 1,
                  } ) {
    var options = arguments[0];
    if( !options.vertices ) {
        return;
    }

    // move through the polygon segments
    var point = options.vertices[0];
    this.context.beginPath();
    this.context.moveTo( point.x * this.zoomFactor + this.drawOffset.x,
                         point.y * this.zoomFactor + this.drawOffset.y
                       );
    for( var i = 1; i < options.vertices.length; i++ ) {
        point = options.vertices[i];
        this.context.lineTo( point.x * this.zoomFactor + this.drawOffset.x,
                              point.y * this.zoomFactor + this.drawOffset.y
                            );
    }
    this.context.closePath();

    // Fill polygon with color
    if( options.fillColor ) {
        this.context.fillStyle = options.fillColor;
        this.context.fill();
    }

    // Stroke outline
    if( options.strokeColor) {
        this.context.lineWidth =     options.strokeWidth;
        this.context.strokeStyle =   options.strokeColor;
        this.context.stroke();
    }
};


GirihCanvasHandler.prototype.drawHighlightedPolygonEdge = function( tile, highlightedEdgeIndex) {

    if( highlightedEdgeIndex == -1 ) {
        return;
    }

    var edge = tile.polygon.getEdgeAt( highlightedEdgeIndex);

    this.context.beginPath();
    this.context.moveTo( edge.pointA.x * this.zoomFactor + this.drawOffset.x,
                         edge.pointA.y * this.zoomFactor + this.drawOffset.y
                       );
    this.context.lineTo( edge.pointB.x * this.zoomFactor + this.drawOffset.x,
                         edge.pointB.y * this.zoomFactor + this.drawOffset.y
                       );
    this.context.closePath();
    this.context.strokeStyle = this.drawProperties.polygonSelectedStrokeColor,
    this.context.lineWidth = 3.0;
    this.context.stroke();
};


//Partially moved
/*
Tile.prototype._drawPreviewTile = function( canvasContext) {
    this.drawPolygonFromPoints( canvasContext,
                                    { vertices:      tile.polygon.vertices,
                                      strokeColor:   "#888888",
                                      strokeWidth:   1,
                                      fillColor:     null,
                                    } );
};
*/


GirihCanvasHandler.prototype.drawCrosshairAt = function( position,
                                                         isSelected
                                                       ) {

    if( isSelected ) {
        this.context.strokeStyle = "#FF0000";
        this.context.fillStyle = "#FF0000";
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

    this.context.closePath();
    this.context.stroke();
    if( isSelected ) {
       this.context.fill();
    }
};



GirihCanvasHandler.prototype._drawCoordinateSystem = function() {


/*
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
*/
//NEW BEGIN
    if( this.drawProperties.drawCircumcircle) {
        document.getElementById('recenterCircumcenterKey').disabled = false;
        document.getElementById('axes-circumcenter').disabled = false;
        this.circumscribeTiles();
    } else {
        document.getElementById('recenterCircumcenterKey').disabled = true;
        document.getElementById('axes-circumcenter').disabled = true;
    }
// what is the center of the figure? circumcenter? bounding box?
// what about centering on current center?
// tile seems to be automatic when tile is selected (and rotate all is selected)
    var angle, center;
    var centerType = this.drawProperties.axesType
    if (centerType === "none") {
        return;
    } else if (centerType === "canvas") {
        var index = this._locateSelectedTile();
        if (index == -1) {
            center = new Point2( this.canvasWidth/2, this.canvasHeight/2);
            angle = this.angle;
        } else {
            tile = this.girih.tiles[ index]
            angle = tile.angle;
            center = new Point2( tile.position.x * this.zoomFactor + this.drawOffset.x,
                                 tile.position.y * this.zoomFactor + this.drawOffset.y);
        }

    } else if (centerType === "absolute") {
        angle = this.angle;
        center = new Point2( this.drawOffset.x, this.drawOffset.y);
    } else if (centerType === "circumcenter") {
        angle = this.angle;
        center = this.circumcircle.center.multiplyScalar( this.zoomFactor).
                 add (this.drawOffset).clone()
console.log("circumcircle center", center);
    }

    var radius = Math.sqrt(this.canvasWidth * this.canvasWidth +
                           this.canvasHeight * this.canvasHeight)

    var turtle = new Turtle();
    var numberOfAxes = this.drawProperties.symmetryType;
    if (numberOfAxes === "none" || numberOfAxes === "2fold") {
        numberOfAxes = 4;
    } else if (numberOfAxes === "5fold") {
        numberOfAxes = 5;
    } else if (numberOfAxes === "10fold") {
        numberOfAxes = 10;
    }

    this.context.beginPath();
console.log("axes center", center);
    for (var i = 0; i< numberOfAxes; i++) {
        turtle.toXY(center.x, center.y);
        this.context.moveTo(turtle.position.x,turtle.position.y);
        turtle.toAD( i * 2*Math.PI/numberOfAxes + angle, radius);
        this.context.lineTo(turtle.position.x,turtle.position.y);
    }
//NEW END
    this.context.strokeStyle = this.drawProperties.boundingBoxColor,
    //this.context.closePath();
    this.context.stroke();
};


GirihCanvasHandler.prototype._drawTiles = function() {
     var tile;

    // find all chains
    if (this.lastTileCount !== this.girih.tiles.length ||
        this.lastDrawStrappingType !== this.drawProperties.drawStrappingType) { // when tile added or deleted
        this.girih.buildAllConnectors();
        this.girih.findConnections();
        this.girih.findAllChains();
        this.lastTileCount = this.girih.tiles.length;
    }
    this.lastDrawStrappingType = this.drawProperties.drawStrappingType;

    // draw the basic tiles
    for( var i = 0; i < this.girih.tiles.length; i++ ) {
        this.girih.tiles[ i].drawTile();
    }

    // Finally draw the selected tile's hovering edge
    var hoveredTileIndex = this._locateHoveredTile();
    if( hoveredTileIndex != -1 ) {

        var tile = this.girih.tiles[ hoveredTileIndex ];
        if (tile._props.highlightedEdgeIndex !== -1) {
            this.drawHighlightedPolygonEdge( tile, tile._props.highlightedEdgeIndex);

            var adjacentTile = this._resolveCurrentAdjacentTilePreset(  tile,
                                                                        tile._props.highlightedEdgeIndex,
                                                                     );
            adjacentTile.drawPreviewTile();
        }
    }
};


GirihCanvasHandler.prototype._drawTileOrder = function() {
    var tile;
    this.context.beginPath();
    this.context.moveTo( this.drawOffset.x, this.drawOffset.y);
    var savedLineWidth = this.context.lineWidth;
    this.context.lineWidth = 2;
    this.context.strokeStyle = "blue";
    for (tile of this.girih.tiles){
        this.context.lineTo( tile.position.x * this.zoomFactor + this.drawOffset.x,
                             tile.position.y * this.zoomFactor + this.drawOffset.y);
    }
    this.context.stroke();
    this.context.lineWidth = savedLineWidth;
    //this.context.lineWidth = 0.0001;
}

/**************************************************************************
 *  drawStrapSegment -- draw a double girih strap segment from an array of points
 *
 *  parameters: (parameters are named and can be in any order)
 *    points is an array of points describing a strap segment (see below)
 *    options is a dictionary with the following:
 *      fillStyle is optional style parameter used to fill shape
 *      fillOpacity is optional style parameter used to fill shape
 *      strokeStroke is optional style of the stroked line
 *      strokeWidth is optional width of the stroked line in pixels
 *
 *  the array of points corresponds to the following diagram of a segment
 *     1 +--------------------------------------------+ 2
 *   0,5 +                                            + 6
 *     4 +--------------------------------------------+ 3
 *************************************************************************/
GirihCanvasHandler.prototype.drawStrapSegment = function( points, {
        //distance,
        fillOpacity = 1,
        fillStyle = "gray",
        strokeStyle = "black",
        strokeWidth = 1,
    }) {

    var zoomFactor = girihCanvasHandler.zoomFactor;
    var drawOffset = girihCanvasHandler.drawOffset;
    options = arguments[1];
    lineToPoint = function ( point) {
        girihCanvasHandler.context.lineTo( point.x * zoomFactor + drawOffset.x,
                                           point.y * zoomFactor + drawOffset.y)
    }

    moveToPoint = function ( point) {
        girihCanvasHandler.context.moveTo( point.x * zoomFactor + drawOffset.x,
                                           point.y * zoomFactor + drawOffset.y)
    }

    girihCanvasHandler.context.beginPath();
    moveToPoint( points [4]); //start
    lineToPoint( points [1]); // start cap
    lineToPoint( points [2]); // left side
    lineToPoint( points [3]); // end cap
    lineToPoint( points [4]); // right side
    //this.context.lineWidth = 0;
    girihCanvasHandler.context.fillStyle = options.fillStyle;
    girihCanvasHandler.context.fillOpacity = options.fillOpacity;
    girihCanvasHandler.context.closePath();
    girihCanvasHandler.context.fill();

    // stroke the segment for the lines
    girihCanvasHandler.context.beginPath();

    if (options.startCap) {
        moveToPoint( points [4]); //bottom of start cap, should be unnecessary
        moveToPoint( points [4]); //bottom of start cap
        lineToPoint( points [1]); //top of start cap
    } else {
        moveToPoint( points [1]); //top of start cap
    }
    lineToPoint( points [2]); // left side

    if( options.endCap) {
        lineToPoint( points [3]); // end cap
    } else {
        moveToPoint( points [3]); // no end cap
    }
    lineToPoint( points [4]); // right side
    girihCanvasHandler.context.strokeStyle = options.strokeStyle;
    //this.context.fillStyle = "";
    girihCanvasHandler.context.lineWidth = options.strokeWidth;
    girihCanvasHandler.context.stroke();
}

/**
 * The drawProperties object may contain following members:
 *  - drawBoxes         (boolean)
 *  - drawOutlines      (boolean)
 *  - drawTexture       (boolean)
 *  - drawInnerPolygons (boolean)
 **/
GirihCanvasHandler.prototype.getDrawProperties = function() {
    return this.drawProperties;
};


/**
 * The properties object may contain following members:
 *  - allowPenroseTile
*   -
 **/
GirihCanvasHandler.prototype.getProperties = function() {
    return this.properties;
};


GirihCanvasHandler.prototype.redraw = function() {
console.log("redraw triggered")
    // in case the canvas has resized...
    this.canvasWidth               = this.canvas.width;
    this.canvasHeight              = this.canvas.height;
    this.context.globalAlpha = 1;

    this.context.clearRect( 0, 0, this.canvasWidth, this.canvasHeight );
    //this.context.fillStyle = this.getDrawProperties().backgroundColor; // "#F0F0F0";
    //this.context.fillRect( 0, 0, this.canvasWidth, this.canvasHeight );


    if( this.getDrawProperties().drawCoordinateSystem ) {
        this._drawCoordinateSystem();
    }

    if( this.getDrawProperties().drawTileOrder ) {
        this.context.globalAlpha = 0.5;
        this._drawTiles();
        this.context.globalAlpha = 1;
        this._drawTileOrder();
    } else {
        this._drawTiles();
    }
};


//**** SVG DRAWING METHODS ****

GirihCanvasHandler.prototype.getSVGTileFromFaces = function( tile, idStr, classStr, styleStr, boundingBox) {
// idStr is short string to uniquely identify polygon (may be "")
// classStr is short string to identify class or classes used by polygon (may be "")
// styleStr is string to apply style or other attributes to the polygon (may be "")
//     (must include attribute name and enclose attribute in double quotes
// returns an SVG string
    var turtle = new Turtle();
    var faces = Girih.TILE_FACES [tile.tileType];
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
                   Girih.round( turtle.position.x, this.SVG_PRECISION) +','+ 
                   Girih.round( turtle.position.y, this.SVG_PRECISION)
        boundingBox.updateXY( turtle.position.x, turtle.position.y);// important to use translated vertices
        face = faces[ i];
        turtle.toaD( face.angleToNextVertex, tile.size * face.lengthCoefficient);
        preemble = ' ';
    }
    polygon += '"/>' + this.eol;
//console.log("svgPoly: " + polygon)
    return polygon;
}


GirihCanvasHandler.prototype.getSVG = function( options,
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


GirihCanvasHandler.prototype._exportSVG = function( options,
                                                         polygonStyle
                                                       ) {
    var svg = this.getSVG();

    saveTextFile( svg, "girih.svg", "image/svg+xml" );

};


GirihCanvasHandler.prototype._getSVGSimilarChainClasses = function() {
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

GirihCanvasHandler.prototype._getSVGMultipleChainClasses = function() {
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


GirihCanvasHandler.prototype.getSVGForeword = function( highWater) {

    //**HERE DOCUMENT***
    var foreword = `` +
`<svg id="girih-svg" xmlns="http://www.w3.org/2000/svg" version="1.1"
   height="` + Girih.round( highWater.height, Girih.SVG_PRECISION) + `"
   width="` + Girih.round( highWater.width, Girih.SVG_PRECISION) + `">
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
    Girih.round( -highWater.xMin, Girih.SVG_PRECISION) + ` ` +
    Girih.round( -highWater.yMin, Girih.SVG_PRECISION) + `)">
`;
    return foreword;
}


GirihCanvasHandler.prototype.getSVGAfterword = function() {
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

GirihCanvasHandler.prototype.toSVG = function( options,
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

    var highWater = new BoundingBox2();

    for( var i = 0; i < this.girih.tiles.length; i++ ) {
        var boundingBox = new BoundingBox2()
        buffer.push( indent.now + '<g id="Tile_'+ i +'">' + indent.eol);
        indent.inc();
        this.girih.tiles[i].toSVG( options, "", buffer, boundingBox, indent );
        indent.dec();
        buffer.push( indent.now + '</g>'+ indent.eol);

        highWater.updateBox(boundingBox)
    }


    svgPreamble = this.getSVGForeword( highWater);
    svgTrailer = this.getSVGAfterword();

    // put the pieces together
    buffer.unshift( svgPreamble)
    buffer.push( svgTrailer)
    return buffer
}


// ### BEGIN DRAW METHOD TESTING ##############################################

GirihCanvasHandler.prototype._drawCircleTest = function() {


    var circleA = new Circle( Point2.ZERO_POINT,
                              50
                            );
    var circleB = new Circle( new Point2( 50, 50 ),
                              75
                            );

    this._drawCircleIntersections( circleA, circleB );
};


GirihCanvasHandler.prototype._drawCircleIntersections = function( circleA, circleB ) {

    var intersection = circleA.computeIntersectionPoints( circleB );
    if( intersection ) {
        this._drawCrosshairAt( intersection.pointA, false );
        this._drawCrosshairAt( intersection.pointB, false );
    }
    this._drawCircle( circleA );
    this._drawCircle( circleB );

};


GirihCanvasHandler.prototype._drawCircle = function( circle ) {
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


GirihCanvasHandler.prototype._drawLineIntersectionTest = function() {

    var lineA = new Line2( new Point2(10, 10),
                                new Point2(120, 120)
                              );
    var lineB = new Line2( new Point2(100, 30),
                                new Point2(10, 150)
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


GirihCanvasHandler.prototype._drawLine = function( line ) {
    this.context.beginPath();
    this.moveToXY( line.pointA.x,  line.pointA.y)
    this.lineToXY( line.pointB.x,  line.pointB.y)
    this.context.strokeStyle = "#0000FF";
    this.context.stroke();
};


/* need to fix circumscribeTiles a bit.
currently does not find such a circle.

Need to find candiates points outside of the circle and their radius and angle
from the circumcenter.

find least number of outside points
    Pick three points from list of candidates
    find circumcircle of those points
    if nothing outside
        if radius is smaller than previous solution
           replace solution
    else if number outside is less than previous number outside
        replace next list of canditates
Try again with the next list of candidates
If the number of candiates is increasing, stop... may be oscillating

may want to skip candiates with a large radius...(say 10* max(boundingBoxWidth,boundBoxHeight)) too inline.
*/



function findAveragePositionOfTiles() {
    // this gives a crude estimate of the center.
    var averagePosition, number, index;
    averagePosition = new Point2 (0,0);
    number = girihCanvasHandler.girih.tiles.length;
    for (index in girihCanvasHandler.girih.tiles) {
        averagePosition.x += girihCanvasHandler.girih.tiles[ index].position.x;
        averagePosition.y += girihCanvasHandler.girih.tiles[ index].position.y;
    }
    averagePosition.x /= number;
    averagePosition.y /= number;
    return averagePosition;
}


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


function findMostDistantPointsSectored( center, sectors) {
    var sectorAngle, mostDistant, i, tile, distance, angle, sector;
    sectorAngle = 2* Math.PI / sectors;
    mostDistant = new Array( sectors);
    i = 0;
    for (tile of girihCanvasHandler.girih.tiles) {
        distance = tile.position.distanceTo( center);
        if (distance > 0) { // tile is not at center
            angle = getAngle( tile.position.x - center.x,
                              tile.position.y - center.y)
            sector = Math.floor( angle / sectorAngle);
            if (mostDistant[ sector] === undefined ||
                    distance > mostDistant[ sector].distance) {
                mostDistant[ sector] = { tileIndex: i,
                                         distance: distance,
                                         point: tile.position,
                                       }
            }
        }
        i++;
    }
    // refine and find the most distant vertex of each tile in the most distant
    var result, vertex;
    result = [];
    if (mostDistant !== undefined) {
        for ( i=0; i < mostDistant.length; i++) {
            if (mostDistant[ i] !== undefined) {
                for ( vertex of girihCanvasHandler.girih.
                        tiles[ mostDistant[ i].tileIndex ].polygon.vertices) {
                    distance = vertex.distanceTo( center);
                    if (distance >  mostDistant[ i].distance) {
                        mostDistant[ i].distance = distance;
                        mostDistant[ i].point = vertex;
                    }
                }
                result.push( mostDistant[ i].point); // just return the point
            }
        }
    }
    return  result;
}


function findMostDistantTiles() {
    var number, i, j, pointI, pointJ, distance, maximumDistance, tileA, tileB;
    number = girihCanvasHandler.girih.tiles.length;
    for (i=0; i < number; i++) {
        for (j=i+1; j < number; j++) {
            pointI= girihCanvasHandler.girih.tiles[i].position.clone();
            pointJ= girihCanvasHandler.girih.tiles[j].position.clone();
            distance = pointI.distanceTo( pointJ);
            if (maximumDistance === undefined ||
                       distance > maximumDistance) {
                 maximumDistance = distance;
                 tileA = girihCanvasHandler.girih.tiles[i];
                 tileB = girihCanvasHandler.girih.tiles[j];
            }
        }
    }
    return { distance: maximumDistance, tileA: tileA, tileB: tileB} ;
}


function findMostDistantPointsOfTileFromAPoint( tile, point) {
    var vertex, distance, maximumDistance, savedPoint;
    for ( vertex of tile.polygon.vertices) {
        distance = vertex.distanceTo( point);
        if (maximumDistance === undefined || distance > maximumDistance) {
            maximumDistance = distance;
            savedPoint = vertex;
        }
    }
    return { distance: maximumDistance, point: savedPoint}
}


function findMostDistantPointsOfTwoTiles( tileA, tileB) {
    var vertexA, vertexB, distance, maximumDistance, pointA, pointB;
    for ( vertexA of tileA.polygon.vertices) {
        for ( vertexB of tileB.polygon.vertices) {
            distance = vertexA.distanceTo( vertexB);
            if (maximumDistance === undefined || distance > maximumDistance) {
                maximumDistance = distance;
                pointA = vertexA;
                pointB = vertexB;
            }
        }
    }
    return [ pointA, pointB ];
}


function findMaximumDistanceBetweenTiles() {
    var tiles, points;
    tiles = findMostDistantTiles(); // this may not work for skinny tiles
    points = findMostDistantPointsOfTwoTiles( tiles.tileA, tiles.tileB);
    return points;
}


function estimateCircleWithMaximumDistance() {
    var estimate, center, radius, circle, angle;
    estimate = findMaximumDistanceBetweenTiles()
    center = new Point2( ( estimate.pointA.x + estimate.pointB.x ) / 2,
                         ( estimate.pointA.y + estimate.pointB.y ) / 2);
    radius = estimate.distance /2;
    circle = new Circle (center, radius);
    angle = getAngle( estimate.pointB.x - estimate.pointA.x,
                      estimate.pointB.y - estimate.pointA.y);
    // angle can be useful in establishing sector boundaries
    return circle;
}


function findTilePointsOutsideCircle( circle) {
    var decagonRadius, minRadius, outsiders, tile, maxDistance, maxPoint;
    var secondMaxPoint, vertex, distance;

    // set up limit for tiles completely within circle
    decagonRadius = girihCanvasHandler.girih.tiles[0].size *
            Girih.TILE_FACES[ Girih.TILE_TYPE.DECAGON][0].radialCoefficient;
    minRadius = circle.radius - decagonRadius;
    if (minRadius < 0) {
        minRadius = 0;
    }
    outsiders = [];

    for (tile of girihCanvasHandler.girih.tiles) {
        // skip tiles completely within circle
        if (tile.position.distanceTo( circle.center) < minRadius) {
            continue;
        }
        maxDistance = undefined; // reset for this tile
        secondMaxPoint = undefined; // reset for this tile
        for (vertex of tile.polygon.vertices) {
            distance = vertex.distanceTo( circle.center);
            if (distance - circle.radius > 0.002) { // outside of circle
                if (maxDistance === undefined || distance - maxDistance < 3) {
                    secondMaxPoint = vertex; // doesn't matter which is bigger
                } else if (distance > maxDistance) {
                    maxDistance = distance;
                    maxPoint = vertex;
                    secondMaxPoint = undefined; // in case minimium
                }
            }
        }
        if (maxDistance !== undefined) {
            outsiders.push( maxPoint);
        }
        if (secondMaxPoint !== undefined) {
            outsiders.push( secondMaxPoint);
        }
    }
    return outsiders;
}


function findBoundingVertices () {
    var tile, point;
    var minX = girihCanvasHandler.girih.tiles[0].polygon.vertices[0].clone()
    var maxX = minX.clone()
    var minY = minX.clone()
    var maxY = minX.clone()

    for (tile of girihCanvasHandler.girih.tiles) {
        for (point of tile.polygon.vertices) {
            if ( point.x < minX.x) {
                minX = point.clone();
            }
            if ( point.x > maxX.x) {
                maxX = point.clone();
            }
            if ( point.y < minY.y) {
                minY = point.clone();
            }
            if ( point.y > maxY.y) {
                maxY = point.clone();
            }
        }
    }
    return [minX, minY, maxX, maxY];
}


findBestCircleFromPoints = function( points) {
    // for each triplet of points, find a circle
    var i, j, k, outsiders, savedCircle, savedOutsiders;
    var savedPointA, savedPointB, savedPointC;
    const outsiderLimit = 10;
    const outsiderThreshold = 4;

    for (i=0; i< points.length; i++) {
        if (points[i] === undefined) {
            continue;
        }
        for (j=i+1; j< points.length; j++) {
            if (points[j] === undefined) {
                continue;
            }
            for (k=j+1; k< points.length; k++) {
                if (points[k] === undefined) {
                    continue;
                }
                circle = girihCanvasHandler.circumscribeCircle (
                        points[i], points[j], points[k] );

                //if this cirle is better than other circles, save it.
                outsiders = findTilePointsOutsideCircle( circle);
                console.log("circle "+ i +" "+ j +" "+ k +" "+
                             points[i] +" "+ points[j] +" "+ points[k]
                             +" radius:"+ circle.radius
                             +" outsiders:"+ outsiders.length);

                if (outsiders.length< outsiderLimit && circle.radius < Infinity) {
                    if (savedCircle === undefined ||
                            outsiders.length < savedOutsiders.length ||
                            (outsiders.length === savedOutsiders.length &&
                            circle.radius < savedCircle.radius)) {

//                    if (savedCircle === undefined ||
//                            (circle.radius < savedCircle.radius &&
//                             outsiders.length <
//                                savedOutsiders.length + outsiderThreshold) ) {

                        console.log("radius:"+ circle.radius +" outsiders:"+ outsiders.length);
                        savedOutsiders = outsiders;
                        savedCircle = circle;
                        savedPointA = points[i];
                        savedPointB = points[j];
                        savedPointC = points[k];
                    }
                }
            }
        }
    }
    return { circle: savedCircle, outsiders: savedOutsiders,
             pointA: savedPointA,
             pointB: savedPointB,
             pointC: savedPointC };
}


GirihCanvasHandler.prototype.circumscribeTiles = function () {
    var center, points, circle, outsiders, goodEnough, result;
    var radius;
    const sectors = 10;
    const outsiderThreshold = 0; // max outsider difference to consider
    const outsiderLimit = 10;     // maximum number of outsiders to consider

    //fifth attempt
    if ( girihCanvasHandler.girih.tiles.length === 1) { // center on the tile
        tile = girihCanvasHandler.girih.tiles[0];
        radius = findMostDistantPointsOfTileFromAPoint( tile, tile.position).distance;
        circle = new Circle( tile.position, radius);
        girihCanvasHandler.circumcircle = circle;
        girihCanvasHandler.drawCircumcircle ( undefined, undefined, undefined);
        return;
    }
    //fourth attempt
    points = findMaximumDistanceBetweenTiles(); // align points and center
    center = new Point2( ((points[0].x + points[1].x) / 2),
                         ((points[0].y + points[1].y) / 2));
    radius = points[0].distanceTo( center);
    circle = new Circle( center, radius);
    outsiders = findTilePointsOutsideCircle( circle);
    //if ( outsiders.length === 0) { // good enough
    if ( outsiders.length < 2) { // good enough
        girihCanvasHandler.circumcircle = circle;
        girihCanvasHandler.drawCircumcircle ( points[0], points[1], undefined);
        return;
    }

    // have at least on point not aligned with the maximim axis
    center = findAveragePositionOfTiles()
    points = findMostDistantPointsSectored( center, sectors)
//4    if (points.length === 2) {
/*
//third try
        // the cirle defined by 2 points may be the best. it alwasy should
        // be done to set the base for three points
        // need to find the outsiders to see how good it is
        points = findMaximumDistanceBetweenTiles(); // align points and center
        center = new Point2( ((points[0].x + points[1].x) / 2),
                             ((points[0].y + points[1].y) / 2));
        radius = points[0].distanceTo( center);
        girihCanvasHandler.circumcircle = new Circle( center, radius);
        girihCanvasHandler.drawCircumcircle ( points[0], points[1], undefined);
*/
/* second try
        // really should look into the most distant first to elminate in-line patterns
        center = new Point2( ((points[0].x + points[1].x) / 2),
                             ((points[0].y + points[1].y) / 2));
        radius = points[0].distanceTo( center);
        girihCanvasHandler.circumcircle = new Circle( center, radius);
        girihCanvasHandler.drawCircumcircle ( points[0], points[1], undefined);
*/
/* first try
        var distance0 = points[0].distanceTo( center);
        var distance1 = points[1].distanceTo( center);
        var radius = Math.max( distance0, distance1);
        girihCanvasHandler.circumcircle = new Circle( center, radius);
        girihCanvasHandler.drawCircumcircle ( points[0], points[1], undefined);
*/
//4    } else {
        goodEnough = 3;
        while (goodEnough > 0) {
            console.log("looping " + goodEnough)
            result = findBestCircleFromPoints (points);
            if (result.outsiders === undefined || result.outsiders.length === 0) {
//what about two solutions with no outsiders... want the smallest radius
                goodEnough = 0;
            } else {
                points = [].concat(result.outsiders);
                points.push( result.pointA);
                points.push( result.pointB);
                points.push( result.pointC);
                goodEnough--;
            }
        }
        girihCanvasHandler.circumcircle = result.circle;
        girihCanvasHandler.drawCircumcircle ( result.pointA,
                                              result.pointB,
                                              result.pointC);
}


GirihCanvasHandler.prototype.circumscribeTilesOld = function () {
// find points on tiles that define bounding box
    var i, j, point;

    /* This is not very good for skinny arrays of tiles. Maybe need to propose
       a center based on the centers of the tiles.
       this is obvious visually, but how to program it.
       ... in the case of skinmy you want all of the points to be on the ends
       and none in the center
       this could be something simple like the average of the sum of tile points
       This gets messed up 
       need an algorithm to eliminate points. so in an array, oyou try to choose
       points on the outside (sides, top, bottom)
       for missing points you chose the points in a vicinity that are further from center

       another way to do it is to find the vectors between the tiles. Find the longest
       one in each of n sectors. That (nearly) defines a reasonable diameter of the circle.
       The resulting n*2 points could be a starting point for finding the circle.
       find the vectors, sort by into sectors, sort by distance. if some sectors
       are much weaker than other sectors, ignore them. if there aren't enough points
       go back and augment from strongest sector. or just to a circle with two
       points and average for center.
       refine the vector by finding the maximum distance of vertices of the pair
       of tiles.



*/

/*
    // find the three points farthest from the center of the bounding box
    var dx = Math.abs(maxX.x - minX.x);
    var dy = Math.abs(maxY.y - minY.y);
    var minXd = Math.abs( minX.y - dy/2);
    var maxXd = Math.abs( maxX.y - dy/2);
    var minYd = Math.abs( minY.x - dx/2);
    var maxYd = Math.abs( maxY.x - dx/2);


    var minD = Math.min( minXd, maxXd, minYd, maxYd);
    if (minXd === minD) {
        this.circumscribeCircle( maxX, minY, maxY);
    } else if (maxXd === minD) {
        this.circumscribeCircle( minX, minY, maxY);
    } else if (minYd === minD) {
        this.circumscribeCircle( minX, maxX, maxY);
    } else {
        this.circumscribeCircle( minX, maxX, minY);
    }
*/
    // find the three points farthest apart
/*
*/
    points = findBoundingVertices();
    results = findBestCircleFromPoints( points);
    girihCanvasHandler.circumcircle = results.circle;
    girihCanvasHandler.drawCircumcircle (results.pointA, results.pointB, results.pointC);
}


GirihCanvasHandler.prototype.circumscribeCircle = function ( A, B, C) {
//console.log("A:"+ A +" B:"+ B +" C:"+ C);
    // from Wikipedia circumscribed circle calculation for cartesian coordinates
    var Axy2 = A.x * A.x + A.y * A.y
    var Bxy2 = B.x * B.x + B.y * B.y
    var Cxy2 = C.x * C.x + C.y * C.y
    var D = 2 * ( A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y))
    // changing y because it is upside down in Javascript Canvas
    //var D = 2 * ( A.x * (-B.y + C.y) + B.x * (-C.y + A.y) + C.x * (-A.y + B.y))

    var U = new Point2();
    U.x = ( Axy2 * (B.y - C.y) + Bxy2 * (C.y - A.y) + Cxy2 * (A.y - B.y)) / D;
    U.y = ( Axy2 * (C.x - B.x) + Bxy2 * (A.x - C.x) + Cxy2 * (B.x - A.x)) / D;
    // changing y because it is upside down in Javascript Canvas
    //U.x = ( Axy2 * (-B.y + C.y) + Bxy2 * (-C.y + A.y) + Cxy2 * (-A.y + B.y)) / D;
    //U.y = ( Axy2 * (-C.x + B.x) + Bxy2 * (-A.x + C.x) + Cxy2 * (-B.x + A.x)) / D;
    // changing y because it is upside down in Javascript Canvas
    var radius = Math.sqrt( (A.x - U.x) *( A.x - U.x) + (A.y - U.y) *( A.y - U.y) );
//console.log("U:"+ U +" radius:"+ radius);

    return new Circle( U, radius);
}

GirihCanvasHandler.prototype.drawCircumcircle = function ( A, B, C) {
    var U;
    if ( girihCanvasHandler.circumcircle !== undefined &&
         girihCanvasHandler.circumcircle.center !== undefined) {
        U = girihCanvasHandler.circumcircle.center;
        var circleU1 = new Circle (U, 3);
        var circleU2 = new Circle (U, 6);
        this._drawCircle( circleU1 );
        this._drawCircle( circleU2 );
        this._drawCircle( this.circumcircle );
    }

    if (A !== undefined) {
        var circleA = new Circle (A, 5);
        this._drawCircle( circleA );
    }
    if (B !== undefined) {
        var circleB = new Circle (B, 5);
        this._drawCircle( circleB );
    }
    if (C !== undefined) {
        var circleC = new Circle (C, 5);
        this._drawCircle( circleC );
    }
};


GirihCanvasHandler.prototype._drawCircleIntersections = function( circleA, circleB ) {

    var intersection = circleA.computeIntersectionPoints( circleB );
    if( intersection ) {
        this._drawCrosshairAt( intersection.pointA, false );
        this._drawCrosshairAt( intersection.pointB, false );
    }
    this._drawCircle( circleA );
}

// ### END DRAW METHOD TESTING ################################################
