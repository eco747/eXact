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
 * test if a variable is a function
 * @param  {any} variable to test
 * @return {Boolean}
 */

function isFunction( a ) {
	return 	!!a && a.constructor===Function;	
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
 *
 */

 const  camel_re = /^([A-Z])|\s(\w)/g;

 camelCase = function( string, upper_first=false ) {
    var rc = string.replace( camel_re, function(match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();        
    });

    if( upper_first ) {
    	rc = rc.substr(0,1).toUpperCase() + rc.substr(1);
    }

    return rc;
};


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
				let e = t[i];
				e.fn.apply( e.scope, e.args );
			}
		});
	}

	for( let i=0; i<_asaps.length; i++ ) {
		if( _asaps[i].fn == fn ) {
			return;
		}
	}

	_asaps.unshift( {fn, scope, args } );
}

/**
 * dummy empty function
 */

function emptyFn( ) {
}


/**
 * compute scrollbar size 
 * care: need DOM
 * @param {Boolean} recalc force recomputation
 */

let 	__scrollbar_size = 0;
function getScrollbarSize( recalc ) {
  
  	if( !__scrollbar_size || recalc) {
	
	    var scrollDiv = document.createElement('div');

		scrollDiv.style.position = 'absolute';
		scrollDiv.style.top = '-9999px';
		scrollDiv.style.width = '50px';
		scrollDiv.style.height = '50px';
		scrollDiv.style.overflow = 'scroll';

		document.body.appendChild(scrollDiv);
	    
	    __scrollbar_size = scrollDiv.offsetWidth - scrollDiv.clientWidth;
	    document.body.removeChild(scrollDiv);
	}

	return __scrollbar_size;
}

/**
 * deep compare objects
 * @param  {Object} objA 
 * @param  {Object} objB 
 * @return {Boolean}      
 */

function shallowEqual(objA, objB) {
    if (objA === objB) {
        return true
    }

    if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
        return false
    }

    var keysA = Object.keys(objA)
    var keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) {
        return false
    }

    // Test for A's keys different from B.
    for (var i = 0; i < keysA.length; i++) {
        if (!objB.hasOwnProperty(keysA[i]) || objA[keysA[i]] !== objB[keysA[i]]) {
            return false
        }
    }

    return true
}

/**
 * 
 */

function cloneObject( obj ) {
	return Object.assign( {}, obj );
}


/**
 * 	class creation
 */

function bindContext(obj, source) {
	for (let key in source) {
		if (key!='extend' && source.hasOwnProperty(key)) {
			if (isFunction(source[key])) {
				obj[key] = source[key].bind(obj);
			}
		}
	}
}

function mergeProto(proto, mixin) {
	for (let key in mixin) {
		if ( key!='extend' && !mixin.hasOwnProperty(key)) {
			continue
		}

		proto[key] = mixin[key];
	}
}

function code_gen( ) {

	this.code = [];

	this.add = function( ) {
		
		for( var i in arguments ) {
			var c = arguments[i];

			if( isString(c) ) {
				console.log( c );
				this.code.push(c);
			}
			else if( isArray(c) ) {
				this.add( c );
			}
		}
	}

	this.debug = function( ) {
		this.add( 'debugger;' );
	};

	this.gen = function( ) {
		return this.code.join('\n');
	}
}

function createClass( name, spec ) {

	let extend = spec.extend || null;

	let cg = new code_gen( );

	cg.add( 'function '+name+'( ) {' );
	if( extend ) {
		cg.add( '	'+extend.name+'.call(this, arguments)' );
	}

	cg.add( '	this.constructor = '+name+';');
	cg.add( '	bindContext( this, '+name+'.prototype );' );
	
	cg.add( '}' );
	cg.add( 'var klass = '+name+";" );
		

debugger;
	var t = cg.gen()
	eval( t );

	let Facade = function() {}
	Facade.prototype = extend ? extend.prototype : Object.prototype;
	
	klass.prototype = new Facade( );
	mergeProto( klass.prototype, spec );

	klass.name = name;

	if( spec.export===undefined ) {
		spec.export = window;
	}

	if( spec.export ) {
		spec.export[name] = klass;
	}
	
	return klass
}



