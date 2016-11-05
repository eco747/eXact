(function($$) {

	/**
	 * AJAX
	 *
	 * TODO: user & password
	 */
	
	let valid_methods = {
		'GET': true,
		'POST': true,
		'PUT': true,
		'UPDATE': true,
		'DELETE': true
	}

	let Ajax = {
		timeout: 30000,
	};

	class	Request {

		/**
		 * @param {Object|String} cfg request configuration if string, direct url
		 *  @param {String} cfg.url - url for the request
		 *  @param {String} cfg.method - method, one of 'GET','POST', 'PUT', 'UPDATE', 'DELETE'
		 *  @param {Object} cfg.params - additional parameters of the request
		 *  @param {Number} cfg.timeout - timeout to use (cf. Ajax.timeout)
		 *  @param {Function} cfg.success - callback on success - success(result)
		 *  @param {Function} cfg.failure - callback on failure - receive an object as parameter
		 *  @param {Function} cfg.progress - callback on progress - receive the progression as parameter
		 */

		constructor( cfg ) {

			if( isString(cfg) ) {
		        cfg = {
		            url: cfg
		        };
		    }

		    if( !isObject(cfg) ) {
		    	return; 
		    }

			this.url = cfg.url;
		    this.method = 'GET';
		    this.params = null;
		    this.timeout = cfg.timeout || Ajax.timeout;
		    this.success = cfg.success || emptyFn;
		    this.failure = cfg.failure || emptyFn;
		    this.callback = cfg.callback || emptyFn;
		    this.progress = cfg.progress || emptyFn;

		    if( isObject(cfg.params) ) {
				this.params = cfg.params;
			}

		    if( isString(cfg.method) ) {

		    	let method = cfg.method.toUpperCase();
		    	if( validMethods[method] ) {
		        	this.method = method;
		        } 
		        else if( this.params ) {
		        	this.method = 'POST'
		        }
		    }

		    if( isObject(cfg.headers) ) {
				this.headers = cfg.headers;
			}

			this.url = this._buildUrl( this.params );

			this._createXhr();
			this.xhr.send( this.formData===undefined ? null : this.formData );

			this.timer = setTimeout( this._ontimeout, this.timeout );
		}

		abort( ) {

			if( this.xhr ) {
				clearTimeout( this.timer );
				this.xhr.abort();
			}

			return this;
		}	

		_buildUrl( params ) {

			let first = true,
	        	url = this.url;

			if( !params ) {
				return url;
			}

	        if( url.indexOf('?') === -1 ) {
	            url += '?';
	        }

			for( let key in params ) {

	            if( !params.hasOwnProperty(key) ) {
	            	continue;
	            }

	            let param = params[key];

	            // simple string ...
	            if( isString(param) ) {
	                
	                if( !first ) {
	                	url += '&';
	                }

	                url += key + '=' + param;
	            	first = false;    
	            }
	            // array ...
	            else if( isArray(param) ) {
	            	if( !first ) {
	                	url += '&';
	                }

	                let n = param.length,
	                	i;

	                for( i=0; i<n; i++ ) {
	                	if( !first ) {
		                	url += '&';
		                }

		                url += key + '[]=' + param[i];
	            		first = false;    
	                }
	            }
			}

			return url;
		}
			
		_createXhr( ) {

			let xhr = this.xhr = new XMLHttpRequest( );

			xhr.lastResult = null;
			xhr.json = this.json;
			xhr.binding = null;

			xhr.onreadystatechange = this._onreadystatechange.bind(this);
			xhr.onprogress = this._onProgress.bind(this);

			xhr.open( this.method, this.url, true );
			xhr.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );

			if( this.headers ) {
				for( let h in this.headers) {
					if( this.headers.hasOwnProperty(h) ) {
						xhr.setRequestHeader( header, this.headers[h] );
					}
				}
			}

			return xhr;
		}

		_onProgress( e ) {
			if( this.onprogress ) {
				this.onprogress( e );
			}
		}

		_onreadystatechange( ) {

			let readyState = this.xhr.readyState,
				status = this.xhr.status,
				responseText = this.xhr.responseText;

			if( readyState===4 && status==200 ) {

				var result;

				if( this.json ) {
					try {
						result = JSON.parse(responseText);
					}
					catch( error ) {
						this._error({
	                        status: status,
	                        message: "invalid json",
	                        response: responseText
	                    });

						return false;
					}
				}
				else {
					result = responseText;
				}

				this.lastResult = result;
				this._success( result );
			}
			else if( readyState===4 && status==404 ) {
				this._error({
	                status: status,
	                message: "not found",
	                response: responseText
	            });
			}
			else if( readyState===4 ) {
				this._error({
	                status: status,
	                message: "unknow",
	                response: responseText
	            });
			}
		}

		_ontimeout( ) {
		
			this._error( {
				status: 0,
				message: 'timeout',
				response: ''
			});
		}

		_error( desc ) {
			clearTimeout( this.timer );

			this.callback( this, false, desc );
			this.failure( desc );
		}

		_success( result ) {
			clearTimeout( this.timer );

			this.callback( this, true, result );
			this.success( result );
		}
	}

	Ajax.Request = Request;
	$$.Ajax = Ajax;
	
	
})( window || this );