(function( $$ ) {

/**
 * this file had been constructed from the fabulous REACT-LITE framework
 * see: https://github.com/Lucifier129/react-lite
 * 
 * modifications are prefixed by <exact:
 * todo: handle pseudo elements in style (in setStyleValue)
 * done: allow Component to be passed in createElement
 * done: change the sentence HTML_KEY
 */




// *********************************************************************************************************
// 									CSSPropertyOperations.js
// *********************************************************************************************************


	/**
	 * CSS Property Operations
	 */

	function setStyle(elemStyle, styles) {
	    for (let styleName in styles) {
	        if (styles.hasOwnProperty(styleName)) {
	            setStyleValue(elemStyle, styleName, styles[styleName])
	        }
	    }
	}

	function removeStyle(elemStyle, styles) {
	    for (let styleName in styles) {
	        if (styles.hasOwnProperty(styleName)) {
	            elemStyle[styleName] = ''
	        }
	    }
	}

	function patchStyle(elemStyle, style, newStyle) {
	    if (style === newStyle) {
	        return
	    }
	    if (!newStyle && style) {
	        removeStyle(elemStyle, style)
	        return
	    } else if (newStyle && !style) {
	        setStyle(elemStyle, newStyle)
	        return
	    }

	    for (let key in style) {
	        if (newStyle.hasOwnProperty(key)) {
	            if (newStyle[key] !== style[key]) {
	                setStyleValue(elemStyle, key, newStyle[key])
	            }
	        } else {
	            elemStyle[key] = ''
	        }
	    }
	    for (let key in newStyle) {
	        if (!style.hasOwnProperty(key)) {
	            setStyleValue(elemStyle, key, newStyle[key])
	        }
	    }
	}

	/**
	 * CSS properties which accept numbers but are not in units of "px".
	 */
	const isUnitlessNumber = {
	    animationIterationCount: 1,
	    borderImageOutset: 1,
	    borderImageSlice: 1,
	    borderImageWidth: 1,
	    boxFlex: 1,
	    boxFlexGroup: 1,
	    boxOrdinalGroup: 1,
	    columnCount: 1,
	    flex: 1,
	    flexGrow: 1,
	    flexPositive: 1,
	    flexShrink: 1,
	    flexNegative: 1,
	    flexOrder: 1,
	    gridRow: 1,
	    gridColumn: 1,
	    fontWeight: 1,
	    lineClamp: 1,
	    lineHeight: 1,
	    opacity: 1,
	    order: 1,
	    orphans: 1,
	    tabSize: 1,
	    widows: 1,
	    zIndex: 1,
	    zoom: 1,

	    // SVG-related properties
	    fillOpacity: 1,
	    floodOpacity: 1,
	    stopOpacity: 1,
	    strokeDasharray: 1,
	    strokeDashoffset: 1,
	    strokeMiterlimit: 1,
	    strokeOpacity: 1,
	    strokeWidth: 1,
	}

	function prefixKey(prefix, key) {
	    return prefix + key.charAt(0).toUpperCase() + key.substring(1)
	}

	let prefixes = ['Webkit', 'ms', 'Moz', 'O']

	Object.keys(isUnitlessNumber).forEach(function(prop) {
	    prefixes.forEach(function(prefix) {
	        isUnitlessNumber[prefixKey(prefix, prop)] = 1
	    })
	})

	let RE_NUMBER = /^-?\d+(\.\d+)?$/
	function setStyleValue(elemStyle, styleName, styleValue) {

	    if (!isUnitlessNumber[styleName] && RE_NUMBER.test(styleValue)) {
	        elemStyle[styleName] = styleValue + 'px'
	        return
	    }

	    if (styleName === 'float') {
	        styleName = 'cssFloat'
	    }

	    if (styleValue == null || typeof styleValue === 'boolean') {
	        styleValue = ''
	    }

	    elemStyle[styleName] = styleValue
	}


// *********************************************************************************************************
// 										Children.js
// *********************************************************************************************************

	let Children = {};

	function only(children) {
		if (isValidElement(children)) {
			return children;
		}
		throw new Error('expect only one child');
	};
	Children.only = only;

	function forEach(children, iteratee, context) {
		if (children == null) {
			return children;
		}
		
		let index = 0;
		if (_.isArr(children)) {
			_.flatEach(children, child => {
				iteratee.call(context, child, index++)
			})
		} 
		else {
			iteratee.call(context, children, index)
		}
	}
	Children.forEach = forEach;

	function map(children, iteratee, context) {
		
		if (children == null) {
			return children
		}
		
		let store = []
		let keyMap = {}
		forEach(children, (child, index) => {
			let data = {}
			data.child = iteratee.call(context, child, index) || child
			data.isEqual = data.child === child
			let key = data.key = getKey(child, index)
			if (keyMap.hasOwnProperty(key)) {
				keyMap[key] += 1
			} else {
				keyMap[key] = 0
			}
			data.index = keyMap[key]
			_.addItem(store, data)
		})
		
		let result = []
		store.forEach(({ child, key, index, isEqual }) => {
			if (child == null || typeof child === 'boolean') {
				return
			}
			if (!isValidElement(child) || key == null) {
				_.addItem(result, child)
				return
			}
			if (keyMap[key] !== 0) {
				key += ':' + index
			}
			if (!isEqual) {
				key = escapeUserProvidedKey(child.key || '') + '/' + key
			}
			child = cloneElement(child, { key })
			_.addItem(result, child)
		})
		return result
	}
	Children.map = map;

	function count(children) {
		let count = 0
		forEach(children, () => {
			count++
		})
		return count
	}
	Children.count = count;

	function toArray(children) {
		return map(children, _.identity) || []
	}


	function getKey(child, index) {
		let key
		if (isValidElement(child) && typeof child.key === 'string') {
			key = '.$' + child.key
		} else {
			key = '.' + index.toString(36)
		}
		return key
	}
	Children.getKey = getKey;

	let userProvidedKeyEscapeRegex = /\/(?!\/)/g;
	function escapeUserProvidedKey(text) {
		return ('' + text).replace(userProvidedKeyEscapeRegex, '//')
	}


// *********************************************************************************************************
// 									Component.js
// *********************************************************************************************************

	let 	updateQueue = {
		updaters: [],
		isPending: false,
		add(updater) {
			_.addItem(this.updaters, updater)
		},
		batchUpdate() {
			if (this.isPending) {
				return
			}
			this.isPending = true
			/*
			 each updater.update may add new updater to updateQueue
			 clear them with a loop
			 event bubbles from bottom-level to top-level
			 reverse the updater order can merge some props and state and reduce the refresh times
			 see Updater.update method below to know why
			*/
			let { updaters } = this
			let updater
			while (updater = updaters.pop()) {
				updater.updateComponent()
			}
			this.isPending = false
		}
	}
	
	function Updater(instance) {
		this.instance = instance
		this.pendingStates = []
		this.pendingCallbacks = []
		this.isPending = false
		this.nextProps = this.nextContext = null
		this.clearCallbacks = this.clearCallbacks.bind(this)
	}

	Updater.prototype = {
		emitUpdate(nextProps, nextContext) {
			this.nextProps = nextProps
			this.nextContext = nextContext
			// receive nextProps!! should update immediately
			nextProps || !updateQueue.isPending
			? this.updateComponent()
			: updateQueue.add(this)
		},
		updateComponent() {
			let { instance, pendingStates, nextProps, nextContext } = this
			if (nextProps || pendingStates.length > 0) {
				nextProps = nextProps || instance.props
				nextContext = nextContext || instance.context
				this.nextProps = this.nextContext = null
				// merge the nextProps and nextState and update by one time
				shouldUpdate(instance, nextProps, this.getState(), nextContext, this.clearCallbacks)
			}
		},
		addState(nextState) {
			if (nextState) {
				_.addItem(this.pendingStates, nextState)
				if (!this.isPending) {
					this.emitUpdate()
				}
			}
		},
		replaceState(nextState) {
			let { pendingStates } = this
			pendingStates.pop()
			// push special params to point out should replace state
			_.addItem(pendingStates, [nextState])
		},
		getState() {
			let { instance, pendingStates } = this
			let { state, props } = instance
			if (pendingStates.length) {
				state = _.extend({}, state)
				pendingStates.forEach(nextState => {
					let isReplace = _.isArr(nextState)
					if (isReplace) {
						nextState = nextState[0]
					}
					if (_.isFn(nextState)) {
						nextState = nextState.call(instance, state, props)
					}
					// replace state
					if (isReplace) {
						state = _.extend({}, nextState[0])
					} else {
						_.extend(state, nextState)
					}
				})
				pendingStates.length = 0
			}
			return state
		},
		clearCallbacks() {
			let { pendingCallbacks, instance } = this
			if (pendingCallbacks.length > 0) {
				this.pendingCallbacks = []
				pendingCallbacks.forEach(callback => callback.call(instance))
			}
		},
		addCallback(callback) {
			if (_.isFn(callback)) {
				_.addItem(this.pendingCallbacks, callback)
			}
		}
	}

	function Component(props, context) {
		this.$updater = new Updater(this)
		this.$cache = { isMounted: false }
		this.props = props
		this.state = {}
		this.refs = {}
		this.context = context
	}

	const ReactComponentSymbol = {}

	Component.prototype = {
		constructor: Component,
		isReactComponent: ReactComponentSymbol,
		// getChildContext: _.noop,
		// componentWillUpdate: _.noop,
		// componentDidUpdate: _.noop,
		// componentWillReceiveProps: _.noop,
		// componentWillMount: _.noop,
		// componentDidMount: _.noop,
		// componentWillUnmount: _.noop,
		// shouldComponentUpdate(nextProps, nextState) {
		// 	return true
		// },
		forceUpdate(callback) {
			let { $updater, $cache, props, state, context } = this
			if ($updater.isPending || !$cache.isMounted) {
				return
			}
			let nextProps = $cache.props || props
			let nextState = $cache.state || state
			let nextContext = $cache.context || context
			let parentContext = $cache.parentContext
			let node = $cache.node
			let vnode = $cache.vnode
			$cache.props = $cache.state = $cache.context = null
			$updater.isPending = true
			if (this.componentWillUpdate) {
				this.componentWillUpdate(nextProps, nextState, nextContext)
			}
			this.state = nextState
			this.props = nextProps
			this.context = nextContext
		    let newVnode = renderComponent(this)
			let newNode = compareTwoVnodes(vnode, newVnode, node, getChildContext(this, parentContext))
			if (newNode !== node) {
				newNode.cache = newNode.cache || {}
				syncCache(newNode.cache, node.cache, newNode)
			}
			$cache.vnode = newVnode
			$cache.node = newNode
			clearPending()
			if (this.componentDidUpdate) {
				this.componentDidUpdate(props, state, context)
			}
			if (callback) {
				callback.call(this)
			}
			$updater.isPending = false
			$updater.emitUpdate()
		},
		setState(nextState, callback) {
			let { $updater } = this
			$updater.addCallback(callback)
			$updater.addState(nextState)
		},
		replaceState(nextState, callback) {
			let { $updater } = this
			$updater.addCallback(callback)
			$updater.replaceState(nextState)
		},
		getDOMNode() {
			let node = this.$cache.node
			return node && (node.nodeName === '#comment') ? null : node
		},
		isMounted() {
			return this.$cache.isMounted
		}
	}

	function shouldUpdate(component, nextProps, nextState, nextContext, callback) {
		let shouldComponentUpdate = true
		if (component.shouldComponentUpdate) {
			shouldComponentUpdate = component.shouldComponentUpdate(nextProps, nextState, nextContext)
		}
		if (shouldComponentUpdate === false) {
			component.props = nextProps
			component.state = nextState
			component.context = nextContext || {}
			return
		}
		let cache = component.$cache
		cache.props = nextProps
		cache.state = nextState
		cache.context = nextContext || {}
		component.forceUpdate(callback)
	}


	// *********************************************************************************************************
	// 									DOM.js
	// *********************************************************************************************************

	let tagNames = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|big|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|keygen|label|legend|li|link|main|map|mark|menu|menuitem|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|source|span|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr|circle|clipPath|defs|ellipse|g|image|line|linearGradient|mask|path|pattern|polygon|polyline|radialGradient|rect|stop|svg|text|tspan'
	let DOM = {}
	tagNames.split('|').forEach(tagName => {
		DOM[tagName] = createFactory(tagName)
	})



// *********************************************************************************************************
//										DOMConfig.js
// *********************************************************************************************************


	/**
	 * DOM config
	 */

	const ATTRIBUTE_NAME_START_CHAR = ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD'
	const ATTRIBUTE_NAME_CHAR = ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\uB7\\u0300-\\u036F\\u203F-\\u2040'

	const VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
	    '^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$'
	);
	
	const isCustomAttribute = RegExp.prototype.test.bind(
	    new RegExp('^(data|aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$')
	);
	
	// will merge some data in properties below
	const properties = {}
	
	/**
	 * Mapping from normalized, camelcased property names to a configuration that
	 * specifies how the associated DOM property should be accessed or rendered.
	 */
	const MUST_USE_PROPERTY = 0x1
	const HAS_BOOLEAN_VALUE = 0x4
	const HAS_NUMERIC_VALUE = 0x8
	const HAS_POSITIVE_NUMERIC_VALUE = 0x10 | 0x8
	const HAS_OVERLOADED_BOOLEAN_VALUE = 0x20

	// html config
	const HTMLDOMPropertyConfig = {
	    props: {
	        /**
	         * Standard Properties
	         */
	        accept: 0,
	        acceptCharset: 0,
	        accessKey: 0,
	        action: 0,
	        allowFullScreen: HAS_BOOLEAN_VALUE,
	        allowTransparency: 0,
	        alt: 0,
	        async: HAS_BOOLEAN_VALUE,
	        autoComplete: 0,
	        autoFocus: HAS_BOOLEAN_VALUE,
	        autoPlay: HAS_BOOLEAN_VALUE,
	        capture: HAS_BOOLEAN_VALUE,
	        cellPadding: 0,
	        cellSpacing: 0,
	        charSet: 0,
	        challenge: 0,
	        checked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	        cite: 0,
	        classID: 0,
	        className: 0,
	        cols: HAS_POSITIVE_NUMERIC_VALUE,
	        colSpan: 0,
	        content: 0,
	        contentEditable: 0,
	        contextMenu: 0,
	        controls: HAS_BOOLEAN_VALUE,
	        coords: 0,
	        crossOrigin: 0,
	        data: 0, // For `<object />` acts as `src`.
	        dateTime: 0,
	        default: HAS_BOOLEAN_VALUE,
	        // not in regular react, they did it in other way
	        defaultValue: MUST_USE_PROPERTY,
	        // not in regular react, they did it in other way
	        defaultChecked: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	        defer: HAS_BOOLEAN_VALUE,
	        dir: 0,
	        disabled: HAS_BOOLEAN_VALUE,
	        download: HAS_OVERLOADED_BOOLEAN_VALUE,
	        draggable: 0,
	        encType: 0,
	        form: 0,
	        formAction: 0,
	        formEncType: 0,
	        formMethod: 0,
	        formNoValidate: HAS_BOOLEAN_VALUE,
	        formTarget: 0,
	        frameBorder: 0,
	        headers: 0,
	        height: 0,
	        hidden: HAS_BOOLEAN_VALUE,
	        high: 0,
	        href: 0,
	        hrefLang: 0,
	        htmlFor: 0,
	        httpEquiv: 0,
	        icon: 0,
	        id: 0,
	        inputMode: 0,
	        integrity: 0,
	        is: 0,
	        keyParams: 0,
	        keyType: 0,
	        kind: 0,
	        label: 0,
	        lang: 0,
	        list: 0,
	        loop: HAS_BOOLEAN_VALUE,
	        low: 0,
	        manifest: 0,
	        marginHeight: 0,
	        marginWidth: 0,
	        max: 0,
	        maxLength: 0,
	        media: 0,
	        mediaGroup: 0,
	        method: 0,
	        min: 0,
	        minLength: 0,
	        // Caution; `option.selected` is not updated if `select.multiple` is
	        // disabled with `removeAttribute`.
	        multiple: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	        muted: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	        name: 0,
	        nonce: 0,
	        noValidate: HAS_BOOLEAN_VALUE,
	        open: HAS_BOOLEAN_VALUE,
	        optimum: 0,
	        pattern: 0,
	        placeholder: 0,
	        poster: 0,
	        preload: 0,
	        profile: 0,
	        radioGroup: 0,
	        readOnly: HAS_BOOLEAN_VALUE,
	        referrerPolicy: 0,
	        rel: 0,
	        required: HAS_BOOLEAN_VALUE,
	        reversed: HAS_BOOLEAN_VALUE,
	        role: 0,
	        rows: HAS_POSITIVE_NUMERIC_VALUE,
	        rowSpan: HAS_NUMERIC_VALUE,
	        sandbox: 0,
	        scope: 0,
	        scoped: HAS_BOOLEAN_VALUE,
	        scrolling: 0,
	        seamless: HAS_BOOLEAN_VALUE,
	        selected: MUST_USE_PROPERTY | HAS_BOOLEAN_VALUE,
	        shape: 0,
	        size: HAS_POSITIVE_NUMERIC_VALUE,
	        sizes: 0,
	        span: HAS_POSITIVE_NUMERIC_VALUE,
	        spellCheck: 0,
	        src: 0,
	        srcDoc: 0,
	        srcLang: 0,
	        srcSet: 0,
	        start: HAS_NUMERIC_VALUE,
	        step: 0,
	        style: 0,
	        summary: 0,
	        tabIndex: 0,
	        target: 0,
	        title: 0,
	        // Setting .type throws on non-<input> tags
	        type: 0,
	        useMap: 0,
	        value: MUST_USE_PROPERTY,
	        width: 0,
	        wmode: 0,
	        wrap: 0,

	        /**
	         * RDFa Properties
	         */
	        about: 0,
	        datatype: 0,
	        inlist: 0,
	        prefix: 0,
	        // property is also supported for OpenGraph in meta tags.
	        property: 0,
	        resource: 0,
	        typeof: 0,
	        vocab: 0,

	        /**
	         * Non-standard Properties
	         */
	        // autoCapitalize and autoCorrect are supported in Mobile Safari for
	        // keyboard hints.
	        autoCapitalize: 0,
	        autoCorrect: 0,
	        // autoSave allows WebKit/Blink to persist values of input fields on page reloads
	        autoSave: 0,
	        // color is for Safari mask-icon link
	        color: 0,
	        // itemProp, itemScope, itemType are for
	        // Microdata support. See http://schema.org/docs/gs.html
	        itemProp: 0,
	        itemScope: HAS_BOOLEAN_VALUE,
	        itemType: 0,
	        // itemID and itemRef are for Microdata support as well but
	        // only specified in the WHATWG spec document. See
	        // https://html.spec.whatwg.org/multipage/microdata.html#microdata-dom-api
	        itemID: 0,
	        itemRef: 0,
	        // results show looking glass icon and recent searches on input
	        // search fields in WebKit/Blink
	        results: 0,
	        // IE-only attribute that specifies security restrictions on an iframe
	        // as an alternative to the sandbox attribute on IE<10
	        security: 0,
	        // IE-only attribute that controls focus behavior
	        unselectable: 0,
	    },
	    attrNS: {},
	    domAttrs: {
	        acceptCharset: 'accept-charset',
	        className: 'class',
	        htmlFor: 'for',
	        httpEquiv: 'http-equiv',
	    },
	    domProps: {}
	}


	// svg config
	const xlink = 'http://www.w3.org/1999/xlink'
	const xml = 'http://www.w3.org/XML/1998/namespace'

	// We use attributes for everything SVG so let's avoid some duplication and run
	// code instead.
	// The following are all specified in the HTML config already so we exclude here.
	// - class (as className)
	// - color
	// - height
	// - id
	// - lang
	// - max
	// - media
	// - method
	// - min
	// - name
	// - style
	// - target
	// - type
	// - width
	const ATTRS = {
	    accentHeight: 'accent-height',
	    accumulate: 0,
	    additive: 0,
	    alignmentBaseline: 'alignment-baseline',
	    allowReorder: 'allowReorder',
	    alphabetic: 0,
	    amplitude: 0,
	    arabicForm: 'arabic-form',
	    ascent: 0,
	    attributeName: 'attributeName',
	    attributeType: 'attributeType',
	    autoReverse: 'autoReverse',
	    azimuth: 0,
	    baseFrequency: 'baseFrequency',
	    baseProfile: 'baseProfile',
	    baselineShift: 'baseline-shift',
	    bbox: 0,
	    begin: 0,
	    bias: 0,
	    by: 0,
	    calcMode: 'calcMode',
	    capHeight: 'cap-height',
	    clip: 0,
	    clipPath: 'clip-path',
	    clipRule: 'clip-rule',
	    clipPathUnits: 'clipPathUnits',
	    colorInterpolation: 'color-interpolation',
	    colorInterpolationFilters: 'color-interpolation-filters',
	    colorProfile: 'color-profile',
	    colorRendering: 'color-rendering',
	    contentScriptType: 'contentScriptType',
	    contentStyleType: 'contentStyleType',
	    cursor: 0,
	    cx: 0,
	    cy: 0,
	    d: 0,
	    decelerate: 0,
	    descent: 0,
	    diffuseConstant: 'diffuseConstant',
	    direction: 0,
	    display: 0,
	    divisor: 0,
	    dominantBaseline: 'dominant-baseline',
	    dur: 0,
	    dx: 0,
	    dy: 0,
	    edgeMode: 'edgeMode',
	    elevation: 0,
	    enableBackground: 'enable-background',
	    end: 0,
	    exponent: 0,
	    externalResourcesRequired: 'externalResourcesRequired',
	    fill: 0,
	    fillOpacity: 'fill-opacity',
	    fillRule: 'fill-rule',
	    filter: 0,
	    filterRes: 'filterRes',
	    filterUnits: 'filterUnits',
	    floodColor: 'flood-color',
	    floodOpacity: 'flood-opacity',
	    focusable: 0,
	    fontFamily: 'font-family',
	    fontSize: 'font-size',
	    fontSizeAdjust: 'font-size-adjust',
	    fontStretch: 'font-stretch',
	    fontStyle: 'font-style',
	    fontVariant: 'font-variant',
	    fontWeight: 'font-weight',
	    format: 0,
	    from: 0,
	    fx: 0,
	    fy: 0,
	    g1: 0,
	    g2: 0,
	    glyphName: 'glyph-name',
	    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
	    glyphOrientationVertical: 'glyph-orientation-vertical',
	    glyphRef: 'glyphRef',
	    gradientTransform: 'gradientTransform',
	    gradientUnits: 'gradientUnits',
	    hanging: 0,
	    horizAdvX: 'horiz-adv-x',
	    horizOriginX: 'horiz-origin-x',
	    ideographic: 0,
	    imageRendering: 'image-rendering',
	    in : 0,
	    in2: 0,
	    intercept: 0,
	    k: 0,
	    k1: 0,
	    k2: 0,
	    k3: 0,
	    k4: 0,
	    kernelMatrix: 'kernelMatrix',
	    kernelUnitLength: 'kernelUnitLength',
	    kerning: 0,
	    keyPoints: 'keyPoints',
	    keySplines: 'keySplines',
	    keyTimes: 'keyTimes',
	    lengthAdjust: 'lengthAdjust',
	    letterSpacing: 'letter-spacing',
	    lightingColor: 'lighting-color',
	    limitingConeAngle: 'limitingConeAngle',
	    local: 0,
	    markerEnd: 'marker-end',
	    markerMid: 'marker-mid',
	    markerStart: 'marker-start',
	    markerHeight: 'markerHeight',
	    markerUnits: 'markerUnits',
	    markerWidth: 'markerWidth',
	    mask: 0,
	    maskContentUnits: 'maskContentUnits',
	    maskUnits: 'maskUnits',
	    mathematical: 0,
	    mode: 0,
	    numOctaves: 'numOctaves',
	    offset: 0,
	    opacity: 0,
	    operator: 0,
	    order: 0,
	    orient: 0,
	    orientation: 0,
	    origin: 0,
	    overflow: 0,
	    overlinePosition: 'overline-position',
	    overlineThickness: 'overline-thickness',
	    paintOrder: 'paint-order',
	    panose1: 'panose-1',
	    pathLength: 'pathLength',
	    patternContentUnits: 'patternContentUnits',
	    patternTransform: 'patternTransform',
	    patternUnits: 'patternUnits',
	    pointerEvents: 'pointer-events',
	    points: 0,
	    pointsAtX: 'pointsAtX',
	    pointsAtY: 'pointsAtY',
	    pointsAtZ: 'pointsAtZ',
	    preserveAlpha: 'preserveAlpha',
	    preserveAspectRatio: 'preserveAspectRatio',
	    primitiveUnits: 'primitiveUnits',
	    r: 0,
	    radius: 0,
	    refX: 'refX',
	    refY: 'refY',
	    renderingIntent: 'rendering-intent',
	    repeatCount: 'repeatCount',
	    repeatDur: 'repeatDur',
	    requiredExtensions: 'requiredExtensions',
	    requiredFeatures: 'requiredFeatures',
	    restart: 0,
	    result: 0,
	    rotate: 0,
	    rx: 0,
	    ry: 0,
	    scale: 0,
	    seed: 0,
	    shapeRendering: 'shape-rendering',
	    slope: 0,
	    spacing: 0,
	    specularConstant: 'specularConstant',
	    specularExponent: 'specularExponent',
	    speed: 0,
	    spreadMethod: 'spreadMethod',
	    startOffset: 'startOffset',
	    stdDeviation: 'stdDeviation',
	    stemh: 0,
	    stemv: 0,
	    stitchTiles: 'stitchTiles',
	    stopColor: 'stop-color',
	    stopOpacity: 'stop-opacity',
	    strikethroughPosition: 'strikethrough-position',
	    strikethroughThickness: 'strikethrough-thickness',
	    string: 0,
	    stroke: 0,
	    strokeDasharray: 'stroke-dasharray',
	    strokeDashoffset: 'stroke-dashoffset',
	    strokeLinecap: 'stroke-linecap',
	    strokeLinejoin: 'stroke-linejoin',
	    strokeMiterlimit: 'stroke-miterlimit',
	    strokeOpacity: 'stroke-opacity',
	    strokeWidth: 'stroke-width',
	    surfaceScale: 'surfaceScale',
	    systemLanguage: 'systemLanguage',
	    tableValues: 'tableValues',
	    targetX: 'targetX',
	    targetY: 'targetY',
	    textAnchor: 'text-anchor',
	    textDecoration: 'text-decoration',
	    textRendering: 'text-rendering',
	    textLength: 'textLength',
	    to: 0,
	    transform: 0,
	    u1: 0,
	    u2: 0,
	    underlinePosition: 'underline-position',
	    underlineThickness: 'underline-thickness',
	    unicode: 0,
	    unicodeBidi: 'unicode-bidi',
	    unicodeRange: 'unicode-range',
	    unitsPerEm: 'units-per-em',
	    vAlphabetic: 'v-alphabetic',
	    vHanging: 'v-hanging',
	    vIdeographic: 'v-ideographic',
	    vMathematical: 'v-mathematical',
	    values: 0,
	    vectorEffect: 'vector-effect',
	    version: 0,
	    vertAdvY: 'vert-adv-y',
	    vertOriginX: 'vert-origin-x',
	    vertOriginY: 'vert-origin-y',
	    viewBox: 'viewBox',
	    viewTarget: 'viewTarget',
	    visibility: 0,
	    widths: 0,
	    wordSpacing: 'word-spacing',
	    writingMode: 'writing-mode',
	    x: 0,
	    xHeight: 'x-height',
	    x1: 0,
	    x2: 0,
	    xChannelSelector: 'xChannelSelector',
	    xlinkActuate: 'xlink:actuate',
	    xlinkArcrole: 'xlink:arcrole',
	    xlinkHref: 'xlink:href',
	    xlinkRole: 'xlink:role',
	    xlinkShow: 'xlink:show',
	    xlinkTitle: 'xlink:title',
	    xlinkType: 'xlink:type',
	    xmlBase: 'xml:base',
	    xmlns: 0,
	    xmlnsXlink: 'xmlns:xlink',
	    xmlLang: 'xml:lang',
	    xmlSpace: 'xml:space',
	    y: 0,
	    y1: 0,
	    y2: 0,
	    yChannelSelector: 'yChannelSelector',
	    z: 0,
	    zoomAndPan: 'zoomAndPan',
	}

	const SVGDOMPropertyConfig = {
	    props: {},
	    attrNS: {
	        xlinkActuate: xlink,
	        xlinkArcrole: xlink,
	        xlinkHref: xlink,
	        xlinkRole: xlink,
	        xlinkShow: xlink,
	        xlinkTitle: xlink,
	        xlinkType: xlink,
	        xmlBase: xml,
	        xmlLang: xml,
	        xmlSpace: xml,
	    },
	    domAttrs: {},
	    domProps: {}
	}

	Object.keys(ATTRS).map((key) => {
	    SVGDOMPropertyConfig.props[key] = 0
	    if (ATTRS[key]) {
	        SVGDOMPropertyConfig.domAttrs[key] = ATTRS[key]
	    }
	})


	// merge html and svg config into properties
	mergeConfigToProperties(HTMLDOMPropertyConfig)
	mergeConfigToProperties(SVGDOMPropertyConfig)


	function mergeConfigToProperties(config) {
	    let {
	        // all react/react-lite supporting property names in here
	        props,
	        // attributes namespace in here
	        attrNS,
	        // propName in props which should use to be dom-attribute in here
	        domAttrs,
	        // propName in props which should use to be dom-property in here
	        domProps
	    } = config

	    for (let propName in props) {
	        if (!props.hasOwnProperty(propName)) {
	            continue
	        }
	        let propConfig = props[propName]
	        properties[propName] = {
	            attributeName: domAttrs.hasOwnProperty(propName) ? domAttrs[propName] : propName.toLowerCase(),
	            propertyName: domProps.hasOwnProperty(propName) ? domProps[propName] : propName,
	            attributeNamespace: attrNS.hasOwnProperty(propName) ? attrNS[propName] : null,
	            mustUseProperty: checkMask(propConfig, MUST_USE_PROPERTY),
	            hasBooleanValue: checkMask(propConfig, HAS_BOOLEAN_VALUE),
	            hasNumericValue: checkMask(propConfig, HAS_NUMERIC_VALUE),
	            hasPositiveNumericValue: checkMask(propConfig, HAS_POSITIVE_NUMERIC_VALUE),
	            hasOverloadedBooleanValue: checkMask(propConfig, HAS_OVERLOADED_BOOLEAN_VALUE),
	        }
	    }
	}

	function checkMask(value, bitmask) {
	    return (value & bitmask) === bitmask
	}


// *********************************************************************************************************
// 										DOMPropertyOperations.js
// *********************************************************************************************************
 

	/**
	 * DOM Property Operations
	 */

	/**
	 * Sets the value for a property on a node.
	 *
	 * @param {DOMElement} node
	 * @param {string} name
	 * @param {*} value
	 */
	function setPropValue(node, name, value) {
	    let propInfo = properties.hasOwnProperty(name) && properties[name]
	    if (propInfo) {
	        // should delete value from dom
	        if (value == null ||
	            (propInfo.hasBooleanValue && !value) ||
	            (propInfo.hasNumericValue && isNaN(value)) ||
	            (propInfo.hasPositiveNumericValue && (value < 1)) ||
	            (propInfo.hasOverloadedBooleanValue && value === false)) {
	            removePropValue(node, name)
	        } else if (propInfo.mustUseProperty) {
	            let propName = propInfo.propertyName;
	            // dom.value has side effect
	            if (propName !== 'value' || '' + node[propName] !== '' + value) {
	                node[propName] = value
	            }
	        } else {
	            let attributeName = propInfo.attributeName
	            let namespace = propInfo.attributeNamespace

	            // `setAttribute` with objects becomes only `[object]` in IE8/9,
	            // ('' + value) makes it output the correct toString()-value.
	            if (namespace) {
	                node.setAttributeNS(namespace, attributeName, '' + value)
	            } else if (propInfo.hasBooleanValue || (propInfo.hasOverloadedBooleanValue && value === true)) {
	                node.setAttribute(attributeName, '')
	            } else {
	                node.setAttribute(attributeName, '' + value)
	            }
	        }
	    } else if (isCustomAttribute(name) && VALID_ATTRIBUTE_NAME_REGEX.test(name)) {
	        if (value == null) {
	            node.removeAttribute(name)
	        } else {
	            node.setAttribute(name, '' + value)
	        }
	    }
	}
	
	/**
	 * Deletes the value for a property on a node.
	 *
	 * @param {DOMElement} node
	 * @param {string} name
	 */
	function removePropValue(node, name) {
	    let propInfo = properties.hasOwnProperty(name) && properties[name]
	    if (propInfo) {
	        if (propInfo.mustUseProperty) {
	            let propName = propInfo.propertyName;
	            if (propInfo.hasBooleanValue) {
	                node[propName] = false
	            } else {
	                // dom.value accept string value has side effect
	                if (propName !== 'value' || '' + node[propName] !== '') {
	                    node[propName] = ''
	                }
	            }
	        } else {
	            node.removeAttribute(propInfo.attributeName)
	        }
	    } else if (isCustomAttribute(name)) {
	        node.removeAttribute(name)
	    }
	}


// *********************************************************************************************************
// 									PropTypes.js
// *********************************************************************************************************


	let check = () => check
	check.isRequired = check
	let PropTypes = {
	    "array": check,
	    "bool": check,
	    "func": check,
	    "number": check,
	    "object": check,
	    "string": check,
	    "any": check,
	    "arrayOf": check,
	    "element": check,
	    "instanceOf": check,
	    "node": check,
	    "objectOf": check,
	    "oneOf": check,
	    "oneOfType": check,
	    "shape": check
	}



// *********************************************************************************************************
// 									PureComponent.js
// *********************************************************************************************************

	function PureComponent(props, context) {
		Component.call(this, props, context)
	}
	
	PureComponent.prototype = Object.create(Component.prototype)
	PureComponent.prototype.constructor = PureComponent
	PureComponent.prototype.isPureReactComponent = true
	PureComponent.prototype.shouldComponentUpdate = shallowCompare

	function shallowCompare(nextProps, nextState) {
		return !shallowEqual(this.props, nextProps) ||
	            !shallowEqual(this.state, nextState)
	}


// *********************************************************************************************************
// 									ReactDOM.js
// *********************************************************************************************************

	let ReactDOM = {};

	function isValidContainer(node) {
	    return !!(node && (
	        node.nodeType === ELEMENT_NODE_TYPE ||
	        node.nodeType === DOC_NODE_TYPE ||
	        node.nodeType === DOCUMENT_FRAGMENT_NODE_TYPE
	    ))
	}

	let pendingRendering = {}
	let vnodeStore = {}
	function renderTreeIntoContainer(vnode, container, callback, parentContext) {
		if (!vnode.vtype) {
			throw new Error(`cannot render ${ vnode } to container`)
		}
		if (!isValidContainer(container)) {
			throw new Error(`container ${container} is not a DOM element`)
		}
		let id = container[COMPONENT_ID] || (container[COMPONENT_ID] = _.getUid())
		let argsCache = pendingRendering[id]

		// component lify cycle method maybe call root rendering
		// should bundle them and render by only one time
		if (argsCache) {
			if (argsCache === true) {
				pendingRendering[id] = argsCache = { vnode, callback, parentContext }
			} else {
				argsCache.vnode = vnode
				argsCache.parentContext = parentContext
				argsCache.callback = argsCache.callback ? _.pipe(argsCache.callback, callback) : callback
			}
			return
		}

		pendingRendering[id] = true
		let oldVnode = null
		let rootNode = null
		if (oldVnode = vnodeStore[id]) {
			rootNode = compareTwoVnodes(oldVnode, vnode, container.firstChild, parentContext)
		} else {
			rootNode = initVnode(vnode, parentContext, container.namespaceURI)

			//<exact:
			if( !vnode.__exact_flag_no_replace ) {
				var childNode = null
				while (childNode = container.lastChild) {
					container.removeChild(childNode)
				}
			}

			container.appendChild(rootNode)
		}
		vnodeStore[id] = vnode
		let isPending = updateQueue.isPending
		updateQueue.isPending = true
		clearPending()
		argsCache = pendingRendering[id]
		delete pendingRendering[id]

		let result = null
		if (typeof argsCache === 'object') {
			result = renderTreeIntoContainer(argsCache.vnode, container, argsCache.callback, argsCache.parentContext)
		} else if (vnode.vtype === VELEMENT) {
			result = rootNode
		} else if (vnode.vtype === VCOMPONENT) {
			result = rootNode.cache[vnode.uid]
		}

		if (!isPending) {
			updateQueue.isPending = false
			updateQueue.batchUpdate()
		}

		if (callback) {
			callback.call(result)
		}

		return result
	}

	function render(vnode, container, callback) {
		return renderTreeIntoContainer(vnode, container, callback)
	}
	ReactDOM.render = render;
	
	function unstable_renderSubtreeIntoContainer(parentComponent, subVnode, container, callback) {
		let context = parentComponent.$cache.parentContext
		return renderTreeIntoContainer(subVnode, container, callback, context)
	}
	ReactDOM.unstable_renderSubtreeIntoContainer = unstable_renderSubtreeIntoContainer;
	
	function unmountComponentAtNode(container) {
		if (!container.nodeName) {
			throw new Error('expect node')
		}
		let id = container[COMPONENT_ID]
		let vnode = null
		if (vnode = vnodeStore[id]) {
			destroyVnode(vnode, container.firstChild)
			container.removeChild(container.firstChild)
			delete vnodeStore[id]
			return true
		}
		return false
	}
	ReactDOM.unmountComponentAtNode = unmountComponentAtNode;
	
	function findDOMNode(node) {
		if (node == null) {
			return null
		}
		if (node.nodeName) {
			return node
		}
		let component = node
		// if component.node equal to false, component must be unmounted
		if (component.getDOMNode && component.$cache.isMounted) {
			return component.getDOMNode()
		}
		throw new Error('findDOMNode can not find Node')
	}
	ReactDOM.findDOMNode = findDOMNode;

// *********************************************************************************************************
// 									constant.js
// *********************************************************************************************************

	/*
	  key/value configs
	*/

	const HTML_KEY = '__direct'										//<exact: changed from 'dangerouslySetInnerHTML'
	const SVGNamespaceURI = 'http://www.w3.org/2000/svg'
	const COMPONENT_ID = 'liteid'
	const VTEXT = 1
	const VELEMENT = 2
	const VSTATELESS = 3
	const VCOMPONENT = 4
	const VCOMMENT = 5
	const CREATE = 1
	const REMOVE = 2
	const UPDATE = 3
	const ELEMENT_NODE_TYPE = 1
	const DOC_NODE_TYPE = 9
	const DOCUMENT_FRAGMENT_NODE_TYPE = 11


// *********************************************************************************************************
// 									createClass.js
// *********************************************************************************************************


	function eachMixin(mixins, iteratee) {
		mixins.forEach(mixin => {
			if (mixin) {
				if (_.isArr(mixin.mixins)) {
					eachMixin(mixin.mixins, iteratee)
				}
				iteratee(mixin)
			}
		})
	}

	function combineMixinToProto(proto, mixin) {
		for (let key in mixin) {
			if (!mixin.hasOwnProperty(key)) {
				continue
			}
			let value = mixin[key]
			if (key === 'getInitialState') {
				_.addItem(proto.$getInitialStates, value)
				continue
			}
			let curValue = proto[key]
			if (_.isFn(curValue) && _.isFn(value)) {
				proto[key] = _.pipe(curValue, value)
			} else {
				proto[key] = value
			}
		}
	}

	function combineMixinToClass(Component, mixin) {
		if (mixin.propTypes) {
			Component.propTypes = Component.propTypes || {}
			_.extend(Component.propTypes, mixin.propTypes)
		}
		if (mixin.contextTypes) {
			Component.contextTypes = Component.contextTypes || {}
			_.extend(Component.contextTypes, mixin.contextTypes)
		}
		_.extend(Component, mixin.statics)
		if (_.isFn(mixin.getDefaultProps)) {
			Component.defaultProps = Component.defaultProps || {}
			_.extend(Component.defaultProps, mixin.getDefaultProps())
		}
	}

	function bindContext(obj, source) {
		for (let key in source) {
			if (source.hasOwnProperty(key)) {
				if (_.isFn(source[key])) {
					obj[key] = source[key].bind(obj)
				}
			}
		}
	}

	let Facade = function() {}
	Facade.prototype = Component.prototype

	function getInitialState() {
		let state = {}
		let setState = this.setState
		this.setState = Facade
		this.$getInitialStates.forEach(getInitialState => {
			if (_.isFn(getInitialState)) {
				_.extend(state, getInitialState.call(this))
			}
		})
		this.setState = setState
		return state
	}

	function createClass(spec) {
		if (!_.isFn(spec.render)) {
			throw new Error('createClass: spec.render is not function')
		}
		let specMixins = spec.mixins || []
		let mixins = specMixins.concat(spec)
		spec.mixins = null
		function Klass(props, context) {
			Component.call(this, props, context)
			this.constructor = Klass
			spec.autobind !== false && bindContext(this, Klass.prototype)
			this.state = this.getInitialState() || this.state
		}
		Klass.displayName = spec.displayName
		let proto = Klass.prototype = new Facade()
		proto.$getInitialStates = []
		eachMixin(mixins, mixin => {
			combineMixinToProto(proto, mixin)
			combineMixinToClass(Klass, mixin)
		})
		proto.getInitialState = getInitialState
		spec.mixins = specMixins
		return Klass
	}



// *********************************************************************************************************
// 									createElement.js
// *********************************************************************************************************

	function createElement(type, props, children ) {
		let vtype = null,
			renderer = null

		//<exact:
		if( type instanceof Component ) {
			vtype = VCOMPONENT;
			renderer = type;
		} 
		//exact>
		else if (typeof type === 'string') {
			vtype = VELEMENT
		} else if (typeof type === 'function') {
			if (type.prototype && typeof type.prototype.forceUpdate === 'function') {
				vtype = VCOMPONENT
			} else {
				vtype = VSTATELESS
			}
		} else {
			throw new Error(`React.createElement: unexpect type [ ${type} ]`)
		}

		let key = null
		let ref = null
		let finalProps = {}
		if (props != null) {
			for (let propKey in props) {
				if (!props.hasOwnProperty(propKey)) {
					continue
				}
				if (propKey === 'key') {
					if (props.key !== undefined) {
						key = '' + props.key
					}
				} else if (propKey === 'ref') {
					if (props.ref !== undefined) {
						ref = props.ref
					}
				} else {
					finalProps[propKey] = props[propKey]
				}
			}
		}

		let defaultProps = type.defaultProps

		if (defaultProps) {
			for (let propKey in defaultProps) {
				if (finalProps[propKey] === undefined) {
					finalProps[propKey] = defaultProps[propKey]
				}
			}
		}

		let argsLen = arguments.length
		let finalChildren = children

		if (argsLen > 3) {
			finalChildren = Array(argsLen - 2)
			for (let i = 2; i < argsLen; i++) {
				finalChildren[i - 2] = arguments[i]
			}
		}

		if (finalChildren !== undefined) {
			finalProps.children = finalChildren
		}

		return createVnode(vtype, type, finalProps, key, ref, renderer )
	}
	
	function isValidElement(obj) {
		return obj != null && !!obj.vtype
	}
	
	function cloneElement(originElem, props, ...children) {
		let { type, key, ref } = originElem
		let newProps = _.extend(_.extend({ key, ref }, originElem.props), props)
		let vnode = createElement(type, newProps, ...children)
		if (vnode.ref === originElem.ref) {
			vnode.refs = originElem.refs
		}
		return vnode
	}
	
	function createFactory(type) {
		let factory = (...args) => createElement(type, ...args)
		factory.type = type
		return factory
	}
	

// *********************************************************************************************************
// 									event-system.js
// *********************************************************************************************************

	// event config
	const unbubbleEvents = {
	    onmouseleave: 1,
	    onmouseenter: 1,
	    onload: 1,
	    onunload: 1,
	    onscroll: 1,
	    onfocus: 1,
	    onblur: 1,
	    onrowexit: 1,
	    onbeforeunload: 1,
	    onstop: 1,
	    ondragdrop: 1,
	    ondragenter: 1,
	    ondragexit: 1,
	    ondraggesture: 1,
	    ondragover: 1,
	    oncontextmenu: 1
	}
	
	function getEventName(key) {
	    if (key === 'onDoubleClick') {
	        key = 'ondblclick'
	    } else if (key === 'onTouchTap') {
	        key = 'onclick'
	    }

	    return key.toLowerCase()
	}
	

	// Mobile Safari does not fire properly bubble click events on
	// non-interactive elements, which means delegated click listeners do not
	// fire. The workaround for this bug involves attaching an empty click
	// listener on the target node.
	let inMobile = 'ontouchstart' in document
	let emptyFunction = () => {}
	let ON_CLICK_KEY = 'onclick'

	let eventTypes = {}
	function addEvent(elem, eventType, listener) {
	    eventType = getEventName(eventType)

	    let eventStore = elem.eventStore || (elem.eventStore = {})
	    eventStore[eventType] = listener

	    if (unbubbleEvents[eventType] === 1) {
	        elem[eventType] = dispatchUnbubbleEvent
	        return
	    } else if (!eventTypes[eventType]) {
	        // onclick -> click
	        document.addEventListener(eventType.substr(2), dispatchEvent, false)
	        eventTypes[eventType] = true
	    }

	    if (inMobile && eventType === ON_CLICK_KEY) {
	        elem.addEventListener('click', emptyFunction, false)
	        return
	    }

	    let nodeName = elem.nodeName

	    if (eventType === 'onchange' && (nodeName === 'INPUT' || nodeName === 'TEXTAREA')) {
	        addEvent(elem, 'oninput', listener)
	    }
	}
	
	function removeEvent(elem, eventType) {
	    eventType = getEventName(eventType)

	    let eventStore = elem.eventStore || (elem.eventStore = {})
	    delete eventStore[eventType]

	    if (unbubbleEvents[eventType] === 1) {
	        elem[eventType] = null
	        return
	    } else if (inMobile && eventType === ON_CLICK_KEY) {
	        elem.removeEventListener('click', emptyFunction, false)
	        return
	    }

	    let nodeName = elem.nodeName

	    if (eventType === 'onchange' && (nodeName === 'INPUT' || nodeName === 'TEXTAREA')) {
	        delete eventStore['oninput']
	    }
	}
	
	function dispatchEvent(event) {
	    let { target, type } = event
	    let eventType = 'on' + type
	    let syntheticEvent

	    updateQueue.isPending = true
	    while (target) {
	        let { eventStore } = target
	        let listener = eventStore && eventStore[eventType]
	        if (!listener) {
	            target = target.parentNode
	            continue
	        }
	        if (!syntheticEvent) {
	            syntheticEvent = createSyntheticEvent(event)
	        }
	        syntheticEvent.currentTarget = target
	        listener.call(target, syntheticEvent)
	        if (syntheticEvent.$cancalBubble) {
	            break
	        }
	        target = target.parentNode
	    }
	    updateQueue.isPending = false
	    updateQueue.batchUpdate()
	}

	function dispatchUnbubbleEvent(event) {
	    let target = event.currentTarget || event.target
	    let eventType = 'on' + event.type
	    let syntheticEvent = createSyntheticEvent(event)
	    
	    syntheticEvent.currentTarget = target
	    updateQueue.isPending = true

	    let { eventStore } = target
	    let listener = eventStore && eventStore[eventType]
	    if (listener) {
	    	listener.call(target, syntheticEvent)
	    }
	    
	    updateQueue.isPending = false
	    updateQueue.batchUpdate()
	}

	function createSyntheticEvent(nativeEvent) {
	    let syntheticEvent = {}
	    let cancalBubble = () => syntheticEvent.$cancalBubble = true
	    syntheticEvent.nativeEvent = nativeEvent
	    syntheticEvent.persist = _.noop
	    for (let key in nativeEvent) {
	        if (typeof nativeEvent[key] !== 'function') {
	            syntheticEvent[key] = nativeEvent[key]
	        } else if (key === 'stopPropagation' || key === 'stopImmediatePropagation') {
	            syntheticEvent[key] = cancalBubble
	        } else {
	            syntheticEvent[key] = nativeEvent[key].bind(nativeEvent)
	        }
	    }
	    return syntheticEvent
	}

// *********************************************************************************************************
// 									util.js
// *********************************************************************************************************

	let _ = {};

	// util
	
	function isFn(obj) {
	    return typeof obj === 'function'
	}
	_.isFn = isFn;

	let isArr = Array.isArray
	_.isArr = isArr;

	function noop() {}
	_.noop = noop;

	function identity(obj) {
	    return obj
	}
	_.identity = identity;

	function pipe(fn1, fn2) {
	    return function() {
	        fn1.apply(this, arguments)
	        return fn2.apply(this, arguments)
	    }
	}
	_.pipe = pipe;

	function addItem(list, item) {
	    list[list.length] = item
	}
	_.addItem = addItem;

	function flatEach(list, iteratee, a) {
	    let len = list.length
	    let i = -1

	    while (len--) {
	        let item = list[++i]
	        if (isArr(item)) {
	            flatEach(item, iteratee, a)
	        } else {
	            iteratee(item, a)
	        }
	    }
	}
	_.flatEach = flatEach;

	function extend(to, from) {
	    if (!from) {
	        return to
	    }
	    var keys = Object.keys(from)
	    var i = keys.length
	    while (i--) {
	        to[keys[i]] = from[keys[i]]
	    }
	    return to
	}
	_.extend = extend;


	let uid = 0
	function getUid() {
	    return ++uid
	}
	_.getUid = getUid;

	let EVENT_KEYS = /^on/i
	_.EVENT_KEYS = EVENT_KEYS;

	function setProp(elem, key, value, isCustomComponent) {
	    if (EVENT_KEYS.test(key)) {
	        addEvent(elem, key, value)
	    } else if (key === 'style') {
	        setStyle(elem.style, value)
	    } else if (key === HTML_KEY) {
	        if (value && value.__html != null) {
	            elem.innerHTML = value.__html
	        }
	    } else if (isCustomComponent) {
	        if (value == null) {
	            elem.removeAttribute(key)
	        } else {
	            elem.setAttribute(key, '' + value)
	        }
	    } else {
	        setPropValue(elem, key, value)
	    }
	}

	function removeProp(elem, key, oldValue, isCustomComponent) {
	    if (EVENT_KEYS.test(key)) {
	        removeEvent(elem, key)
	    } else if (key === 'style') {
	        removeStyle(elem.style, oldValue)
	    } else if (key === HTML_KEY) {
	        elem.innerHTML = ''
	    } else if (isCustomComponent) {
	        elem.removeAttribute(key)
	    } else {
	        removePropValue(elem, key)
	    }
	}

	function patchProp(elem, key, value, oldValue, isCustomComponent) {
	    if (key === 'value' || key === 'checked') {
	        oldValue = elem[key]
	    }
	    if (value === oldValue) {
	        return
	    }
	    if (value === undefined) {
	        removeProp(elem, key, oldValue, isCustomComponent)
	        return
	    }
	    if (key === 'style') {
	        patchStyle(elem.style, oldValue, value)
	    } else {
	        setProp(elem, key, value, isCustomComponent)
	    }
	}

	function setProps(elem, props, isCustomComponent) {
	    for (let key in props) {
	        if (key !== 'children') {
	            setProp(elem, key, props[key], isCustomComponent)
	        }
	    }
	}
	_.setProps = setProps;

	function patchProps(elem, props, newProps, isCustomComponent) {
	    for (let key in props) {
	        if (key !== 'children') {
	            if (newProps.hasOwnProperty(key)) {
	                patchProp(elem, key, newProps[key], props[key], isCustomComponent)
	            } else {
	                removeProp(elem, key, props[key], isCustomComponent)
	            }
	        }
	    }
	    for (let key in newProps) {
	        if (key !== 'children' && !props.hasOwnProperty(key)) {
	            setProp(elem, key, newProps[key], isCustomComponent)
	        }
	    }
	}
	_.patchProps = patchProps;

	if (!Object.freeze) {
	    Object.freeze = identity
	}



// *********************************************************************************************************
// 									virtual-dom.js
// *********************************************************************************************************


	/**
	 * current stateful component's refs property
	 * will attach to every vnode created by calling component.render method
	 * <exact: added renderer parameter
	 */
	let refs = null

	function createVnode(vtype, type, props, key, ref,renderer) {
	    let vnode = {
	        vtype: vtype,
	        type: type,
	        props: props,
	        refs: refs,
	        key: key,
	        ref: ref,
	        renderer: renderer,		//<exact: added renderer
	    }
	    if (vtype === VSTATELESS || vtype === VCOMPONENT) {
	        vnode.uid = _.getUid()
	    }
	    return vnode
	}
	
	function initVnode(vnode, parentContext, namespaceURI) {
	    let { vtype } = vnode
	    let node = null
	    if (!vtype) { // init text
	        node = document.createTextNode(vnode)
	    } else if (vtype === VELEMENT) { // init element
	        node = initVelem(vnode, parentContext, namespaceURI)
	    } else if (vtype === VCOMPONENT) { // init stateful component
	        node = initVcomponent(vnode, parentContext, namespaceURI)
	    } else if (vtype === VSTATELESS) { // init stateless component
	        node = initVstateless(vnode, parentContext, namespaceURI)
	    } else if (vtype === VCOMMENT) { // init comment
	        node = document.createComment(`react-text: ${ vnode.uid || _.getUid() }`)
	    }
	    return node
	}
	
	function updateVnode(vnode, newVnode, node, parentContext) {
	    let { vtype } = vnode

	    if (vtype === VCOMPONENT) {
	        return updateVcomponent(vnode, newVnode, node, parentContext)
	    }

	    if (vtype === VSTATELESS) {
	        return updateVstateless(vnode, newVnode, node, parentContext)
	    }

	    // ignore VCOMMENT and other vtypes
	    if (vtype !== VELEMENT) {
	        return node
	    }

	    let oldHtml = vnode.props[HTML_KEY] && vnode.props[HTML_KEY].__html
	    if (oldHtml != null) {
	        updateVelem(vnode, newVnode, node, parentContext)
	        initVchildren(newVnode, node, parentContext)
	    } else {
	        updateVChildren(vnode, newVnode, node, parentContext)
	        updateVelem(vnode, newVnode, node, parentContext)
	    }
	    return node
	}

	function updateVChildren(vnode, newVnode, node, parentContext) {
	    let patches = {
	        removes: [],
	        updates: [],
	        creates: [],
	    }
	    diffVchildren(patches, vnode, newVnode, node, parentContext)
	    _.flatEach(patches.removes, applyDestroy)
	    _.flatEach(patches.updates, applyUpdate)
	    _.flatEach(patches.creates, applyCreate)
	}

	function applyUpdate(data) {
	    if (!data) {
	        return
	    }
	    let vnode = data.vnode
	    let newNode = data.node

	    // update
	    if (!data.shouldIgnore) {
	        if (!vnode.vtype) {
	            newNode.replaceData(0, newNode.length, data.newVnode)
	        } else if (vnode.vtype === VELEMENT) {
	            updateVelem(vnode, data.newVnode, newNode, data.parentContext)
	        } else if (vnode.vtype === VSTATELESS) {
	            newNode = updateVstateless(vnode, data.newVnode, newNode, data.parentContext)
	        } else if (vnode.vtype === VCOMPONENT) {
	            newNode = updateVcomponent(vnode, data.newVnode, newNode, data.parentContext)
	        }
	    }

	    // re-order
	    let currentNode = newNode.parentNode.childNodes[data.index]
	    if (currentNode !== newNode) {
	        newNode.parentNode.insertBefore(newNode, currentNode)
	    }
	    return newNode
	}


	function applyDestroy(data) {
	    destroyVnode(data.vnode, data.node)
	    data.node.parentNode.removeChild(data.node)
	}

	function applyCreate(data) {
	    let node = initVnode(data.vnode, data.parentContext, data.parentNode.namespaceURI)
	    data.parentNode.insertBefore(node, data.parentNode.childNodes[data.index])
	}


	/**
	 * Only vnode which has props.children need to call destroy function
	 * to check whether subTree has component that need to call lify-cycle method and release cache.
	 */
	function destroyVnode(vnode, node) {
	    let { vtype } = vnode
	    if (vtype === VELEMENT) { // destroy element
	        destroyVelem(vnode, node)
	    } else if (vtype === VCOMPONENT) { // destroy state component
	        destroyVcomponent(vnode, node)
	    } else if (vtype === VSTATELESS) { // destroy stateless component
	        destroyVstateless(vnode, node)
	    }
	}
	
	function initVelem(velem, parentContext, namespaceURI) {
	    let { type, props } = velem
	    let node = null

	    if (type === 'svg' || namespaceURI === SVGNamespaceURI) {
	        node = document.createElementNS(SVGNamespaceURI, type)
	        namespaceURI = SVGNamespaceURI
	    } else {
	        node = document.createElement(type)
	    }


	    initVchildren(velem, node, parentContext)

	    let isCustomComponent = type.indexOf('-') >= 0 || props.is != null
	    _.setProps(node, props, isCustomComponent)

	    if (velem.refs && velem.ref != null) {
	        _.addItem(pendingRefs, velem)
	        _.addItem(pendingRefs, node)
	    }

	    return node
	}

	function initVchildren(velem, node, parentContext) {
	    let vchildren = node.vchildren = getFlattenChildren(velem)
	    let namespaceURI = node.namespaceURI
	    for (let i = 0, len = vchildren.length; i < len; i++) {
	        node.appendChild(initVnode(vchildren[i], parentContext, namespaceURI))
	    }
	}

	function getFlattenChildren(vnode) {
	    let { children } = vnode.props
	    let vchildren = []
	    if (_.isArr(children)) {
	        _.flatEach(children, collectChild, vchildren)
	    } else {
	        collectChild(children, vchildren)
	    }
	    return vchildren
	}

	function collectChild(child, children) {
	    if (child != null && typeof child !== 'boolean') {
	        if (!child.vtype) {
	            // convert immutablejs data
	            if (child.toJS) {
	                child = child.toJS()
	                if (_.isArr(child)) {
	                    _.flatEach(child, collectChild, children)
	                } else {
	                    collectChild(child, children)
	                }
	                return
	            }
	            child = '' + child
	        }
	        children[children.length] = child
	    }
	}

	function diffVchildren(patches, vnode, newVnode, node, parentContext) {
	    let { childNodes, vchildren } = node
	    let newVchildren = node.vchildren = getFlattenChildren(newVnode)
	    let vchildrenLen = vchildren.length
	    let newVchildrenLen = newVchildren.length

	    if (vchildrenLen === 0) {
	        if (newVchildrenLen > 0) {
	            for (let i = 0; i < newVchildrenLen; i++) {
	                _.addItem(patches.creates, {
	                    vnode: newVchildren[i],
	                    parentNode: node,
	                    parentContext: parentContext,
	                    index: i,
	                })
	            }
	        }
	        return
	    } else if (newVchildrenLen === 0) {
	        for (let i = 0; i < vchildrenLen; i++) {
	            _.addItem(patches.removes, {
	                vnode: vchildren[i],
	                node: childNodes[i],
	            })
	        }
	        return
	    }


	    let updates = Array(newVchildrenLen)
	    let removes = null
	    let creates = null

	    // isEqual
	    for (let i = 0; i < vchildrenLen; i++) {
	        let vnode = vchildren[i]
	        for (let j = 0; j < newVchildrenLen; j++) {
	            if (updates[j]) {
	                continue
	            }
	            let newVnode = newVchildren[j]
	            if (vnode === newVnode) {
	                let shouldIgnore = true
	                if (parentContext) {
	                    if (vnode.vtype === VCOMPONENT || vnode.vtype === VSTATELESS) {
	                        if (vnode.type.contextTypes) {
	                            shouldIgnore = false
	                        }
	                    }
	                }
	                updates[j] = {
	                    shouldIgnore: shouldIgnore,
	                    vnode: vnode,
	                    newVnode: newVnode,
	                    node: childNodes[i],
	                    parentContext: parentContext,
	                    index: j,
	                }
	                vchildren[i] = null
	                break
	            }
	        }
	    }

	    // isSimilar
	    for (let i = 0; i < vchildrenLen; i++) {
	        let vnode = vchildren[i]
	        if (vnode === null) {
	            continue
	        }
	        let shouldRemove = true
	        for (let j = 0; j < newVchildrenLen; j++) {
	            if (updates[j]) {
	                continue
	            }
	            let newVnode = newVchildren[j]
	            if (
	                newVnode.type === vnode.type &&
	                newVnode.key === vnode.key &&
	                newVnode.refs === vnode.refs
	            ) {
	                updates[j] = {
	                    vnode: vnode,
	                    newVnode: newVnode,
	                    node: childNodes[i],
	                    parentContext: parentContext,
	                    index: j,
	                }
	                shouldRemove = false
	                break
	            }
	        }
	        if (shouldRemove) {
	            if (!removes) {
	                removes = []
	            }
	            _.addItem(removes, {
	                vnode: vnode,
	                node: childNodes[i]
	            })
	        }
	    }

	    for (let i = 0; i < newVchildrenLen; i++) {
	        let item = updates[i]
	        if (!item) {
	            if (!creates) {
	                creates = []
	            }
	            _.addItem(creates, {
	                vnode: newVchildren[i],
	                parentNode: node,
	                parentContext: parentContext,
	                index: i,
	            })
	        } else if (item.vnode.vtype === VELEMENT) {
	            diffVchildren(patches, item.vnode, item.newVnode, item.node, item.parentContext)
	        }
	    }

	    if (removes) {
	        _.addItem(patches.removes, removes)
	    }
	    if (creates) {
	        _.addItem(patches.creates, creates)
	    }
	    _.addItem(patches.updates, updates)
	}

	function updateVelem(velem, newVelem, node) {
	    let isCustomComponent = velem.type.indexOf('-') >= 0 || velem.props.is != null
	    _.patchProps(node, velem.props, newVelem.props, isCustomComponent)
	    if (velem.ref !== newVelem.ref) {
	        detachRef(velem.refs, velem.ref, node)
	        attachRef(newVelem.refs, newVelem.ref, node)
	    }
	    return node
	}

	function destroyVelem(velem, node) {
	    let { props } = velem
	    let { vchildren, childNodes } = node
	    for (let i = 0, len = vchildren.length; i < len; i++) {
	        destroyVnode(vchildren[i], childNodes[i])
	    }
	    detachRef(velem.refs, velem.ref, node)
	    node.eventStore = node.vchildren = null
	}

	function initVstateless(vstateless, parentContext, namespaceURI) {
	    let vnode = renderVstateless(vstateless, parentContext)
	    let node = initVnode(vnode, parentContext, namespaceURI)
	    node.cache = node.cache || {}
	    node.cache[vstateless.uid] = vnode
	    return node
	}

	function updateVstateless(vstateless, newVstateless, node, parentContext) {
	    let uid = vstateless.uid
	    let vnode = node.cache[uid]
	    delete node.cache[uid]
	    let newVnode = renderVstateless(newVstateless, parentContext)
	    let newNode = compareTwoVnodes(vnode, newVnode, node, parentContext)
	    newNode.cache = newNode.cache || {}
	    newNode.cache[newVstateless.uid] = newVnode
	    if (newNode !== node) {
	        syncCache(newNode.cache, node.cache, newNode)
	    }
	    return newNode
	}

	function destroyVstateless(vstateless, node) {
	    let uid = vstateless.uid
	    let vnode = node.cache[uid]
	    delete node.cache[uid]
	    destroyVnode(vnode, node)
	}

	function renderVstateless(vstateless, parentContext) {
	    let { type: factory, props } = vstateless
	    let componentContext = getContextByTypes(parentContext, factory.contextTypes)
	    let vnode = factory(props, componentContext)
	    if (vnode && vnode.render) {
	        vnode = vnode.render()
	    }
	    if (vnode === null || vnode === false) {
	        vnode = createVnode(VCOMMENT)
	    } else if (!vnode || !vnode.vtype) {
	        throw new Error(`@${factory.name}#render:You may have returned undefined, an array or some other invalid object`)
	    }
	    return vnode
	}

	function initVcomponent(vcomponent, parentContext, namespaceURI) {
	    let { type: Component, props, uid, renderer } = vcomponent
	    let componentContext = getContextByTypes(parentContext, Component.contextTypes)
	    //<exact: tested renderer
	    let component = renderer ? renderer : new Component(props, componentContext)
	    //exact>
	    let { $updater: updater, $cache: cache } = component
	    cache.parentContext = parentContext
	    updater.isPending = true
	    component.props = component.props || props
	    component.context = component.context || componentContext
	    if (component.componentWillMount) {
	        component.componentWillMount()
	        component.state = updater.getState()
	    }
	    let vnode = renderComponent(component)
	    let node = initVnode(vnode, getChildContext(component, parentContext), namespaceURI)
	    node.cache = node.cache || {}
	    node.cache[uid] = component
	    cache.vnode = vnode
	    cache.node = node
	    cache.isMounted = true
	    _.addItem(pendingComponents, component)

	    if (vcomponent.refs && vcomponent.ref != null) {
	        _.addItem(pendingRefs, vcomponent)
	        _.addItem(pendingRefs, component)
	    }

	    return node
	}

	function updateVcomponent(vcomponent, newVcomponent, node, parentContext) {
	    let uid = vcomponent.uid
	    let component = node.cache[uid]
	    let { $updater: updater, $cache: cache } = component
	    let { type: Component, props: nextProps } = newVcomponent
	    let componentContext = getContextByTypes(parentContext, Component.contextTypes)
	    delete node.cache[uid]
	    node.cache[newVcomponent.uid] = component
	    cache.parentContext = parentContext
	    if (component.componentWillReceiveProps) {
	        updater.isPending = true
	        component.componentWillReceiveProps(nextProps, componentContext)
	        updater.isPending = false
	    }

	    if (vcomponent.ref !== newVcomponent.ref) {
	        detachRef(vcomponent.refs, vcomponent.ref, component)
	        attachRef(newVcomponent.refs, newVcomponent.ref, component)
	    }

	    updater.emitUpdate(nextProps, componentContext)
	    
	    return cache.node
	}

	function destroyVcomponent(vcomponent, node) {
	    let uid = vcomponent.uid
	    let component = node.cache[uid]
	    let cache = component.$cache
	    delete node.cache[uid]
	    detachRef(vcomponent.refs, vcomponent.ref, component)
	    component.setState = component.forceUpdate = _.noop
	    if (component.componentWillUnmount) {
	        component.componentWillUnmount()
	    }
	    destroyVnode(cache.vnode, node)
	    delete component.setState
	    cache.isMounted = false
	    cache.node = cache.parentContext = cache.vnode = component.refs = component.context = null
	}

	function getContextByTypes(curContext, contextTypes) {
	    let context = {}
	    if (!contextTypes || !curContext) {
	        return context
	    }
	    for (let key in contextTypes) {
	        if (contextTypes.hasOwnProperty(key)) {
	            context[key] = curContext[key]
	        }
	    }
	    return context
	}

	function renderComponent(component, parentContext) {
	    refs = component.refs
	    let vnode = component.render()
	    if (vnode === null || vnode === false) {
	        vnode = createVnode(VCOMMENT)
	    } else if (!vnode || !vnode.vtype) {
	        throw new Error(`@${component.constructor.name}#render:You may have returned undefined, an array or some other invalid object`)
	    }
	    refs = null
	    return vnode
	}
	
	function getChildContext(component, parentContext) {
	    if (component.getChildContext) {
	        let curContext = component.getChildContext()
	        if (curContext) {
	            parentContext = _.extend(_.extend({}, parentContext), curContext)
	        }
	    }
	    return parentContext
	}
	

	let pendingComponents = []
	function clearPendingComponents() {
	    let len = pendingComponents.length
	    if (!len) {
	        return
	    }
	    let components = pendingComponents
	    pendingComponents = []
	    let i = -1
	    while (len--) {
	        let component = components[++i]
	        let updater = component.$updater
	        if (component.componentDidMount) {
	            component.componentDidMount()
	        }
	        updater.isPending = false
	        updater.emitUpdate()
	    }
	}

	let pendingRefs = []
	function clearPendingRefs() {
	    let len = pendingRefs.length
	    if (!len) {
	        return
	    }
	    let list = pendingRefs
	    pendingRefs = []
	    for (let i = 0; i < len; i += 2) {
	        let vnode = list[i]
	        let refValue = list[i + 1]
	        attachRef(vnode.refs, vnode.ref, refValue)
	    }
	}

	function clearPending() {
	    clearPendingRefs()
	    clearPendingComponents()
	}
	
	function compareTwoVnodes(vnode, newVnode, node, parentContext) {
	    let newNode = node
	    if (newVnode == null) {
	        // remove
	        destroyVnode(vnode, node)
	        node.parentNode.removeChild(node)
	    } else if (vnode.type !== newVnode.type || vnode.key !== newVnode.key) {
	        // replace
	        destroyVnode(vnode, node)
	        newNode = initVnode(newVnode, parentContext, node.namespaceURI)
	        node.parentNode.replaceChild(newNode, node)
	    } else if (vnode !== newVnode || parentContext) {
	        // same type and same key -> update
	        newNode = updateVnode(vnode, newVnode, node, parentContext)
	    }
	    return newNode
	}
	
	function getDOMNode() {
	    return this
	}

	function attachRef(refs, refKey, refValue) {
	    if (!refs || refKey == null || !refValue) {
	        return
	    }
	    if (refValue.nodeName && !refValue.getDOMNode) {
	        // support react v0.13 style: this.refs.myInput.getDOMNode()
	        refValue.getDOMNode = getDOMNode
	    }
	    if (_.isFn(refKey)) {
	        refKey(refValue)
	    } else {
	        refs[refKey] = refValue
	    }
	}

	function detachRef(refs, refKey, refValue) {
	    if (!refs || refKey == null) {
	        return
	    }
	    if (_.isFn(refKey)) {
	        refKey(null)
	    } else if (refs[refKey] === refValue) {
	        delete refs[refKey]
	    }
	}

	function syncCache(cache, oldCache, node) {
	    for (let key in oldCache) {
	        if (!oldCache.hasOwnProperty(key)) {
	            continue
	        }
	        let value = oldCache[key]
	        cache[key] = value

	        // is component, update component.$cache.node
	        if (value.forceUpdate) {
	            value.$cache.node = node
	        }
	    }
	}


// *********************************************************************************************************
// 									index.js
// *********************************************************************************************************


	let React = _.extend({
	    version: '0.15.1',
	    cloneElement,
	    isValidElement,
	    createElement,
	    createFactory,
	    Component,
	    PureComponent,
	    createClass,
	    Children,
	    PropTypes,
	    DOM
	}, ReactDOM)

	React.__SECRET_DOM_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactDOM

	$$.React = React;

})( window || this );