# eXact
**eXact** is a Javascript Application Framework.  
**eXact** is a bridge between [ ExtJs ](www.sencha.com) the great framework that is saddly sooo expensive and [ React ](www.react.org) that is sooo different in the way we build application.

Care, **eXact** only works on modern browsers, forget IE6.
**eXact** is really small 

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
         */
         
        onRender( ) {
            return {
                items: [
                    AppBar,             // we just need an application bar
                    BottomNavigation    // and a bottom navigation bar
                ]
            }
        }
    }

    // we just tell the system where to render this application.
    App.renderTo( document.body );
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

When needed, **eXact** call `onRender` to render the elements. You can see that we have returned an object, with a simple array `items` inside. We just put AppBar constructor and BottomNavigationBar, it understand that he have to create these classes and render them. 

##### What is the application title, how to change it, how to define buttons in the bottom bar ?
We will do small changes to be able to access the AppBar datas. First we need a variable, in the App constructor, we will create it.

```javascript
        constructor( ) {
            super( );
            
            // create our app bar and set title
            this.app_bar = new AppBar( 'ReactX Application' );
        }
```

We also need to change our `onRender` method to use our `app_bar`.

```javascript
    onRender( ) {
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
            this.app_bar = new AppBar( 'ReactX Application' );
            
            // every second (1000ms), change the app title to display time
            //  'onInterval' can be used for that
            onInterval( 1000, function() { 
                this.app_bar.title = 'ReactX Application' + new Date().toLocaleTime(); 
            });
        }
```

Woo, the time is displayed dynamically, just when I change `app_bar.title` ?  
Yes, in **eXact**, some members changes immediatly update elements.  

By the way, if you change the timer down to 10ms, look at the tree changes in your browser dev tools, the node is changed only when the content change - not always.

Now, we will add some buttons in our BottomNavigationBar:

```javascript
        constructor( ) {
            super( );
            
            // create our app bar and set title
            this.app_bar = new AppBar( );
            this.app_bar.title = 'ReactX Application';
            
            //  create our bottom bar and add buttons
            this.bot_bar = new BottomNavigationBar( );
            this.bot_bar.buttons = [
                new BottomNavigationItem( 'Recent', 'fa@undo' );
                new BottomNavigationItem( 'Bluetooth', 'fa@bluetooth' );
            ];
            
            // every second (1000ms), change the app title to display time
            //  'onInterval' can be used for that
            this.onInterval( 1000, function() { 
                this.app_bar.title = 'ReactX Application' + new Date().toLocaleTime(); 
            });
        }
```
We also need to change our `onRender` method to use our `bot_bar`.

```javascript
    onRender( ) {
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




