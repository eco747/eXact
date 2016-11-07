(function($$) {

	const 	skipped_attrs = {
		'tag': true,
		'cls': true,
		'items': true,
		'content': true,
		'layout': true,
		'flex': true,
		'hidden': true,
		'layoutDir': true,
	};

	const 	shortcuts = {
		'width': true,
		'height': true,
		'left': true,
		'top': true,
	};

	const 	layout_dirs = {
		'center': 'center',
		'start': 'flex-start',
		'end': 'flex-end',
		'space-between': 'space-between',
		'space-around': 'space-around'
	};

	/**
	 * Event class 
	 * an event is defined by it's name
	 * and contains obervers
	 */

	class 	Event
	{
		constructor( name ) {
			this.name = name;
			this.observers = [];
		}

		add( o ) {
			if( !o ) {
				debugger;
			}

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

		fire( ...e ) {

			let obs = this.observers.slice( 0 ),
				n = obs.length;

			for( let i=0; i<n; i++ ) {
				obs[i]( ...e );
			}
		}
	}

	/**
	 * Observable element
	 * Every object extending this class can be observed
	 * first the observed element declare the type of event it can generate using addEvents
	 * then when needed it can fire events via fireEvent
	 * every body that need to be notified can listen for any known events via addListener or more short 'on' method
	 */
	
	class 	Observable
	{
		constructor( ) {
			this._event_handlers 	= {};
		}


		addEvents( ...events ) {
			let n = events.length,
				i;

			for( i=0; i<n; i++ ) {
				let name = events[i];

				// already known ?
				if( this._event_handlers[name] ) {
					continue;
				}

				this._event_handlers[name] = new Event(events[i]);
			}
		}

		fireEvent( name, ...e ) {
			let ev = this._event_handlers[name]
			if( ev ) {
				ev.fire( ...e );
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

			let ev = this._event_handlers[name];
			if( ev ) {
				ev.add( fn );
				return;
			}
			else {
				throw 'Unknown event: ' + name;
			}
		}

		// shortcut for addListener
		on( ...a ) {
			this.addListener( ...a );
		}

		removeListener( name, fn ) {
			if( !isString(name) ) {
				debugger;
			}

			let ev = this._event_handlers[name]
			if( ev ) {
				ev.remove( fn );
				return;
			}
			else {
				console.log( 'Unknown event:', name );
			}
		}

		// shortcut for removeListener
		un( ...a ) {
			this.removeListener( ...a );
		}

		_findEvent( name ) {

			let evts = this._event_handlers;
			for( let i in evts ) {
				if( evts[i].name==name ) {
					return evts[i];
				}
			}	
		}

	}


	/**
	 * Base Component Object
	 */

	class  Component extends Observable
	{
		/**
		 * @constructor
		 * @param  {Object} cfg - configuration		
		 * @param  {Object} defaults - default values for configuration
		 */
		
		constructor( cfg, defaults ) {
			super( );

			// apply defaults
			if( defaults ) {
				cfg = apply( defaults, cfg );
			}

			//	apply config to self 
			this._apply( cfg );

			this._ = new React.Component( );
									
			// setup react callbacks
			this._.render 				= ( ) => {return this._render( );}
			this._.componentWillMount   = ( ) => {return this._beforeMount( ); }
			this._.componentDidMount    = ( ) => {return this._afterMount( ); }
			this._.componentWillUnmount = ( ) => {return this._beforeUnmount( ); }
			this._.componentDidUnmount  = ( ) => {return this._afterUnmount( ); }
			this._.componentWillUpdate  = ( ) => {return this._beforeUpdate( ); }
			this._.componentDidUpdate   = ( ) => {return this._afterUpdate( ); }
		
			// generate our component classname
			this._clsName = 'x-' + kebabCase(this.constructor.name);
			this._chg_id = 1;
			this._events = {};
		}

		/**
		 * create automatically a set function for the given variable name
		 * ie. createAccessor('title') will define a method setTitle, when called if title change, automatically call _refresh
		 * you can use multiple value createAccessor('title','icon')
		 */
		
		createAccessor( ...vars ) {

			let data = Object.keys( vars ),
				me = this, 
				p;

			for( p in data ) {
			
				let iname = vars[p],
					name = camelCase( iname, true );

				this['set' + name ] = function( value ) {me._setValue(iname,value); return me;};
				this['get' + name ] = function( ) { return me[iname]; };
			}
		}

		/**
		 * automatically bind methods matching 'match' to this
		 * match is a regular expression. by default bind all methods starting by 'on'
		 * this mean that after this method have been called, all method starting with 'on' are binded to this
		 * onScroll or onClick, the is a trick to avoid spend our time to do mycallback = this.onMyMethod.bind(this)
		 * binded methods are 'marqued', this way we do not bind binded methods.
		 */
		
		bindAll( match ) {
			match = match || /^on.*/;

			let n = 0,
				els = Object.getOwnPropertyNames(this.__proto__);

			for( let m in els ) {
				let name = els[m];
				if( isFunction(this[name]) && match.test(name) ) {
					this[name] = this[name].bind(this);
					this[name].__bounded = true;
					n++;
				}
			}

			if( n==0 ) {
				console.log( 'Useless bindAll call' );
			}
		}

		/**
		 * append automatically events to the dom and bind methods to this if needed (see bindAll)
		 * ex: bind( { onclick: this.onClick, onkeypress: this.onKey } );
		 */
		
		bindEvents( events ) {
			for( let m in events ) {
				if( events.hasOwnProperty(m) && events[m] ) {
					let fn = events[m];
					if( !fn.__bounded ) {
						fn = fn.bind(this);
					}
					
					this._events[m] = fn;
				}
			}
		}

		/**
		 * apply element on this
		 * cannot redefine an already defined element (for now - debug purpose)
		 */
		
		_apply( cfg ) {
			for( let c in cfg ) {
				if( cfg.hasOwnProperty(c) ) {
					if( c in this ) {
						throw 'You cannot define a parameter that squash something in the component';
					}

					this[c] = cfg[c];
				}
			}
		}

		/**
		 * Emit the Json object definition in the React format
		 *
		 * 	layout: 
		 * 		vertical, horizontal
		 * 		
		 *	layoutDir:
		 *		center, start, end, space-around, space-between
		 * 
		 * @param  {Object} JSon definition
		 * @return {Object} Vue object
		 */
		
		_emit( desc, lvl=0 ) {
			
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
		
			if( cls ) {	
				props.className = cls;
			}
			
			// next attributes
			// 	copy all but the one that need to be processed
			//props.attrs = [];

			for( i in desc ) {
				if( !desc.hasOwnProperty(i) || skipped_attrs[i] || shortcuts[i] ) {
					continue;
				}

				props[i] = desc[i];
			}

			// merge styles
			props.style = apply( lvl==0 ? this._parseStyle( this ) : {}, this._parseStyle(desc) );
			
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
							items.push( this._emit(child,lvl+1) );
						}
					}
				}
			}
			//	or direct content (always text)
			else if( desc.content && isString(desc.content) ) {
				items.push( desc.content );
			}

			//	for the main element, we add events handlers
			if( lvl==0 && this._events ) {
				t = this._events;
				for( i in t ) {
					props[i] = t[i];
				}
			}

			return React.createElement( tag, props, items );
		}

		/**
		 * parse an object looking at it's style & shortcuts
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

				if( cfg.layoutDir ) {
					style.justifyContent = layout_dirs[cfg.layoutDir];
				}				
			}

			// next specific
			if( cfg.flex ) {
				style.flexGrow = cfg.flex;
				style.flexBasis = 1;
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
				return this._emit( this.render() );
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

		set( name, value ) {
			
			if( !isObject(name) ) {
				this._setValue( name, value );
				return;
			}

			let obj = name,
				chg = false;			

			for( let d in obj ) {
				chg |= this._setValue( d, obj[d], true );
			}

			if( chg ) {
				this._refresh( );
			}
		}

		/**
		 * define all properies of data as direct properties
		 */
		
		/*
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

				this['set' + name ] = ( value ) => {me._setValue(iname,value);return me;}
				this['get' + name ] = ( ) => { return me.[iname];}

				watched[name] = true;
			}

			this._watched = watched;
		}
		*/

		_setValue( name, value, quiet ) {

			let 	chg = false;

			if( !this.hasOwnProperty(name) ) {
				throw 'Unknown data property ' + name;
			}

			if( this[name] !== value ) {

				chg = true;				
				this[name] = value;
				
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
		
		_refresh( callback ) {
			this._.setState( {_:this._chg_id++}, callback );
		}

		_getDOM( ) {
			return React.findDOMNode( this._ );
		}
	}

	$$.Component = Component;
	$$.Observable = Observable;

})( window || this );