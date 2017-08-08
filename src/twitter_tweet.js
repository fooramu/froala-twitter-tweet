(function ($) {

    'use strict';
    
    var urlRe = /^(http|https):\/\/(twitter\.com|)\/(\w+)\/status\/(\d+)/;
        
    $.extend($.FroalaEditor.POPUP_TEMPLATES, {
        "twitter.insert": '[_BUTTONS_][_INPUT_LAYER_]'
    });

    $.extend($.FroalaEditor.DEFAULTS, {
        twitterHelpText: 'Paste a tweet URL'
    });

    $.FroalaEditor.PLUGINS.twitter = function (editor) {

        function _init () {}

        function initPopup () {
            
            var popup_buttons = '';
            if (editor.opts.popupButtons && editor.opts.popupButtons.length > 0) {
                popup_buttons += '<div class="fr-buttons">';
                popup_buttons += editor.button.buildList(editor.opts.popupButtons);
                popup_buttons += '</div>';
            }

            var tab_idx = 0;
            var input_layer = '<div class="fr-link-insert-layer fr-layer fr-active" id="fr-link-insert-layer-' + editor.id + '">';
            input_layer += '<ul class="errorlist" style="display:none;"></ul>';
            if (editor.opts.twitterHelpText){
              input_layer += '<span class="fr-small-text">'+editor.language.translate(editor.opts.twitterHelpText)+'</span>';
            }
            input_layer += '<div class="fr-input-line"><input name="href" type="text" placeholder="https://twitter.com/user/status/111122223333444455" tabIndex="' + (++tab_idx) + '"></div>';
            input_layer += '<div class="fr-action-buttons"><button class="fr-command fr-submit" data-cmd="linkTwitterInsert" href="#" tabIndex="' + (++tab_idx) + '" type="button">' + editor.language.translate('Insert') + '</button></div></div>';
            
            var template = {
              buttons: popup_buttons,
              input_layer: input_layer
            };
            
            return editor.popups.create('twitter.insert', template);
        }

        function showPopup () {
            var $popup = editor.popups.get('twitter.insert');
            
            if (!$popup) $popup = initPopup();
            
            resetPopup();
            
            editor.popups.setContainer('twitter.insert', editor.$tb);
            var $btn = editor.$tb.find('.fr-command[data-cmd="twitter"]');
            var left = $btn.offset().left + $btn.outerWidth() / 2;
            var top = $btn.offset().top + (editor.opts.toolbarBottom ? 10 : $btn.outerHeight() - 10);
            editor.popups.show('twitter.insert', left, top, $btn.outerHeight());
        }
        
        function resetPopup(){
          var $popup = editor.popups.get('twitter.insert');
          var $errors = $popup.find('ul.errorlist');
          var $input = $popup.find('input[type="text"][name="href"]');
          $errors.hide();
          $errors.html('');
          $input.val('').trigger('change');
        }

        function insertCallback () {
            var $popup = editor.popups.get('twitter.insert');
            var url = $popup.find('input[type="text"][name="href"]').val();
            var t = $(editor.original_window).scrollTop();
            insert(url);
            $(editor.original_window).scrollTop(t);
        }

        function insert(url) {
            editor.events.focus(true);
            editor.selection.restore();
            var clean = $.trim(url);

            if (clean === '') {
                showError('The URL is invalid. Please enter a valid URL.');
                return false;
            }
            
            clean = clean.replace(/ /g, '%20');
            var matches = clean.match(urlRe);
            if (!matches || matches.length < 4){
                showError('The URL is invalid. Please enter a valid URL.');
                return false;
            }

            // End Point
            // https://publish.twitter.com/oembed
            var request_url = 'https://publish.twitter.com/oembed?url=' + matches[0] + '&omit_script=false';
            $.ajax({
                url: request_url,
                dataType: "jsonp"
            }).done(function(data) {
                var embed_tag = data.html;
                editor.html.insert(embed_tag);
            }).fail(function(data) {
                console.log("Failed ajax retrieve tweet embed tag");
            }).always(function(data) {
                console.log(data);
            });

            editor.popups.hide('twitter.insert');
            
            return false;
        }

        function showError(error){
            var $popup = editor.popups.get('twitter.insert');
            var $errors = $popup.find('ul.errorlist');
            var $input = $popup.find('input[type="text"][name="href"]');
            $errors.html('<li>'+error+'</li>').fadeIn();
            $input.one('keyup', function(){
                $errors.fadeOut();
            });
        }

        return {
            _init: _init,
            showPopup: showPopup,
            insertCallback: insertCallback,
            resetPopup: resetPopup
        }
    };

    $.FroalaEditor.DefineIcon('tweetIcon', {NAME: 'twitter'});
    $.FroalaEditor.RegisterCommand('twitter', {
        title: 'tweet',
        icon: 'tweetIcon',
        undo: false,
        focus: true,
        popup: true,
        refreshOnCallback: false,
        callback: function () {
          if (!this.popups.isVisible('twitter.insert')) {
            this.twitter.showPopup();
          }
          else {
            if (this.$el.find('.fr-marker')) {
              this.events.disableBlur();
              this.selection.restore();
            }
            this.popups.hide('twitter.insert');
          }
        }        
    });

    $.FroalaEditor.RegisterCommand('linkTwitterInsert', {
      focus: false,
      refreshAfterCallback: false,
      callback: function () {
        this.twitter.insertCallback();
      }
    })

})(jQuery);
