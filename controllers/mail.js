var nodemailer = require('nodemailer');
var EmailTemplate = require('email-templates').EmailTemplate;
var env       = process.env.NODE_ENV || 'mail';
var config    = require(__dirname + '/../config/config.json')[env];
var path = require('path');
var language = require('./language');
var moment = require('moment');
var ejs = require('ejs');
var fs = require('fs');
const sgMail = require('@sendgrid/mail');
var async = require('async');
sgMail.setApiKey(config.sendGridApiKey);

const registerMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/register/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/register/html.ejs',
		cache: true
	}
),
instituteRegisterMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/instituteregisteration/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/instituteregisteration/html.ejs',
		cache: true
	}
),
teacherRegisterMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/teacherregisteration/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/teacherregisteration/html.ejs',
		cache: true
	}
),
studentRegisterMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/studentregisteration/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/studentregisteration/html.ejs',
		cache: true
	}
),
resetPasswordMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/reset_password/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/reset_password/html.ejs',
		cache: true
	}
),
contactMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/contacts_mail/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/contacts_mail/html.ejs',
		cache: true
	}
),
empLeaveApplyMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/empleaveApply/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/empleaveApply/html.ejs',
		cache: true
	}
),
ticketCreatedMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/ticket/created/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/ticket/created/html.ejs',
		cache: true
	}
),
ticketMessageMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/ticket/message/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/ticket/message/html.ejs',
		cache: true
	}
),
dashboardMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/dashboard/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/dashboard/html.ejs',
		cache: true
	}
),
empLeaveStatusMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/empleaveStatus/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/empleaveStatus/html.ejs',
		cache: true
	}
),
partnerMailTemplate = ejs.compile(
	fs.readFileSync(__dirname + '/../views/front/email/partners_mail/html.ejs', 'utf8'),
	{
		filename: __dirname + '/../views/front/email/partners_mail/html.ejs',
		cache: true
	}
);

function Mail() {
	// create reusable transporter object using the default SMTP transport
	var transporter = nodemailer.createTransport(config.config);

	// send mail with defined transport object
	var from = config.from;
	this.sendMail=function (data) {
		if(data.from){
			from  = data.from;
		}else{
			from  = 'noreply@pateast.co';
		}
		if(email_provider == 'SendGrid'){
			const msg = {
			to: data.email,
			from: from,
			subject: data.subject,
			html: data.msg
			};
			if(data.attachments){
			   var attachments = [];
			   data.attachments.forEach(function(item){ 
				var file = {};
				file.filename = item.filename;
				file.content = fs.readFileSync(item.path, 'base64');
				attachments.push(file);
			   });

			   Promise.all(attachments).then(function(fileData){
				msg.attachments = fileData;
				sgMail.send(msg).then(function (response) {
					console.log('Mail Sent');
				}).catch(function (error) {
					// error is an instance of SendGridError
					// The full response is attached to error.response
					console.log('Some Error');
				});
			   }).catch(console.log);
			} else {
				sgMail.send(msg).then(function (response) {
					console.log('Mail Sent');
				}).catch(function (error) {
					// error is an instance of SendGridError
					// The full response is attached to error.response
					console.log('Some Error');
				});
			}
		}else{
			var mailOptions = {
			from: from,
			to: data.email,
			subject: data.subject,
			//text: data.msg,
			html: data.msg
			};
			transporter.sendMail(mailOptions, function(error){
				if(error){
					return console.log(error);
				}
			});
		}
	};

	this.sendHtmlMailGeneric = function (template, lang, data) {
		data.list = data.data;
		delete data.data;
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, eval(template));
		}else{
			if(template == 'ticketCreatedMailTemplate'){
				var templateDir = path.join(__dirname, '../views', '/front/email/ticket/created');
			}else if(template == 'ticketMessageMailTemplate'){
				var templateDir = path.join(__dirname, '../views', '/front/email/ticket/message');
			}
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	}

	this.sendHtmlMail=function(data, lang){
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, registerMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/register');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.sendHtmlMailToInstitute=function(data, lang){
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, instituteRegisterMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/instituteregisteration');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.sendHtmlMailToTeacher=function(data, lang){
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, teacherRegisterMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/teacherregisteration');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.sendHtmlMailToStudent=function(data, lang){
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, studentRegisterMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/studentregisteration');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	/* Reset password mail */
	this.sendResetPasswordMail = function(data, lang) {
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, resetPasswordMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/reset_password');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	/* Reset password mail */
	this.sendContactMail = function(data, lang) {
		data.email = config.contactEmail;
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, contactMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/contacts_mail');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.empleaveApply = function(data, lang) {
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, empLeaveApplyMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/empleaveApply');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.empleaveStatus = function(data, lang) {
		data.email = config.contactEmail;
		if(email_provider == 'SendGrid'){
			return this.mailBySendGrid(data, lang, empLeaveStatusMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/empleaveStatus');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.mailBySendGrid = function(data, lang, template){
		//Send Grid
		const msg = {
			to: data.email,
			from: { name: "Pateast", email: "noreply@pateast.co" },
			subject: data.subject,
			html: template(language.bindLocale({data:data.list, moment:moment}, lang))
		};
		sgMail.send(msg)
		.then(function (response) {
			console.log('Mail Sent');
		})
		.catch(function (error) {
			// error is an instance of SendGridError
			// The full response is attached to error.response
			console.log('Some Error');
		});
	};

	this.mailByNormalTemplateSystem = function(data, lang, templateDir){
		var mailTemplate = transporter.templateSender(new EmailTemplate(templateDir), {
			from:from,
		});
		// use template based sender to send a message
		mailTemplate({
			to: data.email,
			subject: data.subject
		}, language.bindLocale({
			data:data.list,
			moment:moment
		}, lang), function(err){
			if(err){
			   console.log(err);
			}else{
				console.log('Mail sent');
			}
		});
	};

	this.sendPartnerMail = function(data, lang) {
		data.email = config.contactEmail;
		if(email_provider == 'SendGrid'){
			return this.mailFrontBySendGrid(data, lang, partnerMailTemplate);
		}else{
			var templateDir = path.join(__dirname, '../views', '/front/email/partners_mail');
			return this.mailByNormalTemplateSystem(data, lang, templateDir);
		}
	};

	this.mailFrontBySendGrid = function(data, lang, template){
		//Send Grid
		const msg = {
			to: data.email,
			from: { name: data.list.name, email: data.list.email },
			subject: data.subject,
			html: template(language.bindLocale({data:data.list, moment:moment}, lang))
		};
		sgMail.send(msg)
		.then(function (response) {
			console.log('Mail Sent');
		})
		.catch(function (error) {
			// error is an instance of SendGridError
			// The full response is attached to error.response
			console.log('Some Error');
			//console.log(error);
		});
	};

	this.sendInvoiceMail = function(data, lang){
		let mailFrom = config.from;

		if (data.from) {
			mailFrom = data.from;
		}

		let mailOptions = {
			from: mailFrom,
			to: data.email,
			subject: data.subject,
			html: data.msg,
			attachments: [{
				filename: 'invoice.pdf',
				content: data.pdf
			}]
		};
		transporter.sendMail(mailOptions, function(error){
			if(error){
				return console.log(error);
			} else {
				return console.log('Mail sent')
			}
		});
	}
}
module.exports = new Mail();