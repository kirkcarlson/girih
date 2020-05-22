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
        this._x += amount.x;
        this._y += amount.y;
        return this;  // For operator concatenation
    };

    addXY( x, y ) {
        this._x += x;
        this._y += y;
        return this;
    };

    sub( amount ) {
        this._x -= amount.x;
        this._y -= amount.y;
        return this;  // For operator concatenation
    };

    set( position ) {
        this._x = position.x;
        this._y = position.y;
        return this;  // For operator concatenation
    };

    setXY( x, y ) {
        this._x = x;
        this._y = y;
    };

    invert() {
        this._x = -this._x;
        this._y = -this._y;
        return this;
    };

    difference( point ) {
        return new Point2( point.x - this._x, point.y - this._y );
    }

    // Is this correct?
    dotProduct( point ) {
        return (this._x * point.x + this._y * point.y);
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
        return Math.sqrt( Math.pow(this._x,2) + Math.pow(this._y,2) );
    };

    distanceTo( point ) {
        return Math.sqrt( Math.pow(this._x-point.x,2) + Math.pow(this._y-point.y,2) );
    };

    multiplyScalar( s ) {
        this._x *= s;
        this._y *= s;
        return this;  // For operator concatenation
    }

    divideScalar( s ) {
        this._x /= s;
        this._y /= s;
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
        return new Point2( this._x, this._y );
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
        var dX   = this._x - origin.x;
        var dY   = this._y - origin.y;

        this._x = cosT * dX - sinT * dY + origin.x;
        this._y = sinT * dX + cosT * dY + origin.y;

        return this;  // For operator concatenation
    }

    toString() {
        return "(" + Girih.round( this._x, girihCanvasHandler.SVG_PRECISION)  + ", " +
                     Girih.round( this._y, girihCanvasHandler.SVG_PRECISION)  + ")";
    }
};

ZERO_POINT = new Point2( 0, 0 );
