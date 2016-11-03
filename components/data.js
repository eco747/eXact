// *********************************************************************************************************
// 										DATA Model
// *********************************************************************************************************


/**
 * Data field hold the description & access function to data fields.
 */

class 	DataField
{
	constructor( { name, type, defValue, convert, auto, idx } ) {

		this._name = name;
		this._idx  = idx;

		if( type ) {
			this._type = type;
		}

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
			switch( _type ) {
				case 'string':
					v = v===undefined ? v : v.toString( );
					break;

				case 'float':
					if( isString(v) ) {
						v = parseFloat(v);
					}
					break;

				case 'int':
					if( isString(v) ) {
						v = parseInt(v);
					}
					break;

				case 'boolean':
					if( isString(v) ) {
						v = v==='true';
					}
					break;
			}
		}

		return v;
	}

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
 * TODO: keep track of dirty on set
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

	_get( name, buffer ) {

		let f = this._fields[name];
		if( !f ) {
			throw 'Unknown field: ' + name;
		}

		return f.get( buffer );
	}

	set( name, value ) {
		this._set( name, value, this._raw );
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
	 * generate acces functions
	 */

	_build( fields ) {

		this.fields = {};

		// remove old generated properties
		let watched = Object.keys( this._watched ),
			p;

		for( p in watched ) {
			delete this[p];
			delete this._watched[p];
		}

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
			this._genField( this._idProperty, fid++ );
		}
	}

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
		
		this['set' + name ] = ( value ) => {me.set(iname,value);}
		this['get' + name ] = ( ) => { return me.get(iname);}

		if( iname==this._idProperty ) {
			fld.auto = () => { return this._gen_id++ };
		}

		fld.idx 	= fid;
		let field 	= new DataField( fld );

		this._fields[iname] = field; 
		this._watched[name] = true;
	}


	convert( rawData ) {

		let record = [],
			fields = this._fields;

		for( let f in fields ) {
			record.push( fields[f].get( rawData ) );
		}

		return record;
	}
}


// *********************************************************************************************************
// 										Readers
// *********************************************************************************************************


/**
 * DataReaders are responsible of parsing data & generate record set for DataStores
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
        else if( this.type==1 ) {
        	rc =  this.fn( v1 );
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
 *	TODO: proxies
 *	TODO: observable
 */

class 	DataStore 
{
	constructor( {model, reader, data } ) {
		
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

		this._doFilter( );		
	}


	/**
	 * execute the real filter
	 */
	
	_doFilter( ) {

		if( !this.data || !this.data.length || !this.filter_fields ) {
			return;
		}

		// create the comparison function
		let filter = this._buildFilters( this.filter_fields );
		
		// prepare the index
		let index = this._prepareIndex( );

		//	do sort
		index = index.filter( filter );

		// and keep it
		this.index = index;
	}

	/**
	 * 
	 */
	
	_buildFilters( fields ) {

		let filters = [];

		for( let f=0; f<fields.length; f++ ) {
			let filter = new DataFilter( this, fields[f] );
			filters.push( filter );
		}

		let length = filters.length;
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
	 * sort the data model
	 *
	 * if field is a string, just sort by the field using dir as direction ('ASC' or 'DESC')
	 * field can also be an object { field, dir, transform, fn }
	 * field can also be an array or object as describe just before
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

		this._doSort( );
	}

	/**
	 * do the real sort 
	 */
	
	_doSort( ) {

		if( !this.data || !this.data.length || !this.sort_fields ) {
			return;
		}

		// create the comparison function
		let sorter = this._buildSorter( this.sort_fields );
		
		// prepare the index
		let index  = this._prepareIndex( );

		//	do sort
		index.sort( sorter );

		// and keep it
		this.index = index;
	}

	/**
	 * clear the sort created by sort
	 */

	clearSort( ) {
		this.index = null;
		this.sort_fields = null;
	}


	_prepareIndex( ) {
		
		let index  = new Int32Array( this.getCount() );

		if( this.index ) {
			//	just copy it
			let idx = this.index,
				n   = idx.length,
				i;

			for( i=0; i<n; i++ ) {
				index[i] = idx[i];
			}
		}  
		else {
			//	just build it sequentially
			let n   = this.data.length,
				i;

			for( i=0; i<n; i++ ) {
				index[i] = i;
			}
		}

		return index;
	}
	
	/**
	 * 
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
	 * 
	 */
	
	load( data ) {
		this.data 	= this.reader.readRecords(data);
		this.index 	= null;

		if( this.filter_fields ) {
			this._doFilter( );
		}

		if( this.sort_fields ) {
			this._doSort( );
		}

	}

	getCount( ) {
		if( this.index ) {
			return this.index.length;
		}

		return this.data ? this.data.length : 0;
	}

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

	_get( index ) {
		return this.data[index];	
	}
}

