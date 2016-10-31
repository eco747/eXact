(function($$) {

	const 	skipped_attrs = {
		'tag': true,
		'cls': true,
		'items': true,
		'content': true
	};

	/**
	 * Base Component Object
	 */

	class  Component 
	{
		constructor( ) {
			this._ 			= new React.Component( );
			this._.__debug 	= this.constructor.name;				
			
			// setup callbacks
			this._.render 				= ( ) => {return this._render( );}
			this._.componentWillMount   = ( ) => {return this._beforeMount( ); }
			this._.componentDidMount    = ( ) => {return this._afterMount( ); }
			this._.componentWillUnmount = ( ) => {return this._beforeUnmount( ); }
			this._.componentDidUnmount  = ( ) => {return this._afterUnmount( ); }
			this._.componentWillUpdate  = ( ) => {return this._beforeUpdate( ); }
			this._.componentDidUpdate   = ( ) => {return this._afterUpdate( ); }
		
			// generate our component classname
			this._clsName	= 'x-' + kebabCase(this.constructor.name);

			this._events 	= {};
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
			this._events = events;
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
			try {
				return this.emit( this.render() );
			}
			catch( e ) {
				console.log( 'rendering error on object "' + this.constructor.name + '"' );
			}
		}

		_beforeMount( ) {
			if( this._events.beforeMount ) {
				this._events.beforeMount.call( this );
			}
		} 
		
		_afterMount( ) {
			if( this._events.afterMount ) {
				this._events.afterMount.call( this );
			}
		}
		
		_beforeUnmount( ) {
			if( this._events.beforeUnmount ) {
				this._events.beforeUnmount.call( this );
			}
		}
			
		_afterUnmount( ) {
			if( this._events.afterUnmount ) {
				this._events.afterUnmount.call( this );
			}
		} 
		
		_beforeUpdate( ) {
			if( this._events.beforeUpdate ) {
				this._events.beforeUpdate.call( this );
			}
		} 
		
		_afterUpdate( ) {
			if( this._events.afterUpdate ) {
				this._events.afterUpdate.call( this );
			}
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