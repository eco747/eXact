# Chapter 1: Introduction #

The key of exact are Components and Elements, Hierarchy and Events, and virtual DOM.

- Components are classes (of high level) that manage complex things, respond to events, do the evolved parts and render elements, because in javascript frameworks, the final purpose is to generate javascript / html.
- The elements are the 'things' that will be rendered.

In general, applications are composed of a hierarchy of elements: 
Header bar, left / right Panel, a Menu bar, a Status bar and a place where different parts will be shown depending of the purpose of your application.
Header is composed of your logo, a title, menu bar is composed of sub menus and menu items and so on, this is the hierarchy. Don't be afraid, most of the useful components have already been designed, and yes, of course, you can build your own components.

This hierarchy concept is important, because the most important part of your work (forgetting your business) will be to describe it. In exact, we describe this with JSon. In fact, in javascript, JSon is a simple javascript object.

If i want to describe an application with a header a content and a status bar, i will return this kind of JSon:

``` javascript
return {
    items: [
        header,
        content,
        statusbar
    ]
}
```

The main window is the root object and hierarchy is given by it's 'items'. There is no limit in depth in the hierarchy, you can describe all your app this way (nobody do that but you should).

``` javascript
return {
    items: [
        {
            items: [
                {
                     items: [
                       ... and so on ...
                     ]
                }
            ]
        },
        {
            items: [
                {
                     items: [
                       ... and so on ...
                     ]
                }
            ]
        },
        ...
    ]
}
```

An application is not static (if it is, just write it in html), so a lot of elements may change in response of user actions: menu selection, open a window...

Each time something change or appear, we have to render or re-render a part of the page (the html). And this is what we will do.

In the rendering method of components, you can integrate a simple or complex logic to decide which parts need to be rendered, with what styles and the desired sizes.  
Components get only one parameter, their configuration. In this configuration object, they will take everything they need to display informations.  Every passed values will be members of the Component.

We can render as often we want because only changes are really sent to the browser (to the DOM), this is the virtual DOM mechanism. DOM is the hierarchy seen by the browser, each time you modify the DOM, the browser redraw the screen where the changes occur... this is a slow process. So to avoid this, exact maintain internally  a virtual DOM, an exact super fast copy of the real one. When you re-render an element, exact check if something change, what is the change and then decide if a real DOM change is needed, if so do it. In fact, if nothing change, you can render your full app with thousand of components every ms without any change in the browser, this is really fast.

Well, i have to stop and talk about events and hierarchy (it's a rule): **sub elements never know their parents**. They must act as if they were orphans or living in an empty space. So how can they notify somebody that something happen for them ?  - Events - The owner of sub items can listen to them for such events or it can give them a callback to call in this case. To do that, it will observe/listen the sub element.
So, from an owner to a sub element, we use configuration and from a sub to an owner, we use events (or callbacks). Of course, the rule is safe for a component to expose methods to use to change the configuration. A button can have a method setTitle(title) to change it's title.



