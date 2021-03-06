import Ember from 'ember';
import NotificationMessage from '../objects/notification-message';
import configuration from '../configuration';

export default Ember.Service.extend({

	messages: Ember.A([]),

	_getPropertyOrDefault(options, propertyName) {
		//first try to obtain property value from per-message definition
		let value = options[propertyName];

		//if not available, use global (default) settings
		if (Ember.isNone(value)) {
			value = configuration.getDefaultSettingForProperty(options.type, propertyName);
		}

		return value;
	},

	addMessage(options) {

		//first make sure, message has "some" type
		options.type = options.type || 'info';

		let timeout = this._getPropertyOrDefault(options, 'timeout');
		let sticky = this._getPropertyOrDefault(options, 'sticky');
		if (timeout < 0) {
			sticky = true;
		}

		let messageObject = NotificationMessage.create({
			message: options.message,
			type: options.type,
			timeout: timeout,
			sticky,
			onClick: options.onClick || function() {},
			onClose: options.onClose || function() {},
			htmlContent: options.htmlContent,
			onCloseTimeout: options.onCloseTimeout || function() {},
			closeOnClick: options.closeOnClick,
			icon: options.icon,
			id: options.id
		});

		this.get('messages').addObject(messageObject);

		if (!this.get('message.sticky')) {
			this.startMessageTimer(messageObject);
		}

    return messageObject;
	},

	error(message, options) {
		options = options || {};
		options.type = 'error';
		options.message = message;
		this.addMessage(options);
	},

	info(message, options) {
		options = options || {};
		options.message = message;
		options.type = 'info';
		this.addMessage(options);
	},

	success(message, options) {
		options = options || {};
		options.message = message;
		options.type = 'success';
		this.addMessage(options);
	},

	removeMessageFromList(message) {
		this.get('messages').removeObject(message);
	},

	removeMessage(message) {
		message.set('removeMe', true);
		Ember.run.cancel(message.get('closeTimer'));
	},

	removeMessageById(messageId) {
		let message = this.get('messages').find((msg) => {
			return msg.get('id') === messageId;
		});

		if (Ember.isPresent(message)) {
			this.removeMessage(message);
		}
	},

	removeAll(exceptIdsArray) {
		this.get('messages').forEach((msg) => {
			if (Ember.isNone(exceptIdsArray) || !exceptIdsArray.includes(msg.id)) {
				this.removeMessage(msg);
			}
		});
	},

	startMessageTimer(message) {
		if (message.get('sticky')) {
			return;
		}
		message.set('startTimeoutTime', Date.now());

		let timer = Ember.run.later(this, () => {
			this.removeMessage(message);

			let onCloseTimeout = message.get('onCloseTimeout');
			onCloseTimeout(message);
		}, message.get('timeout'));

		message.set('closeTimer', timer);
	},

	pauseMessageTimeout(message) {
		if (message.get('sticky')) {
			return;
		}

		Ember.run.cancel(message.get('closeTimer'));

		let remainingTimeout = message.get('timeout') - (Date.now() - message.get('startTimeoutTime'));
		message.set('timeout', remainingTimeout);
	}



});
