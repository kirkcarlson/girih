/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/


IKRS.Tile.Pentagon = function( size, position, angle, fillColor ) {

    IKRS.Tile.call( this, size, position, angle, IKRS.Girih.TILE_TYPE_PENTAGON );

    this.buildPolygon();
/*
    // Init the actual decahedron shape with the passed size
    var pointA = new IKRS.Point2(0,0);
    var pointB = pointA;
    this._addVertex( pointB );

    //var theta = Math.PI*2 * (90.0 / 108.0);
    var theta = (Math.PI*2) / 5;
    for( var i = 1; i <= 4; i++ ) {
	pointA = pointB; // center of rotation
	pointB = pointB.clone();
	pointB.x += size;
	pointB.rotate( pointA, i*theta );
	this._addVertex( pointB );
    }
*/


/*
    // Move to center
    // Calculate the diameter of the bounding circle
    var r_out  = (size/10) * Math.sqrt( 50 + 10*Math.sqrt(5) );
    // Calculate the diameter of the inner circle
    var r_in   = (size/10) * Math.sqrt( 25 + 10*Math.sqrt(5) );
    //var bounds = IKRS.BoundingBox2.computeFromPoints( this.vertices );
    var move   = new IKRS.Point2( size/2.0,
				  -r_out + (r_out-r_in)
				);
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

	this.polygon.vertices[i].add( move );

    }

*/
    if (fillColor !== undefined) {
        this.fillColor = fillColor;
    } else {
        this.fillColor = girihCanvasHandler.drawProperties.pentagonFillColor;
    }

    this.imageProperties = {
	source: {	x:      7/500.0,
			y:      (303-15)/460.0, // -16
			width:  157/500.0,
			height: (150+15)/460.0  // +16
		},
	destination: { xOffset: 0.0,
		       yOffset: -18/460.0 // -16
		     }

    };
    //this.imageProperties.source.center = new IKRS.Point2( this.imageProperties.source.x + this.imageProperties.source.x


    this._buildInnerPolygons( size );
    this._buildOuterPolygons();       // Only call AFTER the inner polygons were built!
};


IKRS.Tile.Pentagon.getFaces = function() {
    var faces = [];
    for (var i=0; i<5; i++) {
        faces.push( new IKRS.Face(
             /*centralAngle:*/       (0 + (i*4)) * piTenths,
             /*angleToNextVertex:*/  4* piTenths,
             /*lengthCoefficient:*/  1,
             /*angleToCenter:*/      7* piTenths,
             /*radialCoefficient:*/  1/(2* Math.sin( 2* piTenths))
        ));
    }
    return faces;
}


IKRS.Tile.Pentagon.prototype._buildInnerPolygons = function( edgeLength ) {
    var innerTile = new IKRS.Polygon(); // [];
    var faces = IKRS.Girih.TILE_FACES [this.tileType];


    girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of pentagon
    girihCanvasHandler.posToAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    girihCanvasHandler.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0
    for( var i = 0; i<5; i++) {
	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point
	girihCanvasHandler.posToaD(  3* piTenths, 0.425 * this.size);
	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //bend point
	girihCanvasHandler.posToaD( -2* piTenths, 0.425 * this.size);
	girihCanvasHandler.posToaD( 3* piTenths, 0); // at next vertice
    }
    this.innerTilePolygons.push( innerTile );
}





IKRS.Tile.Pentagon.prototype._buildInnerPolygonsOLD = function( edgeLength ) {
    // Connect all edges half-the-way
    var innerTile = new IKRS.Polygon(); // [];
    //innerTile.push( this.vertices[0].scaleTowards( this.vertices[1], 0.5 ) );
    //innerTile.push( this.vertices[1].scaleTowards( this.vertices[2], 0.5 ) );

    var center = new IKRS.Point2( 0, 0 );
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

	innerTile.addVertex( this.getVertexAt(i).scaleTowards( this.getVertexAt(i+1), 0.5 ) ); //mid point


	// This algorithm using circles to detect the intersection point
	// does not work as expected:
	/*
	  // Compute the next inner polygon vertex by the intersection of two circles
	  var circleA = new IKRS.Circle( innerTile.vertices[ innerTile.vertices.length-1 ], edgeLength*0.425 ); //*0.425 );
	  var circleB = new IKRS.Circle( this.getVertexAt(i+1).clone().scaleTowards( this.getVertexAt(i+2), 0.5 ),
	  			         circleA.radius );

	  // There is definitely an intersection
	  var intersection = circleA.computeIntersectionPoints( circleB );
	  // One of the two points is inside the tile, the other is outside.
	  // Locate the inside point.
	  if( intersection ) {
	      if( this.containsPoint(intersection.pointA) ) innerTile.addVertex(intersection.pointA);
	      else                                          innerTile.addVertex(intersection.pointB);
	  } else {
	      console.log( "intersection is null!" );
	  }
	*/

	// ... make linear approximation instead
	innerTile.addVertex( this.getVertexAt(i+1).scaleTowards( center, 0.5 ) );

    }

    //window.alert( innerTile.length );

    this.innerTilePolygons.push( innerTile );
};


IKRS.Tile.Pentagon.prototype._buildOuterPolygons = function() {

    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

	var indexA     = i; //indicesA[i];
	var indexB     = i*2; // indicesB[i];
	// The triangle
	var outerTileX = new IKRS.Polygon();
	outerTileX.addVertex( this.getVertexAt(indexA+1).clone() );
	outerTileX.addVertex( this.innerTilePolygons[0].getVertexAt(indexB).clone() );
	outerTileX.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+1).clone() );
	outerTileX.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+2).clone() );
	this.outerTilePolygons.push( outerTileX );

    }

};


// Nasty Trick #1
//the following three functions are really in the wrong place
// it is in this file because it is specific to Pentagons
// it is part of the GirihCanvasHandler because it is manipulating the canvas image


IKRS.GirihCanvasHandler.prototype.drawFancyPentagonStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];

    this.moveToXY( tile.position.x, tile.position.y); // center of pentagon
this.context.beginPath(); //DEBUG
    this.lineToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //vertex 0
    this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //midpoint of side 0
this.context.strokeStyle = "#FFFFFF"; //DEBUG
this.context.stroke(); //DEBUG
    for( var i = 0; i<5; i++) {
	lineNumber = i
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;

	this.lineToaD( 3* piTenths, 0);
	this.gline( 0.425 * tile.size, strapWidth, 7* piTenths, 6* piTenths, false, false, chainColor);
	this.lineToaD( -2* piTenths, 0);
	this.gline( 0.425 * tile.size - capGap, strapWidth, 6* piTenths, 4* piTenths, false, true, chainColor);
	this.moveToaD( 0, capGap);
	this.lineToaD( 3* piTenths, 0);
    }
}


IKRS.GirihCanvasHandler.prototype.getSVGforFancyPentagonStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var svgStrings = [];

    this.posToXY( tile.position.x, tile.position.y); // center of pentagon
    this.posToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //vertex 0
    this.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //midpoint of side 0
    for( var i = 0; i<5; i++) {
	lineNumber = i
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' Chain_Length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();

	this.posToaD( 3* piTenths, 0);
	svgStrings.push( this.getGlineSVG( 0.425 * tile.size, strapWidth,
                         7* piTenths, 6* piTenths, false, false, chainColor));
	this.posToaD( -2* piTenths, 0);
	svgStrings.push( this.getGlineSVG( 0.425 * tile.size - capGap, strapWidth,
                         6* piTenths, 4* piTenths, false, true, chainColor));
	this.posToaD( 0, capGap);
	this.posToaD( 3* piTenths, 0);
        this.indentDec()
        svgStrings.push( this.indent + '</g>' + this.eol);
    }
    return svgStrings.join("");
}


//this would be more efficient to use the generic routines
IKRS.GirihCanvasHandler.prototype.tile_pentagon_drawBoundingBox = function(tile) {
//inputs: size, position, angle, context
// maybe this should use the boundingBox structure and not be shape dependent
    var height = tile.size * (Math.sin( 2* piTenths) + Math.cos( 1* piTenths));
    var width = tile.size * (1+Math.cos( 3* piTenths));
    var radial = tile.size/(2 * Math.sin( 2 * piTenths));

    this.context.beginPath();

    this.moveToXY( tile.position.x, tile.position.y); // center of pentagon
    this.moveToAD( tile.angle -7* piTenths, radial); //top of pentagon
    this.lineToaD( -3* piTenths, tile.size/2 * Math.cos( 3* piTenths)); //NW corner of boundingSquare
    this.lineToaD( 10* piTenths, width); //NE corner of boundingSquare
    this.lineToaD( 5* piTenths, height); //SE corner of boundingSquare
    this.lineToaD( 5* piTenths, width); //SW corner of boundingSquare
    this.lineToaD( 5* piTenths, height); //NW corner of boundingSquare

    this.context.strokeStyle = "#c8c8ff";
    this.context.stroke();
    this.context.closePath();
}



// This is totally shitty. Why object inheritance when I still
// have to inherit object methods manually??!
IKRS.Tile.Pentagon.prototype.moveToXY                = IKRS.GirihCanvasHandler.prototype.moveToXY;
IKRS.Tile.Pentagon.prototype.moveToAD                = IKRS.GirihCanvasHandler.prototype.moveToAD;
IKRS.Tile.Pentagon.prototype.moveToaD                = IKRS.GirihCanvasHandler.prototype.moveToaD;
//IKRS.Tile.Pentagon.prototype.posToXY                 = IKRS.GirihCanvasHandler.prototype.posToXY;
//IKRS.Tile.Pentagon.prototype.posToAD                 = IKRS.GirihCanvasHandler.prototype.posToAD;
//IKRS.Tile.Pentagon.prototype.posToaD                 = IKRS.GirihCanvasHandler.prototype.posToaD;
//IKRS.Tile.Pentagon.prototype.getTurtlePosition       = IKRS.GirihCanvasHandler.prototype.getTurtlePosition;
//IKRS.Tile.Pentagon.prototype.getTurtleAngle          = IKRS.GirihCanvasHandler.prototype.getTurtleAngle;
IKRS.Tile.Pentagon.prototype.gline                   = IKRS.GirihCanvasHandler.prototype.gline;
IKRS.Tile.Pentagon.prototype.buildPolygon            = IKRS.Tile.prototype.buildPolygon;
IKRS.Tile.Pentagon.prototype.computeBounds           = IKRS.Tile.prototype.computeBounds;
IKRS.Tile.Pentagon.prototype._addVertex              = IKRS.Tile.prototype._addVertex;
IKRS.Tile.Pentagon.prototype._translateVertex        = IKRS.Tile.prototype._translateVertex;
IKRS.Tile.Pentagon.prototype._polygonToSVG           = IKRS.Tile.prototype._polygonToSVG;
IKRS.Tile.Pentagon.prototype.getInnerTilePolygonAt   = IKRS.Tile.prototype.getInnerTilePolygonAt;
IKRS.Tile.Pentagon.prototype.getOuterTilePolygonAt   = IKRS.Tile.prototype.getOuterTilePolygonAt;
IKRS.Tile.Pentagon.prototype.getTranslatedVertex     = IKRS.Tile.prototype.getTranslatedVertex;
IKRS.Tile.Pentagon.prototype.containsPoint           = IKRS.Tile.prototype.containsPoint;
IKRS.Tile.Pentagon.prototype.locateEdgeAtPoint       = IKRS.Tile.prototype.locateEdgeAtPoint;
IKRS.Tile.Pentagon.prototype.locateAdjacentEdge      = IKRS.Tile.prototype.locateAdjacentEdge;
IKRS.Tile.Pentagon.prototype.getVertexAt             = IKRS.Tile.prototype.getVertexAt;
IKRS.Tile.Pentagon.prototype.toSVG                   = IKRS.Tile.prototype.toSVG;

IKRS.Tile.Pentagon.prototype.constructor             = IKRS.Tile.Pentagon;
