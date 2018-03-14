'use strict';

var filters = angular.module('Jubi.filters', []);
var controllers = angular.module('Jubi.controllers', ['ngQuill', 'ui.bootstrap', 'ngCookies']);
var directives = angular.module('Jubi.directives', []);
var services = angular.module('Jubi.services', []);


var app = angular.module('Jubi', [
    'Jubi.filters',
    'Jubi.services',
    'Jubi.directives',
    'Jubi.controllers',
    'ui.bootstrap',
    'angularjs-dropdown-multiselect',
    'angularSpinner',
    'dndLists',
    'ngSanitize',
    'com.2fdevs.videogular',
    'angularFileUpload',
    'ngMaterial',
    'ngMessages',
    'ngVideo',
    'ngAudio',
    'ngQuill',
    'ngCookies'
]);
// here we define our unique filter
app.filter('unique', function () {
    // we will return a function which will take in a collection
    // and a keyname
    return function (collection, keyname) {
        // we define our output and keys array;
        var output = [],
            keys = [];

        // we utilize angular's foreach function
        // this takes in our original collection and an iterator function
        angular.forEach(collection, function (item) {
            // we check to see whether our object exists
            var key = item[keyname];
            // if it's not already part of our keys array
            if (keys.indexOf(key) === -1) {
                // add it to our keys array
                keys.push(key);
                // push this item to our final output array
                output.push(item);
            }
        });
        // return our array which should be devoid of
        // any duplicates
        return output;
    };
});

services.factory(helperServiceObj);
services.factory(authServiceObj);
services.factory(controllerStateObj);

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

    ngQuillConfigProvider.set(modules, 'bubble',' '); 
}]);

app.filter('pagination', function () {
    return function (input, start) {
        start = +start;
        return input.slice(start);
    };
});

controllers.controller('RootController', ['$scope', '$q', '$http', '$timeout', '$window', 'authService', 'helperService', '$rootScope', '$modal', 'controllerState', '$upload',
    function ($scope, $q, $http, $timeout, $window, authService, helperService, $rootScope, $modal, controllerState, $upload) {
        $scope.alreadySubmitted = true;
        var currentActivityType = 'Learn';
        var file = null;
        $scope.setCurrentActivityType = function (val) {
            currentActivityType = val;
        }

        var nextQuestNum = null; //gets this at end of func so nav is easy.
        var prevQuestNum = null;
        var questWithoutLevel = false;
        var prevQuestWithoutLevel = false;

        $scope.challengeChanging = false;

        $scope.nextActivityBtnText = 'Next Activity';

        $scope.showInspireToggleGroup = false;
        $scope.addGroupName = false;
        $scope.removeGroupName = false;

        $rootScope.shareUserArry = [];
        var groupIdToggle = 0;

        var showYoutubeVideo = false;
        var showVideoPlayer = false;

        $scope.loading = {
            isLoading: 0
        };

        $scope.stopLoading = function () {
            if ($scope.loading.isLoading == 1)
                return $timeout(function () {
                    $scope.loading.isLoading--;
                }, 300);
            $scope.loading.isLoading--;
        };

        $scope.modalLoading = {
            isLoading: 0
        };
        $scope.stopModalLoading = function () {
            if ($scope.modalLoading.isLoading == 1)
                return $timeout(function () {
                    $scope.modalLoading.isLoading--;
                }, 300);
            $scope.modalLoading.isLoading--;
        };

        /* Style */
        $scope.getMainCanvasStyle = function () {
            if ($scope.canvasHeight) {
                var style = {
                    'overflow-y': 'auto',
                    //'height': $scope.canvasHeight + 'px',
                    'max-height': '100%',
                    'padding': '0px 0px 0px 0px',
                    'width': '100%',
                    'overflow-x': 'hidden',

                }
            } else {
                var style = {
                    'overflow-y': 'hidden',
                    'padding': '0px 0px 0 0px',
                    'width': '100%',
                    'overflow-x': 'hidden'
                }
            }

            if (authService.user.clients[0].backgroundColor) {
                style.backgroundColor = authService.user.clients[0].backgroundColor;
                style.background = authService.user.clients[0].backgroundColor;
            } else {
                style.backgroundColor = '-webkit-linear-gradient(90deg, #516585, #28354D)';
                style.background = '-webkit-linear-gradient(90deg, #516585, #28354D)';
            }

            return style;
        };

        $scope.getBackgroundFontColor = function () {
            if (authService.user.clients[0].backgroundFontColor) {
                return authService.user.clients[0].backgroundFontColor

            } else {
                return '#fff'
            }
        };

        $scope.buddyLabel = authService.user.clients[0].buddyLabel;
        $scope.badgeLabel = authService.user.clients[0].badgeLabel;
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
        $scope.getAOrAnPlusBadgeLabel = function () {
            if ($scope.badgeLabel) {
                var startingChar = $scope.badgeLabel.split('')[0].toUpperCase();
                if (startingChar == 'A' || startingChar == 'E' || startingChar == 'I' || startingChar == 'O' || startingChar == 'U') {
                    return 'an ' + $scope.badgeLabel;
                } else {
                    return 'a ' + $scope.badgeLabel;
                }
                return $scope.badgeLabel;
            } else {
                return 'a badge'
            }
        };

        /***************Custom CSS functions*****************************************/
        $scope.getHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': authService.user.clients[0].headerColor,
                    'color': authService.user.clients[0].headerFontColor,
                    'opacity': 1
                }
            }
        };
        $scope.getQuestPlayerHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return true;
            }
        }
        $scope.getQuestPlayerActivityHeaderCustomStyle = function () {
            if (authService.user.clients[0].headerColor) {
                return {
                    'background': '#6a7a8a'
                }
            }
        }

        $scope.getTopStyleForDiscussionCollapseButton = function () {
            var panel = $('#discussionSlideout');
            var height = panel.innerHeight() + (panel.scrollTop() * 2);
            return {
                'top': height / 2
            }
        };

        /*****Challenge navigation functions*****************************/
        $scope.canNavigateToNextChallenge = function () {
            var canNav = false;

            if ((controllerState.current == 'finish') || (controllerState.current == 'do') || (controllerState.current == 'inspire')) {

                if ($scope.isNextQuest()) { //if next quest is available, check for T and I type and lock status else continue.
                    if ($scope.nextActivity.type == 'T') {
                        if ($scope.nextActivity.isLocked && $scope.nextActivity.isLocked == true) {
                            canNav = false;
                        } else {
                            canNav = true;
                        }
                    }
                    else if ($scope.nextActivity.type == 'I') {
                        if ($scope.nextActivity.isLocked && $scope.nextActivity.isLocked == true) {
                            canNav = false;
                        } else {
                            canNav = true;
                        }
                    }
                    else {
                        //nextActivity is learn 
                        if ($scope.nextActivity.isLocked && $scope.nextActivity.isLocked == true) {
                            canNav = false;
                        } else {
                            canNav = true;
                        }
                    }
                } else {
                    canNav = false;
                    $scope.upcomingChallenge = null;

                }
                //console.log("Finish canNav: " + canNav);

            }
            else if ($scope.quest && $scope.currentChallenge && $scope.currentChallenge.result) {
                canNav = true;
            } else if ($scope.quest && controllerState.current == 'start' && $scope.quest.challenges.length > 0 && $scope.quest.challenges[0].result) {
                canNav = true;
            }
            //console.log("canNav: " + canNav);
            return canNav;
        };
        $scope.navigateToNextChallenge = function () {

            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                $scope.close();
            } else {
                if (controllerState.current == 'start') {

                    if ($scope.quest.challenges.length == 1) {
                        $scope.availablePoints = $scope.quest.challenges[0].points;
                        //  $scope.$broadcast('navToNextChallenge', $scope.currentChallenge);
                    } else {
                        $scope.setUpcomingChallenge($scope.quest.challenges[1]);
                    }


                    controllerState.go('challenge', {
                        challengeIndex: 0,
                        challenge: $scope.quest.challenges[0]
                    });
                }
                else if (controllerState.current == 'finish' || controllerState.current == 'do' || controllerState.current == 'inspire') {
                    //$scope.$broadcast('navToNextActivity', nextQuestNum);
                    if (questWithoutLevel) {
                        $scope.goToQuestFromLevel($scope.nextActivity);//refreshes the window with new location. 
                    } else {
                        $scope.goToQuest($scope.nextActivity);//refreshes the window with new location. 
                    }
                }
                else {
                    $scope.$broadcast('navToNextChallenge', $scope.currentChallenge);
                }
            }
        };

        $scope.skipBonusActivity = function () {
            if ($scope.quest && $scope.quest.baseOrBonus == 'O') {
                if ($scope.isNextQuest()) {
                    if (questWithoutLevel) {
                        $scope.goToQuestFromLevel($scope.nextActivity);//refreshes the window with new location. 
                    } else {
                        $scope.goToQuest($scope.nextActivity);//refreshes the window with new location. 
                    }
                } else {
                    $scope.close();
                }
            }
        };

        $scope.questChecker = function () {
            if ($scope.quest && $scope.quest.baseOrBonus == 'O') {
                if ($scope.quest.type == 'T') {
                    if (!$scope.quest.complete) {//todo is not complete 
                        return true;
                    } else {
                        return false;
                    }
                } else if ($scope.quest.type == 'I') {
                    if (!$scope.quest.complete) {//challenges has not been started. 
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    if ($scope.quest.challengesComplete == 0) {//challenges has not been started. 
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        };

        $scope.canNavigateToPreviousChallenge = function () {
            if ((controllerState.current == 'start') || (controllerState.current == 'do') || (controllerState.current == 'inspire')) {
                if ($scope.isPreviousQuest()) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        };
        $scope.navigateToPreviousChallenge = function () {
            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                console.log($scope.quest.challenges)
                $scope.close();
            } else {
                if (controllerState.current == 'finish') {
                    //If there is a finish challenge, we need to subtract 2 from the index to skip past it, otherwise just 1
                    if (_.find($scope.quest.challenges, function (ch) { return ch.type == 'finish' })) {
                        var offset = 2;
                    } else {
                        var offset = 1;
                    }
                    if ($scope.quest.challenges.length != 1) {
                        var lastChallenge = $scope.quest.challenges[$scope.quest.challenges.length - 1];
                        $scope.setUpcomingChallenge(lastChallenge);
                    }

                    controllerState.go('challenge', {
                        challengeIndex: $scope.quest.challenges.length - offset,
                        challenge: $scope.quest.challenges[$scope.quest.challenges.length - offset]
                    });


                } else if ($scope.quest.challenges.indexOf($scope.currentChallenge) == 0 && controllerState.current != 'start') {
                    controllerState.go('start');

                }
                else if (controllerState.current == 'start' || controllerState.current == 'do' || controllerState.current == 'inspire') {
                    if (prevQuestWithoutLevel) {
                        $scope.goToQuestFromLevel($scope.previousActivity);
                    } else {
                        $scope.goToQuest($scope.previousActivity);
                    }

                } else {
                    $scope.$broadcast('navToPreviousChallenge', $scope.currentChallenge);
                }
            }
        };

        //watcher function to detect changes to program
        $scope.$on('activityUpdated', function (e, args) {
            $scope.program = args;
            $scope.canNavigateToNextChallenge();
            $scope.canNavigateToPreviousChallenge();
            console.log('programUPDATED');
        });

        //functiont to get next quest regardless of level
        $scope.isNextQuest = function () {
            var isQuest = false;
            var noOfQuest = null;
            var noOflvlQuest = null
            var currentQuest = $scope.quest.id;
            var questInLevel = false;

            //check if quest is in level
            if ($scope.program.levels.length > 0) {

                _.each($scope.program.levels, function (level, i) {
                    _.each(level.quests, function (quest, j) {
                        if (quest.id == currentQuest) {
                            questInLevel = true;
                        }
                    })
                })
            }
            if (questInLevel) {
                if ($scope.program.levels.length > 0) {
                    var noOflvlQuest = $scope.program.levels;
                    var lvlLength = $scope.program.levels.length;
                    var currentLevelIndex = null;
                    var currentQuestIndex = null;
                    //find the index of level and quest
                    _.each($scope.program.levels, function (level, i) {
                        _.each(level.quests, function (quest, j) {
                            if (quest.id == currentQuest) {
                                currentLevelIndex = i;
                                currentQuestIndex = j;
                            }
                        })
                    });
                    //console.log("lvlLength: " + lvlLength + ", currentLevelIndex: " + currentLevelIndex + ", currentQuest: " + currentQuestIndex);

                    var questLength = noOflvlQuest[currentLevelIndex].quests.length - 1; //actualy index num not length
                    //check if quest is final in level.
                    if (currentQuestIndex < questLength) {
                        currentQuestIndex++;
                        nextQuestNum = noOflvlQuest[currentLevelIndex].quests[currentQuestIndex].id;
                        $scope.nextActivity = noOflvlQuest[currentLevelIndex].quests[currentQuestIndex];
                        //console.log("next id: " + nextQuestNum);
                        isQuest = true;
                    } else {
                        //see if level increment is possible else break.
                        if (currentLevelIndex < (lvlLength - 1)) { //get actual level index
                            currentLevelIndex++;
                            nextQuestNum = noOflvlQuest[currentLevelIndex].quests[0].id;
                            $scope.nextActivity = noOflvlQuest[currentLevelIndex].quests[0];
                            isQuest = true;
                        } else {
                            //if quests exist without level then get first quest and pass. else break.
                            /**
                            Special Case: If Only 1 level exist with activities and there are no NonLevel Activities, the api instead of leaving $scope.program.quest empty, it fills it with quests that are in existing level.
                            So need to run one more filter to screen out any quests with levelId.
                            */
                            if ($scope.program.quests && $scope.program.quests.length > 0) {
                                //var tempNoOfQuest = $scope.program.quests;
                                var tempNoOfQuest = _.filter($scope.program.quests, function (quest) {
                                    return quest.levelId == null;
                                });
                                if (tempNoOfQuest.length > 0) {
                                    $scope.nextActivity = tempNoOfQuest[0];
                                    questWithoutLevel = true;
                                    isQuest = true;
                                } else {
                                    $scope.nextActivity = [];
                                    isQuest = false;
                                    $scope.nextActivityBtnText = 'Return to Quest';
                                }
                            } else {
                                $scope.nextActivity = [];
                                //console.log($scope.nextActivity);
                                isQuest = false;
                                $scope.nextActivityBtnText = 'Return to Quest';
                            }
                        }
                    }
                }
            }
            else {
                noOfQuest = $scope.program.quests;
                var currentQuest = $scope.quest.id;
                var currentQuestIndex = null;
                for (var i = 0; i < noOfQuest.length; i++) {
                    if (noOfQuest[i].id == currentQuest) {
                        currentQuestIndex = i;
                    }
                }
                var questlength = noOfQuest.length - 1;
                if (currentQuestIndex < questlength) {
                    currentQuestIndex++;
                    var tempAct = noOfQuest[currentQuestIndex];
                    if (tempAct.levelId == null) {
                        nextQuestNum = noOfQuest[currentQuestIndex].id;
                        $scope.nextActivity = tempAct;
                        isQuest = true;
                    } else {
                        $scope.nextActivity = [];
                        $scope.nextActivityBtnText = 'Return to Quest';
                    }
                } else {
                    $scope.nextActivity = [];
                    $scope.nextActivityBtnText = 'Return to Quest';
                }
            }
            return isQuest;
        };

        $scope.isPreviousQuest = function () {

            var isQuest = false;
            var noOfQuest = null;
            var noOflvlQuest = null
            var currentQuest = $scope.quest.id;
            var questInLevel = false; //current quest is in level?

            if ($scope.program.levels.length > 0) {

                _.each($scope.program.levels, function (level, i) {
                    _.each(level.quests, function (quest, j) {
                        if (quest.id == currentQuest) {
                            questInLevel = true;
                        }
                    })
                })
            }

            if (questInLevel) {
                if ($scope.program.levels.length > 0) {

                    noOflvlQuest = $scope.program.levels;
                    var lvlLength = $scope.program.levels.length;
                    var currentLevelIndex = null;
                    var currentQuestIndex = null;
                    //find the index of level and quest
                    _.each($scope.program.levels, function (level, i) {
                        _.each(level.quests, function (quest, j) {
                            if (quest.id == currentQuest) {
                                currentLevelIndex = i;
                                currentQuestIndex = j;
                            }
                        })
                    });

                    if (currentQuestIndex == 0) {
                        currentLevelIndex--;
                        if (currentLevelIndex != -1) {
                            var questInLevelLength = noOflvlQuest[currentLevelIndex].quests.length;
                            prevQuestNum = noOflvlQuest[currentLevelIndex].quests[questInLevelLength - 1].id;
                            $scope.previousActivity = noOflvlQuest[currentLevelIndex].quests[questInLevelLength - 1];
                            isQuest = true;
                        }
                    } else {
                        //console.log("current id: " + noOflvlQuest[currentLevelIndex].quests[currentQuestIndex].id);
                        currentQuestIndex--;
                        if (currentQuestIndex != -1) {
                            prevQuestNum = noOflvlQuest[currentLevelIndex].quests[currentQuestIndex].id;
                            $scope.previousActivity = noOflvlQuest[currentLevelIndex].quests[currentQuestIndex];
                            //console.log("next id: " + nextQuestNum);
                            isQuest = true;
                        }
                    }
                }
            }
            else {

                var noOfQuest = $scope.program.quests;
                var currentQuest = $scope.quest.id;
                var currentQuestIndex = null;
                for (var i = 0; i < noOfQuest.length; i++) {
                    if (noOfQuest[i].id == currentQuest) {
                        currentQuestIndex = i;
                    }
                }
                if (currentQuestIndex < noOfQuest.length) {
                    currentQuestIndex--;
                    if (currentQuestIndex != -1) {
                        prevQuestNum = noOfQuest[currentQuestIndex].id;
                        $scope.previousActivity = noOfQuest[currentQuestIndex];
                        isQuest = true;
                    } else { //from first quest to last quest of last level
                        if ($scope.program.levels.length > 0) {
                            noOflvlQuest = $scope.program.levels;
                            var questInLevelLength = noOflvlQuest[$scope.program.levels.length - 1].quests.length;
                            $scope.previousActivity = noOflvlQuest[$scope.program.levels.length - 1].quests[questInLevelLength - 1];
                            prevQuestWithoutLevel = true;
                            isQuest = true;
                        }
                    }
                }
            }
            return isQuest;
        };

        $scope.setCurrentChallenge = function (challenge) {
            $scope.currentChallenge = challenge;
        };
        $scope.setNextActivity = function (challenge) {
            $scope.nextActivity = challenge;
        };
        $scope.setPreviousActivity = function (challenge) {
            $scope.previousActivity = challenge;
        };
        $scope.setUpcomingChallenge = function (challenge) {
            $scope.upcomingChallenge = challenge;
        };
        $scope.setPreviousChallenge = function (challenge) {
            $scope.previousChallenge = challenge;
        };

        //Searches through the levels quests and the program quests to find the quest by id
        $scope.getQuestById = function (questId) {
            var foundQuest = null;
            _.find($scope.program.levels, function (level) {
                var quest = _.find(level.quests, function (quest) {
                    if (quest.id == questId) {
                        foundQuest = quest;
                        return true;
                    }
                });
                if (quest) {
                    return true;
                }
            });
            if (!foundQuest) {
                foundQuest = _.findWhere($scope.program.quests, { id: questId });
            }
            return foundQuest;
        };
        $scope.goToQuest = function (quest) {
            if (quest && quest.length == 0 || quest.isLocked) {
                $scope.close();
                return;
            }
            if (quest != null) {
                var url = '/user/program/' + $scope.program.slug + '/quest-player/quest/' + quest.id;
                if ($scope.preview) url += '?preview=' + encodeURIComponent($scope.preview);
                if ($scope.preview && $scope.previewRet) url += '&previewRet=' + encodeURIComponent($scope.previewRet);
                $window.location = url;
            } else {
                $scope.close();
            }

        };

        $scope.goToQuestFromLevel = function (quest) {
            if (quest && quest.length == 0 || quest.isLocked) {
                $scope.close();
                return;
            }

            if (quest != null) {
                var url = '/user/program/' + $scope.program.slug + '/quest-player/quest/' + quest.id;
                if ($scope.preview) url += '?preview=' + encodeURIComponent($scope.preview);
                if ($scope.preview && $scope.previewRet) url += '&previewRet=' + encodeURIComponent($scope.previewRet);
                $window.location = url;

            } else {
                $scope.close();
            }

        };

        /***********************Misc Functions **************************/
        $scope.saveCommentDraft = function (draft) {
            $scope.savedCommentDraft = draft;
        };
        $scope.clearCommentDraft = function () {
            $scope.savedCommentDraft = null;
        };
        $scope.inQuestPlayer = true;
        $scope.discussion = {
            topic: false
        };
        $scope.toggle = {
            asideDiscussion: true,
            showPointsAwarded: false,
            showDoAddMediaModal: false,
            showInspireAppreciateAddMediaModal: false,
            showInspireEncourageAddMediaModal: false,
            showInspireStoryAddMediaModal: false

        };
        $scope.refreshDiscussion = function () {
            $scope.$broadcast('refreshDiscussion');
        };
       
        /************************show points notification modal*************************************************/
        $rootScope.showPointsAwardedNotification = function (points) {
            $scope.toggle.showPointsAwarded = true;
            $scope.pointsAwarded = points;
            $scope.$parent.alreadySubmitted = true;
            $timeout(function () {
                $scope.toggle.showPointsAwarded = false;
                $scope.pointsAwarded = null;
            }, 1950)
        };
        $rootScope.showHintPointsDeductNotification = function (points) {
            $scope.toggle.showHintPointsAwarded = true;
            $scope.hintPointsAwarded = points;
            console.log("$scope.availablePoints: " + $scope.availablePoints);
            $timeout(function () {
                $scope.toggle.showHintPointsAwarded = false;
                $scope.hintPointsAwarded = null;
            }, 2950)
        };


        /************************Do and Inspire modal and upload function****************************************/

        $scope.doUpload = {
            file: null,
            embedLink: null,
            hasFile: false,
            hasEmbed: false
        };
        $scope.inspireUpload = {
            file: null,
            embedLink: null,
            hasFile: false,
            hasEmbed: false
        };
        $scope.mediaFileError = {
            embedHasNoFile: false,
            embedInvalidLink: false,
            fileMissing: false,
            fileSizeBig: false,

        };

        $scope.resetMediaError = function () {
            $scope.mediaFileError.embedHasNoFile = false;
            $scope.mediaFileError.embedInvalidLink = false;
            $scope.mediaFileError.fileMissing = false;
            $scope.mediaFileError.fileSizeBig = false;
        }
        $scope.resetUploadFiles = function () {
            $scope.doUpload.file = null;
            $scope.doUpload.embedLink = null;
            $scope.doUpload.hasFile = false;

            $scope.inspireUpload.file = null;
            $scope.inspireUpload.embedLink = null;
            $scope.inspireUpload.hasFile = false;
        }

        $rootScope.showDoAddMediaModalNotification = function () {
            $scope.resetMediaError();
            $scope.toggle.showDoAddMediaModal = true;
        };
        $rootScope.showInspireAddMediaModalNotification = function () {
            $scope.resetMediaError();
            $scope.toggle.showInspireAddMediaModal = true;
        };

        /***********Inspire and DO upload Modals***************************/

        $rootScope.closeDoModal = function () {
            $scope.toggle.showDoAddMediaModal = false;

        };
        $rootScope.closeInspireModal = function () {
            $scope.toggle.showInspireAddMediaModal = false;
        };

        /*************upload functionality for do and inspire*********************************/

        $rootScope.uploadFileEmbed = function () {
            $scope.mediaFileError.embedInvalidLink = false;
            $scope.mediaFileError.embedHasNoFile = false;


            if (currentActivityType == 'Inspire') {
                if ($scope.inspireUpload.embedLink.trim().length > 0) {
                    //<iframe width="640" height="360" src="https://www.youtube.com/embed/aSRC2KLNkd4" frameborder="0" allowfullscreen></iframe>
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test($scope.inspireUpload.embedLink)) {
                        $scope.mediaFileError.embedInvalidLink = true;
                    }
                    $scope.inspireUpload.hasEmbed = true;
                } else {
                    $scope.mediaFileError.embedHasNoFile = true;
                }
            }
            if (currentActivityType == 'Todo') {
                if ($scope.doUpload.embedLink.trim().length > 0) {
                    //<iframe width="640" height="360" src="https://www.youtube.com/embed/aSRC2KLNkd4" frameborder="0" allowfullscreen></iframe>
                    var r = /.*<iframe(.*)src=("|')(.+)("|')(.*)>(.*)<\/iframe>.*/;
                    if (!r.test($scope.doUpload.embedLink)) {
                        $scope.mediaFileError.embedInvalidLink = true;
                    }
                    $scope.doUpload.hasEmbed = true;
                } else {
                    $scope.mediaFileError.embedHasNoFile = true;
                }
            }



        };

        $scope.selectMediaLink = function () { //if iframe embed is used.

            // Get the source url
            var r = /src="([_\-a-z0-9:\/\.]+)/gi;
            if (currentActivityType == 'Inspire') {
                var m = r.exec($scope.inspireUpload.embedLink);
            }
            if (currentActivityType == 'Todo') {
                var m = r.exec($scope.doUpload.embedLink);
            }


            var name = null;
            var parts = null;
            var videoId = null;

            if (m) {
                name = m[1];
                parts = name.split('/');
                videoId = parts[parts.length - 1];
            }

            if (currentActivityType == 'Inspire') {
                var media = {
                    type: 'video',
                    name: name,
                    date: new Date(),
                    mimeType: 'video/*',
                    iframe: $scope.inspireUpload.embedLink,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
                };

            }
            if (currentActivityType == 'Todo') {
                var media = {
                    type: 'video',
                    name: name,
                    date: new Date(),
                    mimeType: 'video/*',
                    iframe: $scope.doUpload.embedLink,
                    ref: videoId,
                    canDrag: false,
                    encodings: [],
                    source: 'youtube',
                    coverUrl: 'http://img.youtube.com/vi/' + videoId + '/0.jpg'
                };

            }


            if (currentActivityType == 'Inspire') {
                $scope.$broadcast('addMediatoInsipireModal', media);
            }
            if (currentActivityType == 'Todo') {
                $scope.$broadcast('addMediatoTodoModal', media);
            }

            $scope.stopModalLoading();

            if (currentActivityType == 'Inspire') {
                $scope.inspireUpload.embedLink = null;
                $rootScope.closeInspireModal();
            }
            if (currentActivityType == 'Todo') {
                $scope.doUpload.embedLink = null;
                $rootScope.closeDoModal();
            }




        };

        $rootScope.inspireDoUploadFile = function (files) {
            file = null;
            $scope.resetMediaError();
            $scope.modalLoading.isLoading = 1;
            if (files && files.length > 0) {
                $scope.uploadMedia(files);
            }
            //$scope.inspireUpload.file = files[0];
            //$scope.inspireUpload.hasFile = true;
            //console.log($scope.inspireUpload.file);
            //$scope.stopModalLoading();
            //$rootScope.closeInspireModal();
        };

        $scope.uploadDownloadContent = function (files) {

            var file = files[0];

            // Check type
            //if (!helpers.validUploadFile(file.name)) {
            //    $scope.selectedUserTodo.todo.mediaChallenge.val.media.type = true;
            //    return;
            //}

            // Check size
            if (file.size > helperService.maxFileSize) {
                $scope.mediaFileError.fileSizeBig = true;
                $scope.stopModalLoading();
                return;
            }

            $scope.busy = true;

            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
                .success(function (data) {
                    var userMedia = {
                        type: 'resource',
                        userId: authService.user.id,
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref,
                        isNew: true
                    };

                    if (currentActivityType == 'Inspire') {
                        $scope.$broadcast('addMediatoInsipireModal', userMedia);
                    }
                    if (currentActivityType == 'Todo') {
                        $scope.$broadcast('addMediatoTodoModal', userMedia);
                    }
                    $scope.busy = false;


                    $scope.stopModalLoading();
                    if (currentActivityType == 'Inspire') {
                        $rootScope.closeInspireModal();
                    }
                    if (currentActivityType == 'Todo') {
                        $rootScope.closeDoModal();
                    }
                });
        };

        $scope.uploadMedia = function (files) {
            file = null;
            file = files[0];
            var mediaType;

            //check if file name exists
            if (file) {
                // Check type
                if (!helperService.validVideoFile(file.name)) {
                    if (!helperService.validAudioFile(file.name)) {
                        if (!helperService.validImageFile(file.name)) {
                            $scope.uploadDownloadContent(files);
                            return;
                        } else {
                            mediaType = 'image';
                            // Check size
                            if (file.size > helperService.maxImageSize) {
                                $scope.mediaFileError.fileSizeBig = true;
                                $scope.stopModalLoading();
                                return;
                            }
                        }
                    } else {
                        mediaType = 'audio';
                        // Check size
                        if (file.size > helperService.maxAudioSize) {
                            $scope.mediaFileError.fileSizeBig = true;
                            $scope.stopModalLoading();
                            return;
                        }
                    }
                } else {
                    mediaType = 'video';
                    // Check size
                    if (file.size > helperService.maxVideoSize) {
                        $scope.mediaFileError.fileSizeBig = true;
                        $scope.stopModalLoading();
                        return;
                    }
                }

                $scope.busy = true;

                var url = authService.apiUrl;
                if (mediaType == 'video') url += '/uv';
                else if (mediaType == 'audio') url += '/ua';
                else url += '/ui';

                $upload.upload({ url: url, file: file })

                    .progress(function (e) {
                        /*var progressPercentage = parseInt(100.0 * e.loaded / e.total);
                         console.log('progress: ' + progressPercentage + '% ' + e.config.file.name);*/
                    })
                    .success(function (data) {
                        if (mediaType == 'audio') {
                            var media = {
                                userId: authService.user.id,
                                type: mediaType,
                                name: file.name,
                                date: file.lastModifiedDate,
                                mimeType: file.type,
                                url: data.url,
                                ref: data.ref,
                                source: 'system',
                                canDrag: false,
                                encoding: true,
                                isNew: true
                            };

                            if (currentActivityType == 'Inspire') {
                                $scope.$broadcast('addMediatoInsipireModal', media);
                            }
                            if (currentActivityType == 'Todo') {
                                $scope.$broadcast('addMediatoTodoModal', media);
                            }
                            $scope.busy = false;
                            $scope.stopModalLoading();
                            if (currentActivityType == 'Inspire') {
                                $rootScope.closeInspireModal();
                            }
                            if (currentActivityType == 'Todo') {
                                $rootScope.closeDoModal();
                            }
                        } else if (mediaType == 'video') {
                            var media = {
                                userId: authService.user.id,
                                type: mediaType,
                                name: file.name,
                                date: file.lastModifiedDate,
                                mimeType: file.type,
                                url: data.url,
                                ref: data.ref,
                                source: 'system',
                                canDrag: false,
                                encodings: [],
                                isNew: true
                            };
                            $scope.checkEncoding(media);

                            if (currentActivityType == 'Inspire') {
                                $scope.$broadcast('addMediatoInsipireModal', media);
                            }
                            if (currentActivityType == 'Todo') {
                                $scope.$broadcast('addMediatoTodoModal', media);
                            }
                            $scope.busy = false;
                            $scope.stopModalLoading();
                            if (currentActivityType == 'Inspire') {
                                $rootScope.closeInspireModal();
                            }
                            if (currentActivityType == 'Todo') {
                                $rootScope.closeDoModal();
                            }


                        }
                        else {
                            var img = new Image();
                            var media = {
                                userId: authService.user.id,
                                type: mediaType,
                                name: file.name,
                                date: file.lastModifiedDate,
                                mimeType: file.type,
                                url: data.url,
                                ref: data.ref,
                                source: 'system',
                                canDrag: false,
                                encodings: [],
                                isNew: true
                            };

                            if (currentActivityType == 'Inspire') {
                                $scope.$broadcast('addMediatoInsipireModal', media);
                            }
                            if (currentActivityType == 'Todo') {
                                $scope.$broadcast('addMediatoTodoModal', media);
                            }
                            $scope.busy = false;
                            $scope.stopModalLoading();
                            if (currentActivityType == 'Inspire') {
                                $rootScope.closeInspireModal();
                            }
                            if (currentActivityType == 'Todo') {
                                $rootScope.closeDoModal();
                            }
                            //img.src = data.url;
                        }
                    });
            }
        };

        $scope.checkEncoding = function (media) {
            if (media.url) {
                $http.get(authService.apiUrl + '/uv/encoded?url=' + media.url)
                    .success(function (result) {
                        if (result.encodings.length <= 0) return $timeout(function () {
                            $scope.checkEncoding(media);
                        }, 1000);
                        media.encodings = result.encodings;


                        //if (currentActivityType == 'Inspire') {
                        //    $scope.$broadcast('repMedaiInspireModal', media);
                        //}
                        //if (currentActivityType == 'Todo') {
                        //    $scope.$broadcast('repMediatoTodoModal', media);
                        //}


                    });
            }
        };

        /***********************************************************************/

        $scope.previewRet = null;
        $scope.previewRetHash = null;
        $scope.preview = null;
        $scope.program = null;
        $scope.quest = null;
        $scope.questionTypes = helperService.questionTypes;

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

        /*******************init and parsing info function****************************/
        this.init = function (programId, questId) {
            var url = authService.apiUrl + '/programs/' + programId + '/user';
            $scope.loading.isLoading++;
            $scope.previewRet = helperService.getQueryValue('previewRet');
            $scope.previewRetHash = helperService.getQueryValue('previewRetHash');
            $scope.preview = helperService.getQueryValue('preview');
            if ($scope.preview) url += '?preview=yes';


            $http.get(url)
                .success(function (program) {
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
                        $q.all([
                            $http.get(authService.apiUrl + '/program/' + program.id + '/network-users/' + program.linkId),
                            $http.get(authService.apiUrl + '/forum/' + program.forum.id + '/categories'),
                            $http.get(authService.apiUrl + '/program-user-groups/' + program.linkId),
                            $http.get(authService.apiUrl + '/authoring/configurations')
                        ]).then(function (results) {
                            $rootScope.networkUsers = results[0].data;
                            //console.log("RootScope" + $rootScope.networkUsers);
                            $rootScope.userGroups = results[2].data;
                            $rootScope.childUserGroups = angular.copy(results[2].data);

                            _.each($rootScope.networkUsers, function (nu) {
                                $rootScope.formatNetworkUser(nu);
                            });

                            _.each($rootScope.userGroups, function (g) {
                                $rootScope.formatUserGroup(g);
                            });

                            _.each($rootScope.childUserGroups, function (g) {
                                $rootScope.formatUserGroup(g);
                            });

                            $rootScope.forumCategories = results[1].data;
                            $scope.program = program;
                            $scope.quest = $scope.getQuestById(questId);
                            $scope.parseConfigurations(results[3].data);
                            $scope.stopLoading();
                        })
                    });
                })
                .error(function (err) {
                    reject(err);
                });
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

        /*******************add and remove group && modal function in inspire page****************************/
        $rootScope.showToggleGroupModal = function (val, groupId) {
            if (val == 'add') {
                $scope.addGroupModel.name = null;
                $scope.showInspireAddGroup = true;
            } else {
                $scope.showInspireDelGroup = true;
            }

            groupIdToggle = groupId;
        }
        $rootScope.closeToggleGroupModal = function () {
            $scope.showInspireAddGroup = false;
            $scope.showInspireDelGroup = false;

        }

        $scope.userGroupRemoved = function () {
            $http.get(authService.apiUrl + '/program-user-groups/' + $scope.program.linkId)
                .then(function (results) {
                    $rootScope.userGroups = results.data;
                });

         //  _.each($rootScope.userGroups, function (g) {
        // $rootScope.formatUserGroup($rootScope.userGroups[0]);
        //    });
        };
        $scope.removeGroup = function () {
            var groupId = groupIdToggle;
            console.log(groupId);
            $http.post(authService.apiUrl + '/program-user-group/' + groupId + '/delete')
                .success(function () {
                    $scope.$broadcast('deleteGroupFromSelectedArray', groupId);
                    $scope.userGroupRemoved();
                   
                    $rootScope.closeToggleGroupModal();
                    
                  

                    //$rootScope.$emit('userGroupRemoved', group);
                }).error(function (err) {
                    $scope.submitError = err;
                });
        };
        $rootScope.closeCreateUserGroupModal = function () {
            $scope.usersPendingGroupCreation = null;
            if ($scope.userGroupModal) {
                $scope.userGroupModal.close();
            }
        };
        $scope.categoryUpdated = function () {
            $http.get(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/categories')
                .then(function (results) {
                    $rootScope.forumCategories = results.data;
                });
        };
        $scope.addGroupModel = {
            name: null,
            networkUsers: null,
            linkId: null
        };
        $scope.addGpModel = {
            req: false,
            unique: false,
            length: false,
            err: false
        };
        var resetGpModel = function () {
            $scope.addGpModel.req = false;
            $scope.addGpModel.length = false;
            $scope.addGpModel.unique = false;
        }
        $scope.validate = function () {

            var hasError = false;
            if (!$scope.addGroupModel.name) {
                $scope.addGpModel.req = true;
                hasError = true;
            }
            if ($scope.addGroupModel.name && $scope.addGroupModel.name.length > 25) {
                $scope.addGpModel.length = true;
                hasError = true;
            }
            return !hasError;
        };
        $scope.submitGroup = function (e) {
            e.preventDefault();
            resetGpModel();
            $scope.addGroupModel.linkId = $scope.program.linkId;
            $scope.addGroupModel.networkUsers = $rootScope.shareUserArry;

            if ($scope.validate()) {

                console.log($scope.addGroupModel);
                console.log("Name is fine");
                //$scope.submitted = true;
                return $q(function (resolve, reject) {
                    $http.post(authService.apiUrl + '/program-user-group/create/', $scope.addGroupModel)
                        .success(function (group) {
                            resolve();
                            //$rootscope.$emit('usergroupadded', group);
                            //$rootscope.closecreateusergroupmodal();
                            $scope.userGroupRemoved();
                            $rootScope.closeToggleGroupModal();
                        })
                        .error(function (err) {
                            reject(err);
                            $scope.err = err;
                            //$scope.submitted = false;
                            if (err.indexOf('Cannot have duplicate group names') != -1) {
                                $scope.addGpModel.unique = true;
                            } else {
                                $scope.addGpModel.err = true;
                            }
                        });
                });

            }
        };

        /*******************************************************************/
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

        /*******************************************************************/
        $rootScope.formatUserGroup = function (userGroup) {
            userGroup.label = userGroup.name;
            userGroup.user = { id: null };
            userGroup.type = 'User Groups';
            userGroup.isGroup = true;
            userGroup.tooltip = '';
            userGroup.selected = false;
            _.each(userGroup.programUsers, function (groupUser, i) {
                groupUser.programUser.user.selected = false;
                groupUser.programUser.user.userId = groupUser.programUser.user.id;
            })
            _.each(userGroup.programUsers, function (groupUser, i) {
                userGroup.tooltip += (groupUser.programUser.user.firstName + ' ' + groupUser.programUser.user.lastName + (i < userGroup.programUsers.length - 1 ? ', ' : ' '));
            })
        };

        $scope.getQuestPlayerStyle = function () {
            if ($scope.quest && $scope.quest.backgroundImageUrl) {
                return {
                    'background-image': 'url(' + $scope.quest.backgroundImageUrl + ')',
                    'background-repeat': 'no-repeat',
                    'background-size' : 'cover'
                };
            }
            //else if ($scope.quest && $scope.quest.featuredImageUrl) {
            //    return { 'background-image': 'url(' + $scope.quest.featuredImageUrl + ')' };
            //} else if ($scope.quest) {
            //    return { 'background': '-webkit-linear-gradient(90deg, #516585, #28354D)' };
            //}
        };

        $rootScope.formatNetworkUser = function (networkUser) {
            networkUser.label = networkUser.user.firstName + ' ' + networkUser.user.lastName;
            networkUser.selected = false;
        };

        $scope.getNetworkUsers = function () {
            return $scope.networkUsers;
        };

        $scope.close = function () {
            var url;
            if ($scope.preview && $scope.previewRet && $scope.preview.indexOf('quest/') != -1) {
                url = '/manage/authoring-suite';
                if ($scope.previewRet) url += $scope.previewRet;
                if ($scope.previewRetHash) url += '#' + $scope.previewRetHash;
                $window.location = url;
            } else {
                url = '/user/program/' + $scope.program.slug + '/quests';
                if ($scope.preview) url += '?preview=' + $scope.preview;
                if ($scope.previe && $scope.previewRet) url += '&previewRet=' + $scope.previewRet;
                $window.location = url;
            }
        };

        $scope.toHtml = function (text) {
            return text.replace(/\n/g, '<br>');
        };

        $scope.bodyClick = function () {
            $scope.$broadcast('bodyClick');
        };

        $scope.canManage = function () {
            return authService.canManage();
        };

        $scope.getCanvasHeight = function () {
            return $window.innerHeight;
        };


        //Ensures that angular recacuates the canvas height on window resize, can't use watch for resize events
        angular.element(window).on('resize', function () {
            $scope.$apply(function () {
                $scope.getTopStyleForDiscussionCollapseButton();
            })
        });

        $.fn.scrollEnd = function (callback, timeout) {
            $(this).scroll(function () {
                var $this = $(this);
                if ($this.data('scrollTimeout')) {
                    clearTimeout($this.data('scrollTimeout'));
                }
                $this.data('scrollTimeout', setTimeout(callback, timeout));
            });
        };

        $('#discussionSlideout').scrollEnd(function () {
            $scope.$apply(function () {
                $scope.getTopStyleForDiscussionCollapseButton();
            })
        }, 100);

    }]);

controllers.controller('QuestPlayerController', ['$scope', '$q', '$http', '$timeout', 'controllerState', 'authService', 'helperService',
    function ($scope, $q, $http, $timeout, controllerState, authService, helperService) {
        $scope.inState = null;
        $scope.isBegin = true;
        $scope.availablePoints = 0;
        $scope.challenge = null;
        $scope.objUpcomTitle = null;
        $scope.canContinue = false;
        $scope.inspireCanContinue = false;
        $scope.todoCanContinue = false;
        $scope.currentQuestBonus = false;

        controllerState.scope($scope);
        controllerState.otherwise('start');
        controllerState.onEnter = function (state) {
            $timeout(function () {
                if ($scope.quest) {

                    $scope.currentQuestBonus = $scope.quest.baseOrBonus == 'O' ? true : false;

                    if ($scope.quest.type == 'T') {
                        $scope.inState = "do";
                        controllerState.go('do');
                    } else if ($scope.quest.type == 'I') {
                        $scope.inState = "inspire";
                        controllerState.go('inspire');
                    } else {
                        $scope.inState = state;
                    }
                }

            });
        };


        $scope.$on('canAndInsireContinue', function (e, args) {
            $scope.canContinue = true;
            $scope.inspireCanContinue = true;
        });
        $scope.$on('canAnddoContinue', function (e, args) {
            $scope.canContinue = true;
            $scope.todoCanContinue = true;
        });

        $scope.$watch(function () {
            if ($scope.quest) {
                if ($scope.inState == 'start') {
                    var startIndex = $scope.getFirstIncompleteQuestIndex();
                    if (startIndex == 0) {
                        $scope.isBegin = true;
                    } else {
                        $scope.isBegin = false;
                    }
                    $scope.objUpcomTitle = $scope.quest.challenges[0].title;
                
                    //$scope.setCurrentChallenge($scope.quest.challenges[0]);
                }
                else if ($scope.inState == 'do') {
                    //console.log("scope.instate = do: " + $scope.quest.challenges);
                    if ($scope.quest.challenges.length > 0) {
                        $scope.currentDoChallengetitle = $scope.quest.challenges[0].title;
                    } else {
                        $scope.currentDoChallengetitle = $scope.quest.title;
                    }

                }
                else if ($scope.inState == 'inspire') {
                    //console.log("scope.instate = inspire: " + $scope.quest);
                    if ($scope.quest.challenges.length > 0) {
                        $scope.currentInspireChallengetitle = $scope.quest.challenges[0].title;
                    } else {
                        $scope.currentInspireChallengetitle = $scope.quest.title;
                    }

                }
                else {
                    var startIndex = $scope.getFirstIncompleteQuestIndex();

                }
            }
            return $scope.quest;
        }, function () {
            if (!$scope.quest) return;

            if ($scope.getFirstIncompleteQuestIndex() != -1) {
                controllerState.route();
            } else {
                controllerState.go('start');
            }

            $scope.stopLoading();
        });
        //to start the challenges in new quest. else go to the finish.
        $scope.start = function () {
            var index = $scope.getFirstIncompleteQuestIndex();
            if (index >= 0) {
                $scope.availablePoints = $scope.quest.challenges[index].points;
                console.log("inside start $scope.availablePoints: " + $scope.availablePoints);

                controllerState.go('challenge', {
                    challengeIndex: index,
                    challenge: $scope.quest.challenges[index]
                });
            }
            else {
                controllerState.go('finish');
            }
        };

        $scope.continueToNextQuestion = function () {
            var index = $scope.getFirstIncompleteQuestIndex();
            //pass the completed challenge to nextChallenge function.
            index--;
            var chall = $scope.quest.challenges[index];

            $scope.$broadcast('navToNextChallenge', chall);

            //$scope.availablePoints = $scope.quest.challenges[index].points;
            //console.log("inside continue $scope.availablePoints: " + $scope.availablePoints);
            //controllerState.go('challenge', {
            //    challengeIndex: index,
            //    challenge: $scope.quest.challenges[index]
            //});

        }

        $scope.gotoObjectivepage = function () {
            controllerState.go('start');
        }

        $scope.gotoChallenge = function (num) {
            controllerState.go('challenge', {
                challengeIndex: num,
                challenge: $scope.quest.challenges[num]
            });
        }

        $scope.getFirstIncompleteQuestIndex = function () {
            var index = -1;
            for (var i = 0; i < $scope.quest.challenges.length; i++) {
                if (!$scope.quest.challenges[i].complete && $scope.quest.challenges[i].type != 'finish') {
                    index = i;
                    break;
                }
            }

            return index;
        }

        
        
    }]);

controllers.controller('QuestPlayerStartController', ['$scope', '$q', '$http', '$timeout', 'controllerState', 'authService', 'helperService', '$rootScope','$window',
    function ($scope, $q, $http, $timeout, controllerState, authService, helperService, $rootScope, $window) {

        

        var initState = function () {
            $timeout($scope.setObjective, 900);
         
        };

        controllerState
            .state('start', {
                url: '/start',
                onEnter: initState

            });

        $scope.setObjective = function () {
         
                var i = 0;
                var $element = [];

                $element = $('.challenge1finish');
                for(i; i < $element.length; i++)
                {
                    var spanheight = $element[i].offsetHeight;
                    if (spanheight > 36) {
                        $('img', $element[i]).addClass('active');

                    }
                    else {
                        $('img', $element[i]).removeClass('active');
                    }


                }
         
            
        };
        
    }]);

controllers.controller('QuestPlayerChallengeController', ['$scope', '$q', '$http', '$timeout', '$sce', 'controllerState', 'authService', 'helperService', '$rootScope',
    function ($scope, $q, $http, $timeout, $sce, controllerState, authService, helperService, $rootScope) {
        $scope.challengeIndex = 0;
        $scope.showHints = false;
        $scope.hintsAry = null;
        $scope.shownHint = null;
        $scope.shownHintCount = null;
        $scope.notShowHintPoint = true;

        var isActivitySaving = false;

        var finalScoreofChallenge = 0;

        $scope.showUntouchedMsg = false;
        $scope.isChallengeTouched = function () {
            if ($scope.challengeQuestions.$dirty) {
                $scope.userHandledChallenge = true;
            }
        }

        var shuffle = function (array) {
            var currentIndex = array.length, temporaryValue, randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = array[currentIndex];
                array[currentIndex] = array[randomIndex];
                array[randomIndex] = temporaryValue;
            }
        };

        $scope.autoResizeHeight = function () {
            var answerText3 = angular.element('textarea.answerText3');
            answerText3.css('height', (answerText3[0].scrollHeight) + 'px');
        };

        $scope.toHtml = function (text) {
            return text.replace(/\n/g, '<br>');
        };

        var initState = function (state, params) {

            resetVal();
            if (params && typeof params.challengeIndex !== 'undefined') {
                $scope.challengeIndex = parseInt(params.challengeIndex);
                $scope.$parent.challenge = params.challenge ?
                    params.challenge : $scope.quest.challenges[$scope.challengeIndex];
                $scope.$parent.availablePoints = $scope.quest.challenges[$scope.challengeIndex].points;
                if ($scope.quest.challenges[$scope.challengeIndex].questions.length > 0) {
                    $scope.hintsAry = $scope.quest.challenges[$scope.challengeIndex].questions[0].hints;
                }

                //get next challenge and add to upcoming challenge.
                var nextChallInt = $scope.challengeIndex + 1;
                $scope.$parent.setUpcomingChallenge($scope.quest.challenges[nextChallInt]);
                $scope.$parent.setCurrentChallenge($scope.$parent.challenge);

                if ($scope.$parent.challenge.questions.length <= 0) {
                    if (!$scope.$parent.challenge.result) {//&& !question.result
                        //$scope.$parent.canContinue = false;
                        $scope.shownHint = null;
                        $scope.shownHintCount = null;
                        $scope.notShowHintPoint = true;
                    } else {
                        $scope.$parent.challengeChanging = false;
                        console.log("No Questions available challengeChanging is: " + $scope.$parent.challengeChanging);
                        $scope.$parent.canContinue = true;
                    }
                } else {
                    angular.forEach($scope.$parent.challenge.questions, function (question) {

                        if (question.type.id == helperService.questionTypes.shortAnswer.id) { //short answer
                            if (!$scope.$parent.challenge.result) {//&& !question.result
                                question.result = null;
                                // $scope.$parent.canContinue = false;
                                $scope.shownHint = null;
                                $scope.shownHintCount = null;
                                $scope.notShowHintPoint = true;
                            } else {
                                question.result = $scope.$parent.challenge.result.items[0].data;
                                $scope.$parent.canContinue = true;
                            }

                        } else if (question.type.id == helperService.questionTypes.narrative.id) {
                            if (!$scope.$parent.challenge.result) {// && !question.result
                                question.result = null;
                                $scope.shownHint = null;
                                $scope.shownHintCount = null;
                                $scope.notShowHintPoint = true;
                            } else {
                                question.result = $scope.$parent.challenge.result.items[0].data;
                                $scope.$parent.canContinue = true;
                            }
                        } else if (question.type.id == helperService.questionTypes.singleSelect.id) {//single select
                            if (!$scope.$parent.challenge.result) {
                                //&& !question.result) {
                                question.selected = null;
                            }
                            else {
                                question.selected = null;
                                _.each($scope.$parent.challenge.questions[0].answers, function (ans, i) {
                                    if (ans.id == $scope.$parent.challenge.result.items[0].answerId) {
                                        question.selected = i;
                                    }
                                });
                                //question.selected = $scope.$parent.challenge.result.items[0].answerId;  
                                $scope.$parent.canContinue = true;
                            }
                        }
                        else if (question.type.id == helperService.questionTypes.multiSelect.id) {//multiple select
                            if (!$scope.$parent.challenge.result) {
                                // && !question.result) {
                                angular.forEach(question.answers, function (answer) {
                                    answer.isSelected = false;
                                });

                            } else {
                                angular.forEach(question.answers, function (answer) {
                                    if (answer.correct) {
                                        answer.isSelected = true;
                                    }
                                    else {
                                        answer.isSelected = false;
                                    }
                                });
                                $scope.$parent.canContinue = true;
                            }
                        }
                        else if (question.type.id == helperService.questionTypes.fillBlank.id) {

                            if (!$scope.$parent.challenge.result) {//&& !question.result
                                //answer.result = null;
                                // $scope.$parent.canContinue = false;
                                $scope.shownHint = null;
                                $scope.shownHintCount = null;
                                $scope.notShowHintPoint = true;

                            } else {
                                angular.forEach(question.answers, function (answer) {
                                    answer.result = $scope.$parent.challenge.result.items[0].data;;
                                });
                                $scope.$parent.canContinue = true;
                            }
                        }
                        else if (question.type.id == helperService.questionTypes.poll.id) {

                            if (!$scope.$parent.challenge.result) {
                                angular.forEach(question.answers, function (answer) {
                                    answer.selected = null;
                                });
                            }
                            else {
                                angular.forEach(question.answers, function (answer, i) {
                                    if (answer.id == $scope.$parent.challenge.result.items[0].answerId) {
                                        answer.selected = i;
                                    }
                                });
                                $scope.$parent.canContinue = true;
                            }
                        
                            }
                        else if (question.type.id == helperService.questionTypes.pollMultiSelect.id) {
                            question.selectCount = 0;
                            angular.forEach(question.answers, function (answer) {
                                if (answer.correct) question.selectCount++;
                               
                            });
                            if (!$scope.$parent.challenge.result) {
                                //&& !question.result) {

                                angular.forEach(question.answers, function (answer) {
                               answer.selected = false;
                                });
                            } else {
                                angular.forEach(question.answers, function (answer) {
                                    for (var j = 0; j < $scope.$parent.challenge.result.items.length; j++) {
                                        if (answer.id == $scope.$parent.challenge.result.items[j].answerId) {
                                            answer.selected = true;
                                        }
                                    }
                                });

                                $scope.$parent.canContinue = true;    
                            }
                           
                            }
                       
                        else if (question.type.id == helperService.questionTypes.matching.id) {

                            $scope.$parent.canContinue = false;
                            if (!question.formatted) {
                                var a = null;
                                var answers = [];
                                var matchingItems = [];
                                angular.forEach(question.answers, function (answer) {
                                    if (!a) {
                                        a = {
                                            id: answer.id,
                                            answer: answer.answer,
                                            match: null
                                        }
                                        answers.push(a);

                                    }
                                    else {
                                        a.matchId = answer.id;
                                        a.match = answer.answer;


                                        matchingItems.push({
                                            matchId: a.matchId,
                                            match: a.match
                                        });

                                        a = null;
                                    }
                                });
                                question.answers = answers;
                                question.matchingItems = matchingItems;
                                question.selectedMatchItem = null;
                                question.formatted = true;
                            }
                            if (!$scope.$parent.challenge.result && !question.result) {

                                var done = false;
                                var count = 0;
                                while (!done && count < 10) {
                                    // Randomize the matching items
                                    shuffle(matchingItems);

                                    var diffs = 0;
                                    // Count differences
                                    angular.forEach(question.answers, function (answer, i) {
                                        if (matchingItems[i].matchId != answer.matchId) diffs++;
                                    });
                                    // Must be at least 50% different
                                    if (diffs >= Math.ceil(matchingItems.length * 0.5)) done = true;
                                    count++;
                                }

                            } else {
                                $scope.$parent.canContinue = true;
                            }
                        }
                        else if (question.type.id == helperService.questionTypes.sequencing.id) {

                            // Load the match item array
                            var seqItems = [];
                            angular.forEach(question.answers, function (answer) {
                                seqItems.push({
                                    id: answer.id,
                                    answer: answer.answer
                                });
                            });
                            var done = false;
                            var count = 0;
                            while (!done && count < 10) {
                                // Randomize the seq items
                                shuffle(seqItems);

                                var diffs = 0;
                                // Count differences
                                angular.forEach(question.answers, function (answer, i) {
                                    if (seqItems[i].id != answer.id) diffs++;
                                });
                                // Must be at least 50% different
                                if (diffs >= Math.ceil(seqItems.length * 0.5)) done = true;
                                count++;
                            }

                            question.seqItems = seqItems;
                            if (!$scope.$parent.challenge.result && !question.result) {

                                question.selectedSeqItem = null;
                                $scope.shownHint = null;
                                $scope.shownHintCount = null;
                                $scope.notShowHintPoint = true;
                                                             
                            } else {
                                seqItems = [];
                                question.seqItems = seqItems;
                                angular.forEach(question.answers, function (answer) {
                                   
                                    question.selectedSeqItem = answer;
                                    question.seqItems.push(question.selectedSeqItem);
                                });
                                $scope.$parent.canContinue = true;
                            }
                        }
                        else if (question.type.id == helperService.questionTypes.sentenceBuilder.id) {
                            var items = [];
                            angular.forEach(question.answers, function (answer) {
                                items.push({
                                    id: answer.id,
                                    answer: answer.answer,
                                    inResult: false
                                });
                            });
                            var done = false;
                            var count = 0;
                            while (!done && count < 10) {
                                // Randomize the items
                                shuffle(items);

                                var diffs = 0;
                                // Count differences
                                angular.forEach(question.answers, function (answer, i) {
                                    if (items[i].id != answer.id) diffs++;
                                });
                                // Must be at least 50% different
                                if (diffs >= Math.ceil(items.length * 0.5)) done = true;
                                count++;
                            }
                            question.items = items;
                            question.resultItems = [];
                            question.result = '';
                          
                        
                            if ((!$scope.$parent.challenge.result) && !question.result) {
                               
                                angular.forEach(question.answers, function (answer) {

                                    answer.inResult = false;
                                    question.result = null;
                                });
                                             
                              } else {
                                angular.forEach(question.answers, function (answer) {
                                    answer.inResult = true;
                                    question.result += ' ' + answer.answer;
                                   
                                 //  question.resultItems.push(question.result);
                                });
                             
                                $scope.$parent.canContinue = true;
                            }
                        }
                        else if (question.type.id == helperService.questionTypes.contrasting.id) {
                            question.similarityResults = [];
                            question.differenceResults = [];
                            
                            if (!$scope.$parent.challenge.result) {
                                angular.forEach(question.answers, function (answer) {
                                    answer.inResult = false;
                                    if (answer.correct) question.similarityResults.push({ result: null });
                                    else question.differenceResults.push({ result: null });
                                });
                            } else {
                                angular.forEach(question.answers, function (answer) {
                                    answer.inResult = false;
                                    if (answer.correct) question.similarityResults.push({ result: answer.answer });
                                    else question.differenceResults.push({ result: answer.answer });
                                });

                                $scope.$parent.canContinue = true;
                            }
                        }
                        else if (question.type.id == helperService.questionTypes.grouping.id) {
                            var a = null;
                            var answers = [];
                            if (!question.groupItems) {
                                question.groupItems = [];
                                angular.forEach(question.answers, function (answer) {
                                    if (answer.answer[0] !== '@') {
                                        a = {
                                            answer: answer.answer,
                                            items: [],
                                            resultItems: []
                                        };
                                        answers.push(a);
                                    }
                                    else {
                                        var gi = {
                                            item: answer.answer.replace('@', '')
                                        };
                                        a.items.push(gi);
                                        question.groupItems.push(gi);
                                    }
                                });
                                question.answers = answers;

                                // Randomize the group items
                               shuffle(question.groupItems);
                            }
                            if (!$scope.$parent.challenge.result && !question.result) {
                                angular.forEach(question.answers, function (answer) {
                                    answer.selectedResultItem = null;
                                });
                            } else {
                                angular.forEach(question.answers, function (answer) {
                                    answer.resultItems = [];
                                    for (var i = 0; i < answer.items.length; i++) {
                                       
                                       answer.resultItems.push(answer.items[i]);
                                    }
                                    question.selectedGroupItem = answer.resultItems;
                                   
                                });
                                question.groupItems = [];
                                $scope.$parent.canContinue = true;
                            }
                        }
                    });

                }//end of if challenge contains question

                angular.forEach($scope.$parent.challenge.media, function (media) {

                    if (media.type == 'video') {
                        if (media.source == 'youtube') {
                            if (typeof media.iframe == 'string') {
                                media.iframe = $sce.trustAsHtml(media.iframe);
                            }
                        }
                        else {
                            media.playing = false;
                            if (typeof media.url == 'string') {
                                
                                media.sources = [];
                                var url = authService.apiUrl + '/sv/get-available-formats/' + media.ref;

                                $http.get(url).success(function (response) {
                                    //console.log(response);
                                    if (response.indexOf('.ogv') != -1) {
                                        media.sources = [{ src: $sce.trustAsResourceUrl(media.url + '.ogv'), type: 'video/ogg' }];
                                    }
                                    if (response.indexOf('.webm') != -1) {
                                        media.sources = [{ src: $sce.trustAsResourceUrl(media.url + '.webm'), type: 'video/webm' }];
                                    }
                                    if (response.indexOf('.mp4') != -1) {
                                        media.sources = [{ src: $sce.trustAsResourceUrl(media.url + '.mp4'), type: 'video/mp4' }];
                                    }
                                    media.formatsLoaded = true;

                                });

                            }

                        }
                    }
                    else if (media.type == 'audio') {
                        media.api = null;
                        if (typeof media.url == 'string') {
                            media.sources = [
                                { src: $sce.trustAsResourceUrl(media.url), type: 'audio/mp3' }
                            ];
                        }
                    }
                });
                $scope.showUntouchedMsg = false;
                $scope.scrollToTop();
                
            }
            $timeout(function () {
                angular.element('#target-anchor a').attr('target', '_blank');
            });

            $timeout(function () {
                $scope.$parent.challengeChanging = false;
                console.log("Question loaded challengeChanging is: " + $scope.$parent.challengeChanging);
            }, 1000);
            
        };

        controllerState
            .state('challenge', {
                url: '/challenge/:challengeIndex',
                onEnter: initState
            });

        var resetVal = function () {
            $scope.val = {
                wrong: false,
                correct: false
            };
            $scope.$parent.canContinue = false;
            $scope.showHints = false;
            $scope.notShowHintPoint = true;
            //$scope.shownHint = null;
        };
        resetVal();

        $scope.checkLabel = function (challenge) {
            if (!challenge) return null;
            if (challenge.questions.length == 1) return 'Check Answer';
            return 'Check Answers';
        };

        var validate = function (challenge) {
            var correct = true;

            angular.forEach(challenge.questions, function (question) {
                switch (question.type.id) {
                    case helperService.questionTypes.singleSelect.id:
                        if (!question.selected) correct = false;
                        else correct = question.answers[parseInt(question.selected)].correct;

                        break;
                    case helperService.questionTypes.multiSelect.id:
                        correct = true;
                        angular.forEach(question.answers, function (val, key) {
                            if (val.isSelected !== undefined && val.isSelected === true) {
                                if (!val.correct)
                                    correct = false;
                            }
                            else if (val.correct === true)
                                correct = false;

                        });
                        break;
                    case helperService.questionTypes.poll.id:
                        correct = false;
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].selected) {
                                correct = true;
                                break;
                            }
                        }
                       break;
                    case helperService.questionTypes.pollMultiSelect.id:
                        var cnt = 0;
                        
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].selected)
                                cnt++;
                        }
                        correct = (question.selectCount == 0 && cnt > 0) || (cnt == question.selectCount);

                        break;
                    case helperService.questionTypes.narrative.id:
                        if (!question.result) correct = false;
                        break;
                    case helperService.questionTypes.fillBlank.id:
                        correct = true;
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].correct) {
                                if (!question.answers[i].result) {
                                    correct = false;
                                    break;
                                }
                                if (question.answers[i].result.replace(/[^a-z0-9]/gi, '').toLowerCase() !=
                                    question.answers[i].answer.replace(/[^a-z0-9]/gi, '').toLowerCase()) {
                                    correct = false;
                                    break;
                                }
                            }
                        }
                        break;
                    case helperService.questionTypes.matching.id:
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].matchId != question.matchingItems[i].matchId) {
                                correct = false;
                                break;
                            }
                        }
                        break;
                    case helperService.questionTypes.shortAnswer.id:
                        correct = false;
                        if (!question.result) break;

                        var check = question.result.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase();
                        for (var i = 0; i < question.answers.length; i++) {
                            if (check === question.answers[i].answer.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase()) {
                                question.matchAnswerId = question.answers[i].answer.id;
                                correct = true;
                                break;
                            }
                        }
                        break;
                    case helperService.questionTypes.contrasting.id:
                        correct = true;

                        angular.forEach(question.answers, function (answer) {
                            answer.inResult = false;
                        });

                        for (var i = 0; i < question.similarityResults.length; i++) {
                            if (!question.similarityResults[i].result) {
                                correct = false;
                                break;
                            }
                            var found = false;
                            var check = question.similarityResults[i].result.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase();
                            for (var j = 0; j < question.answers.length; j++) {
                                if (!question.answers[j].correct) continue;

                                if (question.answers[j].answer.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase() === check) {
                                    if (question.answers[j].inResult) break;
                                    question.answers[j].inResult = true;
                                    found = true;
                                    break;
                                }
                            }
                            correct = found;
                            if (!correct) break;
                        }
                        if (!correct) break;
                        for (var i = 0; i < question.differenceResults.length; i++) {
                            if (!question.differenceResults[i].result) {
                                correct = false;
                                break;
                            }
                            var found = false;
                            var check = question.differenceResults[i].result.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase();
                            for (var j = 0; j < question.answers.length; j++) {
                                if (question.answers[j].correct) break;

                                if (question.answers[j].answer.replace(/([^a-z0-9])|(\s)/gi, '').toLowerCase() === check) {
                                    if (question.answers[j].inResult) break;
                                    question.answers[j].inResult = true;
                                    found = true;
                                    break;
                                }
                            }
                            correct = found;
                            if (!correct) break;
                        }
                        break;
                    case helperService.questionTypes.sentenceBuilder.id:
                        if (question.resultItems.length != question.answers.length) {
                            correct = false;
                        }
                        else {
                            for (var i = 0; i < question.answers.length; i++) {
                                if (question.answers[i].id != question.resultItems[i].id) {
                                    correct = false;
                                    break;
                                }
                            }
                        }
                        break;
                    case helperService.questionTypes.freeContrasting.id:
                        break;
                    case helperService.questionTypes.sequencing.id:
                        for (var i = 0; i < question.answers.length; i++) {
                            if (question.answers[i].id != question.seqItems[i].id) {
                                correct = false;
                                break;
                            }
                        }
                        break;
                    case helperService.questionTypes.grouping.id:

                        correct = true;
                        for (var i = 0; i < question.answers.length; i++) {
                            var answer = question.answers[i];


                            for (var j = 0; j < answer.items.length; j++) {
                                var item = answer.items[j];

                                var found = false;
                                for (var k = 0; k < answer.resultItems.length; k++) {
                                    if (answer.resultItems[k].item === item.item) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (!found) {
                                    correct = false;
                                    break;
                                }
                                if (!correct) break;
                            }
                            if (!correct) break;
                        }
                        break;

                }
            });

            return correct;
        };

        var updateScore = function (challenge) {
            // Set the complete flag
            challenge.complete = true;
            if ($scope.shownHint != null) {
                console.log("inside updateScore $scope.availablePoints: " + $scope.availablePoints);
                challenge.score.points.earned = $scope.availablePoints;
            } else {
                challenge.score.points.earned = challenge.score.points.total;
            }


            // Update the quest!
            $scope.quest.challengesComplete++;
            $scope.quest.score.points.earned += challenge.score.points.earned;

            // Update the program
            $scope.program.score.points.earned += challenge.score.points.earned;
            if ($scope.quest.challengesComplete == $scope.quest.challenges.length) $scope.program.questsComplete++;
        };

        var recordResult = function (challenge) {

            return $q(function (resolve, reject) {
                var resultItems = [];

                //angular.forEach(challenge.questions, function (question) {
                //    switch (question.type.id) {
                //        case helperService.questionTypes.singleSelect.id:
                //            resultItems.push({
                //                questionId: question.id,
                //                answerId: question.answers[parseInt(question.selected)].id,
                //                data: null
                //            });
                //            break;
                //        case helperService.questionTypes.multiSelect.id:
                //            angular.forEach(question.answers, function (answer) {
                //                resultItems.push({ questionId: question.id, answerId: answer.id, data: null });
                //            });
                //            break;
                //        case helperService.questionTypes.poll.id:
                //            var selAnswer;
                //            for (var i = 0; i < question.answers.length; i++) {
                //                if (question.answers[i].selected) {
                //                    selAnswer = question.answers[i];
                //                    break;
                //                }
                //            }
                //            resultItems.push({ questionId: question.id, answerId: selAnswer.id, data: null });
                //            break;
                //        case helperService.questionTypes.pollMultiSelect.id:
                //            angular.forEach(question.answers, function (answer) {
                //                if (answer.selected) {
                //                    resultItems.push({ questionId: question.id, answerId: answer.id, data: null });
                //                }
                //            });
                //            break;
                //        case helperService.questionTypes.narrative.id:
                //            resultItems.push({ questionId: question.id, answerId: null, data: question.result });
                //            break;
                //        case helperService.questionTypes.fillBlank.id:
                //            angular.forEach(question.answers, function (answer) {
                //                if (answer.correct) {
                //                    resultItems.push({
                //                        questionId: question.id,
                //                        answerId: answer.id,
                //                        data: answer.result
                //                    });
                //                }
                //            });
                //            break;
                //        case helperService.questionTypes.matching.id:
                //            angular.forEach(question.answers, function (answer) {
                //                resultItems.push({ questionId: question.id, answerId: answer.id, data: null });
                //            });
                //            break;
                //        case helperService.questionTypes.shortAnswer.id:
                //            resultItems.push({
                //                questionId: question.id,
                //                answerId: question.matchAnswerId,
                //                data: question.result
                //            });
                //            break;
                //        case helperService.questionTypes.contrasting.id:
                //            angular.forEach(question.answers, function (answer) {
                //                resultItems.push({ questionId: question.id, answerId: answer.id, data: null });
                //            });
                //            break;
                //        case helperService.questionTypes.sentenceBuilder.id:
                //            angular.forEach(question.answers, function (answer) {
                //                resultItems.push({ questionId: question.id, answerId: answer.id, data: null });
                //            });
                //            break;
                //        case helperService.questionTypes.freeContrasting.id:
                //            resultItems.push({ questionId: question.id, answerId: null, data: null });
                //            break;
                //        case helperService.questionTypes.sequencing.id:
                //            angular.forEach(question.answers, function (answer) {
                //                resultItems.push({ questionId: question.id, answerId: answer.id, data: null });
                //            });
                //            break;
                //        case helperService.questionTypes.grouping.id:
                //            resultItems.push({ questionId: question.id, answerId: null, data: null });
                //            break;

                //    }
                //});

                angular.forEach(challenge.questions, function (question) {
                    switch (question.type.id) {
                        case helperService.questionTypes.singleSelect.id:

                            resultItems.push({
                                questionId: question.id,
                                answerId: question.answers[parseInt(question.selected)].id,
                                data: null,
                                score: finalScoreofChallenge
                            });
                            break;
                        case helperService.questionTypes.multiSelect.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({
                                    questionId: question.id, answerId: answer.id, data: null, score: finalScoreofChallenge
                                });
                            });
                            break;
                        case helperService.questionTypes.poll.id:
                            var selAnswer;
                            for (var i = 0; i < question.answers.length; i++) {
                                if (question.answers[i].selected) {
                                    selAnswer = question.answers[i];
                                    break;
                                }
                            }
                            resultItems.push({ questionId: question.id, answerId: selAnswer.id, data: null, score: finalScoreofChallenge });

                            break;
                        case helperService.questionTypes.pollMultiSelect.id:
                            angular.forEach(question.answers, function (answer) {
                                if (answer.selected) {
                                    resultItems.push({ questionId: question.id, answerId: answer.id, data: null, score: finalScoreofChallenge });
                                }
                            });
                            break;
                        case helperService.questionTypes.narrative.id:
                            resultItems.push({ questionId: question.id, answerId: null, data: question.result, score: finalScoreofChallenge });
                            break;
                        case helperService.questionTypes.fillBlank.id:
                            angular.forEach(question.answers, function (answer) {
                                if (answer.correct) {
                                    resultItems.push({
                                        questionId: question.id,
                                        answerId: answer.id,
                                        data: answer.result,
                                        score: finalScoreofChallenge
                                    });
                                }
                            });
                            break;
                        case helperService.questionTypes.matching.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({ questionId: question.id, answerId: answer.id, data: null, score: finalScoreofChallenge });
                            });
                            break;
                        case helperService.questionTypes.shortAnswer.id:
                            resultItems.push({
                                questionId: question.id,
                                answerId: question.matchAnswerId,
                                data: question.result,
                                score: finalScoreofChallenge
                            });
                            break;
                        case helperService.questionTypes.contrasting.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({ questionId: question.id, answerId: answer.id, data: null, score: finalScoreofChallenge });
                            });
                            break;
                        case helperService.questionTypes.sentenceBuilder.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({ questionId: question.id, answerId: answer.id, data: null, score: finalScoreofChallenge });
                            });
                            break;
                        case helperService.questionTypes.freeContrasting.id:
                            resultItems.push({ questionId: question.id, answerId: null, data: null, score: finalScoreofChallenge });
                            break;
                        case helperService.questionTypes.sequencing.id:
                            angular.forEach(question.answers, function (answer) {
                                resultItems.push({ questionId: question.id, answerId: answer.id, data: null, score: finalScoreofChallenge });
                            });
                            break;
                        case helperService.questionTypes.grouping.id:
                            resultItems.push({ questionId: question.id, answerId: null, data: null, score: finalScoreofChallenge });
                            break;

                    }
                });

                // Record challenge result
                $http.post(authService.apiUrl + '/challenges/' + challenge.id + '/complete', { resultItems: resultItems })
                    .success(function () {
                        updateScore(challenge);
                        challenge.result = {
                            items: resultItems
                        };
                        $rootScope.showPointsAwardedNotification(challenge.points);
                        //$scope.refreshDiscussion(); dont trigger discussion refresh at submit. 
                        $scope.scrollToMsg();
                        resolve();
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });

        };

        $scope.submit = function (e, challenge) {
            e.preventDefault();
            resetVal();

            if (!isActivitySaving) {
                isActivitySaving = true;
                $scope.showUntouchedMsg = false;
                //check to see if challenge has questions if yes then continue normal. else simply submit
                if (challenge.questions.length > 0) {
                    if ($scope.challengeQuestions.$dirty) {
                        $timeout(function () {
                            // Is answer correct?
                            if (validate(challenge)) {

                                if ($scope.shownHint != null) {
                                    finalScoreofChallenge = $scope.hintsAry[$scope.shownHint].points;
                                } else {
                                    finalScoreofChallenge = challenge.points;
                                }
                                // Record the result
                                recordResult(challenge)
                                    .then(function () {
                                        $scope.challengeQuestions.$setPristine();
                                        $scope.val.correct = true;
                                        $scope.$parent.canContinue = true;
                                        isActivitySaving = false;
                                        if ($scope.shownHint != null) {
                                            $rootScope.showPointsAwardedNotification($scope.hintsAry[$scope.shownHint].points);
                                        } else {
                                            $rootScope.showPointsAwardedNotification(challenge.points);
                                        }

                                    });
                            }
                            else {
                                $scope.$parent.canContinue = false;
                                $scope.val.wrong = true;
                                $scope.notShowHintPoint = false;
                                if ($scope.hintsAry.length != 0) {

                                    if ($scope.shownHint == null) {
                                        $scope.shownHint = 0;
                                        $scope.shownHintCount = 0;
                                        isActivitySaving = false;
                                    } else {
                                        if ($scope.shownHint < $scope.hintsAry.length - 1) {
                                            $scope.shownHint++;
                                        }
                                        $scope.shownHintCount++;
                                        isActivitySaving = false;
                                    }

                                    if ($scope.shownHintCount < 3) {
                                        console.log("before overloay call with point $scope.availablePoints: " + $scope.availablePoints);
                                        if ($scope.$parent.availablePoints != $scope.hintsAry[$scope.shownHint].points) {
                                            $scope.$parent.availablePoints = $scope.hintsAry[$scope.shownHint].points;
                                            $rootScope.showHintPointsDeductNotification($scope.hintsAry[$scope.shownHint].points);
                                        } else {
                                            $scope.$parent.availablePoints = $scope.hintsAry[$scope.shownHint].points;
                                        }
                                        $scope.scrollToMsg();
                                        isActivitySaving = false;
                                    }
                                }
                                else {
                                    $scope.scrollToMsg();
                                    isActivitySaving = false;
                                }
                            }
                        }, 0)
                    } else {
                        $scope.showUntouchedMsg = true;
                        isActivitySaving = false;
                    }
                } else {
                    // Record the result
                    recordResult(challenge)
                        .then(function () {
                            $scope.challengeQuestions.$setPristine();
                            $scope.val.correct = true;
                            $scope.$parent.canContinue = true;
                            isActivitySaving = false;

                            if ($scope.shownHint != null) {
                                $rootScope.showPointsAwardedNotification($scope.hintsAry[$scope.shownHint].points);
                            } else {
                                $rootScope.showPointsAwardedNotification(challenge.points);
                            }


                        });
                }



            }

        };

        $scope.$on('navToNextChallenge', function (e, args) {
            nextChallenge(args[0]);
        });

        $scope.$on('navToPreviousChallenge', function (e, args) {
            previousChallenge(args[0]);

        });

        $scope.scrollToTop = function () {
            $('#chal-section').animate({ scrollTop: $('#chal-section').scrollTop }, 'slow');
        };

        $scope.scrollToMsg = function () {
            $timeout(function () {
                var elm = $('.success-response:visible');
                if (elm.length <= 0) elm = $('.failure-response:visible');
                if (elm.length > 0) {
                    var challengeSection = $('#chal-section');

                    if (challengeSection[0] && $.contains(challengeSection[0], elm[0])) {
                        $('html,body').animate({ scrollTop: elm.offset().top - 40 }, 'slow');
                        $('#chal-section').animate({ scrollTop: ((($(elm).offset().top - $(elm).closest('#chal-section').offset().top) + $(elm).closest('#chal-section').scrollTop()) - 40) }, 'slow');
                    } else {
                        $('html,body').animate({ scrollTop: elm.offset().top - 40 }, 'slow');
                    }
                }
            }, 0);
        };

        var nextChallenge = function (challenge) {
            
            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                $scope.close();
            } else {
                var next = $scope.challengeIndex + 1;
                challenge = (next <= $scope.quest.challenges.length - 1) ?
                    $scope.quest.challenges[next] : null;

                //get current available points
                if (challenge != null) {
                    $scope.$parent.availablePoints = $scope.quest.challenges[next].points;
                    //console.log("next challenge $scope.$parent.availablePoints: " + $scope.$parent.availablePoints);

                    //get the hints of challenge.
                    if ($scope.quest.challenges[next].questions.length > 0) {
                        $scope.shownHint = null;
                        $scope.hintsAry = $scope.quest.challenges[next].questions[0].hints ? $scope.quest.challenges[next].questions[0].hints : null;
                    }

                }

                // Are we done with the quest?
                if (!challenge || challenge.type == 'finish') {
                    // Goto finish challenge!
                    controllerState.go('finish');
                }
                else {
                    // Goto next challenge!
                    $scope.challengeQuestions.$setPristine();

                    if (!$scope.$parent.challengeChanging) {
                        console.log("Page not changing so change page.");
                        $scope.$parent.challengeChanging = true;
                        console.log("next challenge challengeChanging is: " + $scope.$parent.challengeChanging);

                        controllerState.go('challenge', {
                            challengeIndex: next,
                            challenge: $scope.quest.challenges[next]
                        });
                    } else {
                        console.log("Page change in progess.");
                    }
                }
            }
        };

        var previousChallenge = function (challenge) {
            if ($scope.preview && $scope.preview.indexOf('challenge/') != -1) {
                $scope.close();
            } else {
                var next = $scope.challengeIndex - 1;
                challenge = (next < 0) ?
                    $scope.quest.challenges[next] : null;

                //get current available point and set hint point to null
                $scope.$parent.availablePoints = $scope.quest.challenges[next].points;
                console.log("previous challenge $scope.$parent.availablePoints: " + $scope.$parent.availablePoints);

                //get the hints of challenge. first set to null
                $scope.shownHint = null;
                if ($scope.quest.challenges[next].questions.length > 0) {
                    $scope.hintsAry = $scope.quest.challenges[next].questions[0].hints ? $scope.quest.challenges[next].questions[0].hints : null;
                } else {
                    $scope.hintsAry = null;
                }


                var count = $scope.challengeIndex;
                var upcomChallenge = null;
                upcomChallenge = $scope.quest.challenges[count];
                $scope.setUpcomingChallenge(upcomChallenge);

                // Goto next challenge!
                $scope.challengeQuestions.$setPristine();
                controllerState.go('challenge', {
                    challengeIndex: next,
                    challenge: $scope.quest.challenges[next]
                });

            }
        };

        $scope.continue = function (challenge) {
            // Does challenge have any questions? Result was handled in submit.
            if (challenge.questions.length > 0) {
                return nextChallenge(challenge);
            } else {
                recordResult(challenge)
                    .then(function () {
                        nextChallenge(challenge);
                    });
            }
        };

        $scope.playerReady = function (media, api) {
            media.api = api;

        };
        $scope.playVideo = function (media) {
        if (!media.api) return;
        media.playing = true;
        media.api.play();
        };
      

        $scope.matchItemDrop = function (event, index, item, external, type, itemType, question) {
            $scope.challengeQuestions.$setDirty();//sets form to dirty
            question.selectedMatchItem = item;
            return item;
        };
        $scope.matchItemMoveUp = function (e, question, index, matchItem) {
            e.preventDefault();
            e.stopPropagation();
            if (index <= 0) return;

            // Remove from
            question.matchingItems.splice(index, 1);
            index--;
            question.matchingItems.splice(index, 0, matchItem);
            question.selectedMatchItem = matchItem;
            $scope.challengeQuestions.$setDirty();//sets form to dirty
        };
        $scope.matchItemMoveDown = function (e, question, index, matchItem) {
            e.preventDefault();
            e.stopPropagation();

            if (index >= question.matchingItems.length - 1) return;

            // Remove from
            question.matchingItems.splice(index, 1);
            index++;
            question.matchingItems.splice(index, 0, matchItem);
            question.selectedMatchItem = matchItem;
            $scope.challengeQuestions.$setDirty();//sets form to dirty
        };

        $scope.seqItemDrop = function (event, index, item, external, type, itemType, question) {
            $scope.challengeQuestions.$setDirty();//sets form to dirty
            question.selectedSeqItem = item;
            return item;
        };
        $scope.seqItemMoveUp = function (e, question, index, seqItem) {
            e.preventDefault();
            e.stopPropagation();
            if (index <= 0) return;

            // Remove from
            question.seqItems.splice(index, 1);
            index--;
            question.seqItems.splice(index, 0, seqItem);
            question.selectedSeqItem = seqItem;
            $scope.challengeQuestions.$setDirty();//sets form to dirty
        };
        $scope.seqItemMoveDown = function (e, question, index, seqItem) {
            e.preventDefault();
            e.stopPropagation();

            if (index >= question.seqItems.length - 1) return;

            // Remove from
            question.seqItems.splice(index, 1);
            index++;
            question.seqItems.splice(index, 0, seqItem);
            question.selectedSeqItem = seqItem;
            $scope.challengeQuestions.$setDirty();//sets form to dirty
        };

        $scope.groupResultItemDrop = function (event, index, item, answer) {
            $scope.challengeQuestions.$setDirty();//sets form to dirty
            answer.selectedResultItem = item;
            return item;
        };
        $scope.groupItemResultRemove = function (question, answer, index, item) {
            answer.resultItems.splice(index, 1);
            question.groupItems.push(item);
        };
        $scope.groupItemDrop = function (event, index, item, question) {
            $scope.challengeQuestions.$setDirty();//sets form to dirty
            question.selectedGroupItem = item;
            return item;
        };

        $scope.builderItemClick = function (e, question, index, item) {
            e.preventDefault();
            if (item.inResult) return;
            question.resultItems.push(item);
            item.inResult = true;

            question.result = null;
            angular.forEach(question.resultItems, function (item) {
                if (!question.result) {
                    question.result = item.answer;
                } else {
                    question.result += ' ' + item.answer;
                }
            });
            $scope.challengeQuestions.$setDirty();
        };

        $scope.builderClear = function (e, question) {
            e.preventDefault();
            question.result = null;
            question.resultItems = [];
            angular.forEach(question.items, function (item) {
                item.inResult = false;
            });
        };

        $scope.$on('bodyClick', function () {
            if (!$scope.challenge) return;

            angular.forEach($scope.challenge.questions, function (question) {
                if (question.type.id == helperService.questionTypes.matching.id) {
                    question.selectedMatchItem = null;
                }
                else if (question.type.id == helperService.questionTypes.sequencing.id) {
                    question.selectedSeqItem = null;
                }
                else if (question.type.id == helperService.questionTypes.grouping.id) {
                    question.selectedGroupItem = null;
                    angular.forEach(question.answers, function (answer) {
                        answer.selectedResultItem = null;
                    });
                }
            });
        });

        /* QUIlll JS on load function   */
        $scope.editorCreated = function (editor) {
            console.log(editor);
        };
        $scope.contentChanged = function (editor, html, text) {
            $scope.changeDetected = true;
            console.log('editor: ', editor, 'html: ', html, 'text:', text);
        };

    }]);

controllers.controller('QuestPlayerFinishController', ['$scope', '$q', '$http', '$timeout', '$upload', '$window', 'controllerState', 'authService', 'helperService',
    function ($scope, $q, $http, $timeout, $upload, $window, controllerState, authService, helperService) {
        $scope.challenge = null;
        $scope.badge = null;
        $scope.media = null;
        $scope.uploadFileName = null;
        $scope.upload = {
            active: false,
            status: null,
            fade: false
        };

        var initState = function () {

            if ($scope.quest != null && $scope.quest.challenges != null && $scope.quest.challenges.length > 0) {
                var c = $scope.quest.challenges[$scope.quest.challenges.length - 1];
                if (c.type == 'finish') {
                    $scope.challenge = c;
                }
            }
            getAwardedBadges();
   
            getMedia();

            //updated navigation logic
            //now trigger a api call to get latest program status
            var url = authService.apiUrl + '/programs/' + $scope.program.slug + '/user';
            $http.get(url)
                .success(function (program) {
                    $scope.$emit('activityUpdated', program);
                }).error(function (err) {
                    reject(err);
                });


            $timeout(function () {
                $('#target-anchor a').attr('target', '_blank');
            });
        };
       

        controllerState
            .state('finish', {
                url: '/finish',
                onEnter: function (state, params) {
                    initState(state, params);
                }
            });

        $scope.isLinkFix = function (val) {
            var finalSrc = null;
            var cs1 = "https://as.jubiplatform2.com";

            //console.log(authService.apiUrl);

            if (val.indexOf(cs1) !== -1) {
                finalSrc = val;
            } else {
                var imgsrc = val.substring(0, val.length - 4);
                finalSrc = cs1 + '/' + imgsrc;
            }
            //console.log(finalSrc);



            return finalSrc;
        }


        var getMedia = function () {
            if ($scope.challenge != null) {
                var media = $scope.challenge.media;
                $scope.media = media;
            }

        };
       
        var getAwardedBadges = function () {
            return $q(function (resolve, reject) {
                var url = authService.apiUrl + '/badges/quest-badge';
                if ($scope.preview) url += '?preview=true';
              
                $http.post(url, { questId: $scope.quest.id })
                    .success(function (badge) {
                        $scope.badge = badge
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };
        var resetVal = function () {
            $scope.val = {
                upload: {
                    type: false,
                    size: false
                }
            }
        };
        resetVal();


        var fadeUploadStatus = function () {
            $timeout(function () {
                $scope.upload.fade = true;
                $timeout(function () {
                    $scope.upload.status = null;
                   
                }, 1000);
            }, 4000);
        };
        $scope.uploadFile = function (files) {
            resetVal();
            $scope.upload.status = null;
            $scope.upload.fade = false;

            if (!files || files.length <= 0) return;
            var file = files[0];
            $scope.uploadFileName = file.name;
         
            // Check type
            if (!helperService.validUploadFile(file.name)) {
                $scope.val.upload.type = true;
                return;
            }

            // Check size
            if (file.size > helperService.maxFileSize) {
                $scope.val.upload.size = true;
                return;
            }


            $scope.upload.active = true;
            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
                .success(function () {
                    $scope.upload.active = false;
                    $scope.upload.status = 'ok';
                    fadeUploadStatus();
                    if ($scope.challenge != null) {

                        $scope.challenge.media.push(file);
                    }
                    
                })
                .error(function () {
                    $scope.upload.active = false;
                    $scope.upload.status = 'err';
                    fadeUploadStatus();
                });
        };
        $scope.uploadFileTest = function (files) {
            resetVal();
            $scope.upload.status = null;
            $scope.upload.fade = false;

            if (!files || files.length <= 0) return;
            var file = files[0];
            $scope.uploadFileName = file.name;

            // Check type
            if (!helperService.validUploadFile(file.name)) {
                $scope.val.upload.type = true;
                return;
            }

            // Check size
            if (file.size > helperService.maxFileSize) {
                $scope.val.upload.size = true;
                return;
            }


            $scope.upload.active = true;
            $upload.upload({ url: authService.apiUrl + '/ur', file: file })
                .success(function (data) {
                    $scope.upload.active = false;
                    $scope.upload.status = 'ok';
                    fadeUploadStatus();
                    var userMedia = {
                        type: 'resource',
                        userId: authService.user.id,
                        name: file.name,
                        date: file.lastModifiedDate,
                        mimeType: file.type,
                        url: data.url,
                        ref: data.ref,
                        isNew: true
                    }
                    if ($scope.challenge != null) {

                        $scope.challenge.media.push(userMedia);
                    }

                })
                .error(function () {
                    $scope.upload.active = false;
                    $scope.upload.status = 'err';
                    fadeUploadStatus();
                });
        };
    }]);

controllers.controller('QuestPlayerDoController', ['$scope', '$q', '$http', '$timeout', '$upload', '$window', 'controllerState', 'authService', 'helperService', '$rootScope', '$modal', '$filter', 'ngAudio', '$sce',
    function ($scope, $q, $http, $timeout, $upload, $window, controllerState, authService, helperService, $rootScope, $modal, $filter, ngAudio,$sce) {
    
        $scope.badge = null;
        $scope.media = null;

        $scope.currentDate = new Date();
        $scope.verificationQuestionAvailable = false;
        $scope.availableScorePoint = 0;

        $scope.userEnableDueDate = true;

        var myDate = new Date();
        this.isOpen = false;
        $scope.dateIsError = false;
        $scope.minDueDate = new Date(
            myDate.getFullYear(),
            myDate.getMonth(),
            myDate.getDate()
        );

        $scope.currentQuestBonus = false;

        var afterSubmit = false;

        $scope.currentUserId = authService.user.id;

        $scope.doQuest = {
            objective: null,
            completed: false
        };

        var initState = function () {
            $scope.$parent.setCurrentActivityType('Todo');

            if ($scope.quest) {

                //$scope.challenges = $scope.quest.todos.challenges ? $scope.quest.todos.challenges : [] ;
                $scope.availableScorePoint = $scope.quest.score.points.total;
                $scope.currentQuestBonus = $scope.quest.baseOrBonus == 'O' ? true : false;
          
            }
        };

        $scope.$watch('quest', function () {
            //alert("Loaded");
            if ($scope.quest) {
                if ($scope.quest.type == 'T') {
                    $scope.doQuest.objective = $scope.quest.objective ? $scope.quest.objective : null;

                    if ($scope.quest.userToDos) {
                        $scope.formatActTodos($scope.quest.userToDos[0], false);
                    } else {
                        var todoChall = {
                            todo: $scope.quest.todos[0]
                        }
                        $scope.formatActTodos(todoChall, false);
                    }


                    if ($scope.quest.complete == true) {
                        //$scope.$parent.todoCanContinue = true;
                        $scope.$parent.canContinue = true;
                    } else {
                        //console.log("not complete" + $scope.quest.complete);
                        $scope.$parent.todoCanContinue = false;
                        $scope.$parent.canContinue = false;
                    }
                }
            }
        });

        $scope.formatActTodos = function (userTodos, afterSub, buddyValidated, fromPrev) {
            //first get todo spec
            $scope.todoActivityChallenge = userTodos;
            $scope.feedbackChallengeRes = [];
            _.each(userTodos.todo.challenges, function (chall) {
                if (chall.title == 'Todo Feedback') {
                    $scope.feedbackChallengeRes = chall.results;
                }
                if (chall.title == 'Todo Verification') {
                    $scope.verificationQuestionAvailable = true;
                }

            });
            $scope.feedbackChallenge.answer = null;

            if (afterSub) {
                if (buddyValidated) {
                    setTimeout(function () {
                        //larry decided to let user continue after submit even if buddy validated. 

                        $scope.$parent.canContinue = true;
                        $scope.$parent.todoCanContinue = true;
                        //console.log("TimeOut Trig");
                    });
                } else {
                    setTimeout(function () {
                        $scope.$parent.canContinue = true;
                        $scope.$parent.todoCanContinue = true;
                        if ($scope.$parent.alreadySubmitted == false) {
                            $rootScope.showPointsAwardedNotification($scope.todoActivityChallenge.todo.points ? $scope.todoActivityChallenge.todo.points : 0);

                            $scope.quest.score.points.earned += $scope.todoActivityChallenge.todo.points;
                        }
        
                        //console.log("TimeOut Trig");
                    });
                }

            }

        }

        $scope.$watch('todoActivityChallenge', function () {
            //alert("Loaded");
            if ($scope.todoActivityChallenge != null) {
                //console.log($scope.todoActivityChallenge)
                userDueDate();
                getChallengeMedia();
                $scope.todoOpened();
            }
        });

        var userDueDate = function () {
            if ($scope.todoActivityChallenge.todo.dueByUser == true) {
                /**Shows current date**/
                if ($scope.todoActivityChallenge.dueDate == null) {
                    var duedate = new Date();
                    $scope.currentDate = duedate;
                    //$scope.minDueDate = new Date(
                    //    duedate.getFullYear(),
                    //    duedate.getMonth(),
                    //    duedate.getDate() + 1
                    //);
                } else {
                    $scope.currentDate = new Date($scope.todoActivityChallenge.dueDate);
                }

                $scope.userEnableDueDate = true;
            } else {
                $scope.userEnableDueDate = false;
                $scope.currentDate = new Date($scope.todoActivityChallenge.todo.dueDate);
                //$scope.todoActivityChallenge.userTodos[0].dueDate = $scope.todoActivityChallenge.dueDate;
                //$scope.todoActivityChallenge.dueDate = $scope.todoActivityChallenge.dueDate;
            }
        }

        var getChallengeMedia = function () {
            $scope.challengeMedia = [];
            if (afterSubmit) {
                _.each($scope.todoActivityChallenge.userMedia, function (usrMed) {
                    if (usrMed.type == 'resource') {
                        var userMedia = {
                            type: 'resource',
                            id: usrMed.id,
                            userId: usrMed.userId,
                            name: usrMed.name,
                            url: usrMed.url,
                            ref: usrMed.ref,
                            description: usrMed.description,
                            isNew: false
                        };
                        $scope.challengeMedia.push(userMedia);
                    }
                    if (usrMed.type == 'image') {
                        var userMedia = {
                            type: 'image',
                            id: usrMed.id,
                            userId: usrMed.userId,
                            name: usrMed.name,
                            url: usrMed.url,
                            ref: usrMed.ref,
                            description: usrMed.description,
                            isNew: false
                        };
                        $scope.challengeMedia.push(userMedia);
                    }
                    if (usrMed.type == 'video') {
                        if (usrMed.source == 'youtube') {

                            var userMedia = {
                                type: 'video',
                                id: usrMed.id,
                                userId: usrMed.userId,
                                coverUrl: usrMed.coverUrl,
                                iframe: usrMed.data,
                                name: usrMed.name,
                                url: usrMed.url,
                                ref: usrMed.ref,
                                description: usrMed.description,
                                source: 'youtube',
                                isNew: false
                            };

                            $scope.challengeMedia.push(userMedia);
                        } else {
                            var userMedia = {
                                type: 'video',
                                id: usrMed.id,
                                userId: usrMed.userId,
                                name: usrMed.name,
                                url: usrMed.url,
                                ref: usrMed.ref,
                                description: usrMed.description,
                                source: 'system',
                                encodings: [],
                                isNew: false,
                                isReady: true
                            };

                            $scope.checkEncoding(userMedia);
                            $scope.challengeMedia.push(userMedia);
                        }
                    }
                    if (usrMed.type == 'audio') {
                        usrMed.api = null;
                        usrMed.sources = [];
                        if (typeof usrMed.url == 'string') {
                            usrMed.sources = [
                                { src: $sce.trustAsResourceUrl(usrMed.url), type: 'audio/mp3' }
                            ];
                        }
                        var userMedia = {
                            type: 'audio',
                            id: usrMed.id,
                            userId: usrMed.userId,
                            name: usrMed.name,
                            url: usrMed.url,
                            ref: usrMed.ref,
                            description: usrMed.description,
                            isNew: false,
                            sources: usrMed.sources,
                            isReady: true
                        };
                        $scope.challengeMedia.push(userMedia);
                    }
                });
            } else {
                if ($scope.todoActivityChallenge.todo.userTodos.length > 0) {
                    _.each($scope.todoActivityChallenge.todo.userTodos[0].userMedia, function (usrMed) {
                        if (usrMed.type == 'resource') {
                            var userMedia = {
                                type: 'resource',
                                id: usrMed.id,
                                userId: usrMed.userId,
                                name: usrMed.name,
                                url: usrMed.url,
                                ref: usrMed.ref,
                                description: usrMed.description,
                                isNew: false
                            };
                            $scope.challengeMedia.push(userMedia);
                        }
                        if (usrMed.type == 'image') {
                            var userMedia = {
                                type: 'image',
                                id: usrMed.id,
                                userId: usrMed.userId,
                                name: usrMed.name,
                                url: usrMed.url,
                                ref: usrMed.ref,
                                description: usrMed.description,
                                isNew: false
                            };
                            $scope.challengeMedia.push(userMedia);
                        }
                        if (usrMed.type == 'video') {
                            if (usrMed.source == 'youtube') {

                                var userMedia = {
                                    type: 'video',
                                    id: usrMed.id,
                                    userId: usrMed.userId,
                                    coverUrl: usrMed.coverUrl,
                                    iframe: usrMed.data,
                                    name: usrMed.name,
                                    url: usrMed.url,
                                    ref: usrMed.ref,
                                    description: usrMed.description,
                                    source: 'youtube',
                                    isNew: false
                                };

                                $scope.challengeMedia.push(userMedia);
                            } else {

                                var userMedia = {
                                    type: 'video',
                                    id: usrMed.id,
                                    userId: usrMed.userId,
                                    name: usrMed.name,
                                    url: usrMed.url,
                                    ref: usrMed.ref,
                                    description: usrMed.description,
                                    source: 'system',
                                    encodings: [],
                                    isNew: false,
                                    isReady: true
                                };

                                $scope.checkEncoding(userMedia);
                                $scope.challengeMedia.push(userMedia);
                            }
                        }
                        if (usrMed.type == 'audio') {
                            usrMed.api = null;
                            usrMed.sources = [];
                            if (typeof usrMed.url == 'string') {
                                usrMed.sources = [
                                    { src: $sce.trustAsResourceUrl(usrMed.url), type: 'audio/mp3' }
                                ];
                            }
                            var userMedia = {
                                type: 'audio',
                                id: usrMed.id,
                                userId: usrMed.userId,
                                name: usrMed.name,
                                url: usrMed.url,
                                ref: usrMed.ref,
                                description: usrMed.description,
                                isNew: false,
                                sources: usrMed.sources,
                                isReady: true
                            };
                            $scope.challengeMedia.push(userMedia);
                        }
                    });
                }
            }
        };


        var getAwardedBadges = function () {
            return $q(function (resolve, reject) {
                var url = authService.apiUrl + '/badges/quest-badge';
                if ($scope.preview) url += '?preview=true';
              
                $http.post(url, { questId: $scope.quest.id })
                    .success(function (badge) {
                        $scope.badge = badge
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };

        $scope.formatTime = function (t) {
            var m = moment(t);
            var diff = (moment().valueOf() - m.valueOf()) / 1000;

            if (diff <= 60) return 'Just Now';
            //if (diff <= 60 * 60 * 24) return 'Earlier Today';
            //if (diff <= 60 * 60 * 24 * 2) return 'Yesterday';
            //if (diff <= 60 * 60 * 24 * 7) return 'Earlier This Week';
            return m.format('MMM D, YYYY @ h:mm a');
        };

        $scope.newDataEntered = function () {
            $scope.$parent.todoCanContinue = false;

        };

        /*********Form data and error array***********************/
        $scope.errArry = {
            doFeedMsg: false,
            doAnsMsg: false,
        };
        $scope.challengeMedia = [];
        
        
        //models
        $scope.feedbackChallenge = {
            answer: null
        };
        $scope.toDoModel = {
            title: null,
            content: null,
            category: null,
            networkUsers: [],
            sharing: 'all',
            media: []
        };

        var resetVal = function () {
            $scope.val = {
                upload: {
                    type: false,
                    size: false
                }
            }
        };
        resetVal();

        $scope.$on('addMediatoTodoModal', function (e, args) {
            //$scope.toDoModel.media.push(args);

            if (args.type == 'audio') {
                args.api = null;
                args.sources = [];
                if (typeof args.url == 'string') {
                    args.sources = [
                        { src: $sce.trustAsResourceUrl(args.url), type: 'audio/mp3' }
                    ];
                }
                $scope.challengeMedia.push(args);
            } else {
                $scope.challengeMedia.push(args);
            }

            $scope.$parent.todoCanContinue = false;

            $scope.toDoActivityQuestions.$setDirty();
           
            //console.log("challengeMedia" + $scope.challengeMedia);

        });
        $scope.$on('repMedaiTodoModal', function (e, args) {
            //find the media that just returned and then replace it.

            _.each($scope.challengeMedia, function (media, i) {
                if (media.name === args.name) {
                    $scope.challengeMedia.splice($scope.challengeMedia[i], 1, args);
                }
            });

            //_.each($scope.newAddedMedia, function (media, i) {
            //    if (media.name === args.name) {
            //        $scope.newAddedMedia.splice($scope.newAddedMedia[i], 1, args);
            //    }
            //});
        });

        $scope.checkEncoding = function (media) {
            if (media.url) {
                $http.get(authService.apiUrl + '/uv/encoded?url=' + media.url)
                    .success(function (result) {
                        if (result.encodings.length < 1) return $timeout(function () {
                            $scope.checkEncoding(media);
                        }, 5000);
                        media.encodings = result.encodings;
                    });
            }
        };

        controllerState
            .state('do', {
                url: '/do',
                onEnter: initState
            });

        $scope.dateChanged = function (date) {
            $scope.dateIsError = false;
            var m = moment(date);
            if (m.isValid()) {
                $scope.currentDate = date;

            } else {
                $scope.currentDate = null;
            }
            //console.log($scope.currentDate);
        };

        /*****************************check the img src and add apirul if needed ***********************/
        $scope.isLinkFix = function (val) {
            var finalSrc = null;
            var cs1 = "https://as.jubiplatform2.com";
            

            //console.log(authService.apiUrl);
            if (val != null) {
                if (val.indexOf(cs1) !== -1) {
                    finalSrc = val;
                } else {
                    var imgsrc = val.substring(0, val.length - 4);
                    finalSrc = cs1 + '/' + imgsrc;
                }
            }

            //console.log(finalSrc);



            return finalSrc;
        }

        $scope.isResourceLinkFix = function (val) {
            var finalSrc = null;
            var cs1 = requestChecker();

            //console.log(authService.apiUrl);
            if (val != null) {
                if (val.indexOf(cs1) !== -1) {
                    finalSrc = val;
                } else {
                    var imgsrc = val.substring(0, val.length);
                    finalSrc = cs1 + '/' + imgsrc;
                }
            }

            //console.log(finalSrc);
            return finalSrc;
        }

        var browserDetection = function () {
            var browserType = 'Chrome';
            //Check if browser is IE
            if (navigator.userAgent.search("MSIE")) {
                // insert conditional IE code here
                browserType = 'IE';
            }
            //Check if browser is Chrome
            else if (navigator.userAgent.search("Chrome")) {
                // insert conditional Chrome code here
                browserType = 'Chrome';
            }
            //Check if browser is Firefox 
            else if (navigator.userAgent.search("Firefox")) {
                // insert conditional Firefox Code here
                browserType = 'Firefox';
            }
            //Check if browser is Safari
            else if (navigator.userAgent.search("Safari")) {
                // insert conditional Safari code here
                browserType = 'Safari';
            }
            //Check if browser is Opera
            else if (navigator.userAgent.search("Opera")) {
                // insert conditional Opera code here
                browserType = 'Opera';
            }
            return browserType;
        }


        var requestChecker = function () {
            //includes does not work with IE. therefore will need to try excuting below before we proceed.

            if (authService.apiUrl.indexOf('as.jubiplatform2.com') !== -1) {
                return 'https://as.jubiplatform2.com';
            } else if (authService.apiUrl.indexOf('as.jubi.local') !== -1) {
                return 'http://as.jubiplatform-qa.com';
            } else {
                return authService.apiUrl;
            }



            //switch (browserDetection()){
            //    case 'IE':
            //        if (authService.apiUrl.indexOf('as.jubiplatform2.com') !== -1) {
            //            return 'https://as.jubiplatform2.com';
            //        } else if (authService.apiUrl.indexOf('as.jubi.local') !== -1) {
            //            return 'http://as.jubiplatform-qa.com';
            //        } else {
            //            return authService.apiUrl;
            //        }
            //        break;
            //    default:
            //        if (authService.apiUrl.includes('as.jubiplatform2.com')) {
            //            return 'https://as.jubiplatform2.com';
            //        } else if (authService.apiUrl.includes('as.jubi.local')) {
            //            return 'http://as.jubiplatform-qa.com';
            //        } else {
            //            return authService.apiUrl;
            //        }
            //        break;
            //}



            //if (authService.apiUrl.includes('as.jubiplatform2.com')) {
            //    return 'https://as.jubiplatform2.com';
            //} else if (authService.apiUrl.includes('as.jubi.local')) {                
            //    return 'http://as.jubiplatform-qa.com';
            //} else {
            //    return authService.apiUrl;
            //}
        };

        /******************Validate and submit with/out preview***********************/

        var isPreview = function () {
            if ($scope.preview) {
                return true;
            } else {
                return false;
            }
        };

        var validateTodo = function() {
            var isError = false
            //checks dueDate: if empty or if less equal to min date
            if ($scope.currentDate == null) {
                $scope.dateIsError = true;
                isError = true;
            } else {
                $scope.todoActivityChallenge.dueDate = $scope.currentDate;
            }
            return isError;
        };

        $scope.doSubmit = function (e) {
            e.preventDefault();
            $scope.toDoActivityQuestions.$setPristine();

            var canSubmit = true;

            if (!validateTodo()) {
                $scope.topicSubmitting = true;

                //add feedback challenge data to doSumit (optional- can be null)
                $scope.todoActivityChallenge.feedbackChallenge = $scope.feedbackChallenge;
                _.each($scope.todoActivityChallenge.todo.challenges, function (challenge) {
                    if (challenge.title == 'Todo Feedback') {
                        challenge.answer = $scope.feedbackChallenge.answer;
                    }
                });

                //add media to todo
                $scope.todoActivityChallenge.todo.mediaChallenge = $scope.challengeMedia;

                _.each($scope.todoActivityChallenge.todo.challenges, function (challenge) {
                    if (challenge.title == 'Todo Media Upload') {
                        challenge.userMedia = $scope.todoActivityChallenge.todo.mediaChallenge;
                    }
                });

                
                //do activity in a program(inorder/parallel)  if in preview mode,will not allow submit.
                //by moving it out, it will check for all do Activity type.
                if (isPreview()) {
                    canSubmit = false;
                }
                if ($scope.todoActivityChallenge.todo.validate) {
                    $scope.todoActivityChallenge.status = 'submitted';
                } else {
                    $scope.todoActivityChallenge.status = 'completed';
                }



                if (canSubmit) {
                    return $q(function (resolve, reject) {
                        $http.post(authService.apiUrl + '/todo/update/', { userTodo: $scope.todoActivityChallenge, status: $scope.todoActivityChallenge.status })
                            .success(function (newUserTodo) {
                                afterSubmit = true;
                                $scope.formatActTodos(newUserTodo, true, $scope.todoActivityChallenge.todo.validate);

                                //updated navigation logic
                                //now trigger a api call to get latest program status
                                var url = authService.apiUrl + '/programs/' + $scope.program.slug + '/user';
                                $http.get(url)
                                    .success(function (program) {
                                        $scope.$emit('activityUpdated', program);
                                    }).error(function (err) {
                                        reject(err);
                                    });

                            })
                            .error(function (err) {
                                reject(err);
                            });
                    });
                }
            }
        }

        $scope.todoOpened = function () {
            if ($scope.todoActivityChallenge) {
                if ($scope.todoActivityChallenge.hasBeenCompleted && $scope.todoActivityChallenge.status != 'completed') {//assume its buddy validated but need to fix
                    $http.post(authService.apiUrl + '/todo/mark-as-read/', { userTodo: $scope.todoActivityChallenge, status: $scope.todoActivityChallenge.status })
                        .success(function (newTodo) {
                            $scope.todoActivityChallenge.status = 'completed';
                        })
                        .error(function (err) {
                            reject(err);
                        });
                }
            }
            
        };

        $scope.todoClick = function () {
            if ($scope.selectedUserTodo && $scope.selectedUserTodo.todo && $scope.selectedUserTodo.todo.mediaChallenge && $scope.selectedUserTodo.todo.mediaChallenge.addMedia) {
                $scope.selectedUserTodo.todo.mediaChallenge.addMedia.in = false;
            }
        };

        $scope.completeTodo = function (e, userTodo, status) {
            if ($scope.validateTodo(userTodo)) {
                $rootScope.closeTodoModal();
                userTodo.saveInProgress = true;
                if (!userTodo.todo.validate) {
                    if (userTodo.status != 'completed' && $scope.program) {
                        $scope.program.score.points.earned += userTodo.todo.points;
                    }
                    status = 'completed';
                }
                if ($scope.program) {
                    $scope.program.score.bonusPointsUsed += Number(userTodo.addedBonusPoints);
                }
                return $q(function (resolve, reject) {
                    $http.post(authService.apiUrl + '/todo/update/', { userTodo: userTodo, status: status })
                        .success(function (newTodo) {
                            userTodo.saveInProgress = false;
                            $rootScope.updateTodos(userTodo, newTodo);
                            resolve();
                        })
                        .error(function (err) {
                            reject(err);
                        });
                });
            } else {
                e.preventDefault();
                e.stopPropagation();
            }
        };


        /*****************Video Audio Play************************/
        $scope.playVideo = function (media) {
            if (media.source == 'youtube') {
                $modal.open({
                    templateUrl: 'youTubePlayer.html',
                    controller: youTubePlayerControllerObj.youTubePlayerController,
                    resolve: {
                        initData: function () {
                            var ivid = '';
                            ivid = media.iframe;
                            //_.each($scope.toDoModel.media, function (media, i) {
                            //    if (media.source == 'youtube') {
                            //        ivid = $scope.toDoModel.media[i].iframe
                            //    }
                            //});
                            return {
                                iframe: ivid
                            };
                        }
                    }
                });
                return;
            }
            $modal.open({
                templateUrl: 'videoPlayer.html',
                controller: videoPlayerControllerObj.videoPlayerController,
                resolve: {
                    initData: function () {
                        return {
                            url: media.url,
                            encodings: media.encodings
                        };
                    }
                }
            });
        };

        $scope.playPauseAudio = function (media) {
            if (!media.audio) {
                media.audio = ngAudio.load(media.url);
                media.audio.play();
                return;
            }
            media.audio.paused ? media.audio.play() : media.audio.pause();
        };

        //delete media function
        $rootScope.closeToDoClick = function (val) {
            var media = $scope.challengeMedia;
            $scope.challengeMedia = [];

            _.each(media, function (media) {
                if (media !== val) {
                    $scope.challengeMedia.push(media);
                }
            });
        }
        


    }]);

controllers.controller('QuestPlayerInspireController', ['$scope', '$q', '$http', '$timeout', '$upload', '$window', 'controllerState', 'authService', 'helperService', '$modal', '$rootScope', 'ngAudio', '$sce',
    function ($scope, $q, $http, $timeout, $upload, $window, controllerState, authService, helperService, $modal, $rootScope, ngAudio,$sce) {

        $scope.appreciateShow = true;
        $scope.storyShow = false;
        $scope.encourageShow = false;
        var currentInspireView = 'Appreciate';

        $scope.inspireQuest = {
            objective : null,
            completed : false,
            storyType : null,
            title : null,
            storyBeg : null,
            storyMes: null,
            storyEnd: null
        };

        $scope.multiselectoption = false;

        $scope.showIndividialDropdown = false;
        $scope.showGroupDropdown = false;
        $scope.showIndividialDropMenu = false;
        $scope.showGroupDropMenu = false;

        $scope.multiselecttext = true;
        $scope.selectedcountertext = false;

        $scope.selectedUsers = false;
        //$scope.checkVal = true;

        $scope.allIndividuals = true;
        $scope.currentInspireChallenge = null;

        $scope.badge = null;
        $scope.media = null;

        $scope.selectedCounter = 0;
        $scope.selectedGroupCounter = 0;

        $scope.ownNetworkUser = authService.user.id;

        $scope.userEnableDueDate = false;
        $scope.dueDate = new Date();

        $scope.programUsers = null;
        $scope.programGroups = null;

        $scope.shareGroupArry = [];
        $scope.selectedUserArry = [];
        $scope.selectedGroupArry = [];

        $scope.availableScorePoint = 0;
        $scope.selectedcounterzero = false;
        $scope.displayerror = false;

        var isQuestLoaded = false;

        $scope.currentQuestBonus = false;

        var initState = function () {

            $scope.$parent.setCurrentActivityType('Inspire');
            $scope.currentQuestBonus = $scope.quest.baseOrBonus == 'O' ? true : false;

            if ($scope.quest.complete) {
                $scope.availableScorePoint = $scope.quest.inspirePoints;
                $scope.$parent.inspireCanContinue = true;
                $scope.$parent.canContinue = true;
                $scope.appreciateModel;
                $scope.inspireModel;
                $scope.storyModel;
                $scope.encourageModel;
                $scope.inspireQuest.objective = $scope.quest.objective ? $scope.quest.objective : null;
               }
            else {
                //$scope.$parent.inspireCanContinue = false;
                //$scope.$parent.canContinue = false;
                $scope.availableScorePoint = $scope.quest.inspirePoints;
                $scope.inspireQuest.objective = $scope.quest.objective ? $scope.quest.objective : null;
            }
            //availableScorePoint = $scope.program.quest.score.points.total;
            //setTimeout(function () {
            //    $scope.programUsers = $rootScope.networkUsers;
            //    //console.log("watch" + $rootScope.networkUsers);
            //    $scope.programGroups = $rootScope.userGroups;
            //}, 4000);
        };

        //When Quest is loaded, check to see if quest is compelete, if yes then process the quest and display the user data in textarea. 
        $scope.$watch('networkUsers', function () {
            if ($scope.quest) {
                getForumItemComments($scope.quest);
            }
        }, false);

        var getForumItemComments = function (quest) {
            console.log(quest);
            //check is quest is complete
            if (quest.complete) {
                var userComment = _.filter(quest.forumItem.forumItemComments, function (comment) {
                    if (comment.createdById == comment.createdAgainstId) {
                        return comment;
                    }
                });

                //load media
                $scope.inspireModel.media = quest.forumItem.forumItemMedia;
                quest.userAllowedMediaUpload = false;

                //users
                var selectedUsers = quest.forumItem.forumItemUsers;

                $scope.shareUserArry = _.filter($rootScope.networkUsers, function (netUser) {
                    return _.find(selectedUsers, function (user) {
                        return netUser.user.id === user.userId;
                    });
                });

                //bonus points if exists
                if (quest.forumItem.forumItemBonus && quest.forumItem.forumItemBonus.length > 0) {
                    $scope.inspireModel.bonusPoints = quest.forumItem.forumItemBonus[0].points;
                }
               
                //find out which type of inspire it is. 

                if (quest.forumItem.subType == 'encouragement') {
                    quest.storyAvailableToUser = false;
                    quest.inspireAvailableToUser = false;

                    $scope.formData.encourageMessage = userComment[0].content;
                }
                if (quest.forumItem.subType == 'appreciation') {
                    quest.encourageAvailableToUser = false;
                    quest.storyAvailableToUser = false;

                    $scope.formData.appreciationMessage = userComment[0].content;
                }
                if (quest.forumItem.subType == 'story') {
                    quest.encourageAvailableToUser = false;
                    quest.inspireAvailableToUser = false;

                    var data = userComment[0].content;
                    var storyData = data.split('\\');
                    $scope.formData.storyMessage = storyData[0];
                    $scope.formData.eventsMessage = storyData[1];
                    $scope.formData.userMessage = storyData[2];
                }

            }
        };

        $scope.showBonus = function () {
            var show = true;

            //if quest is complete and has bonus point then show. else false
            if ($scope.quest.complete) {
                if (Number($scope.inspireModel.bonusPoints) == 0) {
                    show = false;
                }
            }

            return show;
        };

        var getAwardedBadges = function () {
            return $q(function (resolve, reject) {
                var url = authService.apiUrl + '/badges/quest-badge';
                if ($scope.preview) url += '?preview=true';
              
                $http.post(url, { questId: $scope.quest.id })
                    .success(function (badge) {
                        $scope.badge = badge
                    })
                    .error(function (err) {
                        reject(err);
                    });
            });
        };

        $scope.formData = {};

        /*********Form data and error array***********************/
        $scope.errArry = {
            encourageMsg: false,
            appreciateMsg: false,
            storyOpMsg: false,
            storyMidMsg: false,
            storyEndMsg: false,
            bonusPoints: {
                max: false,
                remain:0 
            }
        };
        $scope.inspireModel = {
            title: null,
            content: null,
            category: null,
            bonusPoints: null,
            networkUsers: [],
            sharing: 'all',
            media: [],
            quest: {
                id: null
            }
        };
        $scope.storyModel = {
            comment: null,
            questId: null
        };
        $scope.encourageModel = {
            comment: null,
            questId: null
        };
        $scope.appreciateModel = {
            comment: null,
            questId: null
        };
        /*****************************************************/
        controllerState
            .state('inspire', {
                url: '/inspire',
                onEnter: initState

            });

        $scope.$on('addMediatoInsipireModal', function (e, args) {
            if (args.type == 'audio') {
                args.api = null;
                args.sources = [];
                if (typeof args.url == 'string') {
                    args.sources = [
                        { src: $sce.trustAsResourceUrl(args.url), type: 'audio/mp3' }
                    ];
                }

                $scope.inspireModel.media.push(args);

            } else {
                $scope.inspireModel.media.push(args);
            }
            console.log($scope.inspireModel.media);
        });

        $scope.$on('deleteGroupFromSelectedArray', function (e, args) {
            //id is passed
         
            _.each($scope.selectedGroupArry, function (group,i) {
                console.log("selected Group" + group);
                if (group.id == args) {
                    $scope.selectedGroupArry[i].selected = false;
                   
                }
               
              
            });
            _.each($scope.selectedGroupArry, function (group, i) {
               
               
                    $scope.selectedGroupArry.splice(i, 1);
                    $scope.selectedGroupCounter -= 1;
               

            });
          
            _.each($scope.shareGroupArry, function (group,i) {
                console.log("share Group" + group);
                if (group.id == args) {
                    $scope.shareGroupArry[i].selected = false;
                }
                
            });
            _.each($scope.selectedUserArry, function (group, i) {
                console.log("User Group" + group);
                if (group.id == args) {
                    $scope.selectedUserArry[i].selected = false;
                }
               
              
            });
           
            _.each($scope.shareUserArry, function (usr, i) {
                {
                    usr = $scope.shareUserArry[i];
                    $scope.shareUserArry.splice(usr, 1);
                    i++;
                    $scope.selectedCounter -= 1;

                }

            }); 
         
            if ($scope.selectedCounter <= 0) {
                $scope.selectedcountertext = false;
            }
            else {
                $scope.selectedcountertext = true;
            }
            
              
              if ($scope.selectedGroupCounter <= 0) {
                  
                  $scope.selectedGroupcountertext = false;
              }
              else {
                  $scope.selectedGroupcountertext = true;
              }

            
        });

        $scope.$on('repMedaiInspireModal', function (e, args) {
            //find the media that just returned and then replace it.

            _.each($scope.inspireModel.media, function (media, i) {
                if (media.name === args.name) {
                    $scope.inspireModel.media.splice($scope.inspireModel.media[i], 1, args);
                }
            });
        });

        var copyUserIndex = 0;

        var arrayUserChecker = function (shareUserArry, val, fromGroup) {
            var isUser = false;
            copyUserIndex = 0;
            for (var i = 0; i < shareUserArry.length; i++) {
                if (fromGroup) {
                    if (shareUserArry[i].userId == val.userId) {
                        copyUserIndex = i;
                        isUser = true;
                    }
                } else {
                    if (!shareUserArry[i].userId){
                        if (shareUserArry[i].id == val.userId) {
                            copyUserIndex = i;
                            isUser = true;
                        }
                    } else {
                        if (shareUserArry[i].userId == val.userId) {
                            copyUserIndex = i;
                            isUser = true;
                        }
                    }
                    
                }
                
            }
            return isUser;
        };

        $scope.toggleUser = function (gpval, fromGroup, fromIndi) {
            if ($rootScope.shareUserArry.length > 0) {

                if (arrayUserChecker($rootScope.shareUserArry, gpval, fromGroup)) {
                    $rootScope.shareUserArry.indexOf(gpval)
                    if (fromIndi) {
                        $rootScope.shareUserArry.splice(copyUserIndex, 1);
                        $scope.selectedCounter -= 1;
                        _.each($scope.selectedUserArry, function (user, i) {
                            if (user.userId == gpval.userId) {
                                $scope.selectedUserArry[i].selected = false;
                            }
                        });

                        //if (fromGroup) {
                        //    $rootScope.shareUserArry.push(gpval);
                        //    $scope.selectedCounter += 1;
                        //    _.each($scope.selectedUserArry, function (user, i) {
                        //        if (user.userId == gpval.userId) {
                        //            $scope.selectedUserArry[i].selected = true;
                        //        }
                        //    });
                        //}
                    }
                    console.log($scope.selectedUserArry);
                } else {
                    $rootScope.shareUserArry.push(gpval);
                    $scope.selectedCounter += 1;
                    _.each($scope.selectedUserArry, function (user, i) {
                        if (user.userId == gpval.userId) {
                            $scope.selectedUserArry[i].selected = true;
                          
                        }
                    });
                }
            } else {
                $rootScope.shareUserArry.push(gpval);
                $scope.selectedCounter += 1;
                _.each($scope.selectedUserArry, function (user, i) {
                    if (user.userId == gpval.userId) {
                        $scope.selectedUserArry[i].selected = true;
                       
                    }
                });
            }
            
            console.log($rootScope.shareUserArry);

            if ($scope.selectedCounter > 0) {
                $scope.selectedcountertext = true;
                $scope.displayerror = false;
            } else {
                $scope.selectedcountertext = false;
            }
        };

        $scope.searchUser = function (val) {
            $scope.selectedUserArry = [];
            if ($scope.programUsers) {
                _.each($scope.programUsers, function (item) {
                    if (item.label.toLowerCase().includes(val)) {
                        $scope.selectedUserArry.push(item);
                    }
                });
            }
        }

        $scope.toggleGroup = function (val, ind) {
            console.log(val);
            var removeGroup = false;
            var fromGroup = true;

            if ($scope.shareGroupArry.length > 0) {
                if ($scope.shareGroupArry.indexOf(val)!=-1) {
                    $scope.shareGroupArry.splice($scope.shareGroupArry.indexOf(val), 1);
                    $scope.selectedGroupCounter -= 1;

                    _.each($scope.selectedGroupArry, function (group, i) {
                        if (group.id == val.id) {
                            $scope.selectedGroupArry[i].selected = false;
                        }
                    });
                    _.each($scope.shareUserArry, function (val) {
                        val.selected = false;
                    });
                    removeGroup = true;
                    fromGroup = false;
                } else {
                    $scope.shareGroupArry.push(val);
                    $scope.selectedGroupCounter += 1;

                    _.each($scope.selectedGroupArry, function (group, i) {
                        if (group.id == val.id) {
                            $scope.selectedGroupArry[i].selected = true;
                        }
                    });
                }
            } else {
                $scope.shareGroupArry.push(val);
                $scope.selectedGroupCounter += 1;

                _.each($scope.selectedGroupArry, function (group, i) {
                    if (group.id == val.id) {
                        $scope.selectedGroupArry[i].selected = true;
                    }
                });
            }

            if (removeGroup) {
                //clear the slecteduser count, selectre user and then 
                $rootScope.shareUserArry = [];
                $scope.selectedCounter = 0;
               
                _.each($scope.selectedUserArry, function (val) {
                    val.selected = false;
                });
               
                            

                //re-add all selected group
                _.each($scope.selectedGroupArry, function (group) {
                    if (group.selected) {
                        _.each(group.programUsers, function (val) {
                            $scope.toggleUser(val.programUser, fromGroup, false);
                        });
                    }
                    

                });

            } else {
                //add group users to sharearray
                _.each(val.programUsers, function (val) {
                    $scope.toggleUser(val.programUser, fromGroup, false);

                });
            }
            

            if ($scope.selectedGroupCounter > 0) {
                $scope.selectedGroupcountertext = true;
            } else {
                $scope.selectedGroupcountertext = false;
            }

        };

        $scope.searchGroup = function (val) {
            $scope.selectedGroupArry = [];
            if ($scope.programGroups) {
                _.each($scope.programGroups, function (item) {
                    if (item.name.toLowerCase().includes(val)) {
                        $scope.selectedGroupArry.push(item);
                    }
                });
            }
        }

        $scope.appreciateContent = function () {
            $scope.storyShow = false;
            $scope.appreciateShow = true;
            $scope.encourageShow = false;
      //      $scope.formData = {};
            $scope.inspireMessages.$setPristine();
            currentInspireView = 'Appreciate';
            resetVal();
        };
        $scope.storyContent = function () {
            $scope.storyShow = true;
            $scope.appreciateShow = false;
            $scope.encourageShow = false;
         //   $scope.formData = {};
            $scope.inspireMessages.$setPristine();
            currentInspireView = 'Story';
            resetVal();
        };
        $scope.encourageContent = function () {
            $scope.storyShow = false;
            $scope.appreciateShow = false;
            $scope.encourageShow = true;
         //   $scope.formData = {};
            $scope.inspireMessages.$setPristine();
            currentInspireView = 'Encourage';
            resetVal();
        };

        $scope.showDropdown = function (val) {
            switch (val) {
                case 'indiv':
                    $scope.showIndividialDropMenu = !$scope.showIndividialDropMenu;
                case 'group':
                    $scope.showGroupDropMenu = !$scope.showGroupDropMenu;
            }

        };

        /*checks everyone option as default*/
        $scope.checkVal = { value: 'Everyone' };

        $scope.valueChanged = function () {

            $scope.val = $scope.checkVal.value;

            /*checks Individuals/groups option and shows dropdown*/
            if ($scope.val == 'Groups') {
                $scope.multiselectoption = true;
                $scope.showIndividialDropdown = false;
                $scope.showGroupDropdown = true;
                $scope.programGroups = $rootScope.userGroups;
                $scope.selectedGroupArry = [];
                $scope.shareGroupArry = [];
                $scope.selectedGroupArry = $scope.programGroups;
                $scope.selectedgroupcountertext = false;
                $scope.programUsers = $rootScope.networkUsers;
                $scope.selectedUserArry = $scope.programUsers;
                $scope.selectedGroupCounter = 0;
                $scope.selectedCounter = 0;
                $scope.selectedcountertext = false;
                $scope.selectedGroupcountertext = false;
                $rootScope.shareUserArry = [];
           
                _.each($scope.selectedUserArry, function (user) {
                    user.selected = false;
                });

                _.each($scope.shareGroupArry, function (val) {
                    val.selected = false;
                });

                _.each($scope.selectedGroupArry, function (val) {
                    val.selected = false;
                });
             

                $scope.inspireModel.sharing = 'select';
            }
            else if ($scope.val == 'Individuals') {
                $scope.multiselectoption = true;
                $scope.showIndividialDropdown = true;
                $scope.showGroupDropdown = false;
                $scope.programUsers = $rootScope.networkUsers;
                $scope.selectedUserArry = $scope.programUsers;
                $scope.inspireModel.sharing = 'select';
                

                _.each($scope.selectedUserArry, function (user) {
                    user.selected = false;
                });
                if ($scope.selectedCounter > 0) {
                    $scope.selectedcountertext = true;
         
                } else {
                    $scope.selectedcountertext = false;
                    $scope.$parent.inspireCanContinue = false;
                    $scope.selectedcounterzero = true;
                    
                    
                }

                if ($scope.shareGroupArry.length > 0) {
                 
                    _.each($scope.shareGroupArry, function (shrGrpArry) {
                        if (shrGrpArry.selected) {
                            _.each(shrGrpArry.programUsers, function (shrUser) {
                                _.each($scope.selectedUserArry, function (selUser) {
                                    if (selUser.userId == shrUser.programUser.userId) {
                                        selUser.selected = true;
                                       
                                    }
                                });
                            });
                        }
                        
                    });
                    
                }
            }
            else {
                $scope.multiselectoption = false;
                $scope.showIndividialDropdown = false;
                $scope.showGroupDropdown = false;
                $rootScope.shareUserArry = [];
                $scope.selectedCounter = 0;
                $scope.selectedcountertext = false;
                _.each($scope.selectedGroupArry, function (val) {
                    val.selected = false;
                });
                _.each($scope.selectedUserArry, function (val) {
                    val.selected = false;
                });


                $scope.inspireModel.sharing = 'all';
            }


        };

        var resetVal = function () {

            $scope.errArry.encourageMsg = false;
            $scope.errArry.appreciateMsg = false;
            $scope.errArry.storyOpMsg = false;
            $scope.errArry.storyMidMsg = false;
            $scope.errArry.storyEndMsg = false;
            $scope.displayerror = false;
        };
        resetVal();


        $('body').bind('click', function (e) {

            if ($(e.target).closest('#showIndividialDropdown').length != 0) {
                // click happened outside of menu, hide any visible menu items

            }
            if ($(e.target).closest('#showIndividialDropdown').length == 0) {
                // click happened outside of menu, hide any visible menu items
                $scope.showIndividialDropMenu = false;
                $scope.displayerror = false;
            }

            if ($(e.target).closest('#showGroupDropdown').length != 0) {
                // click happened outside of menu, hide any visible menu items

            }
            if ($(e.target).closest('#showGroupDropdown').length == 0) {
                // click happened outside of menu, hide any visible menu items
                $scope.showGroupDropMenu = false;
            }


            //$('div.program-menu li.drop ul.drop-menu').hide().removeClass('show');
        });

        $scope.getCurrentBonusPointsAvailable = function () {
            if ($scope.program) {
                var bucket = $scope.getBonusPointsBucket();
                var points = bucket - $scope.program.score.bonusPointsUsed;
                $scope.errArry.bonusPoints.remain = points;
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

        $scope.inspireSubmit = function (e) {
            e.preventDefault();

            if ($scope.checkVal.value == 'Individuals') {
                if ($scope.selectedCounter <= 0) {
                    $scope.displayerror = true;
                    return null;
                }
            }
            

            if (currentInspireView == 'Encourage') {
                resetVal();
                if (!$scope.formData.encourageMessage || $scope.formData.encourageMessage.trim().length <= 0) {
                    $scope.errArry.encourageMsg = true;
                }

                if (!$scope.errArry.encourageMsg) {// if no error then continue
                    $scope.topicSubmitting = true;

                    $scope.inspireModel.title = 'Encouragement from ' + authService.user.firstName + ' ' + authService.user.lastName;
                    $scope.inspireModel.category = _.findWhere($rootScope.forumCategories, { name: 'Inspiration' });
                    $scope.inspireModel.allowDuplicate = true;
                    $scope.inspireModel.subType = 'encouragement';
                    $scope.inspireModel.quest.id = $scope.quest.id;
                    if ($scope.inspireUpload.file) {
                        $scope.inspireModel.media = $scope.inspireUpload.file;
                    }
                    $scope.inspireModel.networkUsers = $rootScope.shareUserArry;

                    $scope.encourageModel.comment = $scope.formData.encourageMessage;
                    $scope.encourageModel.questId = $scope.quest.id;


                    //console.log($scope.inspireModel);
                    //console.log($scope.encourageModel);
                    $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/', $scope.inspireModel)
                        .success(function (result) {
                            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + result.topic.id + '/comments', $scope.encourageModel)
                                .success(function (topic) {

                                    $scope.quest.score.points.earned = $scope.availableScorePoint;
                                   
                                    $scope.categoryUpdated();//like emit but used a function to pull another api request.
                                    $scope.quest.complete = true;
                                    $rootScope.showPointsAwardedNotification($scope.availableScorePoint);
                                    $scope.$emit('canAndInsireContinue', true);
                                    //$scope.program.score.points.earned += ($scope.program.forum.newEncouragePoints + $scope.program.forum.newCommentPoints);
                                    //$scope.result.discussionScore.newEncouragePoints += $scope.program.forum.newEncouragePoints;
                                    //$scope.result.discussionScore.newCommentPoints += $scope.program.forum.newCommentPoints;
                                    //$rootScope.updatePointAwardValuesToConsiderMax();
                                    $scope.quest.userAllowedMediaUpload = false;
                                    $scope.quest.storyAvailableToUser = false;
                                    $scope.quest.inspireAvailableToUser = false;


                                    //updated navigation logic
                                    //now trigger a api call to get latest program status
                                    var url = authService.apiUrl + '/programs/' + $scope.program.slug + '/user';
                                    $http.get(url)
                                        .success(function (program) {
                                            $scope.$emit('activityUpdated', program);
                                        }).error(function (err) {
                                            reject(err);
                                        });
                                });
                        });
                }
            }

            if (currentInspireView == 'Story') {
          resetVal();
                if (!$scope.formData.storyMessage || $scope.formData.storyMessage.trim().length <= 0) {
                    $scope.errArry.storyOpMsg = true;
                }

                if (!$scope.formData.eventsMessage || $scope.formData.eventsMessage.trim().length <= 0) {
                    $scope.errArry.storyMidMsg = true;
                }

                if (!$scope.formData.userMessage || $scope.formData.userMessage.trim().length <= 0) {
                    $scope.errArry.storyEndMsg = true;
                }


                if (!$scope.errArry.storyOpMsg && !$scope.errArry.storyMidMsg && !$scope.errArry.storyEndMsg) {

                    $scope.topicSubmitting = true;

                    $scope.inspireModel.title = 'Story by ' + authService.user.firstName + ' ' + authService.user.lastName;
                    $scope.inspireModel.category = _.findWhere($rootScope.forumCategories, { name: 'Inspiration' });
                    $scope.inspireModel.allowDuplicate = true;
                    $scope.inspireModel.subType = 'story';
                    $scope.inspireModel.quest.id = $scope.quest.id;
                    if ($scope.inspireUpload.file) {
                        $scope.inspireModel.media = $scope.inspireUpload.file;
                    }
                    $scope.inspireModel.networkUsers = $rootScope.shareUserArry;

                    $scope.storyModel.comment = $scope.formData.storyMessage + '\\' + $scope.formData.eventsMessage + '\\' + $scope.formData.userMessage;
                    $scope.storyModel.questId = $scope.quest.id;
                    //$scope.storyModel.events = $scope.formData.eventsMessage;
                    //$scope.storyModel.closing = $scope.formData.userMessage;

                    //console.log($scope.inspireModel);
                    //console.log($scope.storyModel);
                    $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/', $scope.inspireModel)
                        .success(function (result) {
                            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + result.topic.id + '/comments', $scope.storyModel)
                                .success(function (topic) {
                                    $scope.formData.storyMessage;
                                    $scope.formData.eventsMessage;
                                    $scope.formData.userMessage;
                                    $scope.quest.score.points.earned = $scope.availableScorePoint;
                                   
                                    //$scope.$parent.inspireCanContinue = true;
                                    //$scope.$parent.canContinue = true;
                                    //$rootScope.showPointsAwardedNotification(availableScorePoint);
                                    $scope.categoryUpdated();//like emit but used a function to pull another api request.
                                    $rootScope.showPointsAwardedNotification($scope.availableScorePoint);
                                    $scope.quest.complete = true;
                                    $scope.$emit('canAndInsireContinue', true);
                                    //$scope.program.score.points.earned += ($scope.program.forum.newEncouragePoints + $scope.program.forum.newCommentPoints);
                                    //$scope.result.discussionScore.newEncouragePoints += $scope.program.forum.newEncouragePoints;
                                    //$scope.result.discussionScore.newCommentPoints += $scope.program.forum.newCommentPoints;
                                    //$rootScope.updatePointAwardValuesToConsiderMax();
                                    $scope.quest.userAllowedMediaUpload = false;
                                    $scope.quest.encourageAvailableToUser = false;
                                    $scope.quest.inspireAvailableToUser = false;

                                    //updated navigation logic
                                    //now trigger a api call to get latest program status
                                    var url = authService.apiUrl + '/programs/' + $scope.program.slug + '/user';
                                    $http.get(url)
                                        .success(function (program) {
                                            $scope.$emit('activityUpdated', program);
                                        }).error(function (err) {
                                            reject(err);
                                        });
                                });
                        });
                }

            }

            if (currentInspireView == 'Appreciate') {
                resetVal();
                if (!$scope.formData.appreciationMessage || $scope.formData.appreciationMessage.trim().length <= 0) {
                    $scope.errArry.appreciateMsg = true;
                }

                if (Number($scope.inspireModel.bonusPoints) > 0 && Number($scope.inspireModel.bonusPoints) > $scope.getCurrentBonusPointsAvailable()) {
                    $scope.errArry.bonusPoints.max = true;
                    //isValid = false;
                }

                if (!$scope.errArry.appreciateMsg && !$scope.errArry.bonusPoints.max) {
                    $scope.topicSubmitting = true;

                    $scope.inspireModel.title = 'Appreciated by ' + authService.user.firstName + ' ' + authService.user.lastName;
                    $scope.inspireModel.category = _.findWhere($rootScope.forumCategories, { name: 'Inspiration' });
                    $scope.inspireModel.allowDuplicate = true;
                    $scope.inspireModel.subType = 'appreciation';
                    $scope.inspireModel.quest.id = $scope.quest.id;
                    if ($scope.inspireUpload.file) {
                        $scope.inspireModel.media = $scope.inspireUpload.file;
                    }
                    $scope.inspireModel.networkUsers = $rootScope.shareUserArry;

                    $scope.appreciateModel.comment = $scope.formData.appreciationMessage;
                    $scope.appreciateModel.questId = $scope.quest.id;
                    

                    //console.log($scope.inspireModel);
                    //console.log($scope.appreciateModel);
                    $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/', $scope.inspireModel)
                        .success(function (result) {
                            $http.post(authService.apiUrl + '/forum/' + $scope.program.forum.id + '/topics/' + result.topic.id + '/comments', $scope.appreciateModel)
                                .success(function (topic) {

                                    $scope.quest.score.points.earned = $scope.availableScorePoint;
                                    //$scope.$parent.inspireCanContinue = true;
                                    //$scope.$parent.canContinue = true;
                                    //$rootScope.showPointsAwardedNotification(availableScorePoint);
                                    $scope.categoryUpdated();//like emit but used a function to pull another api request.
                                    $scope.formData.appreciationMessage;
                                    $rootScope.showPointsAwardedNotification($scope.availableScorePoint);
                                    $scope.quest.complete = true;
                                    $scope.$emit('canAndInsireContinue', true);


                                    //$scope.program.score.points.earned += ($scope.program.forum.newEncouragePoints + $scope.program.forum.newCommentPoints);
                                    //$scope.result.discussionScore.newEncouragePoints += $scope.program.forum.newEncouragePoints;
                                    //$scope.result.discussionScore.newCommentPoints += $scope.program.forum.newCommentPoints;
                                    //$rootScope.updatePointAwardValuesToConsiderMax();
                                    $scope.quest.userAllowedMediaUpload = false;
                                    $scope.quest.encourageAvailableToUser = false;
                                    $scope.quest.storyAvailableToUser = false;


                                    //updated navigation logic
                                    //now trigger a api call to get latest program status
                                    var url = authService.apiUrl + '/programs/' + $scope.program.slug + '/user';
                                    $http.get(url)
                                        .success(function (program) {
                                            $scope.$emit('activityUpdated', program);
                                        }).error(function (err) {
                                            reject(err);
                                        });
                                });
                        });
                }
            }


        };

        $scope.playVideo = function (media) {
            if (media.source == 'youtube') {
                $modal.open({
                    templateUrl: 'youTubePlayer.html',
                    controller: youTubePlayerControllerObj.youTubePlayerController,
                    resolve: {
                        initData: function () {
                            var ivid = '';
                            ivid = media.iframe;
                            //});
                            return {
                                iframe: ivid
                            };
                        }
                    }
                });
                return;
            }
            $modal.open({
                templateUrl: 'videoPlayer.html',
                controller: videoPlayerControllerObj.videoPlayerController,
                resolve: {
                    initData: function () {
                        return {
                            url: media.url,
                            encodings: media.encodings
                        };
                    }
                }
            });
        };

        $scope.playPauseAudio = function (media) {
            if (!media.audio) {
                media.audio = ngAudio.load(media.url);
                media.audio.play();
                return;
            }
            media.audio.paused ? media.audio.play() : media.audio.pause();
        };

        //delete media function
        $rootScope.closeInspireClick = function (val) {
            var media = $scope.inspireModel.media;
            $scope.inspireModel.media = [];

            _.each(media, function (media) {
                if (media !== val) {
                    $scope.inspireModel.media.push(media);
                }
            });
        }

    }]);