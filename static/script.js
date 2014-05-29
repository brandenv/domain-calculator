// Branden Vandermoon
// March 2014
// Double Integral Boundary Caclulator
//
// Plots functions of the form y = f(x) and x = f(y) and specifies the
// resulting domain D when possible. Finds a correct pair of boundary
// conditions for evaluating a double intergral as an iterated integral.


'use strict';

(function() {
    var CURVE_SMOOTHNESS = 0.5;
    
    var context;
    var canvas;
    var x_scale;
    var y_scale;
    
    // main
    $(document).ready(function() {
        initializeGraph();
        buildInterface();
    });
    
    // post: initializes global variables and draws axes
    function initializeGraph() {
        canvas = $('#canvas')[0];
        context = canvas.getContext('2d');
        defaultAxes();
    }
    
    // post: attaches event handlers
    function buildInterface() {
        $('#input').click(userCurves);
        $('#clear').click(userClear);
        $('#add_row').click(addRow);
        $('#remove_row').click(removeRow);
        $('#axes').click(setDimensions);
        $('#default_axes').click(defaultAxes);
    }
    
    // post: plots user input functions on graph
    function userCurves() {
        resetAxes();
        var coords = $('.coord');
        var curves = $('.curve');
        
        var terms = [];
        for (var i = 0; i < curves.length; i++) {
            var curve = curves[i].value;
            if (curve) {
                terms.push(separateTerms(curve));
            }
        }
        
        for (var i = 0; i < terms.length; i++) {
            var fixTerms = reformatTerms(terms[i]);
            for (var j = 0; j < fixTerms.length; j++) {
                if (fixTerms[j].length >= 1) {
                    var knots = getValues(fixTerms[j], coords[i].value);
                    plotValues(knots, getColor(i % 4));
                }
            }
        }
        
        solveRoots();
    }
    
    // post: clears all functions, error messages, domain descriptions, and
    //       text boxes
    function userClear() {
        resetAxes();
        clearText();    
    }
    
    // post: inserts one additional user input function text box
    function addRow() {
        var add = '<inline class="row"></br>' +
                        '<input type="text" class="coord" size="5" /> = ' +
                        '<input type="text" class="curve" size="25" />' +
                  '</inline>';
        $('#add').append(add);
    }
    
    // pre: at least 3 user input function text boxes
    // post: removes the bottom user input function text box
    function removeRow() {
        var rows = $('.row');
        rows[rows.length - 1].remove();
        userCurves();
    }
    
    // post: updates graph width, height, x_axis, and y_axis based on user input
    function setDimensions() {
        var dims = $('.dim');
        canvas.width = dims[0].value;
        canvas.height = dims[1].value;
        x_scale = dims[2].value;
        y_scale = dims[3].value;
        resetAxes();
    }
    
    // post: sets width=600, height=350, x_scale=25, y_scale=25 and clears graph 
    //       dimension text boxes
    function defaultAxes() {
        canvas.width = 600;
        canvas.height = 350;
        x_scale = 25;
        y_scale = 25;
        resetAxes();
        
        var dims = $('.dim');
        for (var i = 0; i < dims.length; i++) {
            dims[i].value = '';    
        }
    }
    
    // post: clears canvas and then draws axes
    function resetAxes() {
        clear();
            
        drawLine(u(0), v(-canvas.height / 2), u(0), v(canvas.height / 2));  // y-axis
        drawLine(u(-canvas.width / 2), v(0), u(canvas.width / 2), v(0));    // x-axis

        // x-axis scale
        for (var i = 0; i < canvas.width; i++) {
            drawLine(u(i ), v(-0.1), u(i ), v(0.1));
            drawLine(u(-i), v(-0.1), u(-i), v(0.1));
        }
        
        // y-axis scale
        for (var i = 0; i < canvas.height; i++) {        
            drawLine(u(-0.1), v(i ), u(0.1), v(i ));
            drawLine(u(-0.1), v(-i), u(0.1), v(-i));
        }
    }
    
    // post: clears canvas of all markings and removes any error messages
    //       displayed on page
    function clear() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        $('#error').html('');
        $('#domain').html('');
    }
    
    // post: clears all equations from input text boxes and removes all
    //       input rows except the first 2
    function clearText() {
        var coords = $('.coord');
        for (var i = 0; i < coords.length; i++) {
            coords[i].value = '';    
        }
        
        var curves = $('.curve');
        for (var i = 0; i < curves.length; i++) {
            curves[i].value = '';    
        }
        
        var rows = $('.row');
        for (var i = 0; i < rows.length; i++) {
            rows[i].remove();
        }
    }
    
    // pre: cartesian coordinates x1, y1, x2, y2
    // post: draws a line on graph from (x1, y1) to (x2, y2)
    function drawLine(x1, y1, x2, y2) {
        context.lineWidth = 2.0;
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.strokeStyle = 'black';
        context.stroke();
    }
    
    // pre: array fixTerms contains array in the form [constant,Math[funcType],param1,param2]
    //      at each index for each term in function. inTermsOf == 'y' if y=f(x), 'x' if x=f(y).
    //      throws invalid equation if inTermsOf != (x|y)
    // post: returns array of points on curve defined by fixTerms
    function getValues(fixTerms, inTermsOf) {
        var min = -canvas.width / (2 * x_scale);
        var max = -min;
        
        var knots = [];
        for (var i = min; i < max; i += 0.01) {
            var acc = 0;
            for (var j = 0; j < fixTerms.length; j++) {
                var term = fixTerms[j];
                acc += term[0] * term[1](i * term[2], term[3]);
            }
            
            if (inTermsOf == 'y') {
                knots.push([u(i), v(acc)]);   // if "y=" push([u(i), v(f(x))])
            } else if (inTermsOf == 'x') {
                knots.push([u(acc), v(i)]);   // if "x=" push([u(f(y)), v(i)])
            } else {
                reportError(inTermsOf);
            }
        }
        return knots;
    }
    
    // pre: array knots contains points on curve, valid color
    // post: plots points found in knots on graph using given color
    function plotValues(knots, color) {
        context.beginPath();
        context.moveTo(knots[0][0], knots[0][1]);
        for (var i = 0; i < knots.length - 2; i++) {
            var controls = getControlPoints(knots[ i ][0], knots[ i ][1], 
                                            knots[i+1][0], knots[i+1][1], 
                                            knots[i+2][0], knots[i+2][1]);
                                            
            context.bezierCurveTo(controls[0], controls[1], 
                                  controls[2], controls[3], 
                                  knots[i][0], knots[i][1]);
        }
        context.strokeStyle = color;
        context.stroke();
    }
    
    // pre: (x0,y0), (x1,y1), (x2,y2) define 3 nearby points on a curve
    // post: returns an array containing the Bezier curve control points formmatted
    //         as [ctrl_x1, ctrl_y1, ctrl_x2, ctrl_y2]
    function getControlPoints(x0, y0, x1, y1, x2, y2) {
        var dist01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        var dist12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        var fa = CURVE_SMOOTHNESS * dist01 / (dist01 + dist12);   // scaling factor 1
        var fb = CURVE_SMOOTHNESS - fa;                           // scaling factor 2
        var w = x2 - x0;
        var h = y2 - y0;
        return [x1 - fa * w, y1 - fa * h, x1 + fb * w, y1 + fb * h];
    }
    
    // pre: terms is an array containing each term in a function
    //      e.g. if f(x)=f1(x)+f2(x)+…+fn(x), then terms=[f1(x),f2(x),…,fn(x)]
    // post: returns an array of length 2 where index 0 stores an array describing each
    //       term with positive values for sqrt terms when applicable and index 1 stores
    //       the same array but instead using negative sqrt values when applicable
    function reformatTerms(terms) {
        var func    = [];
        var negSqrt = [];
        
        // regular expressions used to identify term type
        var constantRegex = /^[-+]?([0-9]*\.[0-9]+|[0-9]+)$/;       // select constant functions
        var linearRegex   = /^[-+]?([0-9]*\.[0-9]+|[0-9])(x|y)$/;   // select polynomial terms of degree 1
        var powerRegex    = /\^/;                                   // select polynomial terms of degree >= 2 (ax^b)
        var sqrtRegex     = /sqrt\(/;                               // select terms of the form c*sqrt(ax)
        var mathRegex     = /(abs|acos|asin|atan|ceil|cos|exp|floor|log|round|sin|sqrt|tan)/;
        
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            term = ensureConstant(term);
            var constant = parseFloat(term);
            
            if (constantRegex.test(term)) {                          // constant term
                func.push([constant, Math.pow, '1', '0']);           // [constant,  Math.pow,  '1', '0']
            } else if (linearRegex.test(term)) {                     // linear term
                func.push([constant, Math.pow, '1', '1']);           // [constant,  Math.pow,  '1', '1']
            } else if (powerRegex.test(term)) {
                var degree = term.split(powerRegex)[1];              // polynomial term of degree >= 2
                func.push([constant, Math.pow, '1', degree]);        // [constant,  Math.pow,  '1', degree]
            } else if (sqrtRegex.test(term)) {
                if (negSqrt.length == 0) {
                    negSqrt = $.merge([], func);
                }
                var a = getA(term, sqrtRegex);                       // sqrt term
                func.push([constant, Math.sqrt, a, null]);           // [constant,  Math.sqrt, a, null]
                negSqrt.push([-1 * constant, Math.sqrt, a, null]);   // [-constant, Math.sqrt, a, null]
            } else if (mathRegex.test(term)) {
                var funcType = mathRegex.exec(term)[0];
                var a = getA(term, /[()]/);                          // valid JS Math object method name
                func.push([constant, Math[funcType], a, null]);      // [constant, Math.funcType, a, null]
            } else {
                reportError(term);
            }
        }
        return [func, negSqrt];
    }
    
    // pre: String term in form 'cfunction(ax)', regex to isolate 'ax)'
    // post: returns float a found in term
    function getA(term, regex) {
        var pieces = term.split(regex);
        var a = parseFloat(pieces[1]);
        if (!a) {
            a = 1;
        }
        return a;
    }
    
    // pre: input function
    // post: returns an array containing each term individually with all whitespace removed
    function separateTerms(input) {
        input = input.replace(/-/g, '+ -');
        if (input.charAt(0) == '+') {
            input = input.slice(1);    
        }
        input = input.replace(/\s+/g, '');
        return input.split('+');
    }
        
    // pre: term
    // post: checks if a constant multiplier is present in front of the variable (x|y) and 
    //       inserts a 1 or -1 if not
    function ensureConstant(term) {
        if (!/^[-+]?([0-9]*\.[0-9]+|[0-9]+)/.test(term)) {
            // doesn't contain a leading constant already
            if (/-/.test(term)) {
                term = term.replace(/-/, '-1');
            } else {
                term = '1'.concat(term);
            }
        }
        return term;
    }
    
    // pre: x in cartesian coordinates
    // post: returns the corresponding horizontal canvas coordinate in pixels
    function u(x) {
        return canvas.width / 2 + x_scale * x;
    }

    // pre: y in cartesian coordinates
    // post: returns the corresponding vertical canvas coordinate in pixels
    function v(y) {
        return canvas.height / 2 - y_scale * y;
    }
    
    // pre: number i corresponding to input box row from top (i=0) to bottom
    // post: returns line color based on which input box filled in by user
    //       i%4=0:red, i%4=1:blue, i%4=2:green, i%4=3:brown
    function getColor(row) {
        var colors = ['red', 'blue', 'green', 'purple'];
        return colors[row];
    }
    
    // pre: input is an unrecognized function
    // post: throws error
    function reportError(input) {
        try {
            throw 'invalid equation';
        } catch (err) {
            $('#error').html('Error: Invalid equation entered. Please check formatting: ' + input);
        }
    }
    
    
    
    //////////////////////////////////////////////////
    //                                              //
    //                                              //
    //                                              //
    //               SOLVE FOR DOMAIN               //
    //                                              //
    //                                              //
    //                                              //
    //////////////////////////////////////////////////
    
    
    
    // post: print a description of the domain D as described by user input
    function solveRoots() {
        var integrationOrder = getIntegrationOrder();
        var innerCoord = integrationOrder[0];
        var outerCoord = integrationOrder[1];
        
        // account for bounds given directly as input
        var given = givenBounds(innerCoord, outerCoord);
        var innerBounds = given[0];
        var outerBounds = given[1];
        
        if ((innerBounds.length >= 2) && (outerBounds.length < 2)) {
            var terms = [];
            for (var i = 0; i < innerBounds.length; i++) {
                terms.push(separateTerms(innerBounds[i]));    
            }
            
            if (isPolynomial(terms)) {
                var coefficients = getCoefficients(terms);
                var roots = getRoots(coefficients);
                for (var i = 0; i < roots.length; i++) {
                    outerBounds.push(roots[i]);
                }
                outerBounds.sort();
            } else if (isSqrt(terms) >= 0) {
                var fixedTerms = sqrtToPow(terms);
                solveSqrt(isSqrt(terms), fixedTerms, outerBounds);
            }
            orderInnerBounds(innerBounds, outerBounds);
            printDomain(innerBounds, outerBounds, innerCoord, outerCoord);
        } else if ((innerBounds.length == 2) && (outerBounds.length == 2)) {
            orderInnerBounds(innerBounds, outerBounds);
            printDomain(innerBounds, outerBounds, innerCoord, outerCoord);
        }
    }
    
    // post: returns ['y','x'] for dydx integrals and ['x','y'] for dxdy integrals
    function getIntegrationOrder() {
        var coords = $('.coord');
        var y_count = 0;
        var x_count = 0;
        for (var i = 0; i < coords.length; i++) {
            if (coords[i].value == 'y') {
                y_count++;    
            } else if (coords[i].value == 'x') {
                x_count++;    
            }
        }
        
        if (y_count > x_count) {
            return ['y', 'x'];
        } else if (x_count > y_count) {
            return ['x', 'y'];
        } else if (y_count == 2) {
            return ['y', 'x'];
        } else {
            return [null, null]; // for now    
        }
    }
    
    // pre: innerCoord='y', outerCoord='x' for dydx integrals and vice versa for 
    //      dxdy integrals
    // post: returns [innerBounds,outerBounds] given as user input
    function givenBounds(innerCoord, outerCoord) {
        var coords = $('.coord');
        var curves = $('.curve');
        var innerBounds = [];
        var outerBounds = [];
        for (var i = 0; i < curves.length; i++) {
            if (coords[i].value == innerCoord) {
                innerBounds.push(curves[i].value);
            } else if (coords[i].value == outerCoord) {
                outerBounds.push(curves[i].value);
            }
        }
        return [innerBounds, outerBounds];
    }
    
    // pre: terms is a multidimensional array of each term found in each equation given
    //      in terms of innerCoord, e.g. terms=[[2x^2],[1,x^2]] for input y=2x^2, y=1+x^2
    // post: returns true if all functions given in terms of innerCoord are polynomial
    //       functions, returns false otherwise
    function isPolynomial(terms) {
        for (var i = 0; i < terms.length; i++) {
            var fixedTerms = reformatTerms(terms[i])[0];
            for (var j = 0; j < fixedTerms.length; j++) {
                if (fixedTerms[j][1] != Math.pow) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // pre: terms is a multidimensional array of each term found in each equation given
    //      in terms of innerCoord, e.g. terms=[[2x^2],[1,x^2]] for input y=2x^2, y=1+x^2
    // post: returns an array of length 3 containing the coefficients obtained by setting
    //       the individual polynomials equal to each other and solving. if ax^2+bx+c=0,
    //       then the returned array contains [c,b,a]
    function getCoefficients(terms) {
        var coeff = [0, 0, 0];
        for (var i = 0; i < terms.length; i++) {
            var fixedTerms = reformatTerms(terms[i])[0];
            for (var j = 0; j < fixedTerms.length; j++) {
                if (i % 2 == 0) {
                    coeff[fixedTerms[j][3]] += fixedTerms[j][0];
                } else {
                    coeff[fixedTerms[j][3]] -= fixedTerms[j][0];    
                }
            }
        }
        return coeff;
    }
    
    // pre: coefficients is an array of polynomial (degree 2 or less) coefficients in the form
    //      [c,b,a] where ax^2+bx+c=0
    // post: returns the root(s) obtained by solving ax^2+bx+c=0
    function getRoots(coefficients) {
        if (coefficients[2] == 0) {
            return solveLinearEqu(coefficients);
        } else {
            return solveQuadEqu(coefficients);    
        }
    }
    
    // pre: coefficients [b,a,0]
    // post: returns the sole solution to ax+b=0
    function solveLinearEqu(coefficients) {
        var a = coefficients[1];
        var b = coefficients[0];
        return [-b / a];
    }
    
    // pre: coefficients [c,b,a]
    // post: returns the two solutions to ax^2+bx+c=0
    function solveQuadEqu(coefficients) {
        var a = coefficients[2];
        var b = coefficients[1];
        var c = coefficients[0];
        var radical = Math.sqrt(Math.pow(b, 2) - 4 * a * c);
        var root1 = (-b - radical) / (2 * a);
        var root2 = (-b + radical) / (2 * a);
        return [root1, root2];
    }
    
    // pre: fixedTerms, mid
    // post: returns the function's value at the range's midpoint
    function getAcc(fixedTerms, mid) {
        var acc = 0;
        for (var i = 0; i < fixedTerms.length; i++) {
            var term = fixedTerms[i];
            acc += term[0] * term[1](mid * term[2], term[3]);
        }
        return acc;
    }
    
    // pre: terms
    // post: returns row index of sqrt function if terms contains a function 
    //       of type sqrt, returns -1 otherwise
    function isSqrt(terms) {
        var sqrtRegex = /sqrt/;
        for (var i = 0; i < terms.length; i++) {
        	if (terms[i].length > 1) {
        		return -1;	
        	}
            for (var j = 0; j < terms[i].length; j++) {
                if (sqrtRegex.test(terms[i][j])) {
                    return i;    
                }    
            }
        }
        return -1;
    }
    
    // pre: terms in form c*sqrt(ax)
    // post: returns array of form [c,Math.pow,a,0.5]
    function sqrtToPow(terms) {
        var reformatted = [];
        for (var i = 0; i < terms.length; i++) {
            var fixedTerms = reformatTerms(terms[i])[0];
            for (var j = 0; j < fixedTerms.length; j++) {
                if (fixedTerms[j][1] == Math.sqrt) {
                    fixedTerms[j][1] = Math.pow;
                    fixedTerms[j][3] = 0.5;
                }
                reformatted.push(fixedTerms[j]);
            }
        }
        return reformatted;
    }
    
    // pre: index corresponding to input row where sqrt function found, fixedTerms stores 
    //      an array of the form [[c1,Math.pow,a,0.5],[c2,Math.pow,1,n]] (ignoring order),
    //      outerBounds
    // post: solves c1(ax)^0.5 = c2(x)^n for x
    function solveSqrt(index, fixedTerms, outerBounds) {
        // c1(ax)^0.5
        var sqrtFunc = fixedTerms[index];
        var c1 = sqrtFunc[0];
        var a  = sqrtFunc[2];
        
        // c2(x)^n
        var powFunc = fixedTerms[Math.abs(index - 1)];
        var c2 = powFunc[0];
        var n  = powFunc[3];
        
        //     c2*x^n = c1(ax)^0.5
        //  x^(n-0.5) = (c1/c2) * sqrt(a)
        // x1 = 0, x2 = ((c1/c2) * sqrt(a))^(1/(n-0.5))
        var c = c1 / c2;
        var exponent = 1 / (n - 0.5);
        outerBounds.push(0);
        outerBounds.push(Math.pow(c * Math.sqrt(a), exponent))
    }
    
    // pre: innerBounds, outerBounds
    // post: sorts innerBounds functions over range indicated by outerBounds
    function orderInnerBounds(innerBounds, outerBounds) {
        var mid = (outerBounds[0] + outerBounds[1]) / 2;
        var acc1 = getAcc(reformatTerms(separateTerms(innerBounds[0]))[0], mid);
        var acc2 = getAcc(reformatTerms(separateTerms(innerBounds[1]))[0], mid);
        if (acc1 > acc2) {
            swap(innerBounds);
        }
    }
    
    // pre: innerBounds
    // post: swaps order of functions in innerBounds array
    function swap(innerBounds) {
        var temp = innerBounds[0];
        innerBounds[0] = innerBounds[1];
        innerBounds[1] = temp;    
    }
    
    // pre: innerBounds, outerBounds, innerCoord, outerCoord
    // post: prints a description of the domain
    function printDomain(innerBounds, outerBounds, innerCoord, outerCoord) {
        if ((outerBounds[0] !== undefined) && (outerBounds[1] !== undefined)) {
            var outerString = '' + outerBounds[0] + ' <= ' + outerCoord + ' <= ' + outerBounds[1];
            var innerString = '' + innerBounds[0] + ' <= ' + innerCoord + ' <= ' + innerBounds[1];
            $('#domain').html('D = {(x,y) | ' + outerString + ', ' + innerString + '}');
        }
    }

})();
