const Notification = require('../db/models/notification');

const { generateDate, generateTime } = require('./timeDate');

exports.insertNotificaton = (type, client, timestamp, event) => {
  const newNot = {
    type: type,
    read: false,

    client: client ? client : null,
    client_id: client ? client._id : null,

    event_info: event ? event : null,

    message: this.notificationMessages[type],

    date: generateDate(),
    time: generateTime(),
    timestamp
  };

  return Notification.insertMany(newNot);
}

exports.notificationMessages = {
  EVENT_REMINDER: 'notMessages.eventReminder',
  REQUEST_SENT: 'notMessages.requestSent',
  ACCEPTED_INVITATION: 'notMessages.acceptedInvitation',
  SELECTED_IMAGES: 'notMessages.selectedImages'
}