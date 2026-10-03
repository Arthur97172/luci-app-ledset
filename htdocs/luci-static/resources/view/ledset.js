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
			/*
			 * Reload so the form shows the committed state. Deliberately no
			 * success notification: the reload replaces the page a moment
			 * later, so a toast would only flash past. The error branch below
			 * keeps its notification, because on failure nothing reloads and
			 * the user would otherwise see no sign that anything went wrong.
			 */
			window.location.reload();
		}).catch(function(err) {
			ui.addNotification(null, E('p', _('Failed to apply the LED settings: %s').format(err)), 'error');
		});
	}
});
