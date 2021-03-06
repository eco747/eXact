(function($$) {
	
	/**
	 * WindowTitle class
	 */

	class WindowTitle extends Component
	{
		/**
		 * @constructor
		 * @param  {String} cfg.title - title text
		 * @param  {Boolean} cfg.closable - is set a close box is added
		 * @param {Function} cfg.onclose - function to call on close
		 */
		
		constructor( cfg ) {
			super( cfg );

			this._clsName = 'x-header';
		}	

		render( ) {
			return {
				items: [
					{ 
						cls: 'x-text',
						content: this.title 
					},
					{
						xtype: 'Icon',
						icon: 'fa@times',
						listeners: {
							'click': this.onclose
						}
					}
				]
			}
		}
	}

	/**
	 * 	WindowBase class
	 * 	base class for all popup windows
	 */
	
	class WindowBase extends Component
	{
		/**
		 * @constructor
		 * @param  {Boolean} cfg.clickDismiss - if true a click outside of the window close it
		 * @param {Boolean} cfg.modal - if true the window is modal
		 * @param {String} cfg.cls - class to add to the window
		 */
		constructor( cfg ) {
			super( cfg, {cls:''} );

			this._checkClick = this._checkClick.bind(this);
			this._showInfo = undefined;
			this._init = false;
			this._root = null;
		}		

		/**
		 * show the window as modal
		 * @param  {Object} showInfo - depending of the subclasses
		 */
		
		show( showInfo ) {
			if( !this._init ) {
				this._show_info = showInfo;
				this._createRootNode( );			
				this._init = true;
			}
			else {
				this._refresh( );
			}
		}

		/**
		 * close the window
		 */
		
		close( ) {
			
			if( this._root && this._init ) {

				if( this.clickDismiss ) {
					window.removeEventListener( 'click', this._checkClick );
				}

				React.unmountComponentAtNode(this._root);
			    document.body.removeChild(this._root);
			    this._init = false;
			}
		}
		
		// small hack:
		// for modless windows, as react must render elements inside a root element (and remove other elements)
		// we have to create a temp element by hand
		// for modals: the created element serves as modal mask, we keep it.
		
		_createRootNode( ) {
			// insert a div into which we will render
			this._root = document.createElement( 'div' );

			if( this.clickDismiss ) {
				let me = this;
				asap( function() { // because we get the last click
					window.addEventListener( 'click', me._checkClick );
				});
			}

			if( this.modal ) {
				// put it inside body 
				this._root.className = 'x-modal-mask x-center';
			}
		
			document.body.appendChild( this._root );

			React.renderSubtreeIntoContainer( this._, React.createElement(this._), this._root );
		}

		/**
		 * check is the click was done on our descendant
		 */
		
		_checkClick( e ) {
			let dom = this._getDOM( );

			if( !isDescendantElement(e.target,dom) ) {
				this.onClickAway( );
			}
		}

		/**
		 * a click appear outside of this or our descendants
		 */
		
		onClickAway( ) {
			this.close( );
		}
	}


	/**
	 * 	Stabdard Window class
	 * 	basic Window with a title
	 */
	
	class Window extends WindowBase {

		/**
		 * @constructor
		 * @param  {String} cfg.title - title of the window, if title is specified, the window show a caption
		 * @param {Object|Component} cfg.content - content of the window
		 */
		
		constructor( cfg ) {
			super( cfg );

			if( this.title ) {
				this._header = new WindowTitle( {title:this.title,closable:this.closable,onclose:this.onTitleClose.bind(this)} );
			}
		}

		render( ) {

			let bbar;

			if( this.bbar ) {
				bbar = {
					cls: 'x-bar bottom',
					layout: {
						type: 'horizontal',
						direction: 'end'
					},
					items: this.bbar
				}
			}

			return {
	    		cls: 'x-box x-nosel ' + this.cls,
	    		style: {
	    			position: 'fixed',
	    			width: this.width,
	    			height: this.height,
	    			minWidth: 100,
	    			minHeight: 100,
	    			borderWidth: this.frame ? this.frame : 0
	    		},

	    		items: [
	    			this._header,
	    			this.content,
	    			bbar
	    		]
		  	}
	    }

	    onTitleClose( ) {
	    	this.close( );
	    }
	}




	/**
	 * MenuSeparator
	 * Basic menu separator
	 */

	class MenuSeparator extends Component
	{
		render( ) {
			return {
			}
		}
	}

	/**
	 * MenuItem
	 * item of a menu
	 */

	class MenuItem extends Component
	{
		/**
		 * @constructor
		 * @param  {String} cfg.title - title of the element
		 * @param {String} cfg.icon - icon of the element
		 * @param {Menu} cfg.menu - sub menu if this item is a popup menu
		 */
		constructor( cfg ) {
			super( cfg );

			this.bindAll( );
			this.addEvents('click');

			this._icon = new Icon({width:16});
			this._popup = new Icon({icon:'fa@angle-right',width:16});
		}

		render( ) {

			let isPopup = this.menu ? true : false;

			this._icon.icon = this.icon;

			return {
				layout: 'horizontal',
				onclick: this.onClick,
				style: {
					alignItems: 'center'
				},
				items: [
					this._icon,
					{
						cls: 'x-text',
						content: this.title,
						flex: 1,
					},
					isPopup ? this._popup : {width:16},
				]
			}
		}

		onClick( ) {
			if( this.menu ) {
				this._showSubMenu( );
			}
			else {

				if( this.handler ) {
					this.handler( this );
				}

				this.fireEvent( 'click' );

				// simulate a clic to close the main menu
				let me = new MouseEvent( 'click' );
				window.dispatchEvent( me );
			}
		}

		_showSubMenu( ) {
			this.menu.show( {ref:this,align:'trtl'} );
		}
	}

	/**
	 * compute the menu position (avoid getting out of the screen)
	 * align: tlbt
	 */
	
	function positionElementInScreen( tar_dom, ref_dom, align, lvl=0 ) {
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
				tmp = positionElementInScreen( tar_dom, ref_dom, align, 1 );
				x = tmp.x + 4;
			}
			else {
				x = sw-rc_tar.width; 
			}
		}

		if( x<0 ) {

			if( align[1]=='l' && align[3]=='r' && lvl==0 ) {
				align = align[0]+'r'+align[2]+'l';
				tmp = positionElementInScreen( tar_dom, ref_dom, align, 1 );
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

	/**
	 * 	Menu class
	 * 	Popup menu
	 */

	class Menu extends WindowBase {

		/**
		 * @constructor
		 * @param  {[MenuItem|MenuSeparator]} cfg.items - items
		 */
		
		constructor( cfg ) {
			super( cfg );

			this.clickDismiss = true;
		}

		afterMount( ) {
			if( this._show_info ) {
				this._positionMenu( this._show_info );
			}
			else {
				let dom = this._getDOM();
				dom.style.opacity = 1.0;
			}
		}

		_positionMenu( info ) {

			let tar_dom = this._getDOM(),
				ref_dom = info.ref._getDOM();
				
			let {x,y} = positionElementInScreen( tar_dom, ref_dom, info.align );

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
				items: this.items
			}
		}
	}

	/**
	 * MessageBox Dialog
	 * @param {String} cfg.cls - base class of the messagebox
	 * @param  {String} cfg.icon - icon to show
	 * @param {String} cfg.title - title of the message
	 * @param {String} cfg.text - text of the message (the text is not interpreted a html, cf. html parameter)
	 * @param {String} cfg.html - text of the message the text is pure html and you have to take care of the content (html/javascript attacks)
	 * @param {Boolean} cfg.clickDismiss - if true a click outside of the window close it
	 */
	
	function MessageBox( cfg ) {

		const {title,text,icon,autoClose,clickDismiss,cls,html} = cfg;

		let 	ic = new Icon({icon:icon,size:48});
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
							layout: {
								type: 'vertical',
								direction: 'center'
							},
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
					layout: {
						type: 'horizontal',
						direction: 'end'
					},
					items: btn
				}
			]
		};

		btn.on( 'click', () => {wnd.close();} )
		
		if( autoClose ) {
			let tme = autoClose;
			let xx = setInterval( ()=> {
				tme--;
				btn.setTitle( 'OK ('+tme+'s)' );
				
				if( tme<=0 ) {
					clearInterval( xx );
					wnd.close( );
				}
			}, 1000 );
		}

		var wnd = new Window({content:content,clickDismiss:clickDismiss,modal:true,cls:cls});
		wnd.show( );
	}

	/**
	 * 
	 */
	
	class 	SnackBarItem extends Component 
	{
		constructor( cfg ) {
			super( cfg );

			this._clsName = 'x-item';
			this.addEvents( 'discard' );

			this._tm1  = setTimeout( this._discard.bind(this), 5000 );
			this._tm12 = setTimeout( this._fadeOut.bind(this), 4500 );
		}

		beforeUnmount( ) {
			if( this._tm1 ) {clearTimeout( this._tm1 );}
			if( this._tm2 ) {clearTimeout( this._tm2 );}
		}

		render( ) {

			if( this.icon ) {
				return {
					cls: this.cls,
					layout: 'horizontal',
					items: [
						{ 
							xtype: 'Icon',
							icon: this.icon
						},
						this.text
					]
				}
			}
			else {
				return {
					cls: this.cls,
					content: this.text
				}
			}
		}

		_fadeOut( ) {
			delete this._tm2;
			this._addDOMClass( 'fade' );
		}

		_discard( ) {
			delete this._tm1;
			this.fireEvent( 'discard', this.uid );
		}
	}

	/**
	 * 
	 */

	class 	SnackBar extends WindowBase {

		constructor( cfg ) {
			super( cfg );

			this._items = [];
			this._uid = 1;
		}

		addSnack( cfg ) {

			cfg = apply( cfg, {
				uid:this._uid++, 
				listeners: {
					discard: this._discardElement.bind(this)
				}
			});

			this._items.push( new SnackBarItem(cfg) );
			this.show( );
		}

		_discardElement( uid ) {

			let items = this._items;
			for( let e in items ) {
				if( uid==items[e].uid ) {
					 items = items.splice( e, 1 );
					 if( items.length==0 ) {
					 	this.close( );
					 }
					 else {
					 	this._refresh( );
					 }

					 break;
				}
			}
		}

		render( ) {
			return {
				style: {
					position: 'fixed',
					left: 0,
					bottom: 0,
				},
				items: this._items
			}
		}
	}

	$$.Menu = Menu;
	$$.MenuItem = MenuItem;
	$$.MenuSeparator = MenuSeparator;
	$$.Window = Window;
	$$.WindowBase = WindowBase;
	$$.Exact.MessageBox = MessageBox;
	$$.SnackBar = SnackBar;
	$$.positionElementInScreen = positionElementInScreen;

})( window || this );