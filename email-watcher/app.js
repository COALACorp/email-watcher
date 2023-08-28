import "dotenv/config";
import axios from "axios";
import mysql from "mysql2";

const { API_ENDPOINT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env;

const email = axios.create({
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

db.query("SELECT * FROM email", (err, results, fields) => {
    if (err)
        throw err;
    
    console.log("Entries:", fields, "\n", results);
});