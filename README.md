# eXact
**eXact** is a Javascript Application Framework.  
**eXact** use the phylosophy of [ ExtJs ](www.sencha.com) the great framework that is saddly sooo expensive and [ React ](www.react.org) that is sooo different in the way we build application.  
**eXact** is really small 50K zipped with this readme and licence file.  
**eXact** is French :)

Care, **eXact** only works on modern browsers that can interpret ES6 javascript syntax, forget IE6.

For a live demo, click [ here ] (https://eco747.github.io/eXact/main.html)


## Concept

A Sample is often simpliest to understand things, we will create an application with a title bar (named AppBar) and a bottom navigation bar (named BottomNavigationBar).
Just create a file named app.js

```javascript
    /**
     * App is our application, it extends the Component class
     */
     
    class App extends Component
    {
        /**
         * contructor, just call our Component constructor & create our AppBar component
         */
         
        constructor( ) {
            super( );
        }
    
        /**
         * rendering
         * this method is called when the component need to be repainted
         * we will see later the syntax more in detail.
         * for now just see that we design the html in json format (by default it's a div)
         * and items are the sub elements.
         */
         
        render( ) {
            return {
                items: [
                    AppBar,             // we just need an application bar
                    BottomNavigation    // and a bottom navigation bar
                ]
            }
        }
    }

    // we just tell the system where to render this application.
    new App().renderTo( document.body );
```

In out app.html, we will add this

```html
    <html>
	<head>
	    <!-- The exact library -->
		<script type="text/javascript" src="lib/exact.js"></script>
		<script type="text/javascript" src="lib/utils.js"></script>
		<!-- Misc components (we also can include a packed file) -->
		<script type="text/javascript" src="components/component.js"></script>
		<script type="text/javascript" src="components/icon.js"></script>
		<script type="text/javascript" src="components/app-bar.js"></script>
		<script type="text/javascript" src="components/bottom-navigation.js"></script>
		<!-- our .js file -->
		<script type="text/javascript" src="main.js"></script>
		<!-- The exact style sheets -->
		<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
		<link rel="stylesheet" type="text/css" href="exact.css">
	</head>
	<body>
	</body>
</html>
```

Ok, just open your html & you will get a nice application with an empty title & an empty navigation bar...

##### How does it works ?

When needed, **eXact** call `render` to render the elements. You can see that we have returned an object, with a simple array `items` inside. We just put AppBar constructor and BottomNavigationBar, it understand that he have to create these classes and render them. 

##### What is the application title, how to change it, how to define buttons in the bottom bar ?
We will do small changes to be able to access the AppBar datas. First we need a variable, in the App constructor, we will create it.

```javascript
        constructor( ) {
            super( );
            
            // create our app bar and set title
            this.app_bar = new AppBar( {title:'ReactX Application'} );
        }
```

We also need to change our `render` method to use our `app_bar`.

```javascript
    render( ) {
        return {
            items: [
                this.app_bar,       // this time we put our member
                BottomNavigation    // and a bottom navigation bar
            ]
        }
    }
```

Just refresh and magic, the application name is shown.  
##### Well, i can do that easily in plain HTML, without eXact.  
Wait, just look at that code we will add in the constructor:

```javascript
        constructor( ) {
            super( );
            
            // create our app bar and set title
            this.app_bar = new AppBar( {title:'ReactX Application'} );
            
            // every second (1000ms), change the app title to display time
            setInterval( () => { 
                this.app_bar.setTitle( 'ReactX Application ' + new Date().toLocaleTime() ); 
            }, 1000 );
        }
```

By the way, if you change the timer down to 10ms, look at the tree changes in your browser dev tools, the node is changed only when the content change - not always.

Now, we will add some buttons in our BottomNavigationBar:

```javascript
        constructor( ) {
            super( );
            
            // create our app bar and set title
            this.app_bar = new AppBar( {title:'ReactX Application'} );
            
            //  create our bottom bar and add buttons
            this.bot_bar = new BottomNavigationBar( );
            this.bot_bar.setButtons( [
                new BottomNavigationItem( {title:'Recent', icon:'fa@undo'} );
                new BottomNavigationItem( {title:'Bluetooth', icon:'fa@bluetooth'} );
            ] );
        }
```
We also need to change our `render` method to use our `bot_bar`.

```javascript
    render( ) {
        return {
            items: [
                this.app_bar,       // this time we put our member
                this.bot_bar        // and our bottom navigation bar
            ]
        }
    }
```

What are the 'fa@undo' & 'fa@bluetooth' parameters of BottomNavigationItem elements ?  
**eXact** is using [Font Awesome](fontawesome.org) and it's a simple way to say that the Item icon will use the `fa-undo` icon.

Now we need to get notified when our botton 'Recent' button is clicked:

we just change the BottomNavigationItem constructor parameters:

```javascript
        constructor( ) {
            super( );
            
            // create our app bar and set title
            this.app_bar = new AppBar( {title:'ReactX Application'} );
            
            //  create our bottom bar and add buttons
            this.bot_bar = new BottomNavigationBar( );
            this.bot_bar.setButtons( [
                // here we have added onclick (we must use bind to keep this correctly set)
                new BottomNavigationItem( {title:'Recent', icon:'fa@undo', onclick:this.onRecentClick.bind(this) } );
                new BottomNavigationItem( {title:'Bluetooth', icon:'fa@bluetooth'} );
            ] );
        }

        onRecentClick( ) {
            // we show the standard message
            Exact.alert( {title:'Alert !', message: 'Recent button clicked'} );
        }

```






