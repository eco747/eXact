(function($$) {
	
	/**
	 * 
	 */

	class WindowTitle extends Component
	{
		constructor( {title,closable} ) {
			super( );

			this.setDataModel({
				title: title,
				closable: closable
			});

			this.icon = new Icon( {glyph:'fa@undo'} );
			this._clsName = 'x-header';
		}	

		render( ) {
			return {
				items: [
					{ 
						cls: 'x-text',
						content: this._data.title 
					},
					this.icon
				]
			}
		}
	}

	/**
	 * 
	 */
	
	class Window extends Component {

		constructor( ...a ) {
			super( ...a );

			let {title,frame,sizable,width,height,modal=true,closable=true,content} = this._config;

			this.root = null;
			this.init = false;
			this.modal = modal;
			this.content = content;

			this.setDataModel({
				width: width,
				height: height,
			})

			if( title ) {
				this.header = new WindowTitle( {title,closable} );
			}
		}

		show( ) {
			if( !this.init ) {
				this._createRootNode( );			
				this.init = true;
			}
		}

		close( ) {
			if( this.root && this.init ) {
				React.unmountComponentAtNode(this.root);
			    document.body.removeChild(this.root);
			    this.init = false;
			}
		}
		
		// small hack:
		// for modless windows, as react must render elements inside a root element (and remove other elements)
		// we have to create a temp element by hand
		// for modals: the created element serves as modal mask, we keep it.
		
		_createRootNode( ) {
			// insert a div into which we will render
			this.root = document.createElement( 'div' );

			if( this._config.clickDismiss ) {
				this.root.addEventListener( 'click', (e) => { 
					if( e.target===this.root ) {
						this.close(); 
					}
				});
			}

			if( this.modal ) {
				// put it inside body 
				this.root.className = 'x-modal-mask x-center';
			}
			else {
				this.root.className = 'x-modless-portal';
			}

			document.body.appendChild( this.root );

			React.unstable_renderSubtreeIntoContainer( this._, React.createElement(this._), this.root );
		}

		render( ) {
			const {width,height,frame,sizeable} = this._data;


	    	return {
	    		cls: 'x-box x-nosel',
	    		style: {
	    			position: 'fixed',
	    			width: width,
	    			height: height,
	    			minWidth: 100,
	    			minHeight: 100,
	    		},

	    		items: [
	    			this.header,
	    			this.content
	    		]
		  	}
	    }
	}


	function alert( cfg ) {
		cfg.cls = 'x-alert';
		if( !cfg.icon ) {
			cfg.icon = 'fa@exclamation-triangle';
		}

		_display_box( cfg );
	}

	function warning( cfg ) {
		cfg.cls = 'x-warning';


		if( !cfg.icon ) {
			cfg.icon = 'fa@exclamation-circle';
		}
		
		_display_box( cfg );
	}

	function info( cfg ) {
		cfg.cls = 'x-info';
		_display_box( cfg );
	}

	function _display_box( {title,text,icon,autoClose,clickDismiss,cls,html} ) {

		let 	ic = new Icon({glyph:icon,size:48});
		let 	btn = new Button( {title: 'OK', width: 80, deffocus: true} );

		let 	msg;

		if( html ) {
			msg = {
				tag: 'p',
				__direct: {
					__html: html
				}
			}
		}
		else {
			msg = text;	
		}


		let content = {
			layout: 'vertical',
			cls: cls,
			style: {
				paddingLeft: 32,
				paddingRight: 32,
				paddingTop: 16,
				paddingBottom: 16,
				maxWidth: 540,
				color: '#424242',
			},
			items: [
				{
					layout: 'horizontal',
					items: [
						{
							layout: 'vertical',
							layoutDir: 'center',
							style: {
								paddingRight: 32,
							},
							items: ic,
						},
						{
							style: {
								flexGrow: 1,
							},
							items: [
								{
									tag: 'h1',
									content: title
								},
								{
									tag: 'p',
									style: {
										textAlign: 'justify',
										userSelect: 'initial',
										overflowY: 'auto',
										maxHeight: 200,
									},
									items: msg
								}
							]
						},
					]
				},
				{
					layout: 'horizontal',
					layoutDir: 'end',
					items: btn
				}
			]
		};

		btn.on( 'click', () => {t.close();} )
		

		if( autoClose ) {
			let tme = autoClose;
			let xx = setInterval( ()=> {
				tme--;
				btn.setTitle( 'OK ('+tme+'s)' );
				
				if( tme<=0 ) {
					clearInterval( xx );
					t.close( );
				}
			}, 1000 );
		}

		var t = new Window({content:content,clickDismiss:clickDismiss});
		t.show( );
	}

	$$.Window = Window;
	$$.Exact.alert = alert;
	$$.Exact.warning = warning;
	$$.Exact.info = info;

})( window || this );