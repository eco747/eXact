
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
						icon: 'fa@bluetooth',
						onclick: this.alertClick.bind(this)
					})
				]
			});
			
			let model = new DataModel( {
				fields: ['first_name', 'last_name', 'address', {name:'num',type:'float'}]
			});

			let data = [];
			for( let i=0; i<10000; i++ ) {
				data.push( { first_name: i + ' - John', last_name: 'Doe', address: i + ', rue des Alouettes', num: Math.random()*1000 } );
			}

			let store = new DataStore( { 
				model: model,
				data: data,
				reader: 'json'
			} );

			store.filter( [{field:'num',operator:'>', value: 420},{field:'num',operator:'<', value: 520}] );
			store.sort( [{field:'num'}] );


			this.grid		= new Grid( {
				store: store,
				columns: [
					{ title: 'First name', index: 'first_name', width: 400 },
					{ title: 'Last name',  index: 'last_name', flex: 1, minWidth: 400 },
					{ title: 'Address',    index: 'address', flex: 1 },
					{ title: 'Number', 	   index: 'num', width: 100 },
				]
			});

//			setInterval( function() {
//				b2.setTitle( new Date().toLocaleString() );
//			}, 1000 );
		}

		render( ) {
			return {
				cls: 'x-nosel',
				items: [
					this.header,
					this.grid,
					this.botbar
				]
			};
		}

		alertClick( ) {
			Alert( {title:'Alert !', message: "Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le Lorem Ipsum est le faux texte standard de l`imprimerie depuis les années 1500, quand un peintre anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à la bureautique informatique, sans que son contenu n'en soit modifié. Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker.", icon:'fa@exclamation-circle'} );
		}

		recentClick( ) {
			let w = new Window( {
				title: 'Hello world'
			});

			w.show( );
		}
	}  

	let app = new App();
	app.renderTo(document.body);

	window.addEventListener( 'resize', app._refresh.bind(app) );
}












