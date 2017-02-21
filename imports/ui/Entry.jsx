import React, { Component, PropTypes } from 'react';
import { moment } from 'meteor/momentjs:moment';
import { Meteor } from 'meteor/meteor';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';
import Dropzone from 'react-dropzone';
// import EmbedJS from 'embed-js';

// Entry component - represents a single todo item
export default class Entry extends Component {
  constructor(props) {
    super(props);

    this.state = {
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
    this.setState({ files: acceptedFiles }, () => {
      this.readFile(this.state.files[0], function(e) {
        this.setState({ fileUrl: e.target.result }, () => {
          this.updateImage();
        });
      }.bind(this));
    });
  }

  toggleImportant() {
    // Set the checked property to the opposite of its current value
    Meteor.call('entrys.setImportant', this.props.entry._id, !this.props.entry.important);
  }
  
  togglePrivate() {
    Meteor.call('entrys.setPrivate', this.props.entry._id, ! this.props.entry.private);
  }

  deleteThisEntry() {
    Meteor.call('entrys.remove', this.props.entry._id);
  }

  altEnter(event) {
    event.preventDefault();
    if (event.keyCode == 13 && event.altKey) {
      this.updateEntry(event);
      this.setState({ edited: false, });
      $('.editEntryForm textarea').val(this.props.entry.text).blur();
    }
  }

  updateEntry() {
    event.preventDefault();
    Meteor.call('entrys.updateText', this.props.entry._id, this.refs[ `text_${ this.props.entry._id}` ].value);
    
    setTimeout(function() {
      this.onBlur(event);
    }.bind(this), 500); // wait for button-effect
  }

  updateImage() {
    event.preventDefault();
    Meteor.call('entrys.updateImage', this.props.entry._id, this.state.fileUrl);  
  }

  deleteImage() {
    event.preventDefault();
    this.setState({ fileUrl: '', });
    Meteor.call('entrys.updateImage', this.props.entry._id, '');  
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
    $('.editEntryForm textarea').val(this.props.entry.text).blur();
  }

  render() {
    // Give entrys a different className when they are checked off,
    // so that we can style them nicely in CSS
    const entryClassName = classnames({
      checked: this.props.entry.important,
      private: this.props.entry.private,
    });
    var edited = classnames( this.state.edited, {
        'none' : ( !this.state.edited ),
        'edited': ( this.state.edited ),
    } );
    var image = false;
    this.props.entry.image ? image = this.props.entry.image.length > 0 : '';
    var imgClass = classnames( image, {
      'no' : ( !image ),
      'yes' : ( image ),
    } )
    const style = {
      backgroundImage: 'url(' + this.props.entry.image + ')',
    };
    // var x = new EmbedJS({
    //   input : this.props.entry.text;
    // });
    var importantCheckboxId = 'importantCheckbox_'+this.props.entry._id;
    var privateCheckboxId = 'privateCheckbox_'+this.props.entry._id;
    
    return (
      <li className={entryClassName}>
        <div className="entryTitle">{this.props.entry.username}</div>
        <span className="timestamps">
          <span> created: { moment(new Date( this.props.entry.createdAt) ).format('DD.MM.YY, HH:mm') }</span>
          { this.props.updated ? (
            <span> | updated: { moment(new Date( this.props.entry.lastEditAt) ).format('DD.MM.YY, HH:mm') }</span>
          ) : ''}
        </span>

        {image ? (
          <div className={'imgbg-container ' + imgClass}>
            <div className="imgbg" style={style}></div>
            <div className="img">
              <img src={this.props.entry.image} />
            </div>
          </div>
        ): ''}

        { (this.props.canEdit && this.props.entryCountByUser < 2) ? (
          <div className={'imageUploadForm ' + imgClass}>
            <Dropzone 
              ref={(node) => { this.dropzone = node; }} 
              accept=".jpg, .png, .gif"
              onDrop={this.onDrop.bind(this)}
              className="dropzone"
              activeClassName="active"
              rejectClassName="reject"
              multiple={false}
              maxSize={1000*1000}
              >
              <div>
                Replace Img
              </div>
            </Dropzone>
            { image ? (<button className="clearImgBtn" onClick={this.deleteImage.bind(this)} >&times;</button>) : '' }
          </div>
        ) : '' }
      
        { (this.props.canEdit && this.props.entryCountByUser < 2) ? (
          <div className={'editEntry '+edited}> 
            <form className="editEntryForm" onKeyUp={this.altEnter.bind(this)} >
              <Textarea 
                className="text"
                onFocus={ this.toggleEdited.bind(this) }
                onKeyUp={ this.escapeEdit.bind(this) }
                // onBlur={ this.onBlur.bind(this) }
                ref={ `text_${ this.props.entry._id }` }
                name="text"
                defaultValue={ this.props.entry.text }
              />
              
              <button className={'editBtn btn '+edited} onClick={this.updateEntry.bind(this)}></button>
            </form>
          </div>
        ) : (
          <span className="entry">
            {this.props.entry.text}
          </span>
        )}
        
        <p />

        { this.props.canEdit ? (
          <div className="entryOptions">
            <div className="checkbox">
              <input 
                type="checkbox" 
                className="slider-checkbox" 
                id={privateCheckboxId} 
                checked={this.props.entry.private}
                onClick={this.togglePrivate.bind(this)}
               />
              <label className="slider-v2" htmlFor={privateCheckboxId}></label>
              <div className="value">Private</div>
            </div>
            <div className="checkbox">
              <input 
                type="checkbox" 
                className="slider-checkbox" 
                id={importantCheckboxId} 
                checked={this.props.entry.important}
                onClick={this.toggleImportant.bind(this)}
               />
              <label className="slider-v2" htmlFor={importantCheckboxId}></label>
              <div className="value">Important</div>
            </div>
            <button className="deleteBtn" onClick={this.deleteThisEntry.bind(this)}>
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