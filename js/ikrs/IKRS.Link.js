/*
 * A link is the girih strapping between two connectors on a polygon
 *
 * @author Kirk Carlson
 * @date 2020-01-06
 * @version 1.0.0
 **/

IKRS.Link = function ( linkPolygon, linkConnector) { // this link moves clockwise within polygon
// problem with using polygonIndex is that polygons may be deleted and that would require renumbering all links

    IKRS.Object.call( this );

    this.polygonIndex = linkPolygon;
    this.connectorIndex = linkConnector;
};


IKRS.Link.prototype.set = function( linkPolygon, linkConnector ) {
    this.polygonIndex = linkPolygon;
    this.connectorIndex = linkConnector;
    return this;  // For operator concatenation
};

IKRS.Link.prototype.isEqual = function(  linkPolygon, linkConnector ) {
    return (this.polygonIndex === linkPolygon && this.connectorIndex === linkConnector);
};

IKRS.Link.prototype.toString = function() {
    return this.polygonIndex + "," + this.connectorIndex;
};

IKRS.Link.prototype.constructor = IKRS.Link;
