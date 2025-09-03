import { MESSAGE_QUEUE } from "@repo/common";
import { redis } from "@repo/shared-redis";
import "dotenv/config";
import nodemailer from "nodemailer";

interface EmailData {
  to: string;
  message: {
    subject: string;
    html: string;
  };
}

async function main() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  while (1) {
    const res = await redis.brPop(MESSAGE_QUEUE, 0);

    const data: EmailData = JSON.parse(res?.element || "{}");

    console.log("Received Data", data);

    try {
      const info = await transporter.sendMail({
        from: `"Exness Simulator" <${process.env.EMAIL}>`,
        to: data.to,
        subject: data.message.subject,
        html: data.message.html,
      });
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
}

main();
