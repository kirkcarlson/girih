/**
 * @author Ikaros Kappler
 * @date 2013-11-28
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/


//IKRS.Tile.Rhombus = function( size, position, angle, fillColor) {

//    IKRS.Tile.call( this, size, position, angle, IKRS.Girih.TILE_TYPE_RHOMBUS  );

class Rhombus extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.rhombusFillColor;
        }

        super( size, position, angle, IKRS.Girih.TILE_TYPE_RHOMBUS, fillColor );
        // in theory type should not be needed.

        this.buildPolygon();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

/*
    // Init the actual decahedron shape with the passed size
    var pointA = new IKRS.Point2(0,0);
    var pointB = pointA;
    this._addVertex( pointB );

    var angles = [ 0.0,
		   72.0,
		   108.0
		   // 72.0
		 ];

    var theta = 0.0;
    for( var i = 0; i < angles.length; i++ ) {

	theta += (180.0 - angles[i]);

	pointA = pointB; // center of rotation
	pointB = pointB.clone();
	pointB.x += size;
	pointB.rotate( pointA, theta * (Math.PI/180.0) );
	this._addVertex( pointB );

    }


    // Move to center
    var bounds = IKRS.BoundingBox2.computeFromPoints( this.polygon.vertices );
    var move   = new IKRS.Point2( bounds.getWidth()/2.0 - (bounds.getWidth()-size),
				  bounds.getHeight()/2.0
				);
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

	this.polygon.vertices[i].add( move );

    }

*/

    this.imageProperties = {
	source: { x:      32/500.0,
		  y:      188/460.0,
		  width:  127/500.0, // 127,
		  height: 92/460.0
		},
	destination: { xOffset: 0.0,
		       yOffset: 0.0
		     }
    }
    }
};


Rhombus.getFaces = function () {
    var faces = [];
    var radialShort = Math.sin( 2* piTenths);
    var radialLong = Math.cos( 2* piTenths);
    for (var i=0; i<2; i++) {
        faces.push( new IKRS.Face(
            /*centralAngle:*/       0 + i* Math.PI,
            /*angleToNextVertex:*/  4* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      7* piTenths,
            /*radialCoefficient:*/  radialShort
        ));
        faces.push( new IKRS.Face(
            /*centralAngle:*/       5* piTenths + i* Math.PI,
            /*angleToNextVertex:*/  6* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      8* piTenths,
            /*radialCoefficient:*/  radialLong
        ));
    }
    return faces;
}


Rhombus.prototype._buildInnerPolygons = function( ) {
    const bentSegmentLength = 0.424 * this.size // bent segment
    const directSegmentLength = 0.587 * this.size // direct cross segment

    var innerTile =  new IKRS.Polygon(); // [];
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of rhombus
    girihCanvasHandler.posToAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    girihCanvasHandler.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    for (var i = 0; i<2; i++ ) {
        innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());
        girihCanvasHandler.posToaD( 3* piTenths, directSegmentLength); //midpoint of side 1 or 3

        innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());
        girihCanvasHandler.posToaD( 6* piTenths, bentSegmentLength); // middle of bend

        innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());
        girihCanvasHandler.posToaD( -2* piTenths, bentSegmentLength); // mindpoint of 2 or 0
        girihCanvasHandler.posToaD( 3* piTenths, 0);
    }

    this.innerTilePolygons.push( innerTile );

/*
IKRS.GirihCanvasHandler.prototype.drawFancyRhombusStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];

    this.moveToXY( tile.position.x, tile.position.y); // Center of rhombus
    this.moveToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of rhombus
    this.moveToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    this.moveToaD( 3* piTenths, 0); // ready to go

    var bentSegmentLength = 0.424 * tile.size // bent segment
    var directSegmentLength = 0.587 * tile.size // direct cross segment

    for (var i = 0; i<2; i++ ) {
        this.gline( directSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6 * piTenths, 0)

        this.gline( bentSegmentLength, strapWidth, 7* piTenths, 6* piTenths, false, false, chainColor)
        this.moveToaD( -2* piTenths, 0)
        this.gline( bentSegmentLength - capGap, strapWidth, 6* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6* piTenths, 0)
    }
}
*/
};

Rhombus.prototype._buildInnerPolygonsOld = function() {

       // Connect all edges half-the-way
    var innerTile = new IKRS.Polygon(); // [];
    innerTile.addVertex( this.polygon.vertices[0].scaleTowards( this.polygon.vertices[1], 0.5 ) );
    innerTile.addVertex( this.polygon.vertices[1].scaleTowards( this.polygon.vertices[2], 0.5 ) );

    // Compute the next inner polygon vertex by the intersection of two circles
    var circleA = new IKRS.Circle( innerTile.vertices[1], innerTile.vertices[0].distanceTo(innerTile.vertices[1])*0.73 );
    var circleB = new IKRS.Circle( this.polygon.vertices[2].scaleTowards( this.polygon.vertices[3], 0.5 ), circleA.radius );

    // There is definitely an intersection
    var intersection = circleA.computeIntersectionPoints( circleB );
    // One of the two points is inside the tile, the other is outside.
    // Locate the inside point.
    if( this.containsPoint(intersection.pointA) ) innerTile.addVertex(intersection.pointA);
    else                                          innerTile.addVertex(intersection.pointB);

    innerTile.addVertex( circleB.center );
    innerTile.addVertex( this.polygon.vertices[3].scaleTowards( this.polygon.vertices[0], 0.5 ) );

    // Move circles
    circleA.center = innerTile.vertices[4];
    circleB.center = innerTile.vertices[0];
    //window.alert( "circleA=" + circleA + ", circleB=" + circleB );
    intersection   = circleA.computeIntersectionPoints( circleB );
    // There are two points again (one inside, one outside the tile)
    if( this.containsPoint(intersection.pointA) ) innerTile.addVertex(intersection.pointA);
    else                                          innerTile.addVertex(intersection.pointB);

    this.innerTilePolygons.push( innerTile );

};


Rhombus.prototype._buildOuterPolygons = function() {
    const bentSegmentLength = 0.424 * this.size // bent segment
    const directSegmentLength = 0.587 * this.size // direct cross segment

    var tile0 =  new IKRS.Polygon(); // [];
    var tile1 =  new IKRS.Polygon(); // [];
    var tile2 =  new IKRS.Polygon(); // [];
    var tile3 =  new IKRS.Polygon(); // [];

    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of rhombus
    girihCanvasHandler.posToAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    girihCanvasHandler.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    tile0.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    tile0.addVertex( this.getVertexAt(0).clone());

    tile1.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    girihCanvasHandler.posToaD( 3* piTenths, directSegmentLength); //midpoint of side 1
    tile1.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    tile1.addVertex( this.getVertexAt(1).clone());

    tile2.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    girihCanvasHandler.posToaD( 6* piTenths, bentSegmentLength); // middle of bend
    tile2.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    girihCanvasHandler.posToaD( -2* piTenths, bentSegmentLength); // mindpoint of 2
    tile2.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    tile2.addVertex( this.getVertexAt(2).clone());

    tile3.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    girihCanvasHandler.posToaD( 6* piTenths, directSegmentLength); //midpoint of side 3
    tile3.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    tile3.addVertex( this.getVertexAt(3).clone());

    tile0.addVertex( girihCanvasHandler.getTurtlePosition().clone());
    girihCanvasHandler.posToaD( 6* piTenths, bentSegmentLength); // middle of bend
    tile0.addVertex( girihCanvasHandler.getTurtlePosition().clone());

    this.outerTilePolygons.push( tile0 );
    this.outerTilePolygons.push( tile1 );
    this.outerTilePolygons.push( tile2 );
    this.outerTilePolygons.push( tile3 );
}


Rhombus.prototype._buildOuterPolygonsOld = function() {

    var indicesA = [ 0, 2 ];  // 4:2
    var indicesB = [ 0, 3 ];  // 6:2
    for( var i = 0; i < indicesA.length; i++ ) {

	var indexA     = indicesA[i];
	var indexB     = indicesB[i];
	// The triangle
	var outerTileX = new IKRS.Polygon();
	outerTileX.addVertex( this.getVertexAt(indexA+1).clone() );
	outerTileX.addVertex( this.innerTilePolygons[0].getVertexAt(indexB).clone() );
	outerTileX.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+1).clone() );
	this.outerTilePolygons.push( outerTileX );

	// The first 'kite'
	var outerTileY = new IKRS.Polygon();
	outerTileY.addVertex( this.getVertexAt(indexA+2).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+1).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+2).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+3).clone() );
	this.outerTilePolygons.push( outerTileY );

	/*
	// The second 'kite'
	var outerTileY = new IKRS.Polygon();
	outerTileY.addVertex( this.getVertexAt(indexA+3).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+3).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+4).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+5).clone() );
	this.outerTilePolygons.push( outerTileY );
	*/
    }

};


/*
Rhombus.prototype.drawFancyStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];

    //color( lineColor)
    //width( lineWidth)
    this.context.beginPath()
    this.moveToXY( tile.position.x, tile.position.y); // Center of rhombus
    this.moveToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of rhombus
    this.moveToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    this.moveToaD( 3* piTenths, 0); // ready to go

    this.context.strokeStyle = "#FF0000";
    this.context.stroke()
    this.context.closePath();

    var lineNumber = 0
    var bentSegmentLength = 0.424 * tile.size // bent segment
    var directSegmentLength = 0.587 * tile.size // direct cross segment

    for (var i = 0; i<2; i++ ) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.gline( directSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6 * piTenths, 0)
        //endGroup()

        lineNumber = lineNumber + 1
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.gline( bentSegmentLength, strapWidth, 7* piTenths, 6* piTenths, false, false, chainColor)
        this.moveToaD( -2* piTenths, 0)
        this.gline( bentSegmentLength - capGap, strapWidth, 6* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6* piTenths, 0)
        lineNumber = lineNumber + 1
        //endGroup()
    }
}


Rhombus.prototype.getSVGforFancyStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var svgStrings = [];

    //color( lineColor)
    //width( lineWidth)
    this.context.beginPath()
    this.posToXY( tile.position.x, tile.position.y); // Center of rhombus
    this.posToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of rhombus
    this.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    this.posToaD( 3* piTenths, 0); // ready to go

    this.context.strokeStyle = "#FF0000";
    this.context.stroke()
    this.context.closePath();

    var lineNumber = 0
    var bentSegmentLength = 0.424 * tile.size // bent segment
    var directSegmentLength = 0.587 * tile.size // direct cross segment

    for (var i = 0; i<2; i++ ) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' chain_length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();
        svgStrings.push( this.getGlineSVG( directSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, capGap)
        this.posToaD( 6 * piTenths, 0)
        //endGroup()
        this.indentDec()
        svgStrings.push( this.indent + '</g>' + this.eol);

        lineNumber = lineNumber + 1
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' chain_length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();
        svgStrings.push( this.getGlineSVG( bentSegmentLength, strapWidth, 7* piTenths, 6* piTenths, false, false, chainColor))
        this.posToaD( -2* piTenths, 0)
        svgStrings.push( this.getGlineSVG( bentSegmentLength - capGap, strapWidth, 6* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, capGap)
        this.posToaD( 6* piTenths, 0)
        lineNumber = lineNumber + 1
        //endGroup()
        this.indentDec()
        svgStrings.push( this.indent + '</g>' + this.eol);
    }
    return svgStrings.join("")
}
*/


Rhombus.prototype.getSVGforFancyStrapping = function( options) {
    this._drawFancyStrapping (undefined, true, options);
}


Rhombus.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


Rhombus.prototype._drawFancyStrapping = function(canvasContext, svg, options) {
//inputs: size, position, angle, canvas context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    turtle = new Turtle();
    var bentSegmentLength = 0.424 * this.size // bent segment
    var directSegmentLength = 0.587 * this.size // direct cross segment
    var capGap = options.capGap;
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    // do all of the straps
    for( var i = 0; i<2; i++) {
        turtle.toXY( this.position.x, this.position.y); // center of decagon
        turtle.toAD( this.angle + faces[0 +i*2].centralAngle, faces[0 +i*2].radialCoefficient * this.size); //vertex of decagon
        turtle.toaD( Math.PI - faces[0 +i*2].angleToCenter + faces[0 +i*2].angleToNextVertex, this.size/2); //at midpoint

        turtle.toaD( 3* piTenths, 0); // ready for strapping

        var chainNumber = this.connectors[ 0 +i*2].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:i} , ["strap"]))
	strapOptions = { turtle: turtle,
                         distance: directSegmentLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 0 +i*2, chainNumber)
                       };
        if (svg) {
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
        //endGroup
        turtle.toaD( 0, capGap); // to edgue
        turtle.toaD( 6 * piTenths, 0) // ready for next strap

        var chainNumber = this.connectors[ 1 +i*2].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

	strapOptions = { turtle: turtle,
                         distance: bentSegmentLength,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 6* piTenths,
                         startCap: false,
                         endCap: false,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 1+ i*2, chainNumber)
                       };
        if (svg) {
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
	turtle.toaD( -2* piTenths, 0); //do the bend

	strapOptions = { turtle: turtle,
                         distance: bentSegmentLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 6* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 1+ i*2, chainNumber)
                       };
        if (svg) {
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
	//endGroup()
    }
}




// This is totally shitty. Why object inheritance when I still
// have to inherit object methods manually??!
//IKRS.Tile.Rhombus.prototype.buildPolygon            = IKRS.Tile.prototype.buildPolygon;
//IKRS.Tile.Rhombus.prototype.computeBounds           = IKRS.Tile.prototype.computeBounds;
//IKRS.Tile.Rhombus.prototype._addVertex              = IKRS.Tile.prototype._addVertex;
//IKRS.Tile.Rhombus.prototype._translateVertex        = IKRS.Tile.prototype._translateVertex;
//IKRS.Tile.Rhombus.prototype._polygonToSVG           = IKRS.Tile.prototype._polygonToSVG;
//IKRS.Tile.Rhombus.prototype.getInnerTilePolygonAt   = IKRS.Tile.prototype.getInnerTilePolygonAt;
//IKRS.Tile.Rhombus.prototype.getOuterTilePolygonAt   = IKRS.Tile.prototype.getOuterTilePolygonAt;
//IKRS.Tile.Rhombus.prototype.getTranslatedVertex     = IKRS.Tile.prototype.getTranslatedVertex;
//IKRS.Tile.Rhombus.prototype.containsPoint           = IKRS.Tile.prototype.containsPoint;
//IKRS.Tile.Rhombus.prototype.locateEdgeAtPoint       = IKRS.Tile.prototype.locateEdgeAtPoint;
//IKRS.Tile.Rhombus.prototype.locateAdjacentEdge      = IKRS.Tile.prototype.locateAdjacentEdge;
//IKRS.Tile.Rhombus.prototype.getVertexAt             = IKRS.Tile.prototype.getVertexAt;
//IKRS.Tile.Rhombus.prototype.toSVG                   = IKRS.Tile.prototype.toSVG;

//IKRS.Tile.Rhombus.prototype.constructor             = IKRS.Tile.Rhombus;
