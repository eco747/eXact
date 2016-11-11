(function($$) {

	/**
	 * Grid Row class
	 * responsible to setup cells in a row
	 *
	 * BUG: when h-sizing & hscrollbar disapear, we loose the content
	 */

	class 	Row extends Component
	{
		/**
		 * constructor
		 * @param  {Number} cfg.top - top position
		 * @param {Number} cfg.height - element height
		 * @param {Any} cfg.index - element index in the data store
		 * @params {DataStore} cfg.store - data store to work on
		 * @param {Boolean} cfg.visible - visible or not
		 * @param {Object} cfg.columns - columns description
		 * @param {Boolean} cfg.selected - if true , mark the row as selected
		 */
		
		constructor( cfg ) {
			super( cfg, {top:0,height:0,index:0,visible:true,selected:false} );

			this.bindAll( );
			this.addEvents( 'click', 'dblclick' );
		}

		render( ) {
			let { top, height, index, visible } = this;
			
			let cells = [],
				rec = this.store.getAt( index ),
				cols = this.columns,
				len = cols.length,
				model = this.store.model,
				selected = this.selected;

			if( rec && visible ) {
				for( let c=0; c<len; c++ ) {

					let col = cols[c],
						style = { };

					if( col.width!==0 && col.width!==undefined) {
						style.width = col.width;
					}
					else {
						style.flexGrow = col.flex ? col.flex : 1;
						style.flexBasis = 1;
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
				cls: 'x-box' + ((index%2)==0 ? ' x-odd' : '') + (selected ? ' x-sel' : ''),
				hidden: !visible,
				style: style,
				items: cells,
				onclick: this.onClick,
				ondblclick: this.onDblClick,
			}
		}

		onClick( e ) {
			this.fireEvent( 'click', this, e );
		}

		onDblClick( e ) {
			this.fireEvent( 'dblclick', this, e );	
		}
	}

	/**
	 * Grid Header
	 * TODO: put in inside a container
	 */

	class 	Header extends Component
	{
		/**
		 * constructor
		 * @param {Object} cfg.columns - columns description
		 * @param {Number} cfg.scrollLeft - left scoll position
		 * @param {Number} cfg.totalWidth - total width of the element
		 */
		
		constructor( cfg ) {
			super( cfg, {scrollLeft:0, scrollTop:0} );

			this.addEvents( 'headerclick', 'headersizechanged' );
		}

		reset( ) {
			this.totalWidth = 0;
		}

		render( ) {

			let items = [],
				cols = this.columns,
				len = cols.length,
				main_style;

			for( let c=0; c<len; c++ ) {

				let col = cols[c],
					style = { position: 'relative' };

				if( col.width!==0 && col.width!==undefined) {
					style.width = col.width;
				}
				else {
					style.flexGrow = col.flex ? col.flex : 1;
					style.flexBasis = 1;
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
					itm.cls += ' sortable';
					itm.onclick = this.onItemClick.bind( this, col );
				}

				if( col.sizable ) {
					itm.items.push( new Sizer({side:'right',handler:this.onColSize.bind(this,col)}) );
				}

				items.push( itm );
			}

			main_style = {
				left: -this.scrollLeft,
				position: 'relative',
				width: this.totalWidth || '100%',
			};


			return {
				cls: 'x-box',
				style: main_style,
				items: items
			}
		}

		onColSize( col, size ) {
			this.fireEvent( 'headersizechanged', col, size );
		}

		onItemClick( col ) {
			this.fireEvent( 'headerclick', col );
		}
	}

	/**
	 *	Generic Container class
	 */

	class 	Container extends Component
	{
		/**
		 * constructor
		 * @param  {Number} cfg.totalWidth - total width of the element
		 * @param {Number} cfg.totalHeight - total height of the element
		 * @param {Function} cfg.renderer - renderer for the element
		 */
		constructor( cfg ) {
			super( cfg, {totalHeight:0,totalWidth:0} );
		}		

		reset( ) {
			this.totalWidth = 0;
			this.totalHeight = 0;
		}

		render( ) {
			const {totalWidth,totalHeight} = this;

			return {
				style: {
					width: totalWidth || '100%',
					height: totalHeight,
					position: 'relative',
				},
				items: this.renderer( )
			}
		}
	}

	/**
	 *	Generic Viewport
	 *	A viewport contains a simple Container
	 */

	class 	Viewport extends Component
	{
		/**
		 * constructor
		 * @param {Number} scrollLeft - left scroll pos
		 * @param {Number} scrollTop - top scroll pos
		 */
		
		constructor( cfg ) {
			super( cfg, {scrollLeft:0, scrollTop:0} );

			this.addEvents( 'scroll' );
			this.bindEvents({
				onscroll: this.onScroll
			});

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
				}
			};
		}

		onScroll( e ) {
			this.fireEvent( 'scroll', e );
		}
	}

	/**
	 * Basic selection class
	 * by default, we add element indexes, so the selection convert the given id to real record id
	 *
	 * @param {DataStore} store store to work on
	 */
	
	class 	Selection {

		constructor( cfg ) {
			apply( this, cfg );

			this.items = new Set( );
		}

		/**
		 * add an id in the selection
		 * @param  {Any} id the id to add
		 */
		
		add( id ) {
			id = this._getRecordId(id);
			this.items.add( id );
		}

		/**
		 * remove an id from the selection
		 * @param  {Any} id the id to remove
		 */
		
		remove( id ) {
			id = this._getRecordId(id);
			this.items.delete( id );
		}

		/**
		 * clear the whole selection
		 */
		
		clear( ) {
			this.items.clear( );
		}

		/**
		 * toggle an id in the selection: if present: remove, if absent: set
		 * @param  {Any} id the id to toggle
		 * @return {Boolean} the new selection state of the item
		 */
		
		toggle( id ) {
			id = this._getRecordId(id);

			if( this.items.has(id) ) {
				this.items.delete( id );
				return false;
			}
			else {
				this.items.add( id );
				return true;
			}
		}

		/**
		 * check if the selection contains this id
		 * @param  {Any} id the id to check
		 */
		
		contains( id ) {
			id = this._getRecordId(id);
			return this.items.has( id );
		}

		/**
		 * return the real record id from the given index
		 */
		
		_getRecordId( id ) {
			let rec = this.store.getAt( id );
			return this.store.model._getId( rec );
		}
	}


	/**
	 * column definition:
	 * 	title: string column title
	 * 	sortable: boolean if click will sort the column
	 * 	index: field name in the DataStore
	 * 	width: size in pixels
	 * 	renderer: function (value,model,record)
	 * 	flex: number flex space
	 */

	class 	Grid extends Component
	{
		/**
		 * constructor
		 * @param  {Number} cfg.rowHeigth - default height for all columns
		 * @param {DataStore} cfg.store - data store to use
		 * @param {Object} cfg.columns - columns to render
		 * @param {Number} cfg.rowHeight - default row height
		 */
		constructor( cfg ) {
			super( cfg, {rowHeight:40} );

			if( this.rowHeight<=10 ) {
				this.rowHeight = 10;
			}

			this.bindAll( );

			this._scrollbarSize = getScrollbarSize( );
			this._totalWidth = this._calcWidth( );
			this._totalHeight = this._calcHeight( );

			this._content 	= new Container( {renderer:this.onRenderRows,totalWidth:this._totalWidth,totalHeight:this._totalHeight} );
			this._viewport 	= new Viewport( );
			this._header 	= new Header( {columns:this.columns,totalWidth:this._totalWidth} );
			
			this._viewport.on( 'scroll', this.onScroll );
			
			this._rowPool	= [];
			this._scrollTop  = 0;
			this._lastScrollTop = -1;
			this._hasFlex = false;
			this._flexWidth = 0;
			this._selection = new Selection( {store:this.store} );

			this._header.on( 'headerclick', this.onSortCol );
			this._header.on( 'headersizechanged', this.onColSized );

			this.store.on('change', this.onStoreChanged );
		}

		/**
		 * called when the user resize a column on sizable header
		 */
		
		onColSized( col, size ) {
			col.width = size;
			col.flex = 0;
			this._refresh( );
		}

		/**
		 * called when the user click on a sortable header
		 */
		
		onSortCol( col ) {

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

		onStoreChanged( ) {
			this._rowPool = [];
			this._header.reset( );
			this._content.reset( );
			this._refresh( this._createContent.bind(this) );
		}

		/**
		 * compute content total height
		 */
		
		_calcHeight( ) {
			return this.store.getCount( ) * this.rowHeight;
		}

		/**
		 * compute content totalWidth
		 */
		
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
					this._hasFlex = true;

					if( col.minWidth ) {
						full += col.minWidth;
					}
				}
			}

			return full;
		}

		_createContent( ) {
			this._updateRows( );
			this._content.renderTo( this._viewport._dom );
		}

		afterMount( ) {
			this._createContent( );
		}

		afterUpdate() {
			//asap( this._refreshRows, this );
			this._lastScrollTop = -1;
			this._updateRows( );
			this._content._refresh( );
		}

		onScroll( event ) {

			let scrollLeft = event.target.scrollLeft;
			this._header.set( 'scrollLeft', scrollLeft );

			let scrollTop = event.target.scrollTop,	
				rowHeight = this.rowHeight;
			
			this._scrollTop = scrollTop;

			let top	= Math.floor(scrollTop/rowHeight) * rowHeight;
			
			if( this._lastScrollTop!=top ) {
				this._updateRows( );	
			}
		}

		/**
		 * virtual grid: render only the visible rows
		 * the idea is really studpid: each on visible line is put in a kind of recycler
		 * then each time we need to render a line at a position we get it from an available item in the recycler.
		 */
		
		_updateRows( ) {

			if( !this._viewport._dom ) {
				return null;				
			}

			let rc 				= this._viewport._dom.getBoundingClientRect( ),
				height  		= rc.height,
				width 			= rc.width,
				rowHeight 		= this.rowHeight,
				totalHeight 	= this.store.getCount( ) * rowHeight,
				i;

			// avoid scrollbar hz/vt conflict
			this._viewport._dom.style.overflow = 'hidden';
			
			// update content height
			if( totalHeight!=this._totalHeight ) {
				this._totalHeight = totalHeight;
				this._content.set( 'totalHeight', totalHeight );
			}

			if( totalHeight>height ) {
				width -= this._scrollbarSize;
			}

			// update hz sizes if flex columns
			
			if( this._totalWidth<width && this._hasFlex ) {
				if( this._flexWidth!=width ) {
					this._header.set( 'totalWidth', width );
					this._content.set( 'totalWidth', '100%' );
					this._flexWidth = width;
				}
			}
			else {
				this._header.set( 'totalWidth', this._totalWidth-1 );
				this._content.set( 'totalWidth', this._totalWidth-1 );
			}

			let	scrollTop = this._scrollTop;
							
			// don't know why but the scrollbar allow do go after the end
			if( scrollTop>(totalHeight - height - rowHeight) ) {
				scrollTop = totalHeight - height - rowHeight;
			}

			let 	overscan_before, overscan_after;

			let idxTop = Math.floor(scrollTop/rowHeight),
				idxBottom = idxTop + Math.ceil(height/rowHeight),
				ndata = this.store.getCount( );

			let scrollUp = (idxTop*rowHeight)<this._lastScrollTop;
			
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

			if( this._lastScrollTop!=top ) {
				this._lastScrollTop = top;

				//	setup rows
				let	rows = this._rowPool,
					nPool = this._rowPool.length;

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
							orow = { row: new Row( {columns:this.columns, store:this.store} ) };
							// and keep it
							rows.push( orow );
						}

						// setup it's data
						let idx = top/rowHeight,
							sel = this._selection.contains(idx);

						orow.top 	= top;
						orow.row.set( {top, visible: true, height:rowHeight, index:idx, selected: sel } );
						orow.row.on( 'click', this.onRowClick );
					}

					top	+= rowHeight;
				}
				
				// hide available rows
				let na = available.length;
				for( i=0; i<na; i++ ) {
					let row = available[i];
					row.top = -1000;
					row.row.set( {visible:false} );
				}
			}

			// avoid scrollbar hz/vt conflict
			this._viewport._dom.style.overflow = 'auto';
		}

		onRowClick( row, ev ) {

			let shift = ev.shiftKey,
				ctrl = ev.ctrlKey,
				refresh = 1;
			
			if( shift && ctrl ) {
			}
			else if( ctrl ) {
				this._selection.toggle( row.index );
			}
			else if( shift ) {

			}
			else {
				this._selection.clear( );
				this._selection.add( row.index );
			}

			this._refreshSel( );
		}

		_refreshSel( ) {

			let rows = this._rowPool,
				sels = this._selection;
			
			for( let r in rows ) {
				let row = rows[r].row,
					sel = sels.contains( row.index );

				row.set( { selected: sel } );
			}
		}
		
		onRenderRows( ) {
			let result = [],
				rows = this._rowPool,
				n = rows.length,
				r;

			for( r=0; r<n; r++ ) {
				result.push( rows[r].row );
			}
			
			return result;
		}

		render( ) {
			
			this._hasFlex = false;
			this._totalWidth = this._calcWidth( );
			this._totalHeight = 0;
			this._flexWidth	= 0;
						
			return {
				style: {
					overflow: 'hidden',
				},
				layout: 'vertical',
				items: [
					this._header,
					this._viewport
				]
			};
		}		
	}

	$$.Grid = Grid;

})( window || this );