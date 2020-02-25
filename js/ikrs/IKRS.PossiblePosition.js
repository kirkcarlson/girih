/* This reimagines the coordiate system for the Girih to be based on vertices rather than centers

all polygons are stroked and vertices numbered clockwise
starting positions to the left are assumed to move to the right before begining
the vertice at the start is just that

It looks like we can assume that the right vertice is on less than the left vertice...
This eliminates half of the entries

this just seems so much simpler...
*/

IKRS.PossiblePosition = function ( tileType, startVertex, isLeftJustified) {

    IKRS.Object.call( this );

    this.tileType = tileType;
    this.startVertex = startVertex;
    this.isLeftJustified = isLeftJustified;
};


possiblePositions = []
//                                              tileType,           vertex number, matesWithLeftVertex
                                                                               // is this a face# or number of piTenths
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_DECAGON,         0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_PENTAGON,        0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON,   2, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON,   3, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_GIRIH_HEXAGON,   4, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_BOW_TIE,         3, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_BOW_TIE,         2, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_BOW_TIE,         1, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_RHOMBUS,         0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_RHOMBUS,         1, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, 0, true));
possiblePositions.push ( new IKRS.PossiblePosition ( IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS, 1, true));
//***end of possiblePositions***

IKRS.PossiblePosition.prototype.constructor = IKRS.PossiblePosition;
