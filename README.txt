== Exercise #4 ==
Developer: Jennifer Quesada
Email: jenny240p@gmail.com


Approach:

The file structure is one level since this is a small application, I have a separate HTML for details with the purpose of keeping the Navigation and the concepts separated to avoid confusions.

I chose to make a custom type to manage in scalable way the list of users, which I took into account the performance and the memory space by adding the functions in the prototype object and not in the definition of itself.
This custom type has observers that allows the "creation" of events for specifics situations, in this case for adding or deleting users.

Also I made modules with some insulated and public functions, there is one module per view and one main module called "app" that has common functions and processes.

I tried to keep the code easy to read and understandable according with best practices.



What I would do differently:

I would evaluate the complexity of the project to define the must fitting:
 - File structure: Modular, MVC like...
 - Design pattern: Module, Singleton, Observer, etc...
 - Frameworks: AngularJS, ReactJS, JQuery, Materialize, Bootstrap, etc..
 - Other Technologies: lazy loading, Gulp, Jekyll, Jasmine, Mocha etc..

If I were to choose AngularJS, I would make a controller per view, I would use the router provider (navigation) and HTML partials.
Additionally I would make a directive to render the list of users as well as services to reuse code as much as I can.