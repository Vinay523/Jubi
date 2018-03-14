var helperServiceObj = {};
helperServiceObj.helperService = function () {
    var factory = {

        todoStatuses: {
            locked: {
                value: 'locked'
            },
            unlocked: {
                value: 'unlocked'
            },
            submitted: {
                value: 'submitted'
            },
            verified: {
                value: 'verified'
            },
            completed: {
                value: 'completed'
            }
        },

        charCodes: {
            enter: {
                charCode: 13
            },
            number0: {
                charCode: 48
            },
            number1: {
                charCode: 49
            },
            number2: {
                charCode: 50
            },
            number3: {
                charCode: 51
            },
            number4: {
                charCode: 52
            },
            number5: {
                charCode: 53
            },
            number6: {
                charCode: 54
            },
            number7: {
                charCode: 55
            },
            number8: {
                charCode: 56
            },
            number9: {
                charCode: 57
            },
            numPad0: {
                charCode: 96
            },
            numPad1: {
                charCode: 97
            },
            numPad2: {
                charCode: 98
            },
            numPad3: {
                charCode: 99
            },
            numPad4: {
                charCode: 100
            },
            numPad5: {
                charCode: 101
            },
            numPad6: {
                charCode: 102
            },
            numPad7: {
                charCode: 103
            },
            numPad8: {
                charCode: 104
            },
            numPad9: {
                charCode: 105
            },
            tab: {
                charCode: 9
            },
            deleteKey: {
                charCode: 46
            },
            numPadDeleteKey: {
                charCode: 17
            },
            backspace: {
                charCode: 8
            },
            leftArrow: {
                charCode: 37
            },
            rightArrow: {
                charCode: 39
            },
            period: {
                charCode: 190
            },
            decimalPoint: {
                charCode: 110
            },
            comma: {
                charCode: 188
            },
        },
        sequencingTypes: {
            inOrder: {
                id: 1
            },
            parallel: {
                id: 2
            },
            interval: {
                id: 3
            }
        },
        sequencingTypeIntervalStartTypes: {
            onStartDate: {
                id: 1
            },
            onSpecificDate: {
                id: 2
            }
        },
        questionTypes: {
            singleSelect: {id: 1},
            multiSelect: {id: 2},
            poll: {id: 3},
            narrative: {id: 4},
            fillBlank: {id: 5},
            matching: {id: 6},
            shortAnswer: {id: 7},
            contrasting: {id: 8},
            sentenceBuilder: {id: 9},
            freeContrasting: {id: 10},
            sequencing: {id: 11},
            grouping: {id: 13},
            pollMultiSelect: {id: 14}
        },

        getQueryValue: function (key) {
            var result = window.location.search.match(new RegExp(key + "=(.*?)($|\&)", "i"));
            if (!result || result.length < 2) return null;
            return decodeURIComponent(result[1]);
        },


        validLink: function (link) {
            var r = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\b([-a-zA-Z0-9@:%_\+.~#?&/=]*)/g;
            return r.test(link);
        },
        validImageFile: function (name) {
            var r = /((\.png)|(\.jpg)|(\.jpeg)|(\.gif))$/;
            return r.test(name.toLowerCase());
        },
        maxImageSize: (1024 * 1024 * 4),    // 4mb

        validUploadFile: function (name) {
            var r = /(\.pdf)|(\.docx)|(\.pptx)|(\.xlsx)$/;
            return r.test(name.toLowerCase());
        },
        maxFileSize: (1024 * 1024 * 8),    //  was 4m

        validVideoFile: function (name) {
            var r = /((\.avi)|(\.mp4)|(\.ogv)|(\.ogg)|(\.wmv)|(\.webm)|(\.mov))$/;
            return r.test(name.toLowerCase());
        },
        maxVideoSize: (1024 * 1024 * 100),    // 100mb

        validAudioFile: function (name) {
            var r = /((\.mp3)|(\.wma)|(\.wav))$/;
            return r.test(name.toLowerCase());
        },
        maxAudioSize: (1024 * 1024 * 100),    // 100mb
        validEmail: function (email) {
            var r = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return r.test(email);
        },
        validInteger: function (num) {
            var r = /\d+/;
            return r.test(num);
        },
        roundDate: function (d) {
            return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        },
        checkProgramContent: function (program) {
            if (program.hasSavedContent == undefined) {
                var hasSavedContent = false;

                if (_.find(program.todos, function (t) {
                        return t.slug != null && t.slug != undefined;
                    }) != null) {
                    hasSavedContent = true;
                }

                if (!hasSavedContent && _.find(program.badges, function (t) {
                        return t.slug != null && t.slug != undefined;
                    }) != null) {
                    hasSavedContent = true;
                }

                if (!hasSavedContent && _.find(program.quests, function (t) {
                        return t.slug != null && t.slug != undefined;
                    }) != null) {
                    hasSavedContent = true;
                }

                _.each(!hasSavedContent && program.levels, function (l) {
                    if (_.find(l.quests, function (t) {
                            return t.slug != null && t.slug != undefined;
                        }) != null) {
                        hasSavedContent = true;
                    }
                });

                program.hasSavedContent = hasSavedContent;
            }
        },
        canEditEntity: function (entity, program) {
            if (!entity || !program) {
                return false;
            }

            if(program.status != 'preview')
            {
                //If the program is on a major version there won't be a . in it,
                //if major version then we know all content is published do lock it down
                if (program && !program.version.subVersion && program.version.version == program.history[0].version) {
                    //If this is a major version set it to locked by default, but only once so if user sets it to unlocked it will stay
                    if (!program.cancelMigrateReultsOveridden) {
                        program.cancelMigrateResultsOnPublish = false;
                    }
                    program.cancelMigrateReultsOveridden = true;

                    //If the entity has an id then it already existed and can't be edited
                    //Id greater than 1473811230515 is a date being used by to-do and badge pages for some strange reason when adding a new record
                    //Definitely a tickin time bomb if id's ever get higher than that number, but in that case probably need to redesign the system if there is
                    //over a trillion records in a table
                    if (!program.cancelMigrateResultsOnPublish && (entity.id && entity.id < 1473811230515)) {
                        return false;
                    } else if (!program.cancelMigrateResultsOnPublish && !entity.id) {
                        //If the entity didn't have an id then it is new since this override took place
                        // so shouldn't be included and thus still editable
                        return true;
                    }
                }

                //If the program major version doesn't mach the most recent major version, then must cancel migration of results
                if (program && program.version.version != program.history[0].version) {
                    program.cancelMigrateResultsOnPublish = true;
                    return true;
                }

                //If the program major version is 0 or not set then move to reset mode
                if (program && !program.version.version) {
                    program.cancelMigrateResultsOnPublish = true;
                    return true;
                }

                factory.checkProgramContent(program);

                //If we are on a minor version that hasn't been saved since the update set it to editable
                if (program
                    && program.version.version  //If major version is 0 we don't need to do anything
                    && program.version.version == program.history[0].version
                    && !program.hasSavedContent) {
                    program.cancelMigrateResultsOnPublish = true;
                    program.cancelMigrateReultsOveridden = true;
                    return true;
                }
            }

            if (!entity.publishedAt) {
                return true;
            } else if (entity.publishedAt && program.cancelMigrateResultsOnPublish) {
                return true
            } else {
                return false;
            }
        },
        getPublishText: function (program) {
            if (program.cancelMigrateResultsOnPublish) {
                if(program.version.version) {
                    return 'You are about to publish this program. All user progress and data will be reset.  Are you sure?'
                }else{
                    return 'You are about to publish this program. Are you sure?'
                }
            } else {
                return 'You are about to publish this program. All user progress and data will be retained.  Are you sure?'
            }
        }
    };
    return factory;
};


