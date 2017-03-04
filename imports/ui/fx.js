(function() {
  var material;

  $(document).ready(function() {
    Notification.requestPermission();
    
    // THEME COOKIE
    function createCookie(name,value,days) {
      var expires = "";
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + value + expires + "; path=/";
    }
    function readCookie(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return null;
    }
    function eraseCookie(name) {
      createCookie(name,"",-1);
    }
    if(readCookie('day')!=='true' && readCookie('day')!=='false') {
      createCookie('day','true',1);
    } 

    if(readCookie('day')==='true') {
      $('body').removeClass('night');
      $('.toggle.toggle--daynight input').prop('checked', true);
    } else {
      $('body').addClass('night');
      $('.toggle.toggle--daynight input').prop('checked', false);
    }
    
    $('.toggle.toggle--daynight input').change(function() {
      if(readCookie('day')==='true') {
        $('body').addClass('night');
        createCookie('day', 'false', 1);
        $(this).prop('checked', false);
      } else {
        $('body').removeClass('night');
        createCookie('day', 'true', 1);
        $(this).prop('checked', true);
      }
    });

    // Matrial-Button-Effect
    return material.init();
  });
  $(document).bind('drop dragover', function (e) {
    e.preventDefault();
  });

  material = {
    init: function() {
      return this.bind_events();
    },
    bind_events: function() {
      return $(document).on("click", ".btn", function(e) {
        var circle, size, x, y;
        e.preventDefault();
        circle = $("<div class='circle'></div>");
        $(this).append(circle);
        x = e.pageX - $(this).offset().left - circle.width() / 2;
        y = e.pageY - $(this).offset().top - circle.height() / 2;
        size = $(this).width();
        offset = size<20 ? 45 : 10;
        circle.css({
          top: y + offset + 'px',
          left: x + offset + 'px',
          width: size + 'px',
          height: size + 'px'
        }).addClass("animate");
        return setTimeout(function() {
          return circle.remove();
        }, 500);
      });
    }
  };

}).call(this);

(function($) {
  $.fn.caret = function(pos) {
    var target = this[0];
    var isContentEditable = target && target.contentEditable === 'true';
    if (arguments.length == 0) {
      //get
      if (target) {
        //HTML5
        if (window.getSelection) {
          //contenteditable
          if (isContentEditable) {
            target.focus();
            var range1 = window.getSelection().getRangeAt(0),
                range2 = range1.cloneRange();
            range2.selectNodeContents(target);
            range2.setEnd(range1.endContainer, range1.endOffset);
            return range2.toString().length;
          }
          //textarea
          return target.selectionStart;
        }
        //IE<9
        if (document.selection) {
          target.focus();
          //contenteditable
          if (isContentEditable) {
              var range1 = document.selection.createRange(),
                  range2 = document.body.createTextRange();
              range2.moveToElementText(target);
              range2.setEndPoint('EndToEnd', range1);
              return range2.text.length;
          }
          //textarea
          var pos = 0,
              range = target.createTextRange(),
              range2 = document.selection.createRange().duplicate(),
              bookmark = range2.getBookmark();
          range.moveToBookmark(bookmark);
          while (range.moveStart('character', -1) !== 0) pos++;
          return pos;
        }
        // Addition for jsdom support
        if (target.selectionStart)
          return target.selectionStart;
      }
      //not supported
      return;
    }
    //set
    if (target) {
      if (pos == -1)
        pos = this[isContentEditable? 'text' : 'val']().length;
      //HTML5
      if (window.getSelection) {
        //contenteditable
        if (isContentEditable) {
          target.focus();
          window.getSelection().collapse(target.firstChild, pos);
        }
        //textarea
        else
          target.setSelectionRange(pos, pos);
      }
      //IE<9
      else if (document.body.createTextRange) {
        if (isContentEditable) {
          var range = document.body.createTextRange();
          range.moveToElementText(target);
          range.moveStart('character', pos);
          range.collapse(true);
          range.select();
        } else {
          var range = target.createTextRange();
          range.move('character', pos);
          range.select();
        }
      }
      if (!isContentEditable)
        target.focus();
    }
    return this;
  }
})(jQuery);

