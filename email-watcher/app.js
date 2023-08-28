import "dotenv/config";
import axios from "axios";
import mysql from "mysql2";

const { API_ENDPOINT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

const emailer = axios.create({
    baseURL: API_ENDPOINT,
});

const db = mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
});

db.connect();

async function SendDocDenial(email, userName, fileName, reason) {
    const payload = {
        email,
        userName,
        fileName,
        reason,
    };
    console.log("\tSend doc denial:", payload);
    let result = false;
    let response = null;
    try {
        response = await emailer.post("/docs/denied", payload);
        console.log("\t✅ Email sent");
        result = true;
    } catch (error) {
        console.log("\t❌ Error while sending doc denial:", payload);
    }
    return [result, response.data];
}

async function SendApplicationApproval(email, userName) {
    const payload = {
        email,
        userName,
    };
    console.log("\tSend application approval:", payload);
    let result = false;
    let response = null;
    try {
        response = await emailer.post("/application/approved", payload);
        console.log("\t✅ Email sent");
        result = true;
    } catch (error) {
        console.log("\t❌ Error while sending application approval:", payload);
    }
    return [result, response.data];
}

function GetPendingEmails() {
    return new Promise((resolve, reject) => {
        db.query("SELECT id, category, recipient, username, filename, reason FROM email WHERE email_sent = FALSE", (err, results, fields) => {
            if (err) reject(err);
            resolve(results);
        });
    });
}

function UpdateEmailStatus(id, email_sent, last_response) {
    return new Promise((resolve, reject) => {
        db.query("UPDATE email SET email_sent = ?, last_response = ? WHERE id = ?", [email_sent, last_response, id], (err, results, fields) => {
            if (err) reject(err);
            console.log("\tStatus updated");
            resolve(results);
        });
    });
}

async function SendEmails() {
    const pending = await GetPendingEmails();
    console.log("Pending emails:", pending.length);
    for (let email of pending) {
        console.log("🔰Sending email:", email.id);
        try {
            let response = "Not sent";
            switch (email.category) {
                case "doc_denial":
                    response = await SendDocDenial(email.recipient, email.username, email.filename, email.reason);
                    break;
                case "application_approval":
                    response = await SendApplicationApproval(email.recipient, email.username);
                    break;
                default:
                    break;
            }
            await UpdateEmailStatus(email.id, response[0], JSON.stringify(response[1]));
            console.log("\tResponse:", response);
        } catch (error) {
            console.log("\t❌ Error while sending email:", email.id, error);
        }
        console.log("🛑 Finished sending email:", email.id);
    };
}

await SendEmails();

db.end();