const FeConfiguration = require('../db/models/feConfiguration');

const nodemailer = require('nodemailer');

const subjects = {
  REQUEST: 'Пристигнато е ново барање за контакт!',
};

generateEmailSettings = async(configuration, template, subject) => {
  let settings = {
    transporter: null,
    mailOptions: null
  };

  settings.transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  settings.mailOptions = {
    from: {
      name: configuration.invite_from,
      email: process.env.EMAIL
    },
    subject: subject,
    html: template
  };

  return settings;
}

exports.requestNotification = async(data, request) => {
  let protocol = null;
  if (request.headers.host.includes('localhost')) {
    protocol = 'http';
  } else {
    protocol = 'https';
  }

  const configuration = await FeConfiguration.find();

  const template = `
    <body style="margin: 0px;">
      <div style="max-width: 650px; width: 100%; background-color: #ffffff; padding: 50px; font-family: Open Sans, sans-serif; color: #25476a; font-size: 24px; overflow: hidden;">
        <div>
          <img 
            style="width: 120px; height: auto;"
            src="${ protocol }://${ request.headers.host }/images/${ configuration[0].logo }">
        </div>
    
        <div style="position: relative; z-index: 2;">
          <p style="line-height: 91%; margin-top: 50px; margin-bottom: 45px;">
            Здраво
          </p>

          <p style="max-width: 300px; line-height: 100%; margin-bottom: 13px;">
            Пристигна ново барање од:
          </p>
          <div style="line-height: 130%; margin-bottom: 70px;">
            <p>
              <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">име:</span>
              <span style="font-weight: bold; color: #25476a;">${ data.firstname }</span>
            </p>
            <p>
              <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">презиме:</span>
              <span style="font-weight: bold;">${ data.lastname }</span>
            </p>
            <p> 
              <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">телефонски број:</span>
              <span style="font-weight: bold;">${ data.phone_number }</span>
            </p>
            <p> 
              <span style="font-size: 24px; opacity: 0.7; margin-right: 11px;">емаил:</span>
              <span style="font-weight: bold;">${ data.email }</span>
            </p>
          </div>

          <p style="max-width: 372px; line-height: 100%;">
            ${ configuration[0].invite_login_message }
          </p>
          <a style="background-color: #25476a; width: 197px; height: 44px; border-radius: 10px; box-shadow: 2px 2px 7px -1px rgba(68, 68, 68, 0.3); padding: 0; color: #ffffff; text-decoration: none; line-height: 30px; font-weight: 600; font-size: 20px; margin-top: 23px; transition: 0.3s ease-in-out; padding: 10px 60px;" 
            href="${ request.headers.origin }"> Најава </a>
          <p style="font-weight: 600; line-height: 91%; font-size: 15px; margin-top: 75px; margin-bottom: 30px;">
            ${ configuration[0].invite_thank_you_message }</p>
        </div>
        <div style="width: 100%; z-index: 2;">
          <div style="float: left; display: inline-block; clear: both;">
            <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
              onMouseOver="this.style.opacity='0.7'"
              onMouseOut="this.style.opacity='1'">
              <div style="font-size: 14px; margin-right: 15px;">
                <img src="${ protocol }://${ request.headers.host }/images/${ configuration[0].invite_phone_number_icon }">
              </div>
              <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;" 
                href="tel:${ configuration[0].phone_number }">${ configuration[0].phone_number }</a>
            </div>
    
            <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
              onMouseOver="this.style.opacity='0.7'"
              onMouseOut="this.style.opacity='1'">
              <div style="font-size: 14px; margin-right: 15px;">
                <img src="${ protocol }://${ request.headers.host }/images/${ configuration[0].invite_email_icon }">
              </div>
              <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;"
                href="mailto:${ configuration[0].email }">${ configuration[0].email }</a>
            </div>
    
            <div style="display: flex; align-items: center; margin-bottom: 4px; transition: 0.3s ease-in-out; cursor: pointer;"
              onMouseOver="this.style.opacity='0.7'"
              onMouseOut="this.style.opacity='1'">
              <div style="font-size: 14px; margin-right: 15px;">
                <img src="${ protocol }://${ request.headers.host }/images/${ configuration[0].invite_location_icon }">
              </div>
              <a style="font-size: 13px; color: #25476a; text-decoration: none; font-weight: 600; line-height: 18px;"
                href="#">${ configuration[0].address }</a>
            </div>
          </div>
    
          <div style="float: right; clear: both; display: inline-block;">
            <img    
              style="width: 120px;"
              src="${ protocol }://${ request.headers.host }/images/${ configuration[0].logo }">
          </div>
        </div>
      </div>
    </body>
  `;

  const settings = await generateEmailSettings(configuration[0], template, subjects.REQUEST);
  settings.mailOptions['to'] = configuration[0].emails_for_notifications.toString();
  settings.transporter.sendMail(settings.mailOptions);
};
