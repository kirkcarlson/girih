/**
 * @author Kirk Carlson
 * @date 2020-01-17
 * @version 1.0.0
 **/

IKRS.Face = function ( centralAngle, angleToNextVertex, lengthCoefficient,
        angleToCenter, radialCoefficient) {

    IKRS.Object.call( this );

    this.centralAngle = centralAngle;
    this.angleToNextVertex = angleToNextVertex;
    this.lengthCoefficient = lengthCoefficient;
    this.angleToCenter = angleToCenter;
    this.radialCoefficient = radialCoefficient;
};

IKRS.Face.prototype.getVertice = function(tile) {
    var angle = tile.angle + this.centralAngle
//oh damn.... the offset angle must have to change for every vertex!, we've only be working with face[0]
    var x = tile.position.x + this.radialCoefficient * Math.cos( angle)
    var y = tile.position.y - this.radialCoefficient * Math.sin( angle)
    return new IKRS.Point2( x, y);
}

IKRS.Face.prototype.getMidpoint = function(tile) {
    // find a vertex on the face
    var angle = tile.angle + this.centralAngle
    var x = tile.position.x + this.radialCoefficient * Math.cos( angle)
    var y = tile.position.y - this.radialCoefficient * Math.sin( angle)

    //find the midpoint of that face
    angle = angle - this.angleToCenter + this.angleToNextVertice
    x = tile.position.x + this.lengthCoefficient/2 * Math.cos( angle)
    y = tile.position.y - this.lengthCoefficient/2 * Math.sin( angle)
    return new IKRS.Point2( x, y);
}


IKRS.Face.prototype.toString = function() {
    return "centralAngle:"+ this.centralAngle +" nextVertex:"+ this.angleToNextVertex +
           " length:"+ this.lengthCoefficient +" angleToCenter:"+ this.angleToCenter +
           " radial:"+ this.radialCoefficient;
}

IKRS.Face.prototype.constructor = IKRS.Face;
