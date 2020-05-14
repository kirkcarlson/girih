
/**
 * @author Ikaros Kappler
 * @date 2013-08-22
 * @version 1.0.0
 * @date 2020-02-11 Kirk Carlson (allowed initialization with undefined)
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/

class BoundingBox2 {
    constructor ( ) {
        if( arguments.length === 0) {
            this._xMin = undefined;
            this._xMax = undefined;
            this._yMin = undefined;
            this._yMax = undefined;

        } else if( arguments.length === 1) { // assume point or array of points
            if (Array.isArray( arguments[0])) {
                this._xMin = arguments[0][0].x;
                this._xMax = arguments[0][0].x;
                this._yMin = arguments[0][0].y;
                this._yMax = arguments[0][0].y;
                for (var i=1; i<arguments[0].length; i++) {
                    this._xMin = Math.min( this.xMin, arguments[0][i].x);
                    this._xMax = Math.max( this.xMax, arguments[0][i].x);
                    this._yMin = Math.min( this.yMin, arguments[0][i].y);
                    this._yMax = Math.max( this.yMax, arguments[0][i].y);
                }

            } else { // assume just a point
                this._xMin = arguments[0].x;
                this._xMax = arguments[0].x;
                this._yMin = arguments[0].y;
                this._yMax = arguments[0].y;
            }
        } else if( arguments.length === 2) { // assume x, y pair
            this._xMin = arguments[0];
            this._xMax = arguments[0];
            this._yMin = arguments[1];
            this._yMax = arguments[1];
        } else if( arguments.length === 4) { // assume xMin, xMax, yMin, yMax
            this._xMin = arguments[0];
            this._xMax = arguments[1];
            this._yMin = arguments[2];
            this._yMax = arguments[3];
        } else {
            console.trace( "BoundingBox2 not given 0, 1, 2, or 4 arguments");
            throw "BoundingBox2 not given 0, 1, or 2 arguments"
        }
    }

    get xMax() {
        return this._xMax;
    }

    get xMin() {
        return this._xMin;
    }

    get yMax() {
        return this._yMax;
    }

    get yMin() {
        return this._yMin;
    }

    get width() {
        return this._xMax - this._xMin;
    }

    get height() {
        return this._yMax - this._yMin;
    }

    get leftUpperPoint() {
        return new Point2( this._xMin, this._yMin );
    }

    get rightUpperPoint() {
        return new Point2( this._xMax, this._yMin );
    }

    get rightLowerPoint() {
        return new Point2( this._xMax, this._yMax );
    }

    get leftLowerPoint() {
        return new Point2( this._xMin, this._yMax );
    }

    get centerPoint() {
        return new Point2( (this._xMin + this.xMax)/2.0,
                                (this._yMin + this.yMax)/2.0
                              );
    }

    get diagonalLength() {
        return this.leftUpperPoint.distanceTo( this.rightLowerPoint );
    }

    get boundingTriangle() {

        // Aim: construct a triangle that conains this box in an acceptable
        //      way.
        // 'Acceptable' means, the whole box MUST be contained, the
        // triangle might be larger, but it should _not_ be too large!

        // Idea: first compute the diagonal of this box; it gives us an impression
        //       of the average size.
        var diagonal    = this.diagonalLength();

        // Use the bottom line of the box, but make it diagonal*2 long.
        var centerPoint = this.centerPoint();
        var leftPoint   = new Point2( centerPoint.x - diagonal,
                                       this.yMax
                                         );
        var rightPoint  = new Point2( centerPoint.x + diagonal,
                                           this.yMax
                                         );

        // Now make two linear interpolation lines from these points (they are left
        // and right outside of the box) to the upper both left respecive right
        // box points.
        var leftLine    = new Line2( leftPoint,  this.leftUpperPoint() );
        var rightLine   = new Line2( rightPoint, this.rightUpperPoint() );


        // Where these lines meet is the top point of the triangle ;)

        return new IKRS.Triangle( leftPoint,
                                  leftLine.computeLineIntersection( rightLine ),  // the top point
                                  rightPoint
                                );
    }

    clone( ) {
        return new BoundingBox2( this._xMin, this._xMax, this._yMin, this._yMax);
    }

    /**
     * This function computes the 'super-boundingbox' of this box
     * and the passed box.
     *
     * This will work with undefined values in either box
     **/
    computeUnion( bounds ) {
        var boundingBox = this.clone();
        boundingBox.updateBox( bounds);
        return boundingBox;
    }


    updateXY( x, y) {
        if (x !== undefined) {
            if (this._xMin !== undefined) {
                if (x < this._xMin) this._xMin = x
            } else {
                this._xMin = x;
            }
            if (this._xMax !== undefined) {
                if (x > this._xMax) this._xMax = x
            } else {
                this._xMax = x;
            }
        }

        if (y !== undefined) {
            if (this._yMin !== undefined) {
                if (y < this._yMin) this._yMin = y
            } else {
                this._yMin = y;
            }
            if (this._yMax !== undefined) {
                if (y > this._yMax) this._yMax = y
            } else {
                this._yMax = y;
            }
        }
    }


    updatePoint( point) {
        this.updateXY ( point.x, point.y);
    }

    updatePoints( points) {
        for (member in points){
            this.updatePoint( points[ member]);
        }
    }

    updateBox( box) {
        this.updateXY ( box.xMin, box.yMin);
        this.updateXY ( box.xMax, box.yMax);
    }

    toString() {
        return "[IKRS.BoundingBox2]={ xMin=" + this._xMin + ", xMax=" + this._xMax +
               ", yMin=" + this._yMin + ", yMax=" + this._yMax +
               ", width=" + this.width + ", height=" + this.height + " }";
    }

    // A static function
    // was static computeFromPoints( points ) 
    static fromPoints ( points) {
        if( !points )
            points = [];

        if( points.length == 0 )
            return new IKRS.BoundingBox2( undefined, undefined, undefined, undefined );

        var xMin = points[0].x;
        var xMax = points[0].x;
        var yMin = points[0].y;
        var yMax = points[0].y;

        for( var i = 1; i < points.length; i++ ) {
            var point = points[ i ];
            xMin = Math.min( xMin, point.x );
            xMax = Math.max( xMax, point.x );
            yMin = Math.min( yMin, point.y );
            yMax = Math.max( yMax, point.y );

        }

        return new BoundingBox2( xMin, xMax, yMin, yMax );
    }
}
