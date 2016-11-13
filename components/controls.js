

/** *********************************************************************************************************
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

		this.bindDOMEvents({
			onclick: this.onClick
		});
	}

	render( ) {
		let { icon, size } = this;
		return Icon.buildRendering( icon, size );
	}

	onClick( ) {
		this.fireEvent('click');
	}

	static extractIconClass( name ) {

		if( name.match(Icon.GlyphRE) ) {
			let x = Icon.GlyphRE.exec( name );
			return x[1] + ' fa-' + x[2];
		}
		else {
			return name;
		}
	}

	static buildRendering( icon, size ) {
		if( !icon ) {
			return null;
		}

		let cls = 'x-icon ' + Icon.extractIconClass( icon );
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
}

Icon.GlyphRE = /(\w+)\@([\w_-]+)/;


/** *********************************************************************************************************
 * Sizer class
 * a sizer is an object the appear on the border or a container object and allow sizing of it's parent
 * TODO: refresh parent layout when done
 */

class 	Sizer extends Component {

	/**
	 * constructor
	 *  @param {Object} target - target element to resize. if not given, use parent dom node
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
			dom, dx, dy;

		// if a parent target is given, use it
		if( parent ) {
			dom = parent._getDOM( );
		}
		// else use parent dom node
		else {
			dom = this._getDOM( );
			dom = dom.parentNode;
		}

		let rc = dom.getBoundingClientRect( );
			
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
					me.handler( size, me.side )
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


/** *********************************************************************************************************
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

	onSizeChanged( size, side ) {
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

/** *********************************************************************************************************
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

		this.bindDOMEvents({
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

/** *********************************************************************************************************
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
	 * @param {String} cfg.labelAlign - label alignment, one of 'left', top'
	 * @param {String} cfg.textHint - text hint (text shown when the edit is empty)
	 * @param {Boolean} cfg.multiline - if true the field is multiline
	 * @param {number} cfg.grow - allow the multiline to grow until this limit
	 */
	
	constructor( cfg ) {
		super( cfg );

		this._error = false;
		this._focus = false;

		this.bindAll( );
		this.addEvents( 'change','blur','focus' );

		if( this.tooltip ) {
			this._tooltip = new Tooltip( {target:this, content: this.tooltip} );
		}
	}

	render( ) {

		let { value, label, labelWidth, labelAlign, textHint, required } = this;
		
		let items = [],
			vert = labelAlign=='top';

		// prepare label -----------------
		if( label || labelWidth ) {

			if( !vert ) {
				items.push({
					flex: (labelWidth ? undefined : 1),
					layout: 'vertical',
					items: [
						{
							cls: 'x-label',
							style: {textAlign: labelAlign},
							width: labelWidth,
							content: (this.label + ':')
						},
						{
							cls: 'x-line label',
						}
					]
				});
			}
			else {
				items.push({
					cls: 'x-label',
					style: {textAlign: labelAlign},
					content: (this.label + ':')
				});	
			}
		}

		// prepare input ------------------
		let ta_style = {};

		if( this.multiline ) {
			ta_style.resize = 'none';

			if( this.grow ) {
				ta_style.maxHeight = this.grow;

				if( this._height ) {
					ta_style.height = this._height;
					ta_style.overflow = this._height<this.grow ? 'hidden' : 'auto';
				}
				else {
					ta_style.height = '1.2em';
					ta_style.overflow = 'hidden';	
				}
			}
		}
		 
		items.push({
			flex: 1,
			layout: 'vertical',
			style: {
				minHeight: 'min-content',
				minWidth: 1,
			},
					
			items: [
				{
					tag: this.multiline ? 'textarea' : 'input',
					ref: this._acquireTA.bind(this),
					style: ta_style,
					placeholder: textHint,
					onchange: this.onChange,
					onblur: this.onBlur,
					onfocus: this.onFocus,
					value: value
				},
				{
					cls: 'x-line edit',
				}
			]
		});

		return {
			layout: vert ? 'vertical' : 'horizontal',
			cls: (this._focus ? 'focus' : '') + (this._error ? ' error' : '' ) + (required ? ' required' : '') + (vert ? ' vert' : ''),
			style: {
				alignItems: labelAlign=='top' ? 'left' : 'center'
			},
			items: items
		}
	}

	onChange( e ) {
		this.value = e.target.value;
		this.fireEvent( 'change', this.value );

		if( this.multiline ) {
			this._autoSize( );
		}
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

	_acquireTA( dom ) {
		this._ta = dom;
		if( dom ) {
			asap( this._autoSize, this );
		}
	}

	_autoSize( ) {
		let dom = this._ta,
			h = dom.style.height,
			height;

		dom.style.height = '0px';
		height = dom.scrollHeight;
		dom.style.height = h;
		
		if( this._height!=height )  {
			this._height = height;
			this._refresh( );		
		}
	}
}


/** *********************************************************************************************************
 * Standard CheckBox
 */

let iii = 0;

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
	 * @param {string} cfg.group - if set this element is a radio 
	 */
	constructor( cfg ) {
		super( cfg, {value:false} );

		this._focus = false;
		
		this.bindAll( );
		this.addEvents( 'changed','blur','focus' );

		this.bindDOMEvents({
			onclick: this.onClick,
			onfocus: this.onFocus,
			onblur: this.onBlur,
			onkeypress: this.onKey,
		});

		this.createAccessor( 'value' );
	}

	render( ) {

		let { group, value, label, labelWidth, labelAlign, iconCheck, iconUncheck } = this;
		let items = [];

		if( group ) {
			items.push({
				tag: 'input',
				type: 'radio',
				name: group,
				value: iii++,
				checked: value,
				style: {
					display: 'none'
				},
				ref: this._watchChange.bind(this)
			});
		}

		// prepare label -----------------
		if( label || labelWidth ) {
			items.push({
				cls: 'x-label',
				style: {textAlign: labelAlign,marginRight:4},
				width: labelWidth,
				flex: labelWidth ? undefined : 1,
				content: label + ':',
			});
		}

		let ic;
		if( value ) {
			ic = iconCheck || (group ? 'fa@check-circle-o' : 'fa@check-square-o');
		}
		else {
			ic = iconUncheck || (group ? 'fa@circle-o' : 'fa@square-o');
		}

		items.push({
			layout: 'horizontal',
			flex: 1,
			items: {
				xtype: 'Icon',
				icon: ic,
				style: {
					pointerEvents: 'none'
				}
			}
		});

		return {
			tabIndex: 0,
			cls: (value ? 'x-checked' : '') + (this._focus ? ' focus' : ''),
			layout: 'horizontal',
			style: {
				alignItems: 'center',
				position:'relative',
			},
			items: items,
		}
	}	

	onFocus( ) {
		this._focus = true;
		this._refresh( );
	}

	onBlur( ) {
		this._focus = false;
		this._refresh( );
	}

	onClick( e ) {
		this._toggle( );
	}

	onKey( e ) {
		if( e.charCode==32 || e.charCode==13 ) {
			this._toggle( );
		}
	}

	beforeUnmount( ) {
		if( this._chg_timer ) {
			clearInterval( this._chg_timer );
		}
	}

	// onchange is not fired when a radio changed for the previously checked radio
	// so, we watch changes by hand every 200ms (dirty hack)

	_watchChange( ) {
		if( this._chg_timer ) {
			clearInterval( this._chg_timer );
			delete this._chg_timer;
		}

		if( this.group ) {
			let dom = this._getDOM( ).childNodes[0],
				me = this;

			function check( ) {
				if( dom.checked!=me.value ) {
					me.setValue( dom.checked );
				}
			}

			this._chg_timer = setInterval( check, 200 );
		}
	}

	_toggle( ) {

		let value = !this.value;
			
		if( !this.group ) {
			this.setValue( value );
		}
		else {
			let dom = this._getDOM( ).childNodes[0];
			dom.checked = true;
		}
			
		this.fireEvent('changed', value );
	}
}

/** *********************************************************************************************************
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


/** *********************************************************************************************************
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

		this.bindDOMEvents({
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

/** *********************************************************************************************************
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


/** *********************************************************************************************************
 * Application class
 */

class Application extends Component
{
	constructor( cfg ) {
		super( cfg );
		
		Exact.application = this;
		window.addEventListener( 'resize', this._refresh.bind(this) );
	}
}

/** *********************************************************************************************************
 * 
 */

class TreeList extends Component
{
	constructor( cfg ) {
		super( cfg );

		this.addEvents( 'click' );
	}

	_buildItems( items ) {
		let result = [];

		for( let i in items ) {
			
			if( !items.hasOwnProperty(i) ) {
				continue;
			}

			let item = items[i];

			let cls = 'x-tree-item';

			if( item.items ) {
				cls += ' owner';
			}

			if( item.open ) {
				cls += ' open';	
			}

			let children = [];
			if( item.items && item.open ) {
				children = this._buildItems( item.items );
			}

			result.push({
				cls: cls,
				items: [
					{
						cls: 'x-header',
						layout: 'horizontal',
						items: [
							{
								xtype: 'Icon',
								icon: (item.items ? (item.open ? 'fa@chevron-down' : 'fa@chevron-right') : undefined), 
								size: 12
							},
							{
								xtype: 'Icon',
								icon: item.icon,
								size: 12
							},
							{
								cls: 'x-text',
								content: item.title
							}, 
						],
						onclick: this.onItemClick.bind(this,item),
					},
					{
						cls: 'content',
						items: children
					}
				]
			});
		}

		return result;
	}

	onItemClick( item ) {
		// click on a folder
		if( item.items ) {
			item.open = !item.open;
			this._refresh( );
		}
		// click on a standard element
		else {
			if( item.handler ) {
				item.handler( item );
			}

			this.fireEvent( 'click', item );
		}
	}

	render( ) {
		let items = this._buildItems( this.items );
		return {
			items: items		
		};
	}
}

/** *********************************************************************************************************
 * Tooltip class
 */

class Tooltip extends WindowBase
{
	constructor( cfg ) {
		super( cfg );

		assert( cfg.target, 'You must give a target to tooltips' );

		if( isString(this.content) ) {
			this.content = {
				text: this.content
			}
		}

		this.target.bindDOMEvents({
			onmouseenter: this._showTooltip.bind(this),
			onmouseleave: this._hideTooltip.bind(this)
		});
	}

	afterMount( ) {
		let tar_dom = this._getDOM(),
			ref_dom = this.target._getDOM();
			
		let {x,y} = positionElementInScreen( tar_dom, ref_dom, 'bltl' );

		tar_dom.style.left = x;
		tar_dom.style.top = y;
	}

	_showTooltip( ) {

		let me = this;

		this._stopShowTimer( );

		function show( ) {
			me.show( );
		}

		this._showTimer = setTimeout( show, 700 );
	}

	_hideTooltip( ) {
		this._stopShowTimer( );
		this.close( );
	}

	_stopShowTimer( ) {
		if( this._showTimer ) {
			clearTimeout( this._showTimer );
			this._showTimer = undefined;
		}
	}

	render( ) {
		
		let {text,html,icon} = this.content,
			msg;

		if( html ) {
			msg = {
				__direct: {
					__html: html
				}
			}
		}
		else {
			msg = text;
		}

		if( icon ) {
			return {
				cls: 'z-depth-1',
				layout: 'horizontal',
				items: [
					{
						xtype: 'Icon',
						icon: icon
					},
					msg
				]
			}
		}
		else {
			return {
				cls: 'z-depth-1',
				items: msg
			}
		}
	}
}

/** *********************************************************************************************************
 * TabPanel class
 */

class 	TabPanel extends Component
{
	constructor( cfg ) {
		super( cfg );
	}

	_ensureActive( ) {

		for( let i in this.items ) {
			let item = this.items[i];

			if( item.active ) {
				this._active = item;
				return;
			}
		}

		this._active = this.items[0];
		this._active.active = true;
	}

	render( ) {

		let 	header_items = [],
				i;

		this._ensureActive( );

		for( i in this.items ) {

			let item = this.items[i];

			header_items.push({
				cls: 'x-tab' + (item.active ? ' active' : ''),
				onclick: this.onTabClick.bind(this,item),
				items: [
					item.title,
					(item.icon ? { xtype: 'Icon', icon:item.icon } : undefined),
				]
			});
		}

		return {
			layout: 'vertical',

			items: [
				{
					cls: 'x-header',
					layout: 'horizontal',
					items: header_items
				},
				{
					cls: 'content',
					flex: 1,
					items: this._active
				}
			]
		}
	}

	onTabClick( item ) {
		this._active.active = false;
		this._active = item;
		this._active.active = true;
		this._refresh( );
	}
}


/** *********************************************************************************************************
 * GroupBox class
 */

class 	GroupBox extends Component
{
	constructor( cfg ) {
		super( cfg );
	}

	render( ) {
		return {
			cls: 'x-group',
			items: [
				{
					cls: 'x-text',
					content: this.title
				},
				{
					cls: 'content',
					items: this.items
				}
			]
		}
	}
}

/** *********************************************************************************************************
 * DatePicker class
 */

class 	DatePicker extends WindowBase
{
	constructor( cfg ) {
		super( cfg );

		this.modal = true;
		this.date = this.date || new Date( );
	}

	_buildRow( values, hdr ) {
		
		let items = [];
		for( let i in values ) {

			let v = values[i],
				cls = 'day',
				mrk;

			if( hdr ) {
				cls += ' hdr';
			}

			let t;
			if( v.cur ) {
				cls += ' cur';
				
				t = {
					cls: cls,
					flex: 1,
					items: {
						cls: 'mrk',
						content: ''+v.v
					},
				};
			}
			else {
				if( v.out ) {
					cls += ' out';
				}

				t = {
					cls: cls,
					flex: 1,
					content: ''+v.v,
				};
			}

			t.onclick = this.selectDate.bind( this, v.d );

			items.push( t );
		}

		return {
			layout: 'horizontal',
			style: {
				alignItems: 'center',
			},
			flex: 1,
			items: items
		}
	}

	selectDate( d ) {
		this.date = d;
		this._refresh( );
	}

	onClose( ) {
		this.close( );
	}

	toDay( ) {
		this.date = new Date( );
		this._refresh( );
	}

	render( ) {

		let now = this.date,
			locale = this.locale || navigator.language,
			fmt = {weekday: "short", month: "short", day: "numeric" },
			fmt2 = { year: "numeric", month: "long" };

		let header = {
			layout: 'vertical',
			cls: 'header',
			items: [
				{
					cls: 'year',
					content: ''+now.getFullYear( )
				},
				{
					cls: 'date',
					content: now.toLocaleString( locale, fmt )
				}
			]
		};

		let date_sel = {
			cls: 'selector',
			layout: 'horizontal',
			items: [
				{ xtype: 'Icon', icon: 'fa@angle-left' },
				{
					flex: 1,
					style: {
						textAlign: 'center',
					},
					content: now.toLocaleString( locale, fmt2 )
				},
				{ xtype: 'Icon', icon: 'fa@angle-right' },
			]
		};

		
		let items = [];
		items.push( this._buildRow( [{v:'S'},{v:'M'}, {v:'T'}, {v:'W'}, {v:'T'}, {v:'F'}, {v:'S'}], true ) );

		let today = now.getDate( );
		now.setDate( 1 );

		let fday = now.getDay( ),
			run, row, d, n;

		row = [];
		
		if( fday==0 ) {
			fday = 7;
		}

		for( d=fday, n=0; d>0; d--, n++ ) {
			run = new Date( now.getTime() )
			run.setDate( -(d-1) );
			row.push( {out:true, v: run.getDate(), d: run} );
		}

		for( d=0; n<42; d++, n++ ) {

			if( row.length==7 ) {
				items.push( this._buildRow( row, false ) );
				row = [];
			}

			run = new Date( now.getTime() );
			run.setDate( d+1 );
			
			let e = run.getDate( );

			if( today==(d+1) ) {
				row.push( {cur:true, v: run.getDate(), d: run} );
			}
			else if( run.getMonth()==now.getMonth() ) {
				row.push( {v: run.getDate(), d: run} );	
			}
			else {
				row.push( {out:true, v: run.getDate(), d: run} );	
			}
		}

		items.push( this._buildRow( row, {cls:'day'} ) );

		return {
			cls: this.horizontal ? 'horizontal' : 'vertical',
			layout: this.horizontal ? 'horizontal' : 'vertical',
			items: [
				header,
				{
					cls: 'content',
					layout: 'vertical',
					flex: 1,
					items: [
						date_sel,
						{
							cls: 'days',
							flex: 1,
							layout: 'vertical',
							items: items
						},
						{
							cls: 'x-bar',
							layout: {
								type: 'horizontal',
								direction: 'end'
							},
							items: [
								{
									xtype: 'Button',
									title: 'Today',
									width: 80,
									handler: this.toDay.bind(this)
								},
								{
									flex: 1,
								},
								{
									xtype: 'Button',
									title: 'OK',
									width: 80,
									handler: this.onClose.bind(this)
								},
								{
									xtype: 'Button',
									title: 'Cancel',
									width: 80,
									handler: this.onClose.bind(this)
								},
							]
						}
					]
				}
			]
		}
	}
}
