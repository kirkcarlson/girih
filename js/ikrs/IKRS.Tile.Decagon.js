/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/


//IKRS.Tile.Decagon = function( size, position, angle, fillColor ) {

    //IKRS.Tile.call( this, size, position, angle, IKRS.Girih.TILE_TYPE_DECAGON );

class Decagon extends Tile {
    constructor ( size, position, angle, fillColor) {
        if (fillColor !== undefined) {
            fillColor = fillColor;
        } else {
            fillColor = girihCanvasHandler.drawProperties.decagonFillColor;
        }

        super( size, position, angle, IKRS.Girih.TILE_TYPE_DECAGON, fillColor );
        // in theory type should not be needed.

        this.buildPolygon();
        this._buildInnerPolygons( size );
        this._buildOuterPolygons();       // Only call AFTER the inner polygons were created!
        this.buildConnectors();

console.log( "Decagon:"+ position +" angle:" + angle *180/Math.PI)
/*
    // Init the actual decahedron shape with the passed size
    var pointA = new IKRS.Point2(0,0);
    var pointB = pointA;
    this._addVertex( pointB );

    var theta = Math.PI/2 * (144.0 / 360.0);
    for( var i = 1; i <= 9; i++ ) {
	pointA = pointB; // center of rotation
	pointB = pointB.clone();
	pointB.x += size;
	pointB.rotate( pointA, i*theta );
	this._addVertex( pointB );
    }
*/

/*
    // Move to center
    var bounds = IKRS.BoundingBox2.computeFromPoints( this.polygon.vertices );
    var move   = new IKRS.Point2( size/2.0,
				  -bounds.getHeight()/2.0
				);
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {

	this.polygon.vertices[i].add( move );

    }
*/

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


/*
Decagon.prototype.drawFancyStrappingOld = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    var lineNumber = 0
    var strapLength = 0.95 * tile.size // overall length of each strap
    var startBrokenStrap = 0.589 * tile.size
    var endBrokenStrap = strapLength - startBrokenStrap // end part of strap
    var capGap = this.capGap();
    var lineSpacing = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];

    this.moveToXY( tile.position.x, tile.position.y); // center of decagon
    this.moveToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of decagon
    this.moveToaD( 6*piTenths, tile.size/2); //center of decagon side, ready for side
    this.moveToaD( 3* piTenths, 0); // ready for strapping

    // do the even numbered straps
    for( var i = 0; i<5; i++) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
if (chainNumber === undefined) {
    console.log("bad chain number for tile")
}
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
if (chainColor === undefined) {
    console.log( "chain fill color not defined")
}
	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber} , ["strap"]))
	this.gline( startBrokenStrap - capGap, lineSpacing, 7* piTenths, 4* piTenths, false, true, chainColor)
	this.moveToaD( 0, capGap * 2); // gap on each side of strap
	this.gline( endBrokenStrap - capGap, lineSpacing, 6* piTenths, 6* piTenths, true, false, chainColor)
	this.moveToaD( -2* piTenths, 0);
	this.gline( strapLength - capGap, lineSpacing, 6* piTenths, 4* piTenths, false, true, chainColor)
	this.moveToaD( 0, capGap);
	this.moveToaD( 6* piTenths, 0);
	lineNumber = lineNumber + 2
	//endGroup()
    }

    // do the odd numbered straps
    lineNumber = 1
    this.lineToaD( -3* piTenths, tile.size / 2);
    this.lineToaD( 2* piTenths, tile.size / 2);
    this.lineToaD( 3* piTenths, 0);

    for( var i = 0; i<5; i++) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
if (chainNumber === undefined) {
    console.log("bad chain number for tile");
}
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
if (chainColor === undefined) {
    console.log( "chain fill color not defined");
}
	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber} , ["strap"]))
	this.gline( startBrokenStrap - capGap, lineSpacing, 7* piTenths, 4* piTenths, false, true, chainColor)
	this.moveToaD( 0, capGap * 2); // why is this *2?
	this.gline( endBrokenStrap - capGap, lineSpacing, 6* piTenths, 6* piTenths, true, false, chainColor)
	this.moveToaD( -2* piTenths, 0);
	this.gline( strapLength - capGap, lineSpacing, 6* piTenths, 4* piTenths, false, true, chainColor)
	this.moveToaD( 0, capGap);
	this.moveToaD( 6* piTenths, 0);
	//endGroup()
	lineNumber = lineNumber + 2
    }
}
*/

Decagon.prototype.getSVGforFancyStrapping = function( options) {
    this._drawFancyStrapping (undefined, true, options);
}


Decagon.prototype.drawFancyStrapping = function( canvasContext, options) {
    this._drawFancyStrapping (canvasContext, false, options);
}


Decagon.prototype._drawFancyStrapping = function(canvasContext, svg, options) {
//inputs: size, position, angle, canvas context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    turtle = new Turtle();
    var strapLength = 0.95 * this.size // overall length of each strap
    var startBrokenStrap = 0.589 * this.size
    var endBrokenStrap = strapLength - startBrokenStrap // end part of strap
    var capGap = options.capGap;
    var faces = IKRS.Girih.TILE_FACES [this.tileType];

    // do all of the straps
    for( var i = 0; i<10; i++) {
        turtle.toXY( this.position.x, this.position.y); // center of decagon
        turtle.toAD( this.angle + faces[i].centralAngle, faces[i].radialCoefficient * this.size); //vertex of decagon
        turtle.toaD( Math.PI - faces[i].angleToCenter + faces[i].angleToNextVertex, this.size/2); //at midpoint

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
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
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
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
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
            girihCanvasHandler.getStrapSegmentSVG ( strapOptions);
        } else {
            girihCanvasHandler.drawStrapSegment ( canvasContext, strapOptions);
        }
	//endGroup()
    }
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

	//if( i > 0 )
	//    continue;

	//window.alert( this.getInnerTilePolygonAt );

	var outerTile = new IKRS.Polygon();
	outerTile.addVertex( this.getVertexAt(i).clone() );
	outerTile.addVertex( this.innerTilePolygons[i].getVertexAt(0).clone() );
	outerTile.addVertex( this.innerTilePolygons[i].getVertexAt(3).clone() );
	outerTile.addVertex( this.getInnerTilePolygonAt( i==0 ? 9 : i-1 ).getVertexAt(0).clone() );

	this.outerTilePolygons.push( outerTile );
    }
};


/*
Decagon.prototype.getSVGforFancyDecagonStrappingOld = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    var lineNumber = 0
    var strapLength = 0.95 * tile.size // overall length of each strap
    var startBrokenStrap = 0.589 * tile.size
    var endBrokenStrap = strapLength - startBrokenStrap // end part of strap
    var capGap = this.capGap();
    var lineSpacing = this.drawProperties.strappingWidth;
    var faces = IKRS.Girih.TILE_FACES [tile.tileType];
    var svgStrings = [];

    this.posToXY( tile.position.x, tile.position.y); // center of decagon
    this.posToAD( tile.angle + faces[0].centralAngle, faces[0].radialCoefficient * tile.size); //corner of decagon
    this.posToaD( 6*piTenths, tile.size/2); //center of decagon side, ready for side
    this.posToaD( 3* piTenths, 0); // ready for strapping

    // do the even numbered straps
    for( var i = 0; i<5; i++) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
if (chainNumber === undefined) {
    console.log("bad chain number for tile")
}
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
if (chainColor === undefined) {
    console.log( "chain fill color not defined")
}
	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber} , ["strap"]))
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' chain_length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();
	svgStrings.push( this.getGlineSVG( startBrokenStrap - capGap,
					   lineSpacing,
					   7* piTenths,
					   4* piTenths,
					   false,
					   true,
					   chainColor))
	this.posToaD( 0, capGap * 2); // gap on each side of strap
	svgStrings.push( this.getGlineSVG( endBrokenStrap - capGap,
					   lineSpacing,
					   6* piTenths,
					   6* piTenths,
					   true,
					   false,
					   chainColor))
	this.posToaD( -2* piTenths, 0);
	svgStrings.push( this.getGlineSVG( strapLength - capGap,
					   lineSpacing, 6* piTenths,
					   4* piTenths,
					   false,
					   true,
					   chainColor))
	this.posToaD( 0, capGap);
	this.posToaD( 6* piTenths, 0);
	lineNumber = lineNumber + 2
	//endGroup()
        this.indentDec();
        svgStrings.push( this.indent + '</g>' + this.eol);
    }

    // do the odd numbered straps
    lineNumber = 1
    this.posToaD( -3* piTenths, tile.size / 2);
    this.posToaD( 2* piTenths, tile.size / 2);
    this.posToaD( 3* piTenths, 0);

    for( var i = 0; i<5; i++) {
        var chainNumber = tile.connectors[ lineNumber].CWchainID
if (chainNumber === undefined) {
    console.log("bad chain number for tile");
}
        var chainColor = girihCanvasHandler.girih.chains[chainNumber].fillColor;
if (chainColor === undefined) {
    console.log( "chain fill color not defined");
}
	//beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber} , ["strap"]))
        svgStrings.push( this.indent + '<g class="Link_'+ lineNumber +
		' Chain_'+ chainNumber +
		' chain_length_' + girihCanvasHandler.girih.chains[chainNumber].links.length +
		(girihCanvasHandler.girih.chains[chainNumber].isLoop ? ' Loop' : '') +
		'">' + this.eol);
        this.indentInc();
	svgStrings.push( this.getGlineSVG( startBrokenStrap - capGap,
					   lineSpacing,
					   7* piTenths,
					   4* piTenths,
					   false,
					   true,
					   chainColor))
	this.posToaD( 0, capGap * 2); // why is this *2?
	svgStrings.push( this.getGlineSVG( endBrokenStrap - capGap,
					   lineSpacing,
					   6* piTenths,
					   6* piTenths,
					   true,
					   false,
					   chainColor))
	this.posToaD( -2* piTenths, 0);
	svgStrings.push( this.getGlineSVG( strapLength - capGap,
					   lineSpacing,
					   6* piTenths,
					   4* piTenths,
					   false,
					   true,
					   chainColor))
	this.posToaD( 0, capGap);
	this.posToaD( 6* piTenths, 0);
	//endGroup()
        this.indentDec();
        svgStrings.push( this.indent + '</g>' + this.eol);
	lineNumber = lineNumber + 2
    }
    return svgStrings.join("")
}
*/


// This is totally shitty. Why object inheritance when I still
// have to inherit object methods manually??!
//IKRS.Tile.Decagon.prototype.posToXY              = IKRS.GirihCanvasHandler.prototype.posToXY;
//IKRS.Tile.Decagon.prototype.posToAD              = IKRS.GirihCanvasHandler.prototype.posToAD;
//IKRS.Tile.Decagon.prototype.posToaD              = IKRS.GirihCanvasHandler.prototype.posToaD;
//IKRS.Tile.Decagon.prototype.moveToXY              = IKRS.GirihCanvasHandler.prototype.moveToXY;
//IKRS.Tile.Decagon.prototype.moveToAD              = IKRS.GirihCanvasHandler.prototype.moveToAD;
//IKRS.Tile.Decagon.prototype.moveToaD              = IKRS.GirihCanvasHandler.prototype.moveToaD;
//IKRS.Tile.Decagon.prototype.gline                 = IKRS.GirihCanvasHandler.prototype.gline;
//IKRS.Tile.Decagon.prototype.buildPolygon          = IKRS.Tile.prototype.buildPolygon;
//IKRS.Tile.Decagon.prototype.computeBounds         = IKRS.Tile.prototype.computeBounds;
//IKRS.Tile.Decagon.prototype._addVertex            = IKRS.Tile.prototype._addVertex;
//IKRS.Tile.Decagon.prototype._translateVertex      = IKRS.Tile.prototype._translateVertex;
//IKRS.Tile.Decagon.prototype._polygonToSVG         = IKRS.Tile.prototype._polygonToSVG;
//IKRS.Tile.Decagon.prototype.getInnerTilePolygonAt = IKRS.Tile.prototype.getInnerTilePolygonAt;
//IKRS.Tile.Decagon.prototype.getOuterTilePolygonAt = IKRS.Tile.prototype.getOuterTilePolygonAt;
//IKRS.Tile.Decagon.prototype.getTranslatedVertex   = IKRS.Tile.prototype.getTranslatedVertex;
//IKRS.Tile.Decagon.prototype.containsPoint         = IKRS.Tile.prototype.containsPoint;
//IKRS.Tile.Decagon.prototype.locateEdgeAtPoint     = IKRS.Tile.prototype.locateEdgeAtPoint;
//IKRS.Tile.Decagon.prototype.locateAdjacentEdge    = IKRS.Tile.prototype.locateAdjacentEdge;
//IKRS.Tile.Decagon.prototype.getVertexAt           = IKRS.Tile.prototype.getVertexAt;
//IKRS.Tile.Decagon.prototype.toSVG                 = IKRS.Tile.prototype.toSVG;

//IKRS.Tile.Decagon.prototype.constructor           = IKRS.Tile.Decagon;
