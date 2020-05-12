/* the indent class is used to control the indentation of pretty printing */

class Indent {
    constructor( spacing, eol) {
        // example (new Indent( "    ", "\n");
        this._spacing = spacing;
        this._current = "";
        this._eol = eol
    }

    get now () {
       return this._current;
    }

    set now ( spacing) {
        this._current = spacing;
    }

    get spacing () {
       return this._spacing;
    }

    set spacing ( spacing) {
        this._spacing = spacing;
    }

    get eol () {
       return this._eol;
    }

    set eol ( eol) {
        this._eol = eol;
    }

    clear() {
        this._current = "";
    }

    inc() {
        this._current += this._spacing;
    }

    dec() {
        this._current = this._current.slice( this._spacing.length);
    }
};
