import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';
import { check } from 'meteor/check';
import { Entrys } from '../api/entrys.js';
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
      alert('too large or not accepted file type');
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
              // .replace(/(\&lt\;iframe){1}(.*bandcamp.*)(\&gt\;){1}(.*)(&lt;\/iframe\&gt\;){1}/g,
              //         '<iframe$2>$4</iframe>')
              ;
  }

  handleSubmit(event) {
    event.preventDefault();
    console.info('handleSubmit');
    check(this.state.fileUrl, String);

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();
    const image = this.state.fileUrl;
    const importantDate = this.state.important ? new Date(ReactDOM.findDOMNode(this.refs.newImportantDate).value.trim()) : '';

    const entry = {
      countId: parseInt($('.mainContent li:first-child').attr('id')) + 1,
      text: this.parseEntry(text),
      image: image,
      important: this.state.important,
      importantDate: importantDate,
      private: this.state.private,
    }

    if (entry.text.length>0 || entry.image.length>0) {
      Meteor.call('entrys.insert', entry);
      this.onBlur(event);
    }

    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = '';
    this.setState({files: [], fileUrl: ''});
  }

  checkSecret(event) {
    console.info('checkSecret');
    const secret = ReactDOM.findDOMNode(this.refs.regSecret).value.trim();
    if (secret.length>0) {
      Meteor.call('checksecret', secret, function(err, result) {
        if(!err && result) {
          this.setState({youShallPass: true});
          console.log(this.state.youShallPass);
          this.render()
        } else if(!result) {
          $('body').append($('<div id="wrongModal" />'))
          return setTimeout(function() {
            $('#wrongModal').remove();
          }, 1500);
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
    if(query.length>0) {
      Session.set('searchValue', query);
    }
  }

  altEnter(event) {
    event.preventDefault();
    if (event.keyCode == 13 && event.altKey) {
      this.handleSubmit(event);
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
    $('.newEntry textarea').blur();
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

  componentDidUpdate() {
    var $this = $(ReactDOM.findDOMNode(this));
    
    var offset = 0;
    $('.mainContent').width()>599 ? offset = 50 : offset = -10;
    $('.mainContent').css('margin-top', $('header').height()+offset);

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
        $(this).replaceWith($('<img>').attr('src', this.href));
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
          <h1>Rwgb</h1>


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
                onClick={this.toggleHideUnimportant.bind(this)}
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

          { this.props.currentUser ?
            <div className="newEntry">
              <form className={'newEntryForm ' + edited} onKeyUp={this.altEnter.bind(this)} >
                <Textarea 
                  ref="textInput"
                  // onBlur={ this.onBlur.bind(this) }
                  placeholder="Gib' einen neuen Eintrag ein..."
                  onKeyUp={ this.escapeEdit.bind(this) }
                  onFocus={ this.toggleEdited.bind(this) }
                  tabIndex="1"
                />
                <div className="newEntryOptions">
                  <div className="checkbox green">
                    <input 
                      type="checkbox" 
                      className="slider-checkbox" 
                      id="privateCheckbox" 
                      checked={this.state.private}
                      onClick={this.togglePrivate.bind(this)}
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
                      onClick={this.toggleImportant.bind(this)}
                     />
                    <label className="slider-v2" htmlFor="importantCheckbox"></label>
                    <div className="value">Wichtig</div>
                  </div>
                  { this.state.important ? (
                    <div className="newImportantDateContainer">
                      <i className="icon-today" />
                      <input 
                        type="date" 
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
                      maxSize={1000*1000}
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
          {this.renderEntrys()}
        </ul>
        {!this.state.hideUnimportant ? (
          <button className="loadMoreBtn btn" onClick={this.loadMore.bind(this)}>Load more Entrys</button>
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
};

export default createContainer(() => {
  Session.setDefault('lazyloadLimit', 10);
  Tracker.autorun(function(){
    Meteor.subscribe('entrys', Session.get('lazyloadLimit'));
  });
  Meteor.subscribe('importantEntrys');

  Meteor.subscribe("search", Session.get("searchValue"));
  if (Session.get("searchValue")) {
    // return Messages.find({}, { sort: [["score", "desc"]] });
  } else {
    // return Messages.find({});
  }

  return {
    // search: Entrys.find({text:}, { sort: { createdAt: -1 } }).fetch(),
    entrys: Entrys.find({}, { sort: { createdAt: -1 }, limit: Session.get('lazyloadLimit') }).fetch(),
    importantEntrys: Entrys.findFromPublication('importantEntrys', {}, {sort: { createdAt: -1 }}).fetch(),
    importantEntrysCount: Entrys.findFromPublication('importantEntrys', {}).count(),
    importantDatesCount: Entrys.findFromPublication('importantEntrys', {"importantDate" : { 
        $lt: new Date(new Date().setDate(new Date().getDate()+7)), 
        $gte: new Date(new Date().setDate(new Date().getDate()-3))
      }}).count(),
    currentUser: Meteor.user(),
    searchResults: Entrys.find({}, { sort: [["score", "desc"]] }).fetch(),
  };
}, App);