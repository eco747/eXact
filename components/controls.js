
/**
 * 
 */

class 	Panel extends Component
{
	constructor( ...a ) {
		super( ...a );

		this._defStyle = {
			width: this._config.width,
			borderRight: '1px solid #000',
			boxSizing: 'border-box',
			position: 'relative'
		};
	}

	render( ) {

		let content = this._config.content;
		if( content ) {

			content.style = content.style || {};

			content.style.position = 'absolute';
			content.style.left = 8;
			content.style.top = 8;
			content.style.right = 8;
			content.style.bottom = 8;
		}

		return  {
			items: content
		};
	}
}

/**
 * Standard button
 * config:
 * 	title
 */

class 	Button extends Component
{
	constructor( ...a ) {
		super( ...a );

		this.setDataModel({
			title: this._config.title,
		});

		this.addEvents('click');
	}

	render( ) {

		let {title} = this._data;

		return {
			cls: (this._config.deffocus ? ' x-default': ''),
			tabIndex: 1,
			style: {
				textAlign: 'center',
				cursor: 'pointer',
			},
			content: title,
			onclick: this.onClick.bind(this),
			onkeypress: this.onKey.bind(this),
		}
	}

	onKey( e ) {
		if( e.charCode==32 || e.charCode==13 ) {
			this.fireEvent('click');	
		}
	}

	onClick( e ) {
		this.fireEvent('click');
	}
}

/**
 * Standard text field with label
 * 
 * config:
 * 	value
 * 	label
 * 	required
 * 	labelWidth
 * 	labelAlign: 'left', 'right', 'top'
 * 	textHint
 */

class 	TextField extends Component
{
	constructor( ...a ) {
		super( ...a );

		this.setDataModel({
			value: this._config.value,
			label: this._config.label,
		});

		this.error = false;

		this.addEvents( ['change','blur','focus'] );
	}

	render( ) {

		let { labelWidth, labelAlign, textHint, required } = this._config;
		let { value, label } = this._data;

		let items = [],
			vert = labelAlign=='top';

		// prepare label -----------------
		if( label || labelWidth ) {

			items.push( {
				cls: 'x-label' + (required ? ' x-required' : '') + (this.error ? ' x-error' : '')  + (vert ? ' x-vert' : ''),
				style: {textAlign: labelAlign},
				width: labelWidth,
				flex: labelWidth || 1,
				content: (this._data.label + ':')
			});
		}

		// prepare input ------------------
		items.push({
			tag: 'input',
			cls: (this.error ? 'x-error' : '' ) + (vert ? ' x-vert' : ''),
			flex: 1,
			style: {
				type: 'text',
			},
			placeholder: textHint,
			onchange: ( e ) => { this.fireEvent('change',e.target.value); },
			onblur: this.onBlur.bind(this),
			onfocus: ( e ) => { this.fireEvent('focus',e); },
		});

		return {
			layout: vert ? 'vertical' : 'horizontal',
			style: {alignItems: labelAlign=='top' ? 'left' : 'center'},
			items: items
		}
	}

	onBlur( e ) {

		let value = e.target.value;
		this.fireEvent( 'blur', value, e );

		if( this._config.required ) {
			let err = value.length==0;

			if( err!=this.error ) {
				this.error = err;
				this._refresh( );
			}
		}
	}
}

/**
 *
 * 
 */

class 	CheckBox extends Component
{
	constructor( ...a ) {
		super( ...a );

		this.setDataModel({
			value: this._config.value,
			label: this._config.label,
		});

		this.error = false;
		this.icon = new Icon( );
		
		this.addEvents('changed','blur','focus');
	}

	render( ) {

		let { labelWidth, labelAlign, icon_check, icon_uncheck } = this._config;
		let { value, label } = this._data;

		let items = [];

		// prepare input ------------------
		items.push({
			tag: 'input',
			flex: 1,
			type: 'checkbox',
			style: {
				pointerEvents: 'all',
				opacity: 0,
				position: 'absolute',
				width: '100%',
				height: '100%',
				margin: 0,
				cursor: 'pointer',
			},
			value: 'on',
			checked: value,
			onchange: this.onClick.bind(this),
		});

		// prepare label -----------------
		if( label || labelWidth ) {
			items.push({
				cls: 'x-label',
				style: {textAlign: labelAlign,marginRight:4},
				width: labelWidth,
				flex: labelWidth || 1,
				content: this._data.label,
			});
		}

		if( value ) {
			this.icon._data.glyph = (icon_check || 'fa@check-square-o');
		}
		else {
			this.icon._data.glyph = (icon_uncheck || 'fa@square-o');
		}

		items.push( this.icon );

		return {
			tag: 'label',
			cls: value ? 'x-checked' : null,
			layout: 'horizontal',
			style: {
				alignItems: 'center',
				position:'relative',
			},
			items: items,
		}
	}	

	onClick( e ) {
		let checked = e.target.checked;
		this.fireEvent('changed',checked);
		this.setValue( checked );
	}
}
