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

			this.clsName	= 'x-' + kebabCase(this.constructor.name);
			this.change_id 	= 0;

			this.data 		= {};
			this.events 	= {};
			this.states 	= {};

			this._dataChanged = null;
	
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
		 * life cycle notifications
		 * accept 
		 * {
		 *  	[beforeMount,afterMount,beforeUnmount,afterUnmount,beforeUpdate,afterUpdate] : function
		 * }
		 */

		on( events ) {

			let 	i, n;
			for( i in events ) {

				if( i=='dataChanged' ) {
					this._dataChanged = events[i].bind( this._proxy );
				}
				else {
					n = event_map[i];
					if( n ) {
						this._[n] = events[i].bind( this._proxy );
					}
				}
			}
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
		
		startTimer( ms, repeat, fn ) {
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

					if( name in me ) {
						return me[name];
					}

					if( name==='__self__' ) {
						return self;
					}

					if( name in me.data ) {
						return me.data[name];
					}

					console.log( 'unknown property ' + name ); 
				},
			
				set: function( me, name, value ) {

					let data = me.data;

					if( name in me ) {

						// if trying to change the whole data object						
						if( name=='data' ) {
							// any change ?
							if( !shallowEqual(value,data) ) {
								
								let odata = self._dataChanged ? cloneObject( data ) : null;
								me.data = value;
								self._watchDatas( );

								// fire a dataChanged
								if( self._dataChanged ) {
									self._dataChanged.call( self, odata, me.data );
								}

								self._refresh( );
							}
						}
						else {
							me[name] = value;
						}
					}
					//	trying to change a data element
					else if( name in data ) {
						
						let odata = self._dataChanged ? cloneObject(data) : null;
						me.data[name] = value;
						
						// fire a dataChanged
						if( self._dataChanged ) {
							self._dataChanged.call( self, odata, me.data );
						}

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
		 * 
		 */
		
		updateData( newdata ) {

			let data  = this.data.__self__,
				odata = null,
				ref = false,
				i;

			for( i in newdata ) {

				if( newdata.hasOwnProperty(i) && data.hasOwnProperty(i) ) {
					
					if( data[i] !== newdata[i] ) {
						if( !odata ) {
							odata = cloneObject(data);
						}

						data[i]  = newdata[i];
					}
				}
			}

			if( odata ) {
				if( this._dataChanged ) {
					this._dataChanged( odata, data );
				}

				this._refresh( );
			}
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

					if( name==='__self__' ) {
						return data;
					}
					
					if( data[name] ) {
						return data[name];
					}
				},
			
				set: function( data, name, value ) {
					if( !data.hasOwnProperty(name) ) {
						return false;
					}

					if( data[name] !== value ) {
						let odata = self._dataChanged ? cloneObject(data) : null;
						data[name] = value;
						if( self._dataChanged ) {
							self._dataChanged.call( self, odata, data );
						}

						self._refresh( );
					}

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