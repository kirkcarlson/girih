/**
 * A pair is just a tuple with two anonymous elements a and b.
 *
 * @author Ikaros Kappler
 * @date 2013-12-17
 * @version 1.0.0
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/

class Pair {
    constructor ( a, b ) {
        this._a = a;
        this._b = b;
    }

    get a () {
        return this._a;
    }

    get b () {
        return this._b;
    }

    clone() {
        return new Pair( this._a, this._b );
    }
}
