'use strict';

var module = angular.module('Jubi.controllers');

module.controller('DashboardController', ['$scope', '$q', '$http', '$window', 'authService', '$modal', '$rootScope', '$timeout', 'helperService', '$upload',
    function ($scope, $q, $http, $window, authService, $modal, $rootScope, $timeout, helperService, $upload) {
        $scope.ui = {
            startDatePickerOpen: false,
            endDatePickerOpen: false,
            networkUsers: [],
            intervalList: [
                {"id": "day", "name": "Day"},
                {"id": "week", "name": "Week"},
                {"id": "month", "name": "Month"},
                {"id": "quarter", "name": "Quarter"},
                {"id": "year", "name": "Year"}
            ],
            statTypeListTotal: [                
                {"id": "percentageCompleted", "name": "% Complete","type": "Summary"},
                { "id": "levelsCompleted", "name": "Levels Completed", "type": "Summary" },
                { "id": "questsCompleted", "name": "Activities Completed", "type": "Summary" },
                { "id": "totalPoints", "name": "Points Earned", "type": "Summary" },
                { "id": "badgesEarned", "name": $scope.getBadgeLabel(true) + 's' + " Earned", "type": "Summary" }
            ],
            statTypeListBase: [
               { "id": "basequestsCompleted", "name": "Activities Completed", "type": "Base" },
               { "id": "totalBasePoints", "name": "Points Earned", "type": "Base" },
               { "id": "basechallengesCompleted", "name": "Learn Completed", "type": "Base" },
               { "id": "basechallengePoints", "name": "Learn Points", "type": "Base" },
               { "id": "basetodosCompleted", "name": "Do Completed", "type": "Base" },
               { "id": "basetodoPoints", "name": "Do Points", "type": "Base" },
               { "id": "baseinspireCompleted", "name": "Inspire Completed", "type": "Base" },
                { "id": "baseinspirePoints", "name": "Inspire Points", "type": "Base" }
            ],
            statTypeListBonus: [
               { "id": "bonusquestsCompleted", "name": "Activities Completed", "type": "Bonus" },
                { "id": "totalBonusPoints", "name": "Points Earned", "type": "Bonus" },
               { "id": "bonuschallengesCompleted", "name": "Learn Completed", "type": "Bonus" },
               { "id": "bonuschallengePoints", "name": "Learn Points", "type": "Bonus" },
               { "id": "bonustodosCompleted", "name": "Do Completed", "type": "Bonus" },
               { "id": "bonustodoPoints", "name": "Do Points", "type": "Bonus" },
               { "id": "bonusinspireCompleted", "name": "Inspire Completed", "type": "Bonus" },
               { "id": "bonusinspirePoints", "name": "Inspire Points", "type": "Bonus" },
               { "id": "buddyAwardedPoints", "name": "Buddy Awarded Points", "type": "Bonus" },
               { "id": "discussionActivity", "name": "Discussion Activity", "type": "Bonus" },
               { "id": "discussionPoints", "name": "Discussion Points", "type": "Bonus" }
            ],
            statDisplayAsList: [
                {"id": "number", "name": "Number"},
                {"id": "percentage", "name": "Percentage"}
            ],
            filters: {
                startDate: null,
                endDate: null,
                users: [],
                summaryInterval: "",
                summaryIntervalName: "",
                statType: "",
                statDisplayAs: ""
            },
            groupStats: {
                total: 0,
                totalPct: 0,
                low: 0,
                lowPct: 0,
                lowUser: "",
                high: 0,
                highPct: 0,
                highUser: "",
                average: 0,
                averagePct: 0
            }
        };

        $scope.data = {
            programItemCounts: [],
            groupStats: [],
            summaryByInterval: [],
            summaryByUser: [],
            details: [],
            pollQuestions: []
        };
        $scope.dataFilters = {
            programLinkId: 0,
            startDate: null,
            endDate: null,
            users: [],
            summaryInterval: null
        };

        $scope.isLoading = true;
        $scope.statsLoading = false;
        $scope.questionsLoading = false;

        $scope.activePage = "";
        $scope.statsView = "";
        $scope.userId = authService.user.id;
        $scope.thisNetworkUser = null;

        //Export Data Tables
        var headers = [];
        var data = [];
        var rowData = {};

        // 'Loading' behaviors
        $scope.showLoading = function () {
            $scope.isLoading = true;
        };

        $scope.hideLoading = function () {
            $scope.isLoading = false;
        };

        $scope.statsLoaded = function () {
            $scope.statsLoading = false;
            if (!$scope.questionsLoading) {
                $scope.hideLoading();
            }
        };

        $scope.questionsLoaded = function () {
            $scope.questionsLoading = false;
            if (!$scope.statsLoading) {
                $scope.hideLoading();
            }
        };


        // Utility functions
        $scope.loadNetworkUsers = function () {
            $scope.ui.networkUsers = angular.copy($rootScope.userGroups.concat($rootScope.networkUsers));
            _.each($scope.ui.networkUsers, function (nu) {
                if (!nu.isGroup) {
                    nu.id = nu.userId; //Uses the database userId property as the ID in the select list
                }
                if (nu.userId == $scope.userId) {
                    $scope.thisNetworkUser = nu;
                }
            });
        };


      
        $scope.changeTypename = function (statTypeName) {
           
            $scope.ui.filters.statType = statTypeName.id;
            $scope.statTypeName = statTypeName.name;
            $scope.statTypeType = statTypeName.type;
            $scope.statType = $scope.statTypeType + ' - ' + $scope.statTypeName;
            $scope.refresh();
            $scope.opendropdown = false;
            $scope.opendropdowntable = false;
        };
        $scope.changestatDisplay = function (statDisplay) {
            $scope.ui.filters.statDisplayAs = statDisplay.id;
            $scope.statDisplayAsName = statDisplay.name;
            $scope.refresh();
            $scope.opendisplaydropdown = false;
            $scope.opendisplaydropdowntable = false;
        };
        $scope.getStatDisplayName = function (statDisplayId) {
            var match = "";
            _.each($scope.ui.statDisplayAsList, function (statDisplay) {
                if (statDisplay.id == statDisplayId) {
                    match = statDisplay.name;
                   
                }
            
           
            });

            return match;
        };
        $scope.getStatTypeName = function (statTypeId) {
            var match = "",type = "";
            _.each($scope.ui.statTypeListTotal, function (statType) {
                if (statType.id == statTypeId) {
                    match = statType.name;
                    type = statType.type;
                }
            });
            _.each($scope.ui.statTypeListBase, function (statType) {
                if (statType.id == statTypeId) {
                    match = statType.name;
                    type = statType.type;
                }
            });
            _.each($scope.ui.statTypeListBonus, function (statType) {
                if (statType.id == statTypeId) {
                    match = statType.name;
                    type = statType.type;
                }
            });
            
            return type+' - ' + match;

        };
   
        $scope.getIntervalName = function (intervalId) {
            var match = "";
            _.each($scope.ui.intervalList, function (interval) {
                if (interval.id == intervalId) {
                    match = interval.name;
                }
            });
            return match;
        };
        $scope.changeIntervalName = function (interval) {
            $scope.ui.filters.summaryInterval = interval.id;
            $scope.intervalName = interval.name;
            $scope.refresh();
            $scope.intervaldropdown = false;
        };
        $scope.updateDataFiltersFromUI = function () {
            $scope.dataFilters.programLinkId = $scope.program.linkId;
            $scope.dataFilters.startDate = moment.utc($scope.ui.filters.startDate).startOf('day').toDate();
            $scope.dataFilters.endDate = moment.utc($scope.ui.filters.endDate).endOf('day').toDate();
            $scope.dataFilters.users = [];
            _.each($scope.ui.filters.users, function (user) {
                $scope.dataFilters.users.push(user.id);
            });
            $scope.dataFilters.summaryInterval = $scope.ui.filters.summaryInterval;

            // Store filters in Session Storage for later retrieval
            sessionStorage.setItem("jubi.dashboard.filters", JSON.stringify($scope.ui.filters));
        };

        $scope.changeDates = function () {
            if (moment($scope.ui.filters.startDate).isAfter($scope.ui.filters.endDate)) {
                $scope.ui.filters.startDate = $scope.ui.filters.endDate;
            }
            $scope.refresh();
        };


        // Chart behaviors
        Highcharts.setOptions({
            lang: {
                decimalPoint: ".",
                thousandsSep: ","
            }
        });

        $scope.calcGroupStats = function () {
            var userStat = 0;
            var programStat = 0;

            var total = 0;
            var totalPct = 0;
            var low = 0;
            var lowPct = 0;
            var lowUser = "";
            var high = 0;
            var highPct = 0;
            var highUser = "";
            var average = 0;
            var averagePct = 0;
            var numberOfUsers = 0;

            // Iterate through data.summaryByUser and calculate overall group stats.
            _.each($scope.data.summaryByUser, function (item) {
                // Increment user count for calculating averages
                numberOfUsers++;

                // Determine which stat to look at
                switch ($scope.ui.filters.statType) {
                    case "levelsCompleted":
                        userStat = item.sumLevelsCompletedCount;
                        programStat = $scope.data.programItemCounts[0].levelsCount;
                        break;
                    case "questsCompleted":
                        userStat = item.sumQuestsCompletedCount;
                        programStat = $scope.data.programItemCounts[0].questsCount;
                        break;
                    case "challengesCompleted":
                        userStat = item.sumChallengesCompletedCount;
                        programStat = $scope.data.programItemCounts[0].challengesCount;
                        break;
                    case "challengePoints":
                        userStat = item.sumChallengesCompletedPoints;
                        programStat = $scope.data.programItemCounts[0].challengesPoints;
                        break;
                    case "todosCompleted":
                        userStat = item.sumTodosCompletedCount;
                        programStat = $scope.data.programItemCounts[0].todosCount;
                        break;
                    case "todoPoints":
                        userStat = item.sumTodosCompletedPoints;
                        programStat = $scope.data.programItemCounts[0].todosPoints;
                        break;
                    case "totalBasePoints":
                        userStat = item.sumTotalBasePoints;
                        programStat = $scope.data.programItemCounts[0].totalBasePoints;
                        break;
                    case "badgesEarned":
                        userStat = item.sumBadgesEarnedCount;
                        programStat = $scope.data.programItemCounts[0].badgesCount;
                        break;
                }

                // Calculate the group stats.
                total += userStat;
                totalPct = (programStat == 0) ? 0 : (total / (programStat * numberOfUsers));
                lowUser = (lowUser == "") ? item.userFullName : ((userStat < low) ? item.userFullName : lowUser);
                low = (low == 0) ? userStat : ((userStat < low) ? userStat : low);
                lowPct = (programStat == 0) ? 0 : (low / programStat);
                highUser = (highUser == "") ? item.userFullName : ((userStat > high) ? item.userFullName : highUser);
                high = (high == 0) ? userStat : ((userStat > high) ? userStat : high);
                highPct = (programStat == 0) ? 0 : (high / programStat);
                average = total / numberOfUsers;
                averagePct = (programStat == 0) ? 0 : (average / programStat);
            });

            // Update scope variables.
            $scope.ui.groupStats.total = total;
            $scope.ui.groupStats.totalPct = totalPct;
            $scope.ui.groupStats.low = low;
            $scope.ui.groupStats.lowPct = lowPct;
            $scope.ui.groupStats.lowUser = lowUser;
            $scope.ui.groupStats.high = high;
            $scope.ui.groupStats.highPct = highPct;
            $scope.ui.groupStats.highUser = highUser;
            $scope.ui.groupStats.average = average;
            $scope.ui.groupStats.averagePct = averagePct;
            $scope.ui.groupStats.numberOfUsers = numberOfUsers;
            $scope.ui.groupStats.programStat = programStat;
        };

        $scope.updateProgressChart = function () {
            // Setup overall options for the chart
            var options = {
                title: {
                    text: ""
                },
                subtitle: {
                    text: ""
                },
                xAxis: {
                    categories: [],
                    title: {
                        text: ""
                    }
                },
                yAxis: {
                    min: 0,
                    max: undefined,
                    tickInterval: 1,
                    title: {
                        text: ""
                    }
                },
                tooltip: {
                    headerFormat: "<span style='font-size:10px'>{point.key}</span><table>",
                    pointFormat: "<tr><td style='color:{series.color};padding:0'>{series.name}: </td>" +
                    "<td style='padding:0'><b>{point.y:.1f}</b></td></tr>",
                    footerFormat: "</table>",
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                credits: {
                    enabled: false
                },
                series: []
            };

            // Options based on filters
            var statTypeName = $scope.getStatTypeName($scope.ui.filters.statType);
            options.subtitle.text = moment.utc($scope.ui.filters.startDate).format("MM/DD/YYYY") + " to " + moment.utc($scope.ui.filters.endDate).format("MM/DD/YYYY");
            options.xAxis.title.text = "Users";

            // Data series variables
            var seriesTotal = {
                type: "bar",
                name: statTypeName,
                data: []
            };
            var seriesGroupAverage = {
                type: "line",
                marker: {
                    enabled: false
                },
                name: "Group Average",
                data: []
            };

            // Adjust length of yAxis based on program limits
            switch ($scope.ui.filters.statType) {
                case "questsCompleted":
                    options.yAxis.max = $scope.data.programItemCounts[0].questsCount;
                    break;
                case "levelsCompleted":
                    options.yAxis.max = $scope.data.programItemCounts[0].levelsCount;
                    break;
                case "challengesCompleted":
                    options.yAxis.max = $scope.data.programItemCounts[0].challengesCount;
                    break;
                case "challengePoints":
                    options.yAxis.max = $scope.data.programItemCounts[0].challengesPoints;
                    break;
                case "todosCompleted":
                    options.yAxis.max = todosTotalCals($scope.data, 'todosCompleted'); //$scope.data.programItemCounts[0].todosCount == 0 ? 10 : $scope.data.programItemCounts[0].todosCount ;
                    break;
                case "todoPoints":
                    options.yAxis.max = todosTotalCals($scope.data, 'todoPoints'); // $scope.data.programItemCounts[0].todosPoints == 0 ? 50 : $scope.data.programItemCounts[0].todosPoints ;
                    break;
                case "totalBasePoints":
                    options.yAxis.max = $scope.data.programItemCounts[0].totalBasePoints;
                    break;
                case "badgesEarned":
                    options.yAxis.max = $scope.data.programItemCounts[0].badgesCount;
                    break;
            }


            // Populate user stats
            _.each($scope.data.summaryByUser, function (summaryRow) {
                options.xAxis.categories.push(summaryRow.userFullName);
                switch ($scope.ui.filters.statType) {
                    case "questsCompleted":
                        seriesTotal.data.push(summaryRow.sumQuestsCompletedCount);
                        break;
                    case "levelsCompleted":
                        seriesTotal.data.push(summaryRow.sumLevelsCompletedCount);
                        break;
                    case "challengesCompleted":
                        seriesTotal.data.push(summaryRow.sumChallengesCompletedCount);
                        break;
                    case "challengePoints":
                        seriesTotal.data.push(summaryRow.sumChallengesCompletedPoints);
                        break;
                    case "todosCompleted":
                        seriesTotal.data.push(summaryRow.sumTodosCompletedCount);
                        break;
                    case "todoPoints":
                        seriesTotal.data.push(summaryRow.sumTodosCompletedPoints);
                        break;
                    case "totalBasePoints":
                        seriesTotal.data.push(summaryRow.sumTotalBasePoints);
                        break;
                    case "badgesEarned":
                        seriesTotal.data.push(summaryRow.sumBadgesEarnedCount);
                        break;
                }

                seriesGroupAverage.data.push($scope.ui.groupStats.average);
            });
            options.xAxis.max = seriesGroupAverage.data.length > 10 ? 10 : undefined;

            if(options.xAxis.max  < (seriesGroupAverage.data.length - 1)) {
                options.scrollbar = {
                    enabled: true,
                    barBackgroundColor: 'gray',
                    barBorderRadius: 7,
                    barBorderWidth: 0,
                    buttonBackgroundColor: 'gray',
                    buttonBorderWidth: 0,
                    buttonBorderRadius: 7,
                    trackBackgroundColor: 'none',
                    trackBorderWidth: 1,
                    trackBorderRadius: 8,
                    trackBorderColor: '#CCC'
                };
            }
            options.yAxis.title.text = statTypeName;
            options.title.text = options.yAxis.title.text;
            options.series = [seriesTotal, seriesGroupAverage];

            // Draw the chart
            $('#progressChart').highcharts(options);
        };

        $scope.updateStatsChart = function () {
            // Setup overall options for the chart
            var options = {
                title: {
                    text: ""
                },
                subtitle: {
                    text: ""
                },
                xAxis: {
                    categories: [],
                    title: {
                        text: ""
                    }
                },
                yAxis: {
                    minRange: 0,
                    title: {
                        text: ""
                    }
                },
                tooltip: {
                    headerFormat: "<span style='font-size:10px'>{point.key}</span><table>",
                    pointFormat: "<tr><td style='color:{series.color};padding:0'>{series.name}: </td>" +
                    "<td style='padding:0'><b>{point.y:.1f}</b></td></tr>",
                    footerFormat: "</table>",
                    shared: true,
                    useHTML: true
                },
                plotOptions: {
                    column: {
                        pointPadding: 0.2,
                        borderWidth: 0
                    }
                },
                credits: {
                    enabled: false
                },
                series: []
            };

            // Options based on filters
            var summaryIntervalName = $scope.getIntervalName($scope.ui.filters.summaryInterval);
            options.subtitle.text = moment.utc($scope.ui.filters.startDate).format("MM/DD/YYYY") + " to " + moment.utc($scope.ui.filters.endDate).format("MM/DD/YYYY");
            options.xAxis.title.text = summaryIntervalName + "s";

            // Data series variables
            var seriesTotal = {
                type: "column",
                name: "Total",
                data: []
            };
            var seriesGroupAverage = {
                type: "line",
                marker: {
                    enabled: false
                },
                name: "Group Average",
                data: []
            };

            // Populate axes and data series
            _.each($scope.data.summaryByInterval, function (summaryRow) {
                switch ($scope.ui.filters.summaryInterval) {
                    case "day":
                        options.xAxis.categories.push(summaryRow.dateDisplay);
                        break;
                    case "week":
                        options.xAxis.categories.push(summaryRow.weekDisplay);
                        break;
                    case "month":
                        options.xAxis.categories.push(summaryRow.monthDisplay);
                        break;
                    case "quarter":
                        options.xAxis.categories.push(summaryRow.quarterDisplay);
                        break;
                    case "year":
                        options.xAxis.categories.push(summaryRow.yearDisplay);
                        break;
                }

                switch ($scope.ui.filters.statType) {
                    case "questsCompleted":
                        seriesTotal.data.push(summaryRow.sumQuestsCompletedCount);
                        break;
                    case "levelsCompleted":
                        seriesTotal.data.push(summaryRow.sumLevelsCompletedCount);
                        break;
                    case "challengesCompleted":
                        seriesTotal.data.push(summaryRow.sumChallengesCompletedCount);
                        break;
                    case "challengePoints":
                        seriesTotal.data.push(summaryRow.sumChallengesCompletedPoints);
                        break;
                    case "todosCompleted":
                        seriesTotal.data.push(summaryRow.sumTodosCompletedCount);
                        break;
                    case "todoPoints":
                        seriesTotal.data.push(summaryRow.sumTodosCompletedPoints);
                        break;
                    case "totalBasePoints":
                        seriesTotal.data.push(summaryRow.sumTotalBasePoints);
                        break;
                    case "badgesEarned":
                        seriesTotal.data.push(summaryRow.sumBadgesEarnedCount);
                        break;
                }

                seriesGroupAverage.data.push($scope.ui.groupStats.average);
            });

            options.yAxis.title.text = $scope.getStatTypeName($scope.ui.filters.statType);
            options.title.text = options.yAxis.title.text + " - By " + summaryIntervalName;
            options.series = [seriesTotal, seriesGroupAverage];

            // Draw the chart
            $('#statsChart').highcharts(options);
        };// Stats chart, bottom

        $scope.updateSpinChart = function () {

            var completed = 0;
            var notcompleted = 0;

            // Populate data based on user's selection
            switch ($scope.ui.filters.statDisplayAs) {
                case "percentage":
                    completed = $scope.ui.groupStats.averagePct;
                    notcompleted = 1 - completed;
                    break;
                case "number":
                    completed = $scope.ui.groupStats.average;
                    notcompleted = ($scope.ui.groupStats.programStat * $scope.ui.groupStats.numberOfUsers);
                default:
                    break;
            }

            // Create the chart
            var options = {
                chart: {
                    type: "pie",
                    backgroundColor: "rgba(0,0,0,0)",
                    borderColor: "rgba(0,0,0,0)",
                    width: 250,
                    height: 250
                },
                colors: ["#14b9c0;", "#5BC0DE"],
                plotOptions: {
                    pie: {
                        borderWidth: 0,
                        allowPointSelect: true,
                        cursor: "pointer",
                        dataLabels: {enabled: false},
                        innerSize: 190
                    },
                    series: {
                        lineWidth: 0,
                        states: {hover: {enabled: false}}
                    }
                },
                tooltip: {enabled: false},
                series: [{
                    data: [
                        {
                            id: "completed",
                            y: completed
                        },
                        {
                            id: "notcompleted",
                            y: notcompleted
                        }],
                    dataLabels: {
                        enabled: true,
                        useHTML: true,
                        formatter: function () {
                            // Only display the progress point.
                            if (this.point.id == "completed") {
                                var val = this.y;
                                if ($scope.ui.filters.statDisplayAs == "percentage") {
                                    val = ((this.y) * 100).toFixed(0) + "%";
                                    return '<span class="dashboard-spin-progress">' + val + '</span>';
                                }
                                return '<span class="dashboard-spin-progress">' + val.toFixed(1) + '</span>';
                            } else {
                                return null;
                            }
                        },
                        distance: -100
                    }
                }],
                title: {
                    text: null
                },
                credits: {
                    enabled: false
                }
            };

            // Draw the chart
            $("#spinChart").highcharts(options);

        };// poll results

        //temp calculation for todos completed and todopoints
        var todosTotalCals = function (data, caseName) {
            var highestTodoComplete = 0;
            var highestTodoPoint = 0;

            _.each($scope.data.summaryByUser, function (summaryRow) {
                highestTodoComplete = highestTodoComplete > summaryRow.sumTodosCompletedCount ? highestTodoComplete : summaryRow.sumTodosCompletedCount;
                highestTodoPoint = highestTodoPoint > summaryRow.sumTodosCompletedPoints ? highestTodoPoint : summaryRow.sumTodosCompletedPoints;
            });

            if (caseName == 'todosCompleted') {
                return highestTodoComplete + 5;
            } else {
                return highestTodoPoint + 5;
            }
        };

        // Main page (and data) load functions.
        var load = function (refresh) {
            $scope.showLoading();

            if (!refresh) {
                // Setup Users dropdown
                $scope.loadNetworkUsers();

                // Check Session Storage for existing filters
                var filters = sessionStorage.getItem("jubi.dashboard.filters");
                if (filters) {
                    $scope.ui.filters = JSON.parse(filters);
                } else {
                    // Set default UI filter values
                    $scope.ui.filters.startDate = moment().startOf("month").toDate();
                    $scope.ui.filters.endDate = moment().toDate();
                    $scope.ui.filters.users.push($scope.thisNetworkUser);
                    $scope.ui.filters.summaryInterval = "week";
                    $scope.ui.filters.statType = "percentageCompleted";
                    $scope.ui.filters.statDisplayAs = "number";
                 
                }

                // Set default page
                $scope.activePage = "progressStats";
                $scope.statsView = "chart";
            }

            $scope.updateDataFiltersFromUI();
            // Load data
            $scope.statsLoading = true;
            $http.post(authService.apiUrl + "/stats/program-user-stats", $scope.dataFilters)
                .then(function (response) {
                    $scope.data.programItemCounts = response.data.programItemCounts;
                    $scope.data.summaryByInterval = response.data.summaryByInterval;
                    $scope.data.summaryByUser = response.data.summaryByUser;
                    $scope.data.details = response.data.details;

                    $scope.ui.filters.summaryIntervalName = $scope.getIntervalName($scope.ui.filters.summaryInterval);
                   
                    $scope.calcGroupStats();
                    $scope.updateProgressChart();
                    $scope.updateStatsChart();
                    $scope.updateSpinChart();
                    $scope.statDisplayAsName = $scope.getStatDisplayName($scope.ui.filters.statDisplayAs);
                    $scope.statType = $scope.getStatTypeName($scope.ui.filters.statType);
                    $scope.intervalName = $scope.ui.filters.summaryIntervalName;
                    $scope.statsLoaded();                   
                });

            $scope.questionsLoading = true;
            $http.post(authService.apiUrl + "/stats/program-poll-questions", {programId: $scope.program.id})
                .then(function (response) {
                    var questions = _.sortBy(response.data.programPollQuestions, function (q) {
                        return q.challengeId
                    });

                    // If user is not a System Admin, limit their Poll Questions
                    // to only the ones they have completed.
                    if (questions.length > 0) {
                        if (!authService.canSystemAdmin()) {
                            $http.post(authService.apiUrl + "/stats/completed-challenges", {
                                    programId: $scope.program.id,
                                    userId: authService.user.id
                                })
                                .then(function (response) {
                                    var completed = response.data.completedChallenges;
                                    var show = [];

                                    _.each(questions, function (q) {
                                        var found = _.find(completed, function (c) {
                                            return c.challengeId == q.challengeId;
                                        });
                                        if (found) {
                                            show.push(q);
                                        }
                                    });

                                    $scope.data.pollQuestions = !authService.canAdmin() ? show : questions;
                                    $scope.questionsLoaded();
                                });
                        } else {
                            $scope.data.pollQuestions = questions;
                            $scope.questionsLoaded();
                        }
                    } else {
                        $scope.questionsLoaded();
                    }
                   
                   
                });
         
            
        }; 

        $scope.exportTriggered = function () {

            console.log('export triggered');
            var workbook = XLSX.utils.book_new();
            var worksheet = XLSX.utils.table_to_sheet(document.getElementById('userSummary'));
            XLSX.utils.book_append_sheet(workbook, worksheet, "UserSummary");
            var intervalSumSheet = XLSX.utils.table_to_sheet(document.getElementById('intervalSummary'));
            XLSX.utils.book_append_sheet(workbook, intervalSumSheet, "Interval Summary");
            var detailStatSheet = XLSX.utils.table_to_sheet(document.getElementById('detailedStats'));
            XLSX.utils.book_append_sheet(workbook, detailStatSheet, "Detailed Stats");


            $timeout(function () {
                XLSX.writeFile(workbook, 'Export.xlsx', { bookType: 'xlsx', type: 'file', compression: false });
            }, 300);
            

            /*Picks data from user summary table*/
            //$timeout(function () {
            //    var table1 = document.getElementById('userSummary');
            //    for (var i = 0; i < table1.tHead.rows[0].cells.length; i++) {
            //        headers[i] = table1.tHead.rows[0].cells[i].innerHTML;
            //    }
            //    for (var j = 0; j < table1.tBodies[0].rows.length; j++) {

            //        for (var k = 0; k < table1.tBodies[0].rows[j].cells.length; k++) {
            //            rowData[headers[k]] = table1.tBodies[0].rows[j].cells[k].innerHTML;

            //        }
            //        data.push(rowData);
            //    }

            //    /*converts to Json data*/
            //    var json = JSON.stringify(data);

            //    console.log(json);
            //}, 300);

        };
       
        $scope.refresh = function () {
            load(true);
         
        };
        $scope.opendropdown = false;
        $scope.opendisplaydropdown = false;
        $scope.opendropdowntable = false;
        $scope.opendisplaydropdowntable = false;
        $scope.openlistdropdown = false;
        $scope.intervaldropdown = false;
        //hide/show stattype
        $scope.openStattype = function () {
            $scope.opendropdown = !$scope.opendropdown;
            $scope.opendropdowntable = !$scope.opendropdowntable;
            if ($scope.opendropdown == true || $scope.opendropdowntable == true) {
                $('ul.collapse.in').collapse('hide');
                $('a.active').removeClass('active'); 
            }
        };
        $scope.openstatDisplay = function () {
            $scope.opendisplaydropdown = !$scope.opendisplaydropdown;
            $scope.opendisplaydropdowntable = !$scope.opendisplaydropdowntable;
        };

        $scope.openIntervalName = function()
        {
            $scope.intervaldropdown = !$scope.intervaldropdown;
        }
        $('body').bind('click', function (e) {
            if ($(e.target).closest('#openDropdown').length == 0) {
                if ($scope.opendropdown || $scope.opendropdowntable) {
                    $scope.opendropdown = false;
                    $scope.opendropdowntable = false;
                    $scope.$apply();
                }
            }
            if ($(e.target).closest('#openDisplayDropdown').length == 0) {
                if ($scope.opendisplaydropdown || $scope.opendisplaydropdowntable) {
                    $scope.opendisplaydropdown = false;
                    $scope.opendisplaydropdowntable = false;
                $scope.$apply();
            }
            }
            if ($(e.target).closest('#intervalDropdown').length == 0) {
                if ($scope.intervaldropdown) {
                    $scope.intervaldropdown = false;
                    $scope.$apply();
                }
            }
        });
        
        $('a[data-toggle="collapse"]').click(function (event) {

            event.stopPropagation();
            event.preventDefault();

            $('.collapse.in').collapse('hide');
            $('a.active').removeClass('active');
            
            var col_id = $(this).attr("href");
            $(col_id).collapse('toggle');
            $(this).toggleClass('active');
                      
            });
        // Users dropdown behaviors
        $scope.selectAllUsers = function () {
            $scope.ui.filters.users = _.filter($scope.ui.networkUsers, function (user) {
                return !user.isGroup;
            });
            $scope.refresh();
        };

        $scope.unselectAllUsers = function () {
            $scope.ui.filters.users = [];
            $scope.refresh();
        };

        $scope.groupSelected = function (group) {
            _.each(group.programUsers, function (groupUser) {
                if (_.findWhere($scope.ui.filters.users, {id: groupUser.programUser.userId}) == null
                    && _.findWhere($scope.ui.networkUsers, {id: groupUser.programUser.userId}) != null) {
                    groupUser.programUser.id = groupUser.programUser.userId;
                    $scope.ui.filters.users.push(groupUser.programUser);
                }
            });
            $scope.refresh();
        };

        $scope.removeGroup = function (group) {
            $modal.open({
                templateUrl: 'confirmModal.html',
                controller: confirmModalControllerObj.confirmModalController,
                size: 'sm',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Delete Group?',
                            text: 'Are you sure you want to delete this user group?',
                            ok: 'Yes', cancel: 'No'
                        }
                    }
                }
            }).result.then(
                function () {
                    $http.post(authService.apiUrl + '/program-user-group/' + group.id + '/delete')
                        .success(function () {
                            $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
                            $rootScope.$emit('userGroupRemoved', group);
                        }).error(function (err) {
                        $scope.submitError = err;
                    })
                })
        };

        $scope.createUserGroup = function () {
            $rootScope.showCreateUserGroup($scope.model.networkUsers);
        };

        $scope.showCreateGroup = function () {
            return $scope.ui.filters.users.length > 1
        };

        $rootScope.$on('userGroupAdded', function (e, item) {
            $rootScope.formatUserGroup(item);
            $scope.ui.networkUsers.unshift(item);
        });

        $rootScope.$on('userGroupRemoved', function (e, item) {
            var groups = _.filter($scope.ui.networkUsers, function (user) {
                return user.isGroup == true && user.id == item.id;
            });
            _.each(groups, function (group) {
                $scope.ui.networkUsers = _.without($scope.ui.networkUsers, group);
            });
        });

        $scope.createUserGroup = function (e) {
            var users = [];
            _.each($scope.ui.networkUsers, function (uiNetworkUser) {
                if (uiNetworkUser.type != 'User Groups') {
                    users.push(_.findWhere($rootScope.networkUsers, {userId: uiNetworkUser.id}));
                }
            });

            var networkUsers = _.filter(users, function (networkUser) {
                return _.find($scope.ui.filters.users, function (user) {
                        return user.id == networkUser.userId
                    }) != null
            });
            $rootScope.showCreateUserGroup(networkUsers);
        };
       
        $scope.$watch(function () {
            return $rootScope.networkUsers;
        }, function () {
            if (!$rootScope.networkUsers) return;
            load();
            
        });


        // Active 'page' behavior
        $scope.setActivePage = function (e, page) {
            e.preventDefault();
            e.stopPropagation();
            $scope.activePage = page;
        };

        $scope.isActivePage = function (page) {
            return $scope.activePage == page;
        };


        // Flip card behavior
        $scope.doFlip = function (e, question) {
            e.stopPropagation();

                
            $(e.currentTarget).hasClass("flip") ? $(e.currentTarget).removeClass("flip") : $(e.currentTarget).addClass("flip");

            if (question != null) {
                if (question.activeChart == null) {
                    $scope.loadPollResults(question);
                }
            }
        };

        $scope.loadPollResults = function (question) {
            // Setup chart objects with basic options
            var pie = {
                options: {
                    chart: {
                        type: "pie",
                        height: 300
                    },
                    tooltip: {
                        headerFormat: "",
                        pointFormat: "{point.name}: <b>{point.percentage:.1f}%</b>"
                    },
                    title: {
                        text: "",
                        style: {
                            fontSize: "13px"
                        }
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: "pointer",
                            dataLabels: {
                                distance: -30,
                                enabled: true,
                                format: "{y:.0f}"
                            },
                            showInLegend: true
                        }
                    },
                    credits: {
                        enabled: false
                    }
                },
                series: [{
                    name: "Results",
                    colorByPoint: true,
                    data: []
                }]
            };
            var bar = {
                options: {
                    chart: {
                        type: "bar",
                        height: 300
                    },
                    tooltip: {
                        headerFormat: "",
                        pointFormat: "{point.name}: <b>{point.y}</b>"
                    },
                    title: {
                        text: "",
                        style: {
                            fontSize: "13px"
                        }
                    },
                    plotOptions: {
                        bar: {
                            dataLabels: {
                                enabled: true,
                                format: "{y:.0f}"
                            }
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        categories: [],
                        title: {
                            text: null
                        }
                    },
                    yAxis: {
                        title: {
                            text: null
                        }
                    },
                    legend: {
                        enabled: false
                    }
                },
                series: [{
                    name: "Results",
                    colorByPoint: true,
                    data: []
                }]
            };


            // Load data
            var filters = {
                questionId: question.questionId,
                users: $scope.dataFilters.users
            };
            var data = [];
            var barCategories = [];
            $http.post(authService.apiUrl + "/stats/poll-results", filters)
                .then(function (response) {
                    _.each(response.data.pollResults, function (result) {
                        var answer = result.answer;
                        if (answer.length > 20) {
                            answer = answer.substring(0, 20) + "...";
                        }
                        data.push({
                            name: answer,
                            y: result.resultCount
                        });
                        barCategories.push(answer);
                    });
                });


            // Update chart properties with data
            pie.options.title.text = question.questionTitle;
            pie.series[0].data = data;

            bar.options.title.text = question.questionTitle;
            bar.options.xAxis.categories = barCategories;
            bar.series[0].data = data;


            // Set bound properties
            question.chartPie = pie;
            question.chartBar = bar;
            question.chartDisplayAs = "pie";

            $scope.setChartDisplay(question);
        };

        $scope.setChartDisplay = function (question) {
            switch (question.chartDisplayAs) {
                case "pie":
                    question.activeChart = question.chartPie;
                    break;
                case "bar":
                    question.activeChart = question.chartBar;
                default:
                    break;
            }
        };


        // Sample charts
        $scope.chartPie = {
            options: {
                chart: {
                    type: "pie",
                    height: 300
                },
                tooltip: {
                    headerFormat: "",
                    pointFormat: "{point.name}: <b>{point.percentage:.1f}%</b>"
                },
                title: {
                    text: "Are you a competitive person? Would you be looking at the Leaderboard a lot?",
                    style: {
                        fontSize: "13px"
                    }
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: "pointer",
                        dataLabels: {
                            distance: -30,
                            enabled: true,
                            format: "{y:.0f}"
                        },
                        showInLegend: true
                    }
                }
            },
            series: [{
                name: "Results",
                colorByPoint: true,
                data: [{
                    name: "IE 9+",
                    y: 56
                }, {
                    name: "Chrome",
                    y: 24
                }, {
                    name: "Firefox",
                    y: 10
                }, {
                    name: "Safari",
                    y: 4
                }, {
                    name: "Opera",
                    y: 1
                }, {
                    name: "Other",
                    y: 1
                }]
            }]
        };
        $scope.chartBar = {
            options: {
                chart: {
                    type: "bar",
                    height: 300
                },
                tooltip: {
                    headerFormat: "",
                    pointFormat: "{point.name}: <b>{point.percentage:.1f}%</b>"
                },
                title: {
                    text: "Which driving principle from the video do you feel represents your biggest area of opportunity?Which driving principle from the video do you feel represents your biggest area of opportunity?",
                    style: {
                        fontSize: "13px"
                    }
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true,
                            format: "{y:.0f}"
                        }
                    }
                },
                xAxis: {
                    categories: ["IE 9+", "Chrome", "Firefox", "Safari", "Opera", "Other"],
                    title: {
                        text: null
                    }
                },
                yAxis: {
                    title: {
                        text: null
                    }
                },
                legend: {
                    enabled: false
                }
            },
            series: [{
                name: "Results",
                colorByPoint: true,
                data: [{
                    name: "IE 9+",
                    y: 56
                }, {
                    name: "Chrome",
                    y: 24
                }, {
                    name: "Firefox",
                    y: 10
                }, {
                    name: "Safari",
                    y: 4
                }, {
                    name: "Opera",
                    y: 1
                }, {
                    name: "Other",
                    y: 1
                }]
            }]
        };


        this.init = function (slug) {
            $scope.slug = slug;
        };

    }
]);