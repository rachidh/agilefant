
(function($) {
    var UserChooser = function(opt) {
        var options = {
            url: "getUserChooserJSON.action",
            legacyMode: true,
            backlogItemId: null,
            backlogIdField: null,
            userListContainer: null,
            renderFor: 'backlogItem',
            overlayUpdate: function() {
                $('.ui-dialog-overlay').css("height",$(document).height()).css("width",$(document).width());
            },
            validation: {
                rules: {
                    "delta": {
                        aftime: [ false, true ]
                    }
                },
                messages: {
                    "delta": {
                        aftime: "Invalid format"
                    }
                }
            }
        };
        jQuery.extend(options, opt);
        
        this.options = options;
        this.data = null;
        this.cache = null;
    };
    
    UserChooser.prototype = {
        init: function(opt) {
            /* Resets */
            this.data = null;
        
            var me = this;
            this.form = $('<form/>');
            this.table = $('<table/>').appendTo(this.form);
            
            var dialog = $('<div/>').addClass('userChooserDialog').append(this.form).appendTo(document.body);
                    
            var windowOptions = {
                close: function() {
                    me.destroy();
                },
                width: 600, height: '',
                title: "Select users",
                resizable: false,
                modal: true,
                overlay: {
                    "background-color": "#000000",
                    "filter": "alpha(opacity=20)",
                    "opacity": 0.20,
                    "-moz-opacity": 0.20,
                    "height": "100%",
                    "width": "100%"
                }
            }
            jQuery.extend(windowOptions, opt);
                             
            this.dialog = dialog.dialog(windowOptions);
            this.dialog.css('height','100%');
            
            $(window).scroll(this.options.overlayUpdate);
            this.options.overlayUpdate();
            
            this.getData();
        },
        destroy: function() {
            $(window).unbind('scroll', this.options.overlayUpdate);
            this.dialog.dialog('destroy');
            this.dialog.remove();
            return false;
        },
        renderTableContents: function() {
            if (this.options.renderFor == 'project') {
                this.selectAction = this.projectSelectAction;
                this.renderForProject();
            }
            else {
                this.selectAction = this.bliSelectAction;
                this.renderForBLI();
            }
            
            this.form.validate(this.options.validation);
        },
        renderForProject: function() {
            var me = this;
            var headerRow = $('<tr/>').appendTo(this.table);
            headerRow.append('<th class="userColumn">Users</th><th class="userColumn">Personal overhead</th><th>Teams</th>')
            var row = $('<tr/>').appendTo(this.table);
            this.assignedCell = $('<td/>').appendTo(row);
            this.notAssignedCell = $('<td/>').appendTo(row);
            this.teamCell = $('<td/>').appendTo(row);
            
            /* Render the columns */
            var nameList = $('<ul/>').addClass('projectAssigneeList').appendTo(this.assignedCell);
            var overheadList = $('<ul/>').addClass('projectAssigneeList').appendTo(this.notAssignedCell);
            $.each(this.data.showUsers, function() {
                var nameLi = $('<li/>').appendTo(nameList);
                var overheadLi = $('<li/>').appendTo(overheadList);

                /* Print the name */
                var e = me.data.users[this.id];
                var checkbox = $('<input type="checkbox"/>').attr('name','userIds').val(this.id);
                var label = $('<label/>').text(e.fullName);
                if (!e.enabled) {
                    label.addClass('disabledUser');
                }
                nameLi.append(checkbox).append(label).appendTo(nameList);
                
                /* Print the overhead */
                var overheadText = $('<span/>').appendTo(overheadLi).hide();
                var deltaValue = "";
                if (me.data.overheads[this.id] == null) {
                    deltaValue = "";
                } else if(typeof(me.data.overheads[this.id]) == 'number') {
                    var a = me.data.overheads[this.id];
                    deltaValue = Date.millisToAFTime((me.data.overheads[this.id] * 1000));
                } else {
                    deltaValue = me.data.overheads[this.id];
                }
                $('<input type="text" size="5"/>').attr('name','delta').attr('id','delta_user_' + e.id).val(deltaValue).appendTo(overheadText);
                
                /* Bind the hide/show event */
                checkbox.change(function() {
                    if (checkbox.is(":checked")) {
                        overheadText.show();
                    }
                    else {
                        overheadText.hide();
                    }
                });
            });
            
            /* Render the team list */
            this.selectCheckboxes(this.data.selectedList);
            this.renderTeamList();
            this.renderButtons();
            
        },
        renderForBLI: function() {
            var me = this;
            var headerRow = $('<tr/>').appendTo(this.table);
            
            var row = $('<tr/>').appendTo(this.table);
            this.assignedCell = $('<td/>').appendTo(row);
            this.notAssignedCell = $('<td/>').appendTo(row);
            this.teamCell = $('<td/>').appendTo(row);
                     
            if (this.data.notAssignedIds.length == 0 || this.data.assignments.length == 0) {
                var firstLength = Math.ceil(me.data.showCount / 2);
                var firstList = [];
                var secondList = [];
                var i = 0;
                $.each(me.data.showUsers, function() {
                    if (i < firstLength) {
                        firstList.push(this.id);
                    }
                    else {
                        secondList.push(this.id);
                    }
                    i++;
                });
                this.assignedCell.append(this.renderCheckboxList(firstList));
                this.notAssignedCell.append(this.renderCheckboxList(secondList));
                headerRow.append('<th class="userColumn">Users</th><th class="userColumn"></th><th class="teamColumn">Teams</th>');
            }
            else {
                this.assignedCell.append(this.renderCheckboxList(this.data.assignments));
                this.notAssignedCell.append(this.renderCheckboxList(this.data.notAssignedIds));
                headerRow.append('<th class="userColumn">Assigned</th><th class="userColumn">Not assigned</th><th class="teamColumn">Teams</th>');
            }
            
            this.selectCheckboxes(this.data.selectedList);
            this.renderTeamList();
            this.renderButtons();
        },
        renderButtons: function() {
            var me = this;
            var lastRow = $('<tr/>').appendTo(this.table);
            var okButtonCol = $('<td colspan="2"/>').appendTo(lastRow);
            var cancelButtonCol = $('<td class="deleteButton"/>').appendTo(lastRow);
            
            var okButton = $('<input type="submit" />').val('Select').appendTo(okButtonCol);
            var cancelButton = $('<input type="reset" />').val('Cancel').appendTo(cancelButtonCol);
            
            okButton.click(function() { me.selectAction(); });
            cancelButton.click(function() { me.cancelAction(); });
        },
        renderTeamList: function() {
            var me = this;
            var teamTable = $('<table/>').appendTo(this.teamCell);
            $.each(this.data.teams, function() {
                var row = $('<tr/>').appendTo(teamTable);
                $('<td/>').text(this.name).appendTo(row);
                var actionCell = $('<td/>').appendTo(row);
                var plusButton = $('<img src="static/img/team_add_users.png"/>').addClass('clickable')
                    .attr('title','Select team\'s users').attr('alt','Select team\'s users').appendTo(actionCell);
                var minusButton = $('<img src="static/img/team_remove_users.png"/>').addClass('clickable')
                    .attr('title','Unselect team\'s users').attr('alt','Unselect team\'s users').appendTo(actionCell);
                
                var myUsers = [];
                $.each(this.users, function() {
                    myUsers.push(this.id);
                });
                
                plusButton.click(function() {
                    me.selectCheckboxes(myUsers);
                });
                minusButton.click(function() {
                    me.unselectCheckboxes(myUsers);
                });
            });
        },
        renderCheckboxList: function(list) {
            var me = this;
            var newList = $('<ul/>');
            $.each(list, function() {
                var e = me.data.users[this];
                var checkbox = $('<input type="checkbox"/>').attr('name','userIds').val(this);
                var label = $('<label/>').text(e.fullName);
                if (!e.enabled) {
                    label.addClass('disabledUser');
                }
                $('<li/>').append(checkbox).append(label).appendTo(newList);
            });
            return newList;
        },
        getData: function() {
            if (this.cache != null) {
                this.data = this.cache;
                this.renderTableContents();
                return false;
            }
        
            var backlogId = (this.options.backlogIdField != null)? $(this.options.backlogIdField).val() : 0;
            var me = this;
			if (!(backlogId > 0)) {
			    backlogId = 0;
			}
            $.ajax({
                type: 'post',
                dataType: 'json',
                url: this.options.url,
                async: true,
                data: {

                    backlogId: backlogId,
                    backlogItemId: this.options.backlogItemId
                },
                
                success: function(data, status) {
                    me.data = data;
                    
                    var userMap = {};
                    me.data.usersLength = me.data.users.length;
                    me.data.enabledUsers = {};
                    me.data.disabledUsers = {};
                    me.data.showCount = 0;
                    $.each(me.data.users, function() {
                        userMap[this.id] = this;
                        if (this.enabled) {
                            me.data.showCount++;
                            me.data.enabledUsers[this.id] = this;
                        }
                        else {
                            me.data.disabledUsers[this.id] = this;
                        }
                    });
                    me.data.users = userMap;
                    
                    me.data.selectedList = [];
                    me.data.notAssignedIds = [];
                    me.data.showUsers = me.data.enabledUsers;
                    
                    if (me.options.renderFor == 'project') {
                        me.data.selectedList = data.assignments;
                    }
                    else {
                        me.data.selectedList = data.responsibles;
                    }
		            
		            $.each(me.data.showUsers, function(key, val) {
		                if (jQuery.inArray(parseInt(key), me.data.assignments) == -1) {
		                    me.data.notAssignedIds.push(key);
		                }
		            });
                    
                    me.renderTableContents();
                    return false;
                }
            });
        },
        getSelected: function() {
            var list = [];
            $(this.form).find(':checked').each(function() {
                list.push(parseInt($(this).val()));
            });
            return list;
        },
        selectCheckboxes: function(ids) {
            $(this.form).find(':checkbox').each(function() {
                if (jQuery.inArray(parseInt($(this).val()), ids) > -1) {
                    $(this).attr('checked','checked').change();
                }
            });
        },
        unselectCheckboxes: function(ids) {
            $(this.form).find(':checkbox').each(function() {
                if (jQuery.inArray(parseInt($(this).val()), ids) > -1) {
                    $(this).removeAttr('checked').change();
                }
            });
        },
        projectSelectAction: function() {
            var b = this.form.valid();
            if (!this.form.valid()) {
                return false;
            }
            var me = this;
            var selectedList = this.getSelected();
            var userListContainer = $(this.options.userListContainer);
            var selectedInitials = "";
            
            var overheads = {};
            
            userListContainer.empty();
            
            $.each(selectedList, function() {
                selectedInitials += me.data.users[this].initials + ", ";
                var selectedId = $('<input type="hidden"/>').appendTo(userListContainer);
                selectedId.attr('name','selectedUserIds').val(this);
                
                var assUser = $('<input type="hidden"/>').appendTo(userListContainer);
                assUser.attr('name','assignments[\'' + this + '\'].user.id').val(this);
                
                var assDelta = me.form.find('#delta_user_' + this).val();
                var assD = $('<input type="hidden"/>').appendTo(userListContainer);
                assD.attr('name','assignments[\'' + this + '\'].deltaOverhead').val(assDelta);
                
                overheads[this] = assDelta;
            });
            
            if (selectedInitials.length > 0) {
                userListContainer.append(selectedInitials.substring(0, selectedInitials.length - 2));
            }
            else {
                userListContainer.append("(none)");
            }
            
            this.data.overheads = overheads;
            this.data.selectedList = this.getSelected();
            this.cache = this.data;
            
            this.destroy();
            return false;
        },
        bliSelectAction: function() {
            var me = this;
            var selectedList = this.getSelected();
            var userListContainer = $(this.options.userListContainer);
            var selectedInitials = "";
            
            userListContainer.empty();
            
            /* Add the hidden inputs to the form */            
            $.each(selectedList, function() {
                if (jQuery.inArray(parseInt(this), me.data.assignments) == -1) {
                    selectedInitials += '<span class="notAssignee">' + me.data.users[this].initials + '</span>, ';
                }
                else {
                    selectedInitials += '<span class="assignee">' + me.data.users[this].initials + '</span>, ';
                }
                
                var hidden = $('<input type="hidden"/>').appendTo(userListContainer);
                if (me.options.legacyMode) {
                    hidden.attr('name','userIds[' + this + ']').val(this);
                }
                else {
                    hidden.attr('name','userIds').val(this);
                }
            });
            if (selectedInitials.length > 0) {
                userListContainer.append(selectedInitials.substring(0, selectedInitials.length - 2));
            }
            else {
                userListContainer.append("(none)");
            }
            
            this.data.selectedList = this.getSelected();
            this.cache = this.data;
            
            this.destroy();
            return false;
        },
        cancelAction: function() {
            this.destroy();
            return false;
        }
    };
    
    jQuery.fn.extend({
        userChooser: function(opt) {
            var uc = new UserChooser(opt);
            $(this).click(function() { uc.init(); return false; })
            return this;
        }
    });
})(jQuery);