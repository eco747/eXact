// *********************************************************************************************************
// 										DATA Model
// *********************************************************************************************************


/**
 * Data field hold the description & access function to data fields.
 * 	type:
 * 		'string'
 * 		'number'
 * 		'boolean'
 * 		'date'
 *
 * 	TODO: 'sql-date'
 */

class 	DataField
{
	/**
	 * @constructor
	 * @param  {string} options.name - field name 
	 * @param  {string} options.type - field type (one of 'string','number','boolean','date')
	 * @param  {any} options.defValue - default value
	 * @param  {function} options.convert - converter function
	 * @param  {[type]} options.auto     [description]
	 * @param  {number} options.idx - field index
	 */
	
	constructor( { name, type, defValue, convert, auto, idx } ) {

		this._name = name;
		this._idx  = idx;
		this._type = type || 'string';
		
		if( defValue ) {
		 	this._defValue = defValue;
		}

		if( convert ) {
			this._convert = convert;
		}

		if( auto ) {
			this._auto = auto;
		}
	}

	/**
	 * get the field value
	 * @param  {array} buffer - buffer to look into
	 * @return {any} - field value 
	 */
	
	get( buffer ) {

		let { _type, _defValue, _convert, _auto } = this,
			v;

		if( isArray(buffer) ) {
			v = buffer[this._idx];	
		}
		else {
			v = buffer[this._name];	
		} 

		// any converter ?
		if( _convert ) {
			v = _convert( v );
		}

		// empty & default value ?
		if( v===undefined ) {
			
			if( _auto ) {
				v = _auto( );
			}
			else if( _defValue ) {
				v = _defValue;
			}
		}
		
		// forced type ?
		if( _type ) {
			v = coerce( v, _type );
		}

		return v;
	}

	/**
	 * TODO
	 * @param {[type]} buffer [description]
	 */
	
	set( buffer ) {
		this._raw[name]	= value;
	}
}

/**
 *	A Model represents some object that your application manages. 
 *	Models are defined as a set of fields and any arbitrary methods and properties relevant to the model
 *	A Model definition always has an identifying field which should yield a unique key for each instance. 
 *	By default, a field named "id" will be created with a mapping of "id". 
 *
 *  TODO: keep track of dirty on set (use meta-data field)
 *  TODO: save 
 */

class 	DataModel 
{
	constructor( { fields, idProperty } ) {

		this._watched = {};
		this._raw 	  = {};
		this._gen_id  = 1;

		this._idProperty = idProperty || 'id';
		this._build( fields );
	}

	setRawData( raw ) {
		this._raw = raw;
	}

	get( name ) {
		return this._get( name, this._raw );
	}

	set( name, value ) {
		this._set( name, value, this._raw );
	}

	/**
	 * convert raw data 
	 * internally, records are stored a an array of fields
	 * this function is responsible to do the transformation
	 * copying only known fields in the array
	 * 
	 * an element is added at the end to store internal data (meta-datas for this record)
	 * initially null
	 */
	
	convert( rawData ) {

		let record = [],
			fields = this._fields;

		for( let f in fields ) {
			record.push( fields[f].get( rawData ) );
		}

		// push meta datas
		record.push( null );

		return record;
	}

	/**
	 * return the internal record id depending on the idProperty given in the constructor
	 */
	
	_getId( buffer ) {
		return this._get( this._idProperty, buffer );
	}

	_get( name, buffer ) {

		let f = this._fields[name];
		if( !f ) {
			throw 'Unknown field: ' + name;
		}

		return f.get( buffer );
	}
	
	_set( name, value, buffer ) {

		let f = this._fields[name];
		if( !f ) {
			throw 'Unknown field: ' + name;
		}

		f.set( name, value, buffer );
	}

	validate( ) {
		// TODO
	}

	/**
	 * 
	 */

	_build( fields ) {

		//	create new properties
		let me 		= this, 
			len 	= fields.length,
			fid 	= 0,
			f;

		this._fields = {};

		for( f=0; f<len; f++ ) {
			this._genField( fields[f], fid++ );
		}

		// if idProperty is missing, generate it
		if( !this._fields[this._idProperty] ) {
			this._genField( {name:this._idProperty,type:'int'}, fid++ );
		}
	}

	/**
	 * generate the real field from desc
	 */
	
	_genField( fld, fid ) {

		if( isString(fld) ) {
			fld = {
				name: fld
			};
		}

		if( !fld.name ) {
			console.log( 'missing field "name" property' );
			return;
		}
		
		let iname = fld.name,
			name = camelCase( iname, true );
		
		if( iname==this._idProperty ) {
			fld.auto = () => { return this._gen_id++ };
		}

		fld.idx 	= fid;
		let field 	= new DataField( fld );

		this._fields[iname] = field; 
	}
}


// *********************************************************************************************************
// 										Readers
// *********************************************************************************************************


/**
 * DataReaders are responsible of parsing data & generate record set for DataStores
 * DataReader is the base class, you never use it but derived classes (json...)
 */

class 	DataReader
{
	constructor( { model } ) {
		this._model = model;
	}

	readRecords( data ) {
	}
}


/**
 * Specific reader for JSON or standard javascript objects (Array)
 * It use the data model to extract datas
 */

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

// *********************************************************************************************************
// 									DataSorter
// *********************************************************************************************************

/**
 * DataSorter is the method that allow sorting of DataStore
 * @internal
 */

class 	DataSorter
{
	constructor( store, {field, transform, fn, dir} ) {
		this.store = store;
		this.model = store.model;
		this.field = field;
		this.transform = transform;
		this.fn = fn;
		this.desc = dir==='DESC';
	}

	_getValue( index ) {
		let buffer = this.store._get( index );
		return	this.model._get( this.field, buffer );
	}

	_sort_fn( i1, i2 ) {

		var v1 = this._getValue( i1 ),
            v2 = this._getValue( i2 );

        if ( this.transform) {
            v1 = this.transform(v1);
            v2 = this.transform(v2);
        }

        let rc;
        if( this.fn ) {
        	rc = this.fn( v1, v2 );
        }
        else {
            rc = (v1 > v2 ? 1 : (v1 < v2 ? -1 : 0));
        }

        return this.desc ? -rc : rc;
	}
}


// *********************************************************************************************************
// 									DataFilter
// *********************************************************************************************************


/**
 * DataFilter is responsible of filtering DataStore
 * @internal
 */

class 	DataFilter
{
	constructor( store, {field, value, operator} ) {
		this.store = store;
		this.model = store.model;
		this.field = field;
		this.value = value;
		this.vtype = 0;

		if( isFunction(value) ) {
			this.vtype = 1;
		}
		else if( value && value.constructor===RegExp ) {
			this.vtype = 2;
		}
		else {

			let operators = {
				'=':  	function( a, b ) { return a==b; },
				'!=':  	function( a, b ) { return a!=b; },
				'<':  	function( a, b ) { return a<b; },
				'>':  	function( a, b ) { return a>b; },
				'<=':  	function( a, b ) { return a<=b; },
				'>=':  	function( a, b ) { return a>=b; }
			};

			if( !operators[operator] ) {
				operator = '=';
			}

			this.cmp = operators[operator];
		}
	}

	_getValue( index ) {
		let buffer = this.store._get(index);
		return	this.model._get( this.field, buffer );
	}

	_filter( i1 ) {

		var v1 = this._getValue( i1 ),
			vtype = this.vtype,
			rc;

		if( vtype==0 ) {
			rc = this.cmp( v1, this.value );
		}
        else if( vtype==1 ) {
        	rc =  this.value( v1 );
        }
        else {
        	if( !isString(v1) ) {
	        	v1 = v1.toString( );
	        }

	        rc = this.value.test( v1 );
	    }

	    return rc;
	}
}



// *********************************************************************************************************
// 									Stores
// *********************************************************************************************************


/**
 *	DataStore is a standardized way to store & access data
 *	it can fire events (change)
 *	
 *	TODO: proxies
 */

class 	DataStore extends Observable
{
	/**
	 * constructor
	 * @param  {DataModel} options.model - the model to work on
	 * @param  {DataReader|string} options.reader - the data reader that will fill the store, if a string is given, try to find a known reader ('json'...)
	 * @param  {Object|nulll} options.data - data to pass to the reader to initially fill the store
	 */

	constructor( {model, reader, data } ) {
		super( );

		this.addEvents('change');
		
		this.model  = model;
		this.data   = null;
		
		this.sort_fields = null;
		this.filter_fields = null;

		this.index 	= null;

		if( isString(reader) ) {
			switch( reader ) {
				case 'json':
					reader = new JsonReader( {model:model} );
					break;
				default:
					throw 'Unknown DataReader type: ' + reader;
			}
		}

		this.reader = reader;

		if( data ) {
			this.load( data );
		}
	}

	/**
	 * filter the data model
	 *
	 * if field is a string, just filter the field using the value (can be a value, a function or a regex )
	 * field can also be an object { field, value, operator }
	 * 	operator one of '=', '!=', '<', '<=', '>=', '>'
	 * field can also be an array or object as describe just before
	 * @example
	 * 	filter( 'Number', 7 );
	 * 	filter( { field: 'Number', value: 7, operator: '>=' } );
	 * 	filter( [{ field: 'Number', value: 7, operator: '>=' }, { field: 'Number', value: 9, operator: '<=' }] )
	 */
	
	filter( field, value ) {
		let fields;

		// init sorting infos
		if( isString(field) ) {
			fields	 = [{
				field: field,
				value: value
			}];
		}
		else if( isObject(field) ) {
			fields = [field];
		}
		else if( isArray(field) ) {
			fields = field;
		}

		this.filter_fields = fields;

		this._recalcIndex( )
	}

	/**
	 * clear the filters created by filter
	 */

	clearFilters( ) {

		this.filter_fields = null;
		this._recalcIndex( );
	}
	
	/**
	 * sort the data model
	 *
	 * if field is a string, just sort by the field using dir as direction ('ASC' or 'DESC')
	 * field can also be an object { field, dir, transform, fn }
	 * field can also be an array or object as describe just before
	 * @example
	 * 	sort( 'Number', 'ASC' )
	 */
	
	sort( field, dir ) {

		let fields;

		// init sorting infos
		if( isString(field) ) {
			fields	 = [{
				field: field,
				dir: dir || 'ASC'
			}];
		}
		else if( isObject(field) ) {
			fields = [field];
		}
		else if( isArray(field) ) {
			fields = field;
		}

		this.sort_fields = fields;
		this._recalcIndex( );
	}

	/**
	 * clear the sort created by sort
	 */

	clearSort( ) {
		this.sort_fields = null;
		this._recalcIndex( );
	}

	/**
	 * load the data. 
	 * data will be parsed by the dataReader.
	 * @param {object} data - data to read
	 */
	
	load( data ) {
		this.data 	= this.reader.readRecords(data);
		this._recalcIndex( );		
	}

	/**
	 * return the number of records.
	 * the filter is taken in account
	 */
	
	getCount( ) {
		if( this.index ) {
			return this.index.length;
		}

		return this.data ? this.data.length : 0;
	}

	/**
	 * return the n'th record
	 */
	
	getAt( index ) {

		if( !this.data || index<0 || index>=this.getCount() ) {
			return;
		}

		if( this.index ) {
			return this.data[this.index[index]];
		}
		else {
			return this.data[index];	
		}
	}

	/**
	 * recalc the record indirection (filter & sort)
	 */
	
	_recalcIndex( ) {

		//	build it sequentially with seq indexes
		let n   = this.data.length,
			i;

		let index = new Int32Array( n );
		for( i=0; i<n; i++ ) {
			index[i] = i;
		}

		index = this._doFilter( index );		
		index = this._doSort( index );

		// and keep it
		this.index = index;
		this.fireEvent('change');
	}

	/**
	 * do the real sort 
	 */
	
	_doSort( index ) {

		if( !this.data || !this.data.length || !this.sort_fields ) {
			return index;
		}

		// create the comparison function
		let sorter = this._buildSorter( this.sort_fields );
		
		//	do sort
		index.sort( sorter );

		return index;
	}

	/**
	 * execute the real filter
	 */
	
	_doFilter( index ) {

		if( !this.data || !this.data.length || !this.filter_fields ) {
			return index;
		}

		// create the comparison function
		let filter = this._buildFilters( this.filter_fields );
		
		if( filter ) {

			//	do sort
			index = index.filter( filter );	
		}

		return index;
	}

	/**
	 * construct the sorters
	 */
	
	_buildSorter( fields ) {

		let sorters = [];

		for( let f=0; f<fields.length; f++ ) {
			let sorter = new DataSorter( this, fields[f] );
			sorters.push( sorter );
		}

		let length = sorters.length;                
		if( length==1 ) {
			return sorters[0]._sort_fn.bind(sorters[0]);
		}
            
		return function( i1, i2 ) {
            let result = sorters[0]._sort_fn( i1, i2 );
            if( result!=0 ) {
            	return result
            }

			for( let i=1; i<length; i++ ) {
                result = sorters[i]._sort_fn( i1, i2 );
                if( result ) {
                	return result;
                }
            }

            return	0;
        }
	}

	/**
	 * construct the filters
	 */
		
	_buildFilters( fields ) {

		let filters = [];

		for( let f=0; f<fields.length; f++ ) {

			let field = fields[f];

			let model = this.model._fields[field.field];
			if( !model ) {
				console.log( 'Unknown field:', field.field );
				continue;
			}


			if( !isFunction(field.value) ) {
				if( isNaN(field.value) || field.value===undefined ) {
					continue;
				}
			
				field.value = coerce( field.value, model._type );
			}

			let filter = new DataFilter( this, field );
			filters.push( filter );
		}		

		let length = filters.length;
		if( !length ) {
			return null;
		}

		if( length==1 ) {
			return filters[0]._filter.bind(filters[0]);
		}
            
		return function( i1 ) {

            if( !filters[0]._filter( i1 ) ) {
            	return false;
            }
            
            for( let i=1; i<length; i++ ) {
                if( !filters[i]._filter( i1 ) ) {
                	return false;
                }
            }

            return	true;
        }
	}

	/**
	 * return the n'th element
	 * without filtering & sorting
	 */

	_get( index ) {
		return this.data[index];	
	}
}

