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
 * @param size     number  The edge size (usually IKRS.Girih.DEFAULT_EDGE_LENGTH).
 * @param position Point2  The position of the tile.
 * @param angle    number  The rotation angle.
 * @param tileType integer One of IKRS.Girih.TILE_TYPE_*.
 **/
class Tile {
    constructor( size,
                 position,
                 angle = 0.0,
                 tileType = IKRS.Girih.TILE_TYPE_UNKNOWN,
                 fillColor
                ) {

        this.size                 = size;
        this.position             = position;
        this.angle                = angle % (2* Math.PI);
        this.tileType             = tileType;
        this.fillColor            = fillColor;

        this.polygon              = new IKRS.Polygon(); // Empty vertice array

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
    var faces = IKRS.Girih.TILE_FACES [this.tileType];
    var face = faces[0];

    turtle.toXY( this.position.x, this.position.y);
    turtle.toAD( this.angle + face.centralAngle,
                 face.radialCoefficient * this.size);
    turtle.toaD( Math.PI - face.angleToCenter, 0);
    for (var i = 0; i< faces.length; i++) {
        this.polygon.vertices[i] = turtle.position; // save vertex

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
        var midpoint = new IKRS.Point2 ((edge.pointA.x + edge.pointB.x)/2,
                                        (edge.pointA.y + edge.pointB.y)/2);
        var connector = new IKRS.Connector( i, midpoint);
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


function randomColor () {
    return 'rgb(' + Math.round( Math.random()*255 ) + ',' +
                    Math.round( Math.random()*255 ) + ',' +
                    Math.round( Math.random()*255 ) + ')';
}


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
    classStr = "polygon " + IKRS.Girih.TILE_TYPE_NAMES[ this.tileType];

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
    buffer.push( indent.now + girihCanvasHandler.getSVGTileFromFaces (
                 this, idStr, classStr, styleStr, boundingBox) + indent.eol);

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
                     capGap: girihCanvasHandler.capGap(),
                     strappingWidth: drawProperties.strappingWidth,
                     strappingStrokeWidth: drawProperties.strappingStrokeWidth,
                     strappingStrokeColor: drawProperties.strappingStrokeColor,
                     strappingFillColor: drawProperties.strappingFillColor,
                                  }, buffer, indent);

        indent.dec();
        buffer.push( indent.now + '</g>' + indent.eol);
    }
    if( returnBuffer ) {
        return buffer;
    } else {
        return buffer.join( "" );
    }
};


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
        vertex = polygon.getVertexAt(i);
        svgStr += preamble +
                   IKRS.round(vertex.x, girihCanvasHandler.SVG_PRECISION ) +
                   ','+
                   IKRS.round(vertex.y, girihCanvasHandler.SVG_PRECISION );
        boundingBox.evaluatePoint( vertex.x, vertex.y)
        preamble = ' ';
    }
    svgStr += '"/>';
    return svgStr
}


Tile.prototype.getSegmentClass = function( linkNumber, chainNumber) {
    chain = girihCanvasHandler.girih.chains[ chainNumber];
    return "link_"+ linkNumber +" chain_"+ chainNumber
           +" chain_length_"+ chain.links.length
           + (chain.isLoop ? "L loop" : "")
}


Tile.prototype.computeBounds = function() {
    return IKRS.BoundingBox2.computeFromPoints( this.polygon.vertices );
};


Tile.prototype._translateVertex = function( vertex ) {
    //return vertex.clone().rotate( IKRS.Point2.ZERO_POINT, this.angle ).add( this.position );
    return vertex.clone().rotate( IKRS.Point2.ZERO_POINT, this.angle );
};


Tile.prototype._addVertex = function( vertex ) {
    this.polygon.vertices.push( vertex );
};
