/**
* Serializer is from matter-tools and is capable of serializing(stringifying)
* a Matter world.
* However, it require(...)s resurrect from bower components, 2 parents back
* ../ from server gives public, ../ from public gives the root MultiPhys2
* Therefore, bower_components folder must reside in the root(MultiPhys2)
* Inside of bower_components resides /resurrect-js/ ... in that is the
* resurrect.js file
**/

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
    _Events = Matter.Events,
    Composites = Matter.Composites,
    Common = Matter.Common,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Vector = Matter.Vector,
    Bounds = Matter.Bounds,
    Bodies = Matter.Bodies,
    Body = Matter.Body;
const Serializer = require('./Serializer');

const WorldProp = {
  width: 800,
  height: 500,
  hasBounds: true,
  showAngleIndicator: true
};


function createId(len = 6, chars = 'abcdefghjkmnopqrstvwxyz01234567890') {
    let id = '';
    while (len--) {
        id += chars[Math.random() * chars.length | 0];
    }
    return id;
}

function createClient(conn, id = createId()) {
    let client = new Client(conn, id);
    client.createdBody = false;
    client.createBody = function(
      bx = Math.floor(Math.random() * WorldProp.width),
      by = Math.floor(Math.random() * WorldProp.height),
      bw = Math.floor(Math.random() * 60) + 20,
      bh = Math.floor(Math.random() * 60) + 20
    ){
      if(this.session){
        let tempUser = Bodies.rectangle(bx, by, bw, bh);
        tempUser.clientId = id;
        World.add(this.session.engine.world, tempUser);
        client.createdBody = true;
      }
    }
    return client;
}

function createSession(id = createId()) {
    if (sessions.has(id)) {
        throw new Error(`Session ${id} already exists`);
    }

    const session = new Session(id);
    session.engine = Engine.create();
    var boxA = Bodies.rectangle(450, 50, 80, 80);
    var ground = Bodies.rectangle(WorldProp.width/2, WorldProp.height, WorldProp.width, 60, { isStatic: true });
    var left_wall = Bodies.rectangle(0, WorldProp.height/2, 20, WorldProp.height, { isStatic: true });
    var right_wall = Bodies.rectangle(WorldProp.width, WorldProp.height/2, 20, WorldProp.height, { isStatic: true });
    var ceiling = Bodies.rectangle(WorldProp.width/2, 0, WorldProp.width, 60, { isStatic: true });

    World.add(session.engine.world, [ground, boxA, left_wall, right_wall, ceiling]);

    _Events.on(session.engine, "afterUpdate", engineCallback);

    Engine.update(session.engine);

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
        if(!client.createdBody){
          client.createBody();
        }
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
            world: session.engine.world,
            WorldProp: WorldProp,
        });
    });
}

function updateWorld(session) {
    const clients = [...session.clients];
    clients.forEach(client => {
        if(!client.createdBody){
          client.createBody();
        }
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
            world: session.engine.world,
            WorldProp: WorldProp,
        });
    });
}

const sessions = new Map;

function engineCallback(event){
  //console.log("Updated engine at timestamp:", event.timestamp)
  function updateEngine(_engine){
    Engine.update(_engine);
    if(sessions){
      if(sessions.size > 0){
        sessions.forEach((session) => {
          updateWorld(session);
        });
      }
    }
  }
  setTimeout(updateEngine.bind(null, event.source), 16.666);
}

function parseControls(session, clientId, controls){
  let userObj = findByClientId(session.engine, clientId);
  let fx = 0, fy = 0, av = 0;
  if(controls.UP === true){
    fy -= 0.005;
  }
  if(controls.DOWN === true){
    fy += 0.005;
  }
  if(controls.LEFT === true){
    fx -= 0.005;
  }
  if(controls.RIGHT === true){
    fx += 0.005;
  }
  if(controls.SPIN_RIGHT === true){
    av += 0.01;
  }
  if(controls.SPIN_LEFT === true){
    av -= 0.01;
  }
  Body.applyForce(
    userObj,
    {
      x: userObj.position.x,
      y: userObj.position.y
    },
    {
      x: fx,
      y: fy
    }
  );
  if(av !== 0){
    Body.setAngularVelocity(userObj, av + userObj.angularSpeed);
  }
}

function findByClientId(_engine, clientId){
  let foundBody = {};
  _engine.world.bodies.forEach((bod) => {
    if(bod.clientId === clientId){
      foundBody = bod;
      return true;
    }
    return false;
    //return bod.clientId === clientId;
  });
  return foundBody;
}
function closeSession(sessions, session){
  sessions.delete(session.id);
}


const app = express();
app.use(express.static('./public'));

const server = http.createServer(app);
const wss = new WebSocketServer({server});

server.listen(process.env.PORT ? process.env.PORT : 5001);

wss.on('connection', conn => {
    console.log('Connection established');
    const client = createClient(conn);
    conn.on('message', msg => {
        //console.log('Message received', msg);
        const matterSerialize = Serializer.create();
        //const data = JSON.parse(msg);
        const data = matterSerialize.parse(msg);

        if (data.type === 'create-session') {
            const session = createSession();
            session.join(client);

            client.state = data.state;
            client.send({
                type: 'session-created',
                id: session.id,
                world: session.engine.world,
                WorldProp: WorldProp,
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
            if(client.session){
              const session = client.session;
              parseControls(session, client.id, client.state.user.controls);
            }
            client.broadcast(data);
        }

    });

    conn.on('close', () => {
        console.log('Connection closed');
        const session = client.session;
        if (session) {
            session.leave(client);
            if (session.clients.size === 0) {
                World.clear(session.engine.world, true);
                setTimeout(closeSession.bind(null, sessions, session), 50);
            }else{
              let userObj = findByClientId(session.engine, client.id);
              World.remove(session.engine.world, userObj, true);
            }
        }

        broadcastSession(session);

        console.log(sessions);
    });
});
