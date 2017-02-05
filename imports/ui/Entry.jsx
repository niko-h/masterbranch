import React, { Component, PropTypes } from 'react';
import { RIETextArea } from 'riek';
import { moment } from 'meteor/momentjs:moment';
import { Meteor } from 'meteor/meteor';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';

// Entry component - represents a single todo item
export default class Entry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      edited: false,
    };
  }

  toggleImportant() {
    // Set the checked property to the opposite of its current value
    Meteor.call('entrys.setImportant', this.props.entry._id, !this.props.entry.important);
  }

  deleteThisEntry() {
    Meteor.call('entrys.remove', this.props.entry._id);
  }

  togglePrivate() {
    Meteor.call('entrys.setPrivate', this.props.entry._id, ! this.props.entry.private);
  }

  altEnter(event) {
    event.preventDefault();
    if (event.keyCode == 13 && event.altKey) {
      this.updateEntry(event);
      $('.entry-edit textarea').blur()
    }
  }

  updateEntry() {
    event.preventDefault();
    Meteor.call('entrys.updateText', this.props.entry._id, this.refs[ `text_${ this.props.entry._id}` ].value);
    this.setState({
      edited: false,
    });
  }

  toggleEdited() {
    this.setState({ edited: true, });
  }

  escapeEdit(event) {
    if (event.keyCode == 27) {
      this.setState({ edited: false, });
      $('.entry-edit textarea').val(this.props.entry.text).blur();
    }
  }

  render() {
    // Give entrys a different className when they are checked off,
    // so that we can style them nicely in CSS
    const entryClassName = classnames({
      checked: this.props.entry.important,
      private: this.props.entry.private,
    });
    var edited = classnames( this.state.edited, {
        'entry-edit' : ( !this.state.edited ),
        'entry-edit edited': ( this.state.edited ),
    } );
    
    return (
      <li className={entryClassName}>
        <strong>{this.props.entry.username}</strong>
        <span> created: { moment(new Date( this.props.entry.createdAt).toString() ).format('DD.MM.YY, HH:mm') }</span>
        { this.props.updated ? (
          <span> | updated: { moment(new Date( this.props.entry.lastEditAt).toString() ).format('DD.MM.YY, HH:mm') }</span>
        ) : ''}
        <p />
        { (this.props.canEdit) ? (
          <div className={edited}> 
            <form className="editEntryForm" onKeyUp={this.altEnter.bind(this)} >
              <Textarea 
                className="text"
                onChange={ this.toggleEdited.bind(this) }
                onKeyUp={ this.escapeEdit.bind(this) }
                ref={ `text_${ this.props.entry._id }` }
                name="text"
                defaultValue={ this.props.entry.text }
              />
            </form>
            <button className="editBtn" onClick={this.updateEntry.bind(this)}></button>
          </div>
        ) : (
          <span className="entry">
            {this.props.entry.text}
          </span>
        )}
        
        <p />

        { this.props.canEdit ? (
          <span>
            <label htmlFor="importantCheckbox_{this.props.entry._id}">
              <input
                type="checkbox"
                readOnly
                id="importantCheckbox_{this.props.entry._id}"
                checked={this.props.entry.important}
                onClick={this.toggleImportant.bind(this)}
              /> important
            </label>
          </span>
        ) : ''}
        { this.props.canEdit ? (
          <button className="toggle-private" onClick={this.togglePrivate.bind(this)}>
            { this.props.entry.private ? 'Private' : 'Public' }
          </button>
        ) : ''}
        { this.props.canEdit ? (
          <button className="delete" onClick={this.deleteThisEntry.bind(this)}>
            &times;
          </button>
	       ) : ''}
      </li>
    );
  }
}

Entry.propTypes = {
  // This component gets the entry to display through a React prop.
  // We can use propTypes to indicate it is required
  entry: PropTypes.object.isRequired,
  canEdit: React.PropTypes.bool.isRequired,
  updated: PropTypes.bool.isRequired,
};