import { Meteor } from 'meteor/meteor';
import '../imports/api/entrys.js';

Meteor.startup(() => {
  // code to run on server at startup

  smtp = {
    username: 'post@nikolaushoefer.de',   // eg: server@gentlenode.com
    password: 'Bmbhime172342',   // eg: 3eeP1gtizk5eziohfervU
    server:   'smtp.mailbox.org',  // eg: mail.gandi.net
    port: 25
  }

  process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;

  Accounts.emailTemplates = {
    from: 'RWGB <noreply@rwgb.de>',
    siteName: 'RWGB',
    verifyEmail: {
      subject: function(user) {
        return 'Emailbestätigung für rwgb.de';
      },
      text: function(user, url) {
        return 'Hi,\n' +
          'Rufe diesen Link auf um deine Email-Adresse für dein RWGB-Konto zu bestätigen:\n' + url +
          '\n\nWenn du mit dieser Email nichts anfangen kannst, ignoriere sie einfach.' +
          '\n\nGruuuß';
      }
    },
    resetPassword: {
      subject: function(user) {
        return 'Passwort neu setzen für rwgb.de';
      },
      text: function(user, url) {
        return 'Hi,\n' +
          'Rufe diesen Link auf um ein neues Passwort für dein RWGB-Konto zu setzen:\n' + url +
          '\n\nWenn du mit dieser Email nichts anfangen kannst, ignoriere sie einfach.' +
          '\n\nGruuuß';
      }
    }
  };

  Accounts.onCreateUser(function(options, user) {
    Meteor.setTimeout(function() {
      Accounts.sendVerificationEmail(user._id);
    }, 2 * 1000);
    return user;
  });

});
