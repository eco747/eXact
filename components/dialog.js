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

		constructor( {title,frame,sizable,width,height,modal=true,closable=true,content} ) {
			super( );

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

//			setTimeout( () => {
//				this.close( );
//			}, 10000 );
		}

		show( ) {
			if( !this.init ) {
				this._createRootNode( );			
				this.init = true;
			}
		}

		close( ) {
			if( this.root ) {
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


	function alert( {title,message,icon} ) {

		let ic = new Icon({glyph:icon,size:48});

		let content = {
			style: {
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				paddingLeft: 32,
				paddingRight: 32,
				paddingTop: 16,
				paddingBottom: 16,
				maxWidth: 540,
				color: '#424242',
			},
			items: [
				{
					style: {
						paddingRight: 32,
						__direct: {
							__html: '<rr></rr>',
						},
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
							},
							content: message
						}
					]
				}
			]
		};

		var t = new Window({content:content});
		t.show( );
	}

	$$.Window = Window;
	$$.Exact.alert = alert;

})( window || this );