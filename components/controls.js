/**
 * 	Icon class
 */

class Icon extends Component
{
	/**
	 * constructor
	 * @param  {Object} cfg - default configutation
	 * @param {String} cfg.icon - icon to use for rendering, if the value is in the form xx@xxx, the Icon component use font glyphs else it use <img>
	 * @param {Number} cfg.size - icon size, if undefined use the default element size
	 *
	 * TODO: img tag
	 */
	
	constructor( cfg ) {
		super( cfg );

		this.bindAll( );
		this.addEvents( 'click' );

		this.bindEvents({
			onclick: this.onClick
		});
	}

	render( ) {
		let { icon, size } = this,	
			cls;

		if( !icon ) {
			return null;
		}

		if( icon.match(Icon.GlyphRE) ) {
			let x = Icon.GlyphRE.exec( icon );
			cls = x[1] + ' fa-' + x[2];
		}
		else {
			cls = icon;
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
		}
	}

	onClick( ) {
		this.fireEvent('click');
	}
}

Icon.GlyphRE = /(\w+)\@([\w_-]+)/;




/**
 * Sizer class
 * a sizer is an object the appear on the border or a container object and allow sizing of it's parent
 * TODO: refresh parent layout when done
 */

class 	Sizer extends Component {

	/**
	 * constructor
	 * 	@param {String} cfg.side - sizer side one of 'left','top','right','bottom'
	 * 	@param {Function} cfg.handler - function to call on sizing fn(side,size)
	 * 	
	 */
	
	constructor( cfg ) {
		super( cfg );

		this.addEvents( 'sizestart','sizeend', 'sizechanged' );
	}

	render( ) {

		let style;

		if( this.side==='right' ) {
			style = {
				right: 0,
				top: 0,
				bottom: 0,
				width: 4,
				position: 'absolute',
				cursor: 'ew-resize',
			}
		}
		else if( this.side==='bottom' ) {
			style = {
				left: 0,
				right: 0,
				bottom: 0,
				height: 4,
				position: 'absolute',
				cursor: 'ns-resize',
			}
		}
		
		return {
			cls: this.side + (this._sizing ? ' sizing':''),
			style: style,
			onmousedown: this._resize.bind(this)
		}
	}

	/**
	 * @internal
	 */
	
	_resize( evt ) {

		let me = this,
			side = me.side,
			parent = this.target,
			dom = React.findDOMNode( parent._ ),
			rc = dom.getBoundingClientRect( ),
			dx, dy;

		me.fireEvent( 'sizestart' );
		me._sizing = true;
		me._refresh( );
			
		function mouseMove( e ) {
			let size;

			if( side=='right' ) {
				size  = e.x-(evt.x - rc.right)-rc.left
			}
			else if( side=='bottom' ) {
				size = e.y - (evt.y - rc.bottom) - rc.top;
			}

			if( size!==undefined ) {
				me.fireEvent( 'sizechanged', me.side, e.x-dx-rc.left );
				if( me.handler ) {
					me.handler( me.side, size )
				}
			}

			e.preventDefault( );
		}

		function mouseUp( e ) {
			window.removeEventListener( 'mousemove', mouseMove );
			window.removeEventListener( 'mouseup', mouseUp );				

			me.fireEvent( 'sizeend' );
			me._sizing = false;
			me._refresh( );
		}

		window.addEventListener( 'mousemove', mouseMove );
		window.addEventListener( 'mouseup', mouseUp );
	}
}


/**
 * 	Panel class
 * 	panel is a simple container.
 * 	It can be sizable if needed
 */

class 	Panel extends Component
{
	/**
	 * constructor
	 * @param {String} cfg.sizers - a string describing sizing borders, 'l' for left, 't' for top, 'r' for right, 'b' for bottom. ie: 'ltbr' mean left top right bottom and 'r' mean right.
	 */
	
	constructor( cfg ) {
		super( cfg );

		this.bindAll( );

		this._sizers = {};
	}

	render( ) {

		let style = apply( this.style, {
			boxSizing: 'border-box',
			overflow: 'auto',
			display: 'flex',
			position: 'relative',
			
			padding: 8, //<<< review: let css do		
		});

		let content = this.content;
		if( content ) {
			content.flex = 1;
			content.style = apply( content.style, {minHeight:'min-content'} );
		}

		let items = [content];
		if( this.sizers ) {
			if( this.sizers.indexOf('r')>=0 ) {
				this._createSizer( 'right' );
			}
			//review: todo other sides
		}

		return  {
			style: style,
			items: [
				content,
				this._sizers.right,
				this._sizers.bottom,
			]
		};
	}

	_createSizer( side ) {
		if( !this._sizers[side] ) {
			this._sizers[side] = new Sizer({side:side,target:this,handler:this.onSizeChanged});
		}
	}

	onSizeChanged( side, size ) {
		//review: really dirty
		if( side=='right' ) {
			this.width = size;
		}
		else if( side=='bottom' ) {
			this.height = size;
		}

		Exact.application._refresh( );
	}
}

/**
 * Standard button
 */

class 	Button extends Component
{
	/**
	 * constructor
	 * @param  {String} cfg.title - button title
	 * @param {Boolean} cfg.defFocus - if true, the button is the default focus
	 * @param {Function} cfg.handler - function o call on click
	 */
	
	constructor( cfg ) {
		super( cfg );

		this.bindAll( );
		this.addEvents( 'click' );

		this.bindEvents({
			onclick: this.onClick,
			onkeypress: this.onKey,
		});

		this.createAccessor( 'title' );
	}

	render( ) {

		return {
			cls: (this.defFocus ? ' x-default': ''),
			tabIndex: 1,
			style: {
				textAlign: 'center',
				cursor: 'pointer',
			},
			content: this.title,
		}
	}

	onKey( e ) {
		if( e.charCode==32 || e.charCode==13 ) {
			this.onClick( e );
		}
	}

	onClick( e ) {
		this.fireEvent('click');
		if( this.handler ) {
			this.handler( );
		}
	}
}

/**
 * Standard text field with label
 */

class 	TextField extends Component
{
	/**
	 * constructor
	 * @param  {String} cfg.value - edit content
	 * @param {String} cfg.label - label text on the edit side
	 * @param {Boolean} cfg.required - if true, an the edit will be on error if empty
	 * @param {Number} cfg.labelWidth - label width
	 * @param {String} cfg.labelAlign - label alignment, one of 'left', 'right', 'top'
	 * @param {String} cfg.textHint - text hint (text shown when the edit is empty)
	 */
	
	constructor( cfg ) {
		super( cfg );

		this._error = false;

		this.bindAll( );
		this.addEvents( 'change','blur','focus' );
	}

	render( ) {

		let { value, label, labelWidth, labelAlign, textHint, required } = this;
		
		let items = [],
			vert = labelAlign=='top';

		// prepare label -----------------
		if( label || labelWidth ) {

			items.push( {
				cls: 'x-label' + (vert ? ' x-vert' : ''),
				style: {textAlign: labelAlign},
				width: labelWidth,
				flex: labelWidth || 1,
				content: (this.label + ':')
			});
		}

		// prepare input ------------------
		items.push({
			tag: 'input',
			cls: (vert ? ' x-vert' : ''),
			flex: 1,
			style: {
				type: 'text',
			},
			placeholder: textHint,
			onchange: this.onChange,
			onblur: this.onBlur,
			onfocus: this.onFocus,
		});

		return {
			layout: vert ? 'vertical' : 'horizontal',
			cls: (this._focus ? 'focus' : '') + (this._error ? ' error' : '' ) + (required ? ' required' : ''),
			style: {
				alignItems: labelAlign=='top' ? 'left' : 'center'
			},
			items: items
		}
	}

	onChange( e ) {
		this.fireEvent( 'change', e.target.value );
	}

	onFocus( e ) {
		this.fireEvent( 'focus', e );
		this._focus = true;
		this._refresh( );
	}

	onBlur( e ) {
		this._focus = false;
		
		let value = e.target.value;
		this.fireEvent( 'blur', value, e );

		if( this.required ) {
			let err = value.length==0;

			if( err!=this.error ) {
				this._error = err;
			}
		}

		this._refresh( );
	}
}

/**
 * Standard CheckBox
 */

class 	CheckBox extends Component
{
	/**
	 * constructor
	 * @param  {String} cfg.value - edit content
	 * @param {String} cfg.label - label text on the edit side
	 * @param {Number} cfg.labelWidth - label width
	 * @param {String} cfg.labelAlign - label alignment, one of 'left', 'right', 'top'
	 * @param {String} cfg.iconCheck - specific icon when checked
	 * @param {String} cfg.iconUncheck - specific icon when unchecked
	 */
	constructor( cfg ) {
		super( cfg, {value:false} );

		this._error = false;
		this._icon = new Icon( );
		
		this.bindAll( );
		this.addEvents( 'changed','blur','focus' );

		this.bindEvents({
			onchange: this.onChange
		});

		this.createAccessor( 'value' );
	}

	render( ) {

		let { value, label, labelWidth, labelAlign, iconCheck, iconUncheck } = this;
		
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
		});

		// prepare label -----------------
		if( label || labelWidth ) {
			items.push({
				cls: 'x-label',
				style: {textAlign: labelAlign,marginRight:4},
				width: labelWidth,
				flex: labelWidth || 1,
				content: label,
			});
		}

		if( value ) {
			this._icon.icon = (iconCheck || 'fa@check-square-o');
		}
		else {
			this._icon.icon = (iconUncheck || 'fa@square-o');
		}

		items.push( this._icon );

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

	onChange( e ) {
		let checked = e.target.checked;
		this.fireEvent('changed',checked);
		this.setValue( checked );
	}
}


/**
 *	Application Bar
 */

class AppBar extends Component
{
	/**
	 * constructor
	 * @param  {String} cfg.title - application title
	 * @param {Menu} cfg.menu - application menu
	 * @param {String} cfg.icon - application icon
	 */
	
	constructor( cfg ) {
		super( cfg );

		this.bindAll( );

		this._icon = new Icon();
		this._menu_icon = new Icon({
			icon:'fa@bars',
			style: {cursor:'pointer'},
		});

		this._menu_icon.on('click', this.onMenuClick );
	}

	onMenuClick( ) {
		if( this.menu ) {
			this.menu.show( {ref:this._menu_icon,align:'brtr'} );
		}
	}

	render( ) {

		if( this.icon ) {
			this._icon.icon = this.icon;
		}

		return {
			layout: 'horizontal',
			items: [
				this._icon,
				{
					cls: 'x-text',
					content: this.title
				},
				this.menu ? this._menu_icon : null
			]
		};
	}
}


/**
 * BottomNavigationBarItem class
 * TODO: replace by standard buttons
 */

class BottomNavigationItem extends Component
{
	/**
	 * constructor
	 * @param  {String} cfg.title - item title
	 * @param  {String} cfg.icon - item icon
	 * @param {Function} cfg.handler - function o call on click
	 */
	
	constructor( cfg ) {
		super( cfg );

		this._icon = new Icon( {icon:this.icon} );
		this._hover = false;
		
		this.bindAll( );
		this.addEvents( 'click' );

		this.bindEvents({
			onmouseenter: this.onMouseEnter,
			onmouseleave: this.onMouseLeave,
			onclick: this.onClick
		});
	}

	render( ) {
		return {
			cls: this._hover ? 'x-hover' : '',
			items: [
				this._icon,
				{
					div: 'span',
					cls: ' x-text',
					content: this.title
				}
			]
		}
	}

	onMouseEnter( e ) {
		this.set( '_hover',true );
	}

	onMouseLeave( e ) {
		this.set( '_hover',false );
	}

	onClick( e ) {
		this.fireEvent( 'click' );
		if( this.handler ) {
			this.handler( );
		}
	}
}

/**
 *	BottomNavigationBar class
 */

class BottomNavigation extends Component
{
	/**
	 * constructor
	 * @param  {[BottomNavigationBarItem]} cfg.buttons
	 */
	
	constructor( cfg ) {
		super( cfg );
	}

	render( ) {
		return {
			items: this.buttons
		}
	}
}

/**
 * Application class
 */

class Application extends Component
{
	constructor( cfg ) {
		super( cfg );
		Exact.application = this;
	}
}


