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
	
	class WindowBase extends Component
	{
		constructor( ...a ) {
			super( ...a );

			this.clickDismiss = this._config.clickDismiss;
			this._checkClick = this._checkClick.bind(this);
		}		

		show( showInfo ) {
			if( !this.init ) {
				this._show_info = showInfo,
				this._createRootNode( );			
				this.init = true;
			}
		}

		close( ) {
			if( this.root && this.init ) {

				if( this.clickDismiss ) {
					window.removeEventListener( 'click', this._checkClick );
				}

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

			if( this.clickDismiss ) {
				let me = this;
				asap( function() { // because we get the last click
					window.addEventListener( 'click', me._checkClick );
				});
			}

			if( this.modal ) {
				// put it inside body 
				this.root.className = 'x-modal-mask x-center';
			}
		
			document.body.appendChild( this.root );

			React.unstable_renderSubtreeIntoContainer( this._, React.createElement(this._), this.root );
		}

		_checkClick( e ) {
			let dom = React.findDOMNode(this._);

			if( !isDescendantElement(e.target,dom) ) {
				this.onClickAway( );
			}
		}

		onClickAway( ) {
			this.close( );
		}
	}

	/**
	 * 
	 */
	
	class Window extends WindowBase {

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


	class MenuSeparator extends Component
	{
		render( ) {
			return {
			}
		}
	}

	/**
	 * 
	 */

	class MenuItem extends Component
	{
		constructor( ...a ) {
			super( ...a );

			this.setDataModel({
				title: this._config.title,
				icon: this._config.icon,
				menu: this._config.menu,
			});

			this.addEvents(['click']);
			this.icon = new Icon({style:{width:16}});
			this.popup = new Icon({glyph:'fa@angle-right',style:{width:16}});
		}

		render( ) {

			let isPopup = this._data.menu ? true : false;

			this.icon._setIcon( this._data.icon );

			return {
				layout: 'horizontal',
				onclick: this.onClick.bind(this),
				style: {
					alignItems: 'center'
				},
				items: [
					this.icon,
					{
						cls: 'x-text',
						content: this._data.title,
						flex: 1,
					},
					isPopup ? this.popup : {width:16},
				]
			}
		}

		onClick( ) {
			if( this._data.menu ) {
				this._showSubMenu( );
			}
			else {
				this.fireEvent( 'click' );

				// simulate a clic to close the main menu
				let me = new MouseEvent( 'click' );
				window.dispatchEvent( me );
			}
		}

		_showSubMenu( ) {
			this._data.menu.show( {ref:this,align:'trtl'} );
		}
	}

	/**
	 * 
	 */

	class Menu extends WindowBase {

		constructor( ...a ) {
			super( ...a );

			this.setDataModel({
				items: this._config.items
			});

			this.clickDismiss = true;
			//setTimeout( this.close.bind(this), 30000 );
		}

		afterMount( ) {
			if( this._show_info ) {
				this._positionMenu( this._show_info );
			}
			else {
				let dom = React.findDOMNode(this._);
				dom.style.opacity = 1.0;
			}
		}

		_calcPosition( tar_dom, ref_dom, align, lvl=0 ) {

			let rc_ref = ref_dom.getBoundingClientRect( ),
				rc_tar = tar_dom.getBoundingClientRect( );


			let href, vref, x, y;
				
			if( align[0]=='t' ) {vref = rc_ref.top;}
			else 				{vref = rc_ref.top+rc_ref.height;}

			if( align[1]=='r' ) {href = rc_ref.left+rc_ref.width;}
			else 				{href = rc_ref.left;}

			if( align[2]=='t' ) {y = vref;}
			else 				{y = vref-rc_tar.height;}

			if( align[3]=='r' ) {x = href-rc_tar.width;}
			else 				{x = href;}

			let sw = document.body.clientWidth,
				sh = document.body.clientHeight,
				tmp;
							
			if( (x+rc_tar.width)>sw )  {
				
				if( align[1]=='r' && align[3]=='l' && lvl==0 ) {
					align = align[0]+'l'+align[2]+'r';
					tmp = this._calcPosition( tar_dom, ref_dom, align, 1 );
					x = tmp.x + 4;
				}
				else {
					x = sw-rc_tar.width; 
				}
			}

			if( x<0 ) {

				if( align[1]=='l' && align[3]=='r' && lvl==0 ) {
					align = align[0]+'r'+align[2]+'l';
					tmp = this._calcPosition( tar_dom, ref_dom, align, 1 );
					x = tmp.x - 4;
				}
				else {
					x = 0; 
				}
			}

			if( (y+rc_tar.height)>sh ) { y = sh-rc_tar.height; }
			if( y<0 ) 				  { y = 0; }

			return {x,y};
		}

		_positionMenu( info ) {

			let tar_dom = React.findDOMNode(this._),
				ref_dom = React.findDOMNode(info.ref._);
				
			let {x,y} = this._calcPosition( tar_dom, ref_dom, info.align );

			tar_dom.style.left = x;
			tar_dom.style.top = y;
			tar_dom.style.opacity = 1.0;
		}

		render( ) {

			return {
				layout: 'vertical',
				style: {
					position: 'absolute',
					minWidth: 'min-content',
					opacity: 0,
					zIndex: 100,
				},
				items: this._data.items
			}
		}
	}












	/**
	 * Alert, Warning, Info dialogs
	 */

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

	$$.Menu = Menu;
	$$.MenuItem = MenuItem;
	$$.MenuSeparator = MenuSeparator;
	$$.Window = Window;
	$$.Exact.alert = alert;
	$$.Exact.warning = warning;
	$$.Exact.info = info;

})( window || this );