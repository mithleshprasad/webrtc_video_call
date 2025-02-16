const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { join } = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server);
const allusers = {};

// Exposing public directory
app.use(express.static("public"));

// Handle incoming HTTP request
app.get("/", (req, res) => {
    console.log("GET Request /");
    res.sendFile(join(__dirname, "app", "index.html"));
});

// Handle socket connections
io.on("connection", (socket) => {
    console.log(`Someone connected to socket server, socket ID: ${socket.id}`);

    socket.on("join-user", (username) => {
        console.log(`${username} joined socket connection`);
        allusers[username] = { username, id: socket.id };
        io.emit("joined", allusers);
    });

    socket.on("offer", ({ from, to, offer }) => {
        if (allusers[to]) {
            io.to(allusers[to].id).emit("offer", { from, to, offer });
        }
    });

    socket.on("answer", ({ from, to, answer }) => {
        if (allusers[from]) {
            io.to(allusers[from].id).emit("answer", { from, to, answer });
        }
    });

    socket.on("end-call", ({ from, to }) => {
        if (allusers[to]) {
            io.to(allusers[to].id).emit("end-call", { from, to });
        }
    });

    socket.on("call-ended", (caller) => {
        const [from, to] = caller;
        if (allusers[from] && allusers[to]) {
            io.to(allusers[from].id).emit("call-ended", caller);
            io.to(allusers[to].id).emit("call-ended", caller);
        }
    });

    socket.on("icecandidate", (candidate) => {
        console.log({ candidate });
        socket.broadcast.emit("icecandidate", candidate);
    });
});

server.listen(9000, () => {
    console.log("Server listening on port 9000");
});
