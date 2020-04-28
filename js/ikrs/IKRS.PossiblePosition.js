/**
 * @author Kirk Carlson
 * @date 2020-02-20
 **/


/* This re-imagines the coordiate system for the Girih to be based on angles
rather than integer points for fixed sized polygons.

All polygons are stroked and vertices numbered clockwise.
Edges may be shared with adjacent polygons.
Edge sharing may be right or left justified (doesn't matter to Girih and
other polygon sets where all tiles have the same edge length).
*/

IKRS.PossiblePosition = function ( tileType, startVertex, isLeftJustified) {

    IKRS.Object.call( this );

    this.tileType = tileType;
    this.startVertex = startVertex;
    this.isLeftJustified = isLeftJustified;
};


// the following index definitions are into the possiblePositions array.
IKRS.Girih.INDEX_DECAGON =          0;
IKRS.Girih.INDEX_PENTAGON =         1;
IKRS.Girih.INDEX_GIRIH_HEXAGON =    2;
IKRS.Girih.INDEX_BOW_TIE =          5;
IKRS.Girih.INDEX_RHOMBUS =          8;
IKRS.Girih.INDEX_PENROSE_RHOMBUS = 10;
possiblePositions = []
//                                                   tileType,                             vertex number,
//                                                                                            matesWithLeftVertex
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_DECAGON,         0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_PENTAGON,        0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON,   2, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON,   3, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON,   4, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_BOW_TIE,         2, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_BOW_TIE,         1, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_BOW_TIE,         0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_RHOMBUS,         0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_RHOMBUS,         1, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, 0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, 1, true));
//***end of possiblePositions***

IKRS.PossiblePosition.prototype.constructor = IKRS.PossiblePosition;
