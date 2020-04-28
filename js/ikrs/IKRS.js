/**
 * @author Ikaros Kappler
 * @date 2013-11-27
 * @version 1.0.0
 **/


var IKRS = IKRS || { CREATOR: "Ikaros Kappler",
		     DATE: "2013-11-27"
		   };

IKRS = function() {
    IKRS.Object.call( this );
}


// round is used to limit the number of digits included in the SVG output
IKRS.round = function( n, digits) {
    // round n to the digits number of digits right of decimal point
    // n is the number to be rounded
    // digits is the number of digits
    if (digits === undefined) {
      digits = 0
    }
    var magnitude = Math.pow( 10, digits)
    return Math.round( n * magnitude) / magnitude
}
