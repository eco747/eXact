// *********************************************************************************************************
// 										Model
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
			switch( type ) {
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

	load( data ) {
		this.data 	= this.reader.readRecords(data);
	}

	getCount( ) {
		return this.data ? this.data.length : 0;
	}

	getAt( index ) {

		let data = this.data;

		if( !data ) {
			return;
		}

		if( index<0 || index>=this.data.length ) {
			return;
		}

		return this.data[index];
	}
}


















