/**
 * @author Kirk Carlson
 * @date 2020-01-17
 * @version 1.0.0
 **/

IKRS.Face = function ( offsetAngle, angleToNextVertice, lengthCoefficient, angleToCenter, radialCoefficient) {

    IKRS.Object.call( this );

    this.offsetAngle = offsetAngle;
    this.angleToNextVertice = angleToNextVertice;
    this.lengthCoefficient = lengthCoefficient;
    this.angleToCenter = angleToCenter;
    this.radialCoefficient = radialCoefficient;
};

IKRS.Face.prototype.toString = function() {
    return "offsetAngle:"+ offsetAngle +" nextVertex:"+ this.angleToNextVertice +" length:"+ this.lengthCoefficient +" angleTocenter:"+ this.angleToCenter +" radial:" + this.radialCoefficient
}

IKRS.Face.prototype.constructor = IKRS.Face;
