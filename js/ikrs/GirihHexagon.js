/**
 * @author Ikaros Kappler
 * @date 2013-11-28
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/
//import Turtle from "/js/ikrs/Turtle.js";


class IrregularHexagon extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.hexagonFillColor;
        }

        super( size, position, angle, Girih.TILE_TYPE.IRREGULAR_HEXAGON, fillColor );
        // in theory type should not be needed.

        this.buildTile();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

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
        faces.push( new Face( // left side of point
            /*centralAngle*/        10* piTenths + radialAngle + i* Math.PI,
            /*angleToNextVertex:*/  2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      5* piTenths + radialAngle,
            /*radialCoefficient:*/  radialShort
        ));
        faces.push( new Face( // right side of point
            /*centralAngle:*/       15* piTenths + i* Math.PI,
            /*angleToNextVertex:*/  6* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      8* piTenths,
            /*radialCoefficient:*/  radialLong
        ));
        faces.push( new Face( // flat side
            /*centralAngle:*/       0* piTenths - radialAngle + i* Math.PI,
            /*angleToNextVertex:*/  2* piTenths,
            /*lengthCoefficient:*/  1,
            /*angleToCenter:*/      7* piTenths - radialAngle,
            /*radialCoefficient:*/  radialShort
        ));
    }
    return faces;
}


IrregularHexagon.prototype._buildInnerPolygons = function() {
    var turtle = new Turtle();
    var innerTile = new Polygon(); // [];
    var faces = Girih.TILE_FACES [this.tileType];


    turtle.toXY( this.position.x, this.position.y); // center of pentagon
    turtle.toAD( this.angle + faces[0].centralAngle,
                                faces[0].radialCoefficient * this.size); //at vertice 0
    turtle.toaD( Math.PI - faces[0].angleToCenter + faces[0].angleToNextVertex,
                                0.5 * this.size); //midpoint of side 0
    for( var j = 0; j<2; j++) {
        innerTile.addVertex( turtle.position); //[0][5]mid point 0,3
        turtle.toaD(  3* piTenths, 0.587 * this.size);

        for( var i = 0; i<2; i++) {
            innerTile.addVertex( turtle.position); //mid point [1]1,[3]3, [6]4,[8]5
            turtle.toaD( 6* piTenths, 0.587 * this.size);
            innerTile.addVertex( turtle.position); //bend point [2]1,[4]2 [7]3,[9]4

            turtle.toaD( -4* piTenths, 0.587 * this.size);
        }
        turtle.toaD( 3* piTenths, 0);
    }
    this.innerTilePolygons.push( innerTile );
}


IrregularHexagon.prototype._buildOuterPolygons = function() {

    // First add the two triangles at the 'ends' of the shape.
    var indicesA = [ 0, 3 ];  //  6:2
    var indicesB = [ 0, 5 ];  // 10:2
    for( var i = 0; i < indicesA.length; i++ ) {

        var indexA     = indicesA[i];
        var indexB     = indicesB[i];
        // The triangle
        var outerTileX = new Polygon();
        outerTileX.addVertex( this.getVertexAt(indexA+1).clone() );
        outerTileX.addVertex( this.innerTilePolygons[0].getVertexAt(indexB).clone() );
        outerTileX.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+1).clone() );
        this.outerTilePolygons.push( outerTileX );

        // The first 'kite'
        var outerTileY = new Polygon();
        outerTileY.addVertex( this.getVertexAt(indexA+2).clone() );
        outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+1).clone() );
        outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+2).clone() );
        outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+3).clone() );
        this.outerTilePolygons.push( outerTileY );

        // The second 'kite'
        var outerTileY = new Polygon();
        outerTileY.addVertex( this.getVertexAt(indexA+3).clone() );
        outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+3).clone() );
        outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+4).clone() );
        outerTileY.addVertex( this.innerTilePolygons[0].getVertexAt(indexB+5).clone() );
        this.outerTilePolygons.push( outerTileY );
    }
};


/*
IrregularHexagon.prototype.getSVGforFancyStrapping = function( options, buffer, indent) {
    this._drawFancyStrapping (undefined, true, options, buffer, indent);
}


IrregularHexagon.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


IrregularHexagon.prototype._drawFancyStrapping = function(canvasContext, svg, options, buffer, indent) {
//inputs: size, position, angle, canvas context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    turtle = new Turtle();
    var strapLength = 0.587 * this.size // overall length of each strap
    var capGap = options.capGap;
    var faces = Girih.TILE_FACES [this.tileType];
    var svgStrings = [];

    // do all of the straps
    for( var i = 0; i<2; i++) {
        turtle.toXY( this.position.x, this.position.y); // center of hexagon
        turtle.toAD( this.angle + faces[0 +i*3].centralAngle,
                faces[0 +i*3].radialCoefficient * this.size); //vertex of hexagon
        turtle.toaD( Math.PI - faces[0 +i*3].angleToCenter + faces[0 +i*3].angleToNextVertex,
                this.size/2); //at midpoint

        turtle.toaD( 3* piTenths, 0); // ready for strapping

        var chainNumber = this.connectors[ 0 +i*3].CWchainID
        if (chainNumber === undefined) {
            console.log("bad chain number for tile")
        }
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
        if (chainColor === undefined) {
            console.log( "chain fill color not defined")
        }

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
            this.getStrapSegmentSVG ( strapOptions, buffer, indent);
        } else {
            this.drawStrapSegment ( canvasContext, strapOptions);
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
                this.getStrapSegmentSVG ( strapOptions, buffer, indent);
            } else {
                this.drawStrapSegment ( canvasContext, strapOptions);
            }
            turtle.toaD( -4* piTenths, 0); //do the bend

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
                this.getStrapSegmentSVG ( strapOptions, buffer, indent);
            } else {
                this.drawStrapSegment ( canvasContext, strapOptions);
            }
            turtle.toaD( 0, capGap); // back to edge
            turtle.toaD( 6* piTenths, 0); // ready for next strap
        }
    }
}
*/


IrregularHexagon.prototype.getStrapVectors = function( options) {
    turtle = new Turtle();
    var strapLength = 0.587 * this.size // overall length of each strap
    var capGap = options.capGap;
    var faces = Girih.TILE_FACES [this.tileType];
    var vectors = [];

    // do all straps in two passes, one for each side
    for( var i = 0; i<2; i++) {
        turtle.toXY( this.position.x, this.position.y); // center of hexagon
        turtle.toAD( this.angle + faces[0 +i*3].centralAngle,
                faces[0 +i*3].radialCoefficient * this.size); //vertex of hexagon
        turtle.toaD( Math.PI - faces[0 +i*3].angleToCenter + faces[0 +i*3].angleToNextVertex,
                this.size/2); //at midpoint

        turtle.toaD( 3* piTenths, 0); // ready for strapping

        vectors.push( {
                         turtle: turtle.clone(),
                         distance: strapLength - capGap,
                         spacing: options.strappingWidth,
                         startAngle: 7* piTenths,
                         endAngle: 4* piTenths,
                         startCap: false,
                         endCap: true,
                         fillStyle: this.getChainColor( 0 +i*3),
                         fillOpacity: 1,
                         segmentClass: this.getSegmentClass( 0 +i*3)
                       } );

        turtle.toaD( 0, strapLength);
        turtle.toaD( 6* piTenths, 0); // ready for next strap

        for( var j=0; j<2; j++) {
            vectors.push( {
                             turtle: turtle.clone(),
                             distance: strapLength,
                             spacing: options.strappingWidth,
                             startAngle: 7* piTenths,
                             endAngle: 7* piTenths,
                             startCap: false,
                             endCap: false,
                             fillStyle: this.getChainColor( j+1 +i*3),
                             fillOpacity: 1,
                             segmentClass: this.getSegmentClass( j+1 +i*3)
                           } );

            turtle.toaD( 0, strapLength);
            turtle.toaD( -4* piTenths, 0); //do the bend

            vectors.push( {
                             turtle: turtle.clone(),
                             distance: strapLength - capGap,
                             spacing: options.strappingWidth,
                             startAngle: 7* piTenths,
                             endAngle: 4* piTenths,
                             startCap: false,
                             endCap: true,
                             fillStyle: this.getChainColor( j+1 +i*3),
                             fillOpacity: 1,
                             segmentClass: this.getSegmentClass( j+1 +i*3)
                           } );

            turtle.toaD( 0, strapLength);
            turtle.toaD( 6* piTenths, 0); // ready for next strap
        }
    }
    return vectors;
}
