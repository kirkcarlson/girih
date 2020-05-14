/**
 * @author Ikaros Kappler
 * @date 2013-11-28
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 * @version 1.0.2
 **/
//import Turtle from "/js/ikrs/Turtle.js";

class BowTie extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.bowTieFillColor;
        }

        super( size, position, angle, Girih.TILE_TYPE.BOW_TIE, fillColor );
        // in theory type should not be needed.

        this.buildTile();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

        this.imageProperties = {
            source: { x:      288/500.0, // 287,
                      y:      7/460.0,
                      width:  206/500.0,
                      height: 150/460.0
                      //angle:  0.0   // Girih.MINIMAL_ANGLE
                    },
            destination: { xOffset: 0.0,
                           yOffset: 0.0
                         }
        }
    }
};


BowTie.getFaces = function () {
    var faces = [];
    var halfLongWidth = Math.sin( 4* piTenths);
    var radialShort = 1/2 - Math.cos( 4* piTenths)
    var radialLong = Math.sqrt( 1/4 + halfLongWidth*halfLongWidth)
    var angleB = Math.atan((1/2) / halfLongWidth)
    for (var i=0; i<2; i++) {
        faces.push( new Face(
            /*centralAngle:*/       0 + i* Math.PI,
            /*angleToNextVertex:*/  -2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      4* piTenths,
            /*radialCoefficient:*/  radialShort
        ));
        faces.push( new Face(
            /*centralAngle:*/       5 * piTenths - angleB + i* Math.PI,
            /*angleToNextVertex:*/  6* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      11 * piTenths - angleB,
            /*radialCoefficient:*/  radialLong
        ));
        faces.push( new Face(
            /*centralAngle:*/       5* piTenths + angleB + i* Math.PI,
            /*angleToNextVertex:*/  6* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      5* piTenths + angleB,
            /*radialCoefficient:*/  radialLong
        ));
    }
    return faces;
}


BowTie.prototype._buildInnerPolygons = function( edgeLength ) {
    var turtle = new Turtle();
    var faces = Girih.TILE_FACES [this.tileType];
    var shortBentLength = 0.35845 * this.size
    var longDirectLength = 0.58 * this.size

    for( var j = 0; j<2; j++) {
        turtle.toXY( this.position.x, this.position.y); // center of bow tie
        turtle.toAD( this.angle + faces[0 +j*3].centralAngle,
                                    faces[ +j*3].radialCoefficient * this.size); //at vertice 0
        turtle.toaD( Math.PI - faces[ +j*3].angleToCenter + faces[ +j*3].angleToNextVertex,
                                    0.5 * this.size); //midpoint of side 0
        var innerTile = new Polygon(); // [];
        innerTile.addVertex( turtle.position); //mid point 0,3

        turtle.toaD( 3* piTenths, longDirectLength);
        innerTile.addVertex( turtle.position); //mid point 1,4

        turtle.toaD( 6* piTenths, longDirectLength);
        innerTile.addVertex( turtle.position); //mid [point 2,5

        turtle.toaD( 6* piTenths, shortBentLength);
        innerTile.addVertex( turtle.position); //mid point 2,5

        this.innerTilePolygons.push( innerTile );
    }
}


BowTie.prototype._buildOuterPolygons = function() {

    // Add the outer four 'edges'
    var indices = [ 0, 3 ];
    for( var i = 0; i < indices.length; i++ ) {

        var index       = indices[i];

        // The first/third triangle
        var outerTileA   = new Polygon();
        outerTileA.addVertex( this.innerTilePolygons[i].getVertexAt(0).clone() );
        outerTileA.addVertex( this.getVertexAt(index+1).clone() );
        outerTileA.addVertex( this.innerTilePolygons[i].getVertexAt(1).clone()) ;
        this.outerTilePolygons.push( outerTileA );

        // The second/fourth triangle
        var outerTileB = new Polygon();
        outerTileB.addVertex( this.innerTilePolygons[i].getVertexAt(1).clone() );
        outerTileB.addVertex( this.getVertexAt(index+2).clone() );
        outerTileB.addVertex( this.innerTilePolygons[i].getVertexAt(2).clone()) ;
        this.outerTilePolygons.push( outerTileB );

    }

    // Add the center polygon
    var centerTile = new Polygon();
    centerTile.addVertex( this.getVertexAt(0).clone() );
    centerTile.addVertex( this.innerTilePolygons[0].getVertexAt(4).clone() );
    centerTile.addVertex( this.innerTilePolygons[0].getVertexAt(3).clone() );
    centerTile.addVertex( this.innerTilePolygons[0].getVertexAt(2).clone() );
    centerTile.addVertex( this.getVertexAt(3).clone() );
    centerTile.addVertex( this.innerTilePolygons[1].getVertexAt(4).clone() );
    centerTile.addVertex( this.innerTilePolygons[1].getVertexAt(3).clone() );
    centerTile.addVertex( this.innerTilePolygons[1].getVertexAt(2).clone() );
    this.outerTilePolygons.push( centerTile );
};


BowTie.prototype.getSVGforFancyStrapping = function( options, buffer, indent) {
    this._drawFancyStrapping (undefined, true, options, buffer, indent);
}

BowTie.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


BowTie.prototype._drawFancyStrapping = function(canvasContext, svg, options, buffer, indent) {
//inputs: size, position, angle, canvas context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    turtle = new Turtle();
    var shortBentLength = 0.35845 * this.size
    var longDirectLength = 0.58 * this.size
    var lineNumber = 0
    var capGap = options.capGap;
    var faces = Girih.TILE_FACES [this.tileType];


    // do all of the straps in two passes
    for( var i = 0; i<2; i++) {
        //set up for the other end
        turtle.toPoint( this.position); // to center
        turtle.toAD( this.angle + faces[0 +i*3].centralAngle,
                faces[0 +i*3].radialCoefficient * this.size); //waist of bowtie
        turtle.toaD( Math.PI - faces[0 +i*3].angleToCenter + faces[0 +i*3].angleToNextVertex,
                this.size/2); //ready to start
        turtle.toaD( 3* piTenths, 0); // ready for strapping

        var chainNumber = this.connectors[0 +i*3].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

        strapOptions = { turtle: turtle,
                         distance: longDirectLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 0 +i*3, chainNumber),
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }
        turtle.toaD( 0, capGap); // gap at end of strap
        turtle.toaD( 6*piTenths, 0); // to start of strap

        var chainNumber = this.connectors[1 +i*3].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }
        strapOptions = { turtle: turtle,
                         distance: longDirectLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 1 +i*3, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }

        turtle.toaD( 0, capGap); // to start of next segment
        turtle.toaD( 6* piTenths, 0); // toward start via bend
        var chainNumber = this.connectors[2 +i*3].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }
        strapOptions = { turtle: turtle,
                         distance: shortBentLength,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: false,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 2 +i*3, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }

        turtle.toaD( 2* piTenths, 0); // middle of bend
        strapOptions = { turtle: turtle,
                         distance: shortBentLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 4* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 2 +i*3, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }
    }
}
