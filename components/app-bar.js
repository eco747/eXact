/**
 *
 */

class AppBar extends Component
{
	constructor( title, ...icon ) {
		super( );

		this.data = {
			title: title || ' ',		// title shown
		};

		this.icon	= new Icon( ...icon );
	}

	onRender( ) {
		return {
			items: [
				this.icon,
				{
					cls: 'x-text',
					content: this.title
				}
			]
		};
	}
}