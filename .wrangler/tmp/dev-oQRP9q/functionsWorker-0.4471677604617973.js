var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// .wrangler/tmp/bundle-F82vzG/checked-fetch.js
var require_checked_fetch = __commonJS({
  ".wrangler/tmp/bundle-F82vzG/checked-fetch.js"() {
    "use strict";
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-F82vzG/middleware-loader.entry.ts
var import_checked_fetch31 = __toESM(require_checked_fetch());

// wrangler-modules-watch:wrangler:modules-watch
var import_checked_fetch = __toESM(require_checked_fetch());

// .wrangler/tmp/bundle-F82vzG/middleware-insertion-facade.js
var import_checked_fetch29 = __toESM(require_checked_fetch());

// .wrangler/tmp/pages-EkwiVo/functionsWorker-0.4471677604617973.mjs
var import_checked_fetch2 = __toESM(require_checked_fetch(), 1);
import crypto2 from "node:crypto";
import crypto3 from "node:crypto";
import crypto4 from "node:crypto";
var __create2 = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
var __getOwnPropNames2 = Object.getOwnPropertyNames;
var __getProtoOf2 = Object.getPrototypeOf;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __commonJS2 = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require() {
  return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require"), "__commonJS");
var __copyProps2 = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames2(from))
      if (!__hasOwnProp2.call(to, key) && key !== except)
        __defProp2(to, key, { get: /* @__PURE__ */ __name(() => from[key], "get"), enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM2 = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
  mod
)), "__toESM");
var require_checked_fetch2 = __commonJS2({
  "../.wrangler/tmp/bundle-2Hk26C/checked-fetch.js"() {
    "use strict";
    var urls = /* @__PURE__ */ new Set();
    function checkURL(request, init) {
      const url = request instanceof URL ? request : new URL(
        (typeof request === "string" ? new Request(request, init) : request).url
      );
      if (url.port && url.port !== "443" && url.protocol === "https:") {
        if (!urls.has(url.toString())) {
          urls.add(url.toString());
          console.warn(
            `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
          );
        }
      }
    }
    __name(checkURL, "checkURL");
    __name2(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});
var import_checked_fetch3 = __toESM2(require_checked_fetch2());
var onRequest = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (method === "POST") {
      const { matchId = "current" } = await request.json();
      if (user.role === "admin" || user.role === "super_admin") {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      let activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
      activeUsers = activeUsers.filter((u) => u.id !== user.id);
      activeUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        lastActive: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (activeUsers.length > 500) {
        activeUsers = activeUsers.slice(-500);
      }
      await env.SPORTS_KV.put(activeUsersKey, JSON.stringify(activeUsers), {
        expirationTtl: 3600
        // 1 hour - auto cleanup
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin users activity error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch22 = __toESM2(require_checked_fetch2());
var ADMIN_USERS = {
  admin: {
    id: "1",
    username: "admin",
    email: "admin@ipl2026.com",
    role: "super_admin",
    password: "admin123"
  },
  manager: {
    id: "2",
    username: "manager",
    email: "manager@ipl2026.com",
    role: "admin",
    password: "manager123"
  }
};
var verifyPassword = /* @__PURE__ */ __name2((password, salt, hashedPassword) => {
  const hash = crypto2.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex") === hashedPassword;
}, "verifyPassword");
function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
    // 7 days
  };
  return btoa(JSON.stringify(payload));
}
__name(generateToken, "generateToken");
__name2(generateToken, "generateToken");
var onRequest2 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders2
    });
  }
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      }
    );
  }
  try {
    const body = await request.json();
    const { username, password } = body;
    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: "Username and password are required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders2
          }
        }
      );
    }
    const hardcodedUser = ADMIN_USERS[username];
    if (hardcodedUser && hardcodedUser.password === password) {
      const token = generateToken(hardcodedUser);
      return new Response(
        JSON.stringify({
          success: true,
          token,
          user: {
            id: hardcodedUser.id,
            username: hardcodedUser.username,
            email: hardcodedUser.email,
            role: hardcodedUser.role
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders2
          }
        }
      );
    }
    if (env && env.SPORTS_KV) {
      const userData = await env.SPORTS_KV.get(`user:${username}`);
      if (userData) {
        const user = JSON.parse(userData);
        if (user.role === "admin" && verifyPassword(password, user.salt, user.hashedPassword)) {
          const token = user.token;
          return new Response(
            JSON.stringify({
              success: true,
              token,
              user: {
                id: user.id,
                username: user.email,
                email: user.email,
                role: user.role
              }
            }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders2
              }
            }
          );
        }
      }
    }
    return new Response(
      JSON.stringify({ error: "Invalid username or password" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      }
    );
  }
}, "onRequest");
var import_checked_fetch32 = __toESM2(require_checked_fetch2());
async function onRequest3(context) {
  const { request, env } = context;
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const data = await request.json();
    const { email, password, name, setupKey } = data;
    const validSetupKey = env.SETUP_KEY || "default-setup-key-change-me";
    if (setupKey !== validSetupKey) {
      return new Response(
        JSON.stringify({ message: "Invalid setup key. Setup may have already been completed." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ message: "Email, password, and name are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ message: "Password must be at least 8 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!/[A-Z]/.test(password)) {
      return new Response(
        JSON.stringify({ message: "Password must contain uppercase letter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({ message: "Password must contain number" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const existingUser = await env.SPORTS_KV.get(`user:${email}`);
    if (existingUser) {
      return new Response(
        JSON.stringify({ message: "Admin account already exists" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const salt = crypto3.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
    const encoder = new TextEncoder();
    const data_to_hash = encoder.encode(password + saltHex);
    const hashBuffer = await crypto3.subtle.digest("SHA-256", data_to_hash);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tokenBuffer = crypto3.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBuffer).map((b) => b.toString(16).padStart(2, "0")).join("");
    const adminUser = {
      id: userId,
      email,
      name,
      salt: saltHex,
      hashedPassword,
      token,
      role: "admin",
      isBlocked: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastLogin: null
    };
    await env.SPORTS_KV.put(
      `user:${email}`,
      JSON.stringify(adminUser),
      {
        expirationTtl: 365 * 24 * 60 * 60
        // 1 year
      }
    );
    await env.SPORTS_KV.put(
      `token:${token}`,
      JSON.stringify({
        userId: adminUser.id,
        email,
        role: "admin",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }),
      {
        expirationTtl: 7 * 24 * 60 * 60
        // 7 days
      }
    );
    return new Response(
      JSON.stringify({
        message: "Admin account created successfully",
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          token: adminUser.token
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({
        message: "Error creating admin account",
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
var import_checked_fetch4 = __toESM2(require_checked_fetch2());
var onRequest4 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (pathname === "/api/admin/users/activity" && method === "POST") {
      const { matchId = "current" } = await request.json();
      if (user.role === "admin" || user.role === "super_admin") {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      let activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
      activeUsers = activeUsers.filter((u) => u.id !== user.id);
      activeUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        lastActive: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (activeUsers.length > 500) {
        activeUsers = activeUsers.slice(-500);
      }
      await env.SPORTS_KV.put(activeUsersKey, JSON.stringify(activeUsers), {
        expirationTtl: 3600
        // 1 hour - auto cleanup
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (pathname === "/api/admin/users" && method === "GET") {
      const matchId = searchParams.get("matchId") || "current";
      const activeUsersKey = `active-users:${matchId}`;
      const activeUsersData = await env.SPORTS_KV.get(activeUsersKey);
      const activeUsers = activeUsersData ? JSON.parse(activeUsersData) : [];
      return new Response(JSON.stringify({ users: activeUsers }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (pathname === "/api/admin/users" && method === "PUT") {
      const { userId, isBlocked, reason } = await request.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
      const targetUser = JSON.parse(targetUserData);
      targetUser.isBlocked = isBlocked;
      if (reason) {
        targetUser.blockReason = reason;
        targetUser.blockedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      await env.SPORTS_KV.put(`user:${userEmail}`, JSON.stringify(targetUser), {
        expirationTtl: 31536e3
      });
      return new Response(
        JSON.stringify({ success: true, user: targetUser }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (pathname === "/api/admin/users" && method === "DELETE") {
      const { userId } = await request.json();
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "Missing userId" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const userEmail = await env.SPORTS_KV.get(`userId:${userId}`);
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const targetUserData = await env.SPORTS_KV.get(`user:${userEmail}`);
      const targetUser = JSON.parse(targetUserData);
      await env.SPORTS_KV.delete(`user:${userEmail}`);
      await env.SPORTS_KV.delete(`userId:${userId}`);
      if (targetUser.token) {
        await env.SPORTS_KV.delete(`token:${targetUser.token}`);
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Admin users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch5 = __toESM2(require_checked_fetch2());
var onRequest5 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env, params } = context;
  const { id } = params || {};
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  if (method !== "DELETE") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
  try {
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Message ID required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const url = new URL(request.url);
    const matchId = url.searchParams.get("matchId") || "current";
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (!env || !env.SPORTS_KV) {
      return new Response(
        JSON.stringify({ error: "KV not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
    if (!tokenValue) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    let email = tokenValue;
    if (tokenValue.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(tokenValue);
        if (parsed && typeof parsed.email === "string") {
          email = parsed.email;
        }
      } catch {
      }
    }
    const userData = await env.SPORTS_KV.get(`user:${email}`);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const user = JSON.parse(userData);
    if (user.role !== "admin" && user.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    const messagesKey = `messages:${matchId}`;
    const messagesData = await env.SPORTS_KV.get(messagesKey);
    let messages = messagesData ? JSON.parse(messagesData) : [];
    const beforeLength = messages.length;
    messages = messages.filter((m) => m.id !== id);
    if (messages.length === beforeLength) {
      return new Response(JSON.stringify({ success: true, deleted: false }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
      expirationTtl: 604800
      // 7 days
    });
    return new Response(JSON.stringify({ success: true, deleted: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders2 }
    });
  } catch (error) {
    console.error("Messages delete error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch6 = __toESM2(require_checked_fetch2());
async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const teamId = searchParams.get("teamId");
    if (teamId) {
      const coachingStaff = await context.env.IPL_CACHE.get(`coaches:${teamId}`, "json");
      return new Response(JSON.stringify(coachingStaff || null), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const allTeams = await context.env.IPL_CACHE.get("teams", "json") || [];
      const allCoaches = [];
      for (const team of allTeams) {
        const staff = await context.env.IPL_CACHE.get(`coaches:${team.id}`, "json");
        if (staff) {
          allCoaches.push(staff);
        }
      }
      return new Response(JSON.stringify(allCoaches), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch coaching staff" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function onRequestPost(context) {
  try {
    const authHeader = context.request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const userToken = await context.env.SPORTS_KV.get(`token:${token}`);
    if (!userToken) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    let tokenData;
    try {
      tokenData = JSON.parse(userToken);
    } catch {
      tokenData = { email: userToken, role: "admin" };
    }
    if (tokenData.role !== "admin" && tokenData.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const coachingStaff = await context.request.json();
    if (!coachingStaff.teamId) {
      return new Response(JSON.stringify({ error: "teamId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await context.env.IPL_CACHE.put(
      `coaches:${coachingStaff.teamId}`,
      JSON.stringify(coachingStaff)
    );
    try {
      await fetch(`${new URL(context.request.url).origin}/api/admin/users/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader
        },
        body: JSON.stringify({
          action: "update_coaching_staff",
          details: `Updated coaching staff for team ${coachingStaff.teamId}`
        })
      });
    } catch (err) {
      console.error("Failed to track activity:", err);
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Coaching staff updated successfully",
      data: coachingStaff
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating coaches:", error);
    return new Response(JSON.stringify({ error: "Failed to update coaching staff" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
var import_checked_fetch7 = __toESM2(require_checked_fetch2());
var encryptPassword = /* @__PURE__ */ __name2((password, salt) => {
  const hash = crypto4.createHash("sha256");
  hash.update(password + salt);
  return hash.digest("hex");
}, "encryptPassword");
var generateSalt = /* @__PURE__ */ __name2(() => crypto4.randomBytes(16).toString("hex"), "generateSalt");
var generateToken2 = /* @__PURE__ */ __name2(() => crypto4.randomBytes(32).toString("hex"), "generateToken");
var onRequest6 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders2 });
  }
  try {
    let action = searchParams.get("action") || "signin";
    let body = {};
    if (method === "POST" || method === "PUT") {
      try {
        body = await request.json();
        if (body.name && body.email && body.password) {
          action = "signup";
        } else if (body.email && body.password && !body.name) {
          action = "signin";
        }
      } catch (e) {
      }
    }
    if (action === "signup" && method === "POST") {
      const { email, password, name } = body;
      if (!email || !password || !name) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const existingUser = await env.SPORTS_KV.get(`user:${email}`);
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "User already exists" }),
          { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const salt = generateSalt();
      const hashedPassword = encryptPassword(password, salt);
      const userId = crypto4.randomUUID();
      const token = generateToken2();
      const createdAt = (/* @__PURE__ */ new Date()).toISOString();
      const userData = {
        id: userId,
        email,
        name,
        salt,
        hashedPassword,
        token,
        createdAt,
        isBlocked: false,
        role: "user"
      };
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(userData), {
        expirationTtl: 31536e3
      });
      await env.SPORTS_KV.put(`token:${token}`, email, {
        expirationTtl: 2592e3
        // 30 days
      });
      await env.SPORTS_KV.put(`userId:${userId}`, email, {
        expirationTtl: 31536e3
      });
      return new Response(
        JSON.stringify({
          success: true,
          userId,
          token,
          user: { id: userId, email, name }
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
            ...corsHeaders2
          }
        }
      );
    }
    if (action === "signin" && method === "POST") {
      const { email, password } = body;
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Missing email or password" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Your account has been blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const hashedPassword = encryptPassword(password, user.salt);
      if (hashedPassword !== user.hashedPassword) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const newToken = generateToken2();
      user.token = newToken;
      user.lastLogin = (/* @__PURE__ */ new Date()).toISOString();
      await env.SPORTS_KV.put(`user:${email}`, JSON.stringify(user), {
        expirationTtl: 31536e3
      });
      await env.SPORTS_KV.put(`token:${newToken}`, email, {
        expirationTtl: 2592e3
      });
      return new Response(
        JSON.stringify({
          success: true,
          userId: user.id,
          token: newToken,
          user: { id: user.id, email: user.email, name: user.name }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": `auth_token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
            ...corsHeaders2
          }
        }
      );
    }
    if (action === "verify" && method === "GET") {
      const token = searchParams.get("token");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "No token provided" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Account blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "user"
            // Include role field
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (action === "signout" && method === "POST") {
      const { token } = body;
      if (token) {
        await env.SPORTS_KV.delete(`token:${token}`);
      }
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": "auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
            ...corsHeaders2
          }
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch8 = __toESM2(require_checked_fetch2());
async function getBody(request) {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }
  try {
    return await request.json();
  } catch {
    return null;
  }
}
__name(getBody, "getBody");
__name2(getBody, "getBody");
var kv = globalThis.IPL_CACHE;
var KV_KEY = "ipl:content";
var onRequest7 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const kvNamespace = env.IPL_CACHE || kv;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders2
    });
  }
  try {
    if (request.method === "GET") {
      const url = new URL(request.url);
      const type = url.searchParams.get("type");
      const cached = await kvNamespace.get(KV_KEY);
      let content = cached ? JSON.parse(cached) : [];
      if (type) {
        content = content.filter((c) => c.type === type);
      }
      return new Response(JSON.stringify(content), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      });
    }
    if (request.method === "POST") {
      const body = await getBody(request);
      if (!body || !body.title || !body.type) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: title, type" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const newContent = {
        ...body,
        id: Date.now().toString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      content.push(newContent);
      await kvNamespace.put(KV_KEY, JSON.stringify(content));
      return new Response(
        JSON.stringify({
          message: "Content created successfully",
          content: newContent
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders2
          }
        }
      );
    }
    if (request.method === "PUT") {
      const body = await getBody(request);
      if (!body || !body.id) {
        return new Response(
          JSON.stringify({ error: "Content ID is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const updated = content.map(
        (c) => c.id === body.id ? { ...c, ...body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } : c
      );
      await kvNamespace.put(KV_KEY, JSON.stringify(updated));
      return new Response(
        JSON.stringify({
          message: "Content updated successfully",
          content: { ...body, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders2
          }
        }
      );
    }
    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Content ID is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders2
            }
          }
        );
      }
      const existing = await kvNamespace.get(KV_KEY);
      const content = existing ? JSON.parse(existing) : [];
      const updated = content.filter((c) => c.id !== id);
      await kvNamespace.put(KV_KEY, JSON.stringify(updated));
      return new Response(
        JSON.stringify({ message: "Content deleted successfully" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders2
          }
        }
      );
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders2
      }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders2
        }
      }
    );
  }
}, "onRequest");
var import_checked_fetch9 = __toESM2(require_checked_fetch2());
async function onRequest8(context) {
  const { request } = context;
  try {
    let teamName = "";
    if (request.method === "POST") {
      const body = await request.json();
      teamName = body.teamName || "";
    } else {
      const url = new URL(request.url);
      teamName = url.searchParams.get("teamName") || "";
    }
    if (!teamName) {
      return new Response(JSON.stringify({ error: "teamName required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const title = encodeURIComponent(teamName.replace(/\s+\(.+\)$/, "").trim());
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
    try {
      const wikiResp = await fetch(wikiUrl, { cf: { cacheTtl: 3600 } });
      if (wikiResp.ok) {
        const data = await wikiResp.json();
        if (data && data.extract) {
          const enhanced = data.extract.split("\n").slice(0, 3).join(" ");
          return new Response(JSON.stringify({ enhanced, source: "wikipedia", url: data.content_urls?.desktop?.page || wikiUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
      }
    } catch (err) {
      console.error("Wikipedia fetch failed", err);
    }
    const heuristic = teamName + " is a professional cricket franchise competing in the Indian Premier League. Known for its passionate fanbase and competitive performances.";
    return new Response(JSON.stringify({ enhanced: heuristic, source: "heuristic" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("enrichDescription error", error);
    return new Response(JSON.stringify({ error: "internal error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequest8, "onRequest8");
__name2(onRequest8, "onRequest");
var import_checked_fetch10 = __toESM2(require_checked_fetch2());
var onRequest9 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || url.searchParams.get("slug") || "legal";
  const key = `legal-page:${page}`;
  try {
    if (method === "GET") {
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: "KV not configured", content: null }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const stored = await env.SPORTS_KV.get(key, "json");
      return new Response(
        JSON.stringify({ page, content: stored?.content || null, updatedAt: stored?.updatedAt || null }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    if (method === "PUT") {
      if (!env || !env.SPORTS_KV) {
        return new Response(
          JSON.stringify({ error: "KV not configured" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const body = await request.json();
      const content = typeof body.content === "string" ? body.content : "";
      const record = {
        page,
        content,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await env.SPORTS_KV.put(key, JSON.stringify(record));
      return new Response(
        JSON.stringify({ success: true, page, content: record.content, updatedAt: record.updatedAt }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Legal API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch11 = __toESM2(require_checked_fetch2());
var onRequest10 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const method = request.method;
  try {
    if (method === "GET") {
      const matchId = searchParams.get("matchId") || "current";
      const liveScore = await env.SPORTS_KV.get(`live:${matchId}`);
      if (!liveScore) {
        return new Response(
          JSON.stringify({
            matchId,
            team1: { name: "RCB", runs: 0, wickets: 0, overs: 0 },
            team2: { name: "CSK", runs: 0, wickets: 0, overs: 0 },
            currentBatter: { name: "", runs: 0, balls: 0 },
            currentBowler: { name: "", runs: 0, balls: 0 },
            commentary: [],
            status: "Not Started",
            lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify(JSON.parse(liveScore)), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (method === "POST") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
      const { matchId = "current", scoreUpdate } = await request.json();
      let liveScore = JSON.parse(
        await env.SPORTS_KV.get(`live:${matchId}`) || JSON.stringify({
          matchId,
          team1: { name: "RCB", runs: 0, wickets: 0, overs: 0 },
          team2: { name: "CSK", runs: 0, wickets: 0, overs: 0 },
          currentBatter: { name: "", runs: 0, balls: 0 },
          currentBowler: { name: "", runs: 0, balls: 0 },
          commentary: [],
          status: "Live",
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        })
      );
      liveScore = { ...liveScore, ...scoreUpdate, lastUpdated: (/* @__PURE__ */ new Date()).toISOString() };
      await env.SPORTS_KV.put(`live:${matchId}`, JSON.stringify(liveScore), {
        expirationTtl: 604800
        // 7 days
      });
      return new Response(JSON.stringify({ success: true, liveScore }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Live score error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}, "onRequest");
var import_checked_fetch12 = __toESM2(require_checked_fetch2());
var mockTeams = [
  {
    id: "1",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "/logos/rcb_logo_new.svg",
    colors: { primary: "#EC1C24", secondary: "#000000" }
  },
  {
    id: "2",
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/logos/mi_logo_new.svg",
    colors: { primary: "#004BA0", secondary: "#FFFFFF" }
  },
  {
    id: "3",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "/logos/srh_logo_new.svg",
    colors: { primary: "#FF822A", secondary: "#000000" }
  },
  {
    id: "4",
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "/logos/gt_logo_new.svg",
    colors: { primary: "#1B2130", secondary: "#E15454" }
  },
  {
    id: "5",
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "/logos/kxip_logo_new.svg",
    colors: { primary: "#ED1D24", secondary: "#FBDD0B" }
  },
  {
    id: "6",
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/logos/dc_logo_new.svg",
    colors: { primary: "#0078BC", secondary: "#EF1B26" }
  },
  {
    id: "7",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "/logos/lsg_logo_new.svg",
    colors: { primary: "#9C2A2C", secondary: "#F7E17D" }
  },
  {
    id: "8",
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "/logos/rr_logo_new.svg",
    colors: { primary: "#EA1A85", secondary: "#004B8D" }
  },
  {
    id: "9",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "/logos/kkr_logo_new.svg",
    colors: { primary: "#3A225D", secondary: "#B9975B" }
  },
  {
    id: "10",
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/logos/csk_logo_new.svg",
    colors: { primary: "#FFFF00", secondary: "#0081E8" }
  }
];
var defaultMatches = [
  {
    id: "1",
    date: "2026-03-23",
    time: "19:30",
    venue: "M. A. Chidambaram Stadium, Chennai",
    team1Id: "10",
    team2Id: "1",
    status: "upcoming"
  },
  {
    id: "2",
    date: "2026-03-24",
    time: "15:30",
    venue: "Eden Gardens, Kolkata",
    team1Id: "9",
    team2Id: "4",
    status: "upcoming"
  },
  {
    id: "3",
    date: "2026-03-25",
    time: "19:30",
    venue: "Wankhede Stadium, Mumbai",
    team1Id: "2",
    team2Id: "8",
    status: "upcoming"
  }
];
function verifyAdminToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken, "verifyAdminToken");
__name2(verifyAdminToken, "verifyAdminToken");
function getTeamById(teamId) {
  return mockTeams.find((t) => t.id === teamId);
}
__name(getTeamById, "getTeamById");
__name2(getTeamById, "getTeamById");
function formatMatch(match2) {
  const team1 = getTeamById(match2.team1Id);
  const team2 = getTeamById(match2.team2Id);
  return {
    id: match2.id,
    date: match2.date,
    time: match2.time,
    venue: match2.venue,
    team1: team1 || { id: match2.team1Id, shortName: "Unknown" },
    team2: team2 || { id: match2.team2Id, shortName: "Unknown" },
    status: match2.status
  };
}
__name(formatMatch, "formatMatch");
__name2(formatMatch, "formatMatch");
async function handleGetRequest(context) {
  const { env } = context;
  try {
    let matches = await env.IPL_CACHE.get("matches", "json");
    if (!matches) {
      matches = defaultMatches;
    }
    const formattedMatches = matches.map(formatMatch);
    return new Response(JSON.stringify(formattedMatches), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Error retrieving matches:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve matches" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGetRequest, "handleGetRequest");
__name2(handleGetRequest, "handleGetRequest");
async function handlePostRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { date, time, venue, team1Id, team2Id, status } = body;
    if (!date || !time || !venue || !team1Id || !team2Id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json") || defaultMatches;
    const newId = String(Math.max(...matches.map((m) => parseInt(m.id) || 0), 0) + 1);
    const newMatch = {
      id: newId,
      date,
      time,
      venue,
      team1Id,
      team2Id,
      status: status || "upcoming"
    };
    matches.push(newMatch);
    await env.IPL_CACHE.put("matches", JSON.stringify(matches));
    return new Response(JSON.stringify(formatMatch(newMatch)), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating match:", error);
    return new Response(JSON.stringify({ error: "Failed to create match" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePostRequest, "handlePostRequest");
__name2(handlePostRequest, "handlePostRequest");
async function handlePutRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, date, time, venue, team1Id, team2Id, status } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: "Match ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json") || defaultMatches;
    const matchIndex = matches.findIndex((m) => m.id === id);
    if (matchIndex === -1) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedMatch = {
      ...matches[matchIndex],
      ...date && { date },
      ...time && { time },
      ...venue && { venue },
      ...team1Id && { team1Id },
      ...team2Id && { team2Id },
      ...status && { status }
    };
    matches[matchIndex] = updatedMatch;
    await env.IPL_CACHE.put("matches", JSON.stringify(matches));
    return new Response(JSON.stringify(formatMatch(updatedMatch)), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating match:", error);
    return new Response(JSON.stringify({ error: "Failed to update match" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePutRequest, "handlePutRequest");
__name2(handlePutRequest, "handlePutRequest");
async function handleDeleteRequest(context) {
  const { env, request } = context;
  if (!verifyAdminToken(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get("id");
    if (!matchId) {
      return new Response(JSON.stringify({ error: "Match ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let matches = await env.IPL_CACHE.get("matches", "json") || defaultMatches;
    const filteredMatches = matches.filter((m) => m.id !== matchId);
    if (filteredMatches.length === matches.length) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.IPL_CACHE.put("matches", JSON.stringify(filteredMatches));
    return new Response(JSON.stringify({ success: true, message: "Match deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting match:", error);
    return new Response(JSON.stringify({ error: "Failed to delete match" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleDeleteRequest, "handleDeleteRequest");
__name2(handleDeleteRequest, "handleDeleteRequest");
async function onRequest11(context) {
  const { request } = context;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  let response;
  switch (method) {
    case "GET":
      response = await handleGetRequest(context);
      break;
    case "POST":
      response = await handlePostRequest(context);
      break;
    case "PUT":
      response = await handlePutRequest(context);
      break;
    case "DELETE":
      response = await handleDeleteRequest(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
  }
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
__name(onRequest11, "onRequest11");
__name2(onRequest11, "onRequest");
var import_checked_fetch13 = __toESM2(require_checked_fetch2());
var onRequest12 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;
  const corsHeaders2 = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders2
    });
  }
  try {
    if (pathname === "/api/messages" && method === "GET") {
      const matchId = searchParams.get("matchId") || "current";
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      if (!messagesData) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders2 }
        });
      }
      let messages = JSON.parse(messagesData);
      messages = messages.slice(
        Math.max(0, messages.length - offset - limit),
        messages.length - offset
      );
      return new Response(JSON.stringify(messages), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (pathname === "/api/messages" && method === "POST") {
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      const user = JSON.parse(userData);
      if (user.isBlocked) {
        return new Response(
          JSON.stringify({ error: "Your account is blocked" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const { matchId = "current", text } = await request.json();
      if (!text || text.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Message cannot be empty" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      if (text.length > 500) {
        return new Response(
          JSON.stringify({ error: "Message too long (max 500 chars)" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      const message = {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        text: text.trim(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        matchId
      };
      messages.push(message);
      if (messages.length > 1e3) {
        messages = messages.slice(-1e3);
      }
      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800
        // 7 days
      });
      return new Response(JSON.stringify({ success: true, message }), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    if (pathname.startsWith("/api/messages/") && method === "DELETE") {
      const messageId = pathname.split("/").pop();
      const token = request.headers.get("Authorization")?.replace("Bearer ", "");
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      let email = tokenValue;
      if (tokenValue.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === "string") {
            email = parsed.email;
          }
        } catch {
        }
      }
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      const user = JSON.parse(userData);
      if (user.role !== "admin" && user.role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
        );
      }
      const matchId = searchParams.get("matchId") || "current";
      const messagesKey = `messages:${matchId}`;
      const messagesData = await env.SPORTS_KV.get(messagesKey);
      let messages = messagesData ? JSON.parse(messagesData) : [];
      messages = messages.filter((m) => m.id !== messageId);
      await env.SPORTS_KV.put(messagesKey, JSON.stringify(messages), {
        expirationTtl: 604800
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders2 }
      });
    }
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  } catch (error) {
    console.error("Messages error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders2 } }
    );
  }
}, "onRequest");
var import_checked_fetch14 = __toESM2(require_checked_fetch2());
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var onRequest13 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    if (request.method === "GET") {
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      return new Response(JSON.stringify(players), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "POST") {
      const newPlayer = await request.json();
      if (!newPlayer.name || !newPlayer.role || !newPlayer.teamId) {
        return new Response(JSON.stringify({ error: "Missing required fields: name, role, teamId" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const newId = (players.length + 1).toString();
      const playerToAdd = {
        id: newId,
        name: newPlayer.name,
        role: newPlayer.role,
        teamId: newPlayer.teamId,
        age: parseInt(newPlayer.age) || 0,
        dateOfBirth: newPlayer.dateOfBirth || void 0,
        nationality: newPlayer.nationality || "",
        jerseyNumber: parseInt(newPlayer.jerseyNumber) || 0,
        isCaptain: newPlayer.isCaptain || false,
        bowlingStyle: newPlayer.bowlingStyle || "N/A (Batsman)",
        battingStyle: newPlayer.battingStyle || "Right-handed bat",
        stats: {
          matches: parseInt(newPlayer.stats?.matches) || 0,
          runs: parseInt(newPlayer.stats?.runs) || 0,
          wickets: parseInt(newPlayer.stats?.wickets) || 0,
          average: parseFloat(newPlayer.stats?.average) || 0,
          bowlingAverage: parseFloat(newPlayer.stats?.bowlingAverage) || 0,
          strikeRate: parseFloat(newPlayer.stats?.strikeRate) || 0,
          economy: parseFloat(newPlayer.stats?.economy) || 0,
          highest: parseInt(newPlayer.stats?.highest) || 0,
          fours: parseInt(newPlayer.stats?.fours) || 0,
          sixes: parseInt(newPlayer.stats?.sixes) || 0,
          fifties: parseInt(newPlayer.stats?.fifties) || 0,
          hundreds: parseInt(newPlayer.stats?.hundreds) || 0,
          bestBowling: newPlayer.stats?.bestBowling || "-"
        }
      };
      players.push(playerToAdd);
      await env.IPL_CACHE.put("players", JSON.stringify(players));
      return new Response(JSON.stringify(playerToAdd), {
        status: 201,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "PUT") {
      const updatedPlayer = await request.json();
      if (!updatedPlayer.id) {
        return new Response(JSON.stringify({ error: "Player ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const index = players.findIndex((p) => p.id === updatedPlayer.id);
      if (index === -1) {
        return new Response(JSON.stringify({ error: "Player not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      players[index] = {
        id: updatedPlayer.id,
        name: updatedPlayer.name,
        role: updatedPlayer.role,
        teamId: updatedPlayer.teamId,
        age: parseInt(updatedPlayer.age) || 0,
        dateOfBirth: updatedPlayer.dateOfBirth || void 0,
        nationality: updatedPlayer.nationality || "",
        jerseyNumber: parseInt(updatedPlayer.jerseyNumber) || 0,
        isCaptain: updatedPlayer.isCaptain || false,
        bowlingStyle: updatedPlayer.bowlingStyle || "N/A (Batsman)",
        battingStyle: updatedPlayer.battingStyle || "Right-handed bat",
        stats: {
          matches: parseInt(updatedPlayer.stats?.matches) || 0,
          runs: parseInt(updatedPlayer.stats?.runs) || 0,
          wickets: parseInt(updatedPlayer.stats?.wickets) || 0,
          average: parseFloat(updatedPlayer.stats?.average) || 0,
          bowlingAverage: parseFloat(updatedPlayer.stats?.bowlingAverage) || 0,
          strikeRate: parseFloat(updatedPlayer.stats?.strikeRate) || 0,
          economy: parseFloat(updatedPlayer.stats?.economy) || 0,
          highest: parseInt(updatedPlayer.stats?.highest) || 0,
          fours: parseInt(updatedPlayer.stats?.fours) || 0,
          sixes: parseInt(updatedPlayer.stats?.sixes) || 0,
          fifties: parseInt(updatedPlayer.stats?.fifties) || 0,
          hundreds: parseInt(updatedPlayer.stats?.hundreds) || 0,
          bestBowling: updatedPlayer.stats?.bestBowling || "-"
        }
      };
      await env.IPL_CACHE.put("players", JSON.stringify(players));
      return new Response(JSON.stringify(players[index]), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "DELETE") {
      const url = new URL(request.url);
      const playerId = url.searchParams.get("id");
      if (!playerId) {
        return new Response(JSON.stringify({ error: "Player ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const playersData = await env.IPL_CACHE.get("players", "json");
      const players = playersData || [];
      const filteredPlayers = players.filter((p) => p.id !== playerId);
      if (filteredPlayers.length === players.length) {
        return new Response(JSON.stringify({ error: "Player not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      await env.IPL_CACHE.put("players", JSON.stringify(filteredPlayers));
      return new Response(JSON.stringify({ success: true, message: "Player deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
}, "onRequest");
var import_checked_fetch15 = __toESM2(require_checked_fetch2());
var onRequest14 = /* @__PURE__ */ __name2(async (context) => {
  const { request, env } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }
    });
  }
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  }
  try {
    const mockTeams2 = [
      {
        id: "1",
        name: "Royal Challengers Bengaluru",
        shortName: "RCB",
        logo: "/logos/rcb_logo_new.svg",
        description: "One of the most popular IPL teams known for their aggressive batting",
        colors: { primary: "#EC1C24", secondary: "#000000" }
      },
      {
        id: "2",
        name: "Mumbai Indians",
        shortName: "MI",
        logo: "/logos/mi_logo_new.svg",
        description: "The most successful IPL team with 5 championship titles",
        colors: { primary: "#004BA0", secondary: "#FFFFFF" }
      },
      {
        id: "3",
        name: "Sunrisers Hyderabad",
        shortName: "SRH",
        logo: "/logos/srh_logo_new.svg",
        description: "Known for their strong bowling attack and consistent performances",
        colors: { primary: "#FF822A", secondary: "#000000" }
      },
      {
        id: "4",
        name: "Gujarat Titans",
        shortName: "GT",
        logo: "/logos/gt_logo_new.svg",
        description: "The newest powerhouse team that won IPL in their debut season",
        colors: { primary: "#1B2130", secondary: "#E15454" }
      },
      {
        id: "5",
        name: "Punjab Kings",
        shortName: "PBKS",
        logo: "/logos/kxip_logo_new.svg",
        description: "Known for their explosive batting and never-say-die attitude",
        colors: { primary: "#ED1D24", secondary: "#FBDD0B" }
      },
      {
        id: "6",
        name: "Delhi Capitals",
        shortName: "DC",
        logo: "/logos/dc_logo_new.svg",
        description: "Young and dynamic team with a perfect blend of experience and youth",
        colors: { primary: "#0078BC", secondary: "#EF1B26" }
      },
      {
        id: "7",
        name: "Lucknow Super Giants",
        shortName: "LSG",
        logo: "/logos/lsg_logo_new.svg",
        description: "The newest franchise making waves with their balanced squad",
        colors: { primary: "#9C2A2C", secondary: "#F7E17D" }
      },
      {
        id: "8",
        name: "Rajasthan Royals",
        shortName: "RR",
        logo: "/logos/rr_logo_new.svg",
        description: "The inaugural IPL champions known for nurturing young talent",
        colors: { primary: "#EA1A85", secondary: "#004B8D" }
      },
      {
        id: "9",
        name: "Kolkata Knight Riders",
        shortName: "KKR",
        logo: "/logos/kkr_logo_new.svg",
        description: "Two-time champions with a massive fan following",
        colors: { primary: "#3A225D", secondary: "#B9975B" }
      },
      {
        id: "10",
        name: "Chennai Super Kings",
        shortName: "CSK",
        logo: "/logos/csk_logo_new.svg",
        description: "The Yellow Army led by the legendary MS Dhoni",
        colors: { primary: "#FFFF00", secondary: "#0081E8" }
      }
    ];
    const mockPlayers = [
      {
        id: "1",
        name: "Virat Kohli",
        role: "Batsman",
        teamId: "1",
        age: 35,
        nationality: "India",
        jerseyNumber: 18,
        isCaptain: true,
        bowlingStyle: "N/A (Batsman)",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 237,
          runs: 7263,
          wickets: 0,
          average: 37.24,
          strikeRate: 130.02,
          economy: 0,
          highest: 113,
          fours: 629,
          sixes: 237,
          fifties: 50,
          hundreds: 7,
          bestBowling: "-"
        }
      },
      {
        id: "2",
        name: "Rohit Sharma",
        role: "Batsman",
        teamId: "2",
        age: 36,
        nationality: "India",
        jerseyNumber: 45,
        isCaptain: true,
        bowlingStyle: "Right-arm off-break",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 243,
          runs: 6230,
          wickets: 0,
          average: 30.31,
          strikeRate: 130.39,
          economy: 0,
          highest: 109,
          fours: 532,
          sixes: 264,
          fifties: 42,
          hundreds: 2,
          bestBowling: "-"
        }
      },
      {
        id: "3",
        name: "Jasprit Bumrah",
        role: "Bowler",
        teamId: "2",
        age: 30,
        nationality: "India",
        jerseyNumber: 93,
        isCaptain: false,
        bowlingStyle: "Right-arm fast",
        battingStyle: "Right-handed bat",
        stats: {
          matches: 145,
          runs: 56,
          wickets: 170,
          average: 23.95,
          strikeRate: 87.45,
          economy: 7.39,
          highest: 14,
          fours: 3,
          sixes: 1,
          fifties: 0,
          hundreds: 0,
          bestBowling: "5/10"
        }
      }
    ];
    const existingTeams = await env.IPL_CACHE.get("teams", "json");
    if (existingTeams && existingTeams.length > 0) {
      return new Response(JSON.stringify({
        message: "Teams data already exists",
        teamsCount: existingTeams.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.IPL_CACHE.put("teams", JSON.stringify(mockTeams2));
    const existingPlayers = await env.IPL_CACHE.get("players", "json");
    if (existingPlayers && existingPlayers.length > 0) {
      return new Response(JSON.stringify({
        message: "Data already exists",
        playersCount: existingPlayers.length
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.IPL_CACHE.put("players", JSON.stringify(mockPlayers));
    return new Response(JSON.stringify({
      message: "Data seeded successfully",
      playersCount: mockPlayers.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: "Failed to seed data",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}, "onRequest");
var import_checked_fetch16 = __toESM2(require_checked_fetch2());
function verifyAdminToken2(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken2, "verifyAdminToken2");
__name2(verifyAdminToken2, "verifyAdminToken");
var defaultSettings = {
  siteName: "IPL 2026",
  siteDescription: "The biggest cricket tournament in the world",
  maintenanceMode: false,
  aiPredictionsEnabled: false,
  aiModel: "gpt-4",
  maxUploadSize: 50,
  emailNotifications: true,
  analyticsEnabled: true
};
async function handleGetRequest2(context) {
  const { env } = context;
  try {
    let settings = await env.IPL_CACHE.get("settings", "json");
    if (!settings) {
      settings = defaultSettings;
    }
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Error retrieving settings:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGetRequest2, "handleGetRequest2");
__name2(handleGetRequest2, "handleGetRequest");
async function handlePutRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken2(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    let settings = await env.IPL_CACHE.get("settings", "json") || defaultSettings;
    const updatedSettings = {
      ...settings,
      ...body
    };
    await env.IPL_CACHE.put("settings", JSON.stringify(updatedSettings));
    return new Response(JSON.stringify({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return new Response(JSON.stringify({ error: "Failed to update settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePutRequest2, "handlePutRequest2");
__name2(handlePutRequest2, "handlePutRequest");
async function onRequest15(context) {
  const { request } = context;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  let response;
  switch (method) {
    case "GET":
      response = await handleGetRequest2(context);
      break;
    case "PUT":
      response = await handlePutRequest2(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
  }
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
__name(onRequest15, "onRequest15");
__name2(onRequest15, "onRequest");
var import_checked_fetch17 = __toESM2(require_checked_fetch2());
function verifyAdminToken3(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  return true;
}
__name(verifyAdminToken3, "verifyAdminToken3");
__name2(verifyAdminToken3, "verifyAdminToken");
var defaultTeams = [
  {
    id: "1",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    logo: "/logos/rcb_logo_new.svg",
    description: "One of the most popular IPL teams known for their aggressive batting",
    colors: { primary: "#EC1C24", secondary: "#000000" },
    trophies: [],
    homeGrounds: ["M. Chinnaswamy Stadium"]
  },
  {
    id: "2",
    name: "Mumbai Indians",
    shortName: "MI",
    logo: "/logos/mi_logo_new.svg",
    description: "The most successful IPL team with 5 championship titles",
    colors: { primary: "#004BA0", secondary: "#FFFFFF" },
    trophies: [
      { year: 2013, name: "IPL Champions" },
      { year: 2015, name: "IPL Champions" },
      { year: 2017, name: "IPL Champions" },
      { year: 2019, name: "IPL Champions" },
      { year: 2023, name: "IPL Champions" }
    ],
    homeGrounds: ["Wankhede Stadium"]
  },
  {
    id: "3",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    logo: "/logos/srh_logo_new.svg",
    description: "Known for their strong bowling attack and consistent performances",
    colors: { primary: "#FF822A", secondary: "#000000" },
    trophies: [
      { year: 2016, name: "IPL Champions" }
    ],
    homeGrounds: ["Arun Jaitley Stadium", "Rajiv Gandhi International Stadium"]
  },
  {
    id: "4",
    name: "Gujarat Titans",
    shortName: "GT",
    logo: "/logos/gt_logo_new.svg",
    description: "The newest powerhouse team that won IPL in their debut season",
    colors: { primary: "#1B2130", secondary: "#E15454" },
    trophies: [
      { year: 2022, name: "IPL Champions" }
    ],
    homeGrounds: ["Arun Jaitley Stadium", "Narendra Modi Stadium"]
  },
  {
    id: "5",
    name: "Punjab Kings",
    shortName: "PBKS",
    logo: "/logos/kxip_logo_new.svg",
    description: "Known for their explosive batting and never-say-die attitude",
    colors: { primary: "#ED1D24", secondary: "#FBDD0B" },
    trophies: [],
    homeGrounds: ["PCA Stadium", "Arun Jaitley Stadium"]
  },
  {
    id: "6",
    name: "Delhi Capitals",
    shortName: "DC",
    logo: "/logos/dc_logo_new.svg",
    description: "Young and dynamic team with a perfect blend of experience and youth",
    colors: { primary: "#0078BC", secondary: "#EF1B26" },
    trophies: [],
    homeGrounds: ["Arun Jaitley Stadium"]
  },
  {
    id: "7",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    logo: "/logos/lsg_logo_new.svg",
    description: "The newest franchise making waves with their balanced squad",
    colors: { primary: "#9C2A2C", secondary: "#F7E17D" },
    trophies: [],
    homeGrounds: ["ARUN JAITLEY STADIUM", "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium"]
  },
  {
    id: "8",
    name: "Rajasthan Royals",
    shortName: "RR",
    logo: "/logos/rr_logo_new.svg",
    description: "The inaugural IPL champions known for nurturing young talent",
    colors: { primary: "#EA1A85", secondary: "#004B8D" },
    trophies: [
      { year: 2008, name: "IPL Champions" }
    ],
    homeGrounds: ["Arun Jaitley Stadium", "Sawai Mansingh Stadium"]
  },
  {
    id: "9",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    logo: "/logos/kkr_logo_new.svg",
    description: "Two-time champions with a massive fan following",
    colors: { primary: "#3A225D", secondary: "#B9975B" },
    trophies: [
      { year: 2012, name: "IPL Champions" },
      { year: 2014, name: "IPL Champions" }
    ],
    homeGrounds: ["Eden Gardens"]
  },
  {
    id: "10",
    name: "Chennai Super Kings",
    shortName: "CSK",
    logo: "/logos/csk_logo_new.svg",
    description: "The Yellow Army led by the legendary MS Dhoni",
    colors: { primary: "#FFFF00", secondary: "#0081E8" },
    trophies: [
      { year: 2010, name: "IPL Champions" },
      { year: 2011, name: "IPL Champions" },
      { year: 2018, name: "IPL Champions" },
      { year: 2021, name: "IPL Champions" }
    ],
    homeGrounds: ["M. A. Chidambaram Stadium"]
  }
];
async function handleGetRequest3(context) {
  const { env } = context;
  try {
    let teams = await env.IPL_CACHE.get("teams", "json");
    if (!teams) {
      teams = defaultTeams;
    }
    return new Response(JSON.stringify(teams), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error) {
    console.error("Error retrieving teams:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve teams" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleGetRequest3, "handleGetRequest3");
__name2(handleGetRequest3, "handleGetRequest");
async function handlePostRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken3(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { name, shortName, logo, description, colors, trophies, homeGrounds } = body;
    if (!name || !shortName || !logo || !description) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let teams = await env.IPL_CACHE.get("teams", "json") || defaultTeams;
    const newId = String(Math.max(...teams.map((t) => parseInt(t.id) || 0), 0) + 1);
    const newTeam = {
      id: newId,
      name,
      shortName,
      logo,
      description,
      colors: colors || { primary: "#6B46C1", secondary: "#FFD700" },
      trophies: trophies || [],
      homeGrounds: homeGrounds || []
    };
    teams.push(newTeam);
    await env.IPL_CACHE.put("teams", JSON.stringify(teams));
    return new Response(JSON.stringify(newTeam), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return new Response(JSON.stringify({ error: "Failed to create team" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePostRequest2, "handlePostRequest2");
__name2(handlePostRequest2, "handlePostRequest");
async function handlePutRequest3(context) {
  const { env, request } = context;
  if (!verifyAdminToken3(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, name, shortName, logo, description, colors, trophies, homeGrounds } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: "Team ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let teams = await env.IPL_CACHE.get("teams", "json") || defaultTeams;
    const teamIndex = teams.findIndex((t) => t.id === id);
    if (teamIndex === -1) {
      return new Response(JSON.stringify({ error: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const updatedTeam = {
      ...teams[teamIndex],
      ...name && { name },
      ...shortName && { shortName },
      ...logo && { logo },
      ...description && { description },
      ...colors && { colors },
      ...trophies !== void 0 && { trophies },
      ...homeGrounds !== void 0 && { homeGrounds }
    };
    teams[teamIndex] = updatedTeam;
    await env.IPL_CACHE.put("teams", JSON.stringify(teams));
    return new Response(JSON.stringify(updatedTeam), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return new Response(JSON.stringify({ error: "Failed to update team" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handlePutRequest3, "handlePutRequest3");
__name2(handlePutRequest3, "handlePutRequest");
async function handleDeleteRequest2(context) {
  const { env, request } = context;
  if (!verifyAdminToken3(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const url = new URL(request.url);
    const teamId = url.searchParams.get("id");
    if (!teamId) {
      return new Response(JSON.stringify({ error: "Team ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let teams = await env.IPL_CACHE.get("teams", "json") || defaultTeams;
    const filteredTeams = teams.filter((t) => t.id !== teamId);
    if (filteredTeams.length === teams.length) {
      return new Response(JSON.stringify({ error: "Team not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.IPL_CACHE.put("teams", JSON.stringify(filteredTeams));
    return new Response(JSON.stringify({ success: true, message: "Team deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting team:", error);
    return new Response(JSON.stringify({ error: "Failed to delete team" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(handleDeleteRequest2, "handleDeleteRequest2");
__name2(handleDeleteRequest2, "handleDeleteRequest");
async function onRequest16(context) {
  const { request } = context;
  const method = request.method;
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
  let response;
  switch (method) {
    case "GET":
      response = await handleGetRequest3(context);
      break;
    case "POST":
      response = await handlePostRequest2(context);
      break;
    case "PUT":
      response = await handlePutRequest3(context);
      break;
    case "DELETE":
      response = await handleDeleteRequest2(context);
      break;
    default:
      response = new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
  }
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}
__name(onRequest16, "onRequest16");
__name2(onRequest16, "onRequest");
var import_checked_fetch18 = __toESM2(require_checked_fetch2());
var onRequest17 = /* @__PURE__ */ __name2(async (context) => {
  return context.next();
}, "onRequest");
var import_checked_fetch19 = __toESM2(require_checked_fetch2());
var onRequest18 = /* @__PURE__ */ __name2(async (context) => {
  const { request } = context;
  console.log(`[Middleware] ${request.method} ${new URL(request.url).pathname}`);
  return context.next();
}, "onRequest");
var routes = [
  {
    routePath: "/api/admin/users/activity",
    mountPath: "/api/admin/users",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/admin/login",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/admin/setup",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/admin/users",
    mountPath: "/api/admin",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/messages/:id",
    mountPath: "/api/messages",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/coaches",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/coaches",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/content",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/enrichDescription",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/api/legal",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/api/live-score",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/api/matches",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/api/messages",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/api/players",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  },
  {
    routePath: "/api/seed",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest14]
  },
  {
    routePath: "/api/settings",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest15]
  },
  {
    routePath: "/api/teams",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest16]
  },
  {
    routePath: "/:route*",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest17]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest18],
    modules: []
  }
];
var import_checked_fetch26 = __toESM2(require_checked_fetch2());
var import_checked_fetch24 = __toESM2(require_checked_fetch2());
var import_checked_fetch21 = __toESM2(require_checked_fetch2());
var import_checked_fetch20 = __toESM2(require_checked_fetch2());
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var import_checked_fetch222 = __toESM2(require_checked_fetch2());
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
var import_checked_fetch23 = __toESM2(require_checked_fetch2());
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var import_checked_fetch25 = __toESM2(require_checked_fetch2());
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var import_checked_fetch27 = __toESM(require_checked_fetch());
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
var import_checked_fetch28 = __toESM(require_checked_fetch());
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-F82vzG/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var import_checked_fetch30 = __toESM(require_checked_fetch());
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-F82vzG/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.4471677604617973.js.map
