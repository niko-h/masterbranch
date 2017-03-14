# masterbranch (meteor+react) #

A one-thread/single-timeline social-platform

### How do I get set up? ###

* install meteor: 'curl https://install.meteor.com/ | sh'
* go to rwgb-dir
* run 'meteor npm install'
* run 'meteor'

### After first entry was made ###

* To ensure an ongoing entry-number to display, after the first entry was made, connect to mongo-db and set 'entryid' of the first entry in entrys-collection to '1'. The follwing entry-id's will be set automatically.

### How do I edit CSS? ###

* go to 'client/static/'
* install grunt:
	* 'npm install grunt'
	* 'npm install grunt-contrib-compass'
	* 'npm install grunt-contrib-watch'
* run 'grunt'

### Contribution guidelines ###

* Code review

