import nodemailer from "nodemailer";

interface MailOptions {
  email: string | string[];       
  subject: string;
  html?: string;
  message?: string;
}

export const sendMail = async (options: MailOptions): Promise<void> => {
  if (!options.email || (Array.isArray(options.email) && options.email.length === 0)) {
    console.error("No recipients defined");
    return;
  }

  const transport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const recipients = Array.isArray(options.email)
    ? options.email.join(", ")
    : options.email;

  const mailOptions = {
    from: "Bishal Timilsina <timilsina@gmail.com>",
    to: recipients,
    subject: options.subject,
    html: options.html,
    text: options.message,
  };

  await transport.sendMail(mailOptions);
};
