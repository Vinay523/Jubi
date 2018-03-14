var numberMaskObj = {};
numberMaskObj.numberMask = function (helperService) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            if (!ngModel) return;

            element.on('keydown', function (e) {
                if (((e.which < helperService.charCodes.number0.charCode || e.which > helperService.charCodes.number9.charCode)
                    && (e.which < helperService.charCodes.numPad0.charCode || e.which > helperService.charCodes.numPad9.charCode)
                    && e.which != helperService.charCodes.tab.charCode
                    && e.which != helperService.charCodes.deleteKey.charCode
                    && e.which != helperService.charCodes.numPadDeleteKey.charCode
                    && (e.which != helperService.charCodes.period.charCode || attrs.allowDecimal == 'false')
                    && (e.which != helperService.charCodes.decimalPoint.charCode || attrs.allowDecimal == 'false')
                    //&& e.which != helperService.charCodes.comma.charCode
                    && e.which != helperService.charCodes.backspace.charCode
                    && !e.ctrlKey
                    && !e.metaKey
                    && e.which != helperService.charCodes.leftArrow.charCode
                    && e.which != helperService.charCodes.rightArrow.charCode) || e.shiftKey) {
                    e.preventDefault();
                    return;
                }

                if((e.which == helperService.charCodes.period.charCode && attrs.allowDecimal != 'false')
                || (e.which == helperService.charCodes.decimalPoint.charCode && attrs.allowDecimal != 'false')) {
                    if (element.val().indexOf('.') != -1) {
                        e.preventDefault();
                        return;
                    }
                }
            });

            //Commenting out the parser because we have code that expects number inputs to be in string format
            function parser(fromViewValue) {
                if(attrs.allowDecimal == 'false') {
                    var value = fromViewValue.replace(/\D/g, '');
                    element.val(value);
                }else{
                    value = fromViewValue;
                }
                return value;
            }

            ngModel.$parsers.push(parser);
        }
    };
};
