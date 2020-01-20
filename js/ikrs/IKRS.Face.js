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

IKRS.Face.prototype.getVertice = function(tile) {
    var angle = tile.angle + this.offsetAngle
//oh damn.... the offset angle must have to change for every vertex!, we've only be working with face[0]
    var x = tile.position.x + this.radialCoefficient * Math.cos( angle)
    var y = tile.position.y - this.radialCoefficient * Math.sin( angle)
    return new IKRS.Point2( x, y);
}

IKRS.Face.prototype.getMidpoint = function(tile) {
    // find a vertex on the face
    var angle = tile.angle + this.offsetAngle
    var x = tile.position.x + this.radialCoefficient * Math.cos( angle)
    var y = tile.position.y - this.radialCoefficient * Math.sin( angle)

    //find the midpoint of that face
    angle = angle - this.angleToCenter + this.angleToNextVertice
    x = tile.position.x + this.lengthCoefficient/2 * Math.cos( angle)
    y = tile.position.y - this.lengthCoefficient/2 * Math.sin( angle)
    return new IKRS.Point2( x, y);
}


IKRS.Face.prototype.toString = function() {
    return "offsetAngle:"+ offsetAngle +" nextVertex:"+ this.angleToNextVertice +" length:"+ this.lengthCoefficient +" angleTocenter:"+ this.angleToCenter +" radial:" + this.radialCoefficient
}

IKRS.Face.prototype.constructor = IKRS.Face;
