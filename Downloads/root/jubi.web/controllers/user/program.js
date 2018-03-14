var app = require('../../app');
var services = require('../../services');

// Render programs page
exports.getHome = function(req, res) {
	
    res.render('Programs | Powered by: ' + config.appName, 'user/views/programs', {
        programId: 0
    }, 'user');
};

// Handle preview request
exports.getPreview = function(req, res) {
    var parts = req.query.preview.split('/');

    var url = '/user/program/'+parts[2];
    if (parts.length >= 5) url += '/quest-player/quest/' + parts[4];
    else url += '/quests';

    url += '?preview=' + req.query.preview;

    if(req.query.previewRet) {
        url += '&previewRet=' + req.query.previewRet;
    }

    if(req.query.previewRetHash) {
        url += '&previewRetHash=' + req.query.previewRetHash;
    }

    if (parts.length == 5) url += '#/start';
    else if (parts.length == 7) {
        if (parts[6] == 'finish') url += '#/finish';
        else url += '#/challenge/' + parts[6];
    }

    res.redirect(url);
};
