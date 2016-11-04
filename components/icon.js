/**
 * 	Icon class
 * 	can be an image (<img>) or a glyph (font) or a css glyph (fontawesome)
 */

class Icon extends Component
{
	constructor( {glyph,size} ) {
		super( );

		this.re_glyph = /(\w+)\@([\w_-]+)/;

		this.setDataModel( {
			glyph: glyph,		
			size: size
		} );
	}

	render( ) {
	
		let { glyph, size } = this._data,	
			cls;

		if( !glyph ) {
			debugger;
			return null;
		}

		if( glyph.match(this.re_glyph) ) {
			let x = this.re_glyph.exec( glyph );
			cls = x[1] + ' fa-' + x[2];
		}
		else {
			cls = glyph;
		}

		return {
			tag: 'i',
			cls: cls,
			style: {
				width: size,
				height: size,
				fontSize: size,
			}
		}
	}
}