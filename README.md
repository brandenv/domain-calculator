domain-calculator
=================

Input functions describing a general type I or type II region and domain-calculator will plot each function
separately and output the domain using the following general format:

        D = {(x, y) | a <= x <= b, c < y < d}

To evaluate the double integral of f(x, y) over D, use a <= x <= b and c <= y <= d as the limits
of integration to calculate the iterated integral of f(x, y).


Some examples of valid input syntax include:

        y = 2x^2 + 1, x = sin(y) + 3cos(2y), x = abs(-4), y = 3sqrt(2x)
        
        
Note that domain-calculator is still in progress and is not yet fully functinal for all types of input.
