'use strict';

var module = angular.module('Jubi.controllers');

module.controller('ProgramsController', ['$scope', 'authService',
    function ($scope, authService) {
    }]);

module.controller('QuestsController', ['$scope', '$http', '$timeout', '$q', '$window', 'authService', 'helperService',
    function ($scope, $http, $timeout, $q, $window, authService, helperService) {

        $scope.quests = null;

        var goToQuest = function (index, quest) {
            if (quest && quest.isLocked) return;
            
      
            var url = '/user/program/' + $scope.program.slug + '/quest-player/quest/' + quest.id;
            if ($scope.preview) url += '?preview=' + encodeURIComponent($scope.preview);
            if ($scope.preview && $scope.previewRet) url += '&previewRet=' + encodeURIComponent($scope.previewRet);
            $window.location = url;
        };

        $scope.$watch(function () {
            return $scope.program
        }, function () {
            if (!$scope.program) return;

            if ($scope.program.description)
                $scope.program.description = $scope.program.description.replace(/\n/g, '<br>');

            var formatQuest = function (quest) {
                var complete = 0;
                if (quest.challengeCount > 0) {
                    complete = Math.ceil((quest.challengesComplete / quest.challengeCount) * 100);
                }
                quest.chart = {
                    options: {
                        chart: {
                            type: "pie",
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderColor: 'rgba(0,0,0,0)'
                        },
                        colors: ['#5BC0DE', '#233241'],
                        plotOptions: {
                            pie: {
                                borderWidth: 0,
                                allowPointSelect: true,
                                cursor: 'pointer',
                                dataLabels: {enabled: false},
                                innerSize: 95,
                                events: {
                                    click: function () {
                                        console.log('click');
                                        $timeout(function () {
                                            $scope.questClick(quest);
                                        }, 0);
                                    }
                                }
                            },
                            series: {
                                lineWidth: 0,
                                states: {hover: {enabled: false}}
                            }
                        },
                        tooltip: {enabled: false}
                    },
                    series: [{
                        data: [complete, 100 - complete],
                        id: "series-" + index
                    }],
                    title: {text: null},
                    credits: {enabled: false},
                    loading: false,
                    size: {width: 150, height: 150}
                };

                index++;
            };


            var index = 0;
            angular.forEach($scope.program.quests, function (quest) {
                formatQuest(quest);
            });

            angular.forEach($scope.program.levels, function (level) {
                angular.forEach(level.quests, function (quest) {
                    formatQuest(quest);
                });
            });

            $scope.stopLoading();

            $scope.previewRet = helperService.getQueryValue('previewRet');
            $scope.preview = helperService.getQueryValue('preview');
        });

        //var init = function() {
        //    $scope.isLoading++;
        //    return $q(function(resolve, reject) {
        //
        //        var url = authService.apiUrl + '/programs/' + $scope.program.slug + '/quests';
        //        if ($scope.preview) url += '?preview=yes';
        //
        //        $http.get(url)
        //            .success(function(quests) {
        //                var index = 0;
        //                angular.forEach(quests, function(quest) {
        //
        //                    var complete = 0;
        //                    if (quest.progress.totalChallenges > 0)
        //                        complete = Math.ceil((quest.progress.completeChallenges / quest.progress.totalChallenges) * 100);
        //
        //                    quest.chart = {
        //                        options: {
        //                            chart: {
        //                                type: "pie",
        //                                backgroundColor: 'rgba(0,0,0,0)',
        //                                borderColor: 'rgba(0,0,0,0)'
        //                            },
        //                            colors: ['#5BC0DE', '#233241'],
        //                            plotOptions: {
        //                                pie: {
        //                                    borderWidth: 0,
        //                                    allowPointSelect: true,
        //                                    cursor: 'pointer',
        //                                    dataLabels: { enabled: false },
        //                                    innerSize: 95,
        //                                    events: {
        //                                        click: function() {
        //                                            console.log('click');
        //                                            $timeout(function() {
        //                                                $scope.questClick(quest);
        //                                            }, 0);
        //                                        }
        //                                    }
        //                                },
        //                                series: {
        //                                    lineWidth: 0,
        //                                    states: { hover: { enabled: false }}
        //                                }
        //                            },
        //                            tooltip: {enabled:false}
        //                        },
        //                        series: [{
        //                            data: [ complete, 100 - complete ],
        //                            id: "series-" + index
        //                        }],
        //                        title: { text: null },
        //                        credits: { enabled: false },
        //                        loading: false,
        //                        size: { width: 150, height: 150 }
        //                    };
        //                    quest.isLocked = false;
        //                    index++;
        //                });
        //                $scope.quests = quests;
        //                resolve();
        //            })
        //            .error(function(err) { reject(err); })
        //    });
        //};

        $scope.questClick = function (index, quest) {
 
            goToQuest(index, quest);

        };

        $scope.tilePieX = function () {
            return function (d) {
                return d.key;
            };
        };
        $scope.tilePieY = function () {
            return function (d) {
                return d.y;
            };
        };


    }]);

module.controller('ActivityController', ['$scope', 'authService',
    function ($scope, authService) {
    }]);

module.controller('NetworkController', ['$scope', 'authService', '$http', '$window', '$modal', '$timeout',
    function ($scope, authService, $http, $window, $modal, $timeout) {
        $scope.buddies = [];
        $scope.filters = {
            showCustomFilters: false,
            firstName: null,
            lastName: null,
            points: null,
            index: null
        };
        $scope.exportOptions = [
          { "id": "firstName", "name": "First Name", "selected": true },
          { "id": "lastName", "name": "Last Name", "selected": true },
          { "id": "points", "name": "Points", "selected": true }

        ];
        $scope.ownUserId = authService.user.id;

        $scope.searchString = null;

        $scope.searchFilter = function (item) {
            return !$scope.searchString || (item.user.firstName + ' ' + item.user.lastName).toUpperCase().indexOf($scope.searchString.toUpperCase()) != -1;
        };

        $scope.customSearchFilter = function (programUser) {
            var included = true;
            if ($scope.filters.firstName && programUser.user.firstName.toUpperCase().indexOf($scope.filters.firstName.toUpperCase()) == -1) {
                included = false;
            }
            if ($scope.filters.lastName && programUser.user.lastName.toUpperCase().indexOf($scope.filters.lastName.toUpperCase()) == -1) {
                included = false;
            }
            if ($scope.filters.points && programUser.points.toString().toUpperCase().indexOf($scope.filters.points.toUpperCase()) == -1) {
                included = false;
            }
            if ($scope.filters.index && ($scope.sortedProgramUsers.indexOf(programUser) + 1).toString() != $scope.filters.index) {
                included = false;
            }

            return included;
        };

        $scope.getRank = function (programUser) {
            return $scope.sortedProgramUsers.indexOf(programUser) + 1;
        };

        var init = function (slug) {
            var url = authService.apiUrl + '/program/' + $scope.program.id + '/network/' + $scope.program.linkId;

            $scope.isLoading = true;
            $http.get(url)
                .success(function (result) {
                    $scope.programUsers = result.programUsers;
                    $scope.buddyAssociations = result.buddyAssociations;

                    $scope.sortedProgramUsers = angular.copy($scope.programUsers).sort(function (a, b) {
                        if (a.points > b.points) {
                            return -1;
                        } else if (b.points > a.points) {
                            return 1;
                        } else {
                            return 0;
                        }
                     });
                    /*Picks header from user summary table*/
                    $timeout(function () {
                        $scope.headers = [];
                        $scope.data1 = [];
                        
                        var table1 = document.getElementById('leaderboardSummary');

                        for (var i = 0; i < table1.tHead.rows[0].cells.length; i++) {
                            $scope.data1[i] = table1.tHead.rows[0].cells[i].innerHTML;

                        }
                        $scope.headers.push($scope.data1);

                    }, 300);
                    $scope.isLoading = false;
                })
                .error(function (err) {

                });
        };
          $scope.isUserBuddy = function (programUser) {
            if (_.findWhere($scope.buddyAssociations, {associatedProgramUserId: programUser.id})) {
                return true;
            } else {
                return false;
            }
        };

        $scope.addBuddy = function (e, programUser) {
            e.preventDefault();
            e.stopPropagation();

            if(!$scope.buddyUpdateInProgress) {
                $scope.buddyUpdateInProgress = true;
                $http.post(authService.apiUrl + '/program-users/' + programUser.id + '/add-buddy').success(function (result) {
                    $scope.buddyAssociations.push({
                        associatedProgramUserId: result.id
                    });
                    $scope.buddyUpdateInProgress = false;
                })
            }
        };

        $scope.removeBuddy = function (e, programUser) {
            e.preventDefault();
            e.stopPropagation();

            if(!$scope.buddyUpdateInProgress) {
                $scope.buddyUpdateInProgress = true;
                $http.post(authService.apiUrl + '/program-users/' + programUser.id + '/remove-buddy').success(function (result) {
                    $scope.buddyAssociations = _.filter($scope.buddyAssociations, function (association) {
                        if (result.id != association.associatedProgramUserId) {
                            return true;
                        }
                    });
                    $scope.buddyUpdateInProgress = false;
                })
            }
        };

        $scope.goToUserProfile = function (programUser) {
            var queryString = '';
            if ($scope.isActive('leaderboard')) {
                queryString = '?ret=leaderboard';
            } else if ($scope.isActive('network')) {
                queryString = '?ret=network';
            }
            $window.location = '/user/program/' + $scope.program.slug + '/network-profile/' + programUser.user.id + queryString;
        };

        $scope.isActive = function (path) {
            return $window.location.pathname.indexOf(path) >= 0;
        };

        $scope.$watch(function () {
            return $scope.program
        }, function () {
            if (!$scope.program) return;
            init();
        });
       
        $scope.exportLeaderboard = function () {
          
            ////make a copy of current data
          
         
            $scope.leaderBoardTable = [];
      $scope.leaderBoardTable.push(['First Name','Last Name', 'Points']);
         
           
            $scope.copyData = angular.copy($scope.sortedProgramUsers);
            console.log($scope.copyData);
            $scope.data = [];
           
            angular.forEach($scope.copyData, function (d) {
               
                    $scope.leaderBoardTable.push([
                        d.user.firstName,
                        d.user.lastName,
                        d.points
                    ]);
                    
                });

           
          
           
            var workbook = XLSX.utils.book_new();
            var leaderboardSheet = XLSX.utils.json_to_sheet($scope.leaderBoardTable, {skipHeader:true});
           

            XLSX.utils.book_append_sheet(workbook, leaderboardSheet, 'Leaderboard');

               
            //get todays date
            var today = new Date();
            var dd = today.getDate();
            var mm = today.getMonth() + 1; //January is 0!

            var yyyy = today.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            var today = dd + '/' + mm + '/' + yyyy;

            var fileName = $scope.program.title + ' Leaderboard Table Export ' + today + '.xlsx';

            $timeout(function () {
                XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'file', compression: false });
            }, 300);


        };

    }]);




