
window.onload = function( ) {

	/**
	 * Generate random data for use in examples.
	 */
	
	function generateRandomList () {
	  const list = []

	  for (var i = 0; i < 1000; i++) {
	    list.push({
	      color: BADGE_COLORS[i % BADGE_COLORS.length],
	      index: i,
	      name: NAMES[i % NAMES.length],
	      random: loremIpsum[i % loremIpsum.length],
	      size: ROW_HEIGHTS[Math.floor(Math.random() * ROW_HEIGHTS.length)]
	    })
	  }

	  return list
	}

	const BADGE_COLORS = ['#f44336', '#3f51b5', '#4caf50', '#ff9800', '#2196f3', '#374046', '#cddc39', '#2196f3', '#9c27b0', '#ffc107', '#009688', '#673ab7', '#ffeb3b', '#cddc39', '#795548']
	const NAMES = ['Peter Brimer', 'Tera Gaona', 'Kandy Liston', 'Lonna Wrede', 'Kristie Yard', 'Raul Host', 'Yukiko Binger', 'Velvet Natera', 'Donette Ponton', 'Loraine Grim', 'Shyla Mable', 'Marhta Sing', 'Alene Munden', 'Holley Pagel', 'Randell Tolman', 'Wilfred Juneau', 'Naida Madson', 'Marine Amison', 'Glinda Palazzo', 'Lupe Island', 'Cordelia Trotta', 'Samara Berrier', 'Era Stepp', 'Malka Spradlin', 'Edward Haner', 'Clemencia Feather', 'Loretta Rasnake', 'Dana Hasbrouck', 'Sanda Nery', 'Soo Reiling', 'Apolonia Volk', 'Liliana Cacho', 'Angel Couchman', 'Yvonne Adam', 'Jonas Curci', 'Tran Cesar', 'Buddy Panos', 'Rosita Ells', 'Rosalind Tavares', 'Renae Keehn', 'Deandrea Bester', 'Kelvin Lemmon', 'Guadalupe Mccullar', 'Zelma Mayers', 'Laurel Stcyr', 'Edyth Everette', 'Marylin Shevlin', 'Hsiu Blackwelder', 'Mark Ferguson', 'Winford Noggle', 'Shizuko Gilchrist', 'Roslyn Cress', 'Nilsa Lesniak', 'Agustin Grant', 'Earlie Jester', 'Libby Daigle', 'Shanna Maloy', 'Brendan Wilken', 'Windy Knittel', 'Alice Curren', 'Eden Lumsden', 'Klara Morfin', 'Sherryl Noack', 'Gala Munsey', 'Stephani Frew', 'Twana Anthony', 'Mauro Matlock', 'Claudie Meisner', 'Adrienne Petrarca', 'Pearlene Shurtleff', 'Rachelle Piro', 'Louis Cocco', 'Susann Mcsweeney', 'Mandi Kempker', 'Ola Moller', 'Leif Mcgahan', 'Tisha Wurster', 'Hector Pinkett', 'Benita Jemison', 'Kaley Findley', 'Jim Torkelson', 'Freda Okafor', 'Rafaela Markert', 'Stasia Carwile', 'Evia Kahler', 'Rocky Almon', 'Sonja Beals', 'Dee Fomby', 'Damon Eatman', 'Alma Grieve', 'Linsey Bollig', 'Stefan Cloninger', 'Giovanna Blind', 'Myrtis Remy', 'Marguerita Dostal', 'Junior Baranowski', 'Allene Seto', 'Margery Caves', 'Nelly Moudy', 'Felix Sailer']
	const ROW_HEIGHTS = [50, 75, 100]

	const loremIpsum = [
	  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
	  'Phasellus vulputate odio commodo tortor sodales, et vehicula ipsum viverra.',
	  'Cras tincidunt nisi in urna molestie varius.',
	  'Curabitur ac enim dictum arcu varius fermentum vel sodales dui.',
	  'Ut tristique augue at congue molestie.',
	  'Cras eget enim nec odio feugiat tristique eu quis ante.',
	  'Phasellus eget enim vitae nunc luctus sodales a eu erat.',
	  'Nulla bibendum quam id velit blandit dictum.',
	  'Donec dignissim mi ac libero feugiat, vitae lacinia odio viverra.',
	  'Praesent vel lectus venenatis, elementum mauris vitae, ullamcorper nulla.',
	  'Quisque sollicitudin nulla nec tellus feugiat hendrerit.',
	  'Vestibulum a eros accumsan, lacinia eros non, pretium diam.',
	  'Donec ornare felis et dui hendrerit, eget bibendum nibh interdum.',
	  'Donec nec diam vel tellus egestas lobortis.',
	  'Sed ornare nisl sit amet dolor pellentesque, eu fermentum leo interdum.',
	  'Sed eget mauris condimentum, molestie justo eu, feugiat felis.',
	  'Sed luctus justo vitae nibh bibendum blandit.',
	  'Nulla ac eros vestibulum, mollis ante eu, rutrum nulla.',
	  'Sed cursus magna ut vehicula rutrum.'
	]



	class GridSample extends Grid {

		constructor( ) {
		    super( );

		    this._datum = generateRandomList( );

		    this.updateData( {
		    	columnCount: 20,
				width: 2560,
				height: 650,
				overscanColumnCount: 0,
				overscanRowCount: 3,
				rowHeight: 40,
				rowCount: 1000,
				useDynamicRowHeight: false,
				cellRenderer: this._cellRenderer.bind(this),
				columnWidth: this._getColumnWidth.bind(this),
			});

			
		}

		_cellRenderer( {columnIndex, key, rowIndex, style} ) {
			if (columnIndex === 0) {
				return this._renderLeftSideCell( key, rowIndex, style );
			} 
			else {
				return this._renderBodyCell( columnIndex, key, rowIndex, style );
			}
		}

		_getColumnWidth ({ index }) {
			switch (index) {
			case 0:
				return 50
			case 1:
				return 150
			case 2:
				return 300
			default:
				return 100
			}
		}

		_getDatum (index) {
			const list = this._datum;
			return list[index % list.length];
		}

		_getRowClassName (row,col) {
			let cls = row % 2 === 0 ? 'x-grid-reven' : 'x-grid-rodd';
			return 'x-cell x-cell-col'+ col + ' ' + cls;
		}

		_renderBodyCell( columnIndex, key, rowIndex, style ) {
			const rowClass = this._getRowClassName(rowIndex,columnIndex);
			const datum = this._getDatum(rowIndex);

			let content;

			switch (columnIndex) {
			case 1:
				content = datum.name
				break
			case 2:
				content = datum.random
				break
			default:
				content = `r:${rowIndex}, c:${columnIndex}`
				break
			}

			const classNames = rowClass;

			return {
				cls: classNames,
				key: key,
				style: style,
				items: content
			}
		}

		_renderLeftSideCell( key, rowIndex, style ) {
			const datum = this._getDatum(rowIndex)
			const classNames = this._getRowClassName(rowIndex,1);

			style.backgroundColor = datum.color;

			return {
				cls: classNames,
				key: key,
				style: style,
				content: datum.name.charAt(0)
			}
		}
	}


	/**
	 *
	 */

	class App extends Component
	{
		constructor( ) {

			super( );
			
			this.header 	= new AppBar( 'Application', 'fa@thermometer-empty' );
			this.botbar  	= new BottomNavigation( );
			
			let 	b1 		= new BottomNavigationItem( 'Recent', 'fa@undo' );
			b1.onclick 		= () => this.recentClick;

			let 	b2 		= new BottomNavigationItem( 'BlueTooth', 'fa@bluetooth' );
			
			this.botbar._buttons = [
				b1, b2
			];

			this.grid		= new GridSample( );

			this.startTimer( 1000, true, function() {
				b1.text = new Date().toLocaleString();
			} );
		}

		onRender( ) {
			return {
				cls: 'x-unselectable',
				items: [
					this.header,
					this.grid,
					this.botbar
				]
			};
		}

		recentClick( ) {
			//new Mask( );
		}
	}  

	//new App().renderTo( document.body );
	App.renderTo(
		document.body
	);
}












