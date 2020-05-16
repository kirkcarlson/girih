//export default class Turtle {
class Turtle {
    constructor () {
        this._position = new Point2 (0,0);
        this._angle = 0;
    }

    set position( point) {
        this._position = point;
        return this;
    }

    get position() {
        return this._position.clone();
    }

    set angle( angle) {
        this._angle = angle;
        return this;
    }

    get angle() {
        return this._angle;
    }

    reset () {
        this._position = new Point2 (0,0);
        this._angle = 0;
        return this;
    }

    clone () {
        var turtleClone = new Turtle();
        turtleClone.position = this._position.clone();
        turtleClone.angle = this._angle;
        return turtleClone
    }

    toXY( x, y) {
        this._position.x = x;
        this._position.y = y;
        return this;
    }

    toPoint( position) {
        this._position.x = position.x;
        this._position.y = position.y;
        return this;
    }

    toAD( absoluteAngle, length) {
        this._angle = absoluteAngle;
        this._position.x = this._position.x + length * Math.cos(this._angle)
        this._position.y = this._position.y + length * Math.sin(this._angle)
        return this;
    }

    toaD( relativeAngle, length) {
        this._angle = (this._angle + relativeAngle) % (2* Math.PI);
        this._position.x = this._position.x + length * Math.cos(this._angle)
        this._position.y = this._position.y + length * Math.sin(this._angle)
        return this;
    }

    lineSVG() { // make a mark absolutely
        return "L"+ _round( this._position.x) +" "+ _round( this._position.y);
    }

    moveSVG() { // just move absolutely
        return "M"+ _round( this._position.x) +" "+ _round( this._position.y);
    }
};
