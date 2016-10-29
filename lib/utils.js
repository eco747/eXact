/**
 * check if a variable is a number
 * @param  {any}
 * @return {Boolean}
 */

function isNumber( v ) {
	return (typeof v === 'number');
}

/**
 * test if an object is empty
 * @param  {Object} object to test
 * @return {Boolean}
 */

function isEmpty( obj ) {

	if( !obj ) {
		return true;
	}

    for( var key in obj ){
        return false; 
    }

    return true;
}

/**
 * test if a variable is a String
 * @param  {any} variable to test
 * @return {Boolean}
 */

function isString( a ) {
	return 	!!a && a.constructor===String;
}

/**
 * test if a variable is an Array
 * @param  {any} variable to test
 * @return {Boolean}
 */

function isArray( a ) {
	return 	!!a && a.constructor===Array;
}

/**
 * test if a variable is an object
 * @param  {any} variable to test
 * @return {Boolean}
 */

function isObject( a ) {
	return 	!!a && a.constructor===Object;
}

/**
 * taken from github tdukart/kebabCase.js
 * @param  {String} text to kebabeize
 * @return {String}
 */

const 	kebab_re = /([a-z][A-Z])/g;
const 	kebab2_re = /[^-a-z0-9]+/g;

function kebabCase(string) {
	
	var result = string;

	// Convert camelCase capitals to kebab-case.
	result = result.replace( kebab_re, function(match) {
		return match.substr(0, 1) + '-' + match.substr(1, 1).toLowerCase();
	});

	// Convert non-camelCase capitals to lowercase.
	result = result.toLowerCase();

	// Convert non-alphanumeric characters to hyphens
	result = result.replace( kebab2_re, '-');

	// Remove hyphens from both ends
	result = result.replace(/^-+/, '').replace(/-$/, '');

  	return result;
}

/**
 * call a function a soon as possible
 * @param {Function} function to call
 * @param {Object} scope scope of the function or null
 * @param {arguments} arguments to push on the call
 */

let 	_asaps	= null;
let 	_reqAF 	= window.requestAnimationFrame ? window.requestAnimationFrame : function(fn) {setTimeout(fn,0);};

function asap( fn, scope, ...args ) {

	if( !_asaps ) {

		_asaps = [];

		_reqAF( function() {
			var t  = _asaps;
			_asaps = null;

			for( let i=0; i<t.length; i++ ) {
				t[i]( );
			}
		});
	}

	_asaps.unshift( fn.bind(scope, ...args ) );
}
