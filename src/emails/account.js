const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'cerusso9@gmail.com',
    subject: 'Welcome to the Task Application!',
    text: `Hi, ${name}! Welcome to the application.`,
  })
}

const sendCancellationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: 'cerusso9@gmail.com',
    subject: 'Sorry to see you go!',
    text: `Hi, ${name}! We noticed that you deleted your account. Is there any feedback you would like to give us?`
  })
}


module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
}
