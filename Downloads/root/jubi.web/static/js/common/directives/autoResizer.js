var autoResizerObj = {};
autoResizerObj.autoResizer = function ($window, $timeout) {

    function link(scope, elem, attrs) {
        var set,
            w = angular.element($window),
            e = angular.element(elem),
            type = attrs.resizetype,
            widthSize = (attrs.checkwidth) ? Number(attrs.checkwidth) : '',
            scopeVar = (attrs.togglevar) ? attrs.togglevar : '';


        /* TODO: Refactor Function to one or two! */
        if (type == 'height') {
            scope.$watch(
                function () {
                    return elem.height();
                },
                function (newValue, oldValue) {
                    $timeout(function () {
                        if (!scope.maxWidth) scope.maxWidth = newValue;
                        else {
                            if (newValue >= oldValue)
                                scope.maxHeight = (newValue > scope.maxHeight) ? newValue : scope.maxHeight;
                            else
                                scope.maxHeight = (oldValue >= scope.maxHeight) ? oldValue : scope.maxHeight;
                        }
                        //elem.css('min-height', scope.maxHeight);
                        //elem.height(scope.maxHeight);
                        scope.setTileHeight(elem.height());
                    });
                }
            );
        }

        if (type == 'width') {
            scope.$watch(
                function () {
                    return elem.width();
                },
                function (newValue, oldValue) {
                    $timeout(function () {
                        if (!scope.maxWidth) scope.maxWidth = newValue;
                        else {
                            if (newValue >= oldValue)
                                scope.maxWidth = (newValue > scope.maxWidth) ? newValue : scope.maxWidth;
                            else
                                scope.maxWidth = (oldValue >= scope.maxWidth) ? oldValue : scope.maxWidth;
                        }
                        //elem.css('min-width', scope.maxWidth);
                        //elem.width(scope.maxWidth);
                        scope.setTileHeight(elem.width());
                    });

                }
            );
        }

        if (type == 'height-to-width') {
            scope.$watch(
                function () {
                    return elem.height();
                },
                function (newValue, oldValue) {
                    $timeout(function () {
                        if (!scope.maxWidth) scope.maxWidth = newValue;
                        else {
                            if (newValue >= oldValue)
                                scope.maxHeight = (newValue > scope.maxHeight) ? newValue : scope.maxHeight;
                            else
                                scope.maxHeight = (oldValue >= scope.maxHeight) ? oldValue : scope.maxHeight;
                        }
                        //elem.css('min-width', scope.maxHeight);
                        elem.width(scope.maxHeight);
                    });
                }
            );
        }

        if (type == 'width-to-height') {
            scope.$watch(
                function () {
                    return elem.width();
                },
                function (newValue, oldValue) {
                    $timeout(function () {
                        if (!scope.maxWidth) scope.maxWidth = newValue > oldValue ? newValue : oldValue;
                        else {
                            if (newValue >= oldValue)
                                scope.maxWidth = newValue > scope.maxWidth ? newValue : scope.maxWidth;
                            else
                                scope.maxWidth = oldValue >= scope.maxWidth ? oldValue : scope.maxWidth;
                        }
                        //elem.css('min-height', scope.maxWidth);
                        elem.height(scope.maxWidth);
                    });
                }
            );
        }

        //Calls a function on a parent scope to set the tile height for a tile autoResizer was included on
        //The rest of the tiles in the grid use this set height to get their heights an this ensure that all tiles have the same height
        if (type == 'square-tiles-in-grid') {
            $timeout(function () { //timeout here to give the ng-attr time to add the auto-resize attribute to the element
                if (elem[0].attributes['auto-resizer'] && elem[0].attributes['auto-resizer'].nodeValue == "true") {
                    var setHeight;
                    scope.$watch(
                        function () {
                            return elem.width();
                        },
                        function (newValue, oldValue) {
                            scope.setTileHeight(elem.width());
                        }
                    );
                }
            })
        }

        if (type == 'checkwidth') {
            scope.$watch(
                function () {
                    return elem.width();
                },
                function (newValue, oldValue) {
                    if (newValue <= widthSize) {
                        scope.toggle[scopeVar] = true;
                    } else {
                        scope.toggle[scopeVar] = false;
                    }
                }
            );
        }

        //These two functions make sure that angular watches update after the screen resizes or the canvas size changes
        w.bind('resize', function () {
            $timeout(function () {
                scope.$apply();
            }, 400);
        });

        scope.$watch(function(){
            return scope.toggle.asideNav;
        }, function(){
            $timeout(function () {
                scope.$apply();
            }, 400);
        })
    }

    return {
        restrict: 'EA',
        link: link
    }

};

