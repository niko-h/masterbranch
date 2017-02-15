import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';
import { check } from 'meteor/check';
import { Entrys } from '../api/entrys.js';

// import Upload from './Upload.jsx';
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
    url = 'empty';
    this.setState({ files: acceptedFiles }, () => {
      this.readFile(this.state.files[0], function(e) {
        this.setState({ fileUrl: e.target.result }, () => {
          console.info('image converted to base64');
        });
      }.bind(this));
    });
  }

  toggleEdited() {
    this.setState({ edited: true, });
  }

  handleSubmit(event) {
    event.preventDefault();
    console.info('handleSubmit');
    check(this.state.fileUrl, String);

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();
    const image = this.state.fileUrl;

    const entry = {
      text: text,
      image: image
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
    this.setState({ edited: false, });
    $('.new-entry textarea').blur();
  }

  toggleHideUnimportant() {
    this.setState({
      hideUnimportant: !this.state.hideUnimportant,
    });
  }

  renderEntrys() {
    let filteredEntrys = this.props.entrys;
    if (this.state.hideUnimportant) {
      filteredEntrys = filteredEntrys.filter(entry => entry.important);
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

  render() {
    console.info('render()');
    var edited = classnames( this.state.edited, {
        'newEntryForm' : ( !this.state.edited ),
        'newEntryForm edited': ( this.state.edited ),
    } );

    return (
      <div className="container">
        <header>
          <h1>RWGB</h1>
          <span>({this.props.entrysCount} Entries, {this.props.importantEntrysCount} important Entries)</span>

          <label className="hide-unimportant" htmlFor="hide-unimportant">
            <input
              type="checkbox"
              readOnly
              checked={this.state.hideUnimportant}
              onClick={this.toggleHideUnimportant.bind(this)}
              id="hide-unimportant"
            /> Hide unimportant entrys
          </label>

          <AccountsUIWrapper />

          { this.props.currentUser ?
            <div className="newEntry">
              <form className={edited} onKeyUp={this.altEnter.bind(this)} >
                <Textarea 
                  ref="textInput"
                  // onBlur={ this.onBlur.bind(this) }
                  placeholder="Type to add a new entry"
                  onKeyUp={ this.escapeEdit.bind(this) }
                  onFocus={ this.toggleEdited.bind(this) }
                />
                <button className="submitBtn" onClick={this.handleSubmit.bind(this)} ></button>
              </form>
              <div className="imageUploadForm">
                <Dropzone 
                  ref={(node) => { this.dropzone = node; }} 
                  accept=".jpg, .png"
                  onDrop={this.onDrop.bind(this)}
                  className="drop-zone"
                  activeClassName="drop-zone-active"
                  rejectClassName="drop-zone-reject"
                  multiple={false}
                  maxSize={1000*1000}
                  >
                  <div>
                    Image Upload
                  </div>
                </Dropzone>
                {this.state.files.length > 0 ? <div className="preview">
                  {this.state.files.map((file) => <img src={file.preview} /> )}
                  </div> : null
                }
              </div>
            </div> : ''
          }
        </header>

        <ul className="mainContent">
          {this.renderEntrys()}
        </ul>
      </div>
    );
  }
}

App.propTypes = {
  entrys: PropTypes.array.isRequired,
  importantEntrysCount: PropTypes.number.isRequired,
  entrysCount: PropTypes.number.isRequired,
  currentUser: PropTypes.object,
};

export default createContainer(() => {
  Meteor.subscribe('entrys');
 
  return {
    entrys: Entrys.find({}, { sort: { createdAt: -1 } }).fetch(),
    entrysCount: Entrys.find().count(),
    importantEntrysCount: Entrys.find().count() - Entrys.find({ important: { $ne: true } }).count(),
    currentUser: Meteor.user(),
  };
}, App);