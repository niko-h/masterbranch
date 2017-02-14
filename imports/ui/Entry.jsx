import React, { Component, PropTypes } from 'react';
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
    }
  }

  updateEntry() {
    event.preventDefault();
    Meteor.call('entrys.updateText', this.props.entry._id, this.refs[ `text_${ this.props.entry._id}` ].value);
    this.onBlur(event);
  }

  toggleEdited() {
    this.setState({ edited: true, });
  }

  escapeEdit(event) {
    if (event.keyCode == 27) {
      this.onBlur(event);
    }
  }

  onBlur(event) {
    this.setState({ edited: false, });
    $('.entry-edit textarea').val(this.props.entry.text).blur();
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
    var checkboxId = 'importantCheckbox_'+this.props.entry._id;
    
    return (
      <li className={entryClassName}>
        <strong>{this.props.entry.username}</strong>
        <span> created: { moment(new Date( this.props.entry.createdAt) ).format('DD.MM.YY, HH:mm') }</span>
        { this.props.updated ? (
          <span> | updated: { moment(new Date( this.props.entry.lastEditAt) ).format('DD.MM.YY, HH:mm') }</span>
        ) : ''}
        <p />

        <img src={this.props.entry.image} />

        { (this.props.canEdit && this.props.entryCountByUser < 2) ? (
          <div className={edited}> 
            <form className="editEntryForm" onKeyUp={this.altEnter.bind(this)} >
              <Textarea 
                className="text"
                onFocus={ this.toggleEdited.bind(this) }
                onKeyUp={ this.escapeEdit.bind(this) }
                onBlur={ this.onBlur.bind(this) }
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
          <div>
            <span>
              <label htmlFor={checkboxId}>
                <input
                  type="checkbox"
                  readOnly
                  id={checkboxId}
                  checked={this.props.entry.important}
                  onClick={this.toggleImportant.bind(this)}
                /> important
              </label>
            </span>
            <button className="toggle-private" onClick={this.togglePrivate.bind(this)}>
              { this.props.entry.private ? 'Private' : 'Public' }
            </button>
            <button className="delete" onClick={this.deleteThisEntry.bind(this)}>
              &times;
            </button>
          </div>
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
  entryCountByUser: PropTypes.number.isRequired,
};