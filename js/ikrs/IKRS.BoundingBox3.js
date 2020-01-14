/**
 * @author Kirk Carlson based on code by Ikaros Kappler
 * @date 2019-12-26
 * @version 1.0.0
 **/

// kirk added this slight variation to allow parent to define the object and let
// the child modify it as it sees fit
// This is used to find the SVG height and width
//   code believed to be unnecessary is marked with '//K '

//constructor
IKRS.BoundingBox3 = function() {
    
    IKRS.Object.call( this );
    
    this.xMin = undefined;
    this.xMax = undefined;
    this.yMin = undefined;
    this.yMax = undefined;
};


IKRS.BoundingBox3.prototype.evaluatePoint = function( a, b) {
/*
  (a,b) can be:
    an x, y pair
    a point, an array of x,y
    an array of points
    a similar object (for a union)

  returns undefined
  modifies the invoked BoundingBox3
*/

    var e;
    var member;
    IKRS.Object.call( this );

    if (b ===  undefined) { // only one parameter
        if (a === undefined) {
            console.log( "this.evaluatePoint( a, b) passed with no parameters");
        }
        if (typeof(a) === "object") {
            if (Array.isArray(a )) { // can be a single point or an array of point objects
//                if (a.length >= 2 &&
//                        typeof(a[0]) === "number" &&
//                        typeof(a[1]) === "number") { // just a single point [x,y]
//                    this._evaluatePoint( a[0], a[1]);
//                } else if (a.length > 0) { // possible array of points
                if (a.length > 0) { // possible array of points
                    for (member in a){
                        e = a[member];
                        if ( typeof (e.x) !== "number" ||
                             typeof (e.y) !== "number") {
                            console.log( "this.evaluatePoint( a, b) passed an ill formed list of points" + " e.len:"+e.length + " e.x:"+e.x + " e.y:"+e.y)
                        } else {
                            this._evaluatePoint( e.x, e.y);
                        }
                    }
                } else {
                    console.log( "this.evaluatePoint( a, b) passed with an empty array");
                }
            } else if (typeof(a.xMin) === "number" &&
                       typeof(a.xMax) === "number" &&
                       typeof(a.yMin) === "number" &&
                       typeof(a.yMax) === "number") { // assume a bounding box
                this._evaluatePoint( a.xMin, a.yMin);
                this._evaluatePoint( a.xMax, a.yMax);
            } else if (typeof(a.x) === "number" &&
                       typeof(a.y) === "number") { // assume a point
                this._evaluatePoint( a.x, a.y);
            } else {
                console.log( "this.evaluatePoint( a, b) passed with unknown object");
            }
        } else { //not a singular object
            console.log( "this.evaluatePoint( a, b) passed with unknown arguments");
        }
    } else if (typeof(a) === "number" &&
               typeof(b) === "number") { // just an x y pair
        this._evaluatePoint( a, b);
    } else {
        console.log( "this.evaluatePoint( a, b) passed with unknown arguments");
    }
};

IKRS.BoundingBox3.prototype._evaluatePoint = function( x, y) {

    IKRS.Object.call( this );

    if (x !== undefined) {
        if (this.xMin !== undefined) {
            if (x < this.xMin) this.xMin = x
        } else {
            this.xMin = x;
        }
        if (this.xMax !== undefined) {
            if (x > this.xMax) this.xMax = x
        } else {
            this.xMax = x;
        }
    }

    if (y !== undefined) {
        if (this.yMin !== undefined) {
            if (y < this.yMin) this.yMin = y
        } else {
            this.yMin = y;
        }
        if (this.yMax !== undefined) {
            if (y > this.yMax) this.yMax = y
        } else {
            this.yMax = y;
        }
    }
};

//K IKRS.BoundingBox3 = function( _xMin, _yMin) {
    
//K     IKRS.Object.call( this );
    
//K     this.xMin = _xMin;
//K     this.xMax = _xMin;
//K     this.yMin = _yMin;
//K     this.yMax = _yMin;
//K }

//K IKRS.BoundingBox3 = function( _xMin,
//K 			      _xMax,
//K 			      _yMin,
//K 			      _yMax ) {
    
//K     IKRS.Object.call( this );
    
//K     this.xMin = _xMin;
//K     this.xMax = _xMax;
//K     this.yMin = _yMin;
//K     this.yMax = _yMax;
//K }


IKRS.BoundingBox3.prototype.toString = function() {
    return "IKRS.BoundingBox3={ xMin: " + this.xMin + ", xMax: " + this.xMax + ", yMin: " + this.yMin + ", yMax: " + this.yMax + ", width: " + this.getWidth() + ", height: " + this.getHeight() + " }";
};


IKRS.BoundingBox3.prototype.getXMax = function() {
    return this.xMax;
};

IKRS.BoundingBox3.prototype.getXMin = function() {
    return this.xMin;
};

IKRS.BoundingBox3.prototype.getYMax = function() {
    return this.yMax;
};

IKRS.BoundingBox3.prototype.getYMin = function() {
    return this.yMin;
};

IKRS.BoundingBox3.prototype.getWidth = function() {
    return this.xMax - this.xMin;
};

IKRS.BoundingBox3.prototype.getHeight = function() {
    return this.yMax - this.yMin;
};

IKRS.BoundingBox3.prototype.getLeftUpperPoint = function() {
    return new IKRS.Point2( this.xMin, this.yMin );
};

IKRS.BoundingBox3.prototype.getRightUpperPoint = function() {
    return new IKRS.Point2( this.xMax, this.yMin );
};

IKRS.BoundingBox3.prototype.getRightLowerPoint = function() {
    return new IKRS.Point2( this.xMax, this.yMax );
};

IKRS.BoundingBox3.prototype.getLeftLowerPoint = function() {
    return new IKRS.Point2( this.xMin, this.yMax );
};

//K IKRS.BoundingBox3.prototype.getCenterPoint = function() {
//K     return new IKRS.Point2( this.xMin + this.getWidth()/2.0,
//K 			    this.yMin + this.getHeight()/2.0
//K 			  );
//K };
//K 
//K IKRS.BoundingBox3.prototype.computeDiagonalLength = function() {
//K     return this.getLeftUpperPoint().distanceTo( this.getRightLowerPoint() );
//K };
//K 
//K IKRS.BoundingBox3.prototype.computeBoundingBox = function() {
//K 
//K     // Aim: construct a triangle that conains this box in an acceptable
//K     //      way.
//K     // 'Acceptable' means, the whole box MUST be contained, the
//K     // triangle might be larger, but it should _not_ be too large!
//K 
//K     // Idea: first compute the diagonal of this box; it gives us an impression
//K     //       of the average size.
//K     var diagonal    = this.computeDiagonalLength();
//K     
//K     // Use the bottom line of the box, but make it diagonal*2 long.
//K     var centerPoint = this.getCenterPoint();
//K     var leftPoint   = new IKRS.Point2( centerPoint.x - diagonal,
//K 				       this.yMax 
//K 				     );
//K     var rightPoint  = new IKRS.Point2( centerPoint.x + diagonal,
//K 				       this.yMax
//K 				     );
//K 
//K     // Now make two linear interpolation lines from these points (they are left
//K     // and right outside of the box) to the upper both left respecive right
//K     // box points.
//K     var leftLine    = new IKRS.Line2( leftPoint,  this.getLeftUpperPoint() );
//K     var rightLine   = new IKRS.Line2( rightPoint, this.getRightUpperPoint() );
//K     
//K 
//K     // Where these lines meet is the top point of the triangle ;)
//K     
//K     return new IKRS.Triangle( leftPoint,
//K 			      leftLine.computeLineIntersection( rightLine ),  // the top point
//K 			      rightPoint
//K 			    );
//K };
//K 
//K /**
 //K * This function computes the union of this box and the passed box
 //K *
 //K * a dynamic function
 //K */
//K IKRS.BoundingBox3.prototype.computeUnion = function( bounds ) {
    //K if (bounds.xMin !== undefined) {
        //K if (this.xMin === undefined) {
            //K this.xMin = bounds.xMin;
        //K } else {
            //K this.xMin = Math.min( this.xMin, bounds.xMin)
        //K }
    //K }
    //K if (bounds.xMax !== undefined) {
        //K if (this.xMax === undefined) {
            //K this.xMax = bounds.xMax;
        //K } else {
            //K this.xMax = Math.max( this.xMax, bounds.xMax)
        //K }
    //K }
    //K if (bounds.yMin !== undefined) {
        //K if (this.yMin === undefined) {
            //K this.yMin = bounds.yMin;
        //K } else {
            //K this.yMin = Math.min( this.yMin, bounds.yMin)
        //K }
    //K }
    //K if (bounds.yMax !== undefined) {
        //K if (this.yMax === undefined) {
            //K this.yMax = bounds.yMax;
        //K } else {
            //K this.yMax = Math.max( this.yMax, bounds.yMax)
        //K }
    //K }
    //K return;
//K };

//K IKRS.BoundingBox3.prototype._toString = function() {
//K     return "[IKRS.BoundingBox3]={ xMin=" + this.xMin + ", xMax=" + this.xMax + ", yMin=" + this.yMin + ", yMax=" + this.yMax + ", width=" + this.getWidth() + ", height=" + this.getHeight() + " }";
//K }
//K 
//K 
// A dynamic function
//K IKRS.BoundingBox3.computeFromPoints = function( points ) {

    //K if( !points )
	//K return;
    //K 
    //K if( points.length === 0 )
	//K return;
//K 
    //K for( var i = 1; i < points.length; i++ ) {
//K 
	//K var point = points[ i ];
        //K if (this.xMin === undefined) {
            //K this.xMin = point.x;
        //K } else {
            //K this.xMin = Math.min( this.xMin, point.x);
        //K }
        //K if (this.xMax === undefined) {
            //K this.xMax = point.x;
        //K } else {
            //K this.xMax = Math.min( this.xMax, point.x);
        //K }
        //K if (this.yMin === undefined) {
            //K this.yMin = point.y;
        //K } else {
            //K this.yMin = Math.min( this.yMin, point.y);
        //K }
        //K if (this.yMax === undefined) {
            //K this.yMax = point.y;
        //K } else {
            //K this.yMax = Math.min( this.yMax, point.y);
        //K }
    //K }
//K 
    //K return;
//K 
//K };

//IKRS.BoundingBox3.prototype = new IKRS.Object();
IKRS.BoundingBox3.prototype.constructor = IKRS.BoundingBox3;

function verify (position, box, xmin, xmax, ymin, ymax) {
    if (box.xMin === xmin &&
        box.xMax === xmax &&
        box.yMin === ymin &&
        box.yMax === ymax) {
         console.log( "Test Position " + position + " passed")
    } else {
         console.log( "***Test Position " + position + " failed***")
    }
}

function test () {
    var boundingBox = new IKRS.BoundingBox3();
    verify (1, boundingBox);

    boundingBox.evaluatePoint(2,1);
    verify (2, boundingBox, 2, 2, 1, 1);

    boundingBox.evaluatePoint(3,2);
    verify (3, boundingBox, 2, 3, 1, 2);

    boundingBox.evaluatePoint({x:4,y:3});
    verify (4, boundingBox, 2, 4, 1, 3);

    boundingBox.evaluatePoint([{x:-4,y:-3}]);
    verify (5, boundingBox, -4, 4, -3, 3);

    boundingBox.evaluatePoint([[-2,-1],[-5,-3],[4,-5],[-4,4]]); // this fails and rightly so
    verify (6, boundingBox, -5, 4, 5, 4);

    boundingBox.evaluatePoint([{x:-2,y:-1},{x:-5,y:-3},{x:4,y:-5},{x:-4,y:4}]);
    verify (7, boundingBox, -5, 4, -5, 4);
    //console.log( "boundingBox: %o", boundingBox)

    var boxBound = new IKRS.BoundingBox3();
    boxBound.evaluatePoint(-6,-6);
    boxBound.evaluatePoint(5, 5);
    verify (8, boxBound, -6, 5, -6, 5);

    boundingBox.evaluatePoint(boxBound);
    verify (9, boxBound, -6, 5, -6, 5);
}

//test(); //uncomment to run function to test the evaluatePoint functions
