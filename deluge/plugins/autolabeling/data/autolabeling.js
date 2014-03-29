/*
Script: autolabelling.js
    The client-side javascript code for the AutoLabelling plugin.

Copyright:
    (C) Kemy 2014 <kemyyy@gmail.com>
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3, or (at your option)
    any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, write to:
        The Free Software Foundation, Inc.,
        51 Franklin Street, Fifth Floor
        Boston, MA  02110-1301, USA.

    In addition, as a special exception, the copyright holders give
    permission to link the code of portions of this program with the OpenSSL
    library.
    You must obey the GNU General Public License in all respects for all of
    the code used other than OpenSSL. If you modify file(s) with this
    exception, you may extend this exception to your version of the file(s),
    but you are not obligated to do so. If you do not wish to do so, delete
    this exception statement from your version. If you delete this exception
    statement from all source files in the program, then also delete it here.
*/

Ext.ns('Deluge.ux');

Ext.ns('Deluge.ux.preferences');

Deluge.ux.AddRuleWindow = Ext.extend(Ext.Window, {
	
	label: 'Add rule',
	layout: 'fit',
	width: 400,
	height: 130,
	closeAction: 'hide',

	initComponent: function() {
		Deluge.ux.ExecuteWindowBase.superclass.initComponent.call(this);
		this.addButton(_('Cancel'), this.onCancelClick, this);
		this.addButton(_('Add'), this.onAddClick, this);		

		this.addEvents({
			'ruleadd': true
		});

		this.cbLabels = new Ext.form.ComboBox({
				xtype: 'combo',
				width: 270,
				fieldLabel: _('Event'),
				store: new Ext.data.SimpleStore({
				fields: [
					{name: 'label', mapping: 0}
					],
				id: 0}),
				name: 'label',
				mode: 'local',
				editable: false,
				triggerAction: 'all',
				valueField:    'label',
				displayField:  'label'
			});

		this.form = this.add({
			xtype: 'form',
			baseCls: 'x-plain',
			bodyStyle: 'padding: 5px',
			items: [this.cbLabels, 
			{
				xtype: 'textfield',
				fieldLabel: _('Regex'),
				name: 'regex',
				width: 270
			}]
		});

		 deluge.client.label.get_labels({
			success: function(labels) {
				var storeList = new Array();
				var length = labels.length;
				for(var i = 0; i < length; i++)
				{
					var label = labels[i];
					storeList[i] = [label];
				}
				this.cbLabels.getStore().loadData(storeList);
			},
			scope: this
		});
	},

	show: function(parent) {
		Deluge.ux.AddRuleWindow.superclass.show.call(this);
		this.parent = parent;
	},

	onAddClick: function() {
		var label = this.cbLabels.getValue();
		var regex = this.form.getForm().getFieldValues().regex;
		var rule = {"enabled":true, "label_id":label, "regex":regex};
		deluge.client.autolabeling.add(rule);
		this.fireEvent('ruleadd', this, label, regex);
		this.hide();
	},

	onCancelClick: function() {
		this.hide();
	}
});

Deluge.ux.preferences.AutoLabelingPage = Ext.extend(Ext.Panel, {

	title: _('AutoLabeling'),
	layout: 'fit',
	border: false,
	    
	initComponent: function() {
	    	Deluge.ux.preferences.AutoLabelingPage.superclass.initComponent.call(this);

		this.list = new Ext.list.ListView({
			store: new Ext.data.JsonStore({
			        autoLoad: false,
			        root: "ruleJSON.ruleArray",
				fields: [
					{name: 'enabled', mapping: 'enabled'},
					{name: 'regex', mapping: 'regex'},
					{name: 'label', mapping: 'label'}
				],
				id: 0
			}),
			columns: [{
				width: .3,
				id: 'enabled',
				header: _('Enabled'),
				sortable: false,
				dataIndex: 'enabled',
				tpl: new Ext.XTemplate('{enabled:this.getCheckbox}', {
                    				getCheckbox: function(v) {
				                        return '<div class="x-grid3-check-col'+(v?'-on':'')+'" rel="chkbox"> </div>';
                    					}
				})
				
			}, {
				id: 'regex',
				header: _('Regex'),
				sortable: false,
				dataIndex: 'regex'
			}, {
				id: 'label',
				header: _('Label'),
				sortable: false,
				dataIndex: 'label'
			}],
			singleSelect: true,
			autoExpandColumn: 'regex'
		});

		this.panel = this.add({
			items: [this.list], 
			bbar: {
				items: [{
					text: _('Add'),
					iconCls: 'icon-add',
					handler: this.onAddClick,
					scope: this
				}, {
					text: _('Enable / disable'),
					iconCls: 'icon-resume',
					handler: this.onEditClick,
					scope: this
				}, {
					text: _('Remove'),
					iconCls: 'icon-remove',
					handler: this.onRemoveClick,
					scope: this
				}, '->'
				]
			}
		});

		deluge.preferences.on('show', this.onPreferencesShow, this);
	},

	onPreferencesShow: function() {
		this.updateRules();
	},

	updateRules: function() {
	    deluge.client.autolabeling.get_rules({
			success: function(rules) {
				this.label_regex_list = rules;
				var storeList = new Array();
				var length = rules.length;
				for(var i = 0; i < length; i++)
				{
					var rule_dict = rules[i];
					var ruleProps = {'enabled':rule_dict['enabled'], 'regex':rule_dict['regex'], 'label':rule_dict['label_id']};
					storeList[i] = ruleProps;
				}

				var exampleData = {'ruleJSON' : {'ruleArray':storeList}};

				this.list.getStore().loadData(exampleData);
				var i = 0;
			},
			scope: this
		});
	},

	onOk: function(){
		this.saveRule();
	},

	onApply: function(){
		this.saveRule();
	},

	saveRule: function(){
		var config = {'label_regex_list':this.label_regex_list};
		deluge.client.autolabeling.set_config(config);
	},

	onAddClick: function() {
		if (!this.addWin) 
		{
			this.addWin = new Deluge.ux.AddRuleWindow();	
			this.addWin.on('ruleadd', function() {
				this.updateRules();
			}, this);		
		}
		this.addWin.show(this);
	},

	onEditClick: function() {
		var record = this.list.getSelectedRecords()[0];
		var rule = {'enabled':record.data.enabled, 'label_id':record.data.label, 'regex':record.data.regex};
		deluge.client.autolabeling.enabledisable(rule);
		this.updateRules();
	},

	onRemoveClick: function() {
		var record = this.list.getSelectedRecords()[0];
		var rule = {'enabled':record.data.enabled, 'label_id':record.data.label, 'regex':record.data.regex};
		deluge.client.autolabeling.remove(rule);
		this.updateRules();
	}
});

Deluge.plugins.AutoLabelingPlugin = Ext.extend(Deluge.Plugin, {
    
    name: 'AutoLabeling',

    onDisable: function() {
	deluge.preferences.removePage(this.prefsPage);
    },

    onEnable: function() {
	this.prefsPage = deluge.preferences.addPage(new Deluge.ux.preferences.AutoLabelingPage());
    }
});
Deluge.registerPlugin('AutoLabeling', Deluge.plugins.AutoLabelingPlugin);
