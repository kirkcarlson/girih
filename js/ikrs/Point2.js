/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @version 1.0.0
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/


class Point2 {
    constructor ( x, y ) {
        this._x = x;
        this._y = y;
    }

    get x () {
        return this._x;
    }

    set x (x) {
        this._x = x;
    }

    get y () {
        return this._y;
    }

    set y (y) {
        this._y = y;
    }

    /**
     * Many objects that use points and have a 'translate' function instead
     * of 'add'.
     **/
    /*
    Point2.prototype.translate = function( amount ) {
        return this.add( amount );
    };
    */

    add( amount ) {
        this.x += amount.x;
        this.y += amount.y;
        return this;  // For operator concatenation
    };

    addXY( x, y ) {
        this.x += x;
        this.y += y;
        return this;
    };

    sub( amount ) {
        this.x -= amount.x;
        this.y -= amount.y;
        return this;  // For operator concatenation
    };

    set( position ) {
        this.x = position.x;
        this.y = position.y;
        return this;  // For operator concatenation
    };

    setXY( x, y ) {
        this.x = x;
        this.y = y;
    };

    invert() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    };

    difference( point ) {
        return new Point2( point.x - this.x, point.y - this.y );
    }

    // Is this correct?
    dotProduct( point ) {
        return (this.x * point.x + this.y * point.y);
    };


    inRange( point,
                                              tolerance
                                            ) {
        return this.distanceTo(point) <= tolerance;
    };

    equals( point, epsilon ) {
        if( epsilon === undefined )
            epsilon = EPSILON;
        return this.distanceTo(point) <= epsilon;
    };

    length() {
        return Math.sqrt( Math.pow(this.x,2) + Math.pow(this.y,2) );
    };

    distanceTo( point ) {
        return Math.sqrt( Math.pow(this.x-point.x,2) + Math.pow(this.y-point.y,2) );
    };

    multiplyScalar( s ) {
        this.x *= s;
        this.y *= s;
        return this;  // For operator concatenation
    }

    /**
     * The scaling destination must be any point and the scaling amount
     * any floating number, usually in [0 ... 1].
     *
     * Imagine a line between this and the destination point.
     * Then the returned point is located at sclaingAmount*100 per cent
     * along this line.
     **/
    scaleTowards( scalingDestination,
                  scalingAmount
                ) {
        return this.difference( scalingDestination ).multiplyScalar( scalingAmount ).add( this );
    }

    clone() {
        return new Point2( this.x, this.y );
    }

    rotate( origin,
            theta
          ) {

        // Thanks to
        // http://stackoverflow.com/questions/786472/rotate-a-point-by-an-angle
        //  p'x = cos(theta) * (px-ox) - sin(theta) * (py-oy) + ox
        //  p'y = sin(theta) * (px-ox) + cos(theta) * (py-oy) + oy
        var cosT = Math.cos(theta);
        var sinT = Math.sin(theta);
        var dX   = this.x - origin.x;
        var dY   = this.y - origin.y;

        this.x = cosT * dX - sinT * dY + origin.x;
        this.y = sinT * dX + cosT * dY + origin.y;

        return this;  // For operator concatenation
    }

    toString() {
        return "(" + Girih.round( this.x, girihCanvasHandler.SVG_PRECISION)  + ", " +
                     Girih.round( this.y, girihCanvasHandler.SVG_PRECISION)  + ")";
    }
};

ZERO_POINT = new Point2( 0, 0 );
