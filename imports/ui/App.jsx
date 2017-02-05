import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';
import { Entrys } from '../api/entrys.js';

import Entry from './Entry.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx';

// App component - represents the whole app
class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hideUnimportant: false,
      edited: false,
    };
  }

  toggleEdited() {
    this.setState({ edited: true, });
  }

  handleSubmit(event) {
    event.preventDefault();

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();

    if (text.length>0) {
      Meteor.call('entrys.insert', text);
      this.onBlur(event);
    }

    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = '';
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
    var edited = classnames( this.state.edited, {
        'new-entry' : ( !this.state.edited ),
        'new-entry edited': ( this.state.edited ),
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
            <form className={edited} onKeyUp={this.altEnter.bind(this)} >
              <Textarea
                ref="textInput"
                onFocus={ this.toggleEdited.bind(this) }
                onKeyUp={ this.escapeEdit.bind(this) }
                onBlur={ this.onBlur.bind(this) }
                placeholder="Type to add a new entry"
              />
              <button className="submitBtn" onClick={this.handleSubmit.bind(this)} ></button>
            </form> : ''
          }
        </header>

        <ul>
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