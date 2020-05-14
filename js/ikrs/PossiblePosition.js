/**
 * @author Kirk Carlson
 * @date 2020-02-20
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/


/* This re-imagines the coordiate system for the Girih to be based on angles
rather than integer points for fixed sized polygons.

All polygons are stroked and vertices numbered clockwise.
Edges may be shared with adjacent polygons.
Edge sharing may be right or left justified (doesn't matter to Girih and
other polygon sets where all tiles have the same edge length).
*/

class PossiblePosition {
    constructor( tileType, startVertex, isLeftJustified) {
        this._tileType = tileType;
        this._startVertex = startVertex;
        this._isLeftJustified = isLeftJustified;
    }

    get tileType () {
        return this._tileType;
    }

    get startVertex () {
        return this._startVertex;
    }

    get isLeftJustified () {
        return this._isLeftJustified;
    }

};
