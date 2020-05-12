/**
 * @author Ikaros Kappler
 * @date 2013-11-28
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @date 2030-05-11 Kirk Carlson (converted to use ECMA6 class).
 * @version 1.0.2
 **/


class Rhombus extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.rhombusFillColor;
        }

        super( size, position, angle, IKRS.Girih.TILE_TYPE_RHOMBUS, fillColor );
        // in theory type should not be needed.

        this.buildTile();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

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
    var turtle = new Turtle();
    const bentSegmentLength = 0.424 * this.size // bent segment
    const directSegmentLength = 0.587 * this.size // direct cross segment

    var innerTile =  new IKRS.Polygon(); // [];
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    turtle.toXY( this.position.x, this.position.y); // center of rhombus
    turtle.toAD( this.angle + faces[0].centralAngle,
                              faces[0].radialCoefficient * this.size); //at vertice 0
    turtle.toaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    for (var i = 0; i<2; i++ ) {
        innerTile.addVertex( turtle.position);
        turtle.toaD( 3* piTenths, directSegmentLength); //midpoint of side 1 or 3

        innerTile.addVertex( turtle.position);
        turtle.toaD( 6* piTenths, bentSegmentLength); // middle of bend

        innerTile.addVertex( turtle.position);
        turtle.toaD( -2* piTenths, bentSegmentLength); // mindpoint of 2 or 0
        turtle.toaD( 3* piTenths, 0);
    }

    this.innerTilePolygons.push( innerTile );
};


Rhombus.prototype._buildOuterPolygons = function() {
    var turtle = new Turtle();
    const bentSegmentLength = 0.424 * this.size // bent segment
    const directSegmentLength = 0.587 * this.size // direct cross segment

    var tile0 =  new IKRS.Polygon(); // [];
    var tile1 =  new IKRS.Polygon(); // [];
    var tile2 =  new IKRS.Polygon(); // [];
    var tile3 =  new IKRS.Polygon(); // [];

    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    turtle.toXY( this.position.x, this.position.y); // center of rhombus
    turtle.toAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    turtle.toaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0

    tile0.addVertex( turtle.position);
    tile0.addVertex( this.getVertexAt(0).clone());

    tile1.addVertex( turtle.position);
    turtle.toaD( 3* piTenths, directSegmentLength); //midpoint of side 1
    tile1.addVertex( turtle.position);
    tile1.addVertex( this.getVertexAt(1).clone());

    tile2.addVertex( turtle.position);
    turtle.toaD( 6* piTenths, bentSegmentLength); // middle of bend
    tile2.addVertex( turtle.position);
    turtle.toaD( -2* piTenths, bentSegmentLength); // mindpoint of 2
    tile2.addVertex( turtle.position);
    tile2.addVertex( this.getVertexAt(2).clone());

    tile3.addVertex( turtle.position);
    turtle.toaD( 6* piTenths, directSegmentLength); //midpoint of side 3
    tile3.addVertex( turtle.position);
    tile3.addVertex( this.getVertexAt(3).clone());

    tile0.addVertex( turtle.position);
    turtle.toaD( 6* piTenths, bentSegmentLength); // middle of bend
    tile0.addVertex( turtle.position);

    this.outerTilePolygons.push( tile0 );
    this.outerTilePolygons.push( tile1 );
    this.outerTilePolygons.push( tile2 );
    this.outerTilePolygons.push( tile3 );
}


Rhombus.prototype.getSVGforFancyStrapping = function( options, buffer, indent) {
    this._drawFancyStrapping (undefined, true, options, buffer, indent);
}


Rhombus.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


Rhombus.prototype._drawFancyStrapping = function(canvasContext, svg, options, buffer, indent) {
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
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }
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
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
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
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
        }
    }
}
