# Chapter 2: Practice #

Let's take the button example:
A simple button is a rectangle with a border and a text (yes, it's really a simple button). The logic behind is simple, display the rect, the title and depending of it's state (focus, disabled...) display the correct style.
It will also be a generator of events (clicks). In this case, the button configuration is simple, just a title.
``` javascript
new Button( { title: 'hello beautiful world' } );
```

And our button will render the following code:

``` javascript
return {
    cls: 'button',
    items: [
        this.title
    ]
}
```

Oups, that all - where is the rect, how do i specify the color and width ? 
By default, all elements are DIV (a rect in html) so our rect is given by the fact that we return an object. 
(return {} will draw a simple DIV). The title is a sub element - direct texts are interpreted as direct texts.  

So the resulting HTML will be:
``` html
<DIV class="button">hello beautiful world</DIV>
``` 

Concerning size and colors, in exact, the second rule is: **always avoid specifying cosmetic things if you can**. Why ? Because cosmetic is the role of CSS, not hierarchy nor logic. The tip here is to say that the DIV's class is 'button' then in css we can define a rule that will describe the cosmetic parts of the button:

``` css
.button {
    border: 1px solid black;
    padding: 4px 8px;
}
/* BTW: you should use a higher level of CSS with something  
   like LESS or SCSS that allow css hierarchy */
```

Let's look at events now, the purpose of a button is to be clicked, but just before that, i will show you the real code of our button:

``` javascript
// Button is a Component
class Button extends Component
{
    // the constructor accept an object as parameter
    constructor( cfg ) {
        super( cfg ); // we pass this objet to our parent class
    }

    // the render method 
    render( ) {
        return {
            cls: 'button',
            items: [
                this.title
            ]
        }
    }
}
```

As we saw previously, there are two ways to notify owners in hierarchy: events and callbacks. We will look at the callback way for our button.  
We will add a new parameter in the constructor config - handler:

``` javascript
    new Button( {title: 'hello beautiful world', handler: myCallback } );
    
    function myCallback( ) {
        alert( 'you clicked the world !' );
    }
```


