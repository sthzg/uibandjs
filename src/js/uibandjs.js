// _____________________________________________________________________________
//                                                                       UI Band
/**
 * UI band
 * -------
 * Widget container on the bottom of the screen that can hold arbitrary UI
 * elements/widgets like the Categorizr.
 *
 * The UI band is currently structured as a 3-split-container
 *
 * -----------------------------------------------------------------------------
 * | Widget Icons  |            Widget Display          |   Notification Area  |
 * -----------------------------------------------------------------------------
 *
 * Widget Icons:
 * Every registered widget is represented by an icon (clickable/tababble).
 *
 * Widget Display:
 * The currently active widget is displayed in this main area.
 *
 * Notification Area:
 * Features a queue in which time-based notifications could be added.
 *
 */
var uiband = {

    current_widget_id: undefined,
    $current_widget: undefined,

    $uib: undefined,
    $region_west: undefined,
    $region_middle: undefined,
    $region_east: undefined,

    widget_registry: {
        widgets: {}
    },

    /**
     * Returns the current UI band instance or creates it if it does not exist.
     *
     * @returns {*}
     */
    get_or_create: function () {

        if (this.$uib == undefined) {
            this.$uib_widget_menu = $('<ul class="uib-widget-menu"></ul>');
            this.$region_west = $('<div class="uib-region uib-region-west fs_iblock"></div>');
            this.$region_west.append(this.$uib_widget_menu);
            this.$region_middle = $('<div class="uib-region uib-region-middle fs_iblock"></div>');
            this.$region_middle_canvas = $('<div class="uib-middle-container"></div>');
            this.$region_middle.append(this.$region_middle_canvas);
            this.$region_east = $('<div class="uib-region  uib-region-east fs_iblock"></div>');
            this.$uib = $('<div class="uib-uiband"></div>');
            this.$uib.append(this.$region_west)
                .append(this.$region_middle)
                .append(this.$region_east);
        }
        return this.$uib;

    },

    /**
     * Show widget with id in the UI band.
     *
     * @param id
     */
    show_widget: function (id) {

        if (id == this.current_widget_id) {
            return;
        }

        $w = this.widget_registry.widgets[id];
        cur_idx = this.$current_widget.index();
        target_idx = $w.index();

        cur_y = parseInt(uiband.$region_middle_canvas.css('margin-top'));
        offset = cur_y + (cur_idx - target_idx) * 30;
        this.$region_middle_canvas.stop().animate({
            'margin-top': offset + 'px'
        }, 160);

        this._set_current_widget(id);

    },

    /**
     * Adds $widget with id to the widget registry.
     *
     * @param id
     * @param $widget
     */
    register_widget: function (id, $widget) {

        // Check if the widget implements necessary settings.
        try {
            var controller = $widget.controller;
            var icon = $widget.controller.icon;
            var label = $widget.controller.label;
        } catch (err) {
            // TODO  Should link to documentation
            throw "Please provide a controller attribute on your widget and " +
                "configure icon and label.";
        }

        var that = this;

        $menu_item = $('<li class="uib-menu-item"></li>');
        $menu_item.append($('<i class="fa ' + icon + '" title="' + label + '"></i>'));
        $menu_item.attr('data-target', id);
        $menu_item.bind("click", function () {
            that.show_widget($(this).data('target'));
        });
        this.$uib_widget_menu.append($menu_item);

        $widget.addClass('uib-widget');
        $widget.attr('id', id);
        this.widget_registry.widgets[id] = $widget;
        this.$region_middle_canvas.append(this.widget_registry.widgets[id]);

        if (this.current_widget_id == undefined) {
            this._set_current_widget(id);
        }
    },


    remove_widget: function (id) {
        // TODO
    },

    /**
     * Sets quick access variables pointing to currently active widget.
     *
     * @param id
     * @private
     */
    _set_current_widget: function (id) {
        $('.uib-menu-item').removeClass('active');
        $('li[data-target="' + id + '"]').addClass('active');
        this.current_widget_id = id;
        this.$current_widget = this.widget_registry.widgets[id];
    }

};


// _____________________________________________________________________________
//                                                                        Notice
/**
 * Notice
 * ------
 * This widget shows short notices like success or error badges. It complements
 * the default messaging system as it is only thought for short-lived notices
 * that indicate status after ajax'ified actions.
 */

// Dev-Note
// --------
// When it turns out that this widget gets used a lot it might make sense to
// turn it into an event-based process. Currently the display queue is
// checked by a timer that runs periodically (1/s at the moment), which is
// not the nicest design. But on the other hand, checking state once per
// second does not put much stress on the CPU and seems well enough to make
// this prototype run.

var uib_notice = {
    $notice: undefined,
    standard: '',
    queue: {
        widget: undefined,
        is_busy: false,
        dismiss_at: undefined,
        note_loop: undefined,
        items: [],
        history: [],

        /**
         * Initialize the queing system.
         *
         * @param widget
         */
        init: function (widget) {
            this.widget = widget;
            var that = this;
            this.note_loop = setInterval(
                function () {
                    that._check_messages(that)
                }, 1000);
        },

        /**
         * Checks the queue for messages to display.
         *
         * @param that
         * @private
         */
        _check_messages: function (that) {

            if (!that.is_busy && that.items.length > 0) {
                var current_item = that.items.splice(0, 1);
                that._display_message(current_item[0]);

            } else if (that.is_busy) {
                if (new Date().getTime() >= that.dismiss_at) {
                    that.widget.$notice.fadeOut(188, function () {
                        that.is_busy = false;
                    })
                }
            }
        },

        /**
         * Displays one message in the Notice widget.
         *
         * @param item
         * @private
         */
        _display_message: function (item) {
            this.is_busy = true;
            this.dismiss_at = new Date(new Date().getTime() + 1000 * item.duration);
            this.widget.$notice.html(item.$note);
            this.widget.$notice.hide(0).fadeIn(188);
        }
    },

    /**
     * Initialize the Notice widget.
     */
    init: function () {
        this.queue.init(this);
    },

    /**
     * Returns the Notice widget and creates it if it does not already exist.
     *
     * @returns {*}
     */
    get_or_create: function () {
        if (this.$notice == undefined) {
            $el = $('<div class="uib-notice-container"></div>');
            $el.html('<span class="inactive"></span>');
            this.$notice = $el;
        }
        return this.$notice;
    },

    /**
     * Adds a note to the display queue.
     *
     * @param label
     * @param duration in seconds.
     * @param icon
     * @param msg
     */
    add_note: function (label, duration, icon, msg) {
        var $note = this._assemble_note(label, icon, msg);
        this.queue.items.push({'duration': duration, '$note': $note});
    },

    /**
     * Construct the HTML for a note object and return it to the caller.
     *
     * @param label
     * @param icon
     * @param msg
     * @returns {*|jQuery|HTMLElement}
     * @private
     */
    _assemble_note: function (label, icon, msg) {
        $note = $('<span class="uib-note"></span>');

        if (icon != undefined) {
            $icon = $('<i class="fa fa-' + icon + '"></i>');
        }
        else {
            $icon = $('<i class="fa fa-bullhorn"></i>');
        }

        $note.append($icon);

        $label = $('<span class="uib-label"> ' + label + '</span>');

        if (msg != undefined) {
            $label.attr('title', msg);
        }

        $note.append($label);
        return $note;
    }
};
