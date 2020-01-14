/**
 * A connector is the midpoint of a polygon face that may connect with another polygon connnector
 *
 * @author Kirk Carlson
 * @date 2020-01-03
 * @version 1.0.0
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
IKRS.Connector = function( index, connectorPoint ) {
    
    IKRS.Object.call( this );
    
    /*polygonID assumed to be part of the enclosing polygon or tile*/
    /*segmentID assumed to be index of this connector within the polygon or tile*/

    this.connectorIndex = index;
    this.point = connectorPoint;
    this.sharedConnectorLink = undefined; // link to shared connector
    this.CWchainID = undefined;
    this.CCWchainID = undefined;
};

IKRS.Connector.prototype.getInternalLink = function( CW, polygonType) {
    // returns the connectorIndex of the internal link
    var index;
    switch (polygonType) {
    case IKRS.Girih.TILE_TYPE_DECAGON:
	if (CW) {
            index = (this.connectorIndex + 2) % 10
	} else {
            index = (this.connectorIndex - 2 + 10) % 10
	}
        break;
    case IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON:
	if (CW) {
            index = (this.connectorIndex + 1) % 6
	} else {
            index = (this.connectorIndex - 1 + 6) % 6
	}
        break;
    case IKRS.Girih.TILE_TYPE_PENTAGON:
	if (CW) {
            index = (this.connectorIndex + 1) % 5
	} else {
            index = (this.connectorIndex - 1 + 5) % 5
	}
        break;
    case IKRS.Girih.TILE_TYPE_RHOMBUS:
	if (CW) {
            index = (this.connectorIndex + 1) % 4
	} else {
            index = (this.connectorIndex - 1 + 4) % 4
	}
        break;
    case IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS:
	if (CW) {
            index = (this.connectorIndex + 1) % 4
	} else {
            index = (this.connectorIndex - 1 + 4) % 4
	}
        break;
    case IKRS.Girih.TILE_TYPE_BOW_TIE:
        switch (this.connectorIndex) {
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


IKRS.Connector.prototype.isEqual = function( conn) {
    return this.p === conn.p && this.c === conn.c
}

IKRS.Connector.prototype.headLink = function( CW, tileType) {
    // returns the index of the connector within a polygon tile for the current
    // connector as the head end in the specified direction
    if ( CW) { // need the CCW link
	return this.getInternalLink(!CW, tileType)
    } else { // since this is CWW, the head is really the tail
	return this.connectorIndex
    }
}

/* kirk
IKRS.Connector.prototype.getInternalCWLink = function( polygonType) {
    var index;
    switch (polygonType) {
    case IKRS.Girih.TILE_TYPE_DECAGON:
        index = (this.connectorIndex + 2) % 10
        break;
    case IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON:
        index = (this.connectorIndex + 1) % 6
        break;
    case IKRS.Girih.TILE_TYPE_PENTGON:
        index = (this.connectorIndex + 1) % 5
        break;
    case IKRS.Girih.TILE_TYPE_RHOMBUS:
        index = (this.connectorIndex + 1) % 4
        break;
    case IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS:
        index = (this.connectorIndex + 1) % 4
        break;
    case IKRS.Girih.TILE_TYPE_BOW_TIE:
        switch (this.connectorIndex) {
        case 0:
            index = 1;
            break;
        case 1:
            index = 2;
            break;
        case 2:
            index = 0;
            break;
        case 3:
            index = 4;
            break;
        case 4:
            index = 5;
            break;
        case 5:
            index = 3;
            break;
        default:
            index = 0;
            break;
        }
    default:
        index = 0;
        break;
    }
    return index
.connectorID =}


IKRS.Connector.prototype.getInternalCCWLink = function( polygonType) {
    var index;
    switch (polygonType) {
    case IKRS.Girih.TILE_TYPE_DECAGON:
        index = (this.connectorIndex - 2 + 10) % 10
        break;
    case IKRS.Girih.TILE_TYPE_IRREGULAR_HEXAGON:
        index = (this.connectorIndex - 1 + 6) % 6
        break;
    case IKRS.Girih.TILE_TYPE_PENTGON:
        index = (this.connectorIndex - 1 + 5) % 5
        break;
    case IKRS.Girih.TILE_TYPE_RHOMBUS:
        index = (this.connectorIndex - 1 + 4) % 4
        break;
    case IKRS.Girih.TILE_TYPE_PENROSE_RHOMBUS:
        index = (this.connectorIndex - 1 + 4) % 4
        break;
    case IKRS.Girih.TILE_TYPE_BOW_TIE:
        switch (this.connectorIndex) {
        case 0:
            index = 2;
            break;
        case 1:
            index = 0;
            break;
        case 2:
            index = 1;
            break;
        case 3:
            index = 5;
            break;
        case 4:
            index = 3;
            break;
        case 5:
            index = 4;
            break;
        default:
            index = 0;
            break;
        }
    default:
        index = 0;
        break;
    }
    return index
}
*/

IKRS.Connector.prototype.setShared = function( link) {
    this.sharedConnectorLink = link
}

IKRS.Connector.prototype.isShared = function() {
    return this.sharedConnectorLink !== undefined
}

IKRS.Connector.prototype.setChainID= function( CW, id) {
    if (CW) {
        this.CWchainID = id
    } else {
        this.CCWchainID = id
    }
}

/* kirk
IKRS.Connector.prototype.setCCWChainID= function( id) {
    this.CCWchainID = id
}
*/

IKRS.Connector.prototype.isOnChain= function( CW) {
    if (CW) {
	return this.CWchainID !== undefined;
    } else { //CCW
	return this.CCWchainID !== undefined;
    }
}

/* kirk
IKRS.Connector.prototype.setExternalLinkCW= function( polygonID, faceID) {
    this.externalLineCWpolygon = polygonID // normal out
    this.externalLineCWface = faceID // normal out
}
*/

IKRS.Connector.prototype.setPoint= function( pointA) {
    this.point = pointA;
};

IKRS.Connector.prototype.toString= function() {
    return "connectorIndex:"+ this.connectorIndex + " point:"+ IKRS.Girih.round(this.point.x, IKRS.Girih.SVG_PRECISION) + ", "+ IKRS.Girih.round(this.point.y, IKRS.Girih.SVG_PRECISION) + " CW chain:"+ this.CWchainID + " CCW chain:"+ this.CCWchainID
}

IKRS.Connector.prototype.constructor = IKRS.Connector;
