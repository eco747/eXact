
/**
 * 
 */

class BottomNavigationItem extends Component
{
	constructor( text, ...icon ) {
		super( );

		this.icon = new Icon( ...icon );
		this.data = {
			text: text || ' '
		};
	}

	onRender( ) {
		return {
			items: [
				this.icon,
				{
					cls: ' x-text',
					content: this.text
				}
			]
		}
	}
}

/**
 *
 */

class BottomNavigation extends Component
{
	constructor( cfg ) {
		super( cfg );

		this.data = {
			_buttons: []		
		};
	}

	onRender( ) {
		return {
			items: this.data._buttons
		}
	}
}