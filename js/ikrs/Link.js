/*
 * A link is the girih strapping between two connectors on a polygon
 *
 * @author Kirk Carlson
 * @date 2020-01-06
 * @version 1.0.0
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/

class Link {
    constructor ( linkPolygon, linkConnector) { // this link moves clockwise within polygon
        // the problem with using polygonIndex is that polygons may be deleted
        // and that would require renumbering all links
        this._polygonIndex = linkPolygon;
        this._connectorIndex = linkConnector;
    }

    get polygonIndex () {
        return this._polygonIndex;
    }

    get connectorIndex () {
        return this._connectorIndex;
    }

    clone = function() {
        return new Link( this._polygonIndex, this._connectorIndex);
    }

    toString = function() {
        return this.polygonIndex + "-" + this.connectorIndex;
    }
};
