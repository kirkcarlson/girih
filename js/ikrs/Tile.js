/**
 * This is a general Tile superclass.
 *
 * All other tile classes extends this one.
 *
 *
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @date 2020-05-11 Kirk Carlson (converted to use ECMA6 class).
 * @version 1.0.2
 **/


/**
 * @param size     number  The edge size (usually Girih.DEFAULT_EDGE_LENGTH).
 * @param position Point2  The position of the tile.
 * @param angle    number  The rotation angle.
 * @param tileType integer One of Girih.TILE_TYPE.*
 **/
class Tile {
    constructor( size,
                 position,
                 angle = 0.0,
                 tileType = Girih.TILE_TYPE.UNKNOWN,
                 fillColor
                ) {

        this.size                 = size;
        this.position             = position;
        this.angle                = angle % (2* Math.PI);
        this.tileType             = tileType;
        this.fillColor            = fillColor;

        this.polygon              = new Polygon(); // Empty vertice array

        // The inner tile polygons are those that do not share edges with the outer
        // tile bounds (vertices are OK).
        this.innerTilePolygons    = [];

        // The outer tile polygons are those that make up the tile edges. The
        // whole tile area is covered by the union of the outer tile polygons and
        // the inner tile polygons. The intersection is empty.
        this.outerTilePolygons    = [];

        // the connectors are used to find the chains that go through the girih
        // strapping links from adjacent tiles.
        this.connectors           = [];
        this.imageProperties      = null;
    }
};


Tile.prototype.buildTile = function( ) {
    var turtle = new Turtle();
    var faces = Girih.TILE_FACES [this.tileType];
    var face = faces[0];

    turtle.toXY( this.position.x, this.position.y);
    turtle.toAD( this.angle + face.centralAngle,
                 face.radialCoefficient * this.size);
    turtle.toaD( Math.PI - face.angleToCenter, 0);
    for (var i = 0; i< faces.length; i++) {
        this.polygon.addVertex( turtle.position.clone()); // save vertex

        face = faces[ i];
        turtle.toaD( face.angleToNextVertex,
                     this.size * face.lengthCoefficient);
    }
}


Tile.prototype.buildConnectors = function() {
    // build the connectors for this tile
    this.connectors = []; // clear any existing connectors, this is somewhat wasteful
    for (var i=0; i < this.polygon.vertices.length;  i++) { // all sides of each tile
        var edge = this.polygon.getEdgeAt( i);
        var midpoint = new Point2 ((edge.pointA.x + edge.pointB.x)/2,
                                        (edge.pointA.y + edge.pointB.y)/2);
        var connector = new Connector( i, midpoint);
        this.connectors.push( connector);
    }
}


Tile.prototype.getInnerTilePolygonAt = function( index ) {
    if( index < 0 )
        return this.innerTilePolygons[ this.innerTilePolygons.length -
                (Math.abs(index)%this.innerTilePolygons.length) ];
    else
        return this.innerTilePolygons[ index % this.innerTilePolygons.length ];
};


Tile.prototype.getOuterTilePolygonAt = function( index ) {
    if( index < 0 )
        return this.outerTilePolygons[ this.outerTilePolygons.length -
                (Math.abs(index)%this.outerTilePolygons.length) ];
    else
        return this.outerTilePolygons[ index % this.outerTilePolygons.length ];
};


Tile.prototype.getTranslatedVertex = function( index ) {
    return this._translateVertex( this.polygon.getVertexAt(index));
};


/**
 * This is a special get* function that modulates the index and also
 * allows negative values.
 *
 * For k >= 0:
 *  - getVertexAt( vertices.length )     == getVertexAt( 0 )
 *  - getVertexAt( vertices.length + k ) == getVertexAt( k )
 *  - getVertexAt( -k )                  == getVertexAt( vertices.length -k )
 *
 * So this function always returns a point for any index.
 **/
Tile.prototype.getVertexAt = function( index ) {
    return this.polygon.getVertexAt( index );
}


/**
 * This function checks if the passed point is within this tile's polygon.
 *
 * @param point The point to be checked.
 * @retrn true|false
 **/
Tile.prototype.containsPoint = function( point ) {
    // Thanks to
    // http://stackoverflow.com/questions/2212604/javascript-check-mouse-clicked-inside-the-circle-or-polygon/2212851#2212851
    var i, j = 0;
    var c = false;
    for (i = 0, j = this.polygon.vertices.length-1; i < this.polygon.vertices.length; j = i++) {
        vertI = this.getVertexAt(i)
        vertJ = this.getVertexAt(j)
            if ( ((vertI.y > point.y) != (vertJ.y > point.y)) &&
                    (point.x < (vertJ.x - vertI.x) * (point.y - vertI.y) /
                    (vertJ.y - vertI.y) + vertI.x) ) {
                c = !c;
        }
    }
    return c;
}


/**
 * This function locates the closest tile edge (polygon edge)
 * to the passed point.
 *
 * Currently the edge distance to a point is measured by the
 * euclidian distance from the edge's middle point.
 *
 * @param point     The point to detect the closest edge for.
 * @param tolerance The tolerance (=max distance) the detected edge
 *                  must be inside.
 * @return the edge index (index of the start vertice) or -1 if not
 *         found.
 **/
Tile.prototype.locateEdgeAtPoint = function( point, tolerance) {
    if( this.polygon.vertices.length == 0 )
        return -1;

    var middle         = this.position.clone();
    var tmpDistance    = 0;
    var resultDistance = tolerance*2;   // definitely outside the tolerance :)
    var resultIndex    = -1;
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

        var vertI = this.getVertexAt( i );
        var vertJ = this.getVertexAt( i+1 ); // (i+1 < this.vertices.length ? i+1 : 0) );

        // Create a point in the middle of the edge
        middle.x = vertI.x + (vertJ.x - vertI.x)/2.0;
        middle.y = vertI.y + (vertJ.y - vertI.y)/2.0;
        tmpDistance = middle.distanceTo(point);
        if( tmpDistance <= tolerance && (resultIndex == -1 || tmpDistance < resultDistance) ) {
            resultDistance = tmpDistance;
            resultIndex    = i;
        }
    }

    return resultIndex;
}

/**
 * Find the adjacent edge from this tile's polygon.
 *
 * This function will check all egdges and return the one with
 * the minimal distance (its index).
 *
 * Only forward edges (i -> i+1) are detected. If you wish backward
 * edges to be detected too, swap the point parameters pointA and
 * pointB.
 *
 * @param pointA    The first point of the desired edge.
 * @param pointB    The second point the desired edge.
 * @param tolerance The tolerance of the detection (radius).
 * @return The index of the edge's first vertex (if detected) or
 *         -1 if not edge inside the tolerance was found.
 *
 * @pre tolerance >= 0
 **/
Tile.prototype.locateAdjacentEdge = function( pointA,
                                              pointB,
                                              tolerance
                                            ) {

    if( this.polygon.vertices.length == 0 )
        return -1;

    var result = -1;
    var resultDistance = 2*tolerance+1;   // Definitely larger than the tolerance :)
    for( var i = 0; i <= this.polygon.vertices.length; i++ ) {

        var vertCur = this.getTranslatedVertex( i );   // this.getVertexAt( i );
        var vertSuc = this.getTranslatedVertex( i+1 ); // this.getVertexAt( i+1 );

        // Current edge matches?
        var avgDistanceFwd = (vertCur.distanceTo(pointA) + vertSuc.distanceTo(pointB))/2.0;
        //var avgDistanceBwd = (vertSuc.distanceTo(pointA) + vertCur.distanceTo(pointB))/2.0;

        // Measure only in one direction. Otherwise the return value would be ambigous.
        if( avgDistanceFwd < tolerance &&
            (result == -1 || (result != -1 && avgDistanceFwd < resultDistance))
          ) {
            // Check ALL edges to find the minimum
            result = i;
            resultDistance = avgDistanceFwd;
        }
    }

    return result;
};



//**** TILE RENDERING FUNCTIONS *****

function randomColor () {
    return 'rgb(' + Math.round( Math.random()*255 ) + ',' +
                    Math.round( Math.random()*255 ) + ',' +
                    Math.round( Math.random()*255 ) + ')';
}


/**************************************************************************
 *  capGap -- compute the spacing for the end cap of a crossing line
 *
 *  parameters:
 *    none passed
 *
 *  returns
 *    the required spacing for the end cap in pixels
 *************************************************************************/
capGap = function () {
    return girihCanvasHandler.drawProperties.strappingWidth/2 +
           girihCanvasHandler.drawProperties.strappingStrokeWidth /
                   girihCanvasHandler.drawProperties.strappingPixelFactor +
           girihCanvasHandler.drawProperties.strappingGap;
}

addAlphaChannel = function ( colorcode, alpha) {
// alpha is a 2 character hexadecimal code. 00 transparent. FF opaque
     if (typeof colorcode === "string" && colorcode[0] === '#' && colorcode.length == 7) {
         colorcode = colorcode +"80"; // add alpha channel
     }
     return colorcode
}


Tile.prototype.drawTile = function() {

    // Penrose tile allowed?
    if( this.tileType == Girih.TILE_TYPE.PENROSE_RHOMBUS &&
        !girihCanvasHandler.properties.allowPenroseTile ) {
        return;
    }
    if( girihCanvasHandler.drawProperties.drawBoxes ) {
        this.drawBoundingBox();
    }

    // draw the polygon
    var fillColor = "transparent";
    if( girihCanvasHandler.drawProperties.drawPolygonColor) {
        if (girihCanvasHandler.drawProperties.polygonColorType === "default") {
            fillColor = addAlphaChannel( this.fillColor, "80");
        } else if (girihCanvasHandler.drawProperties.polygonColorType === "random") {
            fillColor = randomColor()
        }
    }
    var strokeColor = "transparent";
    if( girihCanvasHandler.drawProperties.drawOutlines) {
        var strokeColor = girihCanvasHandler.drawProperties.polygonStrokeColor;
    }
    girihCanvasHandler.drawPolygonFromPoints ( {
                                                 vertices: this.polygon.vertices,
                                                 strokeWidth: 1,
                                                 strokeColor: addAlphaChannel( strokeColor, "80"),
                                                 fillColor: fillColor,
                                                 fillOpacity: 1,
                                               } );

    // the following relys on polygon context set from _drawPolygonFromPoints above
    if( girihCanvasHandler.drawProperties.drawTextures) {
        var tileBounds = this.computeBounds();
        girihCanvasHandler.drawTextures( this, girihCanvasHandler.imageObject, tileBounds)
    };

    if( girihCanvasHandler.drawProperties.drawInnerPolygons ) {
        this.drawInnerTilePolygons( tile );
        this.drawOuterTilePolygons( tile );
    }

    // draw strapping
    if( girihCanvasHandler.drawProperties.drawStrapping) {
        if( (girihCanvasHandler.drawProperties.drawStrappingType === "fancy" ||
             girihCanvasHandler.drawProperties.drawStrappingType === "random")) {

            this.drawFancyStrapping( girihCanvasHandler.context, {
                     capGap: capGap(),
                     strappingWidth: girihCanvasHandler.drawProperties.strappingWidth,
                     strappingStrokeWidth: girihCanvasHandler.drawProperties.strappingStrokeWidth,
                     strappingStrokeColor: girihCanvasHandler.drawProperties.strappingStrokeColor,
                     strappingFillColor: girihCanvasHandler.drawProperties.strappingFillColor,
                                  });

        } else {
            tile.drawSimpleStrapping( tile);
        }
    };

    // draw crosshair
    if( girihCanvasHandler.drawProperties.drawOutlines || this._props.selected ) {
        girihCanvasHandler.drawCrosshairAt( this.position, this._props.selected );
    }
};


Tile.prototype.drawPreviewTile = function() {
    girihCanvasHandler.drawPolygonFromPoints(
                                    { vertices:      this.polygon.vertices,
                                      strokeColor:   "#88888880", // has alpha channel
                                      strokeWidth:   1,
                                      fillColor:     null,
                                    } );
};


Tile.prototype.drawBoundingBox = function() {
    bounds = this.polygon.computeBoundingBox();
    var points = [ bounds.leftUpperPoint,
                   bounds.rightUpperPoint,
                   bounds.rightLowerPoint,
                   bounds.leftLowerPoint
                 ];
    girihCanvasHandler.drawPolygonFromPoints ( {
                                                 vertices: points,
                                                 strokeColor: "#c8c8ff",
                                               } );
};


Tile.prototype.drawInnerTilePolygons = function() {
    for( var i = 0; i < this.innerTilePolygons.length; i++ ) {
        if( this.tileType == Girih.TILE_TYPE.PENROSE_RHOMBUS &&
            !girihCanvasHandler.properties.allowPenroseTile) {
            continue;
        }
        this._drawInnerTile( i );
    }
};


Tile.prototype._drawInnerTile = function( index ) {
    var polygon = this.innerTilePolygons[ index ];

    var fillColor = null;
    if( girihCanvasHandler.drawProperties.innerRandomColorFill ) {
        fillColor = randomColor();
    }
    var strokeColor = null;
    if ( girihCanvasHandler.drawProperties.drawStrapping &&
         girihCanvasHandler.drawProperties.drawStrappingType === "basic") {
        strokeColor = girihCanvasHandler.drawProperties.simpleStrappingStrokeColor;
    }

    girihCanvasHandler.drawPolygonFromPoints ( {
                                                  vertices: polygon.vertices,
                                                  strokeColor: addAlphaChannel( strokeColor, "80"),
                                                  strokeWidth: 1,
                                                  fillColor: fillColor,
                                                  fillOpacity: 0.5,
                                                } );
};


Tile.prototype.drawOuterTilePolygons = function() {
    for( var i = 0; i < this.outerTilePolygons.length; i++ ) {
        var polygon = this.outerTilePolygons[ i ];

        var fillColor = null;
        if( girihCanvasHandler.drawProperties.outerRandomColorFill ) {
            fillColor = randomColor();
        }
        girihCanvasHandler.drawPolygonFromPoints ( {
                                                     vertices: polygon.vertices,
                                                     fillColor: fillColor,
                                                     fillOpacity: 0.5,
                                                   } );
    }
};


Tile.prototype.drawFancyStrapping = function() {
    // get the strap vectors for the tile
    vectors = this.getStrapVectors( {
                                     capGap: capGap(),
                                     strappingWidth: girihCanvasHandler.drawProperties.strappingWidth
                                    } );

    // render each strap vector
    for( index in vectors) {
        points = _findStrapSegmentPoints( vectors[ index]);
        // vector already has fillStyle and fillOpacity
        vectors[ index].strokeStyle = girihCanvasHandler.drawProperties.strappingStrokeColor;
        vectors[ index].strokeWidth = girihCanvasHandler.drawProperties.strappingStrokeColor;
        girihCanvasHandler.drawStrapSegment( points, vectors[ index])
    }
}


Tile.prototype.drawSimpleStrapping = function() {

    for( var i = 0; i < this.innerTilePolygons.length; i++ ) {
        if( this.tileType == Girih.TILE_TYPE.PENROSE_RHOMBUS &&
            !girihCanvasHandler.properties.allowPenroseTile) {
            continue;
        }
        var polygon = this.innerTilePolygons[ i ];
        strokeColor = girihCanvasHandler.drawProperties.simpleStrappingStrokeColor,
        girihCanvasHandler.drawPolygonFromPoints ( {
                                                     vertices: polygon.vertices,
                                                     strokeColor: strokeColor,
                                                   } );
    }
};



//**** TILE TO SVG FUNCTIONS *****

Tile.prototype.toSVG = function( options,
                                 polygonStyle,
                                 buffer,
                                 boundingBox,
                                 indent,
                               ) {
    // external (global?) stuff
    var drawProperties = girihCanvasHandler.drawProperties;

    var returnBuffer = false;
    if( typeof buffer == "undefined" || !buffer ) {
        buffer = [];
        returnBuffer = true;
    }

    // Export outer shape?
    classStr = "polygon " + Girih.TILE_TYPE_NAMES[ this.tileType];

    var idStr = "";
    var styleStr = "";
    if (drawProperties.drawOutlines) {
        styleStr = 'style="stroke:black;';
        // don't set stroke to transparent here because hard to override with css
//  } else {
//      styleStr = 'style="stroke:transparent;';
    }
    if (drawProperties.drawPolygonColor &&
            drawProperties.polygonColorType === "random") {
        styleStr += ' fill:'+ randomColor() +';';
        // don't set fill to transparent here because hard to override with css
//  } else {
//      styleStr += ' fill:transparent;';
    }
    if (styleStr != "") {
        styleStr += '"';
    }
    buffer.push( indent.now + this.getSVGTileFromFaces (
                 idStr, classStr, styleStr, boundingBox) + indent.eol);

    // Export inner polygons?
    if( drawProperties.drawInnerPolygons) {
        buffer.push( indent.now + '<g class="inner">' +
                 indent.eol);
        indent.inc();
        for( var i = 0; i < this.innerTilePolygons.length; i++ ) {
            if( drawProperties.drawStrapping &&
                drawProperties.drawStrappingType === "basic") {
                var polygonStyle = 'style="stroke:black;';
            } else {
        // don't set stroke to transparent here because hard to override with css
//              var polygonStyle = 'style="stroke:transparent;';
                var polygonStyle = 'style="';
            }
            if( drawProperties.drawInnerPolygons &&
                drawProperties.innerRandomColorFill) {
                polygonStyle += ' fill:'+ randomColor() +';';
        // don't set fill to transparent here because hard to override with css
//          } else {
//              polygonStyle += ' fill:transparent;';
            }
            polygonStyle += '"';
            buffer.push( indent.now +
                         this._polygonToSVG( this.innerTilePolygons[i],
                                             polygonStyle,
                                             boundingBox) +
                         indent.eol);
        }
        indent.dec();
        buffer.push( indent.now + '</g>' + indent.eol);
    }

    // Export outer polygons?
    if( drawProperties.drawInnerPolygons) {
        buffer.push( indent.now + '<g class="outer">' +
                     indent.eol);
        indent.inc();
        for( var i = 0; i < this.outerTilePolygons.length; i++ ) {
//          var polygonStyle = 'style="stroke:transparent;';
            var polygonStyle = 'style="';
            if( drawProperties.drawInnerPolygons &&
                drawProperties.outerRandomColorFill) {
                polygonStyle += ' fill:'+ randomColor() +';';
            }
            polygonStyle += '"';
            buffer.push( indent.now +
                         this._polygonToSVG( this.outerTilePolygons[i],
                                polygonStyle,
                                boundingBox) +
                         indent.eol);
        }
        indent.dec();
        buffer.push( indent.now + '</g>' + indent.eol);
    }

    if( drawProperties.drawStrapping && (
            drawProperties.drawStrappingType == "fancy" ||
            drawProperties.drawStrappingType == "random")) {
        buffer.push( indent.now +'<g class="strapping">'+ indent.eol);
        indent.inc();

        this.getSVGforFancyStrapping( {
                     capGap: capGap(),
                     strappingWidth: drawProperties.strappingWidth,
                     strappingStrokeWidth: drawProperties.strappingStrokeWidth,
                     strappingStrokeColor: drawProperties.strappingStrokeColor,
                     strappingFillColor: drawProperties.strappingFillColor,
                                  }, buffer, indent);

/*
new code looks like:
        abstraction = this.abstractStraps( {
                     capGap: capGap(),
                     strappingWidth: drawProperties.strappingWidth,
                     strappingStrokeWidth: drawProperties.strappingStrokeWidth,
                     strappingStrokeColor: drawProperties.strappingStrokeColor,
                     strappingFillColor: drawProperties.strappingFillColor,
                                  });

        for (strap in abstraction)
            this.getStrapSegmentSVG ( strap.strapOptions, buffer, indent);
        }
    }
*/
        indent.dec();
        buffer.push( indent.now + '</g>' + indent.eol);
    }
    if( returnBuffer ) {
        return buffer;
    } else {
        return buffer.join( "" );
    }
};


Tile.prototype.getSVGTileFromFaces = function( idStr, classStr, styleStr, boundingBox) {
// idStr is short string to uniquely identify polygon (may be "")
// classStr is short string to identify class or classes used by polygon (may be "")
// styleStr is string to apply style or other attributes to the polygon (may be "")
//     (must include attribute name and enclose attribute in double quotes 
// returns an SVG string
    var turtle = new Turtle();
    var faces = Girih.TILE_FACES [this.tileType];
    var face = faces[0];
 // <polygon points="0,100 50,25 50,75 100,0" />
    var polygon = '<polygon';
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
    turtle.toXY( this.position.x, this.position.y);

    turtle.toAD( this.angle + face.centralAngle, face.radialCoefficient * this.size);
    turtle.toaD( Math.PI - face.angleToCenter, 0)
    var preemble = ''
    for (var i = 0; i< faces.length; i++) {
        polygon += preemble +
                   Girih.round( turtle.position.x, Girih.SVG_PRECISION) +','+
                   Girih.round( turtle.position.y, Girih.SVG_PRECISION)
        boundingBox.updateXY( turtle.position.x, turtle.position.y);// important to use translated vertices
        face = faces[ i];
        turtle.toaD( face.angleToNextVertex, this.size * face.lengthCoefficient);
        preemble = ' ';
    }
    polygon += '"/>';
//console.log("svgPoly: " + polygon)
    return polygon;
}


Tile.prototype._polygonToSVG = function( polygon, // an array of vertices
                                         polygonStyleString, // for color, etc.
                                         boundingBox // for limits of drawing
                                       ) {
    // return a SVG string
    var vertex;
    var svgStr = '<polygon';

    if( typeof polygonStyleString != "undefined" && polygonStyleString != "") {
        svgStr += ' '+ polygonStyleString;
    }

    svgStr += ' points="';
    var preamble = '';
    for( var i = 0; i < polygon.vertices.length; i++ ) {
        vertex = polygon.getVertexAt( i);
        svgStr += preamble +
                   Girih.round(vertex.x, girihCanvasHandler.SVG_PRECISION ) +
                   ','+
                   Girih.round(vertex.y, girihCanvasHandler.SVG_PRECISION );
        boundingBox.updatePoint( vertex);
        preamble = ' ';
    }
    svgStr += '"/>';
    return svgStr
}



Tile.prototype.getSVGforFancyStrapping = function( options, buffer, indent) {
    // get the strap vectors for the tile
    vectors = this.getStrapVectors( {
                                     capGap: capGap(),
                                     strappingWidth: girihCanvasHandler.drawProperties.strappingWidth
                                    } );

    // render each strap vector
    for( index in vectors) {
        points = _findStrapSegmentPoints( vectors[ index]);
        // vector already has fillStyle and fillOpacity
        vectors[ index].strokeStyle = options.strappingStrokeColor;
        vectors[ index].strokeWidth = options.strappingStrokeWidth;
        this.getStrapSegmentSVG( points, vectors[ index], buffer, indent)
    }
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
 *       [1]     +------------------------------------------------+ [2]
 *       [0],[5] +                                                + [6]
 *       [4]     +------------------------------------------------+ [3]
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
    points.push( options.turtle.position); //start point [0, midpoint of start cap
    points.push( options.turtle.toaD( options.startAngle, startDiag/2).position);
                                                      //midpoint of start cap [1]
    points.push( options.turtle.toaD( -options.startAngle,
                     options.distance + startRightDist + endRightDist).position);
                                                             // left side [2]
    points.push( options.turtle.toaD( -options.endAngle, endDiag).position);
                                                             // end cap [3]
    points.push( options.turtle.toaD( options.endAngle + 10* piTenths,
                     options.distance + startLeftDist + endLeftDist).position);
                                                            // right side [4]
    points.push( options.turtle.toaD( options.startAngle - 10* piTenths,
                     startDiag/2).position); // start of start cap [5]
    points.push( options.turtle.toaD( -options.startAngle, options.distance).position);
                                                        // end of segment [6]

    return points;
}


/**************************************************************************
 *  drawStrapSegment -- draw a double girih strap segment with slanted ends
 *  This uses normal coordinates and distance and tranlated them to a canvas
 *  which may pan and zoom.
 *
 *  parameters: (parameters are named and can be in any order)
 *    canvasContext
 *    vector is a dictionary with the following:
 *      distance is the nominal length of the line in pixels (required)
 *      spacing is the distance between twin line centers in pixels
 *      startAngle is the cut angle at the start of the line with respect to the turtle
 *      endAngle is the cut angle at the end of the line with respect to the turtle
 *      startCap is true when a start cap is desired
 *      endCap is true when an end cap is desired
 *      fillStyle is optional style parameter used to fill shape
 *      fillOpacity is optional style parameter used to fill shape
 *      strokeStroke is optional style of the stroked line
 *      strokeWidth is optional width of the stroked line in pixels
 *      turtle is a turtle object and is required
 *          turtle.position is the start point
 *          turtle.angle is the segment angle
 *
 *  returns:
 *    turtle.position is the end point
 *    turtle.angle is the segment angle
 *************************************************************************/
/*
Tile.prototype.drawStrapSegment = function( canvasContext, {
        //distance,
        spacing = 4,
        startAngle = Math.PI/2,
        endAngle = Math.PI/2,
        startCap = true,
        endCap = true,
        fillOpacity = 1,
    }) {
    var vector = arguments[1];
    var points = _findStrapSegmentPoints( vector); // uses the turtle

    var zoomFactor = girihCanvasHandler.zoomFactor;
    var drawOffset = girihCanvasHandler.drawOffset;
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
    canvasContext.fillStyle = vector.fillStyle;
    canvasContext.fillOpacity = 1;
    canvasContext.closePath();
    canvasContext.fill();

    // stroke the segment for the lines
    canvasContext.beginPath();

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
    canvasContext.strokeStyle = girihCanvasHandler.drawProperties.strappingStrokeColor;
    //this.context.fillStyle = "";
    canvasContext.lineWidth = girihCanvasHandler.drawProperties.strappingStrokeWidth;
    canvasContext.stroke();
}
*/


function svgPointString( point) {
   return Girih.round( point.x) +' '+ Girih.round( point.y);
}


/**************************************************************************
 *  getStrapSegmentSVG -- get the SVG for a girih strap segment
 *
 *  parameters:
 *    points is an array of points defining the strap segment
 *    vector (parameters are named and can be in any order)
 *      distance is the nominal length of the line in pixels (required)
 *      spacing is the distance between twin line centers in pixels
 *      startAngle is the cut angle at the start of the line with respect to the turtle
 *      endAngle is the cut angle at the end of the line with respect to the turtle
 *      startCap is true when a start cap is desired
 *      endCap is true when an end cap is desired
 *      fillStyle is optional style parameter used to fill shape
 *      fillOpacity is optional style parameter used to fill shape
 *      strokeStroke is optional style of the stroked line
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
Tile.prototype.getStrapSegmentSVG = function(  points, vector, buffer, indent) {
    var svgLine = [] ;

    svgLine.push( svgString = indent.now + '<path class="gfill '+ vector.segmentClass +'" d="');
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
    svgLine.push( indent.now + '<path class="gstroke '+ vector.segmentClass +'" d="');
    // ...handle individual style for this segment
    if (vector.startCap) {
        svgLine.push( 'M' + svgPointString( points [0])); //half of start cap
        svgLine.push( 'L' + svgPointString( points [1])); //half of start cap
    } else {
        svgLine.push( 'M' + svgPointString( points [1])); //start of left side
    }
    svgLine.push( 'L' + svgPointString( points [2])); // left side
    if( vector.endCap) {
        svgLine.push( 'L' + svgPointString( points [3])); // end cap
    } else {
        svgLine.push( 'M' + svgPointString( points [3])); // end cap
    }
    svgLine.push( 'L' + svgPointString( points [4])); // right side
    if ( vector.startCap) {
        svgLine.push( 'L' + svgPointString( points [0])); // other half of start cap
    }
    svgLine.push( '"/>' + indent.eol);
    buffer.push( svgLine.join( ""));

    return
}


Tile.prototype.getSegmentClass = function( linkNumber) {
    var chainNumber = this.connectors[linkNumber].CWchainID
    if (chainNumber === undefined) {
        console.log("bad chain number for tile")
    }

    chain = girihCanvasHandler.girih.chains[ chainNumber];
    return "link_"+ linkNumber +" chain_"+ chainNumber
           +" chain_length_"+ chain.links.length
           + (chain.isLoop ? "L loop" : "")
}


Tile.prototype.getChainColor = function( linkNumber) {
    var chainNumber = this.connectors[linkNumber].CWchainID
    if (chainNumber === undefined) {
        console.log("bad chain number for tile")
    }
    var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
    if (chainColor === undefined) {
        console.log( "chain fill color not defined")
    }
    return chainColor;
}


/*
Tile.prototype.getSegmentClass = function( linkNumber, chainNumber) {
    chain = girihCanvasHandler.girih.chains[ chainNumber];
    return "link_"+ linkNumber +" chain_"+ chainNumber
           +" chain_length_"+ chain.links.length
           + (chain.isLoop ? "L loop" : "")
}
*/


Tile.prototype.computeBounds = function() {
    return new BoundingBox2( this.polygon.vertices );
};


Tile.prototype._translateVertex = function( vertex ) {
    //return vertex.clone().rotate( Point2.ZERO_POINT, this.angle ).add( this.position );
    return vertex.clone().rotate( Point2.ZERO_POINT, this.angle );
};
