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
			this._.render 	= ( ) => {return this._render( );};

			this.clsName	= 'x-' + kebabCase(this.constructor.name);
			this.change_id 	= 0;

			this.data 		= {};
			this.events 	= {};
			this.states 	= {};
	
			this._proxy 	= this._selfWatch( );
			return this._proxy;
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
				cls   = lvl==0 ? this.clsName : '',
				i, t, tag;

			// first: the tag
			tag	= desc.tag || 'div';

			// next class name
			// 	by default, the Object class name is added (only for the main element (not childen) 
			// 	ie. if your class is MyClass, the class x-my-class will be set
			if( desc.cls) {
				cls += ' ' + desc.cls;
			}
			
			// add states to the class
			for( i in this.states ) {
				cls += ' x-state-' + kebabCase(i);
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
					props[i] = t[i].bind(this._proxy);
				}
			}

			return React.createElement( tag, props, items );
		}

		/**
		 * change the component state
		 */
		
		setState( name, set=true ) {

			let states = this.states;

			if( set && !(name in states) ) {
				states[name] = true;
				this._refresh( );
			}
			else if( !set && (name in states) ) {
				delete states[name];
				this._refresh( );
			}
		}

		/**
		 * start a timer 
		 * @param  {Number} ms repeat time in 
		 * @param {Boolean}	repeat true for an interval timer
		 * @param  {Function} fn function to call (automatically binded to this)
		 * @return {Number}   the timer id
		 * @cf stopTimer
		 */
		
		onTimer( ms, repeat, fn ) {
			if( repeat ) {
				return  {i:setInterval( fn.bind(this._proxy), ms ), r:true };
			}
			else {
				return  {i:setTimeout( fn.bind(this._proxy), ms ), r:false };
			}
		}

		/**
		 * stop the timer
		 * @param  {Number} id timer id created with onTimer
		 */
		
		stopTimer( id ) {
			(id.r==false ? clearTimeout : clearInterval)( id.i );
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
			return this.emit( this.onRender.call( this._proxy ) );
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
						self._refresh( );
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
			let ndata = new Proxy( this.data, {
				
				get: function( data, name ) {
					if( data[name] ) {
						return data[name];
					}
				},
			
				set: function( data, name, value ) {
					if( !data.hasOwnProperty(name) ) {
						return false;
					}

					data[name] = value;
					self._refresh( );
					return true;
				}
			});

			this.data = ndata;
		}

		/**
		 * watch the watchers
		 */
		
		_watchWatchers( ) {

			let self = this;
			let ndata = new Proxy( this.data, {
				
				get: function( data, name ) {
					if( data[name] ) {
						return data[name];
					}
				},
			
				set: function( data, name, value ) {
					if( !data.hasOwnProperty(name) ) {
						return false;
					}

					data[name] = value;
					self._refresh( );
					return true;
				}
			});

			this.data = ndata;
		}


		/**
		 * fire a refresh on the object
		 */
		
		_refresh( ) {
			if( this._.isMounted() ) {
				this._.setState( {c:this.change_id++} );
			}
		}

	}

	$$.Component = Component;

})( window || this );