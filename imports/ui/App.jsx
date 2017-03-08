import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';
import { check } from 'meteor/check';
import { Entrys, Birthdays } from '../api/entrys.js';
// import { Session } from 'meteor/session';
import Dropzone from 'react-dropzone';
import Entry from './Entry.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx';
import linkifyJq from 'linkifyjs/jquery';
linkifyJq($, document);


// App component - represents the whole app
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hideUnimportant: false,
      edited: false,
      important: false,
      private: false,
      files: [],
      fileUrl: '',
      youShallPass: false,
      searchActive: false,
      birthdayNotificationSend: false,
      firstNotificationSend: 0,
    };
  }

  readFile(file, onLoadCallback) {
    reader = new FileReader();
    reader.onload = onLoadCallback;
    reader.readAsDataURL(file);
  }

  onDrop(acceptedFiles, rejectedFiles) {
    // todo: warn about rejected files
    if(typeof(acceptedFiles[0]) === "undefined") {
      alert('Das Bild darf nicht größer sein als 1MB.');
    } else {
      this.setState({ files: acceptedFiles }, () => {
        this.readFile(this.state.files[0], function(e) {
          this.setState({ fileUrl: e.target.result }, () => {
            console.info('image converted to base64');
          });
        }.bind(this));
      });
    }
  }

  clearImg(event) {
    event.preventDefault();
    this.setState({ fileUrl: '', files: [], });
  }

  toggleEdited() {
    this.setState({ edited: true, });
  }

  toggleImportant() {
    this.setState({ important: !this.state.important, });
  }
  
  togglePrivate() {
    this.setState({ private: !this.state.private, });
  }

  loadMore() {
    var currentLimit = Session.get('lazyloadLimit');
    Session.set('lazyloadLimit', currentLimit + 10);
  }

  parseEntry(text) {
    return text.replace(/(?:http:|https:)?(?:\/\/)(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^<.,!():"'\s]+)/g, 
                      '<iframe width="100%" height="300" src="http://www.youtube.com/embed/$1?modestbranding=1&rel=0&wmode=transparent&theme=light&color=white" frameborder="0" allowfullscreen></iframe>')
              .replace(/(?:http:|https:)?(?:\/\/)(?:www\.)?(?:vimeo\.com)\/([^<.,!():"'\s]+)/g, 
                      '<iframe src="//player.vimeo.com/video/$1" width="100%" height="300" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>')
              .replace(/(?:http:|https:)?(?:\/\/)(?:www\.|w\.|m\.)?(?:snd\.sc)\/(.*)/g, 
                      '<iframe width="100%" height="125" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/$1&amp;color=cccccc&amp;auto_play=false&amp;hide_related=true&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false"></iframe>')
              ;
  }

  handleSubmit(event) {
    event.preventDefault();
    check(this.state.fileUrl, String);

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();
    const image = this.state.fileUrl;
    // const importantDate = this.state.important ? new Date(ReactDOM.findDOMNode(this.refs.newImportantDate).value.trim()) : '';
    var importantDate = this.state.important ? ReactDOM.findDOMNode(this.refs.newImportantDate).value.trim() : '';
    var impDateArr = importantDate.split('.');
    importantDate = impDateArr[1]+'/'+impDateArr[0]+'/'+impDateArr[2];

    const entry = {
      countId: parseInt($('.mainContent li:first-of-type').attr('id')) + 1,
      text: this.parseEntry(text),
      image: image,
      important: this.state.important,
      importantDate: new Date(importantDate),
      private: this.state.private,
    }

    if (entry.text.length>0 || entry.image.length>0) {
      if(this.props.currentUser.emails[0].verified) {
        Meteor.call('entrys.insert', entry);
        this.onBlur(event);
      } else {
        alert('Bitte bestätige deine Email-Adresse. Rufe dazu den Link aus der Bestätigungs-Mail auf, die dir zugesandt wurde.');
      }
    }

    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = '';
    this.setState({files: [], fileUrl: ''});
  }

  notification(entry) {
    var icon = entry.image!=='' ? entry.image : '/notification1.png';
    var username = entry.username;
    var options = {
      body: entry.text.substring(0, 140)+'...',
      icon: icon,
    }
    if (this.props.currentUser && 'Notification' in window && entry.username !== this.props.currentUser.username) {
      var n = new Notification(username+' schreibt',options);
      setTimeout(n.close.bind(n), 5000); 
    }
  }
  birthdayNotification(name) {
    if(!this.state.birthdayNotificationSend) {
      var options = {
        body: 'Das Rwgb wünscht '+name+' alles Gute.',
        icon: '/notification-birthday.png',
      }
      if ('Notification' in window) {
        this.setState({birthdayNotificationSend: true,});
        var n = new Notification(name+' hat Geburtstag!',options);
        setTimeout(n.close.bind(n), 5000);   
      }
    }
  }

  checkSecret(event) {
    var secret = ReactDOM.findDOMNode(this.refs.regSecret).value.trim();
    if (secret.length>0) {
      Meteor.call('checksecret', secret, function(err, result) {
        if(!err && result) {
          this.setState({youShallPass: true});
          window.scrollTo(0, 0);
        } else if(!result) {
          $('body').append($('<div id="wrongModal" />'))
          return setTimeout(function() {
            $('#wrongModal').remove();
          }, 2000);
        }
      }.bind(this));
    }
  }

  activateSearch(event) {
    this.setState({searchActive: true});
    $('.searchForm').css('height', $('header').height());
    return setTimeout(function() {
      $('.searchInput').focus();
    }, 150);
  }
  deactivateSearch(event) {
    this.setState({searchActive: false});
  }
  search(event) {
    event.preventDefault();
    if (event.keyCode == 27) {
      this.deactivateSearch(event);
    }
    const query = ReactDOM.findDOMNode(this.refs.searchInput).value.trim();
    if(query.length>1) {
      Session.set('searchValue', query);
    }
  }

  altEnter(event) {
    event.preventDefault();
    if (event.keyCode == 13 && event.altKey) {
      this.handleSubmit(event);
    } else if(event.keyCode == 13) {
      $('.mainContent').width()>599 ? $('.mainContent').css('margin-top', $('header').height()+50) : '';
    }
  }

  enterSecret(event) {
    event.preventDefault();
    if (event.keyCode == 13) {
      this.checkSecret(event);
    }
  }

  escapeEdit(event) {
    event.preventDefault();
    if (event.keyCode == 27) {
      this.onBlur(event);
    }
  }

  onBlur(event) {
    this.setState({ 
      edited: false, 
      important: false,
      private: false,
    });
    $('.newEntry textarea').val('').blur();
    setTimeout(function() {
      $('.mainContent').width()>599 ? $('.mainContent').css('margin-top', $('header').height()+50) : '';
    }, 20);
  }

  toggleHideUnimportant() {
    this.setState({
      hideUnimportant: !this.state.hideUnimportant,
    });
  }

  renderEntrys() {
    let filteredEntrys;
    if(this.state.searchActive) {
      filteredEntrys = this.props.searchResults;
    } else {
      filteredEntrys = this.props.entrys;
    }

    if (this.state.hideUnimportant) {
      filteredEntrys = this.props.importantEntrys;
    }
    if (!Meteor.userId()) {
      filteredEntrys = filteredEntrys.filter(entry => !entry.private);
    }

    id=0;
    return filteredEntrys.map((entry) => {
      const currentUserId = this.props.currentUser && this.props.currentUser._id;
      const canEdit = entry.owner === currentUserId;
      const updated = typeof(entry.lastEditAt) === 'object';
      const entryCountByUser = canEdit ? id+=1 : 0;

      return (
        <Entry
          key={entry._id}
          entry={entry}
          canEdit={canEdit}
          updated={updated}
          entryCountByUser={entryCountByUser}
        />
      );
    });
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.entrys[0] && this.props.entrys[0] && nextProps.entrys[0].text !== this.props.entrys[0].text) {
      // if ('Notification' in window && this.state.firstNotificationSend >= 2) {
      if ('Notification' in window) {
        Notification.permission === 'granted' ? this.notification(nextProps.entrys[0]) : '';
      }
      // this.state.firstNotificationSend<2 ? this.setState({firstNotificationSend: this.state.firstNotificationSend+1}) : '';
    }
  }

  componentDidMount() {
    moment.updateLocale('en', {
      relativeTime : {
        future: "in %s",
        past:   "vor %s",
        s:  "Sekunden",
        m:  "einer Minute",
        mm: "%d Minuten",
        h:  "einer Stunde",
        hh: "%d Stunden",
        d:  "einem Tag",
        dd: "%d Tage",
        M:  "einem Monat",
        MM: "%d Monaten",
        y:  "einem Jahr",
        yy: "%d Jahren"
      }
    });

    // delegate calls to data-toggle="lightbox"
    $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
        event.preventDefault();
        return $(this).hasClass('lightbox') ? $(this).removeClass('lightbox') : $(this).addClass('lightbox');
    });
  }

  componentDidUpdate() {
    var $this = $(ReactDOM.findDOMNode(this));
    
    if(this.props.currentUser && !this.props.currentUser.emails[0].verified) {
      alert('Bitte bestätige deine Email-Adresse. Rufe dazu den Link aus der Bestätigungs-Mail auf, die dir zugesandt wurde.');
    }
    
    var offset = 0;
    setTimeout(function() {
      $('.mainContent').width()>599 ? $('.mainContent').css('margin-top', $('header').height()+50) : '';
    }, 20);

    $('.newImportantDate, .importantDate').datepicker({
      format: "dd.mm.yyyy",
      weekStart: 1,
      todayBtn: "linked",
      clearBtn: true,
      language: "de",
      autoclose: true,
      todayHighlight: true,
      toggleActive: true
    });

    var linkifyOptions = {
      className: 'embed',
      defaultProtocol: 'https',
      format: function (value, type) {
        if (type === 'url' && value.length > 50) {
          value = value.slice(0, 50) + '…';
        }
        return value;
      },
      formatHref: function (href, type) {
        return href;
      },
      ignoreTags: ['script', 'style'],
      nl2br: true,
      tagName: 'a',
      target: {
        url: '_blank'
      },
      validate: true
    };

    $('.mainContent .entry').linkify(linkifyOptions);

    $('a.embed[href$=".jpg"], a.embed[href$=".png"], a.embed[href$=".gif"]').each(function() {
        $(this).replaceWith($('<span>').attr({'class':'img', 'data-toggle':'lightbox'}).append($('<img>').attr('src', this.href)));
    });

    // delegate calls to data-toggle="lightbox"
    $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
        event.preventDefault();
        return $(this).hasClass('lightbox') ? $(this).removeClass('lightbox') : $(this).addClass('lightbox');
    });
  }

  render() {
    console.info('render()');
    var edited = classnames( this.state.edited, {
        'none' : ( !this.state.edited ),
        'edited': ( this.state.edited ),
    } );
    var search = classnames( this.state.searchActive, {
      'searchActive' : ( this.state.searchActive ),
      'none' : ( !this.state.searchActive ),
    });
    let birthdays = this.props.birthdays;
    
    return (
      <div className="container">
        <div className={"searchForm "+search}>
          <input 
            className="searchInput" 
            ref="searchInput" 
            type="text"
            placeholder="Suche..."
            autoFocus
            onKeyUp={ this.search.bind(this) } />
          <button 
            className="searchCloseBtn icon-close"
            onClick={ this.deactivateSearch.bind(this) } />
        </div>

        <header className={edited+' '+search}>
          <h1>RWGB</h1>

          { this.props.currentUser || this.state.youShallPass ?
            <AccountsUIWrapper />
          :
            <div className="register-secret">
              <span>
                <h1>RWGB</h1>
                <span>Tach! Wenn du absichtlich hier gelandet bist, ahnst du bestimmt, was hier einzugeben ist:</span>
                <input 
                  type="password"
                  placeholder="Ausbau No..."
                  className="secret"
                  ref="regSecret"
                  autoFocus
                  onKeyUp={ this.enterSecret.bind(this) }
                />
                <button className="btn sendSecret" onClick={ this.checkSecret.bind(this) }>Enter</button>
              </span>
            </div>
          }
        
          {this.props.importantEntrysCount > 0 ? (
            <span>
              <input 
                type="checkbox" 
                className="hide-unimportant-checkbox" 
                id="hide-unimportant" 
                checked={this.state.hideUnimportant}
                onChange={this.toggleHideUnimportant.bind(this)}
               />
              <label className="hide-unimportant button icon-notifications" htmlFor="hide-unimportant">
                {this.props.importantDatesCount>0 ? (
                  <span>{this.props.importantDatesCount}</span>
                ) : ''}
              </label>
            </span>
          ) : ''}

          { this.props.currentUser ? (
            <button 
              className="openSearchBtn icon-search"
              onClick={ this.activateSearch.bind(this) } />
          ) : ''}

          <span className="countdown">
            <svg id="tent" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 75 82"><path className="tent" d="M51,25l8-14H57L50,23,43,11H41l8,14L13,85s17.13,8,37,8,38-8,38-8Z" transform="translate(-13 -11)"/></svg>
            {moment('20170812', 'YYYYMMDD').fromNow()}
          </span>

          { this.props.currentUser ?
            <div className="newEntry">
              <form className={'newEntryForm ' + edited} onKeyUp={this.altEnter.bind(this)} >
                <Textarea 
                  ref="textInput"
                  placeholder="Gib' hier einen neuen Eintrag ein..."
                  onKeyUp={ this.escapeEdit.bind(this) }
                  onFocus={ this.toggleEdited.bind(this) }
                  tabIndex="1"
                  />
                { this.state.edited ? (
                  <i className="closeNewEntry icon-close"
                     onClick={this.onBlur.bind(this)} />
                ) : ''}
                <div className="newEntryOptions">
                  <div className="checkbox green">
                    <input 
                      type="checkbox" 
                      className="slider-checkbox" 
                      id="privateCheckbox" 
                      checked={this.state.private}
                      onChange={this.togglePrivate.bind(this)}
                     />
                    <label className="slider-v2" htmlFor="privateCheckbox"></label>
                    <div className="value">Privat</div>
                  </div>
                  <div className="checkbox red">
                    <input 
                      type="checkbox" 
                      className="slider-checkbox" 
                      id="importantCheckbox" 
                      checked={this.state.important}
                      onChange={this.toggleImportant.bind(this)}
                     />
                    <label className="slider-v2" htmlFor="importantCheckbox"></label>
                    <div className="value">Wichtig</div>
                  </div>
                  { this.state.important ? (
                    <div className="newImportantDateContainer">
                      am&nbsp;
                      <input 
                        type="text" 
                        className="newImportantDate"
                        ref="newImportantDate" />
                    </div>
                  ): ''}

                  <div className={'imageUploadForm'}>
                    {this.state.files.length > 0 ? <div className="preview">
                        {this.state.files.map((file) => <span><img className="smallPreview" src={file.preview} /><span className="previewDetail"><img src={file.preview} /></span></span> )}
                        <button className="btn icon-close" onClick={this.clearImg.bind(this)}></button>
                      </div> : null
                    }
                    <Dropzone 
                      ref={(node) => { this.dropzone = node; }} 
                      accept="image/*"
                      onDrop={this.onDrop.bind(this)}
                      className="dropzone"
                      activeClassName="accept"
                      rejectClassName="reject"
                      multiple={false}
                      maxSize={1000*2000}
                      >
                      <div className="icon-add_a_photo">
                      </div>
                    </Dropzone>
                  </div>
                </div>
                <button className="submitBtn btn" onClick={this.handleSubmit.bind(this)} ></button>
              </form>
            </div> : ''
          }

        </header>

        <ul className="mainContent">
          {birthdays.length>0 ? (
            <div className="birthdays icon-cake">
              {
                birthdays.map((birthday) => {
                  this.birthdayNotification(birthday._id)
                  return (
                    <span key={birthday._id} className="birthday">{birthday._id}</span>
                  )
                })
              }
              <span className="info">{birthdays.length>1 ? ' haben Geburtstag!' : ' hat Geburtstag!'}</span>
            </div>
          ) : ''}

          {this.renderEntrys()}
        </ul>
        {!this.state.hideUnimportant ? (
          <button className="loadMoreBtn btn" onClick={this.loadMore.bind(this)}>Ältere Einträge laden</button>
        ) : ''}

        <div className="toggle toggle--daynight">
          <input type="checkbox" id="toggle--daynight" className="toggle--checkbox" />
          <label className="toggle--btn" htmlFor="toggle--daynight"><span className="toggle--feature"></span></label>
        </div>
      </div>
    );
  }
}

App.propTypes = {
  entrys: PropTypes.array.isRequired,
  importantEntrys: PropTypes.array.isRequired,
  importantEntrysCount: PropTypes.number.isRequired,
  importantDatesCount: PropTypes.number.isRequired,
  currentUser: PropTypes.object,
  searchResults: PropTypes.array.isRequired,
  birthdays: PropTypes.array.isRequired,
};

export default createContainer(() => {
  Session.setDefault('lazyloadLimit', 10);
  Tracker.autorun(function(){
    Meteor.subscribe('entrys', Session.get('lazyloadLimit'));
  });
  Meteor.subscribe('importantEntrys');
  Meteor.subscribe('search', Session.get('searchValue'));
  Meteor.subscribe('birthdays');

  return {
    entrys: Entrys.find({}, { sort: { createdAt: -1 }, limit: Session.get('lazyloadLimit') }).fetch(),
    importantEntrys: Entrys.findFromPublication('importantEntrys', {}, {sort: { createdAt: -1 }}).fetch(),
    importantEntrysCount: Entrys.findFromPublication('importantEntrys', {}).count(),
    importantDatesCount: Entrys.findFromPublication('importantEntrys', {"importantDate" : { 
        $lt: new Date(new Date().setDate(new Date().getDate()+7)), 
        $gte: new Date(new Date().setDate(new Date().getDate()-1))
      }}).count(),
    currentUser: Meteor.user(),
    searchResults: Entrys.find({}, { sort: [["score", "desc"]] }).fetch(),
    birthdays: Birthdays.find({}).fetch(),
  };
}, App);