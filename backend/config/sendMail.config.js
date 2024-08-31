import nodemailer from "nodemailer";
import { config } from "../config/config.js"; // Corrected import

export async function sendEmail({
  to,
  subject,
  html,
  from = config.emailFrom,
  attachments,
}) {
  const transporter = nodemailer.createTransport(config.smtpOptions);
  return await transporter.sendMail({ from, to, subject, html, attachments });
}

export async function configUser(user) {
  let { email, mailPassword, mailService, mailHost, mailPort } = user;
  console.log({ email, mailPassword, mailService, mailHost, mailPort });
  const transporter = nodemailer.createTransport({
    service: mailService,
    host: mailHost,
    port: mailPort,
    secure: false,
    auth: {
      user: email,
      pass: mailPassword,
    },
  });
  return transporter;
}
