
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

class Window extends Component {

	constructor( {title,frame,sizable,width=400,height=300,modal=true,closable=true} ) {
		super( );

		this.root = null;
		this.init = false;
		this.modal = modal;

		this.setDataModel({
			width: width,
			height: height,
		})

		if( title ) {
			this.header = new WindowTitle( {title,closable} );
		}

		setTimeout( () => {
			this.close( );
		}, 10000 );
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
	// we have to create a temp element by hand, then move our dom from the temp to the body element
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

	_moveToRoot( dom ) {
		if( this.root ) {
			
			//if( !this.modal ) {
			//	document.body.appendChild( dom );
			//	document.body.removeChild( this.root );
			//}
		}
	}

	render( ) {
		const {width,height,frame,sizeable} = this._data;

		let items = [];

		if( this.header ) {
			items.push( this.header );
		}

    	return {
    		ref: this._moveToRoot.bind(this),
    		cls: 'x-box',
    		style: {
    			position: 'fixed',
    			width: width,
    			height: height
    		},

    		items
	  	}
    }
}