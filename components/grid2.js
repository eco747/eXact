(function($$) {

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
				visible: true
			});

			this.store = store;
			this.columns = columns;
			this.visible = true;
		}

		render( ) {
			let { top, height, index, visible } = this._data;
			
			let cells = [],
				rec = this.store.getAt( index ),
				cols = this.columns,
				len = cols.length,
				model = this.store.model;

			if( rec && this._data.visible ) {
				for( let c=0; c<len; c++ ) {

					let col = cols[c],
						style = { };

					if( col.width!==0 && col.width!==undefined) {
						style.width = col.width;
					}
					else {
						style.flexGrow = col.flex ? col.flex : 1;
						style.width = 1;
					}

					let content;
					if( col.index ) {
						content = model._get(col.index,rec).toString();
					}

					if( col.renderer ) {
						content = col.renderer( content, model, rec );
						content = content || '';
					}

					let cell = {
						cls: 'x-cell',
						style: style,
						items: content,	
					};

					cells.push( cell );
				}
			}

			let style = {
				position: 'absolute',
				top: top,
				height: height,
				width: '100%',
			};

			return {
				cls: 'x-box ' + ((index%2)==0 ? 'x-odd' : ''),
				hidden: !visible,
				style: style,
				items: cells
			}
		}
	}

	/**
	 * grid header
	 * TODO: put in inside a container
	 */

	class 	Header extends Component
	{
		constructor( columns ) {
			super( );

			this.setDataModel({
				scrollLeft: 0,
				totalWidth: 0,
			});

			this.columns = columns;
			
			// you will be able to listen these events
			this.addEvents( 'headerclick' );
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
					style.width = 1;
				}

				let sorter;

				if( col._sorted ) {
					sorter = {
						cls: 'x-sort ' + col._sorted.toLowerCase( )
					};
				}


				let itm = {
					cls: 'x-cell',
					style: style,
					items: [{
							style: {display: 'inline-block'},
							content: cols[c].title || ''
						},
						sorter,
					]
				};

				if( col.sortable ) {
					itm.style.cursor = 'pointer';
					itm.onclick = this.onItemClick.bind( this, col );
				}

				items.push( itm );
			}

			main_style = {
				left: -this._data.scrollLeft,
				position: 'relative',
				width: this._data.totalWidth || '100%',
			};

			return {
				cls: 'x-box',
				style: main_style,
				items: items
			}
		}

		onItemClick( col ) {
			this.fireEvent( 'headerclick', col );
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

		render( ) {

			return {
				ref: this.acquireRef.bind(this),
				flex: 1,
				style: {
					overflow: 'auto',
					boxSizing: 'border-box',
					left: 0,
					right: 0,
				},
				
				onscroll: 	this._data.onScroll,
			};
		}
	}


	/**
	 *
	 * column:
	 * 	title: string column title
	 * 	sortable: boolean if click will sort the column
	 * 	index: field name in the DataStore
	 * 	width: size in pixels
	 * 	renderer: function (value,model,record)
	 * 	flex: number flex space
	 */

	class 	Grid extends Component
	{
		constructor( {store, columns, style } ) {
			super( arguments[0] );

			this.setDataModel({
				rowHeight: 40
			});

			this._scrollbarSize = getScrollbarSize( );

			this.content 	= new Container( );
			this.viewport 	= new Viewport( this.content );
			this.header 	= new Header( columns );
			
			this.columns 	= columns;
			this.store 		= store;
			this.retrig 	= 0;

			this.updateTitle 	= true;

			this.viewport.setOnScroll( this._onScroll.bind(this) );
			this.content.setRenderContent( this._renderRows.bind(this,true) );
			
			this.rowPool	= [];
			this.scrollTop  = 0;
			this.lastScrollTop = -1;

			this.header.addListener( 'headerclick', this._sortCol.bind(this) );

			this.store.on('change', this._refresh.bind(this) );
		}

		_sortCol( col ) {

			let dir = 'ASC';
			if( col._sorted ) {
				if( col._sorted=='ASC' ) {
					dir = 'DESC';
				}
			}

			for( let i=0; i<this.columns.length; i++ ) {
				this.columns[i]._sorted = undefined;
			}

			this.store.sort( col.index, dir );
			col._sorted = dir;

			this._refresh( );
		}

		_calcWidth( ) {
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

		afterMount( ) {
			this._refreshRows( );
		}

		afterUpdate() {
			asap( this._refreshRows, this );
		}

		_refreshRows( ) {
			this.content.renderTo( this.viewport._dom );
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

			let height  		= this.viewport._dom.clientHeight,
				width 			= this.viewport._dom.clientWidth,
				rowHeight 		= this._data.rowHeight,
				totalHeight 	= this.store.getCount( ) * this._data.rowHeight,
				i;

			// update content height
			if( totalHeight!=this.totalHeight ) {
				this.totalHeight 	= totalHeight;
				this.content.setTotalHeight( this.totalHeight );			
			}

			// update hz sizes if flex columns
			if( (this.hasFlex && this.totalWidth<width && this.flexWidth!=width) ) {

				let dom = this._getDOM( );

				this.header.setTotalWidth( width-1 );
				this.content.setTotalWidth( width-1 );
				this.flexWidth = width;
				this.updateTitle = false;
			}

			let	scrollTop = this.scrollTop;
							
			// don't know why but the scrollbar allow do go after the end
			if( scrollTop>(this.totalHeight - height - rowHeight) ) {
				scrollTop = this.totalHeight - height - rowHeight;
			}

			let 	overscan_before, overscan_after;

			let idxTop = Math.floor(scrollTop/rowHeight),
				idxBottom = idxTop + Math.ceil(height/rowHeight),
				ndata = this.store.getCount( );

			let scrollUp = (idxTop*rowHeight)<this.lastScrollTop;
			
			const overscan = 5;
			if( scrollUp ) {
				overscan_before = overscan;
				overscan_after  = 0;
			}
			else {
				overscan_before = 0;
				overscan_after  = overscan;	
			}

			idxTop	-= overscan_before;
			if( idxTop < 0 ) {
				idxTop = 0;
			}

			idxBottom += overscan_after;
			if( idxBottom >= ndata) {
				idxBottom = ndata-1;
			}

			let nVis = idxBottom - idxTop,
				top = idxTop * rowHeight,
				bottom = idxBottom * rowHeight;

			if( this.lastScrollTop==top && !calcRes ) {
				return false;
			}

			this.lastScrollTop = top;

			//	setup rows
			let	rows = this.rowPool,
				nPool = this.rowPool.length;

			// find elements that are outside visible range
			let 	available = [];
			let 	positions = {};

			for( i=0; i<nPool; i++ ) {

				let row = rows[i];

				// if not in visible redraw range, put it in available pool
				if( (row.top + rowHeight) <= top || row.top > bottom ) {
					available.push( row );
				}
				// else, it's ok keep in mind that this pos is filled
				else {
					positions[row.top] = row;
				}
			}

			// reuse missing positions with available rows
			let 	result = [];
			
			// we start from the first visible (or partially visible)
			// to the bottom of visible part

			while( top<=bottom ) {

				// is this position occupied ?
				let orow = positions[top];

				if( !orow ) {
					//	no, get one in available Pool
					orow 		= available.pop( );
					if( !orow ) {
						// no, create it
						orow = { row: new Row( this.columns, this.store ) };
						// and keep it
						rows.push( orow );
					}

					// ensure visible
					orow.row.setVisible( true );

					// setup it's data
					let idx = top/rowHeight;
					orow.top 	= top;
					orow.row.setData( {top:top, height:rowHeight, index:idx} );
				}

				if( calcRes ) {
					result.push( orow.row );
				}

				top	+= rowHeight;
			}
			
			// hide available rows
			let na = available.length;
			for( i=0; i<na; i++ ) {
				let row = available[i];
				row.top = -1000;
				row.row.setVisible( false );
			}

			return result;
		}

		render( ) {

			this.rowPool = [];
			this.hasFlex 		= false;
			this.totalWidth  	= this._calcWidth( );
			this.flexWidth 		= 0;

			return {
				style: {
					overflow: 'hidden',
				},
				layout: 'vertical',
				items: [
					this.header,
					this.viewport
				]
			};
		}		
	}


	$$.Grid = Grid;

})( window || this );