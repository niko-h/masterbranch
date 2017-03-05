import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Entrys = new Mongo.Collection('entrys');
export const Birthdays = new Mongo.Collection('birthdays');

if (Meteor.isServer) {
  // This code only runs on the server

  // search-index
  Entrys._ensureIndex({
    "username": "text",
    "text": "text"
  });

  // basic entries-publication
  Meteor.publish('entrys', function (limit) {
    return Entrys.find({}, {
      limit: limit,
      sort: {createdAt: -1}
    });
  });

  // birthdays
  Meteor.publish('birthdays', function () {
    var day = new Date().getDate();
    var month = new Date().getMonth()+1;
    return Birthdays.find({birthday: day, birthmonth: month});
  });

  // important entrys
  FindFromPublication.publish('importantEntrys', function () {
    return Entrys.find({important: true}, {
      // We can include fields to get the same result. 
      // This will be safer, as it ensures we won't get any extra fields in case the documents get extended
      // fields: {
      //   title: 1,
      //   slug: 1,
      //   timeCreated: 1,
      //   description: 1,
      //   author: 1
      // }
      sort: {createdAt: -1}
    });
  });


  // RSS
  RssFeed.publish( 'updates', function() {
    var feed = this;

    feed.setValue( 'lastBuildDate', new Date() );
    feed.setValue( 'pubDate', new Date() );
    feed.setValue( 'ttl', 1 );

    var entrys = Entrys.find( { private: false } );

    entrys.forEach( function( entry ) {
      feed.addItem({
        title: entry.username,
        description: entry.text,
        link: `http://localhost:3000/rss/${ entry._id }`,
        pubDate: entry.createdAt
      });
    });
  });

  // search
  Meteor.publish("search", function(searchValue) {
  if (!searchValue) {
    // return Entrys.find({});
  }
  return Entrys.find({ $text: {$search: searchValue} },
    {
      // sort: {createdAt: -1},
      // `fields` is where we can add MongoDB projections. Here we're causing
      // each document published to include a property named `score`, which
      // contains the document's search rank, a numerical value, with more
      // relevant documents having a higher score.
      fields: {
        score: { $meta: "textScore" }
      },
      // This indicates that we wish the publication to be sorted by the
      // `score` property specified in the projection fields above.
      sort: {
        score: { $meta: "textScore" }
      }
    }
  );
});
}

Meteor.methods({
  'checksecret'(secret) {
    if(secret === 'V' || secret === 'v' || secret === '5' || secret === 'Fünf' || secret === 'fünf' || secret === 'Fuenf' || secret === 'fuenf') {
      return true;
    } else {
      return false;
    }
  },
  'entrys.insert'(entry) {
    console.info('insertEntry');
    check(entry.text, String);
    check(entry.image, String);
    
    // Make sure the user is logged in before inserting a entry
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    // set username to either username or email
    username = Meteor.users.findOne(this.userId).username !== null ? 
      ( Meteor.users.findOne(this.userId).username ) :
      ( Meteor.users.findOne(this.userId).emails[0].address );

    Entrys.insert({
      countId: entry.countId,
      text: entry.text,
      image: entry.image,
      createdAt: new Date(),
      important: entry.important,
      importantDate: new Date(entry.importantDate),
      private: entry.private,
      owner: this.userId,
      username: username,
      //Todo: poll, date, answer, publicToFacebook, fromFacebook
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
  'entrys.updateImportantDate'(entryId, importantDate) {
    check(entryId, String);
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Entrys.update(entryId, { $set: {
      importantDate: new Date(importantDate),
      lastEditAt: new Date(),
    }});
  },
  'entrys.updateImage'(entryId, image) {
    check(image, String);
    check(entryId, String);

    // Make sure the user is logged in before updating a entry
    if (! this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    Entrys.update(entryId, { $set: {
      image: image,
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