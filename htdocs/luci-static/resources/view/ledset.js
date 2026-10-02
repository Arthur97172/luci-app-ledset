'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';

/*
 * Restart the ledset init script through ubus so that the LED state changes
 * immediately, without the user having to reboot the device.
 *
 * The matching ACL grant is  write > ubus > rc > [ "init" ]  and lives in
 * root/usr/share/rpcd/acl.d/luci-app-ledset.json.
 */
var callRcInit = rpc.declare({
	object: 'rc',
	method: 'init',
	params: [ 'name', 'action' ]
});

return view.extend({
	load: function() {
		return uci.load('ledset');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('ledset', _('LED Control'),
			_('Turn all system LEDs on or off with a single switch.'));

		s = m.section(form.NamedSection, 'global', 'ledset', _('Global Settings'));
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enable', _('Enable LEDs'),
			_('Controls the status of LEDs. Settings take effect immediately and will persist after a reboot (ON or OFF).'));
		o.default = '1';
		o.rmempty = false;

		return m.render();
	},

	handleSaveApply: function(ev, mode) {
		return this.handleSave(ev).then(function() {
			/*
			 * Commit the staged UCI change first, so that the init script
			 * restarted below already reads the new "enable" value.
			 */
			return uci.apply();
		}).then(function() {
			return callRcInit('ledset', 'restart');
		}).then(function() {
			ui.addNotification(null, E('p', _('LED settings have been applied.')), 'info');

			window.setTimeout(function() {
				window.location.reload();
			}, 1000);
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Failed to apply the LED settings: %s').format(err)), 'error');
		});
	}
});
