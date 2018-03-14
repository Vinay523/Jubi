var models = require('../../models');
var bcrypt = require('bcrypt-nodejs');
var services = require('../../services');

function PasswordResetController() {}

PasswordResetController.prototype.requestPasswordReset = function (req, res) {
    models.User.find({
        where: {email: req.body.email}
    })
        .then(function(result) {


            if (result == null) return res.status(404).sendError('Not Found');

            // Get the req data id.
            var id = result.id;

         	//generate the token with userId and currentDate
			var now = new Date();
			var token = services.helpers.encryptString(result.id + '|' + now.getTime());	
			
			//update the user table with tempToken value


			models.sequelize.transaction().then(function(t) { 
            result.updateAttributes({
			  tempToken: token
			}).then(function(){
				var reset_url = config.web.appUrl + '/passwordReset?token='+ token;
				var data = {
					reset_url:reset_url
				};
				services.email.email("Jubi Platform Password Assistance",req.body.email,"forgotPassword","main",data);
				t.commit().then(function() { res.status(200).end('OK'); });
 			}).catch(function(err) { 
 				t.rollback().then(function() { services.helpers.sendError(err); });
 			});
        });
   
 			
        }).catch(function(err) { services.helpers.sendError(err);});
};

PasswordResetController.prototype.reset = function (req, res) {
	
	models.User.find({
		where:{tempToken:req.body.token}
	}).success(function(result){
		if (result == null) return res.status(404).sendError('The token is either invalid or expired');
		
		var token = services.helpers.decryptString(req.body.token);
		var now = new Date();
		var tokenDate = new Date(parseInt(token.split("|")[1]));
		var userTokenExpiryDate = new Date(tokenDate);

		userTokenExpiryDate.setDate(tokenDate.getDate() + 30);
        //Is key valid?

		if (userTokenExpiryDate < now){
			models.sequelize.transaction().then(function(t) {	
			result.updateAttributes({
				tempToken: null 
				}).then(function(){
					t.commit().then(function() { res.status(403).end('The token is either invalid or expired');  });
				}).catch(function(err) {
					t.rollback().then(function() { services.helpers.handleReject(err, reject); });
                });
			});	
		}
		else{
			return res.status(200).end('OK');
		}
	}).catch(function(err) { services.helpers.sendError(err);});  
};
 

PasswordResetController.prototype.changePassword = function (req, res) {
	var token = services.helpers.decryptString(req.body.token);
	
 	models.User.find({
		where:{tempToken:req.body.token}
	}).then(function(result){
		if (result == null) return res.status(404).sendError('Not Found');

		//Update record 
	models.sequelize.transaction().then(function(t) { 		
			result.updateAttributes({
				  tempToken: null,
				  password:bcrypt.hashSync(req.body.password)
			}).then(function(){  
				t.commit().then(function() { res.status(200).end('OK'); });
			}).catch(function(err) {
				t.commit().then(function() { services.helpers.sendError(err); });
			});
		});

	}); 
};

module.exports = Object.create(PasswordResetController.prototype);
