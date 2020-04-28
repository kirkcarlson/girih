/**
 * The penrose rhombus (angles 36° and 144°) is NOT part of the actual girih tile set!
 *
 * But it fits perfect into the girih as the angles are the same
 * *
 * @author Ikaros Kappler
 * @date 2013-12-11
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/


IKRS.Tile.PenroseRhombus = function( size, position, angle, opt_addCenterPolygon, fillColor ) {

    IKRS.Tile.call( this, size, position, angle, IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS  );

    this.buildPolygon();

/*
    if( typeof opt_addCenterPolygon == "undefined" )
	opt_addCenterPolygon = true;  // Add by default


    // Init the actual decahedron shape with the passed size
    var pointA = new IKRS.Point2(0,0);
    var pointB = pointA;
    this._addVertex( pointB );

    var angles = [ 0.0,
		   36.0,  // 72.0,
		   144.0  // 108.0
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

    if (fillColor !== undefined) {
        this.fillColor = fillColor;
    } else {
        this.fillColor = girihCanvasHandler.drawProperties.penroseRhombusFillColor;
    }

    this.imageProperties = {
	source: { x:      2/500.0,
		  y:      8/460.0,
		  width:  173/500.0,
		  height: 56/460.0
		},
	destination: { xOffset: 0.0,
		       yOffset: 0.0
		     }
    };


    this._buildInnerPolygons( opt_addCenterPolygon );
    this._buildOuterPolygons( opt_addCenterPolygon );
};


IKRS.Tile.PenroseRhombus.getFaces = function() {
    var faces = [];
    var radialShort = Math.sin( 1* piTenths);
    var radialLong = Math.cos( 1* piTenths);
    for (var i=0; i<2; i++) {
        faces.push( new IKRS.Face(
            /*centralAngle:*/       0* piTenths + i* Math.PI,
            /*angleToNextVertex:*/  2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      6* piTenths,
            /*radialCoefficient:*/  radialShort
        ));
        faces.push( new IKRS.Face(
            /*centralAngle:*/       5* piTenths + i* Math.PI,
            /*angleToNextVertex:*/  8* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      9* piTenths,
            /*radialCoefficient:*/  radialLong
        ));
    }
    return faces;
}


IKRS.Tile.PenroseRhombus.prototype._buildInnerPolygons = function( addCenterPolygon ) {
    const shortSegmentLength = 0.163 * this.size;
    const mediumSegmentLength = 0.2625 * this.size;
    const longSegmentLength = 0.587 * this.size;

    var rightTile =  new IKRS.Polygon(); // [];
    var centerTile = new IKRS.Polygon(); // [];
    var leftTile =   new IKRS.Polygon(); // [];
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of rhombus
    girihCanvasHandler.posToAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    girihCanvasHandler.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    rightTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());

    girihCanvasHandler.posToaD( 3* piTenths, shortSegmentLength)
    rightTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 2* piTenths, shortSegmentLength)
    rightTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 6* piTenths, mediumSegmentLength)
    rightTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    centerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 0* piTenths, longSegmentLength - mediumSegmentLength)
    centerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( -4* piTenths, longSegmentLength - mediumSegmentLength)
    leftTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 0* piTenths, mediumSegmentLength)
    leftTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 6* piTenths, shortSegmentLength)
    leftTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 2* piTenths, shortSegmentLength)
    leftTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 6* piTenths, mediumSegmentLength)
    centerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    girihCanvasHandler.posToaD( 0 * piTenths, longSegmentLength - mediumSegmentLength)
    centerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,3, 4,5

    this.innerTilePolygons.push( rightTile );
    this.innerTilePolygons.push( centerTile );
    this.innerTilePolygons.push( leftTile );



/*
FancyPenroseRhombusStrapping = function(tile) {
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    const shortSegmentLength = 0.163 * tile.size;
    const mediumSegmentLength = 0.2625 * tile.size;
    const longSegmentLength = 0.587 * tile.size;

    this.moveToXY( tile.position.x, tile.position.y); // Center of rhombus
    this.lineToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of rhombus
    this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    this.moveToaD( 3* piTenths, 0); // ready to go

    for (var i = 0; i<2; i++ ) {
        this.gline( shortSegmentLength, strapWidth, 7* piTenths, 4* piTenths, false, false, chainColor)
        this.moveToaD( 2* piTenths, 0)
        this.gline( shortSegmentLength - capGap, strapWidth, 4* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6* piTenths, 0)

        this.gline( mediumSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, 2* capGap); // capGap on each side of crossed segment
        this.gline( longSegmentLength - mediumSegmentLength - capGap, strapWidth, 6* piTenths, 7* piTenths, true, false, chainColor)
        this.moveToaD( -4* piTenths, 0)
        this.gline( longSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6* piTenths, 0)
    }
*/
};


IKRS.Tile.PenroseRhombus.prototype._buildInnerPolygonsOld = function( addCenterPolygon ) {
    var indices              = [ 0, 2 ];
    var innerPointIndexLeft  = -1;
    var innerPointIndexRight = -1;
    var centerTile           = new IKRS.Polygon();
    for( var i = 0; i < indices.length; i++ ) {

	var innerTile = new IKRS.Polygon();
	var index = indices[i];
	var left   = this.getVertexAt( index   ).clone().scaleTowards( this.getVertexAt(index+1), 0.5 );
	var right  = this.getVertexAt( index+1 ).clone().scaleTowards( this.getVertexAt(index+2), 0.5 );
	var innerA = this.getVertexAt( index+1 ).clone().multiplyScalar( 0.28 );
	var innerB = this.getVertexAt( index+1 ).clone().multiplyScalar( 0.55 );

	innerTile.addVertex( left );
	innerTile.addVertex( innerA );
	innerTile.addVertex( right );
	innerTile.addVertex( innerB );

	if( i == 0 ) {
	    centerTile.addVertex( this.getVertexAt( index ).clone().scaleTowards( this.getVertexAt(index+2), 0.1775 ) );
	    centerTile.addVertex( innerA );
	} else { // if( i == 1 ) {
	    centerTile.addVertex( this.getVertexAt( index ).clone().scaleTowards( this.getVertexAt(index+2), 0.1775 ) );
	    centerTile.addVertex( innerA );
	}

	this.innerTilePolygons.push( innerTile );
    }

    if( addCenterPolygon )
	this.innerTilePolygons.push( centerTile );

};


IKRS.Tile.PenroseRhombus.prototype._buildOuterPolygons = function( addCenterPolygon ) {
    const shortSegmentLength = 0.163 * this.size;
    const mediumSegmentLength = 0.2625 * this.size;
    const longSegmentLength = 0.587 * this.size;

    var rightPointTile = new IKRS.Polygon(); // [];
    var topTile =        new IKRS.Polygon(); // [];
    var bottomTile =     new IKRS.Polygon(); // [];
    var leftPointTile =  new IKRS.Polygon(); // [];
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of pentagon
    girihCanvasHandler.posToAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    girihCanvasHandler.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    rightPointTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [0]

    girihCanvasHandler.posToaD( 3* piTenths, shortSegmentLength)
    rightPointTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [1]

    girihCanvasHandler.posToaD( 2* piTenths, shortSegmentLength)
    rightPointTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [2]
    rightPointTile.addVertex( this.getVertexAt(1).clone()); [3]

    bottomTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [0]

    girihCanvasHandler.posToaD( 6* piTenths, mediumSegmentLength)
    bottomTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [1]

    girihCanvasHandler.posToaD( -4* piTenths, longSegmentLength - mediumSegmentLength)
    bottomTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [2]

    girihCanvasHandler.posToaD( 4* piTenths, longSegmentLength - mediumSegmentLength)
    bottomTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [3]

    girihCanvasHandler.posToaD( -4* piTenths, mediumSegmentLength)
    bottomTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [4]
    bottomTile.addVertex( this.getVertexAt(2).clone()); [5]

    leftPointTile.addVertex( this.getVertexAt(3).clone()); [0]
    leftPointTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [1]

    girihCanvasHandler.posToaD( 6* piTenths, shortSegmentLength)
    leftPointTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [2]

    girihCanvasHandler.posToaD( 2* piTenths, shortSegmentLength)
    leftPointTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [3]

    topTile.addVertex( this.getVertexAt(0).clone()); [0]
    topTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); [1]

    girihCanvasHandler.posToaD( 6* piTenths, mediumSegmentLength)
    topTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());  [2]

    girihCanvasHandler.posToaD( -4* piTenths, longSegmentLength - mediumSegmentLength)
    topTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());  [3]

    girihCanvasHandler.posToaD( 4* piTenths, longSegmentLength - mediumSegmentLength)
    topTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());  [4]

    girihCanvasHandler.posToaD( -4* piTenths, mediumSegmentLength)
    topTile.addVertex( girihCanvasHandler.getTurtlePosition().clone());  [5]

    this.outerTilePolygons.push( rightPointTile );
    this.outerTilePolygons.push( bottomTile );
    this.outerTilePolygons.push( leftPointTile );
    this.outerTilePolygons.push( topTile );

}
IKRS.Tile.PenroseRhombus.prototype._buildOuterPolygonsOld = function( centerPolygonExists ) {

    // Add left and right 'spikes'.
    var indices = [ 0, 2 ];
    for( var i = 0; i < indices.length; i++ ) {

	var outerTile = new IKRS.Polygon();
	var index = indices[i];
	var left   = this.getVertexAt( index   ).clone().scaleTowards( this.getVertexAt(index+1), 0.5 );
	var right  = this.getVertexAt( index+1 ).clone().scaleTowards( this.getVertexAt(index+2), 0.5 );
	var innerA = this.getVertexAt( index+1 ).clone().multiplyScalar( 0.28 );
	var innerB = this.getVertexAt( index+1 ).clone().multiplyScalar( 0.55 );

	outerTile.addVertex( left.clone() );
	outerTile.addVertex( this.getVertexAt( index+1 ).clone() );
	outerTile.addVertex( right.clone() );
	outerTile.addVertex( innerB.clone() );

	this.outerTilePolygons.push( outerTile );
    }

    // If the center polygon exists then the last outer polygon is split into two.
    if( centerPolygonExists ) {
	// Two polygons

	var indices = [ 0, 2 ];
	for( var i = 0; i < indices.length; i++ ) {
	    var outerTile = new IKRS.Polygon();
	    var index = indices[i];
	    outerTile.addVertex( this.getVertexAt(index).clone() );
	    outerTile.addVertex( this.getVertexAt(index).clone().scaleTowards(this.getVertexAt(index+1),0.5) );
	    outerTile.addVertex( this.innerTilePolygons[i].getVertexAt(1).clone() );
	    outerTile.addVertex( this.getVertexAt(index).clone().scaleTowards( this.getVertexAt(index+2), 0.1775 ) );
	    outerTile.addVertex( this.innerTilePolygons[(i+1)%2].getVertexAt(1).clone() );
	    outerTile.addVertex( this.getVertexAt(index-1).clone().scaleTowards( this.getVertexAt(index), 0.5 ) );

	    this.outerTilePolygons.push( outerTile );
	}

    } else {
	// One polygon
    }

};

/**
 * If you want the center polygon not to be drawn the canvas handler needs to
 * know the respective polygon index (inside the this.innerTilePolygons array).
 **/
IKRS.Tile.PenroseRhombus.prototype.getCenterPolygonIndex = function() {
    return 2;
}


IKRS.GirihCanvasHandler.prototype.drawFancyPenroseRhombusStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    const shortSegmentLength = 0.163 * tile.size;
    const mediumSegmentLength = 0.2625 * tile.size;
    const longSegmentLength = 0.587 * tile.size;

    //color( lineColor)
    //width( lineWidth)
    this.moveToXY( tile.position.x, tile.position.y); // Center of rhombus
    this.lineToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of rhombus
    this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    this.moveToaD( 3* piTenths, 0); // ready to go

    var lineNumber = 0

    for (var i = 0; i<2; i++ ) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.gline( shortSegmentLength, strapWidth, 7* piTenths, 4* piTenths, false, false, chainColor)
        this.moveToaD( 2* piTenths, 0)
        this.gline( shortSegmentLength - capGap, strapWidth, 4* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6* piTenths, 0)
        //endGroup()

        lineNumber = lineNumber + 1
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.gline( mediumSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, 2* capGap); // capGap on each side of crossed segment
        this.gline( longSegmentLength - mediumSegmentLength - capGap, strapWidth, 6* piTenths, 7* piTenths, true, false, chainColor)
        this.moveToaD( -4* piTenths, 0)
        this.gline( longSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        this.moveToaD( 6* piTenths, 0)
        lineNumber = lineNumber + 1
        //endGroup()
    }
}


IKRS.GirihCanvasHandler.prototype.getSVGforFancyPenroseRhombusStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    const shortSegmentLength = 0.163 * tile.size;
    const mediumSegmentLength = 0.2625 * tile.size;
    const longSegmentLength = 0.587 * tile.size;
    var svgStrings = [];

    //color( lineColor)
    //width( lineWidth)
    this.posToXY( tile.position.x, tile.position.y); // Center of rhombus
    this.posToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of rhombus
    this.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    this.posToaD( 3* piTenths, 0); // ready to go

    var lineNumber = 0

    for (var i = 0; i<2; i++ ) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' Chain_Length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();
        svgStrings.push( this.getGlineSVG( shortSegmentLength, strapWidth, 7* piTenths, 4* piTenths, false, false, chainColor))
        this.posToaD( 2* piTenths, 0)
        svgStrings.push( this.getGlineSVG( shortSegmentLength - capGap, strapWidth, 4* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, capGap)
        this.posToaD( 6* piTenths, 0)
        //endGroup()
        this.indentDec();
        svgStrings.push( this.indent + '</g>' + this.eol);

        lineNumber = lineNumber + 1
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' Chain_Length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();
        svgStrings.push( this.getGlineSVG( mediumSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, 2* capGap); // capGap on each side of crossed segment
        svgStrings.push( this.getGlineSVG( longSegmentLength - mediumSegmentLength - capGap, strapWidth, 6* piTenths, 7* piTenths, true, false, chainColor))
        this.moveToaD( -4* piTenths, 0)
        svgStrings.push( this.getGlineSVG( longSegmentLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, capGap)
        this.posToaD( 6* piTenths, 0)
        lineNumber = lineNumber + 1
        //endGroup()
        this.indentDec();
        svgStrings.push( this.indent + '</g>' + this.eol);
    }
    return svgStrings.join("");
}


// This is totally shitty. Why object inheritance when I still
// have to inherit object methods manually??!
IKRS.Tile.PenroseRhombus.prototype.buildPolygon            = IKRS.Tile.prototype.buildPolygon;
IKRS.Tile.PenroseRhombus.prototype.computeBounds           = IKRS.Tile.prototype.computeBounds;
IKRS.Tile.PenroseRhombus.prototype.evaluatePoint           = IKRS.Tile.prototype.evaluatePoint; //kirk
IKRS.Tile.PenroseRhombus.prototype._addVertex              = IKRS.Tile.prototype._addVertex;
IKRS.Tile.PenroseRhombus.prototype._translateVertex        = IKRS.Tile.prototype._translateVertex;
IKRS.Tile.PenroseRhombus.prototype._polygonToSVG           = IKRS.Tile.prototype._polygonToSVG;
IKRS.Tile.PenroseRhombus.prototype.getInnerTilePolygonAt   = IKRS.Tile.prototype.getInnerTilePolygonAt;
IKRS.Tile.PenroseRhombus.prototype.getOuterTilePolygonAt   = IKRS.Tile.prototype.getOuterTilePolygonAt;
IKRS.Tile.PenroseRhombus.prototype.getTranslatedVertex     = IKRS.Tile.prototype.getTranslatedVertex;
IKRS.Tile.PenroseRhombus.prototype.containsPoint           = IKRS.Tile.prototype.containsPoint;
IKRS.Tile.PenroseRhombus.prototype.locateEdgeAtPoint       = IKRS.Tile.prototype.locateEdgeAtPoint;
IKRS.Tile.PenroseRhombus.prototype.locateAdjacentEdge      = IKRS.Tile.prototype.locateAdjacentEdge;
IKRS.Tile.PenroseRhombus.prototype.getVertexAt             = IKRS.Tile.prototype.getVertexAt;
IKRS.Tile.PenroseRhombus.prototype.toSVG                   = IKRS.Tile.prototype.toSVG;

IKRS.Tile.PenroseRhombus.prototype.constructor             = IKRS.Tile.PenroseRhombus;
