// heavily inspired by material-ui (https://github.com/callemall/material-ui)
// heavily inspired by https://github.com/Khan/react-components/blob/master/js/layered-component-mixin.jsx

class	RenderToLayer extends React.Component 
{
  	componentDidMount() {
    	this.renderLayer();
  	}

  	componentDidUpdate() {
    	this.renderLayer();
  	}

  	componentWillUnmount() {
    	this.unrenderLayer();
  	}

  	getLayer() {
    	return this.layer;
  	}

  	/**
	* By calling this method in componentDidMount() and
	* componentDidUpdate(), you're effectively creating a "wormhole" that
	* funnels React's hierarchical updates through to a DOM node on an
	* entirely different part of the page.
	*/

	renderLayer() {
		const {
	  		open,
	  		render,
		} = this.props;

		if (open) {
	  		if (!this.layer) {
	    		this.layer = document.createElement('div', {className:'x-mask'} );
	    		document.body.appendChild(this.layer);

	    		if (this.props.useLayerForClickAway) {
					this.layer.addEventListener('touchstart', this.onClickAway);
					this.layer.addEventListener('click', this.onClickAway);
					this.layer.style.position = 'fixed';
					this.layer.style.top = 0;
					this.layer.style.bottom = 0;
					this.layer.style.left = 0;
					this.layer.style.right = 0;
					this.layer.style.zIndex = this.context.muiTheme.zIndex.layer;
				}
				else {
					setTimeout(() => {
						window.addEventListener('touchstart', this.onClickAway);
						window.addEventListener('click', this.onClickAway);
					}, 0);
	    		}
	  		}

		  	const layerElement = render();
	  		this.layerElement  = unstable_renderSubtreeIntoContainer(this, layerElement, this.layer);
		} 
		else {
			this.unrenderLayer();
		}
	}

	unrenderLayer() {
    	if (!this.layer) {
      		return;
    	}

    	if (this.props.useLayerForClickAway) {
      		this.layer.style.position = 'relative';
      		this.layer.removeEventListener('touchstart', this.onClickAway);
      		this.layer.removeEventListener('click', this.onClickAway);
    	}
    	else {
      		window.removeEventListener('touchstart', this.onClickAway);
      		window.removeEventListener('click', this.onClickAway);
    	}

    	unmountComponentAtNode(this.layer);
    	document.body.removeChild(this.layer);
    	this.layer = null;
  	}

	

  	render() {
    	return null;
  	}
}
