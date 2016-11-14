# Chapter 0: Rules #

## Sub elements never know their parents ##
If you need to know your parent, think twice and change the way you see things, there is a failure.

## Always avoid specifying cosmetic things if you can ##
Cosmetic is not the role of the hierarchy nor the logic, it's the CSS role.  
How will you support high contrast if you specify colors in your elements, or people with visual disabilities if you specify font heights ?

## Never use direct texts ##
You cannot imagine the time needed to find all the stupid texts (or date formats) that reside in code when you need to translate your application.  
How to change a term that is used 1000 times in your source ?  
Are you sure there is no misspellings in you application ?  
Think about that before and smile after.  

## Do not fight with CSS ##
An element do not fit correctly, you have to give negative margins, you use !important ?  
Check your layouts.  
Check the CSS rules orders.  
Do not fight, the problem is somewhere else.
