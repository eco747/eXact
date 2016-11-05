/**
 *
 */

class AppBar extends Component
{
	constructor( {title,icon}) {
		super( );

		this.setDataModel( {
			title: title || ' ',		// title shown
		} );

		this.icon	= new Icon({glyph:icon});
	}

	render( ) {
		return {
			items: [
				this.icon,
				{
					cls: 'x-text',
					content: this._data.title
				}
			]
		};
	}
}

