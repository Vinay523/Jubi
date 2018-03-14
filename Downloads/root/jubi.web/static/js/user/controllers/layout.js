'use strict';

var module = angular.module('Jubi.controllers');
services.factory(sessionStorageObj);

module.controller('HeaderController', ['$scope', '$modal', '$window', 'authService',
    function ($scope, $modal, $window, authService) {
        $scope.programsOpen = false;
        $scope.auth = false;

        $scope.$watch(function() { return authService.auth }, function() {
            $scope.auth = authService.auth;
        });

        $scope.togglePrograms = function(e) {
            e.preventDefault();
            $scope.programsOpen = !$scope.programsOpen;
        };
    }]);

module.controller('TopNavController', ['$scope', '$window',
    function ($scope, $window) {
        //doing funny stuff with spaes here to ensure we either have /path/ inside the url
        //or /path at the end of the url. Prevents a path like /networkUser/ from returning true for
        //path = 'network'
        //Dinesh edit - var to hold page name.
        $scope.currentPage = null;
        $scope.isActive = function (path) {
            if (($window.location.pathname.indexOf('/' + path + '/') >= 0) || (($window.location.pathname + ' ').indexOf('/' + path + ' ') >= 0)) {
                if (path === "quests") {
                    $scope.currentPage = "Activity";
                } else if (path === "todo-management"){
                    $scope.currentPage = "Actions";
                }else {
                    //console.log("path val is " + path)
                    $scope.currentPage = path;
                }
                
            }
            return ($window.location.pathname.indexOf('/' + path + '/') >= 0)
            || (($window.location.pathname + ' ').indexOf('/' + path + ' ') >= 0);
        };

        $scope.navToPage = function(e,page){
            e.preventDefault();
            e.stopPropagation();
            if (page === "quests") {
                $scope.currentPage = "Quest";
            } else {
                $scope.currentPage = page;
            }
            
            var url = '/user/program/' + $scope.program.slug + '/' + page;
            if ($scope.preview) url += '?preview=' + $scope.preview;
            if ($scope.previewRet) url += '&previewRet=' + $scope.previewRet;
            $window.location = url;
        };

        $scope.toggleSubNav = function () {
            if ($('.program-menu ul.quest_mobile_menu li ul.dropdown').hasClass('open')) {
                $('.program-menu ul.quest_mobile_menu li ul.dropdown').hide().removeClass('open');
            } else {
                $('.program-menu ul.quest_mobile_menu li ul.dropdown').show().addClass('open');
            }
        };

        $scope.dropdownNavopen = function () {
            $('div.program-menu li.drop ul.drop-menu').show().addClass('show');
        }

        $scope.dropdownNavclose = function () {
            setTimeout(function () {
                $('div.program-menu li.drop ul.drop-menu').hide().removeClass('show');
            }, 4500);
            
        }

      //  $('div.program-menu li.dropdown').hover(function () {
      //    $(this).find('.dropdown-menu').stop(true, true).delay(200).fadeIn(500);
      //}, function () {
      //    $(this).find('.dropdown-menu').stop(true, true).delay(200).fadeOut(500);
      //      });

    }]);

module.controller('SidebarRightController', ['$scope', 'authService', 'sessionStorageService', '$rootScope',
    function ($scope, authService, sessionStorageService, $rootScope) {
        $scope.user = null;
        $scope.$watch(function() { return authService.user; }, function() {
            $scope.user = authService.user;
        });
        $scope.logout = function(){
            sessionStorageService.clear();
        };
        $scope.openInspirationModal = $rootScope.openInspireModal;
    }]);

module.controller('MainNavController', ['$scope', 'authService', 'sessionStorageService', '$rootScope','$window',
    function ($scope, authService, sessionStorageService, $rootScope, $window) {
        $scope.user = null;
        $scope.$watch(function () { return authService.user; }, function () {
            $scope.user = authService.user;
        });
        $scope.logout = function () {
            sessionStorageService.clear();
        };
        //$scope.openInspirationModal = $rootScope.openInspireModal;

        $scope.user = authService.user;
        if ($scope.user.title === '' || $scope.user.title === null) {
                if ($window.location.pathname == '/user' || $window.location.pathname == '/user/profile')
                {
                    $(".name").addClass('adjustname');
                }
                else {
                    $(".name").removeClass('adjustname');
                }
            }

            else {
                $(".name").removeClass('adjustname');
            }
        
        
    }]);


