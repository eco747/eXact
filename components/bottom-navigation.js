
/**
 * 
 */

class BottomNavigationItem extends Component
{
	constructor( {title,icon,onclick} ) {
		super( );

		this.icon = new Icon( {glyph:icon} );
		this.setDataModel({
			title: title || ' ',
			hover: false
		});

		this.events = {
			onmouseenter: this.onMouseEnter,
			onmouseleave: this.onMouseLeave,
			onclick: onclick
		}
	}

	render( ) {
		return {
			cls: this._data.hover ? 'x-hover' : '',
			items: [
				this.icon,
				{
					div: 'span',
					cls: ' x-text',
					content: this._data.title
				}
			]
		}
	}

	onMouseEnter( e ) {
		this.setHover( true );
	}

	onMouseLeave( e ) {
		this.setHover( false );
	}
}

/**
 *
 */

class BottomNavigation extends Component
{
	constructor({buttons} ) {
		super( );

		this.setDataModel({
			buttons: buttons	
		});
	}

	render( ) {
		return {
			items: this._data.buttons
		}
	}
}