import bcrypt from "bcryptjs";
import { z } from "zod";
import { dbState } from "../config/db.js";
import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

const authSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email(),
  password: z.string().min(8)
});

function userResponse(user) {
  return {
    id: user._id?.toString?.() || user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    provider: user.provider || "local",
    avatarUrl: user.avatarUrl || null
  };
}

function roleForEmail(email) {
  return env.adminEmail && email.toLowerCase() === env.adminEmail ? "admin" : "user";
}

export async function signup(req, res) {
  if (!dbState.connected) throw new AppError("Accounts need MongoDB. Guest tools are still available.", 503);
  const data = authSchema.extend({ name: z.string().min(2).max(80) }).parse(req.body);
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError("An account with this email already exists", 409);
  const password = await bcrypt.hash(data.password, 12);
  const user = await User.create({ name: data.name, email: data.email, password, role: roleForEmail(data.email) });
  res.status(201).json({ user: userResponse(user), token: signToken(user) });
}

export async function login(req, res) {
  if (!dbState.connected) throw new AppError("Accounts need MongoDB. Guest tools are still available.", 503);
  const data = authSchema.omit({ name: true }).parse(req.body);
  const user = await User.findOne({ email: data.email });
  if (!user || !user.password || !(await bcrypt.compare(data.password, user.password))) {
    throw new AppError("Invalid email or password", 401);
  }
  const expectedRole = roleForEmail(user.email);
  if (expectedRole === "admin" && user.role !== "admin") {
    user.role = "admin";
  }
  user.lastLoginAt = new Date();
  await user.save();
  res.json({ user: userResponse(user), token: signToken(user) });
}

export async function me(req, res) {
  res.json({ user: userResponse(req.user) });
}

export async function getConfig(req, res) {
  res.json({
    googleClientId: env.googleClientId || "",
    githubClientId: env.githubClientId || ""
  });
}

export async function socialLogin(req, res) {
  if (!dbState.connected) throw new AppError("Accounts need MongoDB. Guest tools are still available.", 503);
  
  const { code, provider } = req.body;
  if (!code || !provider) {
    throw new AppError("Authorization code and provider are required", 400);
  }

  let providerId = "";
  let email = "";
  let name = "";
  let avatarUrl = "";

  if (provider === "google") {
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const params = {
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${env.clientUrl}/auth/callback`
    };

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange failed:", errText);
      throw new AppError("Failed to authenticate with Google", 400);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      throw new AppError("Failed to fetch user info from Google", 400);
    }

    const googleUser = await userRes.json();
    providerId = googleUser.sub;
    email = googleUser.email;
    name = googleUser.name;
    avatarUrl = googleUser.picture;

  } else if (provider === "github") {
    const tokenUrl = "https://github.com/login/oauth/access_token";
    const params = {
      client_id: env.githubClientId,
      client_secret: env.githubClientSecret,
      code,
      redirect_uri: `${env.clientUrl}/auth/callback`
    };

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(params)
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("GitHub token exchange failed:", errText);
      throw new AppError("Failed to authenticate with GitHub", 400);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new AppError(tokenData.error_description || "Failed to obtain GitHub access token", 400);
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        "User-Agent": "ConviLarge-Server"
      }
    });

    if (!userRes.ok) {
      throw new AppError("Failed to fetch user profile from GitHub", 400);
    }

    const githubUser = await userRes.json();
    providerId = githubUser.id?.toString();
    email = githubUser.email;
    name = githubUser.name || githubUser.login;
    avatarUrl = githubUser.avatar_url;

    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${accessToken}`,
          "User-Agent": "ConviLarge-Server"
        }
      });
      if (emailsRes.ok) {
        const emails = await emailsRes.json();
        const primaryEmail = emails.find(e => e.primary && e.verified) || emails[0];
        if (primaryEmail) {
          email = primaryEmail.email;
        }
      }
    }

    if (!email) {
      throw new AppError("Could not retrieve email address from GitHub profile", 400);
    }
  } else {
    throw new AppError("Unsupported authentication provider", 400);
  }

  let user = null;
  if (provider === "google") {
    user = await User.findOne({ googleId: providerId });
  } else if (provider === "github") {
    user = await User.findOne({ githubId: providerId });
  }

  if (user) {
    user.lastLoginAt = new Date();
    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
    }
    await user.save();
  } else {
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      if (provider === "google") {
        user.googleId = providerId;
      } else if (provider === "github") {
        user.githubId = providerId;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        provider,
        googleId: provider === "google" ? providerId : undefined,
        githubId: provider === "github" ? providerId : undefined,
        avatarUrl,
        role: roleForEmail(email),
        lastLoginAt: new Date()
      });
    }
  }

  res.json({ user: userResponse(user), token: signToken(user) });
}
