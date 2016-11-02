(function($$) {

	class 	as_soon
	{
		run( fn ) {
			let me = this;
			if( !me.do ) {
				me.do = true;
				asap( function() {me.do=false;fn();} );
			}
		}
	}


	/**
	 * Row class
	 * responsible to setup cells in a row
	 */

	class 	Row extends Component
	{

		constructor( columns, store ) {
			super( );

			this.setDataModel({
				top: 0,
				height: 0,
				index: 0,
			});

			this.store = store;
			this.columns = columns;
		}

		render( ) {
			let { top, height, index } = this._data;
			
			let cells = [],
				rec = this.store.getAt( index ),
				cols = this.columns,
				len = cols.length,
				model = this.store.model;

			if( rec ) {
				for( let c=0; c<len; c++ ) {

					let col = cols[c],
						style = { };

					if( col.width!==0 && col.width!==undefined) {
						style.width = col.width;
					}
					else {
						style.flexGrow = col.flex ? col.flex : 1;
					}

					let cell = {
						cls: 'x-cell',
						style: style,
						content: model._get(col.index,rec)	
					};

					cells.push( cell );
				}
			}

			return {
				cls: 'x-box ' + ((index%2)==0 ? 'x-odd' : ''),
					
				style: {
					position: 'absolute',
					top: top,
					height: height,
					width: '100%',
				},
				items: cells
			}
		}
	}

	/**
	 * grid header
	 * TODO: put in inside a container
	 */

	class 	Header extends Row
	{
		constructor( columns ) {
			super( );

			this.setDataModel({
				scrollLeft: 0,
				totalWidth: 0,
			});

			this.columns = columns;
		}

		render( ) {

			let items = [],
				cols = this.columns,
				len = cols.length,
				main_style;

			for( let c=0; c<len; c++ ) {

				let col = cols[c],
					style = { };

				if( col.width!==0 && col.width!==undefined) {
					style.width = col.width;
				}
				else {
					style.flexGrow = col.flex ? col.flex : 1;
				}

				let itm = {
					cls: 'x-cell',
					style: style,
					content: cols[c].title || ''
				};

				items.push( itm );
			}

			main_style = {
				left: -this._data.scrollLeft,
				position: 'relative',
				width: this._data.totalWidth || '100%',
			};

			return {
				style: main_style,
				items: items
			}
		}
	}

	/**
	 *
	 */

	class 	Container extends Component
	{
		constructor( ) {
			super( );

			this.setDataModel({
				totalWidth: 0,
				totalHeight: 0,
				renderContent: emptyFn
			});
		}		

		render( ) {
			const {totalWidth,totalHeight} = this._data;

			return {
				style: {
					width: totalWidth || '100%',
					height: totalHeight,
					position: 'relative',
				},
				items: this._data.renderContent( )
			}
		}
	}

	/**
	 *
	 */

	class 	Viewport extends Component
	{
		constructor( content ) {
			super( );

			this.setDataModel({
				onScroll: emptyFn
			});
			
			this.content = content;
			this._dom 	 = null;
		}

		acquireRef( dom ) {
			this._dom = dom;  			
		}

		afterMount() {
			this.content.renderTo( this._dom );
		}

		afterUpdate() {
			this.content.renderTo( this._dom );
		}

		render( ) {

			return {
				ref: this.acquireRef.bind(this),
				style: {
					overflow: 'auto',
					flexGrow: 1,
					boxSizing: 'border-box'
				},
				
				onscroll: 	this._data.onScroll,
			};
		}
	}


	/**
	 *
	 */

	class 	Grid extends Component
	{
		constructor( {store, columns } ) {
			super( );

			this.setDataModel({
				rowHeight: 40
			});

			this._scrollbarSize = getScrollbarSize( );

			this.content 	= new Container( );
			this.viewport 	= new Viewport( this.content );
			this.header 	= new Header( columns );
			this.asap 		= new as_soon;
			
			this.columns 	= columns;
			this.store 		= store;
			this.retrig 	= 0;

			this.totalHeight 	= store.getCount( ) * this._data.rowHeight;

			this.hasFlex 		= false;
			this.totalWidth  	= this._calcHWidth( );
			this.flexWidth 		= 0;
			this.updateTitle 	= true;

			this.viewport.setOnScroll( this._onScroll.bind(this) );
			this.content.setTotalHeight( this.totalHeight );
			this.content.setRenderContent( this._renderRows.bind(this,true) );
			
			this.rowPool	= [];
			this.scrollTop  = 0;
			this.lastScrollTop = -1;
		}

		_calcHWidth( ) {

			let cols = this.columns,
				n = cols.length,
				full = 0,
				i;

			for( i=0; i<n; i++ ) {
				let col = cols[i];
				
				if( col.width ) {
					full += col.width;
				}
				else {
					this.hasFlex = true;

					if( col.minWidth ) {
						full += col.minWidth;
					}
				}
			}

			return full;
		}

		_onScroll( event ) {

			let scrollLeft = event.target.scrollLeft;
			this.header.setScrollLeft( scrollLeft );

			let scrollTop = event.target.scrollTop,	
				rowHeight = this._data.rowHeight;
			
			this.scrollTop = scrollTop;

			let top 	= Math.floor(scrollTop/rowHeight) * rowHeight;
			
			if( this.lastScrollTop!=top ) {
				this._renderRows( );	
			}
		}

		/**
		 * virtual grid: render only the visible rows
		 * the idea is really studpid: each on visible line is put in a kind of recycler
		 * then each time we need to render a line at a position we get it from an available item in the recycler.
		 */
		
		_renderRows( calcRes ) {

			if( !this.viewport._dom ) {
				return null;				
			}

			let height  = this.viewport._dom.clientHeight,
				width 	= this.viewport._dom.clientWidth,
				rowHeight = this._data.rowHeight,
				i;

			// update hz sizes if flex columns
			if( (this.hasFlex && this.totalWidth<width && this.flexWidth!=width) ) {
				this.header.setTotalWidth( width-this._scrollbarSize );
				this.content.setTotalWidth( width );
				this.flexWidth = width;
				this.updateTitle = false;
			}

			let	scrollTop = this.scrollTop;
							
			// don't know why but the scrollbar allow do go after the end
			if( scrollTop>(this.totalHeight - height - rowHeight) ) {
				scrollTop = this.totalHeight - height - rowHeight;
			}

			let 	overscan_before, overscan_after;

			let top 	= Math.floor(scrollTop/rowHeight) * rowHeight;
			if( this.lastScrollTop==top && !calcRes ) {
				return false;
			}

			let scrollUp = top<this.lastScrollTop;
			const overscan = 80;

			if( scrollUp ) {
				overscan_before = overscan;
				overscan_after  = 0;
			}
			else {
				overscan_before = 0;
				overscan_after  = overscan;	
			}


			this.lastScrollTop = top;

			top -= overscan_before * rowHeight;

			if( top<0 ) {
				overscan_before = 0;
				top 	= 0;
			}

			let bottom  = top + height + (overscan_before + overscan_after) * rowHeight;

					
			//	check that we have enough rows in our pool
			let visRows	= (Math.floor(height / rowHeight) + 2) + (overscan_before+overscan_after),
				rows 	= this.rowPool,
				nrows 	= rows.length,
				ndata 	= this.store.getCount( );

			if( visRows>ndata ) {
				visRows = ndata;
			}

			// review: could be optimized in the 2nd loop
			for( i=nrows; i<visRows; i++ ) {
				rows.push( { up: true, top: 0, row: new Row( this.columns, this.store ) } );
			}

			//	setup rows
			let		nr 	= rows.length;

			// find elements that are outside visible range
			let 	available = [];
			let 	positions = {};

			for( i=0; i<nr; i++ ) {

				let row = rows[i];

				if( row.up || (row.top + rowHeight) <= top || row.top > bottom ) {
					row.up 	= true;				
					available.push( row );
				}
				else {
					positions[row.top] = row;
				}
			}

			// reuse missing positions with available rows
			let 	result = [];
			
			// we start from the first visible (or partially visible)
			// to the bottom of visible part

			for( i=0; i<nr; i++ ) {

				let orow = positions[top];
				if( !orow ) {
					orow 		= available.pop( );

					let idx = top/rowHeight;
					orow.up 	= false;
					orow.top 	= top;
					orow.row.setData( {top:top, height:rowHeight, index:idx} );
				}

				if( calcRes ) {
					result.push( orow.row );
				}

				top	+= rowHeight;
			}
			
			return result;
		}

		render( ) {
			return {
				style: {
					width: '100%',
					overflow: 'hidden',
				},
				items: [
					this.header,
					this.viewport
				]
			};
		}		
	}


	$$.Grid = Grid;

})( window || this );