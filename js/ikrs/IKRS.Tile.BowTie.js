/**
 * @author Ikaros Kappler
 * @date 2013-11-28
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/


IKRS.Tile.BowTie = function( size, position, angle, fillColor) {

    IKRS.Tile.call( this, size, position, angle, IKRS.Girih.TILE_TYPE_BOW_TIE );

    this.buildPolygon();

console.log( "bowtie position: " + this.position)
/*
    // Init the actual decahedron shape with the passed size
    var pointA          = new IKRS.Point2(0,0);
    var pointB          = pointA;
    var startPoint      = pointA;
    var oppositePoint   = null;
    this._addVertex( pointB );

    var angles = [ 0.0,
		   72.0,
		   72.0,
		   216.0,
		   72.0
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
    var move   = new IKRS.Point2( (oppositePoint.x - startPoint.x)/2.0, // bounds.getWidth()/2.0,
				  (oppositePoint.y - startPoint.y)/2.0  // -size/2.0
				);
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

	this.polygon.vertices[i].sub( move );

    }
*/

    this.imageProperties = {
	source: { x:      288/500.0, // 287,
		  y:      7/460.0,
		  width:  206/500.0,
		  height: 150/460.0
		  //angle:  0.0   // IKRS.Girih.MINIMAL_ANGLE
		},
	destination: { xOffset: 0.0,
		       yOffset: 0.0
		     }
    };

    if (fillColor !== undefined) {
        this.fillColor = fillColor;
    } else {
        this.fillColor = girihCanvasHandler.drawProperties.bowTieFillColor;
    }

    this._buildInnerPolygons( size );
    this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
};


IKRS.Tile.BowTie.getFaces = function () {
    var faces = [];
    var halfLongWidth = Math.sin(4* piTenths);
    var radialShort = 1/2 - Math.cos( 4* piTenths)
    var radialLong = Math.sqrt( 1/4 + halfLongWidth*halfLongWidth) // 1/4 is equivalent to side/2 * side/2)
    var angleB = Math.atan((1/2) / halfLongWidth)
    for (var i=0; i<2; i++) {
        faces.push( new IKRS.Face(
            /*centralAngle:*/       //-4* piTenths + i* Math.PI,
            /*centralAngle:*/       0 + i* Math.PI,
            /*angleToNextVertex:*/  -2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      4* piTenths,
            /*radialCoefficient:*/  radialShort
        ));
        faces.push( new IKRS.Face(
            /*centralAngle:*/       //1 * piTenths - angleB + i* Math.PI,
            /*centralAngle:*/       5 * piTenths - angleB + i* Math.PI,
            /*angleToNextVertex:*/  6* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      11 * piTenths - angleB, //pi - angleAprime
            /*radialCoefficient:*/  radialLong
        ));
        faces.push( new IKRS.Face(
            /*centralAngle:*/       //1* piTenths + angleB + i* Math.PI,
            /*centralAngle:*/       5* piTenths + angleB + i* Math.PI,
            /*angleToNextVertex:*/  6* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      5* piTenths + angleB,
            /*radialCoefficient:*/  radialLong
        ));
    }
    return faces;
}


IKRS.Tile.BowTie.prototype._buildInnerPolygons = function( edgeLength ) {
    var faces = IKRS.Girih.TILE_FACES [this.tileType];
    var shortBentLength = 0.35845 * this.size
    var longDirectLength = 0.58 * this.size

console.log( "bowtie inner position: " + this.position)

    girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of bow tie
    girihCanvasHandler.posToAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    girihCanvasHandler.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0
    for( var j = 0; j<2; j++) {
        var innerTile = new IKRS.Polygon(); // [];
	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 0,3

	girihCanvasHandler.posToaD( 3* piTenths, longDirectLength);
	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 1,4

	girihCanvasHandler.posToaD( 6* piTenths, longDirectLength);
	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid [point 2,5

	girihCanvasHandler.posToaD( 6* piTenths, shortBentLength);
	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 2,5

//	girihCanvasHandler.posToaD( 3* piTenths, shortBentLength);
//	innerTile.addVertex( girihCanvasHandler.getTurtlePosition().clone()); //mid point 0, 4

	//set up for other end
        girihCanvasHandler.posToXY( this.position.x, this.position.y); // center of bow tie
        girihCanvasHandler.posToAD( this.angle + faces[3].centralAngle,
                                    faces[3].radialCoefficient * this.size); //at vertice 0
        girihCanvasHandler.posToaD( Math.PI - faces[3].angleToCenter + faces[3].angleToNextVertex,
                                    0.5 * this.size); //midpoint of side 3
        this.innerTilePolygons.push( innerTile );
    }

/*
    this.moveToXY( tile.position.x, tile.position.y)
    this.lineToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //waist of bowtie
    this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start

    for (var i = 0; i<2; i++ ) {
        this.moveToaD( 3* piTenths, 0) // mid to end
        this.gline( longDirectLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)

        this.moveToaD( 6* piTenths, 0) // edge to start
        this.gline( longDirectLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)

        this.moveToaD ( 6* piTenths, 0) //back toward start
        this.gline( shortBentLength, strapWidth, 7* piTenths, 4* piTenths, false, false, chainColor)
        this.moveToaD ( 2* piTenths, 0) //mid
        this.gline( shortBentLength - capGap, strapWidth, 4* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)

        //set up for the other end
        this.moveToXY( tile.position.x, tile.position.y)
        this.lineToAD( tile.angle + faces[0].centralAngle + Math.PI, faces[0].radialCoefficient * tile.size); //waist of bowtie
        this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    }
*/
}



IKRS.Tile.BowTie.prototype._buildInnerPolygonsOld = function( edgeLength ) {

    var indices = [ 1, 4 ];
    for( var i = 0; i < indices.length; i++ ) {

	var index       = indices[i];

	var middlePoint = this.getVertexAt( index ).clone().scaleTowards( this.getVertexAt(index+1), 0.5 );
	var leftPoint   = this.getVertexAt( index-1 ).clone().scaleTowards( this.getVertexAt(index), 0.5 );
	var rightPoint  = this.getVertexAt( index+1 ).clone().scaleTowards( this.getVertexAt(index+2), 0.5 );
	var innerPoint  = middlePoint.clone().multiplyScalar( 0.38 );

	var innerTile = new IKRS.Polygon(); // [];
	innerTile.addVertex( middlePoint );
	innerTile.addVertex( rightPoint );
	innerTile.addVertex( innerPoint );
	innerTile.addVertex( leftPoint );


	this.innerTilePolygons.push( innerTile );
    }
};

IKRS.Tile.BowTie.prototype._buildOuterPolygons = function() {

    // Add the outer four 'edges'
    var indices = [ 0, 3 ];
    for( var i = 0; i < indices.length; i++ ) {

	var index       = indices[i];

	// The first/third triangle
	var outerTileA   = new IKRS.Polygon();
	outerTileA.addVertex( this.innerTilePolygons[i].getVertexAt(0).clone() );
	outerTileA.addVertex( this.getVertexAt(index+1).clone() );
	outerTileA.addVertex( this.innerTilePolygons[i].getVertexAt(1).clone()) ;
	this.outerTilePolygons.push( outerTileA );

	// The second/fourth triangle
	var outerTileB = new IKRS.Polygon();
	outerTileB.addVertex( this.innerTilePolygons[i].getVertexAt(1).clone() );
	outerTileB.addVertex( this.getVertexAt(index+2).clone() );
	outerTileB.addVertex( this.innerTilePolygons[i].getVertexAt(2).clone()) ;
	this.outerTilePolygons.push( outerTileB );

    }

    // Add the center polygon
    var centerTile = new IKRS.Polygon();
    centerTile.addVertex( this.getVertexAt(0).clone() );
    centerTile.addVertex( this.innerTilePolygons[0].getVertexAt(4).clone() );
    centerTile.addVertex( this.innerTilePolygons[0].getVertexAt(3).clone() );
    centerTile.addVertex( this.innerTilePolygons[0].getVertexAt(2).clone() );
//    centerTile.addVertex( this.innerTilePolygons[0].getVertexAt(1).clone() );
    centerTile.addVertex( this.getVertexAt(3).clone() );
    centerTile.addVertex( this.innerTilePolygons[1].getVertexAt(4).clone() );
    centerTile.addVertex( this.innerTilePolygons[1].getVertexAt(3).clone() );
    centerTile.addVertex( this.innerTilePolygons[1].getVertexAt(2).clone() );
//    centerTile.addVertex( this.innerTilePolygons[1].getVertexAt(1).clone() );
    this.outerTilePolygons.push( centerTile );
};


IKRS.GirihCanvasHandler.prototype.drawFancyBowTieStrapping = function(tile) {
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    //color( lineColor)
    //width( lineWidth)

    var shortBentLength = 0.35845 * tile.size
    var longDirectLength = 0.58 * tile.size
    var lineNumber = 0
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];

    this.moveToXY( tile.position.x, tile.position.y)
    this.lineToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //waist of bowtie
    this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start

    for (var i = 0; i<2; i++ ) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;

        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.moveToaD( 3* piTenths, 0) // mid to end
        this.gline( longDirectLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        //endGroup()
        lineNumber = lineNumber + 1

        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.moveToaD( 6* piTenths, 0) // edge to start
        this.gline( longDirectLength - capGap, strapWidth, 7* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        //endGroup()
        lineNumber = lineNumber + 1

        var chainNumber = tile.connectors[ lineNumber].CWchainID
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber}, ["detailedLine"]))
        this.moveToaD ( 6* piTenths, 0) //back toward start
        this.gline( shortBentLength, strapWidth, 7* piTenths, 4* piTenths, false, false, chainColor)
        this.moveToaD ( 2* piTenths, 0) //mid
        this.gline( shortBentLength - capGap, strapWidth, 4* piTenths, 4* piTenths, false, true, chainColor)
        this.moveToaD( 0, capGap)
        //endGroup()
        lineNumber = lineNumber + 1

        //set up for the other end
        this.moveToXY( tile.position.x, tile.position.y)
        this.lineToAD( tile.angle + faces[0].centralAngle + Math.PI, faces[0].radialCoefficient * tile.size); //waist of bowtie
        this.lineToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    }
}


IKRS.GirihCanvasHandler.prototype.getSVGforFancyBowTieStrapping = function(tile) {
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    //color( lineColor)
    //width( lineWidth)

    var shortBentLength = 0.35845 * tile.size
    var longDirectLength = 0.58 * tile.size
    var lineNumber = 0
    var capGap = this.capGap();
    var strapWidth = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var svgStrings = [];

    this.posToXY( tile.position.x, tile.position.y)
    this.posToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //waist of bowtie
    this.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start

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
        this.posToaD( 3* piTenths, 0) // mid to end
        svgStrings.push( this.getGlineSVG( longDirectLength - capGap, strapWidth,
			 7* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, capGap)
        //endGroup()
	this.indentDec();
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
        this.posToaD( 6* piTenths, 0) // edge to start
        svgStrings.push( this.getGlineSVG( longDirectLength - capGap, strapWidth,
			 7* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, capGap)
        //endGroup()
	this.indentDec();
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
        this.posToaD ( 6* piTenths, 0) //back toward start
        svgStrings.push( this.getGlineSVG( shortBentLength, strapWidth, 7* piTenths,
			 4* piTenths, false, false, chainColor))
        this.posToaD ( 2* piTenths, 0) //mid
        svgStrings.push( this.getGlineSVG( shortBentLength - capGap, strapWidth,
			 4* piTenths, 4* piTenths, false, true, chainColor))
        this.posToaD( 0, capGap)
        //endGroup()
	this.indentDec();
	svgStrings.push( this.indent + '</g>' + this.eol);
        lineNumber = lineNumber + 1

        //set up for the other end
        this.posToXY( tile.position.x, tile.position.y)
        this.posToAD( tile.angle + faces[0].centralAngle + Math.PI, faces[0].radialCoefficient * tile.size); //waist of bowtie
        this.posToaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, tile.size/2); //ready to start
    }
    return svgStrings.join("")
}


// This is totally shitty. Why object inheritance when I still
// have to inherit object methods manually??!
IKRS.Tile.BowTie.prototype.computeBounds           = IKRS.Tile.prototype.computeBounds;
IKRS.Tile.BowTie.prototype._addVertex              = IKRS.Tile.prototype._addVertex;
IKRS.Tile.BowTie.prototype._translateVertex        = IKRS.Tile.prototype._translateVertex;
IKRS.Tile.BowTie.prototype._polygonToSVG           = IKRS.Tile.prototype._polygonToSVG;
IKRS.Tile.BowTie.prototype.buildPolygon            = IKRS.Tile.prototype.buildPolygon;
IKRS.Tile.BowTie.prototype.getInnerTilePolygonAt   = IKRS.Tile.prototype.getInnerTilePolygonAt;
IKRS.Tile.BowTie.prototype.getOuterTilePolygonAt   = IKRS.Tile.prototype.getOuterTilePolygonAt;
IKRS.Tile.BowTie.prototype.getTranslatedVertex     = IKRS.Tile.prototype.getTranslatedVertex;
IKRS.Tile.BowTie.prototype.containsPoint           = IKRS.Tile.prototype.containsPoint;
IKRS.Tile.BowTie.prototype.locateEdgeAtPoint       = IKRS.Tile.prototype.locateEdgeAtPoint;
IKRS.Tile.BowTie.prototype.locateAdjacentEdge      = IKRS.Tile.prototype.locateAdjacentEdge;
IKRS.Tile.BowTie.prototype.getVertexAt             = IKRS.Tile.prototype.getVertexAt;
IKRS.Tile.BowTie.prototype.toSVG                   = IKRS.Tile.prototype.toSVG;

IKRS.Tile.BowTie.prototype.constructor             = IKRS.Tile.BowTie;
