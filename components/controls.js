/**
 * 	Icon class
 * 	can be an image (<img>) or a glyph (font) or a css glyph (fontawesome)
 */

class Icon extends Component
{
	constructor( ...a ) {
		super( ...a );

		this.re_glyph = /(\w+)\@([\w_-]+)/;

		this.setDataModel( {
			glyph: this._config.glyph,		
			size: this._config.size,
		} );
	}

	_setIcon( glyph ) {
		this._data.glyph = glyph;
	}

	render( ) {
	
		let { glyph, size } = this._data,	
			cls;

		if( !glyph ) {
			return null;
		}

		if( glyph.match(this.re_glyph) ) {
			let x = this.re_glyph.exec( glyph );
			cls = x[1] + ' fa-' + x[2];
		}
		else {
			cls = glyph;
		}

		let style = {textAlign: 'center'};
				
		if( size ) {
			style.width = size;
			style.height = size;
			style.fontSize = size;
		};

		return {
			tag: 'i',
			cls: cls,
			style: style,
			onclick: this._config.onclick
		}
	}
}

/**
 * 	Panel class
 */

class 	Panel extends Component
{
	constructor( ...a ) {
		super( ...a );

		this._defStyle = {
			width: this._config.width,
			borderRight: '1px solid #000',
			boxSizing: 'border-box',
			padding: 8,
			overflow: 'auto',
			display: 'flex',
		};
	}

	render( ) {

		let content = this._config.content;
		if( content ) {
			content.flex = 1;
			content.style = content.style || {};
			content.style.minHeight = 'min-content';
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
			style: {
				alignItems: labelAlign=='top' ? 'left' : 'center'
			},
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

/**
 *
 */

class AppBar extends Component
{
	constructor( ...a ) {
		super( ...a );

		this.setDataModel( {
			title: this._config.title || ' ',		// title shown
			menu: this._config.menu || null,
			icon: this._config.icon || null
		} );

		this.icon	= new Icon();
		this.menu_icon 	= new Icon({
			glyph:'fa@bars',
			style: {cursor:'pointer'},
			onclick:this.menuClick.bind(this)
		});
	}

	menuClick( ) {
		if( this._data.menu ) {
			this._data.menu.show( {ref:this.menu_icon,align:'brtr'} );
		}
	}

	render( ) {

		if( this._data.icon ) {
			this.icon._setIcon( this._data.icon );
		}

		return {
			layout: 'horizontal',
			items: [
				this.icon,
				{
					cls: 'x-text',
					content: this._data.title
				},
				this._data.menu ? this.menu_icon : null
			]
		};
	}
}


/**
 * 
 */

class BottomNavigationItem extends Component
{
	constructor( {title,icon,onclick} ) {
		super( );

		this.icon = new Icon( {glyph:icon} );
		this.setDataModel({
			title: title || ' ',
			hover: false
		});

		this.events = {
			onmouseenter: this.onMouseEnter,
			onmouseleave: this.onMouseLeave,
			onclick: onclick
		}
	}

	render( ) {
		return {
			cls: this._data.hover ? 'x-hover' : '',
			items: [
				this.icon,
				{
					div: 'span',
					cls: ' x-text',
					content: this._data.title
				}
			]
		}
	}

	onMouseEnter( e ) {
		this.setHover( true );
	}

	onMouseLeave( e ) {
		this.setHover( false );
	}
}

/**
 *
 */

class BottomNavigation extends Component
{
	constructor({buttons} ) {
		super( );

		this.setDataModel({
			buttons: buttons	
		});
	}

	render( ) {
		return {
			items: this._data.buttons
		}
	}
}

