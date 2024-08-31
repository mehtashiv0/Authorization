import dotenv from "dotenv";
dotenv.config();

export const config = {
  activeEnv: process.env.NODE_ENV,
  emailFrom: "mehtashiv223@gmail.com",
  smtpOptions: {
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: "mehtashiv223@gmail.com",
      pass: process.env.SMTP_PASS,
    },
  },
};
