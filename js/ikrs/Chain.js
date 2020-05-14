/*
 * A chain is a set of connected girih strapping segments
 *
 * @author Kirk Carlson
 * @date 2020-01-02
 * @version 1.0.0
 * @date 2020-05-11 Kirk Carlson (changed to ECMA6 class)
 **/

class Chain {
    constructor ( id, classStr) {
        this._chainID = id // number, index into chains[]
        this._links = [] // array of link
        this._isLoop = false;
    }

    get chainID () {
        return _chainID;
    }

    set links (links) {
        this._links = links;
    }

    get links () {
        return this._links;
    }

    set isLoop (isLoop) {
        this._isLoop = isLoop;
    }

    get isLoop () {
        return this._isLoop;
    }

    addLink ( link) {
        this.links.push( link)
    }

    markLoop () {
        this.isLoop = true;
    }

    unmarkLoop () {
        this.isLoop = false;
    }


    toString () {
        var chainStr = "Chain " + this.chainID +"("+ this.links.length +" links)"
        if (this.isLoop) {
            chainStr += " looping";
        }
        chainStr += " [";
        var preamble = "";
        for (var i=0; i< this.links.length; i++) {
            chainStr += preamble + this.links[ i].polygonIndex +"-"+ this.links[ i].connectorIndex;
            preamble = ", ";
        }
        return chainStr + "]";
    }
};
