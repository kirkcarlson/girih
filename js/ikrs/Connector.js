/**
 * A connector is the midpoint of a polygon face that may connect with another polygon connnector
 *
 * @author Kirk Carlson
 * @date 2020-01-03
 * @version 1.0.0
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/

/*
    each connector has:
        point
        internal mates (determined by point and tileType
        link to external shared connector if found
        chain identifier CW (class)
        chain identifier CCW (class)
        nextCWconnector
        previousCWconnector

*/
class Connector {
    constructor ( index, connectorPoint ) {
        this._connectorIndex = index;
        this._point = connectorPoint; // a Point
        this._sharedConnectorLink = undefined; // a Link to shared connector
        this._CWchainID = undefined; //clockwise
        this._CCWchainID = undefined; //counter clockwise
    }

    get connectorIndex () {
        return this._connectorIndex;
    }

    get point () {
        return this._point;
    }

    get sharedConnectorLink () {
        if (this._sharedConnectorLink === undefined) {
            return undefined;
        } else {
            return this._sharedConnectorLink.clone();
        }
    }

    set sharedConnectorLink ( link) {
        this._sharedConnectorLink = link;
    }

    isShared() {
        return this._sharedConnectorLink !== undefined;
    }

    get point () {
        return this._point.clone();
    }

    get CWchainID () {
        return this._CWchainID;
    }

    get CCWchainID () {
        return this._CCWchainID;
    }

    setChainID( CW, id) {
        if (CW) {
            this._CWchainID = id
        } else {
            this._CCWchainID = id
        }
    }

    getChainID( CW) {
        if (CW) {
            return this._CWchainID
        } else {
            return this._CCWchainID
        }
    }

    isOnChain( CW) {
        if (CW) {
            return this.CWchainID !== undefined;
        } else { //CCW
            return this.CCWchainID !== undefined;
        }
    }

    getInternalLink ( CW, polygonType) {
        // returns the connectorIndex of the other end of an internal link
        var index;
        switch (polygonType) {
        case Girih.TILE_TYPE.DECAGON:
            if (CW) {
                index = (this._connectorIndex + 2) % 10
            } else {
                index = (this._connectorIndex - 2 + 10) % 10
            }
            break;
        case Girih.TILE_TYPE.IRREGULAR_HEXAGON:
            if (CW) {
                index = (this._connectorIndex + 1) % 6
            } else {
                index = (this._connectorIndex - 1 + 6) % 6
            }
            break;
        case Girih.TILE_TYPE.PENTAGON:
            if (CW) {
                index = (this._connectorIndex + 1) % 5
            } else {
                index = (this._connectorIndex - 1 + 5) % 5
            }
            break;
        case Girih.TILE_TYPE.RHOMBUS:
            if (CW) {
                index = (this._connectorIndex + 1) % 4
            } else {
                index = (this._connectorIndex - 1 + 4) % 4
            }
            break;
        case Girih.TILE_TYPE.PENROSE_RHOMBUS:
            if (CW) {
                index = (this._connectorIndex + 1) % 4
            } else {
                index = (this._connectorIndex - 1 + 4) % 4
            }
            break;
        case Girih.TILE_TYPE.BOW_TIE:
            switch (this._connectorIndex) {
            case 0:
                if (CW) {
                    index = 1;
                } else {
                    index = 2;
                }
                break;
            case 1:
                if (CW) {
                    index = 2;
                } else {
                    index = 0;
                }
                break;
            case 2:
                if (CW) {
                    index = 0;
                } else {
                    index = 1;
                }
                break;
            case 3:
                if (CW) {
                    index = 4;
                } else {
                    index = 5
                }
                break;
            case 4:
                if (CW) {
                    index = 5;
                } else {
                    index = 3;
                }
                break;
            case 5:
                if (CW) {
                    index = 3;
                } else {
                    index = 4;
                }
                break;
            default:
                index = 0;
                break;
            }
            break;
        default:
            index = 0;
            break;
        }
        return index
    }

    headLink ( CW, tileType) {
        // returns the index of the connector within current tile for the
        // head end in the specified direction
        if ( CW) { // need the CCW link
            return this.getInternalLink(!CW, tileType)
        } else { // since this is CWW, the head is really the tail
            return this._connectorIndex
        }
    }

    toString () {
        return "connectorIndex:"+ this.connectorIndex +
               " point:"+ IKRS.round(this.point.x, IKRS.Girih.SVG_PRECISION) + ", "+
                          IKRS.round(this.point.y, IKRS.Girih.SVG_PRECISION) +
               " CW chain:"+ this.CWchainID +
               " CCW chain:"+ this.CCWchainID
    }
};
