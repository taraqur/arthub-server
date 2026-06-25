import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dotenv from 'dotenv';
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.MONGODB_URI.split('/').pop().split('?')[0] || 'arthub';
const db = client.db(dbName);

export const auth = betterAuth({
    database: mongodbAdapter(db, {
        client,
    }),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
        }
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "buyer"
            }
        }
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7 // 7 days
    },
    baseURL: process.env.BETTER_AUTH_URL || "https://arthub-backend-v2.vercel.app",
    trustedOrigins: [
        process.env.CLIENT_URL,
        "https://arthub-client-iota.vercel.app",
        "http://localhost:3000"
    ].filter(Boolean),
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true
        }
    }
});
