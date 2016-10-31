/**
 * port from https://github.com/bvaughn/react-virtualized
 */

(function( $$ ) {


const 	SCROLL_DIRECTION_BACKWARD 	= -1;
const 	SCROLL_DIRECTION_FIXED 		= 0;
const 	SCROLL_DIRECTION_FORWARD 	= 1;

/**
 * Specifies the number of miliseconds during which to disable pointer events while a scroll is in progress.
 * This improves performance and makes scrolling smoother.
 */
const DEFAULT_SCROLLING_RESET_TIME_INTERVAL = 150

/**
 * Controls whether the Grid updates the DOM element's scrollLeft/scrollTop based on the current state or just observes it.
 * This prevents Grid from interrupting mouse-wheel animations (see issue #2).
 */
const SCROLL_POSITION_CHANGE_REASONS = {
  OBSERVED: 'observed',
  REQUESTED: 'requested'
}


/**
 * Calculates the number of cells to overscan before and after a specified range.
 * This function ensures that overscanning doesn't exceed the available cells.
 *
 * @param cellCount Number of rows or columns in the current axis
 * @param scrollDirection One of SCROLL_DIRECTION_BACKWARD
 * @param overscanCellsCount Maximum number of cells to over-render in either direction
 * @param startIndex Begin of range of visible cells
 * @param stopIndex End of range of visible cells
 */
function getOverscanIndices ( cellCount, overscanCellsCount, scrollDirection, startIndex, stopIndex ) {
	let overscanStartIndex
	let overscanStopIndex

	if (scrollDirection === SCROLL_DIRECTION_FORWARD) {
		overscanStartIndex = startIndex
		overscanStopIndex = stopIndex + overscanCellsCount * 2
	} else if (scrollDirection === SCROLL_DIRECTION_BACKWARD) {
		overscanStartIndex = startIndex - overscanCellsCount * 2
		overscanStopIndex = stopIndex
	} else {
		overscanStartIndex = startIndex - overscanCellsCount
		overscanStopIndex = stopIndex + overscanCellsCount
	}

	return {
		overscanStartIndex: Math.max(0, overscanStartIndex),
		overscanStopIndex: Math.min(cellCount - 1, overscanStopIndex)
	};
}



/**
 * Helper function that determines when to update scroll offsets to ensure that a scroll-to-index remains visible.
 * This function also ensures that the scroll ofset isn't past the last column/row of cells.
 *
 * @param cellsSize Width or height of cells for the current axis
 * @param cellSizeAndPositionManager Manages size and position metadata of cells
 * @param previousCellsCount Previous number of rows or columns
 * @param previousCellsSize Previous width or height of cells
 * @param previousScrollToIndex Previous scroll-to-index
 * @param previousSize Previous width or height of the virtualized container
 * @param scrollOffset Current scrollLeft or scrollTop
 * @param scrollToIndex Scroll-to-index
 * @param size Width or height of the virtualized container
 * @param updateScrollIndexCallback Callback to invoke with an scroll-to-index value
 */

//TODO: check arg call
function updateScrollIndexHelper ({
		cellSize,
		cellSizeAndPositionManager,
		previousCellsCount,
		previousCellSize,
		previousScrollToAlignment,
		previousScrollToIndex,
		previousSize,
		scrollOffset,
		scrollToAlignment,
		scrollToIndex,
		size,
		updateScrollIndexCallback
	}) {
		
	const cellCount = cellSizeAndPositionManager.getCellCount()
	const hasScrollToIndex = scrollToIndex >= 0 && scrollToIndex < cellCount
	const sizeHasChanged = ( size!==previousSize || !previousCellSize || (isNumber(cellSize) && cellSize !== previousCellSize) );

	// If we have a new scroll target OR if height/row-height has changed,
	// We should ensure that the scroll target is visible.
	if( hasScrollToIndex && (sizeHasChanged || scrollToAlignment !== previousScrollToAlignment || scrollToIndex !== previousScrollToIndex )) {
		
		updateScrollIndexCallback(scrollToIndex);

	// If we don't have a selected item but list size or number of children have decreased,
	// Make sure we aren't scrolled too far past the current content.
	} 
	else if ( !hasScrollToIndex && cellCount > 0 && ( size < previousSize || cellCount < previousCellsCount )) {
		// We need to ensure that the current scroll offset is still within the collection's range.
		// To do this, we don't need to measure everything; CellMeasurer would perform poorly.
		// Just check to make sure we're still okay.
		// Only adjust the scroll position if we've scrolled below the last set of rows.
		if (scrollOffset > cellSizeAndPositionManager.getTotalSize() - size) {
  			updateScrollIndexCallback(cellCount - 1);
		}
	}
}


/**
 * Helper method that determines when to recalculate row or column metadata.
 *
 * @param cellCount Number of rows or columns in the current axis
 * @param cellsSize Width or height of cells for the current axis
 * @param computeMetadataCallback Method to invoke if cell metadata should be recalculated
 * @param computeMetadataCallbackProps Parameters to pass to :computeMetadataCallback
 * @param nextCellsCount Newly updated number of rows or columns in the current axis
 * @param nextCellsSize Newly updated width or height of cells for the current axis
 * @param nextScrollToIndex Newly updated scroll-to-index
 * @param scrollToIndex Scroll-to-index
 * @param updateScrollOffsetForScrollToIndex Callback to invoke if the scroll position should be recalculated
 */

function calculateSizeAndPositionDataAndUpdateScrollOffset({
		cellCount,
		cellSize,
		computeMetadataCallback,
		computeMetadataCallbackProps,
		nextCellsCount,
		nextCellSize,
		nextScrollToIndex,
		scrollToIndex,
		updateScrollOffsetForScrollToIndex
	}) {
  	
  	// Don't compare cell sizes if they are functions because inline functions would cause infinite loops.
  	// In that event users should use the manual recompute methods to inform of changes.
  	if( cellCount !== nextCellsCount ||
  		( (isNumber(cellSize) || isNumber(nextCellSize)) && cellSize !== nextCellSize )) {

	    computeMetadataCallback(computeMetadataCallbackProps);

	    // Updated cell metadata may have hidden the previous scrolled-to item.
	    // In this case we should also update the scrollTop to ensure it stays visible.
	    if (scrollToIndex >= 0 && scrollToIndex === nextScrollToIndex) {
	    	updateScrollOffsetForScrollToIndex();
	    }
  	}
}

/**
 * Helper utility that updates the specified callback whenever any of the specified indices have changed.
 */

function createCallbackMemoizer (requireAllKeys = true) {
	let cachedIndices = {};

	return ({callback,indices}) => {
	
		const keys = Object.keys(indices);

		const allInitialized = !requireAllKeys || keys.every(key => {
	  		const value = indices[key]
		  	return isArray(value) ? value.length > 0 : value >= 0;
		});

		const indexChanged = keys.length !== Object.keys(cachedIndices).length || keys.some( key => {
		    const cachedValue = cachedIndices[key]
		    const value = indices[key]
		    return isArray(value) ? cachedValue.join(',') !== value.join(',') : cachedValue !== value
		 });

		cachedIndices = indices;

		if (allInitialized && indexChanged) {
			callback(indices);
		}
	}
}



// *********************************************************************************************************
// 										CellSizeAndPositionManager.js
// *********************************************************************************************************




/**
 * Just-in-time calculates and caches size and position information for a collection of cells.
 */

class CellSizeAndPositionManager {

	constructor( cellCount, cellSizeGetter, estimatedCellSize ) {
	
		this._cellSizeGetter = cellSizeGetter
		this._cellCount = cellCount
		this._estimatedCellSize = estimatedCellSize

		// Cache of size and position data for cells, mapped by cell index.
		// Note that invalid values may exist in this map so only rely on cells up to this._lastMeasuredIndex
		this._cellSizeAndPositionData = {}

		// Measurements for cells up to this index can be trusted; cells afterward should be estimated.
		this._lastMeasuredIndex = -1
	}

	configure( cellCount, estimatedCellSize ) {
		this._cellCount = cellCount
		this._estimatedCellSize = estimatedCellSize
	}

	getCellCount () {
		return this._cellCount
	}

	getEstimatedCellSize () {
		return this._estimatedCellSize
	}

	getLastMeasuredIndex () {
		return this._lastMeasuredIndex
	}

	/**
	* This method returns the size and position for the cell at the specified index.
	* It just-in-time calculates (or used cached values) for cells leading up to the index.
	*/
	getSizeAndPositionOfCell( index ) {
		if (index < 0 || index >= this._cellCount) {
			throw Error(`Requested index ${index} is outside of range 0..${this._cellCount}`)
		}

		if (index > this._lastMeasuredIndex) {
			let lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell()
			let offset = lastMeasuredCellSizeAndPosition.offset + lastMeasuredCellSizeAndPosition.size

			for (var i = this._lastMeasuredIndex + 1; i <= index; i++) {
				let size = this._cellSizeGetter({ index: i })

				if (size == null || isNaN(size)) {
					throw Error(`Invalid size returned for cell ${i} of value ${size}`)
				}

				this._cellSizeAndPositionData[i] = {
					offset,
					size
				}

				offset += size
			}

			this._lastMeasuredIndex = index
		}

		return this._cellSizeAndPositionData[index]
	}

	getSizeAndPositionOfLastMeasuredCell () {
		return this._lastMeasuredIndex >= 0 ? this._cellSizeAndPositionData[this._lastMeasuredIndex] 
				: {
					offset: 0,
					size: 0
				};
	}

	/**
	* Total size of all cells being measured.
	* This value will be completedly estimated initially.
	* As cells as measured the estimate will be updated.
	*/
	getTotalSize () {
		const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell()
		return lastMeasuredCellSizeAndPosition.offset + lastMeasuredCellSizeAndPosition.size + (this._cellCount - this._lastMeasuredIndex - 1) * this._estimatedCellSize
	}

	/**
	* Determines a new offset that ensures a certain cell is visible, given the current offset.
	* If the cell is already visible then the current offset will be returned.
	* If the current offset is too great or small, it will be adjusted just enough to ensure the specified index is visible.
	*
	* @param align Desired alignment within container; one of "auto" (default), "start", or "end"
	* @param containerSize Size (width or height) of the container viewport
	* @param currentOffset Container's current (x or y) offset
	* @param totalSize Total size (width or height) of all cells
	* @return Offset to use to ensure the specified cell is visible
	*/
	getUpdatedOffsetForIndex( align /*= 'auto'*/, containerSize, currentOffset, targetIndex ) {
		if (containerSize <= 0) {
			return 0
		}

		const datum = this.getSizeAndPositionOfCell(targetIndex)
		const maxOffset = datum.offset
		const minOffset = maxOffset - containerSize + datum.size

		let idealOffset

		switch (align) {
		case 'start':
			idealOffset = maxOffset
			break
		case 'end':
			idealOffset = minOffset
			break
		case 'center':
			idealOffset = maxOffset - ((containerSize - datum.size) / 2)
			break
		default:
			idealOffset = Math.max(minOffset, Math.min(maxOffset, currentOffset))
			break
		}

		const totalSize = this.getTotalSize()
		return Math.max(0, Math.min(totalSize - containerSize, idealOffset))
	}

	getVisibleCellRange( containerSize, offset ) {
		const totalSize = this.getTotalSize()

		if (totalSize === 0) {
			return {}
		}

		const maxOffset = offset + containerSize
		const start = this._findNearestCell(offset)

		const datum = this.getSizeAndPositionOfCell(start)
		offset = datum.offset + datum.size

		let stop = start

		while (offset < maxOffset && stop < this._cellCount - 1) {
			stop++
			offset += this.getSizeAndPositionOfCell(stop).size
		}

		return {
			start,
			stop
		}
	}

	/**
	* Clear all cached values for cells after the specified index.
	* This method should be called for any cell that has changed its size.
	* It will not immediately perform any calculations; they'll be performed the next time getSizeAndPositionOfCell() is called.
	*/
	resetCell( index ) {
		this._lastMeasuredIndex = Math.min(this._lastMeasuredIndex, index - 1)
	}

	_binarySearch ( high, low, offset )  {
		let middle
		let currentOffset

		while (low <= high) {
			middle = low + Math.floor((high - low) / 2)
			currentOffset = this.getSizeAndPositionOfCell(middle).offset

			if (currentOffset === offset) {
				return middle
			}
			else if (currentOffset < offset) {
				low = middle + 1
			}
			else if (currentOffset > offset) {
				high = middle - 1
			}
		}

		if (low > 0) {
			return low - 1
		}
	}

	_exponentialSearch( index, offset ) {
		let interval = 1

		while ( index < this._cellCount && this.getSizeAndPositionOfCell(index).offset < offset ) {
			index += interval
			interval *= 2
		}

		return this._binarySearch( Math.min(index, this._cellCount - 1), Math.floor(index / 2), offset );
	}

	/**
	* Searches for the cell (index) nearest the specified offset.
	*
	* If no exact match is found the next lowest cell index will be returned.
	* This allows partially visible cells (with offsets just before/above the fold) to be visible.
	*/
	_findNearestCell (offset ) {
		if (isNaN(offset)) {
			throw Error(`Invalid offset ${offset} specified`)
		}

		// Our search algorithms find the nearest match at or below the specified offset.
		// So make sure the offset is at least 0 or no match will be found.
		offset = Math.max(0, offset)

		const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell()
		const lastMeasuredIndex = Math.max(0, this._lastMeasuredIndex)

		if (lastMeasuredCellSizeAndPosition.offset >= offset) {
			// If we've already measured cells within this range just use a binary search as it's faster.
			return this._binarySearch( lastMeasuredIndex, 0, offset );
		} 
		else {
			// If we haven't yet measured this high, fallback to an exponential search with an inner binary search.
			// The exponential search avoids pre-computing sizes for the full set of cells as a binary search would.
			// The overall complexity for this approach is O(log n).
			return this._exponentialSearch( lastMeasuredIndex, offset )
		}
	}
}





// *********************************************************************************************************
// 										ScalingCellSizeAndPositionManager.js
// *********************************************************************************************************


/**
 * Browsers have scroll offset limitations (eg Chrome stops scrolling at ~33.5M pixels where as Edge tops out at ~1.5M pixels).
 * After a certain position, the browser won't allow the user to scroll further (even via JavaScript scroll offset adjustments).
 * This util picks a lower ceiling for max size and artificially adjusts positions within to make it transparent for users.
 */

const DEFAULT_MAX_SCROLL_SIZE = 1500000

/**
 * Extends CellSizeAndPositionManager and adds scaling behavior for lists that are too large to fit within a browser's native limits.
 */

 class ScalingCellSizeAndPositionManager {
	
	constructor( cellCount, cellSizeGetter, estimatedCellSize, maxScrollSize = DEFAULT_MAX_SCROLL_SIZE ) {
	
		// Favor composition over inheritance to simplify IE10 support
		this._cellSizeAndPositionManager = new CellSizeAndPositionManager( cellCount, cellSizeGetter, estimatedCellSize );
		this._maxScrollSize = maxScrollSize;
	}

	configure( cellCount, estimatedCellSize ) {
		this._cellSizeAndPositionManager.configure( cellCount, estimatedCellSize );
	}

	getCellCount () {
		return this._cellSizeAndPositionManager.getCellCount();
	}

	getEstimatedCellSize () {
		return this._cellSizeAndPositionManager.getEstimatedCellSize();
	}

	getLastMeasuredIndex () {
		return this._cellSizeAndPositionManager.getLastMeasuredIndex();
	}

	/**
	* Number of pixels a cell at the given position (offset) should be shifted in order to fit within the scaled container.
	* The offset passed to this function is scalled (safe) as well.
	*/
	getOffsetAdjustment( containerSize, offset ) {
	
		const totalSize = this._cellSizeAndPositionManager.getTotalSize();
		const safeTotalSize = this.getTotalSize();
		const offsetPercentage = this._getOffsetPercentage( containerSize,offset,safeTotalSize );

		return Math.round(offsetPercentage * (safeTotalSize - totalSize));
	}

	getSizeAndPositionOfCell(index ) {
		return this._cellSizeAndPositionManager.getSizeAndPositionOfCell(index);
	}

	getSizeAndPositionOfLastMeasuredCell () {
		return this._cellSizeAndPositionManager.getSizeAndPositionOfLastMeasuredCell();
	}

	/** See CellSizeAndPositionManager#getTotalSize */
	getTotalSize () {
		return Math.min(this._maxScrollSize, this._cellSizeAndPositionManager.getTotalSize());
	}

	/** See CellSizeAndPositionManager#getUpdatedOffsetForIndex */
	getUpdatedOffsetForIndex( align /*= 'auto'*/, containerSize, currentOffset, targetIndex, totalSize ) {
		
		currentOffset = this._safeOffsetToOffset( containerSize, currentOffset );
		const offset = this._cellSizeAndPositionManager.getUpdatedOffsetForIndex( align, containerSize, currentOffset, targetIndex, totalSize );

		return this._offsetToSafeOffset( containerSize, offset );
	}

	/** See CellSizeAndPositionManager#getVisibleCellRange */
	getVisibleCellRange( containerSize, offset ) {
		offset = this._safeOffsetToOffset(containerSize,offset);
		return this._cellSizeAndPositionManager.getVisibleCellRange(containerSize,offset);
	}

	resetCell (index ) {
		this._cellSizeAndPositionManager.resetCell(index);
	}

	_getOffsetPercentage ( containerSize, offset, totalSize ) {
		return totalSize <= containerSize ? 0 : offset / (totalSize - containerSize);
	}

	_offsetToSafeOffset ( containerSize, offset ) {
	
		const totalSize = this._cellSizeAndPositionManager.getTotalSize();
		const safeTotalSize = this.getTotalSize();

		if (totalSize === safeTotalSize) {
			return offset
		}
		else {
			const offsetPercentage = this._getOffsetPercentage( containerSize,offset,totalSize);
			return Math.round(offsetPercentage * (safeTotalSize - containerSize))
		}
	}

	_safeOffsetToOffset( containerSize, offset ) {
	
		const totalSize = this._cellSizeAndPositionManager.getTotalSize();
		const safeTotalSize = this.getTotalSize();

		if (totalSize === safeTotalSize) {
			return offset
		}
		else {
			const offsetPercentage = this._getOffsetPercentage(containerSize,offset,safeTotalSize);
			return Math.round(offsetPercentage * (totalSize - containerSize));
		}
	}
}






// *********************************************************************************************************
// 										DefaultCellRangeRenderer.js
// *********************************************************************************************************



/**
 * Default implementation of cellRangeRenderer used by Grid.
 * This renderer supports cell-caching while the user is scrolling.
 */

function  defaultCellRangeRenderer ({
		cellCache,
		cellRenderer,
		columnSizeAndPositionManager,
		columnStartIndex,
		columnStopIndex,
		horizontalOffsetAdjustment,
		isScrolling,
		rowSizeAndPositionManager,
		rowStartIndex,
		rowStopIndex,
		scrollLeft,
		scrollTop,
		verticalOffsetAdjustment
	}) {
  
  	const renderedCells = []

	for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
		
		let rowDatum = rowSizeAndPositionManager.getSizeAndPositionOfCell(rowIndex)

		for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
			let columnDatum = columnSizeAndPositionManager.getSizeAndPositionOfCell(columnIndex)
			let key = `${rowIndex}-${columnIndex}`
			
			let style = {
				height: rowDatum.size,
				left: columnDatum.offset + horizontalOffsetAdjustment,
				position: 'absolute',
				top: rowDatum.offset + verticalOffsetAdjustment,
				width: columnDatum.size
			}

			let cellRendererParams = {
				columnIndex,
				isScrolling,
				key,
				rowIndex,
				style
			}

			let renderedCell

			// Avoid re-creating cells while scrolling.
			// This can lead to the same cell being created many times and can cause performance issues for "heavy" cells.
			// If a scroll is in progress- cache and reuse cells.
			// This cache will be thrown away once scrolling completes.
			// However if we are scaling scroll positions and sizes, we should also avoid caching.
			// This is because the offset changes slightly as scroll position changes and caching leads to stale values.
			// For more info refer to issue #395
			if ( isScrolling && !horizontalOffsetAdjustment && !verticalOffsetAdjustment ) {
			
				if (!cellCache[key]) {
					cellCache[key] = cellRenderer(cellRendererParams);
				}
			
				renderedCell = cellCache[key]
			
				// If the user is no longer scrolling, don't cache cells.
				// This makes dynamic cell content difficult for users and would also lead to a heavier memory footprint.
			} 
			else {
				renderedCell = cellRenderer(cellRendererParams);
			}

			if (renderedCell == null || renderedCell === false) {
				continue
			}

			renderedCells.push(renderedCell)
		}
	}

	return renderedCells
}



// *********************************************************************************************************
// 										Grid.js
// *********************************************************************************************************

/*
 * Grid class
 */

class Grid extends Component {

	constructor( ) {
		super( );

		this.setDataModel({

			/**
     		 * Set the width of the inner scrollable container to 'auto'.
             * This is useful for single-column Grids to ensure that the column doesn't extend below a vertical scrollbar.
             * {Boolean}
     		*/
    		autoContainerWidth: false,

			/**
			 * Removes fixed height from the scrollingContainer so that the total height
			 * of rows can stretch the window. Intended for use with WindowScroller
			 * {Boolean}
			 */
			autoHeight: false,

			/**
			 * Responsible for rendering a cell given an row and column index.
			 * Should implement the following interface: ({ columnIndex: number, rowIndex: number }): PropTypes.node
			 * {Function}
			 */
			cellRenderer: emptyFn,

			/**
			 * Responsible for rendering a group of cells given their index ranges.
			 * Should implement the following interface: ({
			 *   cellCache: Map,
			 *   cellRenderer: Function,
			 *   columnSizeAndPositionManager: CellSizeAndPositionManager,
			 *   columnStartIndex: number,
			 *   columnStopIndex: number,
			 *   isScrolling: boolean,
			 *   rowSizeAndPositionManager: CellSizeAndPositionManager,
			 *   rowStartIndex: number,
			 *   rowStopIndex: number,
			 *   scrollLeft: number,
			 *   scrollTop: number
			 * }): Array<PropTypes.node>
			 * {Function}
			 */
			cellRangeRenderer: defaultCellRangeRenderer,

			/**
			 * Optional custom CSS class name to attach to root Grid element.
			 * {String}
			 */
			className: '',

			/**
			 * Number of columns in grid.
			 * {Number}
			 */
			columnCount: 0,

			/**
			 * Either a fixed column width (number) or a function that returns the width of a column given its index.
			 * Should implement the following interface: (index: number): number
			 * {Number|Function}
			 */
			columnWidth: 0,

			/** Optional inline style applied to inner cell-container 
			 *	{String}
			 */
			containerStyle: '',

			/**
			 * Used to estimate the total width of a Grid before all of its columns have actually been measured.
			 * The estimated total width is adjusted as columns are rendered.
			 * {Number}
			 */
			estimatedColumnSize: 100,

			/**
			 * Used to estimate the total height of a Grid before all of its rows have actually been measured.
			 * The estimated total height is adjusted as rows are rendered.
			 * {Number}
			 */
			estimatedRowSize: 30,

			/**
			 * Height of Grid; this property determines the number of visible (vs virtualized) rows.
			 * {Number}
			 */
			height: 100,

			/**
			 * Optional custom id to attach to root Grid element.
			 * {String}
			 */
			id: '',

			/**
			 * Optional renderer to be used in place of rows when either :rowCount or :columnCount is 0.
			 * {Function}
			 */
			noContentRenderer: emptyFn,

			/**
			 * Callback invoked whenever the scroll offset changes within the inner scrollable region.
			 * This callback can be used to sync scrolling between lists, tables, or grids.
			 * ({ clientHeight, clientWidth, scrollHeight, scrollLeft, scrollTop, scrollWidth }): void
			 * {Function}
			 */
			onScroll: emptyFn,

			/**
			 * Callback invoked with information about the section of the Grid that was just rendered.
			 * ({ columnStartIndex, columnStopIndex, rowStartIndex, rowStopIndex }): void
			 * {Function}
			 */
			onSectionRendered: emptyFn,

			/**
			 * Number of columns to render before/after the visible section of the grid.
			 * These columns can help for smoother scrolling on touch devices or browsers that send scroll events infrequently.
			 * {Number}
			 */
			overscanColumnCount: 0,

			/**
			 * Number of rows to render above/below the visible section of the grid.
			 * These rows can help for smoother scrolling on touch devices or browsers that send scroll events infrequently.
			 * {Number}
			 */
			overscanRowCount: 10,

			/**
			 * Either a fixed row height (number) or a function that returns the height of a row given its index.
			 * Should implement the following interface: ({ index: number }): number
			 * {Number|Function}
			 */
			rowHeight: 30,

			/**
			 * Number of rows in grid.
			 * {Number}
			 */
			rowCount: 0,

			/** Wait this amount of time after the last scroll event before resetting Grid `pointer-events`. 
			 *	{Number}
			 */
			scrollingResetTimeInterval: 0,

			/** Horizontal offset.
			 * {Number}
			 */
			scrollLeft: 0,

			/**
			 * Controls scroll-to-cell behavior of the Grid.
			 * The default ("auto") scrolls the least amount possible to ensure that the specified cell is fully visible.
			 * Use "start" to align cells to the top/left of the Grid and "end" to align bottom/right.
			 * {String} - oneOf 'auto', 'end', 'start', 'center'
			 */
			scrollToAlignment: 'start',

			/**
			 * Column index to ensure visible (by forcefully scrolling if necessary)
			 * {Number}
			 */
			scrollToColumn: 0,

			/** Vertical offset. 
			 * {Number}
			 */
			scrollTop: 0,

			/**
			 * Row index to ensure visible (by forcefully scrolling if necessary)
			 * {Number}
			 */
			scrollToRow: 0,

			/** Optional inline style 
			 * {Object}
			 */
			style: {},

			/** Tab index for focus 
			 * {Number}
			 */
			tabIndex: 0,

			/**
			 * Width of Grid; this property determines the number of visible (vs virtualized) columns.
			 * {Number}
			 */
			width: 100,
		});

		this.on( {
			beforeMount: this.beforeMount,
			afterMount: this.afterMount,
			beforeUnmount: this.beforeUnmount,
			beforeUpdate: this.beforeUpdate, 
			afterUpdate: this.afterUpdate,
		});

		this.isScrolling 				= false;
	    this.scrollDirectionHorizontal  = SCROLL_DIRECTION_FIXED;
	    this.scrollDirectionVertical	= SCROLL_DIRECTION_FIXED;
	    this.scrollPositionChangeReason = '';
		this.columnsInitialized			= false;
	    
	    // Invokes onSectionRendered callback only when start/stop row or column indices change
	    this._onGridRenderedMemoizer 	= createCallbackMemoizer()
	    this._onScrollMemoizer 			= createCallbackMemoizer(false)

	    let data = this._data;

	    // Bind functions to instance so they don't lose context when passed around
	    this._enablePointerEventsAfterDelayCallback 	= this._enablePointerEventsAfterDelayCallback.bind(this);
	    this._invokeOnGridRenderedHelper 				= this._invokeOnGridRenderedHelper.bind(this);
	    this._onScroll 									= this._onScroll.bind(this);
	    this._updateScrollLeftForScrollToColumn 		= this._updateScrollLeftForScrollToColumn.bind(this);
	    this._updateScrollTopForScrollToRow 			= this._updateScrollTopForScrollToRow.bind(this);

	    //this._columnWidthGetter 						= this._wrapSizeGetter(data.columnWidth);
	    //this._rowHeightGetter 							= this._wrapSizeGetter(data.rowHeight);

	    //this._columnSizeAndPositionManager 	= new ScalingCellSizeAndPositionManager(
		//										data.columnCount,
		//										(index) => this._columnWidthGetter(index),
		//										this._getEstimatedColumnSize(data)
		//									);
//
//	    //this._rowSizeAndPositionManager 	= new ScalingCellSizeAndPositionManager(
//		//										data.rowCount,
//		//										(index) => this._rowHeightGetter(index),
//		//										this._getEstimatedRowSize(data)
		//									);

	    // See defaultCellRangeRenderer() for more information on the usage of this cache
	    this._cellCache	= {};

	    //this._refresh( );
	}

	/**
	* Pre-measure all columns and rows in a Grid.
	* Typically cells are only measured as needed and estimated sizes are used for cells that have not yet been measured.
	* This method ensures that the next call to getTotalSize() returns an exact size (as opposed to just an estimated one).
	*/
	measureAllCells() {
		this._columnSizeAndPositionManager.getSizeAndPositionOfCell( this.columnCount - 1);
		this._rowSizeAndPositionManager.getSizeAndPositionOfCell( this.rowCount - 1);
	}

	/**
	 * Forced recompute of row heights and column widths.
	 * This function should be called if dynamic column or row sizes have changed but nothing else has.
	 * Since Grid only receives :columnCount and :rowCount it has no way of detecting when the underlying data changes.
	 */
	
	recomputeGridSize( columnIndex = 0, rowIndex = 0 ) {
		
		this._columnSizeAndPositionManager.resetCell(columnIndex)
		this._rowSizeAndPositionManager.resetCell(rowIndex)

		// Clear cell cache in case we are scrolling;
		// Invalid row heights likely mean invalid cached content as well.
		this._cellCache = {}

		this._refresh( );
	}

	/**
	 * 
	 */
	
	afterMount( ) {
	    const { columnCount, scrollLeft, scrollToColumn, scrollTop, scrollToRow } = this._data;

	    // If this component was first rendered server-side, scrollbar size will be undefined.
	    // In that event we need to remeasure.
	    // 
	    if( !this._scrollbarSizeMeasured ) {
	      	this._scrollbarSize = getScrollbarSize();
	      	this._scrollbarSizeMeasured = true;
	      	this._refresh( true );
	    }

	    if( this.scrollLeft >= 0 || this.scrollTop >= 0) {
	      	this._setScrollPosition( scrollLeft, scrollTop );
	    }

	    if( columnCount ) {

		    if( scrollToColumn >= 0 || scrollToRow >= 0 ) {
		      	this._updateScrollLeftForScrollToColumn( );
		      	this._updateScrollTopForScrollToRow( );
		    }
		}
	    
	    // Update onRowsRendered callback
	    this._invokeOnGridRenderedHelper( );

	    // Initialize onScroll callback
	    this._invokeOnScrollMemoizer( 	this.scrollLeft || 0, 
	    								this.scrollTop || 0, 
	    								this._columnSizeAndPositionManager.getTotalSize(),
	    								this._rowSizeAndPositionManager.getTotalSize() );
	}

	/**
	 * @private
	 * This method updates scrollLeft/scrollTop in state for the following conditions:
	 * 1) New scroll-to-cell props have been set
	 */
	
	beforeUpdate( _, nextData ) {

		if( nextData.columnCount === 0 && nextData.scrollLeft !== 0 || nextData.rowCount === 0 && nextData.scrollTop !== 0 ) {
			this._setScrollPosition(0,0)
		}
		else if ( nextData.scrollLeft !== this._data.scrollLeft || nextData.scrollTop !== this._data.scrollTop ) {
			//this._setScrollPosition( nextData.scrollLeft, nextData.scrollTop );
		}

		this._columnWidthGetter = this._wrapSizeGetter(nextData.columnWidth)
		this._rowHeightGetter   = this._wrapSizeGetter(nextData.rowHeight)

		this._columnSizeAndPositionManager.configure(
			nextData.columnCount,
			this._getEstimatedColumnSize(nextData)
		);

		this._rowSizeAndPositionManager.configure(
			nextData.rowCount,
			this._getEstimatedRowSize(nextData)
		);

		// Update scroll offsets if the size or number of cells have changed, invalidating the previous value
		calculateSizeAndPositionDataAndUpdateScrollOffset({
		  	cellCount: this._data.columnCount,
		  	cellSize: this._data.columnWidth,
		  	computeMetadataCallback: () => this._columnSizeAndPositionManager.resetCell(0),
		  	computeMetadataCallbackProps: this._data,
		  	nextCellsCount: nextData.columnCount,
		  	nextCellSize: nextData.columnWidth,
		  	nextScrollToIndex: nextData.scrollToColumn,
		  	scrollToIndex: this._data.scrollToColumn,
		  	updateScrollOffsetForScrollToIndex: () => this._updateScrollLeftForScrollToColumn(nextData)
		});

		calculateSizeAndPositionDataAndUpdateScrollOffset({
			cellCount: this._data.rowCount,
			cellSize: this._data.rowHeight,
			computeMetadataCallback: () => this._rowSizeAndPositionManager.resetCell(0),
			computeMetadataCallbackProps: this._data,
			nextCellsCount: nextData.rowCount,
			nextCellSize: nextData.rowHeight,
			nextScrollToIndex: nextData.scrollToRow,
			scrollToIndex: this._data.scrollToRow,
			updateScrollOffsetForScrollToIndex: () => this._updateScrollTopForScrollToRow(nextState)
		})

		this._calculateChildrenToRender(nextData);
	}
	
  	afterUpdate( prevData ) {

  		const data = this._data;

		const { autoHeight, 
				columnCount, 
				columnWidth,
				height, 
				rowCount, 
				rowHeight,
				scrollToAlignment, 
				scrollToColumn, 
				scrollToRow, 
				width,
				scrollLeft,
				scrollTop } = data;

		const scrollPositionChangeReason = this.scrollPositionChangeReason;

//		if( columnCount === 0 && scrollLeft !== 0 || rowCount === 0 && scrollTop !== 0 ) {
//		   	this._setScrollPosition( 0, 0 );
//		} 
//		else if ( scrollLeft !== prevData.scrollLeft || scrollTop !== prevData.scrollTop ) {
//		   	this._setScrollPosition( scrollLeft, scrollTop );
//		}
//
//		this._columnWidthGetter	= this._wrapSizeGetter(columnWidth);
//		this._rowHeightGetter 	= this._wrapSizeGetter(rowHeight);
//
//		if( prevData.columnCount!=columnCount ) {
//			this._columnSizeAndPositionManager.configure(columnCount,this._getEstimatedColumnSize(data));
//		}
//
//		if( prevData.rowCount!=rowCount ) {
//			this._rowSizeAndPositionManager.configure(rowCount,this._getEstimatedRowSize(data));
//		}
//
//		if( prevData.columnCount!=columnCount ) {
//			// Update scroll offsets if the size or number of cells have changed, invalidating the previous value
//			calculateSizeAndPositionDataAndUpdateScrollOffset({
//			  	cellCount: prevData.columnCount,
//			  	cellSize: prevData.columnWidth,
//			  	computeMetadataCallback: () => this._columnSizeAndPositionManager.resetCell(0),
//			  	computeMetadataCallbackProps: data,
//			  	nextCellsCount: data.columnCount,
//			  	nextCellSize: data.columnWidth,
//			  	nextScrollToIndex: data.scrollToColumn,
//			  	scrollToIndex: prevData.scrollToColumn,
//			  	updateScrollOffsetForScrollToIndex: () => this._updateScrollLeftForScrollToColumn(data)
//			});
//		}
//
//		if( prevData.rowCount!=rowCount ) {
//			calculateSizeAndPositionDataAndUpdateScrollOffset({
//			  	cellCount: prevData.rowCount,
//			  	cellSize: prevData.rowHeight,
//			  	computeMetadataCallback: () => this._rowSizeAndPositionManager.resetCell(0),
//			  	computeMetadataCallbackProps: data,
//			  	nextCellsCount: data.rowCount,
//			  	nextCellSize: data.rowHeight,
//			  	nextScrollToIndex: data.scrollToRow,
//			  	scrollToIndex: prevData.scrollToRow,
//			  	updateScrollOffsetForScrollToIndex: () => this._updateScrollTopForScrollToRow(data)
//			});
//		}
//
//
//		this._calculateChildrenToRender( data );
		
		// Handle edge case where column or row count has only just increased over 0.
		// In this case we may have to restore a previously-specified scroll offset.
		// For more info see bvaughn/react-virtualized/issues/218
		const columnOrRowCountJustIncreasedFromZero = (columnCount > 0 && prevData.columnCount === 0 || rowCount > 0 && prevData.rowCount === 0 );

		// Make sure requested changes to :scrollLeft or :scrollTop get applied.
		// Assigning to scrollLeft/scrollTop tells the browser to interrupt any running scroll animations,
		// And to discard any pending async changes to the scroll position that may have happened in the meantime (e.g. on a separate scrolling thread).
		// So we only set these when we require an adjustment of the scroll position.
		// See issue #2 for more information.
		if (scrollPositionChangeReason === SCROLL_POSITION_CHANGE_REASONS.REQUESTED) {
			if( scrollLeft >= 0 && 
				( scrollLeft !== prevState.scrollLeft && 
				  scrollLeft !== this._scrollingContainer.scrollLeft ||
				  columnOrRowCountJustIncreasedFromZero ) ) {

				this._scrollingContainer.scrollLeft = scrollLeft
			}

			// @TRICKY :autoHeight property instructs Grid to leave :scrollTop management to an external HOC (eg WindowScroller).
			// In this case we should avoid checking scrollingContainer.scrollTop since it forces layout/flow.
			if ( !autoHeight && scrollTop >= 0 && 
				( scrollTop !== prevState.scrollTop &&
				  scrollTop !== this._scrollingContainer.scrollTop ||
				  columnOrRowCountJustIncreasedFromZero	)) {

				this._scrollingContainer.scrollTop = scrollTop
			}
		}

		// Update scroll offsets if the current :scrollToColumn or :scrollToRow values requires it
		// @TODO Do we also need this check or can the one in componentWillUpdate() suffice?
		updateScrollIndexHelper({
			cellSizeAndPositionManager: this._columnSizeAndPositionManager,
			previousCellsCount: prevData.columnCount,
			previousCellSize: prevData.columnWidth,
			previousScrollToAlignment: prevData.scrollToAlignment,
			previousScrollToIndex: prevData.scrollToColumn,
			previousSize: prevData.width,
			scrollOffset: scrollLeft,
			scrollToAlignment,
			scrollToIndex: scrollToColumn,
			size: width,
			updateScrollIndexCallback: (scrollToColumn) => {
				this._updateScrollLeftForScrollToColumn( this._data, scrollToColumn );
			}
		});

		updateScrollIndexHelper({
			cellSizeAndPositionManager: this._rowSizeAndPositionManager,
			previousCellsCount: prevData.rowCount,
			previousCellSize: prevData.rowHeight,
			previousScrollToAlignment: prevData.scrollToAlignment,
			previousScrollToIndex: prevData.scrollToRow,
			previousSize: prevData.height,
			scrollOffset: scrollTop,
			scrollToAlignment,
			scrollToIndex: scrollToRow,
			size: height,
			updateScrollIndexCallback: (scrollToRow) => {
				this._updateScrollTopForScrollToRow( this._data, scrollToRow );
			}
		});

		// Update onRowsRendered callback if start/stop indices have changed
		this._invokeOnGridRenderedHelper();

		// Changes to :scrollLeft or :scrollTop should also notify :onScroll listeners
		if ( scrollLeft !== prevData.scrollLeft || scrollTop !== prevData.scrollTop ) {
			const totalRowsHeight = this._rowSizeAndPositionManager.getTotalSize();
			const totalColumnsWidth = this._columnSizeAndPositionManager.getTotalSize();

			this._invokeOnScrollMemoizer( scrollLeft, scrollTop, totalColumnsWidth, totalRowsHeight );
		}
	}

	/**
	 * 
	 */
	
	beforeMount () {

		// If this component is being rendered server-side, getScrollbarSize() will return undefined.
		// We handle this case in componentDidMount()
		this._scrollbarSize = getScrollbarSize()

		if (this._scrollbarSize === undefined) {
			this._scrollbarSizeMeasured = false;
		  	this._scrollbarSize = 0;
		} 
		else {
			this._scrollbarSizeMeasured = true;
		}

		this._columnSizeAndPositionManager 	= new ScalingCellSizeAndPositionManager(
												this._data.columnCount,
												(index) => this._columnWidthGetter(index),
												this._getEstimatedColumnSize(this._data)
											);

	    this._rowSizeAndPositionManager 	= new ScalingCellSizeAndPositionManager(
												this._data.rowCount,
												(index) => this._rowHeightGetter(index),
												this._getEstimatedRowSize(this._data)
											);

	    this._columnWidthGetter 	= this._wrapSizeGetter(this._data.columnWidth);
	    this._rowHeightGetter 		= this._wrapSizeGetter(this._data.rowHeight);

		this._calculateChildrenToRender( this._data );
	}

	beforeUnmount() {
	    if (this._disablePointerEventsTimeoutId) {
	      	clearTimeout( this._disablePointerEventsTimeoutId )
	    }
	}

	/**
	 * [render description]
	 * @return {[type]} [description]
	 */
	
	render( ) {
		const {
			autoContainerWidth,
			autoHeight,
			className,
			containerStyle,
			height,
			id,
			noContentRenderer,
			style,
			tabIndex,
			width,
			} = this._data;

		const isScrolling = this.isScrolling;
		
		const gridStyle = {
			boxSizing: 'border-box',
			height: autoHeight ? 'auto' : height,
			position: 'relative',
			width,
			WebkitOverflowScrolling: 'touch',
			//willChange: 'transform'
		};


		const totalColumnsWidth = this._columnSizeAndPositionManager.getTotalSize();
		const totalRowsHeight 	= this._rowSizeAndPositionManager.getTotalSize();

		// Force browser to hide scrollbars when we know they aren't necessary.
		// Otherwise once scrollbars appear they may not disappear again.
		// For more info see issue #116
		const verticalScrollBarSize 	= totalRowsHeight > height ? this._scrollbarSize : 0
		const horizontalScrollBarSize 	= totalColumnsWidth > width ? this._scrollbarSize : 0

		// Also explicitly init styles to 'auto' if scrollbars are required.
		// This works around an obscure edge case where external CSS styles have not yet been loaded,
		// But an initial scroll index of offset is set as an external prop.
		// Without this style, Grid would render the correct range of cells but would NOT update its internal offset.
		// This was originally reported via clauderic/react-infinite-calendar/issues/23
		gridStyle.overflowX = totalColumnsWidth + verticalScrollBarSize <= width ? 'hidden' : 'auto';
		gridStyle.overflowY = totalRowsHeight + horizontalScrollBarSize <= height ? 'hidden' : 'auto';

		const childrenToDisplay = this._childrenToDisplay || [];
		const showNoContentRenderer = (childrenToDisplay.length === 0 && height > 0 && width > 0 );


		let items;
		if( childrenToDisplay.length>0 ) {

			items = [{
				cls: 'x-grid-inner-scroll-container',
				style: {
					width: autoContainerWidth ? 'auto' : totalColumnsWidth,
					height: totalRowsHeight,
					maxWidth: totalColumnsWidth,
					maxHeight: totalRowsHeight,
					overflow: 'hidden',
					pointerEvents: isScrolling ? 'none' : '',
/*TODO:					...containerStyle*/
				},
				items: childrenToDisplay
			}];
		}
		else {
			if( showNoContentRenderer ) {
				items =  noContentRenderer();
			}
		}


		return {
			ref: (ref) => {this._scrollingContainer = ref},
			cls: className + ' x-grid',
			id: id,
			onScroll: this._onScroll,
			style: gridStyle,
			tabIndex: tabIndex,
			items: items
		};
	}

	/* ---------------------------- Helper methods ---------------------------- */

	_calculateChildrenToRender( props = this._data ) {
		const {
			cellRenderer,
			cellRangeRenderer,
			columnCount,
			height,
			overscanColumnCount,
			overscanRowCount,
			rowCount,
			scrollLeft,
			scrollTop,
			width,
			_isScrolling: isScrolling,
			_scrollDirectionHorizontal: scrollDirectionHorizontal,
			_scrollDirectionVertical: scrollDirectionVertical
		} = props;

		this._childrenToDisplay = [];

		// Render only enough columns and rows to cover the visible area of the grid.
		if (height > 0 && width > 0) {
			const visibleColumnIndices = this._columnSizeAndPositionManager.getVisibleCellRange( width, scrollLeft );
			const visibleRowIndices = this._rowSizeAndPositionManager.getVisibleCellRange( height, scrollTop );
			const horizontalOffsetAdjustment = this._columnSizeAndPositionManager.getOffsetAdjustment( width, scrollLeft );
			const verticalOffsetAdjustment = this._rowSizeAndPositionManager.getOffsetAdjustment( height, scrollTop );

			// Store for _invokeOnGridRenderedHelper()
			this._renderedColumnStartIndex = visibleColumnIndices.start;
			this._renderedColumnStopIndex = visibleColumnIndices.stop;
			this._renderedRowStartIndex = visibleRowIndices.start;
			this._renderedRowStopIndex = visibleRowIndices.stop;

			const overscanColumnIndices = getOverscanIndices(
				columnCount,
				overscanColumnCount,
				scrollDirectionHorizontal,
				this._renderedColumnStartIndex,
				this._renderedColumnStopIndex
			);

			const overscanRowIndices = getOverscanIndices(
				rowCount,
				overscanRowCount,
				scrollDirectionVertical,
				this._renderedRowStartIndex,
				this._renderedRowStopIndex
			);

			// Store for _invokeOnGridRenderedHelper()
			this._columnStartIndex = overscanColumnIndices.overscanStartIndex
			this._columnStopIndex = overscanColumnIndices.overscanStopIndex
			this._rowStartIndex = overscanRowIndices.overscanStartIndex
			this._rowStopIndex = overscanRowIndices.overscanStopIndex

			this._childrenToDisplay = cellRangeRenderer({
				cellCache: this._cellCache,
				cellRenderer,
				columnSizeAndPositionManager: this._columnSizeAndPositionManager,
				columnStartIndex: this._columnStartIndex,
				columnStopIndex: this._columnStopIndex,
				horizontalOffsetAdjustment,
				isScrolling,
				rowSizeAndPositionManager: this._rowSizeAndPositionManager,
				rowStartIndex: this._rowStartIndex,
				rowStopIndex: this._rowStopIndex,
				scrollLeft,
				scrollTop,
				verticalOffsetAdjustment
			});
		}
	}

	/**
	* Sets an :isScrolling flag for a small window of time.
	* This flag is used to disable pointer events on the scrollable portion of the Grid.
	* This prevents jerky/stuttery mouse-wheel scrolling.
	*/
	_enablePointerEventsAfterDelay () {

		const { scrollingResetTimeInterval } = this._data;

		if (this._disablePointerEventsTimeoutId) {
			clearTimeout(this._disablePointerEventsTimeoutId);
		}

		this._disablePointerEventsTimeoutId = setTimeout(
			this._enablePointerEventsAfterDelayCallback,
			scrollingResetTimeInterval
		);
	}

	_enablePointerEventsAfterDelayCallback () {
		this._disablePointerEventsTimeoutId = null

		// Throw away cell cache once scrolling is complete
		this._cellCache = {}

		this.isScrolling = false;
		this.scrollDirectionHorizontal = SCROLL_DIRECTION_FIXED;
		this.scrollDirectionVertical = SCROLL_DIRECTION_FIXED;
	}

	_getEstimatedColumnSize (data) {
		return isNumber( data.columnWidth ) ? data.columnWidth : data.estimatedColumnSize;
	}

	_getEstimatedRowSize (data) {
		return isNumber( data.rowHeight ) ? data.rowHeight : data.estimatedRowSize;
	}

	_invokeOnGridRenderedHelper () {
	
		const { onSectionRendered } = this._data;

		this._onGridRenderedMemoizer({
			callback: onSectionRendered,
			indices: {
				columnOverscanStartIndex: this._columnStartIndex,
				columnOverscanStopIndex: this._columnStopIndex,
				columnStartIndex: this._renderedColumnStartIndex,
				columnStopIndex: this._renderedColumnStopIndex,
				rowOverscanStartIndex: this._rowStartIndex,
				rowOverscanStopIndex: this._rowStopIndex,
				rowStartIndex: this._renderedRowStartIndex,
				rowStopIndex: this._renderedRowStopIndex
			}
		})
	}

	_invokeOnScrollMemoizer( scrollLeft, scrollTop, totalColumnsWidth, totalRowsHeight ) {
		this._onScrollMemoizer({
			callback: ({ scrollLeft, scrollTop }) => {
				const { height, onScroll, width } = this._data;

				onScroll({
					clientHeight: height,
					clientWidth: width,
					scrollHeight: totalRowsHeight,
					scrollLeft,
					scrollTop,
					scrollWidth: totalColumnsWidth
				})
			},
		
			indices: {
				scrollLeft,
				scrollTop
			}
		});
	}

	_setScrollPosition ( scrollLeft, scrollTop ) {

		let refresh = false;

		if (scrollLeft >= 0 && this._data.scrollLeft != scrollLeft ) {
			this._data.scrollLeft = scrollLeft;
			refresh = true;
		}

		if (scrollTop >= 0 && scrollTop !== this.scrollTop ) {
			this._data.scrollTop = scrollTop
			refresh = true;
		}

		if ( refresh ) {
			this._calculateChildrenToRender( this._data );
			this._refresh( );
		}
	}

	_wrapPropertyGetter (value) {
		return value instanceof Function ? value : () => value
	}

	_wrapSizeGetter (size) {
		return this._wrapPropertyGetter(size)
	}

	_updateScrollLeftForScrollToColumn( props, scrollToColumn=0 ) {
		
		props = props || this._data;
		const { columnCount, scrollLeft, scrollToAlignment, width } = props
		
		if (scrollToColumn >= 0 && columnCount > 0) {
			const targetIndex = Math.max(0, Math.min(columnCount - 1, scrollToColumn))

			const calculatedScrollLeft = this._columnSizeAndPositionManager.getUpdatedOffsetForIndex( scrollToAlignment, width, scrollLeft, targetIndex );

			if (scrollLeft !== calculatedScrollLeft) {
				this._setScrollPosition( calculatedScrollLeft, undefined );
			}
		}
	}

	_updateScrollTopForScrollToRow( props, scrollToRow=0 ) {
		
		props = props || this._data;
		const { height, rowCount, scrollTop, scrollToAlignment } = props
		
		if (scrollToRow >= 0 && rowCount > 0) {
			const targetIndex = Math.max(0, Math.min(rowCount - 1, scrollToRow))
			const calculatedScrollTop = this._rowSizeAndPositionManager.getUpdatedOffsetForIndex( scrollToAlignment, height, scrollTop, targetIndex );

			if (scrollTop !== calculatedScrollTop) {
				this._setScrollPosition( undefined, calculatedScrollTop );
			}
		}
	}

	_onScroll (event) {
		// In certain edge-cases React dispatches an onScroll event with an invalid target.scrollLeft / target.scrollTop.
		// This invalid event can be detected by comparing event.target to this component's scrollable DOM element.
		// See issue #404 for more information.
		if (event.target !== this._scrollingContainer) {
			return
		}

		// Prevent pointer events from interrupting a smooth scroll
		this._enablePointerEventsAfterDelay()

		// When this component is shrunk drastically, React dispatches a series of back-to-back scroll events,
		// Gradually converging on a scrollTop that is within the bounds of the new, smaller height.
		// This causes a series of rapid renders that is slow for long lists.
		// We can avoid that by doing some simple bounds checking to ensure that scrollTop never exceeds the total height.
		const { height, width } = this._data;
		const scrollbarSize = this._scrollbarSize
		const totalRowsHeight = this._rowSizeAndPositionManager.getTotalSize()
		const totalColumnsWidth = this._columnSizeAndPositionManager.getTotalSize()
		const scrollLeft = Math.min(Math.max(0, totalColumnsWidth - width + scrollbarSize), event.target.scrollLeft)
		const scrollTop = Math.min(Math.max(0, totalRowsHeight - height + scrollbarSize), event.target.scrollTop)

		// Certain devices (like Apple touchpad) rapid-fire duplicate events.
		// Don't force a re-render if this is the case.
		// The mouse may move faster then the animation frame does.
		// Use requestAnimationFrame to avoid over-updating.
		if ( this.scrollLeft !== scrollLeft || this.scrollTop !== scrollTop ) {
			// Track scrolling direction so we can more efficiently overscan rows to reduce empty space around the edges while scrolling.
			const scrollDirectionVertical = scrollTop > this.scrollTop ? SCROLL_DIRECTION_FORWARD : SCROLL_DIRECTION_BACKWARD
			const scrollDirectionHorizontal = scrollLeft > this.scrollLeft ? SCROLL_DIRECTION_FORWARD : SCROLL_DIRECTION_BACKWARD

			this.isScrolling = true;
			this.scrollDirectionHorizontal = scrollDirectionHorizontal;
			this.scrollDirectionVertical = scrollDirectionVertical;
			this.scrollPositionChangeReason = SCROLL_POSITION_CHANGE_REASONS.OBSERVED;
				
			this._data.scrollLeft = scrollLeft;
			this._data.scrollTop  = scrollTop;

			this._calculateChildrenToRender( this._data );
			this._refresh( );
		}

		this._invokeOnScrollMemoizer( scrollLeft, scrollTop, totalColumnsWidth, totalRowsHeight );
	}
}

$$.Grid = Grid;

})( window || this );
