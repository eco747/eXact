(function($$) {


	class 	DataReader
	{
		constructor( { model } ) {
			this._model = model;
		}

		readRecords( data ) {
		}
	}

	class 	JsonReader extends DataReader
	{
		readRecords( raw ) {

			let records = [];

			if( isString(raw) ) {
				raw = JSON.parse( raw );
			}

			if( isArray(raw) ) {

				let len = raw.length,
					i;

				for( i=0; i<len; i++ ) {
					records.push( this._model.convert( raw[i] ) );
				}
			}

			return records;
		}
	}

	/**
	 *
	 */

	class 	DataStore 
	{
		constructor( {model, reader} ) {
			
			this._model  = model;
			this._data   = null;

			if( isString(reader) ) {
				switch( reader ) {
					case 'json':
						reader = new JsonReader( {model:mode} );
						break;
					default:
						throw 'Unknown DataReader type: ' + reader;
				}
			}

			this._reader = reader;
			
		}

		load( data ) {
			this._data 	= this._reader.readRecords(data);
		}

		getCount( ) {
			return this._data ? this._data.length : 0;
		}

		getAt( index ) {
			if( !this._data ) {
				return;
			}

			if( index<0 || index>=this.data.length ) {
				return;
			}

			return new this._data[index];
		}
	}

	/**
	 *
	 */

	class 	Row extends Component
	{

	}

	/**
	 *
	 */

	class 	Header extends Row
	{
		constructor( ) {
			super( );

			this.setDataModel({
				height: 24
			});
		}

		render( ) {

			const { height } = this._data;

			return {
				style: {
					height: height,
				}
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
				totalHeight: 0
			});
		}		

		render( ) {
			const {totalWidth,totalHeight} = this._data;

			return {
				style: {
					width: totalWidth,
					height: totalHeight
				}
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
			
			this.content = content;
		}

		render( ) {

			return {
				style: {
					overflow: 'auto'
				},
				items: this.content
			};
		}
	}


	/**
	 *
	 */

	class 	Grid extends Component
	{
		constructor( ) {
			super( );

			this.setDataModel({

				/**
				 *
				 */

				columns: [],

				/**
				 *
				 */

				dataStore: null,
			});

			this.header = new Header( );
			this.content = new Container( );
			this.viewport = new Viewport( this.content );

			this.content.setTotalWidth( 5000 );
			this.content.setTotalHeight( 5000 );
		}

		render( ) {
			return {
				style: {
					left: 0,
					top: 50,
					right: 0,
					bottom: 70,
					position: 'absolute'
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