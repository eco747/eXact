/**
 * 	Icon class
 * 	can be an image (<img>) or a glyph (font) or a css glyph (fontawesome)
 */

class Icon extends Component
{
	constructor( glyph, size=24 ) {
		super( );

		this.re_glyph = /(\w+)\@([\w_-]+)/;

		this.data = {
			glyph: glyph,		
			size: size
		};
	}

	onRender( ) {
	
		let glyph = this.glyph,	
			cls;

		if( !glyph ) debugger;

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
				fontSize: this.data.size,
			}
		}
	}
}