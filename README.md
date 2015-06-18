PrettyTask
==========

Javascript pretty-formatter for Mosek `.task` files.

Simply point you browser to `taskview.html` and load a `.task` file.

How it works
------------

Everything in the viewer runs completely in the browser, and no parts of the
Task file handled externally. This means that you can actually just save the
`.html` file and use it locally.

It *also* means that if you load a large Task file you will probably kill your browser.

Status
------

What works:
- Linear and semidefinite parts of objective are rendered
- Linear and semidefinite parts of constraints are rendered
- Symmetric matrix coefficients are rendered with some limitations on size
- Cones and bounds on variables
- Solutions
- Parameters

What has not been implemented:
- Quadratic terms
