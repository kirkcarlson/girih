/**
 * @author Ikaros Kappler
 * @date 2013-11-28
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/


//IKRS.Tile.IrregularHexagon = function( size, position, angle, fillColor ) {

//    IKRS.Tile.call( this, size, position, angle, IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON );
class IrregularHexagon extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.irregularHexagonFillColor;
        }

        super( size, position, angle, IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON, fillColor );
        // in theory type should not be needed.

        this.buildPolygon();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

/*
    //window.alert( "[IrregularHexagon.init()] size=" + size + ", position=" + position.toString() + ", angle=" + angle );

    // Init the actual decahedron shape with the passed size
    var pointA        = new IKRS.Point2(0,0);
    var pointB        = pointA;
    var startPoint    = pointA;
    var oppositePoint = null;
    this._addVertex( pointB );

    var angles = [ 0.0,
		   72.0,
		   144.0,
		   144.0,
		   72.0
		   // 144.0
		 ];

    var theta = 0.0;
    for( var i = 0; i < angles.length; i++ ) {

	theta += (180.0 - angles[i]);

	pointA = pointB; // center of rotation
	pointB = pointB.clone();
	pointB.x -= size;
	pointB.rotate( pointA, theta * (Math.PI/180.0) );
	this._addVertex( pointB );

	if( i == 2 )
	    oppositePoint = pointB;

    }

    // Move to center
    var bounds = IKRS.BoundingBox2.computeFromPoints( this.polygon.vertices );
    var move   = new IKRS.Point2( (oppositePoint.x - startPoint.x)/2.0,
				  (oppositePoint.y - startPoint.y)/2.0
				);
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

	this.polygon.vertices[i].sub( move );

    }
*/

    this.imageProperties = {
	source: { x:      77/500.0, // 75,
		  y:      11/460.0,
		  width:  205/500.0, // 207,
		  height: 150/460.0  // 150
		},
	destination: { xOffset: 0.0,
		       yOffset: 0.0
		     }
    }
    }
};


IrregularHexagon.getFaces = function() {
    var faces = [];
    var halfNarrowWidth = Math.sin( 2* piTenths); // assuming size = 1
    //var radialShort = Math.sqrt( halfNarrowWidth*halfNarrowWidth + 1/4);
    var radialLong =  Math.cos(2* piTenths) + 1/2 ;//half the long width of the hexagon
    var radialAngle = Math.atan( (1/2) / halfNarrowWidth)
    var radialShort = halfNarrowWidth / Math.cos( radialAngle);
    //var radialAngle = Math.atan(  halfNarrowWidth/(1/2))
    for (var i=0; i<2; i++) {
        faces.push( new IKRS.Face( // left side of point
            /*centralAngle*/        10* piTenths + radialAngle + i* Math.PI,
            /*angleToNextVertex:*/  2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      5* piTenths + radialAngle,
            /*radialCoefficient:*/  radialShort
        ));
        faces.push( new IKRS.Face( // right side of point
            /*centralAngle:*/       15* piTenths + i* Math.PI,
            /*angleToNextVertex:*/  6* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      8* piTenths,
            /*radialCoefficient:*/  radialLong
        ));
        faces.push( new IKRS.Face( // flat side
            /*centralAngle:*/       0* piTenths - radialAngle + i* Math.PI,
            /*angleToNextVertex:*/  2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      7* piTenths - radialAngle,
            /*radialCoefficient:*/  radialShort
        ));
    }
    return faces;
}

/*
IrregularHexagon.prototype.drawFancyGirihStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    //color( lineColor)
    //width( lineWidth)
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var strapLength = 0.587 * tile.size
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];

    var lineNumber = 0
    this.moveToXY( tile.position.x, tile.position.y); // Center of hexagon
    this.lineToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //at polygon vertice
    this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //at midpoint
    this.moveToaD( 3* piTenths, 0); // ready to go

    for( var j = 0; j< 2; j++) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = this.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.gline( strapLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap);
        this.moveToaD( 6* piTenths, 0);
        lineNumber = lineNumber + 1
        //endGroup()

        for( var i = 0; i< 2; i++) {
            var chainNumber = tile.connectors[ lineNumber].CWchainID
            var chainColor = this.girih.chains[chainNumber].fillColor;
            //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
            this.gline( strapLength, strapWidth, 7* piTenths, 7* piTenths, false, false, chainColor)
            this.moveToaD( -4* piTenths, 0);
            this.gline( strapLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
            this.moveToaD( 0, capGap);
            this.moveToaD( 6* piTenths, 0);
            lineNumber = lineNumber + 1
            //endGroup()
        }
    }
}


IrregularHexagon.prototype.getSVGforFancyGirihStrapping = function(tile) {
//inputs: size, position, angle, context
//returns SVG string
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    //color( lineColor)
    //width( lineWidth)
console.log("HexStart")
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var strapLength = 0.587 * tile.size
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var svgStrings = [];

    var lineNumber = 0
    this.posToXY( tile.position.x, tile.position.y); // Center of hexagon
    this.posToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //at polygon vertice
    this.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //at midpoint
    this.posToaD( 3* piTenths, 0); // ready to go

    for( var j = 0; j< 2; j++) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = this.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]));
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' chain_length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();
        svgStrings.push( this.getGlineSVG( strapLength - capGap, strapWidth,
			 7* piTenths, 4* piTenths, false, true, chainColor));
        this.posToaD( 0, capGap);
        this.posToaD( 6* piTenths, 0);
        lineNumber = lineNumber + 1;
        this.indentDec();
        svgStrings.push( this.indent + '</g>' + this.eol);

        for( var i = 0; i< 2; i++) {
            var chainNumber = tile.connectors[ lineNumber].CWchainID;
            var chainColor = this.girih.chains[chainNumber].fillColor;
            //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
            svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		    ' Chain_'+ chainNumber +
		    ' chain_length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		    (girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		    '">' + this.eol);
            this.indentInc();
            svgStrings.push( this.getGlineSVG( strapLength, strapWidth, 7* piTenths,
			     7* piTenths, false, false, chainColor));
            this.posToaD( -4* piTenths, 0);
            svgStrings.push( this.getGlineSVG( strapLength - capGap, strapWidth,
			     7* piTenths, 4* piTenths, false, true, chainColor));
            this.indentDec()
            svgStrings.push( this.indent + '</g>' + this.eol);
            this.posToaD( 0, capGap);
            this.posToaD( 6* piTenths, 0);
            lineNumber = lineNumber + 1;
            //endGroup()
        }
    }
console.log("HexEND")
    return svgStrings.join("")
}
*/


IrregularHexagon.prototype.getSVGforFancyStrapping = function( options) {
    this._drawFancyStrapping (undefined, true, options);
}


IrregularHexagon.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


IrregularHexagon.prototype._drawFancyStrapping = function(canvasContext, svg, options) {
//inputs: size, position, angle, canvas context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    turtle = new Turtle();
    var strapLength = 0.587 * this.size // overall length of each strap
    var capGap = options.capGap;
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    // do all of the straps
    for( var i = 0; i<2; i++) {
        turtle.toXY( this.position.x, this.position.y); // center of hexagon
        turtle.toAD( this.angle + faces[0 +i*3].centralAngle, faces[0 +i*3].radialCoefficient * this.size); //vertex of hexagon
        turtle.toaD( Math.PI - faces[0 +i*3].angleToCenter + faces[0 +i*3].angleToNextVertex, this.size/2); //at midpoint

        turtle.toaD( 3* piTenths, 0); // ready for strapping

        var chainNumber = this.connectors[ 0 +i*3].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:i} , ["strap"]))
	strapOptions = { turtle: turtle,
                         distance: strapLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( i, chainNumber)
                       };
        if (svg) {
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
	turtle.toaD( 0, capGap); // gap on each side of strap
	turtle.toaD( 6* piTenths, 0); // ready for next strap

        for( var j=0; j<2; j++) {
            var chainNumber = this.connectors[ j+1 +i*3].CWchainID
            if (chainNumber === undefined) {
                console.log("bad chain number for tile")
            }
            var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
            if (chainColor === undefined) {
                console.log( "chain fill color not defined")
            }

	    //beginGroup()
	    strapOptions = { turtle: turtle,
                             distance: strapLength,
                             spacing: options.strappingWidth,
                             startAngle: 7* piTenths,
                             endAngle: 7* piTenths,
                             startCap: false,
                             endCap: false,
                             fillStyle: chainColor,
                             fillOpacity: 1,
                             segmentClass: this.getSegmentClass( j+1 +i*3, chainNumber)
                           };
            if (svg) {
                girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
            } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
            }
	    //endGroup()
	    turtle.toaD( -4* piTenths, 0); //do the bend

	    //beginGroup()
	    strapOptions = { turtle: turtle,
                             distance: strapLength - capGap,
                             spacing: options.strappingWidth,
                             startAngle: 7* piTenths,
                             endAngle: 4* piTenths,
                             startCap: false,
                             endCap: true,
                             fillStyle: chainColor,
                             fillOpacity: 1,
                             segmentClass: this.getSegmentClass( j+1 +i*3, chainNumber)
                           };
            if (svg) {
                girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
            } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
            }
	    turtle.toaD( 0, capGap); // back to edge
	    turtle.toaD( 6* piTenths, 0); // ready for next strap
	    //endGroup()
        }
    }
}


IrregularHexagon.prototype._buildInnerPolygons = function() {
    var innerTile = new IKRS.Polygon(); // [];
    var faces = IKRS.Girih.TILE_FACES [this.tileType];


    girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of pentagon
    girihCanvasHandler.posToAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    girihCanvasHandler.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0
    for( var j = 0; j<2; j++) {
	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //[0][5]mid point 0,3
	girihCanvasHandler.posToaD(  3* piTenths, 0.587 * this.size);

        for( var i = 0; i<2; i++) {
	    innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point [1]1,[3]3, [6]4,[8]5
	    girihCanvasHandler.posToaD( 6* piTenths, 0.587 * this.size);
	    innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //bend point [2]1,[4]2 [7]3,[9]4

	    girihCanvasHandler.posToaD( -4* piTenths, 0.587 * this.size);
	}
	girihCanvasHandler.posToaD( 3* piTenths, 0);
    }
    this.innerTilePolygons.push( innerTile );



/*
    var strapLength = 0.587 * tile.size
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];

    this.moveToXY( tile.position.x, tile.position.y); // Center of hexagon
    this.lineToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //at polygon vertice
    this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //at midpoint
    this.moveToaD( 3* piTenths, 0); // ready to go

    for( var j = 0; j< 2; j++) {
        this.gline( strapLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap);
        this.moveToaD( 6* piTenths, 0);
        lineNumber = lineNumber + 1

        for( var i = 0; i< 2; i++) {
            this.gline( strapLength, strapWidth, 7* piTenths, 7* piTenths, false, false, chainColor)
            this.moveToaD( -4* piTenths, 0);
            this.gline( strapLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
            this.moveToaD( 0, capGap);
            this.moveToaD( 6* piTenths, 0);
        }
    }
*/
}


IrregularHexagon.prototype._buildInnerPolygonsOld = function() {

    // Connect all edges half-the-way
    var innerTile = new IKRS.Polygon(); // []
    innerTile.addVertex( this.polygon.vertices[0].scaleTowards( this.polygon.vertices[1], 0.5 ) );
    innerTile.addVertex( this.polygon.vertices[1].scaleTowards( this.polygon.vertices[2], 0.5 ) );

    // Compute the next inner polygon vertex by the intersection of two circles
    var circleA = new IKRS.Circle( innerTile.vertices[1], innerTile.vertices[0].distanceTo(innerTile.vertices[1]) );
    var circleB = new IKRS.Circle( this.polygon.vertices[2].clone().scaleTowards( this.polygon.vertices[3], 0.5 ), circleA.radius );

    // There is definitely an intersection
    var intersection = circleA.computeIntersectionPoints( circleB );
    // One of the two points is inside the tile, the other is outside.
    // Locate the inside point.
    if( intersection && typeof intersection != "undefined" ) {
	// Use the point that is closer to the center
	if( intersection.pointA.length() < intersection.pointB.length() ) innerTile.addVertex(intersection.pointA);
	else                                                              innerTile.addVertex(intersection.pointB);
	//if( this.containsPoint(intersection.pointA) ) innerTile.push(intersection.pointA);
	//else                                          innerTile.push(intersection.pointB);
	//intersection = null;
    } else {
	console.log( "intersection is null!" );
    }

    innerTile.addVertex( circleB.center );

    //innerTile.push( this.vertices[3].scaleTowards( this.vertices[0], 0.5 ) );


    var i = 3;
    // Move circles
    circleA.center = circleB.center; // innerTile[4];
    circleB.center = this.polygon.vertices[3].clone().scaleTowards( this.polygon.vertices[4], 0.5 ); // innerTile[0];
    //window.alert( "circleA=" + circleA + ", circleB=" + circleB );
    intersection   = circleA.computeIntersectionPoints( circleB );
    // There are two points again (one inside, one outside the tile)
    if( intersection && typeof intersection != "undefined" ) {
	// Use the point that is closer to the center
	if( intersection.pointA.length() < intersection.pointB.length() ) innerTile.addVertex(intersection.pointA);
	else                                                              innerTile.addVertex(intersection.pointB);
	//if( this.containsPoint(intersection.pointA) ) innerTile.push(intersection.pointA);
	//else                                          innerTile.push(intersection.pointB);
	//intersection = null;
    } else {
	console.log( "intersection is null!" );
    }
    innerTile.addVertex( circleB.center );

    innerTile.addVertex( this.polygon.vertices[4].clone().scaleTowards( this.polygon.vertices[5], 0.5 ) );



    // Move circles
    circleA.center = innerTile.vertices[ innerTile.vertices.length-1 ];
    circleB.center = this.polygon.vertices[5].clone().scaleTowards( this.polygon.vertices[0], 0.5 );
    //window.alert( "circleA=" + circleA + ", circleB=" + circleB );
    intersection   = circleA.computeIntersectionPoints( circleB );
    // There are two points again (one inside, one outside the tile)
    if( intersection && typeof intersection != "undefined" ) {
	// Use the point that is closer to the center
	if( intersection.pointA.length() < intersection.pointB.length() ) innerTile.addVertex(intersection.pointA);
	else                                                              innerTile.addVertex(intersection.pointB);
	//if( this.containsPoint(intersection.pointA) ) innerTile.push(intersection.pointA);
	//else                                          innerTile.push(intersection.pointB);
	//intersection = null;
    } else {
	console.log( "intersection is null!" );
    }
    innerTile.addVertex( circleB.center );


    // Move circles
    circleA.center = innerTile.vertices[ innerTile.vertices.length-1 ];
    circleB.center = innerTile.vertices[ 0 ];
    //window.alert( "circleA=" + circleA + ", circleB=" + circleB );
    intersection   = circleA.computeIntersectionPoints( circleB );
    // There are two points again (one inside, one outside the tile)
    if( intersection ) { //  && typeof intersection != "undefined" ) {
	// Use the point that is closer to the center
	if( intersection.pointA.length() < intersection.pointB.length() ) innerTile.addVertex(intersection.pointA);
	else                                                              innerTile.addVertex(intersection.pointB);
    } else {
	console.log( "intersection is null!" );
    }
    innerTile.addVertex( circleB.center );


    //window.alert( innerTile.length );

    this.innerTilePolygons.push( innerTile );
};


IrregularHexagon.prototype._buildOuterPolygons = function() {

    // First add the two triangles at the 'ends' of the shape.
    var indicesA = [ 0, 3 ];  //  6:2
    var indicesB = [ 0, 5 ];  // 10:2
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

	// The second 'kite'
	var outerTileY = new IKRS.Polygon();
	outerTileY.addVertex( this.getVertexAt(indexA+3).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+3).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+4).clone() );
	outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+5).clone() );
	this.outerTilePolygons.push( outerTileY );
    }
};


// This is totally shitty. Why object inheritance when I still
// have to inherit object methods manually??!
//IKRS.Tile.IrregularHexagon.prototype.computeBounds           = IKRS.Tile.prototype.computeBounds;
//IKRS.Tile.IrregularHexagon.prototype._addVertex              = IKRS.Tile.prototype._addVertex;
//IKRS.Tile.IrregularHexagon.prototype._translateVertex        = IKRS.Tile.prototype._translateVertex;
//IKRS.Tile.IrregularHexagon.prototype._polygonToSVG           = IKRS.Tile.prototype._polygonToSVG;
//IKRS.Tile.IrregularHexagon.prototype.buildPolygon            = IKRS.Tile.prototype.buildPolygon;
//IKRS.Tile.IrregularHexagon.prototype.getInnerTilePolygonAt   = IKRS.Tile.prototype.getInnerTilePolygonAt;
//IKRS.Tile.IrregularHexagon.prototype.getOuterTilePolygonAt   = IKRS.Tile.prototype.getOuterTilePolygonAt;
//IKRS.Tile.IrregularHexagon.prototype.getTranslatedVertex     = IKRS.Tile.prototype.getTranslatedVertex;
//IKRS.Tile.IrregularHexagon.prototype.containsPoint           = IKRS.Tile.prototype.containsPoint;
//IKRS.Tile.IrregularHexagon.prototype.locateEdgeAtPoint       = IKRS.Tile.prototype.locateEdgeAtPoint;
//IKRS.Tile.IrregularHexagon.prototype.locateAdjacentEdge      = IKRS.Tile.prototype.locateAdjacentEdge;
//IKRS.Tile.IrregularHexagon.prototype.getVertexAt             = IKRS.Tile.prototype.getVertexAt;
//IKRS.Tile.IrregularHexagon.prototype.toSVG                   = IKRS.Tile.prototype.toSVG;

//IKRS.Tile.IrregularHexagon.prototype.constructor             = IKRS.Tile.IrregularHexagon;
