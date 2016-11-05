
window.onload = function( ) {

	/**
	 *
	 */

	class App extends Component
	{
		constructor( ) {

			super( );
			
			this.header 	= new AppBar({
				title:'eXact', 
				icon:'fa@thermometer-empty'
			});

			let botbar = this.createBotBar( );
			
			let model = new DataModel( {
				fields: ['first_name', 'last_name', 'address', {name:'num',type:'float'}]
			});

			let data = [];
			for( let i=0; i<10000; i++ ) {
				data.push( { first_name: 'John', last_name: 'Doe', address: i + ', rue des Alouettes', num: Math.random()*1000 } );
			}

			let store = new DataStore( { 
				model: model,
				data: data,
				reader: 'json'
			} );

			this.grid = this.createGrid( store );
			this.panel = this.createPanel( store );
		}

		render( ) {
			return {
				cls: 'x-nosel',
				layout: 'vertical',
				items: [
					this.header,
					{
						layout: 'horizontal',
						flex: 1,
						items: [
							this.panel,
							this.grid,
						]
					},
					this.botbar
				]
			};
		}

		createBotBar( ) {
			return new BottomNavigation({
				buttons: [
					new BottomNavigationItem({
						title: 'Recent', 
						icon: 'fa@undo',
						onclick: this.recentClick.bind(this)
					}),
					new BottomNavigationItem({
						title: 'BlueTooth', 
						icon: 'fa@bluetooth',
						onclick: this.alertClick.bind(this)
					})
				]
			});
		}

		/**
		 * create then left panel
		 * @param  {Grid} grid - the grid to work on
		 * @return {Panel}       
		 */
		
		createPanel( store ) {
			let me = this;
				
			function doFilter( value ) {
				store.filter( {
					field: 'num',
					operator: '>=',
					value: value
				});
			}

			let edit = new TextField({label:'Filter on num >=',labelAlign:'top',value:'',textHint:'Enter a value'});
			edit.on('change', doFilter );

			let dlg = {
				layout: 'vertical',
				items: [
					edit,
					{
						layout: 'horizontal',
						layoutDir: 'end',
						items: new Button({title:'OK',width:50}),
					},
					{
						layout: 'horizontal',
						items: new CheckBox({label:'Auto Refresh'}),	// changed icon just to play
					}
				]
			};

			return new Panel( {width: 300, content: dlg} );
		}

		/**
		 * create the grid
		 * @param  {DataStore} store - the store to show
		 * @return {Grid}
		 */
		
		createGrid( store ) {

			function renderCell( _, m, r ) {
				//	content, model, rec
				let id = m._get( 'id', r);
				return {
					style: {
						borderRadius: 20,
						backgroundColor: 'rgba(0,188,212,'+((id%100)/100)+')',
						width: 20,
						height: 20
					}
				}
			}

			return new Grid( {
				store: store,
				flex: 1,
				columns: [
					{ title: 'Id', 		   sortable: true, index: 'id', width: 50 },
					{ title: 'First name', index: 'first_name', width: 400 },
					{ title: 'Last name',  index: 'last_name', flex: 1, minWidth: 400 },
					{ title: 'Address',    sortable: true, index: 'address', flex: 1 },
					{ title: 'Renderer',   renderer: renderCell, flex: 1 },
					{ title: 'Number', 	   sortable: true, index: 'num', width: 150 },
				]
			});
		}

		alertClick( ) {
			// content is formatted html, care never use html when content come from outside of your application
			Exact.alert( {title:'Alert !', autoClose: 20, clickDismiss:true, html: "Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le <b>Lorem Ipsum</b> est le faux texte standard de l`imprimerie depuis les années 1500, quand un peintre anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à la bureautique informatique, sans que son contenu n'en soit modifié. <br/>Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker."} );
		}

		recentClick( ) {
			Exact.info( {autoClose: 200, clickDismiss:true, text: "Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le Lorem Ipsum est le faux texte standard de l`imprimerie depuis les années 1500, quand un peintre anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à la bureautique informatique, sans que son contenu n'en soit modifié. Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker."} );
		}
	}  

	let app = new App();
	app.renderTo(document.body);

	window.addEventListener( 'resize', app._refresh.bind(app) );
}



