/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @date 2020-05-11 Kirk Carlson (converted to use ECMA6 class).
 * @version 1.0.2
 **/


class Decagon extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.decagonFillColor;
        }

        super( size, position, angle, IKRS.Girih.TILE_TYPE_DECAGON, fillColor );
        // in theory type should not be needed.

        this.buildTile();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

        this.imageProperties = { // for textures...
	    source: { x:      169/500.0,
		      y:      140/460.0,
		      width:  313/500.0,
		      height: 297/460.0
		    },
	    destination: { xOffset: 0.0,
		           yOffset: 0.0
		         }
        }
    }
};


Decagon.getFaces = function() {
    var faces = [];
    for (var i=0; i<10; i++) {
        faces.push( new IKRS.Face(
            /*centralAngle:*/       //-4* piTenths + i* 2* piTenths,
            /*centralAngle:*/       0 * piTenths + i* 2* piTenths,
            /*angleToNextVertex:*/  2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      6* piTenths,
            /*radialCoefficient:*/  1/(2* Math.sin(piTenths))
        ));
    }
    return faces;
}


Decagon.prototype.getSVGforFancyStrapping = function( options) {
    return this._drawFancyStrapping (undefined, true, options);
}


Decagon.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


Decagon.prototype._drawFancyStrapping = function(canvasContext, svg, options) {
    turtle = new Turtle();
    var strapLength = 0.95 * this.size // overall length of each strap
    var startBrokenStrap = 0.589 * this.size
    var endBrokenStrap = strapLength - startBrokenStrap // end part of strap
    var capGap = options.capGap;
    var faces = IKRS.Girih.TILE_FACES [this.tileType];
    var svgStrings = [];

    // do all of the straps
    for( var i = 0; i<10; i++) {
        turtle.toXY( this.position.x, this.position.y); // center of decagon
        turtle.toAD( this.angle + faces[i].centralAngle,
                     faces[i].radialCoefficient * this.size); //vertex of decagon
        turtle.toaD( Math.PI - faces[i].angleToCenter + faces[i].angleToNextVertex,
                     this.size/2); //at midpoint

        turtle.toaD( 3* piTenths, 0); // ready for strapping

        var chainNumber = this.connectors[ i].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:i} , ["strap"]))
	strapOptions = { turtle: turtle,
                         distance: startBrokenStrap - capGap,
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
            svgStrings = svgStrings.concat(
                    girihCanvasHandler.getStrapSegmentSVG ( strapOptions));
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
	turtle.toaD( 0, capGap * 2); // gap on each side of strap

	strapOptions = { turtle: turtle,
                         distance: endBrokenStrap - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 6* piTenths,
                         endAngle: 6* piTenths,
                         startCap: true,
                         endCap: false,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( i, chainNumber)
                       };
        if (svg) {
            svgStrings = svgStrings.concat(
                    girihCanvasHandler.getStrapSegmentSVG ( strapOptions));
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
	turtle.toaD( -2* piTenths, 0);

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
            svgStrings = svgStrings.concat(
                    girihCanvasHandler.getStrapSegmentSVG ( strapOptions));
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
	//endGroup()
    }
    return svgStrings;
}


Decagon.prototype._buildInnerPolygons = function( edgeLength ) {
    var centralStar = new IKRS.Polygon();
    for( var i = 0; i < 10; i++ ) {
	var innerTile = new IKRS.Polygon(); // [];
	// Make polygon
/*
	var topPoint    = this.getVertexAt( i ).clone().scaleTowards( this.getVertexAt(i+1), 0.5 );
	var bottomPoint = topPoint.clone().multiplyScalar( 0.615 );
	var leftPoint   = this.getVertexAt( i ).clone().multiplyScalar( 0.69 );
	var rightPoint  = this.getVertexAt( i+1 ).clone().multiplyScalar( 0.69 );
*/
	var center = this.position;
	var topPoint    = this.getVertexAt( i ).clone().scaleTowards( this.getVertexAt(i+1), 0.5 );
	var bottomPoint = topPoint.clone().scaleTowards( center, 0.385 );
	var leftPoint   = this.getVertexAt( i ).clone().scaleTowards( center, 0.31 );
	var rightPoint  = this.getVertexAt( i+1 ).clone().scaleTowards( center, 0.31 );

//console.log("dec_bIP " + i +": "+ center +" "+ topPoint)

	innerTile.addVertex( topPoint );
	innerTile.addVertex( rightPoint );
	innerTile.addVertex( bottomPoint );
	innerTile.addVertex( leftPoint );

	this.innerTilePolygons.push( innerTile );

	centralStar.addVertex( leftPoint.clone() );
	centralStar.addVertex( bottomPoint.clone() );
    }

    this.innerTilePolygons.push( centralStar );
};


Decagon.prototype._buildOuterPolygons = function( edgeLength ) {

    // DON'T include the inner star here!
    for( var i = 0; i < 10; i++ ) {
	var outerTile = new IKRS.Polygon();
	outerTile.addVertex( this.getVertexAt(i).clone() );
	outerTile.addVertex( this.innerTilePolygons[i].getVertexAt(0).clone() );
	outerTile.addVertex( this.innerTilePolygons[i].getVertexAt(3).clone() );
	outerTile.addVertex( this.getInnerTilePolygonAt( i==0 ? 9 : i-1 ).getVertexAt(0).clone() );

	this.outerTilePolygons.push( outerTile );
    }
};
