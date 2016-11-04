(function($$) {

	const 	skipped_attrs = {
		'tag': true,
		'cls': true,
		'items': true,
		'content': true,
		'layout': true,
		'flex': true,
		'hidden': true,
	};

	const 	shortcuts = {
		'width': true,
		'height': true,
		'left': true,
		'top': true,
	};


	class 	Event
	{
		constructor( name ) {
			this.name = name;
			this.observers = [];
		}

		add( o ) {
			this.observers.push( o );
		}

		remove( o ) {
			let idx = this.observers.indexOf( o );
			if( idx<0 ) {
				console.log( 'Unknown observer:', o );
			}
			else {
				this.observers.splice( idx, 1 );
			}
		}

		fire( e ) {

			let obs = this.observers.slice( 0 ),
				n = obs.length;

			for( let i=0; i<n; i++ ) {
				obs[i]( e );
			}
		}
	}


	/**
	 * Base Component Object
	 */

	class  Component 
	{
		constructor( cfg ) {

			this._ 			= new React.Component( );
			this._.__debug 	= this.constructor.name;				
									
			// setup react callbacks
			this._.render 				= ( ) => {return this._render( );}
			this._.componentWillMount   = ( ) => {return this._beforeMount( ); }
			this._.componentDidMount    = ( ) => {return this._afterMount( ); }
			this._.componentWillUnmount = ( ) => {return this._beforeUnmount( ); }
			this._.componentDidUnmount  = ( ) => {return this._afterUnmount( ); }
			this._.componentWillUpdate  = ( ) => {return this._beforeUpdate( ); }
			this._.componentDidUpdate   = ( ) => {return this._afterUpdate( ); }
		
			// generate our component classname
			this._clsName	= 'x-' + kebabCase(this.constructor.name);
			this._defStyle 	= this._parseStyle( cfg );
			this._chg_id 	= 1;

			this._data 		= null;		// real data
			this._watched 	= null;		// generated properties
			this._updates 	= {};
			this._events 	= {};
			this._needup 	= false;
		}


		addEvents( events ) {
			if( isString(events) ) {
				events = [events];
			}

			let n = events.length,
				i;

			for( i=0; i<n; i++ ) {
				let name = events[i];

				// already known ?
				if( this._events[name] ) {
					continue;
				}

				this._events[name] = new Event(events[i]);
			}
		}

		fireEvent( name, e ) {
			let ev = this._events[name]
			if( ev ) {
				ev.fire( e );
				return;
			}
			else {
				console.log( 'Unknown event:', name );
			}
		}

		addListener( name, fn ) {
			if( !isString(name) ) {
				debugger;
			}

			let ev = this._events[name];
			if( ev ) {
				ev.add( fn );
				return;
			}
			else {
				console.log( 'Unknown event:', name );
			}
		}

		removeListener( name, fn ) {
			if( !isString(name) ) {
				debugger;
			}

			let ev = this._events[name]
			if( ev ) {
				ev.remove( fn );
				return;
			}
			else {
				console.log( 'Unknown event:', name );
			}
		}

		_findEvent( name ) {

			let evts = this.events;
			for( let i in evts ) {
				if( evts[i].name==name ) {
					return evts[i];
				}
			}	
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
			//props.attrs = [];

			for( i in desc ) {
				if( !desc.hasOwnProperty(i) || skipped_attrs[i] || shortcuts[i] ) {
					continue;
				}

				props[i] = desc[i];
			}

			props.style = this._parseStyle(desc);
			
			if( lvl==0 ) {

				// merge undefined styles from def style
				for( i in this._defStyle ) {
					if( this._defStyle.hasOwnProperty(i) && !props.style.hasOwnProperty(i) ) {
						props.style[i] = this._defStyle[i];
					}
				}
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
						let child = t[i];
						
						if( !child ) {
							continue;
						}
						else if( isString(child) ) {
							items.push(	child );
						}
						else if( child instanceof Component ) {
							items.push( React.createElement( child._ ) );
						}
						else if( typeof child === 'function' ) {
							items.push( React.createElement( child ) );	
						}
						else if( isObject(child) ) {
							items.push( this.emit(child,lvl+1) );
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
					let fn = t[i];
					if( fn ) {
						props[i] = fn.bind(this);
					}
				}
			}

			return React.createElement( tag, props, items );
		}

		/**
		 * 
		 */
		_parseStyle( cfg ) {

			let style = {};
			if( !cfg ) {
				return style;
			}

			// shortcuts
			for( let i in shortcuts ) {
				if( cfg.hasOwnProperty(i) ) {
					style[i] = cfg[i];
				}
			}
			
			// next: layout
			if( cfg.layout ) {

				let layout = cfg.layout;

				if( isString(layout) ) {
					layout = { type: layout };
				}

				switch( cfg.layout ) {
					case 'vertical': {
						style.display = 'flex'; 
						style.flexDirection = 'column';
						break;
					}

					case 'horizontal': {
						style.display = 'flex';
						style.flexDirection = 'row'; 
						break;
					}
				}
			}

			// next specific
			if( cfg.flex ) {
				style.flexGrow = cfg.flex;
			}

			if( cfg.hidden ) {
				 style.display = 'none';
			}


			if( cfg.style ) {
				style = Object.assign( style, cfg.style );
			}

			return style;
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

		/**
		 * 	create the object to a specified element
		 */
		
		renderTo( el ) {

			React.render(
				React.createElement( this._ ),
			  	isString(el) ? document.getElementById(el) : el
			);
		}

		/**
		 * called by react to render the object
		 * 	we force the proxy to be this
		 */
		
		_render( ) {
			try {
				//console.log( 'rendering: ', this.constructor.name );
				return this.emit( this.render() );
			}
			catch( e ) {
				debugger;
				console.log( 'rendering error on object "' + this.constructor.name + '" : ' + JSON.stringify(e) );
				return null;
			}
		}

		render( ) {
			debugger;
			throw 'Please redender something';
		}

		_beforeMount( ) {
			this.beforeMount( );
		} 

		beforeMount( ) {

		}
		
		_afterMount( ) {
			this.afterMount( );
		}

		afterMount( ) {

		}
		
		_beforeUnmount( ) {
			this.beforeUnmount( );
		}

		beforeUnmount( ) {

		}
			
		_afterUnmount( ) {
			this.afterUnmount( );
		} 

		afterUnmount( ) {

		}
		
		_beforeUpdate( ) {
			this.beforeUpdate( this._updates );
		} 

		beforeUpdate( changes ) {

		}
		
		_afterUpdate( ) {
			this.afterUpdate( this._updates );
			this._updates = {};
		}

		afterUpdate( changes ) {

		}

		isTargetOfEvent( event ) {
			return event.target==this._;
		}

		setData( obj ) {
			
			let chg = false;			
			for( let d in obj ) {
				chg |= this._setDataValue( d, obj[d], true );
			}

			if( chg ) {
				this._refresh( );
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
			
				let iname = data[p];
					
				// elements starting with an underscore are hidden from other objects
				if( iname[0]=='_' ) {
					continue;
				}

				let name = camelCase( iname, true );
				if( this._watched && this._watched[name] ) {
					continue;
				}

				this['set' + name ] = ( value ) => {me._setDataValue(iname,value);return me;}
				this['get' + name ] = ( ) => { return me._data[iname];}

				watched[name] = true;
			}

			this._watched = watched;
		}

		_setDataValue( name, value, quiet ) {

			let 	data = this._data,
					chg = false;

			if( !data.hasOwnProperty(name) ) {
				throw 'Unknown data property ' + name;
			}

			if( data[name] !== value ) {

				chg = true;				
				data[name] = value;
				this._updates[name] = true;

				if( !quiet ) {
					this._dataChanged( );
				}
			}	

			return chg;
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
				this._.setState( {_:this._chg_id++} );
			}
		}

		_getDOM( ) {
			return React.findDOMNode( this._ );
		}
	}

	$$.Component = Component;

})( window || this );