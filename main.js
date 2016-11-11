
window.onload = function( ) {

	/**
	 *
	 */

	class App extends Application
	{
		constructor( ) {

			super( );
			
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
			this.botbar = this.createBotBar( );
			this.appbar = this.createAppBar( );
		}

		render( ) {
			return {
				cls: 'x-nosel',
				layout: 'vertical',
				items: [
					this.appbar,
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

		createAppBar( ) {

			let settings = new Menu( {
				items: [
					new MenuItem({title:'Theme',icon:'fa@paint-brush'}),
				]
			});

			let menu = new Menu( {
				items: [
					new MenuItem({title:'About',icon:'fa@question'}),
					new MenuItem({title:'Settings',icon:'fa@cogs',menu:settings}),
					new MenuSeparator( ),
					new MenuItem({title:'Report an issue',icon:'fa@bug'}),
				]
			});

			return new AppBar({
				title:'eXact', 
				icon:'fa@thermometer-empty',
				menu: menu
			});
		}

		createBotBar( ) {
			return new BottomNavigation({
				buttons: [
					new BottomNavigationItem({
						title: 'Recent', 
						icon: 'fa@undo',
						handler: this.recentClick.bind(this)
					}),
					new BottomNavigationItem({
						title: 'BlueTooth', 
						icon: 'fa@bluetooth',
						handler: this.alertClick.bind(this)
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

			let edit = new TextField({label:'Filter on num >=',labelAlign:'top',value:'',textHint:'Enter a value',required:'true'});
			edit.on('change', doFilter );


			// 	navigation bar
			let navbar = new TreeList( {
				items: [
					{ title: 'Dossier', open: 'true', items: [
						{ title: 'Nouveau', icon: 'fa@file-text-o' },
						{ title: 'Ouvrir', icon: 'fa@external-link' },
						{ title: 'Fermer', icon: 'fa@times-circle' },
						{ title: 'Propriétés', icon: 'fa@cogs' },
					]},
				]
			});


			//	simple chart demo for canvas
			function draw( canvas ) {

				function onclick( e ) {
					debugger;
				}

				let line_color = new Color('#00bcd4'),
					axis_color = new Color(128,128,128),
					title_back = new Color(0,0,0,0.5),
					left = 40,
					top = 20,
					height = canvas.height - top - 20,
					width = canvas.width - left - 20,
					bottom = top + height;

				canvas.beginPath( );

				canvas.moveTo( left, top );
				canvas.lineTo( left, bottom );
				canvas.lineTo( left+width, bottom );

				canvas.strokeStyle = axis_color.toString();
				canvas.stroke( );

				canvas.fillStyle = Color.BLACK;
				canvas.textAlign = 'right';
				canvas.textBaseline = 'middle';
				canvas.fillText( height/2, left-4, top+height/2, left );

				canvas.textAlign = 'center';
				canvas.fillText( 'My random chart', left + width/2, bottom+top/2 );

				let mid = Math.round(top+height/2);

				canvas.strokeStyle = axis_color.lighten(60).toString();
				canvas.beginPath( );
				canvas.moveTo( left-4, mid );
				canvas.lineTo( left+width, mid );
				canvas.stroke( );

				canvas.beginPath( );
				let y = height / 2;
				for( let x=left; x<left+width; x++ ) {
					
					if( x==left ) {
					 	canvas.moveTo( x, bottom-y );
					}
					else {
						canvas.lineTo( x, bottom-y );
					}

					y = y + Math.random()*4 - 2;
					if( y<0 ) y = 0;
					else if( y>height ) y = height;
				}

				canvas.strokeStyle = line_color.alpha(0.8).toString();
				canvas.lineWidth = 2;
				canvas.stroke( );
			}


			let canvas = new Canvas({renderer:draw,type:'2d', flex:1});

			setInterval( function() {canvas._refresh()}, 100 );

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
					},
					navbar,
					{
						layout: 'vertical',
						flex: 1,
						style: {
							minHeight: 150,
							maxHeight: 300,
						},
						items: canvas
					}
				]
			};

			return new Panel( {width:300, content:dlg, sizers:'r'} );
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
						borderWidth: 1,
						borderStyle: 'solid',
						borderColor: 'rgb(0,188,212)',
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
					{ title: 'Number', 	   sortable: true, index: 'num', flex: 1 },
					{ title: 'Renderer',   renderer: renderCell, width: 80 },
				]
			});
		}

		alertClick( ) {
			// content is formatted html, care never use html when content come from outside of your application
			Exact.MessageBox( {cls:'x-alert', title:'Alert !', autoClose: 20, clickDismiss:true, html: "Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le <b>Lorem Ipsum</b> est le faux texte standard de l`imprimerie depuis les années 1500, quand un peintre anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à la bureautique informatique, sans que son contenu n'en soit modifié. <br/>Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker."} );
		}

		recentClick( ) {
			Exact.MessageBox( {cls:'x-info', autoClose: 200, clickDismiss:true, text: "Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le Lorem Ipsum est le faux texte standard de l`imprimerie depuis les années 1500, quand un peintre anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à la bureautique informatique, sans que son contenu n'en soit modifié. Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker."} );
		}
	}  

	let app = new App();
	app.renderTo(document.body);
}



