'use strict';

var filters = angular.module('Jubi.filters', []);
var controllers = angular.module('Jubi.controllers', ['ngAudio', 'com.2fdevs.videogular', 'ngQuill']);
var directives = angular.module('Jubi.directives', []);
var services = angular.module('Jubi.services', []);

services.factory(helperServiceObj);
services.factory(authServiceObj);
services.factory(controllerStateObj);
directives.directive(autoResizerObj);
directives.directive(datepickerPopupObj);
directives.directive(blinkObj);
services.factory(sessionStorageObj);
directives.directive(numberMaskObj);

var app = angular.module('Jubi', [
    'Jubi.filters',
    'Jubi.services',
    'Jubi.directives',
    'Jubi.controllers',
    'ngSanitize',
    'ngMaterial',
    'angularjs-dropdown-multiselect',
    'ui.bootstrap',
    'angularFileUpload',
    'angularSpinner',
    'ui.utils',
    'highcharts-ng',
    'com.2fdevs.videogular',
    'ngVideo',
    'ngAudio',
    'ngQuill'
]);

app.filter('pagination', function () {
    return function (input, start) {
        start = +start;
        return input.slice(start);
    };
});

//Added this for ngQuill Confid 
app.config(['ngQuillConfigProvider', function (ngQuillConfigProvider) {

    /*
     [add strikethough : 'strike']
     [add code-block : 'code-block']
     [{ 'header': 1 }, { 'header': 2 }] // custom button values
    [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
     [add code-block : 'code-block']
     */


    var toolbarOptions = [
        ['bold', 'italic', 'underline'],        // toggled buttons 

        ['blockquote'],

        [{ 'align': [] }],

        [{ 'list': 'ordered' }, { 'list': 'bullet' }],

        [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent

        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme

        ['clean']                                         // remove formatting button
    ];
    var modules = {
        toolbar: toolbarOptions
    }

    /*
    ngQuillConfigProvider.set function has following optional params.
     ngQuillConfigProvider.set(modules, theme, placeholder, formats, boundary, readOnly)
    */

    ngQuillConfigProvider.set(modules, 'bubble', ' ');
}]);


controllers.controller('RootController', ['$scope', '$q', '$http', '$timeout', '$window', 'authService', 'helperService', '$modal', 'sessionStorageService', '$rootScope', 'controllerState',
    function ($scope, $q, $http, $timeout, $window, authService, helperService, $modal, sessionStorageService, $rootScope, controllerState) {

        //click outside of nav will close the nav drop down.
        $('body').bind('click', function (e) {

            if ($(e.target).closest('#profileDropNav').length != 0) {
                // click happened outside of menu, hide any visible menu items

            }
            if ($(e.target).closest('#profileDropNav').length == 0) {
                // click happened outside of menu, hide any visible menu items
                if ($('.right-profiledetails ul li ul.dropdown').hasClass('open')) {
                    $('.right-profiledetails ul li ul.dropdown').hide().removeClass('open');
                }
            }
            if ($(e.target).closest('#mobDropSubNav').length != 0) {
                // click happened outside of menu, hide any visible menu items

            }
            if ($(e.target).closest('#mobDropSubNav').length == 0) {
                // click happened outside of menu, hide any visible menu items
                if ($('.quest_mobile_menu li ul.dropdown').hasClass('open')) {
                    $('.quest_mobile_menu li ul.dropdown').hide().removeClass('open');
                }
            }
            if ($(e.target).closest('#actionDrop').length == 0) {
                // click happened outside of menu, hide any visible menu items
                if ($('div.program-menu li.drop ul.drop-menu').hasClass('show')) {
                    $('div.program-menu li.drop ul.drop-menu').hide().removeClass('show');
                }
            }

            //$('div.program-menu li.drop ul.drop-menu').hide().removeClass('show');
        });



        $scope.loading = {
            isLoading: 0
        };

        $scope.userId = authService.user.id;
        $scope.buddyLabel = authService.user.clients[0].buddyLabel;
        $scope.badgeLabel = authService.user.clients[0].badgeLabel;
        $scope.logoLeft = authService.user.clients[0].logoAlignment == 'left';
        $scope.logoCenter = authService.user.clients[0].logoAlignment == 'center';

        //todo usermedia modaal


        $scope.getBuddyLabel = function (camel) {
            if ($scope.buddyLabel) {
                if (camel) {
                    return $scope.buddyLabel.charAt(0).toUpperCase() + $scope.buddyLabel.slice(1);
                }
                return $scope.buddyLabel;
            } else {
                if (camel) {
                    return 'Buddy';
                }
                return 'buddy'
            }
        };

        $scope.getBadgeLabel = function (camel) {
            if ($scope.badgeLabel) {
                if (camel) {
                    return $scope.badgeLabel.charAt(0).toUpperCase() + $scope.badgeLabel.slice(1);
                }
                return $scope.badgeLabel;
            } else {
                if (camel) {
                    return 'Badge';
                }
                return 'badge'
            }
        };

        $scope.today = helperService.roundDate(new Date());

        $scope.checkEncoding = function (media) {
            if (media.url) {
                $http.get(authService.apiUrl + '/uv/encoded?url=' + media.url)
                    .success(function (result) {
                        if (result.encodings.length <= 0) return $timeout(function () {
                            $scope.checkEncoding(media);
                        }, 1000);
                        media.encodings = result.encodings;
                    });
            }
        };

        //IF the inner width is above our ipad screen mediq query, show the menu by default on pageload
        //otherwise hide the side menu's
        $scope.toggle = {
            isBodySmall: false,
            asideNav: $window.innerWidth > 993 ? false : true
        };
        $scope.model = null;
        $scope.window = $window;
        $scope.preview = null;
        $scope.previewRet = null;
        $scope.programs = [];
        $scope.programsComplete = 0;
        $scope.programPoints = null;

        $scope.program = null;

        $scope.goToProgram = function (program) {
            var url = '/user/program/' + program.slug + '/quests';
            if ($scope.preview) url += '?preview=' + $scope.preview;
            if ($scope.previewRet) url += '&previewRet=' + $scope.previewRet;

            $window.location = url;
        };

        $scope.setTileHeight = function (height) {
            $scope.tileHeight = height;
        };

        $scope.getTileHeight = function () {
            return $scope.tileHeight;
        };

        $scope.getHeightStyle = function () {
            return {
                "height": $scope.getTileHeight() + 'px'
            }
        };

        $scope.getHeaderClass = function () {
            if ($window.innerWidth < 400) {
                $scope.headerClass = 'col-xs-12'
            } else {
                $scope.headerClass = null;
            }
        };

        $scope.allCompletedQuests = function () {
            if ($scope.program) {
                if (!$scope.allQuests) {
                    $scope.allQuests = $scope.program.quests;
                    _.each($scope.program.levels, function (level) {
                        _.each(level.quests, function (quest) {
                            $scope.allQuests.push(quest);
                        })
                    });
                }

                return _.filter($scope.allQuests, function (quest) {
                    return quest.challengesComplete > 0;
                });
            }
        };

        $scope.playerReady = function (media, api) {
            media.api = api;

        };

        this.init = function (slug) {
            $scope.logoUrl = authService.user.clients[0].logoImageUrl;
            if (slug) {
                var url = authService.apiUrl + '/program-detail/' + slug + '/user';
            } else {
                var url = authService.apiUrl + '/programs/user';
            }

            $scope.previewRet = helperService.getQueryValue('previewRet');
            $scope.previewRetHash = helperService.getQueryValue('previewRetHash');

            $scope.preview = helperService.getQueryValue('preview');
            if ($scope.preview) url += '?preview=yes';
            $scope.loading.isLoading++;
            $http.get(url)
                .success(function (result) {
                    $scope.programs = result.programs;
                    $scope.result = result;
                    $scope.previewRet = helperService.getQueryValue('previewRet');
                    $scope.preview = helperService.getQueryValue('preview');
                    $scope.program = null;

                    if ($scope.programs.length == 0) {
                        $scope.stopLoading();
                    } else {
                        angular.forEach($scope.programs, function (p) {
                            if (slug && p.slug == slug) {
                                var program = p;
                                $scope.program = program;
                                $scope.stopLoading();

                                //Get todos asynchrounly, they will display whenever they get back but don't need to hold up the page load
                                $http.get(authService.apiUrl + '/program/' + program.id + '/todos/buddy')
                                    .success(function (result) {
                                        $scope.todosModel.userTodos = result;
                                        if (result.length > 0 && sessionStorageService.get('userTodos') != angular.toJson($scope.todosModel.userTodos)) {
                                            sessionStorageService.set('userTodos', angular.toJson($scope.todosModel.userTodos));
                                            if (!$scope.preview) {
                                                $scope.showPendingTodos();
                                            }

                                        }

                                        _.each($scope.todosModel.userTodos, function (userTodo) {
                                            $scope.formatTodoMedia(userTodo);
                                        });
                                    });

                                //Get the forum with the categories for user in the inspiration triggers and also the discussion page
                                var prepForum = function (program) {
                                    return $q(function (resolve, reject) {
                                        if (program.forum) return resolve(program.forum);
                                        $http.post(authService.apiUrl + '/forum/create', { programLinkId: program.linkId })
                                            .success(function (forum) {
                                                resolve(forum);
                                            }).error(reject);
                                    })
                                };
                                prepForum(program).then(function (results) {
                                    program.forum = results;

                                    $rootScope.updatePointAwardValuesToConsiderMax();


                                    $q.all([
                                        $http.get(authService.apiUrl + '/program/' + program.id + '/network-users/' + program.linkId),
                                        $http.get(authService.apiUrl + '/forum/' + program.forum.id + '/categories'),
                                        $http.get(authService.apiUrl + '/authoring/configurations'),
                                        $http.get(authService.apiUrl + '/program-user-groups/' + program.linkId),
                                        $http.get(authService.apiUrl + '/programs-simple/user/')

                                    ]).then(function (results) {
                                        $rootScope.networkUsers = results[0].data;
                                        $rootScope.forumCategories = results[1].data;
                                        $rootScope.userGroups = results[3].data;

                                        results[4].data.programs = _.without(results[4].data.programs, _.find(results[4].data.programs, function (pr) {
                                            return pr.linkId == $scope.program.linkId;
                                        }));
                                        _.each(results[4].data.programs, function (program) {
                                            $scope.programs.unshift(program);
                                        });

                                        _.each($rootScope.networkUsers, function (nu) {
                                            $rootScope.formatNetworkUser(nu);
                                        });

                                        _.each($rootScope.userGroups, function (g) {
                                            $rootScope.formatUserGroup(g);
                                        });

                                        $scope.parseConfigurations(results[2].data);
                                    })
                                })
                            }
                            else if (!slug) {
                                $scope.stopLoading();
                            }
                            p.userTodos = p.userTodos.reverse();
                            angular.forEach(p.userTodos, function (userTodo) {
                                $scope.formatTodoMedia(userTodo);
                                if (userTodo.status == 'unlocked' || userTodo.status == 'verified') {
                                    userTodo.blink = true;
                                }
                            });
                        });
                    }

                    //get all challenge id from quest in this program.
                    //if ($scope.program.levels) {
                    //    console.log("Program name: " + $scope.program.title);
                    //    _.each($scope.program.levels, function (level) {
                    //        console.log("Level: " + level.sequence);
                    //        _.each(level.quests, function (quest) {
                    //            console.log("Quest name: " + quest.title);
                    //            _.each(quest.challenges, function (ch) {
                    //                console.log("challenge id: " + ch.id);
                    //            })
                    //        })
                    //    })

                    //} else {
                    //    console.log("Program name: " + $scope.program.title);
                    //    _.each($scope.program.quests, function (quest) {
                    //        console.log("Quest name: " + quest.title);
                    //        _.each(quest.challenges, function (ch) {
                    //            console.log("challenge id: " + ch.id);

                    //        })


                    //    })
                    //}


                })//end of success after api
        };

        $rootScope.updatePointAwardValuesToConsiderMax = function () {
            if ($scope.program.forum.newCommentPointsMax && ($scope.result.discussionScore.newCommentPoints + $scope.program.forum.newCommentPoints) > $scope.program.forum.newCommentPointsMax) {
                //Setting to 0 so the rest of the app doesn't have to worry about the max, if it has been hit then any added points will be 0 so no effect
                $scope.program.forum.newCommentPoints = 0;
            }
            if ($scope.program.forum.newEncouragePointsMax && ($scope.result.discussionScore.newEncouragePoints + $scope.program.forum.newEncouragePoints) > $scope.program.forum.newEncouragePointsMax) {
                //Setting to 0 so the rest of the app doesn't have to worry about the max, if it has been hit then any added points will be 0 so no effect
                $scope.program.forum.newEncouragePoints = 0;
            }
            if ($scope.program.forum.newAppreciatePointsMax && ($scope.result.discussionScore.newAppreciatePoints + $scope.program.forum.newAppreciatePoints) > $scope.program.forum.newAppreciatePointsMax) {
                //Setting to 0 so the rest of the app doesn't have to worry about the max, if it has been hit then any added points will be 0 so no effect
                $scope.program.forum.newAppreciatePoints = 0;
            }
            if ($scope.program.forum.newStoryPoints && ($scope.result.discussionScore.newStoryPoints + $scope.program.forum.newStoryPoints) > $scope.program.forum.newStoryPoints) {
                //Setting to 0 so the rest of the app doesn't have to worry about the max, if it has been hit then any added points will be 0 so no effect
                $scope.program.forum.newStoryPoints = 0;
            }
        };

        $rootScope.inspirationHelpTexts = {
            encourageDescription: {
                key: 'INSPIRATION-ENCOURAGE-HELP-TEXT',
                value: null
            },
            appreciateDescription: {
                key: 'INSPIRATION-APPRECIATE-HELP-TEXT',
                value: null
            },
            storyDescription: {
                key: 'INSPIRATION-STORY-HELP-TEXT',
                value: null
            }
        };

        $scope.parseConfigurations = function (configs) {
            _.each(configs, function (config) {
                switch (config.key) {
                    case $rootScope.inspirationHelpTexts.encourageDescription.key:
                        $rootScope.inspirationHelpTexts.encourageDescription.value = config.value;
                        break;
                    case $rootScope.inspirationHelpTexts.appreciateDescription.key:
                        $rootScope.inspirationHelpTexts.appreciateDescription.value = config.value;
                        break;
                    case $rootScope.inspirationHelpTexts.storyDescription.key:
                        $rootScope.inspirationHelpTexts.storyDescription.value = config.value;
                        break;
                }
            });
        };

        $rootScope.setSelectedTodo = function (userTodo, asBuddy) {
            if (!userTodo.saveInProgress) {
                userTodo.blink = false;
                $scope.selectedUserTodo = userTodo;
                if (asBuddy) {
                    $scope.todosModel.isBuddyValidating = true;
                } else {
                    $scope.todosModel.isBuddyValidating = false;
                }
                $scope.openTodoModal = $modal.open({
                    templateUrl: 'todoModal.html',
                    size: 'lg',
                    scope: $scope,
                });
            }
        };

        $scope.programsHaveTodos = function () {
            var hasTodo = false;
            _.each($scope.programs, function (program) {
                _.each(program.userTodos, function (userTodo) {
                    hasTodo = true;
                })
            });
            return hasTodo;
        };

        $scope.todosModel = {
            isBuddyValidating: false,
            userTodos: null
        };

        $rootScope.closeTodoModal = function () {
            if ($scope.openTodoModal) {
                $scope.openTodoModal.close();
            }
        };

        $scope.showPendingTodos = function () {
            if ($scope.todosModel.userTodos) {
                var submittedTodo = _.findWhere($scope.todosModel.userTodos, { status: 'submitted' });
                if (submittedTodo) {
                    $modal.open({
                        templateUrl: 'pendingTodos.html',
                        scope: $scope,
                        controller: infoModalControllerObj.infoModalController,
                        size: 'md',
                        resolve: {
                            initData: function () {
                                return {
                                    ok: 'Close'
                                }
                            }
                        }
                    })
                }
            }
        };

        $scope.formatTodoMedia = function (userTodo) {
            angular.forEach(userTodo.todo.challenges, function (challenge) {
                challenge.displayLimit = 2;
                if (challenge.title == 'Todo Media Upload') {
                    userTodo.todo.mediaChallenge = challenge;

                    _.each(userTodo.todo.mediaChallenge.userMedia, function (media) {
                        if (media.type == 'video') $scope.checkEncoding(media);
                    })
                } else if (challenge.title == 'Todo Feedback') {
                    userTodo.todo.feedbackChallenge = challenge;
                }
            });
        };

        $rootScope.updateTodos = function (oldUserTodo, newUserTodo) {
            $scope.formatTodoMedia(newUserTodo);

            $rootScope.$emit('userTodoUpdated', { oldUserTodo: oldUserTodo, newUserTodo: newUserTodo });

            var program = _.findWhere($scope.programs, { id: oldUserTodo.todo.programId });
            var todoToReplace = _.findWhere(program.userTodos, { id: oldUserTodo.id });

            if (program.userTodos.indexOf(oldUserTodo) != -1) {
                program.userTodos.splice(program.userTodos.indexOf(todoToReplace), 1, newUserTodo);
            }
        };


        $scope.stopLoading = function () {
            if ($scope.loading.isLoading > 0) {
                $scope.loading.isLoading--;
            }

            if ($scope.loading.isLoading == 0) {
                //Doing this 3 times here because it has no bad side effects and it needs to happen as soon as possible,
                //But some browsers it will be too soon to recognize so we do it again after a second, and then again after another second
                $scope.getCanvasHeight();
                $timeout(function () {
                    $scope.getCanvasHeight();
                    $timeout(function () {
                        $scope.getCanvasHeight();
                    }, 1000)
                }, 1000)
            }
        };

        $scope.canManage = function () {
            return authService.canManage();
        };

        $scope.goToManage = function (e) {
            e.preventDefault();

            var url = '/manage/authoring-suite/program/' + $scope.program.slug + '/edit';
            if ($scope.previewRet) url += '#' + $scope.previewRet;

            $window.location = url;
        };

        $scope.canAdmin = function () {
            return authService.canAdmin();
        };

        //Sets the calculated height of the canvas
        $scope.getCanvasHeight = function (noToggleAsideNav) {
            var height;
            var topNavBar = $('#topNavBar');
            var footerBar = $('#footerBar');
            var headerBar = $('#headerBar');
            height = $window.innerHeight;

            if (footerBar[0]) {
                height -= footerBar.outerHeight(true);
            }
            if (headerBar[0]) {
                height -= headerBar.outerHeight(true);
            }

            $scope.canvasHeightNoTopNav = height;

            if (topNavBar[0] && !topNavBar[0].offsetLeft && ($scope.toggle.asideNav || $window.innerWidth > 993)) {
                height -= topNavBar.outerHeight(true);
            }

            if (!noToggleAsideNav) {
                if ($window.innerWidth > 993) {
                    $scope.toggle.asideNav = false;
                } else {
                    $scope.toggle.asideNav = true;
                }
            }

            $scope.canvasHeight = height;
        };

        //$scope.closeMenuIfSmallScreen = function () {
        //    if (!$scope.toggle.asideNav) {
        //        if ($window.innerWidth < 993) {
        //            $scope.toggle.asideNav = true;
        //        }
        //    }
        //};

        //Ensures that angular recacuates the canvas height on window resize, can't use watch for resize events
        //angular.element(window).on('resize', function () {
        //    $scope.$apply(function () {
        //        $scope.getCanvasHeight();
        //        $scope.getHeaderClass();
        //    })
        //});

        $scope.adjustHeightAfterTimeout = function () {
            $timeout(function () {
                $scope.getCanvasHeight(true)
            }, 500)
        };

        $scope.goToUserProfile = function () {
            if ($scope.program) {
                $window.location = '/user/program/' + $scope.program.slug + '/network-profile/' + authService.user.id;
            }
        };


        $rootScope.openInspireModal = function (id) {
            if ($rootScope.networkUsers) {
                $scope.inspireModal = $modal.open({
                    templateUrl: id,
                    scope: $scope,
                    size: 'md',
                    resolve: {
                        initData: function () {
                            return {}
                        }
                    }
                })
            }
        };

        $rootScope.closeInspireModal = function () {
            if ($scope.inspireModal) {
                $scope.inspireModal.close();
            }
        };


        $scope.getCurrentBonusPointsAvailable = function () {
            if ($scope.program) {
                var bucket = $scope.getBonusPointsBucket();
                var points = bucket - $scope.program.score.bonusPointsUsed;
                if (points > 0) return points; else return 0;
            } else {
                return 0;
            }
        };

        $scope.getBonusPointsBucket = function () {
            if ($scope.program) {
                return isNaN($scope.program.userBonusPointsBucket) ? 0 : $scope.program.userBonusPointsBucket;
            } else {
                return 0;
            }
        };

        //Using this to allow an element to focus itself after it's focus was stolen, for instance a datepicker opening steal focus from the input
        //So we call this after we open the picker to set the focus back, the timeouts give the element stealing focus some cycles to finish stealing in
        //before we set it back
        $scope.focusMe = function (e) {
            $timeout(function () {
                $timeout(function () {
                    e.currentTarget.focus();
                });
            });
        };

        $rootScope.showCreateUserGroup = function (users) {
            $scope.usersPendingGroupCreation = users;
            $scope.userGroupModal = $modal.open({
                templateUrl: 'createUserGroup.html',
                scope: $scope,
                controller: infoModalControllerObj.infoModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            ok: 'Close'
                        }
                    }
                }
            })
        };

        $rootScope.closeCreateUserGroupModal = function () {
            $scope.usersPendingGroupCreation = null;
            if ($scope.userGroupModal) {
                $scope.userGroupModal.close();
            }
        };

        $rootScope.formatUserGroup = function (userGroup) {
            userGroup.label = userGroup.name;
            userGroup.user = { id: null };
            userGroup.type = 'User Groups';
            userGroup.isGroup = true;
            userGroup.tooltip = '';
            _.each(userGroup.programUsers, function (groupUser, i) {
                groupUser.programUser.user.selected = false;
                groupUser.programUser.user.userId = groupUser.programUser.user.id;
            })
            _.each(userGroup.programUsers, function (groupUser, i) {
                userGroup.tooltip += (groupUser.programUser.user.firstName + ' ' + groupUser.programUser.user.lastName + (i < userGroup.programUsers.length - 1 ? ', ' : ' '));
            })
        };

        $rootScope.formatNetworkUser = function (networkUser) {
            networkUser.label = networkUser.user.firstName + ' ' + networkUser.user.lastName;
        };

        $rootScope.$on('userGroupAdded', function (e, item) {
            $rootScope.formatUserGroup(item);
            $rootScope.userGroups.push(item);
        });

        $rootScope.$on('userGroupRemoved', function (e, item) {
            var groups = _.filter($rootScope.userGroups, function (user) {
                return user.isGroup == true && user.id == item.id;
            });
            _.each(groups, function (group) {
                $rootScope.userGroups = _.without($rootScope.userGroups, group);
            });
        });

        $scope.manageButton = {
            hovered: false
        };

        $scope.programSelector = {
            hovered: false
        };

        $scope.getHeaderCustomStyle = function (program) {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': program && program.hovered ? ColorLuminance(authService.user.clients[0].headerColor, -.2) : authService.user.clients[0].headerColor,
                    'color': authService.user.clients[0].headerFontColor,
                    'opacity': 1
                }
            }
        };

        $scope.getSubHeaderCustomStyle = function (program) {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background-color': '#ADADAD',
                    'opacity': 1
                }
            }
        };
        $scope.getSubNavDrop = function (program) {
            if (authService.user.clients[0].headerColor) {
                return {
                    // 'background-color': '#939393',
                    'opacity': 1


                }
            }
        };

        function ColorLuminance(hex, lum) {
            if (hex) {
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


        $scope.buttons = [
            { id: 'Program Selector', hovered: false },
            { id: 'Manage', hovered: false },
            { id: 'Expand', hovered: false }
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
        };

        $scope.getButtonCustomStyle = function (button) {
            if (authService.user.clients[0].headerColor) {
                var backgroundColor = authService.user.clients[0].headerColor;
                var color = authService.user.clients[0].headerFontColor;

                if (button == 'Program Selector' && $scope.buttons[0].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.1);
                } else if (button == 'Manage' && $scope.buttons[1].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.2);
                } else if (button == 'Manage' && !$scope.buttons[1].hovered) {
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.1);
                } else if (button == 'Expand' && $scope.buttons[2].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.1);
                }

                return {
                    'background': backgroundColor,
                    'color': color,
                    'opacity': 1
                }
            }
        };


        $scope.getProgramSelectorStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': $scope.buttons[1].hovered || $scope.buttons[0].hovered || $scope.buttons[2].hovered ? ColorLuminance(authService.user.clients[0].headerColor, -.1) : authService.user.clients[0].headerColor,
                    'color': authService.user.clients[0].headerFontColor,
                    'opacity': 1
                }
            }
        };

        $scope.getProgramButtonStyle = function (program) {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': program.hovered ? ColorLuminance(authService.user.clients[0].headerColor, -.2) : ColorLuminance(authService.user.clients[0].headerColor, -.1),
                    'color': program.hovered ? ColorLuminance(authService.user.clients[0].headerFontColor, .3) : authService.user.clients[0].headerFontColor,
                    'opacity': 1
                }
            }
        };

        //height was set to $scope.canvasHeight + 'px', now set to 
        $scope.getMainCanvasStyle = function () {
            if ($scope.canvasHeight) {
                var style = {
                    'overflow-y': 'auto',
                    //'height': $scope.canvasHeight + 'px',
                    'max-height': '100%',
                    'padding': '0px 0px 40px 0px',
                    'width': '100%',
                    'overflow-x': 'hidden'


                }
            } else {
                var style = {
                    'overflow-y': 'hidden',

                    'width': '100%',
                    'overflow-x': 'hidden'
                }
            }

            if (authService.user.clients[0].backgroundColor) {
                style.backgroundColor = authService.user.clients[0].backgroundColor;
                style.background = authService.user.clients[0].backgroundColor;
            } else {
                style.backgroundColor = '-webkit-linear-gradient(90deg, #465876, #28354D)';//516585
                style.background = '-webkit-linear-gradient(90deg, #465876, #28354D)';
                style.backgroundColor = 'linear-gradient(to bottom, rgb(70, 88, 118), rgb(40, 53, 77))';//rgb(81, 101, 133)
                style.background = 'linear-gradient(to bottom, rgb(70, 88, 118), rgb(40, 53, 77))';
            }

            return style;
        };


        $scope.getBackgroundFontStyle = function () {
            if (authService.user.clients[0].backgroundFontColor) {
                return {
                    'color': authService.user.clients[0].backgroundFontColor
                }
            } else {
                return {
                    'color': '#fff'
                }
            }
        };

        $scope.getBackgroundFontColor = function () {
            if (authService.user.clients[0].backgroundFontColor) {
                return authService.user.clients[0].backgroundFontColor

            } else {
                return '#fff'
            }
        };

        $scope.getLinkFontColor = function () {
            if (authService.user.clients[0].backgroundFontColor) {
                return authService.user.clients[0].backgroundFontColor;
            } else {
                //return '#16cfd7';
                return '#31adf8';
            }
        };

        $scope.navToggle = function () {

            //$('.right-profiledetails ul li ul.dropdown').toggle();
            if ($('.right-profiledetails ul li ul.dropdown').hasClass('open')) {
                $('.right-profiledetails ul li ul.dropdown').hide().removeClass('open');
            } else {
                $('.right-profiledetails ul li ul.dropdown').show().addClass('open');
            }

        };


        $scope.flipPanel = function (event, index, type) {
            event.stopPropagation();

            var ind = index;
            var t = type;

            if (type == 'L') {
                //console.log($('.row1 .Learn_tile' + '.L'+ ind).toggleClass('flipped'));
                $('.rowNoLevel .Learn_tile' + '.L' + ind).toggleClass('flipped');


            }
            if (type == 'T') {
                //console.log($('.row1 .Do_tile' + '.T'+ ind).toggleClass('flipped'));
                $('.rowNoLevel .Do_tile' + '.T' + ind).toggleClass('flipped');

            }

            if (type == 'I') {
                //console.log($('.row1 .Inspire_tile' + '.I'+ ind).toggleClass('flipped'));
                $('.rowNoLevel .Inspire_tile' + '.I' + ind).toggleClass('flipped');

            }

            // console.log($('.row1 .Learn_tile' + '.t' + ind));
            // $('.row1 .Learn_tile').toggleClass('flipped');

        };

        $scope.flipLevelPanel = function (event, index, type, level) {
            event.stopPropagation();
            var ind = index;
            var lev = level;
            var t = type;

            if (type == 'L') {
                $('.row1 .Learn_tile' + '.l' + lev + '.L' + ind).toggleClass('flipped');

            }
            if (type == 'T') {
                $('.row1 .Do_tile' + '.l' + lev + '.T' + ind).toggleClass('flipped');

            }
            if (type == 'I') {
                $('.row1 .Inspire_tile' + '.l' + lev + '.I' + ind).toggleClass('flipped');

            }

            // console.log($('.row1 .Learn_tile' + '.t' + ind));
            // $('.row1 .Learn_tile').toggleClass('flipped');
        };




    }]);