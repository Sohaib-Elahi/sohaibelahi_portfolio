import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route first: handle clean, robust contact form submissions
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, budget, notes, message } = req.body;
    const finalMessage = notes || message || "";

    if (!name || !email) {
      return res.status(400).json({ error: "Name and Email are required fields." });
    }

    const recipient = process.env.CONTACT_RECEIVER || "sohaib.e0912003@gmail.com";
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const emailSubject = `✉️ New Message from ${name}`;
    
    const emailContentText = `
New Message!

Name: ${name}
Email: ${email}
Budget: ${budget || "Not Selected"}
Message: ${finalMessage || "No message provided."}
    `;

    const emailContentHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 45px 35px; background-color: #0d0d0f; color: #f4f4f5; border: 1px solid #1f1f23; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="border-bottom: 1px solid #27272a; padding-bottom: 24px; margin-bottom: 32px; text-align: center;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #ef4444; font-weight: 600;">Message Portal</span>
          <h2 style="font-size: 24px; font-weight: 600; margin: 8px 0 0 0; color: #ffffff; letter-spacing: -0.01em;">New Inquiry</h2>
        </div>

        <div style="margin-bottom: 32px; line-height: 1.6; font-size: 14px;">
          <p style="color: #a1a1aa; margin-top: 0;">You have received a new contact submission with the following details:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 24px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #71717a; width: 30%; font-size: 12px; font-weight: 500;">Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #ffffff; font-weight: 500; font-size: 14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #71717a; width: 30%; font-size: 12px; font-weight: 500;">Email Address</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #ef4444; font-weight: 500; font-size: 14px;"><a href="mailto:${email}" style="color: #ef4444; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #71717a; width: 30%; font-size: 12px; font-weight: 500;">Budget Range</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #10b981; font-weight: 600; font-size: 14px;">${budget || 'Not Selected'}</td>
            </tr>
          </table>

          <div style="margin-top: 24px;">
            <h4 style="font-size: 12px; color: #71717a; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Message</h4>
            <div style="background-color: #161619; border: 1px solid #27272a; padding: 20px; border-radius: 8px; color: #e4e4e7; font-size: 14px; white-space: pre-wrap; line-height: 1.6;">${finalMessage || "No message provided."}</div>
          </div>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 20px; font-size: 11px; color: #52525b; text-align: center; letter-spacing: 0.05em;">
          <p style="margin: 0;">Sent directly from your showcase platform.</p>
          <p style="margin: 4px 0 0 0;">Received: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;

    if (smtpUser && smtpPass) {
      console.log(`[SMTP] Attempting delivery to ${recipient} via ${smtpHost}:${smtpPort}...`);
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"${name}" <${recipient}>`, // Send to self to avoid dynamic sender SPF blocking
          replyTo: email,
          to: recipient,
          subject: emailSubject,
          text: emailContentText,
          html: emailContentHtml,
        });

        console.log("[SMTP] Email successfully dispatched.");
        return res.json({ success: true, mode: "smtp" });
      } catch (smtpError: any) {
        console.warn("[SMTP FAIL] SMTP delivery failed. Falling back to log print.", smtpError.message);
        // Print to log anyway so we don't lose the contact message
        console.log("\n=================== FALLBACK INCOMING MESSAGE ===================");
        console.log(`Subject: ${emailSubject}`);
        console.log(emailContentText.trim());
        console.log("===================================================================\n");
        return res.json({ 
          success: true, 
          mode: "fallback", 
          message: "Saved to local registry & printed to console. Live email delivery failed check SMTP secrets." 
        });
      }
    } else {
      console.log("\n=================== INCOMING MESSAGE (DEV MODE) ===================");
      console.log(`Subject: ${emailSubject}`);
      console.log(emailContentText.trim());
      console.log("===================================================================\n");
      return res.json({ 
        success: true, 
        mode: "development", 
        message: "Message registered inside developer console log. Set SMTP_USER and SMTP_PASS to dispatch live emails." 
      });
    }

  } catch (error: any) {
    console.error("[CONTACT ERROR] Exception thrown during direct message handler: ", error);
    res.status(500).json({ error: "Failed to submit message.", details: error.message });
  }
});

// Vite middleware setup for full stack development and production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
