const nodemailer = require("nodemailer");

const parseBody = (body) => {
    if (!body) {
        return {};
    }

    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch {
            return {};
        }
    }

    return body;
};

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { name = "", email = "", message = "", pageName = "Website" } = parseBody(req.body);
    const trimmedName = String(name).trim();
    const trimmedEmail = String(email).trim();
    const trimmedMessage = String(message).trim();
    const trimmedPageName = String(pageName).trim() || "Website";

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ error: "Valid email is required" });
    }

    const {
        SMTP_HOST = "smtp.gmail.com",
        SMTP_PORT = "465",
        SMTP_SECURE = "true",
        SMTP_USER,
        SMTP_PASS,
        CONTACT_TO_EMAIL,
    } = process.env;

    if (!SMTP_USER || !SMTP_PASS) {
        return res.status(500).json({ error: "Mail service is not configured" });
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === "true",
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: SMTP_USER,
            to: CONTACT_TO_EMAIL || SMTP_USER,
            replyTo: trimmedEmail,
            subject: `Website enquiry from ${trimmedPageName}`,
            text: [
                `Page: ${trimmedPageName}`,
                `Name: ${trimmedName || "Not provided"}`,
                `Email: ${trimmedEmail}`,
                "",
                "Message:",
                trimmedMessage || "No message provided",
            ].join("\n"),
        });

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("Contact form email failed:", error);
        return res.status(500).json({ error: "Unable to send message" });
    }
};
