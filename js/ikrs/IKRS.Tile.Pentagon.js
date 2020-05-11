/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @date 2050-05-11 Kirk Carlson (converted to use ECMA6 class).
 * @version 1.0.2
 **/


class Pentagon extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.pentagonFillColor;
        }

        super( size, position, angle, IKRS.Girih.TILE_TYPE_PENTAGON, fillColor );
        // in theory type should not be needed.

        this.buildTile();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

        this.imageProperties = {
	    source: {	x:      7/500.0,
			    y:      (303-15)/460.0, // -16
			    width:  157/500.0,
			    height: (150+15)/460.0  // +16
		    },
	    destination: { xOffset: 0.0,
		           yOffset: -18/460.0 // -16
		         }
        }
    }
};


Pentagon.getFaces = function() {
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


Pentagon.prototype._buildInnerPolygons = function( edgeLength ) {
    var turtle = new Turtle();
    var innerTile = new IKRS.Polygon(); // [];
    var faces = IKRS.Girih.TILE_FACES [this.tileType];


    turtle.toXY( this.position.x, this.position.y); // center of pentagon
    turtle.toAD( this.angle + faces[0].centralAngle,
                              faces[0].radialCoefficient * this.size); //at vertice 0
    turtle.toaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                               0.5 * this.size); //midpoint of side 0
    for( var i = 0; i<5; i++) {
	innerTile.addVertex( turtle.position); //mid point
	turtle.toaD(  3* piTenths, 0.425 * this.size);
	innerTile.addVertex( turtle.position); //bend point
	turtle.toaD( -2* piTenths, 0.425 * this.size);
	turtle.toaD( 3* piTenths, 0); // at next vertice
    }
    this.innerTilePolygons.push( innerTile );
}


Pentagon.prototype._buildOuterPolygons = function() {

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


Pentagon.prototype.getSVGforFancyStrapping = function( options) {
    this._drawFancyStrapping (undefined, true, options);
}


Pentagon.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


Pentagon.prototype._drawFancyStrapping = function(canvasContext, svg, options) {
//inputs: size, position, angle, canvas context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    turtle = new Turtle();
    var strapLength = 0.425 * this.size // overall length of each strap
    var capGap = options.capGap;
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    turtle.toXY( this.position.x, this.position.y); // center of decagon
    turtle.toAD( this.angle + faces[0].centralAngle, faces[0].radialCoefficient * this.size); //corner of decagon
    turtle.toaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex, this.size/2); //midpoint of side 0

    // do all of the straps
    for( var i = 0; i<5; i++) {

        var chainNumber = this.connectors[ i].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:i} , ["strap"]))
        turtle.toaD( 3* piTenths, 0); // ready for strapping
	strapOptions = { turtle: turtle,
                         distance: strapLength,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 6* piTenths,
                         startCap: false,
                         endCap: false,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( i, chainNumber)
                       };
        if (svg) {
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }

	turtle.toaD( -2* piTenths, 0); // do the bend
	strapOptions = { turtle: turtle,
                         distance: strapLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 6* piTenths,
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
	turtle.toaD( 0, capGap);
	turtle.toaD( 3* piTenths, 0);
    }
}
