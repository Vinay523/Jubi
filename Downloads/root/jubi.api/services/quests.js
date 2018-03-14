var models = require('../models');
var moment = require('moment');
var async = require('async');
var Q = require('q');
var _ = require('underscore');
var constants = require('../helpers/constants');


exports.isLevelComplete = function (level, forumItems, isBonusLevel) {
    var isLevelComplete = true;

    if (level.quests.length == 0) {
        isLevelComplete = true;
    } else {

        if (isBonusLevel) {
            _.each(level.quests, function (levelQuest) {
                if (!exports.isQuestComplete(levelQuest, forumItems)) {
                    isLevelComplete = false;
                }
            });

        } else {
            _.each(level.quests, function (levelQuest) {
                if (levelQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE && !exports.isQuestComplete(levelQuest, forumItems)) {
                    isLevelComplete = false;
                }
            });
        }

        //below code to use if level will stay locked if preceding level's Do Activity is only submitted but not completed. -----------
        //_.each(level.quests, function (levelQuest) {
        //    //if levelQuest is of type T then check to see if todo is complete. if not then locked
        //    if (levelQuest.type == 'T') {
        //        //if todo is not complete, then it cant proceed to next level.
        //        //if (levelQuest.todos[0].userTodos[0].status != 'completed') {
        //        //    isLevelComplete = false;
        //        //}
        //        if (levelQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE && exports.isQuestComplete(levelQuest, forumItems) && levelQuest.todos[0].userTodos[0].status != 'completed') {
        //            isLevelComplete = false;
        //        }

        //    } else {
        //        if (levelQuest.baseOrBonus == constants.QUEST_BASE_OR_BONUS_BASE && !exports.isQuestComplete(levelQuest, forumItems)) {
        //            isLevelComplete = false;
        //        }
        //    }
        //});

        
    }
    return isLevelComplete;
};

exports.isQuestComplete = function (quest, forumItems) {

    if (quest.type == 'L') {
        if (quest.challengeCount > 0 && quest.challengeCount == quest.challengesComplete) {
            return true;
        } else {
            return false;
        }
    }
    else if (quest.type == 'T') {
        if (quest.todos != null) {
            if (quest.todos.length > 0 && quest.todos[0].userTodos.length > 0) {
                //Mark does that arent actualy complete to overirde after quest unlocking
                if(!quest.todos[0].userTodos[0].hasBeenCompleted){
                    quest.notReallyComplete = true;
                }
                //Returning complete for dos that are submitted or further for quest unlocking sake, above flag will be used to undo it for point and ui status sake
                return quest.todos[0].userTodos[0].status != 'locked' && quest.todos[0].userTodos[0].status != 'unlocked';

            } else {
                return false;
            }
        }
    }
    else if (quest.type == 'I') {
        var complete = false;
        _.each(forumItems, function (item) {
            if (item.type == 'topic' && item.questId == quest.id) {
                complete = true;
            }
        });
        return complete;
    }
};

exports.programHasLevelQuests = function (program) {
    var questFound = false;
    _.find(program.levels, function (level) {
        if (_.find(level.quests, function (quest) {
            questFound = true;
            return true;
        })) {
            return true;
        }
    });
    return questFound;
};

