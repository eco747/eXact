

class 	Panel extends Component
{
	constructor( ...a ) {
		super( ...a );

		this._defStyle = {
			width: this._config.width,
			borderRight: '1px solid #000',
			boxSizing: 'border-box',
			padding: 8
		};
	}

	render( ) {
		return  {
			items: this._config.content
		};
	}
}