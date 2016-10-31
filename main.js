
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
			
			this.botbar.setButtons([
				b1, b2
			]);

			let model = new DataModel( {
				fields: ['first_name', 'last_name', 'address']
			});

			let data = [];
			for( let i=0; i<10000; i++ ) {
				data.push( { first_name: i + ' - John', last_name: 'Doe', address: i + ', rue des Alouettes' } );
			}

			let store = new DataStore( { 
				model: model,
				data: data,
				reader: 'json'
			} );

			this.grid		= new Grid( {
				store: store,
				columns: [
					{ title: 'First name', index: 'first_name', width: 400 },
					{ title: 'Last name',  index: 'last_name', flex: 1, minWidth: 400 },
					{ title: 'Address',    index: 'address', flex: 2 }
				]
			});

			//setInterval( function() {
			//	b1.setText( new Date().toLocaleString() );
			//}, 1000 );
		}

		render( ) {
			return {
				cls: 'x-unselectable',
				items: [
					this.header,
					this.grid,
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












