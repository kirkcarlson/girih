/**
 * The penrose rhombus (angles 36° and 144°) is NOT part of the actual girih tile set!
 *
 * But it fits perfect into the girih as the angles are the same
 * *
 * @author Ikaros Kappler
 * @date 2013-12-11
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @date 2020-05-11 KirkCarlson (converted to use ECMA6 class).
 * @version 1.0.2
 **/
//import Turtle from "/js/ikrs/Turtle.js";


class PenroseRhombus extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.penroseRhombusFillColor;
        }

        super( size, position, angle, Girih.TILE_TYPE.PENROSE_RHOMBUS, fillColor );
        // in theory type should not be needed.

        this.buildTile();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

        this.imageProperties = {
            source: { x:      2/500.0,
                      y:      8/460.0,
                      width:  173/500.0,
                      height: 56/460.0
                    },
            destination: { xOffset: 0.0,
                           yOffset: 0.0
                         }
        }
    }
};


PenroseRhombus.getFaces = function() {
    var faces = [];
    var radialShort = Math.sin( 1* piTenths);
    var radialLong = Math.cos( 1* piTenths);
    for (var i=0; i<2; i++) {
        faces.push( new Face(
            /*centralAngle:*/       0* piTenths + i* Math.PI,
            /*angleToNextVertex:*/  2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      6* piTenths,
            /*radialCoefficient:*/  radialShort
        ));
        faces.push( new Face(
            /*centralAngle:*/       5* piTenths + i* Math.PI,
            /*angleToNextVertex:*/  8* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      9* piTenths,
            /*radialCoefficient:*/  radialLong
        ));
    }
    return faces;
}


PenroseRhombus.prototype._buildInnerPolygons = function( addCenterPolygon ) {
    var turtle = new Turtle();
    const shortSegmentLength = 0.163 * this.size;
    const mediumSegmentLength = 0.2625 * this.size;
    const longSegmentLength = 0.587 * this.size;

    var rightTile =  new Polygon(); // [];
    var centerTile = new Polygon(); // [];
    var leftTile =   new Polygon(); // [];
    var faces = Girih.TILE_FACES [this.tileType];

    turtle.toXY( this.position.x, this.position.y); // center of rhombus
    turtle.toAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    turtle.toaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    rightTile.addVertex( turtle.position);

    turtle.toaD( 3* piTenths, shortSegmentLength)
    rightTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 2* piTenths, shortSegmentLength)
    rightTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 6* piTenths, mediumSegmentLength)
    rightTile.addVertex( turtle.position); //mid point 2,3, 4,5

    centerTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 0* piTenths, longSegmentLength - mediumSegmentLength)
    centerTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( -4* piTenths, longSegmentLength - mediumSegmentLength)
    leftTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 0* piTenths, mediumSegmentLength)
    leftTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 6* piTenths, shortSegmentLength)
    leftTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 2* piTenths, shortSegmentLength)
    leftTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 6* piTenths, mediumSegmentLength)
    centerTile.addVertex( turtle.position); //mid point 2,3, 4,5

    turtle.toaD( 0 * piTenths, longSegmentLength - mediumSegmentLength)
    centerTile.addVertex( turtle.position); //mid point 2,3, 4,5

    this.innerTilePolygons.push( rightTile );
    this.innerTilePolygons.push( centerTile );
    this.innerTilePolygons.push( leftTile );
};


PenroseRhombus.prototype._buildOuterPolygons = function( addCenterPolygon ) {
    var turtle = new Turtle;
    const shortSegmentLength = 0.163 * this.size;
    const mediumSegmentLength = 0.2625 * this.size;
    const longSegmentLength = 0.587 * this.size;

    var rightPointTile = new Polygon(); // [];
    var topTile =        new Polygon(); // [];
    var bottomTile =     new Polygon(); // [];
    var leftPointTile =  new Polygon(); // [];
    var faces = Girih.TILE_FACES [this.tileType];

    turtle.toXY( this.position.x, this.position.y); // center of pentagon
    turtle.toAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    turtle.toaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    rightPointTile.addVertex( turtle.position); [0]

    turtle.toaD( 3* piTenths, shortSegmentLength)
    rightPointTile.addVertex( turtle.position); [1]

    turtle.toaD( 2* piTenths, shortSegmentLength)
    rightPointTile.addVertex( turtle.position); [2]
    rightPointTile.addVertex( this.getVertexAt(1).clone()); [3]

    bottomTile.addVertex( turtle.position); [0]

    turtle.toaD( 6* piTenths, mediumSegmentLength)
    bottomTile.addVertex( turtle.position); [1]

    turtle.toaD( -4* piTenths, longSegmentLength - mediumSegmentLength)
    bottomTile.addVertex( turtle.position); [2]

    turtle.toaD( 4* piTenths, longSegmentLength - mediumSegmentLength)
    bottomTile.addVertex( turtle.position); [3]

    turtle.toaD( -4* piTenths, mediumSegmentLength)
    bottomTile.addVertex( turtle.position); [4]
    bottomTile.addVertex( this.getVertexAt(2).clone()); [5]

    leftPointTile.addVertex( this.getVertexAt(3).clone()); [0]
    leftPointTile.addVertex( turtle.position); [1]

    turtle.toaD( 6* piTenths, shortSegmentLength)
    leftPointTile.addVertex( turtle.position); [2]

    turtle.toaD( 2* piTenths, shortSegmentLength)
    leftPointTile.addVertex( turtle.position); [3]

    topTile.addVertex( this.getVertexAt(0).clone()); [0]
    topTile.addVertex( turtle.position); [1]

    turtle.toaD( 6* piTenths, mediumSegmentLength)
    topTile.addVertex( turtle.position);  [2]

    turtle.toaD( -4* piTenths, longSegmentLength - mediumSegmentLength)
    topTile.addVertex( turtle.position);  [3]

    turtle.toaD( 4* piTenths, longSegmentLength - mediumSegmentLength)
    topTile.addVertex( turtle.position);  [4]

    turtle.toaD( -4* piTenths, mediumSegmentLength)
    topTile.addVertex( turtle.position);  [5]

    this.outerTilePolygons.push( rightPointTile );
    this.outerTilePolygons.push( bottomTile );
    this.outerTilePolygons.push( leftPointTile );
    this.outerTilePolygons.push( topTile );
}


PenroseRhombus.prototype.getSVGforFancyStrapping = function( options, buffer, indent) {
    this._drawFancyStrapping (undefined, true, options, buffer, indent);
}


PenroseRhombus.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


PenroseRhombus.prototype._drawFancyStrapping = function(canvasContext, svg, options, buffer, indent) {
    turtle = new Turtle();
    var shortSegmentLength = 0.163 * this.size;
    var mediumSegmentLength = 0.2625 * this.size;
    var longSegmentLength = 0.587 * this.size;
    var capGap = options.capGap;
    var faces = Girih.TILE_FACES [this.tileType];

    // do all of the straps
    for( var i = 0; i<2; i++) {
        turtle.toXY( this.position.x, this.position.y); // center of decagon
        turtle.toAD( this.angle + faces[0 +i*2].centralAngle,
                faces[0 +i*2].radialCoefficient * this.size); //vertex of decagon
        turtle.toaD( Math.PI - faces[0 +i*2].angleToCenter + faces[0 +i*2].angleToNextVertex,
                this.size/2); //at midpoint

        turtle.toaD( 3* piTenths, 0); // ready for strapping

        var chainNumber = this.connectors[ 0 +i*2].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

        strapOptions = { turtle: turtle,
                         distance: shortSegmentLength,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: false,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 0 +i*2, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }

        turtle.toaD( 2 * piTenths, 0) // do the bend

        strapOptions = { turtle: turtle,
                         distance: shortSegmentLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 4* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 0 +i*2, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }
        turtle.toaD( 0, capGap); // to edge
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
                         distance: mediumSegmentLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: false,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 1+ i*2, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }
        turtle.toaD( 0, 2* capGap); // cross over long segment

        strapOptions = { turtle: turtle,
                         distance: longSegmentLength - mediumSegmentLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 6* piTenths,
                         endAngle: 7* piTenths,
                         startCap: true,
                         endCap: false,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 1+ i*2, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }

        turtle.toaD( -4* piTenths, 0); // do the bend

        strapOptions = { turtle: turtle,
                         distance: longSegmentLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: chainColor,
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 1+ i*2, chainNumber)
                       };
        if (svg) {
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }
    }
}
