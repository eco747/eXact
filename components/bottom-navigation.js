
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

		this.events = {
			onmouseenter: this.onMouseEnter,
			onmouseleave: this.onMouseLeave
		}
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

	onMouseEnter( e ) {
		this.setState( 'hover' );
	}

	onMouseLeave( e ) {
		this.setState( 'hover', false );
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