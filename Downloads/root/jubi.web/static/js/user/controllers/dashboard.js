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
            statTypeList: [
                {"id": "levelsCompleted", "name": "Levels Completed"},
                {"id": "questsCompleted", "name": "Activities Completed"},
                {"id": "challengesCompleted", "name": "Challenges Completed"},
                {"id": "challengePoints", "name": "Challenge Points"},
                {"id": "todosCompleted", "name": "Do Completed"},
                {"id": "todoPoints", "name": "Do Points"},
                {"id": "totalBasePoints", "name": "Total Points"},
                {"id": "badgesEarned", "name": $scope.getBadgeLabel(true) + 's' + " Earned"}
            ],
            statTypeListCustom: [
                { "id": "sumLevelsCompletedCount", "name": "Levels Completed", selected: true },
                { "id": "sumQuestsCompletedCount", "name": "Activities Completed", selected: true  },
                { "id": "sumChallengesCompletedCount", "name": "Challenges Completed", selected: true  },
                { "id": "sumChallengesCompletedPoints", "name": "Challenge Points", selected: true  },
                { "id": "sumTodosCompletedCount", "name": "Do Completed", selected: true  },
                { "id": "sumTodosCompletedPoints", "name": "Do Points", selected: true  },
                { "id": "sumTotalBasePoints", "name": "Total Points", selected: true  },
                { "id": "sumBadgesEarnedCount", "name": $scope.getBadgeLabel(true) + 's' + " Earned", selected: true  }
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

        $scope.getIntervalName = function (intervalId) {
            var match = "";
            _.each($scope.ui.intervalList, function (interval) {
                if (interval.id == intervalId) {
                    match = interval.name;
                }
            });
            return match;
        };

        $scope.getStatTypeName = function (statTypeId) {
            var match = "";
            _.each($scope.ui.statTypeList, function (statType) {
                if (statType.id == statTypeId) {
                    match = statType.name;
                }
            });
            return match;
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
            var sessionName = $scope.program.title + '.dashboard.filters';
            sessionStorage.setItem(sessionName, JSON.stringify($scope.ui.filters));
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
                thousandsSep: ",",
                downloadXLS: "Download XLS",
                contextButtonTitle: 'Download file'

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
                series: [],
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: [{
                                textKey: 'printChart',
                                onclick: function () {
                                    this.print();
                                }
                            }, {
                                separator: true
                            }, {
                                textKey: 'downloadPNG',
                                onclick: function () {
                                    this.exportChart();
                                }
                            }, {
                                textKey: 'downloadJPEG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/jpeg'
                                    });
                                }
                            }, {
                                textKey: 'downloadPDF',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'application/pdf'
                                    });
                                }
                            }, {
                                textKey: 'downloadSVG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/svg+xml'
                                    });
                                }
                            }
                                // Enable this block to add "View SVG" to the dropdown menu
                                
                            //,{
                    
                            //    text: 'View SVG',
                            //    onclick: function () {
                            //        var svg = this.getSVG()
                            //            .replace(/</g, '\n&lt;')
                            //            .replace(/>/g, '&gt;');

                            //        document.body.innerHTML = '<pre>' + svg + '</pre>';
                            //    }
                            //} // 
                            ]
                        }
                    }
                }
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
            options.yAxis.title.text = "User Progress - " + statTypeName;
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
                series: [],
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: [{
                                textKey: 'printChart',
                                onclick: function () {
                                    this.print();
                                }
                            }, {
                                separator: true
                            }, {
                                textKey: 'downloadPNG',
                                onclick: function () {
                                    this.exportChart();
                                }
                            }, {
                                textKey: 'downloadJPEG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/jpeg'
                                    });
                                }
                            }, {
                                textKey: 'downloadPDF',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'application/pdf'
                                    });
                                }
                            }, {
                                textKey: 'downloadSVG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/svg+xml'
                                    });
                                }
                            }
                                // Enable this block to add "View SVG" to the dropdown menu
                                /*
                                ,{
                    
                                    text: 'View SVG',
                                    onclick: function () {
                                        var svg = this.getSVG()
                                            .replace(/</g, '\n&lt;')
                                            .replace(/>/g, '&gt;');
                    
                                        doc.body.innerHTML = '<pre>' + svg + '</pre>';
                                    }
                                } // */
                            ]
                        }
                    },
                    type:'image/png'
                }
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
                },
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: [{
                                textKey: 'printChart',
                                onclick: function () {
                                    this.print();
                                }
                            }, {
                                separator: true
                            }, {
                                textKey: 'downloadPNG',
                                onclick: function () {
                                    this.exportChart();
                                }
                            }, {
                                textKey: 'downloadJPEG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/jpeg'
                                    });
                                }
                            }, {
                                textKey: 'downloadPDF',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'application/pdf'
                                    });
                                }
                            }, {
                                textKey: 'downloadSVG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/svg+xml'
                                    });
                                }
                            }
                                // Enable this block to add "View SVG" to the dropdown menu
                                /*
                                ,{
                    
                                    text: 'View SVG',
                                    onclick: function () {
                                        var svg = this.getSVG()
                                            .replace(/</g, '\n&lt;')
                                            .replace(/>/g, '&gt;');
                    
                                        doc.body.innerHTML = '<pre>' + svg + '</pre>';
                                    }
                                } // */
                            ]
                        }
                    },
                    type: 'image/png'
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
                var sessionName = $scope.program.title + '.dashboard.filters';
                var filters = sessionStorage.getItem(sessionName);
                if (filters) {
                    $scope.ui.filters = JSON.parse(filters);
                } else {
                    // Set default UI filter values
                    $scope.ui.filters.startDate = moment().startOf("month").toDate();
                    $scope.ui.filters.endDate = moment().toDate();
                    $scope.ui.filters.users.push($scope.thisNetworkUser);
                    $scope.ui.filters.summaryInterval = "week";
                    $scope.ui.filters.statType = "questsCompleted";
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

                    $scope.statsLoaded();
                    
                    /*Picks header from user summary table*/
                    $timeout(function () {
                        $scope.headers1 = [];
                        $scope.headers2 = [];
                        $scope.headers3 = [];
                        $scope.data1 = [];
                        $scope.data2 = [];
                        $scope.data3 = [];
                        var table1 = document.getElementById('userSummary');
                        var table2 = document.getElementById('intervalSummary');
                        var table3 = document.getElementById('detailedStats');
                        
                        for (var i = 0; i < table1.tHead.rows[0].cells.length; i++) {
                            $scope.data1[i] =  table1.tHead.rows[0].cells[i].innerHTML;
                            
                        }
                      
                        $scope.headers1.push($scope.data1);

                        for (var i = 0; i < table2.tHead.rows[0].cells.length; i++) {
                            $scope.data2[i] = table2.tHead.rows[0].cells[i].innerHTML;

                        }

                        $scope.headers2.push($scope.data2);

                        for (var i = 0; i < table3.tHead.rows[0].cells.length; i++) {
                            $scope.data3[i] = table3.tHead.rows[0].cells[i].innerHTML;

                        }

                        $scope.headers3.push($scope.data3);
                       
                    }, 300);

                    
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

        $scope.refresh = function () {
            load(true);
        };
       
        //export Table Data
        $scope.exportTriggered = function () {
            $modal.open({
                templateUrl: 'exportModal.html',
                scope: $scope,
                controller: exportModalControllerObj.exportModalController,
                size: 'md',
                resolve: {
                    initData: function () {
                        return {
                            title: 'Select fields to be exported',
                            customData: $scope.ui.statTypeListCustom,
                            okLabel: 'OK'
                        }
                    }
                }
            });
        };  
         $scope.changeExportOption = function () {
            _.each($scope.ui.statTypeListCustom, function (val) {
                if ($scope.data.summaryByUser.length == 0 || $scope.data.summaryByInterval.length == 0 || $scope.data.details.length == 0) {
                    val.selected = true;
                }

            });
        };

      
        $scope.exportCustomTable = function (val) {
            var temp;
            //make a copy of current data
            var copyData = angular.copy($scope.data);
            console.log(copyData);
            //for every record check to see if its selected by user, then perform removal if needed. 
            _.each(copyData, function (cd, index) {
                if (index === 'summaryByInterval' || index === 'summaryByUser' || index === 'details' || index === 'programItemCounts') {
                    _.each(cd, function (data) {

                        if (index === 'details') {
                            //delete unwanted data
                            delete data.date;
                            delete data.dimDateId;
                            delete data.week;
                            delete data.weekDisplay;
                            delete data.month;
                            delete data.monthName;
                            delete data.monthYear;
                            delete data.mmyyyy;
                            delete data.monthDisplay;
                            delete data.quarter;
                            delete data.quarterName;
                            delete data.quarterDisplay;
                            delete data.year;
                            delete data.yearName;
                            delete data.yearDisplay;
                            delete data.userId;
                            delete data.userFirstName;
                            delete data.userLastName;
                            delete data.programLinkId;
                            delete data.challenges1stAttemptCorrectCount;
                            delete data['User Id'];
                            delete data['Grouped By Week'];
                            delete data.levelsCompletedPoints;
                            delete data.questsCompletedPoints;

                            //rename header Title
                            temp = data.dateDisplay;
                            data['Date'] = temp;
                            delete data.dateDisplay;

                            temp = data.userFullName;
                            data['Grouped By User'] = temp;
                            delete data.userFullName;

                            temp = data.levelsCompletedCount;
                            data['Levels Completed'] = temp;
                            delete data.levelsCompletedCount;

                            temp = data.questsCompletedCount;
                            data['Activities Completed'] = temp;
                            delete data.questsCompletedCount;

                            temp = data.challengesCompletedCount;
                            data['Challenges Completed'] = temp;
                            delete data.challengesCompletedCount;

                            temp = data.challengesCompletedPoints;
                            data['Challenge Points'] = temp;
                            delete data.challengesCompletedPoints;

                            temp = data.todosCompletedCount;
                            data['Do Completed'] = temp;
                            delete data.todosCompletedCount;

                            temp = data.todosCompletedPoints;
                            data['Do Points'] = temp;
                            delete data.todosCompletedPoints;

                            temp = data.totalBasePoints;
                            data['Total Points'] = temp;
                            delete data.totalBasePoints;

                            temp = data.badgesEarnedCount;
                            data['Badges Earned'] = temp;
                            delete data.badgesEarnedCount;

                        }
                        if (index === 'summaryByInterval' || index === 'summaryByUser') {
                            // if index is User Summary or Interval Summary

                            temp = data.userFullName;
                            data['Grouped By User'] = temp;
                            delete data.userFullName;

                            temp = data.weekDisplay;
                            data['Grouped By Week'] = temp;
                            delete data.weekDisplay;

                            if (index == 'summaryByUser') {
                                delete data.userId;
                                delete data['Grouped By Week'];
                            }
                            if (index === 'summaryByInterval') {
                                delete data.week;
                                delete data.month;
                                delete data.monthName;
                                delete data.monthYear;
                                delete data.mmyyyy;
                                delete data.monthDisplay;
                                delete data.quarter;
                                delete data.quarterName;
                                delete data.quarterDisplay;
                                delete data.year;
                                delete data.yearName;
                                delete data.yearDisplay;
                                delete data.date;
                                delete data.dateDisplay;
                                delete data.dimDateId;
                                delete data['User Id'];
                                delete data['Grouped By User'];
                            }

                            temp = data.sumLevelsCompletedCount;
                            data['Levels Completed'] = temp;
                            delete data.sumLevelsCompletedCount;

                            temp = data.sumQuestsCompletedCount;
                            data['Activities Completed'] = temp;
                            delete data.sumQuestsCompletedCount;

                            temp = data.sumChallengesCompletedCount;
                            data['Challenges Completed'] = temp;
                            delete data.sumChallengesCompletedCount;

                            temp = data.sumChallengesCompletedPoints;
                            data['Challenge Points'] = temp;
                            delete data.sumChallengesCompletedPoints;

                            temp = data.sumTodosCompletedCount;
                            data['Do Completed'] = temp;
                            delete data.sumTodosCompletedCount;

                            temp = data.sumTodosCompletedPoints;
                            data['Do Points'] = temp;
                            delete data.sumTodosCompletedPoints;

                            temp = data.sumTotalBasePoints;
                            data['Total Points'] = temp;
                            delete data.sumTotalBasePoints;

                            temp = data.sumBadgesEarnedCount;
                            data['Badges Earned'] = temp;
                            delete data.sumBadgesEarnedCount;
                        }
                        if (index === 'programItemCounts') {
                            //program count
                            temp = data.currentProgramId;
                            data['ProgramId'] = temp;
                            delete data.currentProgramId;

                            temp = data.levelsCount;
                            data['Total Levels'] = temp;
                            delete data.levelsCount;

                            temp = data.questsCount;
                            data['Total Activities'] = temp;
                            delete data.questsCount;

                            temp = data.challengesCount;
                            data['Total Challenges'] = temp;
                            delete data.challengesCount;

                            temp = data.challengesPoints;
                            data['Max Challenge Points'] = temp;
                            delete data.challengesPoints;

                            temp = data.todosCount;
                            data['Total Do Activities'] = temp;
                            delete data.todosCount;

                            temp = data.todosPoints;
                            data['Max Do Activity Points'] = temp;
                            delete data.todosPoints;

                            temp = data.totalBasePoints;
                            data['Max Base Points'] = temp;
                            delete data.totalBasePoints;

                            temp = data.badgesCount;
                            data['Total Badges'] = temp;
                            delete data.badgesCount;

                        }                  
                       
                 
                    
                    //delete un selected data
                    _.each(val, function (v) {
                        if (!v.selected) {//if mot selected then remove it
                            switch (v.id) {
                                case "sumLevelsCompletedCount":

                                    delete data['Levels Completed'];
                                    break;
                                case "sumQuestsCompletedCount":

                                    delete data['Activities Completed'];
                                    break;
                                case "sumChallengesCompletedCount":

                                    delete data['Challenges Completed'];
                                    break;
                                case "sumChallengesCompletedPoints":
                                    delete data['Challenge Points'];
                                    break;
                                case "sumTodosCompletedCount":

                                    delete data['Do Completed'];
                                    break;
                                case "sumTodosCompletedPoints":

                                    delete data['Do Points'];
                                    break;
                                case "sumTotalBasePoints":

                                    delete data['Total Points'];
                                    break;
                                case "sumBadgesEarnedCount":

                                    delete data['Badges Earned'];
                                    break;
                            }
                        }
                    });
                    });
                }
            });

            var workbook = XLSX.utils.book_new();
            var userSummary = copyData.summaryByUser;
            if (userSummary.length == 0) {
                var userSumSheet = XLSX.utils.json_to_sheet($scope.headers1, { skipHeader: true });
            }
            
            else {
                var userSumSheet = XLSX.utils.json_to_sheet(copyData.summaryByUser);
            
            }
            XLSX.utils.book_append_sheet(workbook, userSumSheet, 'User Summary');

            var intervalSummmary = copyData.summaryByInterval;
            if (intervalSummmary.length == 0) {
                var intervalSumSheet = XLSX.utils.json_to_sheet($scope.headers2, { skipHeader: true });
            }

            else {
                var intervalSumSheet = XLSX.utils.json_to_sheet(copyData.summaryByInterval);

            }
            
            XLSX.utils.book_append_sheet(workbook, intervalSumSheet, 'Interval Summary');

            var detail = copyData.details;
            if (detail.length == 0) {
                var detailSumSheet = XLSX.utils.json_to_sheet($scope.headers3, { skipHeader: true });
            }

            else {
                var detailSumSheet = XLSX.utils.json_to_sheet(copyData.details);

            }

            
            XLSX.utils.book_append_sheet(workbook, detailSumSheet, 'Detail Summary');

            var programCount = copyData.programItemCounts;
            var programCSumSheet = XLSX.utils.json_to_sheet(programCount);
            XLSX.utils.book_append_sheet(workbook, programCSumSheet, 'Program Count');

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

            var fileName = $scope.program.title + ' DashBoard Table Export ' + today + '.xlsx'

            $timeout(function () {
                XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'file', compression: false });
            }, 300);


        };

        //Export Chart Data
        $scope.isExporting = false;
        $scope.exportPollTriggered = function () {
            $scope.isExporting = true;
            var copyData = angular.copy($scope.data);
            console.log(copyData);

            var exportDataArray = [];
            var pollData = angular.copy($scope.data.pollQuestions);

            async.eachSeries(pollData, function (question, callback) {

                var data = [];
                var filters = {
                    questionId: question.questionId,
                    users: $scope.dataFilters.users
                };

                $http.post(authService.apiUrl + "/stats/poll-results", filters)
                    .then(function (response) {
                        _.each(response.data.pollResults, function (result) {
                            var answer = result.answer;
                            data.push({
                                name: answer,
                                y: result.resultCount
                            });
                        });
                        var expData = {
                            "Question": question.questionTitle,
                            "data": data
                        }
                        exportDataArray.push(expData);
                        callback();
                    });
            },
                function (err) {
                    if (err) {
                        alert('Error occured, please try again');
                    }

                    //format the questions to remove html tags
                    var htmlRegx = new RegExp("<(\/[a-z])*([a-z])*>");
                    
                    _.each(exportDataArray, function (value) {
                        if (htmlRegx.test(value.Question)) {
                            //console.log("HTML tag present: " + value.Question)
                            var html = value.Question;
                            var div = document.createElement("div");
                            div.innerHTML = html;
                            //console.log(div.innerText);
                            value.Question = div.innerText;
                            
                        }
                    });

                    $scope.exportData = [];
                  
                    // Headers:
                    $scope.exportData.push(["Question", "Items", "Responses"]);
                    // Data:
                    angular.forEach(exportDataArray, function (value, key) {
                       for (var i = 0; i < value.data.length;) {
                           $scope.exportData.push([value.Question, value.data[i].name, value.data[i].y]);
                           i++;
                           value.Question = '';
                        }
                        $scope.exportData.push([]);
                     });
                   
                    // convert to excel
                    var workbook = XLSX.utils.book_new();

                   // var pollSummary = finalArray;
                    var userSumSheet = XLSX.utils.json_to_sheet($scope.exportData, { skipHeader: true });
                    XLSX.utils.book_append_sheet(workbook, userSumSheet, 'Poll Summary');

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

                    var fileName = $scope.program.title + ' DashBoard Poll Export ' + today + '.xlsx'

                    $timeout(function () {
                        XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'file', compression: false });
                    }, 300);
                    $scope.isExporting = false;
                });
        };


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
                }],
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: [{
                                textKey: 'printChart',
                                onclick: function () {
                                    this.print();
                                }
                            }, {
                                separator: true
                            }, {
                                textKey: 'downloadPNG',
                                onclick: function () {
                                    this.exportChart();
                                }
                            }, {
                                textKey: 'downloadJPEG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/jpeg'
                                    });
                                }
                            }, {
                                textKey: 'downloadPDF',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'application/pdf'
                                    });
                                }
                            }, {
                                textKey: 'downloadSVG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/svg+xml'
                                    });
                                }
                            }
                                // Enable this block to add "View SVG" to the dropdown menu
                                /*
                                ,{
                    
                                    text: 'View SVG',
                                    onclick: function () {
                                        var svg = this.getSVG()
                                            .replace(/</g, '\n&lt;')
                                            .replace(/>/g, '&gt;');
                    
                                        doc.body.innerHTML = '<pre>' + svg + '</pre>';
                                    }
                                } // */
                            ]
                        }
                    }
                }
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
                }],
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            menuItems: [{
                                textKey: 'printChart',
                                onclick: function () {
                                    this.print();
                                }
                            }, {
                                separator: true
                            }, {
                                textKey: 'downloadPNG',
                                onclick: function () {
                                    this.exportChart();
                                }
                            }, {
                                textKey: 'downloadJPEG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/jpeg'
                                    });
                                }
                            }, {
                                textKey: 'downloadPDF',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'application/pdf'
                                    });
                                }
                            }, {
                                textKey: 'downloadSVG',
                                onclick: function () {
                                    this.exportChart({
                                        type: 'image/svg+xml'
                                    });
                                }
                            }
                                // Enable this block to add "View SVG" to the dropdown menu
                                /*
                                ,{
                    
                                    text: 'View SVG',
                                    onclick: function () {
                                        var svg = this.getSVG()
                                            .replace(/</g, '\n&lt;')
                                            .replace(/>/g, '&gt;');
                    
                                        doc.body.innerHTML = '<pre>' + svg + '</pre>';
                                    }
                                } // */
                            ]
                        }
                    }
                }
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
            }],
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: [{
                            textKey: 'printChart',
                            onclick: function () {
                                this.print();
                            }
                        }, {
                            separator: true
                        }, {
                            textKey: 'downloadPNG',
                            onclick: function () {
                                this.exportChart();
                            }
                        }, {
                            textKey: 'downloadJPEG',
                            onclick: function () {
                                this.exportChart({
                                    type: 'image/jpeg'
                                });
                            }
                        }, {
                            textKey: 'downloadPDF',
                            onclick: function () {
                                this.exportChart({
                                    type: 'application/pdf'
                                });
                            }
                        }, {
                            textKey: 'downloadSVG',
                            onclick: function () {
                                this.exportChart({
                                    type: 'image/svg+xml'
                                });
                            }
                        }
                            // Enable this block to add "View SVG" to the dropdown menu
                            /*
                            ,{
                
                                text: 'View SVG',
                                onclick: function () {
                                    var svg = this.getSVG()
                                        .replace(/</g, '\n&lt;')
                                        .replace(/>/g, '&gt;');
                
                                    doc.body.innerHTML = '<pre>' + svg + '</pre>';
                                }
                            } // */
                        ]
                    }
                }
            }
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
            }],
            exporting: {
                enabled: true,
                buttons: {
                    contextButton: {
                        menuItems: [{
                            textKey: 'printChart',
                            onclick: function () {
                                this.print();
                            }
                        }, {
                            separator: true
                        }, {
                            textKey: 'downloadPNG',
                            onclick: function () {
                                this.exportChart();
                            }
                        }, {
                            textKey: 'downloadJPEG',
                            onclick: function () {
                                this.exportChart({
                                    type: 'image/jpeg'
                                });
                            }
                        }, {
                            textKey: 'downloadPDF',
                            onclick: function () {
                                this.exportChart({
                                    type: 'application/pdf'
                                });
                            }
                        }, {
                            textKey: 'downloadSVG',
                            onclick: function () {
                                this.exportChart({
                                    type: 'image/svg+xml'
                                });
                            }
                        }
                            // Enable this block to add "View SVG" to the dropdown menu
                            /*
                            ,{
                
                                text: 'View SVG',
                                onclick: function () {
                                    var svg = this.getSVG()
                                        .replace(/</g, '\n&lt;')
                                        .replace(/>/g, '&gt;');
                
                                    doc.body.innerHTML = '<pre>' + svg + '</pre>';
                                }
                            } // */
                        ]
                    }
                }
            }
        };


        this.init = function (slug) {
            $scope.slug = slug;
        };

    }
]);