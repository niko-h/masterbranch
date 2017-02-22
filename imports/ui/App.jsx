import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';
import { check } from 'meteor/check';
import { Entrys } from '../api/entrys.js';
import Dropzone from 'react-dropzone';
import Entry from './Entry.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx';


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

  handleSubmit(event) {
    event.preventDefault();
    console.info('handleSubmit');
    check(this.state.fileUrl, String);

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();
    const image = this.state.fileUrl;

    const entry = {
      countId: parseInt($('.mainContent li:first-child').attr('id')) + 1,
      text: text,
      image: image,
      important: this.state.important,
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

  altEnter(event) {
    event.preventDefault();
    if (event.keyCode == 13 && event.altKey) {
      this.handleSubmit(event);
    }
  }

  escapeEdit(event) {
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
    let filteredEntrys = this.props.entrys;
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
    $('.mainContent').css('margin-top', $('header').height()+50);
  }

  render() {
    console.info('render()');
    var edited = classnames( this.state.edited, {
        'none' : ( !this.state.edited ),
        'edited': ( this.state.edited ),
    } );
    
    return (
      <div className="container">
        <header>
          <h1>RWGB</h1>

          {this.props.importantEntrysCount > 0 ? (
            <div className="checkbox hide-unimportant">
              <input 
                type="checkbox" 
                className="slider-checkbox" 
                id="hide-unimportant" 
                checked={this.state.hideUnimportant}
                onClick={this.toggleHideUnimportant.bind(this)}
               />
              <label className="slider-v2" htmlFor="hide-unimportant"></label>
              <div className="value">Show {this.props.importantEntrysCount} important</div>
            </div>
          ) : ''}

          <AccountsUIWrapper />

          { this.props.currentUser ?
            <div className="newEntry">
              <form className={'newEntryForm ' + edited} onKeyUp={this.altEnter.bind(this)} >
                <Textarea 
                  ref="textInput"
                  // onBlur={ this.onBlur.bind(this) }
                  placeholder="Type to add a new entry"
                  onKeyUp={ this.escapeEdit.bind(this) }
                  onFocus={ this.toggleEdited.bind(this) }
                />
                <div className="newEntryOptions">
                  <div className="checkbox">
                    <input 
                      type="checkbox" 
                      className="slider-checkbox" 
                      id="privateCheckbox" 
                      checked={this.state.private}
                      onClick={this.togglePrivate.bind(this)}
                     />
                    <label className="slider-v2" htmlFor="privateCheckbox"></label>
                    <div className="value">Private</div>
                  </div>
                  <div className="checkbox">
                    <input 
                      type="checkbox" 
                      className="slider-checkbox" 
                      id="importantCheckbox" 
                      checked={this.state.important}
                      onClick={this.toggleImportant.bind(this)}
                     />
                    <label className="slider-v2" htmlFor="importantCheckbox"></label>
                    <div className="value">Important</div>
                  </div>

                  <div className={'imageUploadForm'}>
                    {this.state.files.length > 0 ? <div className="preview">
                        {this.state.files.map((file) => <span><img className="smallPreview" src={file.preview} /><span className="previewDetail"><img src={file.preview} /></span></span> )}
                        <button className="btn" onClick={this.clearImg.bind(this)}>&times;</button>
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
      </div>
    );
  }
}

App.propTypes = {
  entrys: PropTypes.array.isRequired,
  importantEntrys: PropTypes.array.isRequired,
  importantEntrysCount: PropTypes.number.isRequired,
  currentUser: PropTypes.object,
};

export default createContainer(() => {
  Session.setDefault('lazyloadLimit', 10);
  Tracker.autorun(function(){
    Meteor.subscribe('entrys', Session.get('lazyloadLimit'));
  });
  Meteor.subscribe('importantEntrys');

  return {
    entrys: Entrys.find({}, { sort: { createdAt: -1 }, limit: Session.get('lazyloadLimit') }).fetch(),
    importantEntrys: Entrys.findFromPublication('importantEntrys', {}, {sort: { createdAt: -1 }}).fetch(),
    importantEntrysCount: Entrys.findFromPublication('importantEntrys', {}).count(),
    currentUser: Meteor.user(),
  };
}, App);