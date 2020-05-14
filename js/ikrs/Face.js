/**
 * @author Kirk Carlson
 * @date 2020-01-17
 * @version 1.0.0
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/

class Face {
    constructor ( centralAngle, angleToNextVertex, lengthCoefficient,
             angleToCenter, radialCoefficient) {

        this._centralAngle = centralAngle;
        this._angleToNextVertex = angleToNextVertex;
        this._lengthCoefficient = lengthCoefficient;
        this._angleToCenter = angleToCenter;
        this._radialCoefficient = radialCoefficient;
    }

    get centralAngle () {
        return this._centralAngle;
    }

    get angleToNextVertex () {
        return this._angleToNextVertex;
    }

    get lengthCoefficient () {
        return this._lengthCoefficient;
    }

    get angleToCenter () {
        return this._angleToCenter;
    }

    get radialCoefficient () {
        return this._radialCoefficient;
    }

    toString () {
        return "centralAngle:"+ this._centralAngle +" nextVertex:"+ this._angleToNextVertex +
               " length:"+ this._lengthCoefficient +" angleToCenter:"+ this._angleToCenter +
               " radial:"+ this._radialCoefficient;
    }
};
