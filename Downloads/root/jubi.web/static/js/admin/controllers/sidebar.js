'use strict';

var module = angular.module('Jubi.controllers');

module.controller('SidebarController', ['$scope', '$window', 'authService',
    function ($scope, $window, authService) {

        $scope.showSubNav = false;
        $scope.activeTab = null;
        $scope.activeSubTab = '';
        $scope.user = authService.user;

        $scope.menu = [
            /*{
                label: 'Dashboard',
                link: '/manage/dashboard',
                icon: 'fa-th-large',
                expanded: ($window.location.pathname.indexOf('/manage/dashboard') >= 0),
                active: ($window.location.pathname.indexOf('/manage/dashboard') >= 0),
                new: false,
                items: [
                    {
                        label: 'View 1',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'View 2',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'View 3',
                        link: '#',
                        active: false,
                        new: false
                    }
                ]
            },
            {
                label: 'Users',
                icon: 'fa-bar-chart-o',
                expanded: ($window.location.pathname.indexOf('/manage/users') >= 0),
                active: ($window.location.pathname.indexOf('/manage/users') >= 0),
                new: false,
                items: [
                    {
                        label: 'Groups',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Teams',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'People',
                        link: '#',
                        active: false,
                        new: false
                    }
                ]
            },
            {
                label: 'Forums',
                icon: 'fa-edit',
                expanded: ($window.location.pathname.indexOf('/manage/forums') >= 0),
                active: ($window.location.pathname.indexOf('/manage/forums') >= 0),
                new: false,
                items: [
                    {
                        label: 'Basic Form',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Advanced Plugins',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Wizard',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'File Upload',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Text Editor',
                        link: '#',
                        active: false,
                        new: false
                    }
                ]
            },
            {
                label: 'Resources',
                icon: 'fa-files-o',
                expanded: ($window.location.pathname.indexOf('/manage/resources') >= 0),
                active: ($window.location.pathname.indexOf('/manage/resources') >= 0),
                new: false,
                items: [
                    {
                        label: 'Manage Resources',
                        link: '#',
                        active: false,
                        new: false
                    }
                ]
            },
            {
                label: 'Market Place',
                icon: 'fa-shopping-cart',
                expanded: ($window.location.pathname.indexOf('/manage/market-place') >= 0),
                active: ($window.location.pathname.indexOf('/manage/market-place') >= 0),
                new: true,
                items: [
                    {
                        label: 'New Programs',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Best Sellers',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Jubi Sponsored',
                        link: '#',
                        active: false,
                        new: false
                    }
                ]
            },
            {
                label: 'My Programs',
                icon: 'fa-flask',
                expanded: ($window.location.pathname.indexOf('/manage/my-programs') >= 0),
                active: ($window.location.pathname.indexOf('/manage/my-programs') >= 0),
                new: false,
                items: [
                    {
                        label: 'Program #1',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Program #2',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Program #3',
                        link: '#',
                        active: false,
                        new: false
                    }
                ]
            },*/
            // {
                // label: 'Authoring Suite',
                // link: '/manage/authoring-suite/programs',
                // icon: 'fa-table',
                // expanded: ($window.location.pathname.indexOf('/manage/authoring-suite') >= 0),
                // active: ($window.location.pathname.indexOf('/manage/authoring-suite') >= 0),
                // new: false,
                // items: [
                    // {
                        // label: 'Programs',
                        // link: '/manage/authoring-suite/programs',
                        // active: false,
                        // new: false

                    // },
                    // {
                        // label: 'Levels',
                        // link: '/manage/authoring-suite/levels',
                        // active: false,
                        // new: false
                    // },
                    // /*{
                        // label: 'To-Do\'s',
                        // link: '/manage/authoring-suite/to-dos',
                        // active: false,
                        // new: false
                    // },*/
                    // {
                        // label: 'Scoring',
                        // link: '/manage/authoring-suite/scoring',
                        // active: false,
                        // new: false
                    // },
                    // /*{
                        // label: 'Achievements & Badges',
                        // link: '/manage/authoring-suite/achievements',
                        // active: false,
                        // new: false
                    // }*/
                // ]
            // },
			{
                label: 'Users',
                icon: 'fa fa-users',
                expanded: ($window.location.pathname.indexOf('/manage/users') >= 0),
                active: ($window.location.pathname.indexOf('/manage/users') >= 0),
                new: false,
                items: [
                    {
                        label: 'Groups',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'Teams',
                        link: '#',
                        active: false,
                        new: false
                    },
                    {
                        label: 'People',
                        link: '/admin/users/people',
                        active: false,
                        new: false
                    }
                ]
            },
			{
                label: 'Clients',
                icon: 'fa fa-user-plus',
                expanded: ($window.location.pathname.indexOf('/admin/clients') >= 0),
                active: ($window.location.pathname.indexOf('/admin/clients') >= 0),
                new: false,
                items: [
                    {
                        label: 'Manage Clients',
                        link: '/admin/clients',
                        active: false,
                        new: false
                    },
                   
                ]
            }
        ];

        var init = function() {
            if ($window.location.pathname.indexOf('authoring-suite') >= 0) $scope.activeTab = 'AuthoringSuite';
            else $scope.activeTab = 'AuthoringSuite';
        };
        init();

        $scope.toggleItem = function(e, item) {
            e.preventDefault();
            if (item.expanded && !item.active && item.link) {
                $window.location = item.link;
                return;
            }
            item.expanded = !item.expanded;
        };
    }]);
