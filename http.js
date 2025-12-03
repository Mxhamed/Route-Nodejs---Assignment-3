const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const url = require("node:url");

const JSON_CONTENT_TYPE = { "Content-Type": "application/json" };
const PLAIN_CONTENT_TYPE = { "Content-Type": "text/plain" };
const absPath = path.resolve("./users.json");

const server = http.createServer((req, res) => {
  const parsedURL = url.parse(req.url, true);
  const { method } = req;
  const { pathname } = parsedURL;

  const startsWith = pathname.startsWith("/user/");
  const id = +pathname.split("/")[2];

  let users = JSON.parse(fs.readFileSync(absPath, "utf-8"));

  if (pathname === "/user" && method === "GET") {
    res.writeHead(200, JSON_CONTENT_TYPE);
    res.end(JSON.stringify(users));
  } else if (startsWith && method === "GET") {
    const user = users.find((u) => u.id === id);

    if (!user) {
      res.writeHead(404, JSON_CONTENT_TYPE);
      res.end(JSON.stringify({ message: "User NOT Found!" }));
    } else {
      res.writeHead(200, JSON_CONTENT_TYPE);
      res.end(JSON.stringify(user));
    }
  } else if (
    pathname === "/user" &&
    method === "POST" &&
    req.headers["content-type"] === "application/json"
  ) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        // Case a Property is Missing
        const { name: userName, email, age } = data;
        if (!(userName && email && age)) throw new Error("422");

        // Case of a Duplicate Email
        const user = users.find((u) => u.email === email);
        if (user) throw new Error("409");

        // Successful Request!
        const userData = { ...data, id: Date.now() };
        users.push(userData);
        fs.writeFileSync(absPath, JSON.stringify(users));

        res.writeHead(201, JSON_CONTENT_TYPE);
        res.end(JSON.stringify({ message: "User Added Successfully!" }));
      } catch (err) {
        switch (err.message) {
          case "409":
            res.writeHead(409, JSON_CONTENT_TYPE);
            res.end(JSON.stringify({ message: "Email ALREADY Exists!" }));
            break;

          case "422":
            res.writeHead(422, PLAIN_CONTENT_TYPE);
            res.end("Invalid Request Body");
            break;

          default:
            res.writeHead(400, PLAIN_CONTENT_TYPE);
            res.end("Invalid JSON!");
            break;
        }
      }
    });
  } else if (
    startsWith &&
    method === "PATCH" &&
    req.headers["content-type"] === "application/json"
  ) {
    // Case Wrong ID
    const user = users.find((u) => u.id === id);
    if (!user) {
      res.writeHead(404, JSON_CONTENT_TYPE);
      res.end(JSON.stringify({ message: "User ID NOT Found!" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        // Case a Wrong Property is Passed
        const { name: userName, email, age } = data;
        if (!(userName || email || age)) throw new Error("422");

        // Case of a Duplicate Email
        if (email) {
          const user = users.find((u) => u.email === email);
          if (user) throw new Error("409");
        }

        // Successful Request!
        users = users.map((u) => (u.id === id ? { ...u, ...data } : u));
        fs.writeFileSync(absPath, JSON.stringify(users));

        res.writeHead(200, JSON_CONTENT_TYPE);
        res.end(
          JSON.stringify({
            message: `${Object.keys(data)[0]} Modified Successfully!`,
          })
        );
      } catch (err) {
        switch (err.message) {
          case "409":
            res.writeHead(409, JSON_CONTENT_TYPE);
            res.end(JSON.stringify({ message: "Email ALREADY Exists!" }));
            break;

          case "422":
            res.writeHead(422, PLAIN_CONTENT_TYPE);
            res.end("Invalid Request Body");
            break;

          default:
            res.writeHead(400, PLAIN_CONTENT_TYPE);
            res.end("Invalid JSON!");
            break;
        }
      }
    });
  } else if (startsWith && method === "DELETE") {
    const user = users.find((u) => u.id === id);

    if (!user) {
      res.writeHead(404, JSON_CONTENT_TYPE);
      res.end(JSON.stringify({ message: "User ID NOT Found!" }));
    } else {
      users = users.filter((u) => u.id !== id);
      fs.writeFileSync(absPath, JSON.stringify(users));

      res.writeHead(200, JSON_CONTENT_TYPE);
      res.end(JSON.stringify({ message: "User Deleted Successfully!" }));
    }
  } else {
    res.writeHead(404, PLAIN_CONTENT_TYPE);
    res.end("Route NOT Found!");
  }
});

server.listen(3000, () => {
  console.log("🚀 Server Running on Port 3000");
  console.log("📁 Users File:", absPath);
});
