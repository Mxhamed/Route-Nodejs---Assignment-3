const path = require("node:path");
const fs = require("node:fs/promises");
const http = require("node:http");
const url = require("node:url");

// Constants
const MAX_BODY_SIZE = 1e6; // 1MB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// File Path
const filePath = path.resolve("./users.json");

// Cache to Avoid Reading File on EVERY Request
let usersCache = null;

// Custom Error Class
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Helper → Send JSON Response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// Helper → Send Error Response
function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message }));
}

// Helper → Parse Request Body with Size Limit
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;

      // Prevent LARGE Requests
      if (size > MAX_BODY_SIZE) {
        reject(new AppError(413, "Request Body TOO Large!"));
        req.destroy();
        return;
      }

      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new AppError(400, "Invalid JSON!"));
      }
    });

    req.on("error", reject);
  });
}

// Helper → Read Users from File
async function readUsers() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    // If File DOESN'T Exist → Return Empty Array
    if (err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

// Helper → Write Users to File
async function writeUsers(users) {
  await fs.writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");
  // Update Cache AFTER Writing
  usersCache = users;
}

// Helper → Get Users
async function getUsers(useCache = true) {
  // Use Cache if Available
  if (useCache && usersCache) {
    return usersCache;
  }

  // Read from File
  const users = await readUsers();
  usersCache = users;
  return users;
}

// Validation → Check Email Format
function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

// Validation → Check Age
function isValidAge(age) {
  return typeof age === "number" && age > 0 && Number.isInteger(age);
}

// Sanitize User Input
function sanitizeUser(data) {
  return {
    ...data,
    name: data.name ? String(data.name).trim() : undefined,
    email: data.email ? String(data.email).trim().toLowerCase() : undefined,
  };
}

// Route → GET /User - Get ALL Users
async function getAllUsers(_, res) {
  const users = await getUsers(true); // Use cache
  sendJSON(res, 200, users);
}

// Route → GET /user/:id - Get User by ID
async function getUserById(_, res, id) {
  const users = await getUsers(true); // Use cache
  const user = users.find((u) => u.id === id);

  if (!user) {
    throw new AppError(404, "User NOT Found!");
  }

  sendJSON(res, 200, user);
}

// Route → POST /user - Create New User
async function createUser(req, res) {
  const data = await parseBody(req);
  const sanitized = sanitizeUser(data);

  // Validate Required Fields
  if (!sanitized.name || !sanitized.email || !sanitized.age) {
    throw new AppError(422, "Name, Email, and Age are Required!");
  }

  // Validate Email Format
  if (!isValidEmail(sanitized.email)) {
    throw new AppError(422, "Invalid Email Format!");
  }

  // Validate Age
  if (!isValidAge(sanitized.age)) {
    throw new AppError(422, "Age MUST be a Positive Integer!");
  }

  // Read Users (DON'T Use Cache, We Need Fresh Data)
  const users = await getUsers(false);

  // Check for Duplicate Email
  const existingUser = users.find((u) => u.email === sanitized.email);
  if (existingUser) {
    throw new AppError(409, "Email ALREADY Exists!");
  }

  // Create New User
  const newUser = {
    id: Date.now(),
    name: sanitized.name,
    email: sanitized.email,
    age: sanitized.age,
  };

  users.push(newUser);
  await writeUsers(users);

  sendJSON(res, 201, { message: "User Added Successfully!" });
}

// Route → PATCH /user/:id - Update User
async function updateUser(req, res, id) {
  const data = await parseBody(req);
  const sanitized = sanitizeUser(data);

  // At Least One Field MUST be Provided
  if (!sanitized.name && !sanitized.email && !sanitized.age) {
    throw new AppError(422, "At Least One Field MUST be Provided!");
  }

  // Validate Email IF Provided
  if (sanitized.email && !isValidEmail(sanitized.email)) {
    throw new AppError(422, "Invalid Email Format!");
  }

  // Validate Age IF Provided
  if (sanitized.age && !isValidAge(sanitized.age)) {
    throw new AppError(422, "Age MUST be a Positive Integer");
  }

  // Read Users (DON'T Use Cache)
  const users = await getUsers(false);

  // Find User
  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    throw new AppError(404, "User ID NOT Found!");
  }

  // Check for Duplicate Email IF Email is being Updated
  if (sanitized.email) {
    const duplicate = users.find(
      (u) => u.email === sanitized.email && u.id !== id
    );
    if (duplicate) {
      throw new AppError(409, "Email ALREADY Exists!");
    }
  }

  // Update User
  if (sanitized.name) users[userIndex].name = sanitized.name;
  if (sanitized.email) users[userIndex].email = sanitized.email;
  if (sanitized.age) users[userIndex].age = sanitized.age;

  await writeUsers(users);

  sendJSON(res, 200, { message: "User Modified Successfully!" });
}

// Route → DELETE /user/:id - Delete User
async function deleteUser(_, res, id) {
  // Read Users (DON'T Use Cache)
  const users = await getUsers(false);

  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1) {
    throw new AppError(404, "User ID NOT Found!");
  }

  users.splice(userIndex, 1);
  await writeUsers(users);

  sendJSON(res, 200, { message: "User Deleted Successfully!" });
}

// Main Server
const server = http.createServer(async (req, res) => {
  try {
    const parsedURL = url.parse(req.url, true);
    const { method } = req;
    const { pathname } = parsedURL;

    const startsWith = pathname.startsWith("/user/");
    const id = startsWith ? +pathname.split("/")[2] : null;

    // Route Matching
    if (pathname === "/user" && method === "GET") {
      await getAllUsers(req, res);
    } else if (startsWith && method === "GET") {
      await getUserById(req, res, id);
    } else if (pathname === "/user" && method === "POST") {
      if (req.headers["content-type"] !== "application/json") {
        throw new AppError(415, "Content-Type MUST be application/json");
      }
      await createUser(req, res);
    } else if (startsWith && method === "PATCH") {
      if (req.headers["content-type"] !== "application/json") {
        throw new AppError(415, "Content-Type MUST be application/json");
      }
      await updateUser(req, res, id);
    } else if (startsWith && method === "DELETE") {
      await deleteUser(req, res, id);
    } else {
      throw new AppError(404, "Route NOT Found!");
    }
  } catch (err) {
    // Error Handling
    if (err instanceof AppError) {
      sendError(res, err.statusCode, err.message);
    } else {
      console.error("🚨 Server Error:", err);
      sendError(res, 500, "Internal Server Error...");
    }
  }
});

server.listen(3000, () => {
  console.log("🚀 Server Running on Port 3000");
  console.log("📁 Users File:", filePath);
});
