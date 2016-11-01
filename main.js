
window.onload = function( ) {


	/**
	 *
	 */

	class App extends Component
	{
		constructor( ) {

			super( );
			
			this.header 	= new AppBar({
				title:'Application', 
				icon:'fa@thermometer-empty'
			});

			let b1, b2;

			this.botbar  	= new BottomNavigation({
				buttons: [
					b1 = new BottomNavigationItem({
						title: 'Recent', 
						icon: 'fa@undo',
						onclick: this.recentClick.bind(this)
					}),
					b2 = new BottomNavigationItem({
						title: 'BlueTooth', 
						icon: 'fa@bluetooth' 
					})
				]
			});
			
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

			setInterval( function() {
				b2.setTitle( new Date().toLocaleString() );
			}, 1000 );
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
			let w = new Window( {
				title: 'Hello world'
			});

			w.show( );
		}
	}  

	new App().renderTo(document.body);
}












