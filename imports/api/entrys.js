import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Entrys = new Mongo.Collection('entrys');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('entrys', function entrysPublication() {
    return Entrys.find();
  });
}

Meteor.methods({
  'entrys.insert'(text) {
    check(text, String);

    // Make sure the user is logged in before inserting a entry
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    // set username to either username or email
    username = Meteor.users.findOne(this.userId).username !== null ? 
      ( Meteor.users.findOne(this.userId).username ) :
      ( Meteor.users.findOne(this.userId).emails[0].address );

    Entrys.insert({
      text,
      createdAt: new Date(),
      owner: this.userId,
      username: username,
      //Todo: poll, date, important, answer, publicToFacebook, fromFacebook
    });
  },
  'entrys.updateText'(entryId, text) {
    check(text, String);
    check(entryId, String);

    // Make sure the user is logged in before updating a entry
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Entrys.update(entryId, { $set: {
      text: text,
      lastEditAt: new Date(),
    }});
  },
  'entrys.remove'(entryId) {
    check(entryId, String);

    const entry = Entrys.findOne(entryId);
    if (entry.owner !== this.userId) {
      // Make sure only the owner can delete it
      throw new Meteor.Error('not-authorized');
    }

    Entrys.remove(entryId);
  },
  'entrys.setImportant'(entryId, setImportant) {
    check(entryId, String);
    check(setImportant, Boolean);

    const entry = Entrys.findOne(entryId);
    if (entry.private && entry.owner !== this.userId) {
      // If the entry is private, make sure only the owner can check it off
      throw new Meteor.Error('not-authorized');
    }

    Entrys.update(entryId, { $set: { 
      important: setImportant,
    }});
  },
  'entrys.setPrivate'(entryId, setToPrivate) {
    check(entryId, String);
    check(setToPrivate, Boolean);
 
    const entry = Entrys.findOne(entryId);
 
    // Make sure only the entry owner can make a entry private
    if (entry.owner !== this.userId) {
      throw new Meteor.Error('not-authorized');
    }
 
    Entrys.update(entryId, { $set: { 
      private: setToPrivate,
    }});
  },
});