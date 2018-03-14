var blinkObj = {};
blinkObj.blink = function ($timeout) {
    return {
        restrict: 'A',
        scope: {
            enabled: "=blink"
        },
        link: function ($scope, $element, attrs) {
            var count = 0;
            var start = function () {
                if (!attrs.blinkCount || count < Number(attrs.blinkCount) && $scope.enabled) {
                    $element.addClass('flash');
                    $timeout(function () {
                        $element.removeClass('flash');
                        $timeout(function () {
                            count++;
                            start();
                        });
                    }, 1000);
                }
            };
            start();
        }
    }
};