(function($$) {

	const 	skipped_attrs = {
		'tag': true,
		'cls': true,
		'items': true,
		'content': true
	};

	const 	event_map = {
		beforeMount: 	'componentWillMount',
		afterMount:  	'componentDidMount',
		beforeUnmount:  'componentWillUnmount',
		afterUnmount: 	'componentDidUnmount',
		beforeUpdate: 	'componentWillUpdate',
		afterUpdate: 	'componentDidUpdate',
	};


	/**
	 * Base Component Object
	 */

	class  Component 
	{
		constructor( ) {
			this._ 			= new React.Component( );
			this._.__debug 	= this.constructor.name;				
			this._.render 	= ( ) => {return this._render( );};

			this._clsName	= 'x-' + kebabCase(this.constructor.name);

			this._data 		= null;		// real data
			this._watched 	= null;		// generated properties
		}

		/**
		 * Emit the Json object definition in the React format
		 * @param  {Object} JSon definition
		 * @return {Object} Vue object
		 */
		
		emit( desc, lvl=0 ) {
			
			if( !desc ) {
				return null;
			}

			var props = {},
				items = [],
				cls   = lvl==0 ? this._clsName : '',
				i, t, tag;

			// first: the tag
			tag	= desc.tag || 'div';

			// next class name
			// 	by default, the Object class name is added (only for the main element (not childen) 
			// 	ie. if your class is MyClass, the class x-my-class will be set
			if( desc.cls) {
				cls += ' ' + desc.cls;
			}
			
			props.className = cls;

			// next attributes
			// 	copy all but the one that need to be processed
			props.attrs = [];
			
			for( i in desc ) {
				if( !desc.hasOwnProperty(i) ||
					skipped_attrs[i] ) {
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
							items.push( React.createElement( t[i]._ ) );
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
			if( lvl==0 && this.events ) {
				t = this.events;
				for( i in t ) {
					props[i] = t[i].bind(this);
				}
			}

			return React.createElement( tag, props, items );
		}

		/**
		 * life cycle notifications
		 * accept 
		 * {
		 *  	[beforeMount,afterMount,beforeUnmount,afterUnmount,beforeUpdate,afterUpdate] : function
		 * }
		 */

		on( events ) {

			for( let i in events ) {
			
				let n = event_map[i];
				if( n ) {
					this._[n] = events[i].bind( this );
				}
			}
		}

		/**
		 * 
		 */
		
		setDataModel( model ) {
			
			// remove old generated properties
			if( this._data ) {
				
				let watched = Object.keys( this._watched ),
					p;

				for( p in watched ) {
					if( !model.hasOwnProperty(p) ) {
						delete this[p];
						delete this._watched[p];
					}
				}
			}

			this._data = model;
			this._genProperties( );
			this._dataChanged( );
		}

		Refresh( ) {
			this._refresh( );
		}

		/**
		 * 	create the object to a specified element
		 */
		
		static renderTo( el ) {

			let component = new this( );

			React.render(
				React.createElement( component._ ),
			  	isString(el) ? document.getElementById(el) : el
			);
		}

		/**
		 * called by react to render the object
		 * 	we force the proxy to be this
		 */
		
		_render( ) {
			return this.emit( this.onRender.call( this ) );
		}
		
		/**
		 * define all properies of data as direct properties
		 */
		
		_genProperties( target ) {
			
			let data = Object.keys( this._data ),
				me = this, 
				watched = {},
				p;

			for( p in data ) {
				
				let name = data[p];

				// elements starting with an underscore are hidden from other objects
				if( name[0]=='_' ) {
					continue;
				}

				if( this._watched && this._watched[name] ) {
					continue;
				}

				if( this.hasOwnProperty(name) ) {
					console.log( 'property name confict on: ' + name );
				}
				else {	
					Object.defineProperty( this, name, {
						get: function( ) { 
							return me._data[name];
						},
						set: function(value ) {
							me._setDataValue( name, value );
						}
					});

					watched[name] = true;
				}
			}

			this._watched = watched;
		}

		_setDataValue( name, value ) {

			let 	data = this._data;

			if( !data.hasOwnProperty(name) ) {
				throw 'Unknown data property ' + name;
			}

			if( data[name] !== value ) {
				data[name] = value;
				this._dataChanged( );
			}	
		}

		_dataChanged( ) {
			this._refresh( );
		}

		/**
		 * fire a refresh on the object
		 */
		
		_refresh( force ) {
			if( force ) {
				this._.forceUpdate( );
			}
			else {
				this._.setState( this._data );
			}
		}

	}

	$$.Component = Component;

})( window || this );