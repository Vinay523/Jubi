'use strict';

var filters = angular.module('Jubi.filters', []);
var controllers = angular.module('Jubi.controllers', ['ngQuill']);
var directives = angular.module('Jubi.directives', []);
var services = angular.module('Jubi.services', []);

services.factory(authServiceObj);
services.factory(helperServiceObj);
services.factory(controllerStateObj);
directives.directive(autoResizerObj);
directives.directive(numberMaskObj);
directives.directive(dndNoDropObj);
directives.directive(datepickerPopupObj);

var app = angular.module('Jubi', [
    'Jubi.filters',
    'Jubi.services',
    'Jubi.directives',
    'Jubi.controllers',
    'ui.bootstrap',
    'ngSanitize',
    'angularSpinner',
    'dndLists',
    'ui.utils',
    'angularFileUpload',
    'textAngular',
    'ngVideo',
    'ngAudio',
    
]);

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

    ngQuillConfigProvider.set(modules, null, 'Insert your text here');
}]);

controllers.controller('RootController', ['$scope', '$http', '$timeout', '$modal', '$window', 'authService', '$interval', '$q', 'helperService',
    function ($scope, $http, $timeout, $modal, $window, authService, $interval, $q, helperService) {
        this.initState = function (interval) {
            $scope.autoSaveInterval = Number(interval) * 60 * 1000;
            $interval(broadcastAutoSave, $scope.autoSaveInterval);
            $scope.logoUrl = authService.user.clients[0].logoImageUrl;
            $scope.buddyLabel = authService.user.clients[0].buddyLabel;
            $scope.badgeLabel = authService.user.clients[0].badgeLabel;
            $scope.logoLeft = authService.user.clients[0].logoAlignment == 'left';
            $scope.logoCenter = authService.user.clients[0].logoAlignment == 'center';
        };

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

        $scope.loading = {
            isLoading: 0
        };

        $scope.today = helperService.roundDate(new Date());

        $scope.selectedProgram = null;
        $scope.toggle = {
            isBodySmall: false,
            asideNav: false
        };
        $scope.selectedProgram = null;

        $scope.setSelectedProgram = function (program) {
            sessionStorage.setItem('selectedProgram', angular.toJson(program));
            $scope.selectedProgram = program;
        };

        $scope.removeSelectedProgram = function () {
            sessionStorage.removeItem('selectedProgram');
        };

        $scope.hasPublishedProgram = function (program) {
            if (!program) return false;
            return _.find(program.history, function (history) {
                return history.published && !history.status != 'preview';
            })
        };

        $scope.previewProgramTiles = function (e) {
            e.preventDefault();
            e.stopPropagation();
            $scope.$broadcast('previewProgramTiles');
        };

        $scope.getSelectedProgram = function () {
            if (!$scope.selectedProgram) {
                var programJson = sessionStorage.getItem('selectedProgram');
                if (programJson) {
                    $scope.selectedProgram = angular.fromJson(programJson);
                    return $scope.program;
                } else {
                    return null
                }
            } else {
                return $scope.selectedProgram;
            }
        };

        $scope.cleanupProgramVersions = function (linkId) {
            $scope.loading.isLoading++;
            $http.post(authService.apiUrl + '/programs/' + linkId + '/version-cleanup')
                .success(function (result) {
                    $window.location.reload();
                })
                .error(function (err) {
                    console.log(err);
                });
        };

        $scope.promptCleanupVersions = function (linkId) {
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Cleanup Program Versions?',
                            text: 'You are about to cleanup program versions. This action will remove all but the last 3 major versions. Any versions with active licenses will also be kept. Are you sure you want to continue?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $scope.cleanupProgramVersions(linkId);
                });
        };

        $scope.canPromptUnlock = function(program){
            if (program && !program.cancelMigrateResultsOnPublish &&
                !(window.location.href.indexOf('/authoring-suite/program/') != 0
                && (window.location.href.indexOf('/edit') == (window.location.href.length - 5)
                || window.location.href.indexOf('/edit/') == (window.location.href.length - 6)))) {
                return true;
            }else {
                return false;
            }
        };

        $scope.promptUnlockProgram = function (program, form) {
           if(program && $scope.canPromptUnlock(program)){
               $scope.promptUnlockProgramThen(function(){
                   program.cancelMigrateResultsOnPublish = true;
                   form.$setDirty();
               })
            }
        };

        $scope.promptUnlockProgramThen = function(callback){
            $modal.open({
                templateUrl: 'confirmModalError.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'ENTER RESET MODE',
                            text: 'Entering RESET MODE will allow editing of all previously published content.  All user progress, data,' +
                            ' and discussion forum content will be reset the next time you publish this program.' +
                            '  Are you sure you want to continue?',
                            okLabel: 'OK',
                            cancelLabel: 'Cancel'
                        }
                    }
                }
            }).result.then(
                function () {
                    $modal.open({
                        templateUrl: 'confirmModalError.html',
                        controller: confirmModalControllerObj.confirmModalController,
                        size: 'sm',
                        resolve: {
                            initData: function () {
                                return {
                                    title: 'ARE YOU ABSOLUTELY SURE?',
                                    text: 'By clicking OK you will enter RESET MODE.  All user progress, data, and discussion forum content will be reset the next time you publish this program.' +
                                    '  Are you sure you want to continue?',
                                    okLabel: 'OK',
                                    cancelLabel: 'Cancel'
                                }
                            }
                        }
                    }).result.then(
                        function () {
                            callback();
                        });
                });
        };

        $scope.getEntityHandleColor = function (entity, program) {
            if (helperService.canEditEntity(entity, program)) {
                return'green';
            } else {
                return 'inherit'
            }
        };

        $scope.getEntityHandleColorForLevel = function(level, program){
            var canEditLevel = true;
            _.each(level.quests, function(quest){
                if(!helperService.canEditEntity(quest, program)){
                    canEditLevel = false;
                }
            });

            if(!canEditLevel){
                return 'inherit';
            }else{
                return 'green';
            }
        };

        $scope.cancelEvent = function (event) {
            event.preventDefault();
            event.stopPropagation();

            $modal.open({
                templateUrl: 'infoModalError.html',
                controller: infoModalControllerObj.infoModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'ACTION NOT ALLOWED',
                            text: 'The previous action cannot be completed because the program is in Add-On Mode.' +
                            ' In Add-On Mode the existing program structure cannot be altered.',
                            okLabel: 'OK'
                        }
                    }
                }
            });

            return;
        };

        $scope.getQuestIndexInProgram = function (quest, program) {
            return program.quests.indexOf(quest);
        };

        $scope.getQuestIndexInLevel = function (quest, program) {
            var level = _.findWhere(program.levels, {id: Number(quest.levelId)});
            if (level) {
                return level.quests.indexOf(quest);
            }
        };

        $scope.getChallengeMediaCount = function (challenge) {
            var mediaCount = 0;
            if (challenge.type == 'finish') {
                if (challenge.media[0].link) {
                    mediaCount++;
                }
                if (challenge.media[1].url) {
                    mediaCount++
                }
            }
            else {
                mediaCount = challenge.media.length;
            }
            return mediaCount;
        };

        $scope.programHasQuests = function (program) {
            var hasQuests = false;
            if (program) {
                if (program.quests.length > 0) {
                    hasQuests = true;
                } else if (program.levels.length > 0) {
                    _.each(program.levels, function (level) {
                        if (level.quests.length > 0) {
                            hasQuests = true;
                        }
                    });
                }
            }
            return hasQuests;
        };

        $scope.isFunction = function (obj) {
            return (obj instanceof Function)
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

        $scope.sequencingTypeSet = function (item) {
            if (!item.sequencingParameters && item.sequencingTypeId == $scope.sequencingTypes.interval.id) {
                item.sequencingParameters = {
                    intervalStartTypeId: 1,
                    startDate: new Date(),
                    intervalPeriod: 'Hour',
                    interval: null
                }
            }
        };

        $scope.sequencingTypes = helperService.sequencingTypes;
        $scope.intervalStartTypes = helperService.sequencingTypeIntervalStartTypes;

        $scope.intervalStartTypesForProgramSelect = [
            {
                name: 'At Program Start',
                id: $scope.intervalStartTypes.onStartDate.id
            },
            {
                name: 'On a Specific Date',
                id: $scope.intervalStartTypes.onSpecificDate.id
            }
        ];

        $scope.intervalStartTypesForLevelSelect = [
            {
                name: 'On Level Start',
                id: $scope.intervalStartTypes.onStartDate.id
            },
            {
                name: 'On Specific Date',
                id: $scope.intervalStartTypes.onSpecificDate.id
            }
        ];

        // Question Type Codes
        $scope.questionTypes = helperService.questionTypes;

        $scope.toHtml = function (text) {
            return text.replace(/\n/g, '<br>');
        };

        $scope.stopLoading = function () {
            if ($scope.loading.isLoading > 0) {
                $scope.loading.isLoading--;
            }
        };

        var broadcastAutoSave = function () {
            $scope.$broadcast('autoSaveNow');
        };

        $scope.setTimeToMidnight = function (sequencingParamaters) {
            sequencingParamaters.startDate = new Date(sequencingParamaters.startDate.setHours(0, 0, 0, 0));
        };

        $scope.autoSave = function (program) {
            var programCopy = angular.copy(program);

            //Prevents autosave from saving interval start date if it isn't being used, don't want to do this to the actual program until save time
            //in case the user switched back to specific date
            if (programCopy.sequencingParameters && programCopy.sequencingParameters.intervalStartTypeId == helperService.sequencingTypeIntervalStartTypes.onStartDate.id) {
                programCopy.sequencingParameters.startDate = null;
            }
            _.each(programCopy.levels, function (level) {
                if (level.sequencingParameters && level.sequencingParameters.intervalStartTypeId == helperService.sequencingTypeIntervalStartTypes.onStartDate.id) {
                    level.sequencingParameters.startDate = null;
                }
            });

            programCopy.status = 'autoSaved';
            programCopy.published = null;
            return $q(function (resolve, reject) {
                $http.post(authService.apiUrl + '/programs/', programCopy)
                    .success(function (program) {
                        resolve(program);
                    });
            });
        };

        $scope.scrollToError = function () {
            $timeout(function () {
                var elm = $('.text-danger:visible');
                if (elm.length <= 0) elm = $('.has-error:visible');
                if (elm.length <= 0) elm = $('.quest-error:visible');
                if (elm.length > 0) {
                    var bodyCanvas = $('#bodyCanvas');
                    var sidebarCanvas = $('#sidebarCanvas');

                    if (bodyCanvas[0] && $.contains(bodyCanvas[0], elm[0])) {
                        $('html,body').animate({ scrollTop: elm.offset().top - 40 }, 'slow');
                        $('#bodyCanvas').animate({scrollTop: ((($(elm).offset().top - $(elm).closest('#bodyCanvas').offset().top) + $(elm).closest('#bodyCanvas').scrollTop()) - 40)}, 'slow');
                    } else if (sidebarCanvas[0] && $.contains(sidebarCanvas[0], elm[0])) {
                        $('#sidebarCanvas').animate({scrollTop: ((($(elm).offset().top - $(elm).closest('#sidebarCanvas').offset().top) + $(elm).closest('#sidebarCanvas').scrollTop()) - 40)}, 'slow');
                    } else {
                        $('html,body').animate({scrollTop: elm.offset().top - 40}, 'slow');
                    }
                }
            }, 0);
        };

        $scope.getCanvasHeight = function () {
            $scope.canvasHeight = $window.innerHeight;
        };

        //Ensures that angular recacuates the canvas height on window resize, can't use watch for resize events
        angular.element(window).on('resize', function () {
            $scope.$apply(function () {
                $scope.getCanvasHeight();
            })
        });

        //Restore the clipboard from session storage
        var clipboard = sessionStorage.getItem('clipboard');
        $scope.clipboard = clipboard ? angular.fromJson(clipboard) : {items: []};
        $scope.clipboard.expanded = true;
        $scope.clipboard.show = false;
        $scope.clipboard.hide = true;

        $scope.$watch(function () {
            return $scope.toggle.asideNav;
        }, function () {
            if ($scope.toggle.asideNav) $scope.clipboard.hide = true;
            else $timeout(function () {
                $scope.clipboard.hide = false;
            }, 500);
        });

        $scope.clipboardDrop = function (e, index, item, external, type) {
            if (!item.title || item.title.trim().length <= 0) return null;
            item.dragItemType = type;
            var program = $scope.getSelectedProgram();

            //Generesize the item for it's new home
            if (type == 'quest') {
                if (item.type == 'T') {
                    //get associated todo and add to quest.todo
                    _.each(program.todos, function (todo) {
                        if (todo.questId == item.id) {
                            item.todo = todo;
                        }
                    });

                    item.todo.id = 0;

                    item.id = 0;
                    item.levelId = undefined;
                    item.programId = 0;
                    item.publishedAt = null;
                    item.slug = null;
                    //DO activity has todo instead of challenge in traditional sence (learN)
                    angular.forEach(item.todo.challenges, function (challenge) {
                        challenge.questId = undefined;
                        challenge.todoId = undefined;
                        challenge.id = 0;
                        challenge.slug = null;
                        challenge.publishedAt = null;
                        //reset questions ids if challenge is verification
                        if (challenge.title == 'Todo Verification') {
                            if (challenge.questions && challenge.questions.length > 0) {
                                angular.forEach(challenge.questions, function (question) {
                                    question.id = 0;
                                    question.challengeId = 0;

                                });
                            }
                        }
                        //reset media

                    })

                } else {
                    item.id = 0;
                    item.levelId = undefined;
                    item.programId = 0;
                    item.publishedAt = null;
                    item.slug = null;
                    angular.forEach(item.challenges, function (challenge) {
                        challenge.questId = undefined;
                        challenge.id = 0;
                        challenge.slug = null;
                        challenge.publishedAt = null;
                    })
                }
            } else if (type == 'challenge') {
                item.questId = undefined;
                item.id = 0;
            }

            //Give dnd time to move the item to the clipboard colection, then save it to session storate
            $timeout(function () {
                sessionStorage.setItem('clipboard', angular.toJson($scope.clipboard));
            });
            return item;
        };

        $scope.clipboardDragOver = function (event, index, type) {
            return index === $scope.clipboard.items.length;
        };

        //On moving an item update the saved clipboard in session storage
        $scope.clipboardItemMoved = function (index) {
            $scope.clipboard.items.splice(index, 1);
            sessionStorage.setItem('clipboard', angular.toJson($scope.clipboard));
        };

        $scope.removeClipboardItem = function (item) {
            $scope.clipboard.items = _.without($scope.clipboard.items, item);
            sessionStorage.setItem('clipboard', angular.toJson($scope.clipboard));
        };

        $scope.getCanvasHeight();

        $scope.getHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': authService.user.clients[0].headerColor,
                    'color': authService.user.clients[0].headerFontColor,
                    'opacity': 1
                }
            }
        };

        $scope.buttons = [
            {id: 'Expand', hovered: false},
            {id: 'Your Programs', hovered: false},
            {id: 'Preview All', hovered: false},
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
                if (button == 'Expand' && $scope.buttons[0].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.1);
                } else if (button == 'Your Programs' && $scope.buttons[1].hovered) {
                    color = ColorLuminance(authService.user.clients[0].headerFontColor, .3);
                    backgroundColor = ColorLuminance(authService.user.clients[0].headerColor, -.1);
                } else if (button == 'Preview All' && $scope.buttons[2].hovered) {
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


    }]);
