/**
 *	A Model represents some object that your application manages. 
 *	Models are defined as a set of fields and any arbitrary methods and properties relevant to the model
 *	A Model definition always has an identifying field which should yield a unique key for each instance. 
 *	By default, a field named "id" will be created with a mapping of "id". 
 */

class 	DataModel 
{
	constructor( { fields, idProperty } ) {

		this._watched = {};
		this._raw 	  = {};

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

		let v = buffer[name];

		// any converter ?
		if( f.convert ) {
			v = f.convert( v );
		}

		// empty & default value ?
		if( v===undefined && f.default ) {
			v = f.default;
		}
		
		// forced type ?
		if( f.type ) {
			switch( f.type ) {
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

	set( name, value ) {
		let f = this._fields[name];
		if( !f ) {
			throw 'Unknown field: ' + name;
		}

		this._raw[name]	= value;
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

		//	check if id field is present
		if( !fields.hasOwnProperty(this._idProperty) ) {
			fields[this._idProperty] = {
				name: this,
				type: 'int'
			}
		}

		//	create new properties
		let me 		= this, 
			len 	= fields.length,
			watched = {},
			p;

		for( f = 0; f<len; f++ ) {
			
			let fld = fields[f];

			if( isString(fld) ) {
				fld = {
					name: fld
				};
			}

			let name  = fld.name,
				iname = name;

			if( !name ) {
				console.log( 'missing field "name" property' );
				continue;
			}
				
			// elements starting with an underscore are hidden from other objects
			name = camelCase( name, true );
			
			this['set' + name ] = ( value ) => {me.set(iname,value);}
			this['get' + name ] = ( ) => { return me.get(iname);}

			let f = { };

			if( fld.type ) {
			 	f.type = fld.type;
			}

			if( fld.default ) {
			 	f.default = fld.default;
			}

			if( fld.convert ) {
			 	f.convert = fld.convert;
			}

			this._fields[iname] = f; 
			watched[name] 		= true;
		}

		this._watched = watched;
	}

	convert( rawData ) {

		let record = {};

		for( let f in this._fields ) {
			record[f] = this._get( f, rawData );
		}

		return record;
	}
}