import React from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
 
import '../imports/ui/fx.js';
import '../imports/startup/accounts-config.js';
import App from '../imports/ui/App.jsx';
 
Meteor.startup(() => {
  render(<App />, document.getElementById('render-target'));
  
  if(Meteor.isClient) {
  	// Template.loginButtons.rendered = function() {
	  //   $('#login-sign-in-link').text('Anmelden');
	  //   // $('.login-close-text').text('Schliessen');
	  //   $('#login-username-or-email-label').text('Benutzername oder Email');
	  //   $('#login-password-label').text('Passwort');
	  //   $('#signup-link').text('Konto erstellen');
	  //   $('#forgot-password-link').text('Passwort vergessen');
	  //   $('#login-buttons-forgot-password').text('Wiederherstellen');
	  //   $('#back-to-login-link').text('Zurück');
	  //   $('#login-username-label').text('Benutzername');
	  //   $('#login-buttons-open-change-password').text('Passwort ändern');
	  //   $('#login-buttons-logout').text('Abmelden');
	  //   $('#reset-password-new-password-label').text('Neues Passwort');
	  //   $('#login-old-password-label').text('Aktuelles Passwort');
	  //   $('#login-password-label').text('Neues Passwort');
	  //   $('#login-buttons-do-change-password').text('Passwort ändern');
	  //   if ($('#login-buttons-password').text().indexOf('Sign in') != -1) {
	  //     $('#login-buttons-password').text('Anmelden');
	  //   } else {
	  //     $('#login-buttons-password').text('Konto erstellen');
	  //   }

	  //   if ($('.message.error-message').text().indexOf('Username must be at least 3 characters long') != -1) {
	  //     $('.message.error-message').text('Benutzername muss mindestens 3 Zeichen lang sein');
	  //   } else if ($('.message.error-message').text().indexOf('Incorrect password') != -1 || $('.message.error-message').text().indexOf('User not found') != -1) {
	  //     $('.message.error-message').text('Benutzername oder Passwort falsch');
	  //   }
	  // };
  }
});	