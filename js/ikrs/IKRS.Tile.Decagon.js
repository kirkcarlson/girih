/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @date 2014-04-05 Ikaros Kappler (member array outerTilePolygons added).
 * @date 2015-03-19 Ikaros Kappler (added toSVG()).
 * @version 1.0.2
 **/


IKRS.Tile.Decagon = function( size, position, angle ) {
    
    IKRS.Tile.call( this, size, position, angle, IKRS.Girih.TILE_TYPE_DECAGON );
    
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

    // Move to center
    var bounds = IKRS.BoundingBox2.computeFromPoints( this.polygon.vertices );
    var move   = new IKRS.Point2( size/2.0, 
				  -bounds.getHeight()/2.0
				);
    for( var i = 0; i < this.polygon.vertices.length; i++ ) {
	
	this.polygon.vertices[i].add( move );
		
    }

    this.faces = [];
    for (var i=0; i<10; i++) {
        this.faces.push( new IKRS.Face( -4* piTenths, 2* piTenths, 1, 6* piTenths, 1/(2* Math.sin(piTenths))));
    }

    this.imageProperties = {
	source: { x:      169/500.0,
		  y:      140/460.0,
		  width:  313/500.0,
		  height: 297/460.0
		},
	destination: { xOffset: 0.0,
		       yOffset: 0.0
		     }
    };


    this._buildInnerPolygons( size );
    this._buildOuterPolygons();       // Important: call AFTER inner polygons were created!
  
};


IKRS.GirihCanvasHandler.prototype.drawDecagon = function (tile) {
//inputs: size, position, angle, context
    this.context.beginPath();
console.log("decagon tile position:" + IKRS.Girih.round(tile.position.x) +","+
                                       IKRS.Girih.round(tile.position.y) +" angle:"+
                                       IKRS.Girih.round( IKRS.Girih.rad2deg(tile.angle)) +" size:" + tile.size)
        //assume tile angle 0 is east, and first tile segment is sloping to right top
    var radial = tile.size/(1 * Math.sin( 1 * piTenths));
    this.moveToXY( tile.position.x, tile.position.y); // center of pentagon
    this.lineToAD( tile.angle -4* piTenths, radial); //corner of pentagon
    this.moveToAD( tile.angle, 0); //corner of pentagon, ready for side
    for (var i=0; i<10; i++) {
        this.lineToaD( 2* piTenths, tile.size);
    }
    this.context.strokeStyle = "#0000FF";
    this.context.stroke();
    this.context.closePath();
}

IKRS.GirihCanvasHandler.prototype.drawFancyDecagonStrapping = function(tile) {
//inputs: size, position, angle, context
    // each segment in this function is its own path/segment
    // should be using line number for format SVG class gline segment group, e.g., "Polygon_x_Line_y"

    var lineNumber = 0
    var decaLineSide = 0.95 * tile.size // overall length of each strap
    var dl1 = 0.585 * decaLineSide // start part of strap
    var dl1 = 0.620 * decaLineSide // start part of strap
    var dl2 = decaLineSide - dl1 // end part of strap
    var radial = tile.size/(2 * Math.sin( 1 * piTenths));
    const capGap = IKRS.GirihCanvasHandler.capGap;

    this.context.beginPath();
    this.lineToXY( tile.position.x, tile.position.y); // center of decagon
    this.lineToAD( tile.angle + -4* piTenths, radial); //corner of decagon
    this.lineToaD( 6*piTenths, tile.size/2); //corner of pentagon, ready for side
	this.lineToaD( 3* piTenths, 0); // ready for girih
    this.context.strokeStyle = "#0000FF";
    this.context.stroke();
    this.context.closePath();
var saveX = this.position.x
var saveY = this.position.y
        // do the even numbered straps
        for( var i = 0; i<5; i++) {
            //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber} , ["strap"]))
            this.gline( dl1 - capGap, lineSpacing, 7* piTenths, 4* piTenths, false, true)
            //forward( capGap * 2)
	    this.moveToaD( 0, capGap * 2); // gap on each side of strap
            this.gline( dl2 - capGap, lineSpacing, 6* piTenths, 6* piTenths, true, false)
            //left( 2 * 18)
	    this.moveToaD( -2* piTenths, 0);
            this.gline( decaLineSide - capGap, lineSpacing, 6* piTenths, 4* piTenths, false, true)
            //forward( capGap)
	    this.moveToaD( 0, capGap);
            //right( 6 * 18)
	    this.moveToaD( 6* piTenths, 0);
            //endGroup()
            lineNumber = lineNumber + 2
        }

        // do the odd numbered straps
    this.context.beginPath();
        lineNumber = 1
        //penup()
        //left( 3 * 18)
        //forward( tile.size / 2)
	this.lineToaD( -3* piTenths, tile.size / 2);
        //right( 2 * 18)
        //forward( tile.size / 2)
	this.lineToaD( 2* piTenths, tile.size / 2);
        //right( 3 * 18)
	this.lineToaD( 3* piTenths, 0);
    this.context.strokeStyle = "#0000FF";
    this.context.stroke();
    this.context.closePath();
var saveX = this.position.x
var saveY = this.position.y

        for( var i = 0; i<5; i++) {
            //beginGroup( idClass({polygonNumber:polygonCount,lineNumber:lineNumber} , ["strap"]))
            this.gline( dl1 - capGap, lineSpacing, 7* piTenths, 4* piTenths, false, true)
            //forward( capGap * 2)
	    this.moveToaD( 0, capGap * 2); // why is this *2?
            this.gline( dl2 - capGap, lineSpacing, 6* piTenths, 6* piTenths, true, false)
            //left( 2 * 18)
	    this.moveToaD( -2* piTenths, 0);
            this.gline( decaLineSide - capGap, lineSpacing, 6* piTenths, 4* piTenths, false, true)
            //forward( capGap)
	    this.moveToaD( 0, capGap);
            //right( 6 * 18)
	    this.moveToaD( 6* piTenths, 0);
            //endGroup()
            lineNumber = lineNumber + 2
        }
}


IKRS.Tile.Decagon.prototype._buildInnerPolygons = function( edgeLength ) {
    
    var centralStar = new IKRS.Polygon();
    for( var i = 0; i < 10; i++ ) {
	var innerTile = new IKRS.Polygon(); // [];
	// Make polygon
	var topPoint    = this.getVertexAt( i ).clone().scaleTowards( this.getVertexAt(i+1), 0.5 );
	var bottomPoint = topPoint.clone().multiplyScalar( 0.615 );
	var leftPoint   = this.getVertexAt( i ).clone().multiplyScalar( 0.69 );
	var rightPoint  = this.getVertexAt( i+1 ).clone().multiplyScalar( 0.69 );
	
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


IKRS.Tile.Decagon.prototype._buildOuterPolygons = function( edgeLength ) {

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


// This is totally shitty. Why object inheritance when I still
// have to inherit object methods manually??!
IKRS.Tile.Decagon.prototype.moveToXY                = IKRS.GirihCanvasHandler.prototype.moveToXY;
IKRS.Tile.Decagon.prototype.moveToAD                = IKRS.GirihCanvasHandler.prototype.moveToAD;
IKRS.Tile.Decagon.prototype.moveToaD                = IKRS.GirihCanvasHandler.prototype.moveToaD;
IKRS.Tile.Decagon.prototype.gline                   = IKRS.GirihCanvasHandler.prototype.gline;
IKRS.Tile.Decagon.prototype.computeBounds           = IKRS.Tile.prototype.computeBounds;
IKRS.Tile.Decagon.prototype._addVertex              = IKRS.Tile.prototype._addVertex;
IKRS.Tile.Decagon.prototype._translateVertex        = IKRS.Tile.prototype._translateVertex;
IKRS.Tile.Decagon.prototype._polygonToSVG           = IKRS.Tile.prototype._polygonToSVG;
IKRS.Tile.Decagon.prototype.getInnerTilePolygonAt   = IKRS.Tile.prototype.getInnerTilePolygonAt;
IKRS.Tile.Decagon.prototype.getOuterTilePolygonAt   = IKRS.Tile.prototype.getOuterTilePolygonAt;
IKRS.Tile.Decagon.prototype.getTranslatedVertex     = IKRS.Tile.prototype.getTranslatedVertex;
IKRS.Tile.Decagon.prototype.containsPoint           = IKRS.Tile.prototype.containsPoint;
IKRS.Tile.Decagon.prototype.locateEdgeAtPoint       = IKRS.Tile.prototype.locateEdgeAtPoint;
IKRS.Tile.Decagon.prototype.locateAdjacentEdge      = IKRS.Tile.prototype.locateAdjacentEdge;
IKRS.Tile.Decagon.prototype.getVertexAt             = IKRS.Tile.prototype.getVertexAt;
IKRS.Tile.Decagon.prototype.toSVG                   = IKRS.Tile.prototype.toSVG;

IKRS.Tile.Decagon.prototype.constructor             = IKRS.Tile.Decagon;
