'use strict';

var module = angular.module('Jubi.controllers');

module.controller('SidebarController', ['$scope', '$window', '$timeout', 'authService',
    function ($scope, $window, $timeout, authService) {

        $scope.showSubNav = false;
        $scope.activeTab = null;
        $scope.activeSubTab = '';
        $scope.user = authService.user;


        $scope.menu = [
            
            {
                label: 'Authoring Suite',
                link: '/manage/authoring-suite/programs',
                icon: 'fa-table',
                expanded: ($window.location.pathname.indexOf('/manage/authoring-suite') >= 0),
                active: ($window.location.pathname.indexOf('/manage/authoring-suite') >= 0),
                new: false,
                items: [
                    {
                        label: 'Select Programs',
                        link: '/manage/authoring-suite/programs',
                        active: false,
                        visible: function () {
                            return $scope.getSelectedProgram() == null
                        },
                        new: false
                    },
                    {
                        label: null,
                        link: function () {
                            var program = $scope.getSelectedProgram();
                            if (program) {
                                return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit';
                            }
                        },
                        active: function () {
                            var program = $scope.getSelectedProgram();
                            return ($window.location.pathname === '/manage/authoring-suite/program/' + program.slug + '/edit');
                        },
                        childActive: function () {
                            var program = $scope.getSelectedProgram();
                            if (($window.location.pathname.indexOf('/manage/authoring-suite/program/' + program.slug + '/edit') >= 0)) {
                                return ($window.location.pathname !== '/manage/authoring-suite/program/' + program.slug + '/edit');
                            }
                            return false;
                        },
                        new: false,
                        visible: function () {
                            return $scope.getSelectedProgram() != null
                        },
                        items: [
                            {
                                label: 'Activities',
                                link: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/quests';
                                    }
                                },
                                active: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        if ($window.location.pathname.indexOf('/edit/quests') != -1){
                                            $scope.clipboard.show = true;
                                            return true;
                                        }else{
                                            return false;
                                        }
                                    } else {
                                        return false;
                                    }
                                },
                                new: false
                            },
                            {
                                label: 'Levels',
                                link: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/levels';
                                    }
                                },
                                active: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        if ($window.location.pathname.indexOf('/edit/levels') != -1){
                                            return true;
                                        }else{
                                            return false;
                                        }
                                    } else {
                                        return false;
                                    }
                                },
                                new: false
                            },

                            {
                                label: 'Scoring',
                                link: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/scoring';
                                    }
                                },
                                active: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        return ($window.location.pathname.indexOf('/edit/scoring') != -1)
                                    } else {
                                        return false;
                                    }
                                },
                                new: false
                            },
                            {
                                label: $scope.getBadgeLabel(true) + 's',
                                link: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/badges';
                                    }
                                },
                                active: function () {
                                    var program = $scope.getSelectedProgram();
                                    if (program) {
                                        return ($window.location.pathname.indexOf('/edit/badges') != -1)
                                    } else {
                                        return false;
                                    }
                                },
                                new: false
                            },
                            //{
                            //    label: 'To-Do\'s',
                            //    link: function () {
                            //        var program = $scope.getSelectedProgram();
                            //        if (program) {
                            //            return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/todos';
                            //        }
                            //    },
                            //    active: function () {
                            //        var program = $scope.getSelectedProgram();
                            //        if (program) {
                            //            return ($window.location.pathname.indexOf('/edit/todos') != -1)
                            //        } else {
                            //            return false;
                            //        }
                            //    },
                            //    new: false
                            //},
                            {
                               label: 'Discussion',
                                link: function () {
                                   var program = $scope.getSelectedProgram();
                                   if (program) {
                                        return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/discussion';
                                   }
                                },
                              active: function () {
                                  var program = $scope.getSelectedProgram();
                                    if (program) {
                                       return ($window.location.pathname.indexOf('/edit/discussion') != -1)
                                   } else {
                                        return false;
                                    }
                                },
                               new: false
                            }
                            //,
                            //{
                            //    label: 'Inspiration',
                            //    link: function () {
                            //        var program = $scope.getSelectedProgram();
                            //        if (program) {
                            //            return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/inspiration';
                            //        }
                            //    },
                            //    active: function () {
                            //        var program = $scope.getSelectedProgram();
                            //        if (program) {
                            //            return ($window.location.pathname.indexOf('/edit/inspiration') != -1)
                            //        } else {
                            //            return false;
                            //        }
                            //    },
                            //    new: false
                            //}
                            //{
                            //    label: 'Activities',
                            //    link: function () {
                            //        var program = $scope.getSelectedProgram();
                            //        if (program) {
                            //            return '/manage/authoring-suite/program/' + $scope.getSelectedProgram().slug + '/edit/activities';
                            //        }
                            //    },
                            //    active: function () {
                            //        var program = $scope.getSelectedProgram();
                            //        if (program) {
                            //            return ($window.location.pathname.indexOf('/edit/activities') != -1)
                            //        } else {
                            //            return false;
                            //        }
                            //    },
                            //    new: false
                            //}
                        ]
                    }
                ]
            }
        ];

        $scope.$watch(function() {
            return $scope.getSelectedProgram()
        }, function() {
            var program = $scope.getSelectedProgram();
            if (!program) return;
            var asItem = _.find($scope.menu, function(item) { return item.label==='Authoring Suite'; });
            if (asItem)
                asItem.items[1].label = program.title;
        });

        var init = function () {
            if ($window.location.pathname.indexOf('authoring-suite') >= 0) $scope.activeTab = 'AuthoringSuite';
            else $scope.activeTab = 'AuthoringSuite';
        };
        init();

        $scope.toggleItem = function (e, item) {
            e.preventDefault();
            if (item.expanded && !item.active && item.link) {
                $window.location = item.link;
                return;
            }
            item.expanded = !item.expanded;
        };

        $scope.canAdmin = function () {
            return authService.canAdmin();
        };
    }]);
