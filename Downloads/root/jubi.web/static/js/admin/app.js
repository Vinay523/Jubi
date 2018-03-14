'use strict';

var filters = angular.module('Jubi.filters', []);
var controllers = angular.module('Jubi.controllers', []);
var directives = angular.module('Jubi.directives', []);
var services = angular.module('Jubi.services', []);

services.factory(authServiceObj);
services.factory(helperServiceObj);
services.factory(dataServiceObj);
directives.directive(numberMaskObj);


var app = angular.module('Jubi', [
    'Jubi.filters',
    'Jubi.services',
    'Jubi.directives',
    'Jubi.controllers',
    'ngSanitize',
    'ui.bootstrap',
    'angularSpinner',
    'dndLists',
    'datatables',
    'datatables.light-columnfilter',
    'datatables.bootstrap',
    'angularjs-dropdown-multiselect',
    'angularFileUpload',
    'colorpicker.module'
]);

controllers.controller('HeaderController', ['$scope', '$http', '$window', 'authService', '$rootScope', '$timeout',
    function ($scope, $http, $window, authService, $rootScope, $timeout) {
        $scope.welcome = authService.user.firstName + ' ' + authService.user.lastName;
        $scope.logoUrl = authService.user.clients[0].logoImageUrl;
        $scope.buddyLabel = authService.user.clients[0].buddyLabel;
        $scope.badgeLabel = authService.user.clients[0].badgeLabel;
        $scope.logoLeft = authService.user.clients[0].logoAlignment == 'left';
        $scope.logoCenter = authService.user.clients[0].logoAlignment == 'center';

        $scope.getBuddyLabel = function(camel){
            if($scope.buddyLabel) {
                if (camel) {
                    return $scope.buddyLabel.charAt(0).toUpperCase() + $scope.buddyLabel.slice(1);
                }
                return $scope.buddyLabel;
            }else{
                if(camel){
                    return 'Buddy';
                }
                return 'buddy'
            }
        };

        $scope.getBadgeLabel = function(camel){
            if($scope.badgeLabel) {
                if (camel) {
                    return $scope.badgeLabel.charAt(0).toUpperCase() + $scope.badgeLabel.slice(1);
                }
                return $scope.badgeLabel;
            }else{
                if(camel){
                    return 'Badge';
                }
                return 'badge'
            }
        };

        $scope.isActive = function (path) {
            return $window.location.pathname.indexOf(path) >= 0;
        };

        $scope.isSystemAdmin = authService.canSystemAdmin();


        $scope.getHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': authService.user.clients[0].headerColor,
                    'color': authService.user.clients[0].headerFontColor
                }
            }
        };

        $scope.buttons = [
            {id: 'Clients', hovered: false},
            {id: 'Users', hovered: false},
            {id: 'System Configuration', hovered: false},
            {id: 'Your Programs', hovered: false},
            {id: 'Manage', hovered: false},
            {id: 'Welcome', hovered: false}
        ];

        $scope.setButtonHovered = function (id) {
            if (id == $scope.buttons[0].id) {
                $scope.buttons[0].hovered = true;
            }
            if (id == $scope.buttons[1].id) {
                $scope.buttons[1].hovered = true;
            }
            if (id == $scope.buttons[2].id) {
                $scope.buttons[2].hovered = true;
            }
            if (id == $scope.buttons[3].id) {
                $scope.buttons[3].hovered = true;
            }
            if (id == $scope.buttons[4].id) {
                $scope.buttons[4].hovered = true;
            }
            if (id == $scope.buttons[5].id) {
                $scope.buttons[5].hovered = true;
            }
        };

        $scope.setButtonNotHovered = function (id) {
            if (id == $scope.buttons[0].id) {
                $scope.buttons[0].hovered = false;
            }
            if (id == $scope.buttons[1].id) {
                $scope.buttons[1].hovered = false;
            }
            if (id == $scope.buttons[2].id) {
                $scope.buttons[2].hovered = false;
            }
            if (id == $scope.buttons[3].id) {
                $scope.buttons[3].hovered = false;
            }
            if (id == $scope.buttons[4].id) {
                $scope.buttons[4].hovered = false;
            }
            if (id == $scope.buttons[5].id) {
                $scope.buttons[5].hovered = false;
            }
        };

        $scope.getButtonCustomStyle = function (button) {
            if (authService.user.clients[0].headerColor) {
                var backgroundColor = authService.user.clients[0].headerColor;
                var color = authService.user.clients[0].headerFontColor;
                var fontWeight= 'auto';

                if (button == 'Clients' && $scope.isActive('/admin/clients')) {
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.2);
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                } else if (button == 'Users' && $scope.isActive('/admin/users')) {
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.2);
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                } else if (button == 'System Configuration' && $scope.isActive('/admin/system-configuration')) {
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.2);
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                }

                if (button == 'Clients' && $scope.buttons[0].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                } else if (button == 'Users' && $scope.buttons[1].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                } else if (button == 'System Configuration' && $scope.buttons[2].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                } else if (button == 'Your Programs' && $scope.buttons[3].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                } else if (button == 'Manage' && $scope.buttons[4].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                } else if (button == 'Welcome' && $scope.buttons[5].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    fontWeight = '500';
                }

                return {
                    'background': backgroundColor,
                    'color': color,
                    'font-weight': fontWeight
                }
            }
        };

        function ColorLuminance(hex, lum) {
            if(hex) {
                // validate hex string
                hex = String(hex).replace(/[^0-9a-f]/gi, '');
                if (hex.length < 6) {
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }
                lum = lum || 0;

                // convert to decimal and change luminosity
                var rgb = "#", c, i;
                for (i = 0; i < 3; i++) {
                    c = parseInt(hex.substr(i * 2, 2), 16);
                    c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
                    rgb += ("00" + c).substr(c.length);
                }

                return rgb;
            }
        }


        $rootScope.scrollToError = function () {
            $timeout(function () {
                var elm = $('.text-danger:visible');
                if (elm.length <= 0) elm = $('.has-error:visible');
                if (elm.length <= 0) elm = $('.quest-error:visible');
                if (elm.length <= 0) elm = $('.customerr:visible');
                if (elm.length > 0) {
                    var bodyCanvas = $('#bodyCanvas');
                    var sidebarCanvas = $('#sidebarCanvas');

                    if (bodyCanvas[0] && $.contains(bodyCanvas[0], elm[0])) {
                        $('#bodyCanvas').animate({scrollTop: ((($(elm).offset().top - $(elm).closest('#bodyCanvas').offset().top) + $(elm).closest('#bodyCanvas').scrollTop()) - 40)}, 'slow');
                    } else if (sidebarCanvas[0] && $.contains(sidebarCanvas[0], elm[0])) {
                        $('#sidebarCanvas').animate({scrollTop: ((($(elm).offset().top - $(elm).closest('#sidebarCanvas').offset().top) + $(elm).closest('#sidebarCanvas').scrollTop()) - 40)}, 'slow');
                    } else {
                        $('html,body').animate({scrollTop: elm.offset().top - 100}, 'slow');
                    }
                }
            }, 0);
        };

    }]);

controllers.controller('HomeController', ['$scope', '$http', '$window', 'authService',
    function ($scope, $http, $window, authService) {

    }]);
