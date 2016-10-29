

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
function asap( fn, scope, ...args ) {

	if( !_asaps ) {

		_asaps = [];

		requestAnimationFrame( function() {
			var t  = _asaps;
			_asaps = null;

			for( let i=0; i<t.length; i++ ) {
				t[i]( );
			}
		});
	}

	_asaps.unshift( fn.bind(scope, ...args ) );
}


const 	skipped_attrs = ['tag', 'cls','items','content'];

/**
 * Base Component Object
 */

class  Component extends React.Component
{
	constructor( ) {

		super( );

		this.clsName	= 'x-' + kebabCase(this.constructor.name);
		this.change_id 	= 0;
		this.data 		= {};
				
		this._proxy 	= this._selfWatch( );
		return this._proxy;
	}

	/**
	 * Emit the Json object definition in the Vue format
	 * @param  {Object} JSon definition
	 * @return {Object} Vue object
	 */
	
	emit( desc, lvl=0 ) {
		
		if( !desc ) {
			return null;
		}

		var props = {},
			items = [],
			i, t, tag;

		// first: the tag
		tag	= desc.tag || 'div';

		// get class, by default, the Object class name is added (only for the main element (not childen) 
		if( lvl==0 ) {

			props.className = this.clsName;

			if( desc.cls) {
				props.className += ' ' + desc.cls;
			}
		}
		else {
			if( desc.cls ) {
				props.className = desc.cls;
			}
		}

		// copy attributes but the one that need to be patched
		props.attrs = [];
		
		for( i in desc ) {
			if( !desc.hasOwnProperty(i) ) {
				continue;
			}

			if( skipped_attrs.indexOf(i)>=0 ) {
				continue;
			}

			props[i] = desc[i];
		}

		//	prepare sub elements
		t = desc.items;
		if( t ) {

			//	direct string ?
			//		content equivalent
			if( isString(t) ) {
				items.push( t );
			}
			else {
				// direct child ? 
				// 		(avoid [{...}])
				if( !isArray(t) ) {
					t = [t];
				}

				for( i in t ) {
					if( t[i] instanceof Component ) {
						items.push( React.createElement( t[i] ) );
					}
					else if( isObject(t[i]) ) {
						items.push( this.emit(t[i],lvl+1) );
					}
					else {
						items.push(	t[i] );
					}
				}
			}
		}
		//	or direct content (always text)
		else if( desc.content && isString(desc.content) ) {
			items.push( desc.content );
		}

		//	for the main element, we add events handlers
		if( lvl==0 && this.evts ) {
			for( i in this.evts ) {
				props[i] = this.evts[i];
			}
		}

		return React.createElement( tag, props, items );
	}

	/**
	 * called by react to render the object
	 */
	
	render( ) {
		return this.emit( this.onRender.call( this._proxy ) );
	}

	/**
	 * 	create the object to a specified element
	 */
	
	static renderTo( el ) {

		React.render(
			React.createElement( this ),
		  	isString(el) ? document.getElementById(el) : el
		);
	}

	/**
	 * auto watch myself 
	 * if you try to change or get a value not in this object
	 * try to find in in the data object.
	 * if data itself is changed, re-watch data, then fire an update
	 * __self__ is added as (virtual) property to get the real *this*
	 */
	
	_selfWatch( target ) {

		let self = this;
		return new Proxy( this, {

			get: function( me, name ) {

				if( name==='__self__' ) {
					return self;
				}

				if( name in me ) {
					return me[name];
				}

				if( name in me.data ) {
					return me.data[name];
				}
			},
		
			set: function( me, name, value ) {

				if( name in me ) {
					me[name] = value;

					if( name=='data' ) {
						self._watchDatas( );
					}
				}
				else if( name in me.data ) {
					me.data[name] = value;
					self._postRender( );
				}
				else {
					me[name] = value;
				}

				return true;
			}
		});

	}

	/**
	 * watch the 'data' object for any change
	 * in case of change, fire a refresh
	 * disallow data structure modification
	 */
	
	_watchDatas( ) {

		let self = this;
		let data = new Proxy( this.data, {
			
			get: function( me, name ) {
				if( me[name] ) {
					return me[name];
				}
			},
		
			set: function( me, name, value ) {
				if( !me.hasOwnProperty(name) ) {
					return false;
				}

				me[name] = value;
				self._postRender( );
				return true;
			}
		});

		this.data = data;
	}

	/**
	 * fire a refresh on the object
	 */
	
	_postRender( ) {
		if( this.isMounted() ) {
			console.log( 'refresh' );
			this.setState( {c:this.change_id++} );
		}
	}

	
}

