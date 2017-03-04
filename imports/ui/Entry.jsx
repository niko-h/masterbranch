import React, { Component, PropTypes } from 'react';
import { moment } from 'meteor/momentjs:moment';
import { Meteor } from 'meteor/meteor';
import Textarea from 'react-textarea-autosize';
import classnames from 'classnames';
import Dropzone from 'react-dropzone';

// Entry component - represents a single todo item
export default class Entry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      edited: false,
      files: [],
      fileUrl: '',
      impDateEdited: false,
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

  parseEntry(text) {  
    return text.replace(/(?:http:|https:)?(?:\/\/)(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^<.,!():"'\s]+)/g, 
                      '<iframe width="100%" height="300" src="http://www.youtube.com/embed/$1?modestbranding=1&rel=0&wmode=transparent&theme=light&color=white" frameborder="0" allowfullscreen></iframe>')
              .replace(/(?:http:|https:)?(?:\/\/)(?:www\.)?(?:vimeo\.com)\/([^<.,!():"'\s]+)/g, 
                      '<iframe src="//player.vimeo.com/video/$1" width="100%" height="300" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>')
              .replace(/(?:http:|https:)?(?:\/\/)(?:www\.|w\.|m\.)?(?:snd\.sc)\/(.*)/g, 
                      '<iframe width="100%" height="125" scrolling="no" frameborder="no" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/$1&amp;color=cccccc&amp;auto_play=false&amp;hide_related=true&amp;show_comments=true&amp;show_user=true&amp;show_reposts=false"></iframe>')
              ;
  }

  updateEntry() {
    event.preventDefault();

    Meteor.call('entrys.updateText', this.props.entry._id, this.parseEntry(this.refs[ `text_${ this.props.entry._id}` ].value));

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

  setNewImportantDate(event) {
    event.preventDefault();
    console.info('changeImportantDate');
    var date = this.refs[ `importantDate_${ this.props.entry._id}` ].value;
    var impDateArr = date.split('.');
    date = impDateArr[1]+'/'+impDateArr[0]+'/'+impDateArr[2];
    
    Meteor.call('entrys.updateImportantDate', this.props.entry._id, date );
    this.setState({impDateEdited: false});
  }
  setImpDateEdit(event) {
    event.preventDefault();
    this.setState({impDateEdited: true});
  }
  escapeImpDate(event) {
    if (event.keyCode == 27) {
      $('.importantDate').blur();
      this.setState({impDateEdited: false});
    }
  }

  editLastBtn() {
    event.preventDefault();
    setTimeout(function() {
      this.setState({edited: true});
      $('.mainContent li#'+this.props.entry.countId+' .textarea').caret(-1);
    }.bind(this), 500); // wait for button-effect
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
    const entryClassName = classnames({
      private: this.props.entry.private,
      important: this.props.entry.important,
    });
    var edited = classnames( this.state.edited, {
        'none' : ( !this.state.edited ),
        'edited': ( this.state.edited ),
    });
    var impDateEdit = classnames( this.state.impDateEdited, {
      'edited': (this.state.impDateEdited ),
    });
    var image = false;
    this.props.entry.image ? image = this.props.entry.image.length > 0 : '';
    var imgClass = classnames( image, {
      'no' : ( !image ),
      'yes' : ( image ),
    });
    const style = {
      backgroundImage: 'url(' + this.props.entry.image + ')',
    };

    var importantDate = moment(this.props.entry.importantDate).format('DD.MM.YYYY');
    var importantCheckboxId = 'importantCheckbox_'+this.props.entry._id;
    var privateCheckboxId = 'privateCheckbox_'+this.props.entry._id;
    
    return (
      <li className={entryClassName} id={this.props.entry.countId}>
        <div className="entryTitle">{this.props.entry.username}</div>

        {this.props.entry.important ? (
          <div className="importantDateContainer">
            { (this.props.canEdit && this.props.entryCountByUser < 2) ? ( 
              <span>Wichtig am 
                <input 
                  type="text" 
                  className="importantDate"
                  ref={ `importantDate_${ this.props.entry._id }` }
                  value={importantDate}
                  onClick={this.setImpDateEdit.bind(this)}
                  onKeyUp={this.escapeImpDate.bind(this)} />
                <button 
                  className={'updateImportantDateBtn btn '+impDateEdit}
                  onClick={this.setNewImportantDate.bind(this)}>Speichern</button>
              </span>
            ) : <span>Wichtig am {importantDate}</span> }
          </div>
        ) : ''}

        <span className="timestamps">
          <span>&#8470; {this.props.entry.countId}</span>
          <span> | Erstellt: { moment(new Date( this.props.entry.createdAt) ).format('DD.MM.YY, HH:mm') }</span>
          { this.props.updated ? (
            <span> | Aktualisiert: { moment(new Date( this.props.entry.lastEditAt) ).format('DD.MM.YY, HH:mm') }</span>
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
              <div className="icon-add_a_photo"></div>
            </Dropzone>
            { image ? (<button className="clearImgBtn" onClick={this.deleteImage.bind(this)} >&times;</button>) : '' }
          </div>
        ) : '' }
      
        { (this.props.canEdit && this.props.entryCountByUser < 2) ? (
          <div className={'editEntry '+edited}> 
            <form className="editEntryForm" onKeyUp={this.altEnter.bind(this)} >
              <Textarea 
                className="textarea"
                onFocus={ this.toggleEdited.bind(this) }
                onKeyUp={ this.escapeEdit.bind(this) }
                // onBlur={ this.onBlur.bind(this) }
                ref={ `text_${ this.props.entry._id }` }
                name="text"
                defaultValue={ this.props.entry.text }
              />
            <span className="entry" dangerouslySetInnerHTML={{__html: this.props.entry.text}}></span>
            <button className="editLastBtn btn icon-mode_edit" onClick={ this.editLastBtn.bind(this) }></button>
              
              <button className={'editBtn btn '+edited} onClick={this.updateEntry.bind(this)}></button>
            </form>
          </div>
        ) : (
          <span className="entry" dangerouslySetInnerHTML={{__html: this.props.entry.text}}></span>
        )}

        { (this.props.canEdit && this.props.entryCountByUser < 2) ? (
          <div className="entryOptions">
            <div className="checkbox green">
              <input 
                type="checkbox" 
                className="slider-checkbox" 
                id={privateCheckboxId} 
                checked={this.props.entry.private}
                onChange={this.togglePrivate.bind(this)}
               />
              <label className="slider-v2" htmlFor={privateCheckboxId}></label>
              <div className="value">Privat</div>
            </div>
            <div className="checkbox red">
              <input 
                type="checkbox" 
                className="slider-checkbox" 
                id={importantCheckboxId} 
                checked={this.props.entry.important}
                onChange={this.toggleImportant.bind(this)}
               />
              <label className="slider-v2" htmlFor={importantCheckboxId}></label>
              <div className="value">Wichtig</div>
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