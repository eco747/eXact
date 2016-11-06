
/**
 * basic Color class
 *
 * 	Color(red,green,blue,alpha=1)
 * 	Color('#fff')
 * 	Color('#ffffff')
 * 	Color('rgb(255,255,255)')
 * 	Color('rgba(255,255,255,1)')
 */

class Color
{
	constructor( r, g, b, a ) {

		this._cache = null;

		if( isString(r) ) {
			this._parse(r);
		}
		else if( isObject(r) ) {
			this.r = r.r || 0;
			this.g = r.g || 0;
			this.b = r.b || 0;
    		this.a = r.a || 1;
		}
		else {
			this.r = r || 0;
			this.g = g || 0;
			this.b = b || 0;
    		this.a = a || 1;
    	}
    }

    /**
     * @internal parse the string
     */
    
    _parse( s ) {
    	let c;
    	
    	if( s.length===4 ) {
    		this.r = parseInt(s[1]+s[1],16);
    		this.g = parseInt(s[2]+s[2],16);
    		this.b = parseInt(s[3]+s[3],16);
    		this.a = 1;
    	}
    	else if( s.length===7 ) {
    		this.r = parseInt(s.substr(1,2),16);
    		this.g = parseInt(s.substr(3,2),16);
    		this.b = parseInt(s.substr(5,2),16);
    		this.a = 1;
    	}
    	else if( (c=Color.re_rgb.exec(s))!==null ) {
    		this.r = c[1];
    		this.g = c[2];
    		this.b = c[3];
    		this.a = 1;
    	}
    	else if( (c=Color.re_rgba.exec(s))!==null ) {
    		this.r = c[1];
    		this.g = c[2];
    		this.b = c[3];
    		this.a = c[4];
    	}
    	else {
    		this.r = 0;
    		this.g = 0;
    		this.b = 0;
    		this.b = 1;
    	}
    }

    /**
     * convert the color to string
     */
    
    toString( ) {
    	if( !this._cache ) {
	    	if( this.a===1 ) {
	    		this._cache = 'rgb('+this.r+','+this.g+','+this.b+')';
	    	}
	    	else {
	    		this._cache = 'rgba('+this.r+','+this.g+','+this.b+','+this.a+')';	
	    	}
	    }

    	return this._cache;
    }

    /**
     * return a new Color with this alpha
     * @param  {Float} a - alpha
     * @return {Color}
     */
    
    alpha( a ) {
    	if( a<0.0 ) 		{ a = 0; }
    	else if( a>1.0 )	{ a = 1; }
    	return new Color(this.r,this.g,this.b,a);
    }

    /**
     * return a new color lightened by v (range -100 to 100)
     * @param  {Float} v - value to apply
     * @return {Color}
     */
    
    lighten( v ) {
    	if( v<-100 ) 		{ v = -100; }
    	else if( v>100 )	{ v = 100; }
        
        let {h,l,s} = this._rgbToHls( this.r, this.g, this.b );
        l = l + v/100;
        let {r,g,b} = this._hlsToRgb( h, l, s );

    	return new Color( r, g, b, this.a );
	}

	/**
	 * return a new color darkened by v (range -100 to 100)
     * @param  {Float} v - value to apply
     * @return {Color}
	 */
	darken( v ) {
		return this.lighten( -v );
	}

	/**
	 * convert rgb to hls
	 */
	
	_rgbToHls( r, g, b ) {
             
        let max = Math.max(r, g, b), 
        	min = Math.min(r, g, b);        

        let l = (max + min) / 2,
        	h, s;
        
        if( max==min ) {	// achromatic
            h = s = 0; 
        } 
        else {
            let d = max - min;

            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }

        return {h,l,s};
    }

    /**
     * convert hls to rgb
     */
    
    _hlsToRgb( h, l, s ) {
        
        function hue2rgb( p, q, t ) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        let r, g, b;

        if( s==0 ) {	// achromatic
            r = g = b = l; 
        } 
        else {
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s,
            	p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {r,g,b};
    }
}

Color.re_rgb = /rgb\((\d+),(\d+),(\d+)\)/;
Color.re_rgba = /rgba\((\d+),(\d+),(\d+),(\d+)\)/;



/**
 * SVG painter
 */

class 	SvgCanvasPainter extends Component
{
	constructor( ...a ) {
		super( ...a );

		this.ops = [];
		this.path = [];
		this.fillStyle = '#ffffff';
		this.stokeStyle = '#000000';
		this.lineWidth = 1;
		this._ctm = [1, 0, 0, 1, 0, 0];
    	this._ctmStack = [];
    	this.dom = null;
	}

	beginPath( ) {
		this.path = '';
	}

	closePath( ) {
		this._addPath( 'z' );
	}

	fill( ) {
		this.ops.push( {tag: 'path', d: this.path, fill:this.fillStyle } );
	}

	stroke( onclick ) {
		this.ops.push( {tag: 'path', d: this.path, fill: 'none', stroke:this.strokeStyle, strokeWidth:this.lineWidth, onclick: onclick } );
	}

	_addPath( ) {
		let n = arguments.length;

		for( let i=0; i<n; i++ ) {
			let a = arguments[i];
			if( isArray(a) ) {
				this._addPath( a );
			}
			else if( isNumber(a) ) {
				this.path += Math.round(a*1000) / 1000 + ' ';
			}
			else {
				this.path += a + ' ';
			}
		}
	}

	moveTo( x, y ) {
		this._addPath( 'M', x, y );
	}

	lineTo( x, y ) {
		this._addPath( 'L', x, y );	
	}

	rect( x, y, w, h ) {
		this._addPath( 	'M',x,y, 
						'h',w,
						'v',h,
						'h',-w,
						'v','-h' );
	}

	ellipse( x, y, r1, r2 ) {

		r2 = r2 || r1;
	    x -= r1;
    	y -= r2;
    	
    	let ox = r1 * SvgCanvasPainter.KAPPA,
    		oy = r2 * SvgCanvasPainter.KAPPA;
    		xe = x + r1 * 2,
    		ye = y + r2 * 2,
    		xm = x + r1,
    		ym = y + r2;
    
    	this.moveTo( x, ym );
    	this.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    	this.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    	this.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    	this.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    	this.closePath();
	}

	circle( x, y, r ) {
		this.ellipse( x, y, r, r );
	}

	bezierCurveTo( cp1x, cp1y, cp2x, cp2y, x, y ) {
    	this._addPath( 'c', cp1x, cp1y, cp2x, cp2y, x, y );
    }

	transform( m11, m12, m21, m22, dx, dy ) {
    	//	keep track of the current transformation matrix
    	let m = this._ctm;
    
    	let [m0, m1, m2, m3, m4, m5] = m;
    	m[0] = m0 * m11 + m2 * m12;
    	m[1] = m1 * m11 + m3 * m12;
    	m[2] = m0 * m21 + m2 * m22;
    	m[3] = m1 * m21 + m3 * m22;
    	m[4] = m0 * dx + m2 * dy + m4;
    	m[5] = m1 * dx + m3 * dy + m5;
    
    	this._addPath( 'cm', m );
	}

  	translate(x, y) {
    	this.transform( 1, 0, 0, 1, x, y );
    }
    
  	rotate( angle, origin ) {
	    let rad = angle * Math.PI / 180,
	    	cos = Math.cos(rad),
	    	sin = Math.sin(rad);
	    	x = 0,
	    	y = 0;

	    if( origin ) {
	      
	     	x = origin.x;
	      	y = origin.y;

	      	x -= x * cos - y * sin;
	     	y -= x * sin + y * cos;
	  	}

	    this.transform( cos, sin, -sin, cos, x, y );
	}
    
  	scale( xFactor, yFactor, origin ) {

  		yFactor = yFactor || xFactor;

	    let x = 0,
	    	y = 0;

	    if( origin ) {
	      	x = origin.x;
	      	y = origin.y;
	      	x -= xFactor * x;
	      	y -= yFactor * y;
	    }
	    
	    this.transform( xFactor, 0, 0, yFactor, x, y );
	}

	render( ) {

		if( this._config.render && this.dom ) {
			this.width = this.dom.clientWidth;
			this.height = this.dom.clientHeight;
			this._config.render( this );
		}

		return {
			tag: 'g',
			items: this.ops
		}
	}
}

SvgCanvasPainter.KAPPA = 4.0 * ((Math.sqrt(2) - 1.0) / 3.0);


/**
 *	fake component to be used by Canvas
 *	
 */

class 	StdCanvasPainter
{
	constructor( cfg ) {
		this._config = cfg;
		this.context = null;
	}

	_refresh( ) {

		if( this._config.render && this.dom ) {

			this.context = this.context || this.dom.getContext('2d');
			
			this.context.width = this.dom.clientWidth;
			this.context.height = this.dom.clientHeight;

			this._config.render( this.context );
		}

		return null;
	}
}



















/**
 * 	Canvas class
 */

class 	Canvas extends Component
{
	constructor( cfg ) {
		super( cfg );

		if( this._config.type=='svg' ) {
			this.canvas = new SvgCanvasPainter( cfg );
		}
		else {
			this.canvas = new StdCanvasPainter( cfg );
		}
	}

	acquireRef( dom ) {
		this.canvas.dom = dom;
	}

	afterMount( ) {
		this.canvas._refresh( );
	}

	render( ) {
		
		return {
			tag: this._config.type=='svg' ? 'svg' : 'canvas',
			ref: this.acquireRef.bind(this),
			flex: 1,
			items: this.canvas
		}
	}
}


