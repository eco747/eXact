
window.onload = function( ) {

	/**
	 *
	 */

	class App extends Component
	{
		constructor( ) {

			super( );
			
			this.header 	= new AppBar( 'Application', 'fa@thermometer-empty' );
			this.botbar  	= new BottomNavigation( );
			
			let 	b1 		= new BottomNavigationItem( 'Recent', 'fa@undo' );
			b1.onclick 		= () => this.recentClick;

			let 	b2 		= new BottomNavigationItem( 'BlueTooth', 'fa@bluetooth' );
			
			this.botbar._buttons = [
				b1, b2
			];

			setInterval( function() {
				b1.text = new Date().toLocaleString();
			}, 1 );
		}

		onRender( ) {
			return {
				cls: 'x-unselectable',
				items: [
					this.header,
					this.botbar
				]
			};
		}

		recentClick( ) {
			//new Mask( );
		}
	}  

	//new App().renderTo( document.body );
	App.renderTo(
		document.body
	);
}












