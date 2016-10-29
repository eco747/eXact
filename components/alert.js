


class 	Mask extends Component
{
	constructor( ) {
		super( );

		this.data = {
			content: null
		}
	}

	render( ) {
		this.emit( {
			className: 'x-mask',
			items: this.content
		})
	}

	static create( ) {
		
		if( Mask.count==0 ) {
			React.render(
				React.createElement(Mask),
			  	document.body
			);
		}

		Mask.count++;
	}
}

Mask.count = 0;



class 	WindowFrame extends Component
{
	constructor( ) {
		super( );
	}
}

