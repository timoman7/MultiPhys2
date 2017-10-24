/**
* Serializer is from matter-tools and is capable of serializing(stringifying)
* a Matter world.
* However, it require(...)s resurrect from bower components, 2 parents back
* ../ from server gives public, ../ from public gives the root MultiPhys2
* Therefore, bower_components folder must reside in the root(MultiPhys2)
* Inside of bower_components resides /resurrect-js/ ... in that is the
* resurrect.js file
*/

const http = require('http');
const express = require('express');
const WebSocketServer = require('ws').Server;
const Session = require('./session');
const Client = require('./client');
const Resurrect = require('./resurrect');
const Matter = require('./matter');
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Events = Matter.Events,
    Composites = Matter.Composites,
    Common = Matter.Common,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Vector = Matter.Vector,
    Bounds = Matter.Bounds,
    Bodies = Matter.Bodies;
const Serializer = require('./Serializer');


var engine = Engine.create(),
    world = engine.world;
var boxA = Bodies.rectangle(450, 50, 80, 80);
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

World.add(engine.world, [ground, boxA]);
Engine.update(engine);

function createId(len = 6, chars = 'abcdefghjkmnopqrstvwxyz01234567890') {
    let id = '';
    while (len--) {
        id += chars[Math.random() * chars.length | 0];
    }
    return id;
}

function createClient(conn, id = createId()) {
    return new Client(conn, id);
}

function createSession(id = createId()) {
    if (sessions.has(id)) {
        throw new Error(`Session ${id} already exists`);
    }

    const session = new Session(id);
    console.log('Creating session', session);

    sessions.set(id, session);

    return session;
}

function getSession(id) {
    return sessions.get(id);
}

function broadcastSession(session) {
    const clients = [...session.clients];
    clients.forEach(client => {
        client.send({
            type: 'session-broadcast',
            peers: {
                you: client.id,
                clients: clients.map(client => {
                    return {
                        id: client.id,
                        state: client.state,
                    }
                }),
            },
//            engine: engine,
        });
    });
}

function updateWorld(session) {
    const clients = [...session.clients];
    clients.forEach(client => {
        client.send({
            type: 'world-update',
            peers: {
                you: client.id,
                clients: clients.map(client => {
                    return {
                        id: client.id,
                        state: client.state,
                    }
                }),
            },
//            engine: engine,
        });
    });
}

const sessions = new Map;

const app = express();
app.use(express.static('./public'));

const server = http.createServer(app);
const wss = new WebSocketServer({server});

server.listen(process.env.PORT ? process.env.PORT : 5000);

Events.on(engine, "afterUpdate", function(event){
  console.log("Engine Update", event);
  Engine.update(engine);
});

wss.on('connection', conn => {
    console.log('Connection established');
    const client = createClient(conn);
    console.log(conn, client);
    conn.on('message', msg => {
        console.log('Message received', msg);
        const data = JSON.parse(msg);

        if (data.type === 'create-session') {
            const session = createSession();
            session.join(client);

            client.state = data.state;
            client.send({
                type: 'session-created',
                id: session.id,
//                engine: engine,
            });
        } else if (data.type === 'join-session') {
            const session = getSession(data.id) || createSession(data.id);
            session.join(client);

            client.state = data.state;
            broadcastSession(session);
        } else if (data.type === 'state-update') {
            const [key, value] = data.state;
            //console.log(client.state[data.fragment]);
            client.state[data.fragment][key] = value;
            client.broadcast(data);
        }

    });

    conn.on('close', () => {
        console.log('Connection closed');
        const session = client.session;
        if (session) {
            session.leave(client);
            if (session.clients.size === 0) {
                sessions.delete(session.id);
            }
        }

        broadcastSession(session);

        console.log(sessions);
    });
});
