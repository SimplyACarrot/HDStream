import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "noreply@hdstream.app";

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return {
    sendMail: async (opts: { to: string; subject: string; text: string; html?: string }) => {
      console.log("--- EMAIL (dev mode) ---");
      console.log("To:", opts.to);
      console.log("Subject:", opts.subject);
      console.log("Body:", opts.text);
      console.log("--- END EMAIL ---");
      return { messageId: "dev-" + Date.now() };
    },
  } as unknown as nodemailer.Transporter;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || "noreply@hdstream.app";
  return transporter.sendMail({ from, to, subject, text, html });
}

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
