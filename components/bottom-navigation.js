
/**
 * 
 */

class BottomNavigationItem extends Component
{
	constructor( text, ...icon ) {
		super( );

		this.icon = new Icon( ...icon );
		this.setDataModel({
			text: text || ' ',
			hover: false
		});

		this.events = {
			onmouseenter: this.onMouseEnter,
			onmouseleave: this.onMouseLeave
		}
	}

	onRender( ) {
		return {
			cls: this._data.hover ? 'x-hover' : '',
			items: [
				this.icon,
				{
					cls: ' x-text',
					content: this._data.text
				}
			]
		}
	}

	onMouseEnter( e ) {
		this.hover = true;
	}

	onMouseLeave( e ) {
		this.hover = false;
	}
}

/**
 *
 */

class BottomNavigation extends Component
{
	constructor( cfg ) {
		super( cfg );

		this.setDataModel({
			buttons: []		
		});
	}

	onRender( ) {
		return {
			items: this._data.buttons
		}
	}
}