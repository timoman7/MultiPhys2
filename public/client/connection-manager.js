class ConnectionManager
{
    constructor(user)
    {
        this.conn = null;
        this.peers = new Map;

        this.user = user;
    }

    connect(address)
    {
        this.conn = new WebSocket(address);

        this.conn.addEventListener('open', () => {
            console.log('Connection established');
            this.initSession();
            this.watchEvents();
        });

        this.conn.addEventListener('message', event => {
            console.log('Received message', event.data);
            this.receive(event.data);
        });
    }

    initSession()
    {
        const sessionId = window.location.hash.split('#')[1];
        const state = this.user.serialize();
        if (sessionId) {
            this.send({
                type: 'join-session',
                id: sessionId,
                state,
            });
        } else {
            this.send({
                type: 'create-session',
                state,
            });
        }
    }

    watchEvents()
    {
      const user = this.user;
        ['name','controls'].forEach(key => {
            user.events.listen(key, () => {
                this.send({
                    type: 'state-update',
                    fragment: 'user',
                    state: [key, user[key]],
                });
            });
        });
    }

    receive(msg)
    {
        const data = JSON.parse(msg);
        console.log(data.type)
        if(data.type === 'session-broadcast'){
          if(data.engine){
            window.engine = data.engine;
            if(window.render){
              window.render.engine = window.engine;
            }else{
              window.render = window.Render.create({
                element: document.body,
                engine: window.engine,
                options: {
                  width: 800,
                  height: 600,
                  hasBounds: true,
                  showAngleIndicator: true
                }
              });
            }
            window.Render.run(window.render);
          }
        }else if(data.type === 'session-created') {
          window.location.hash = data.id;
          if(data.engine){
            window.engine = data.engine;
            if(window.render){
              window.render.engine = window.engine;
            }else{
              window.render = window.Render.create({
                element: document.body,
                engine: window.engine,
                options: {
                  width: 800,
                  height: 600,
                  hasBounds: true,
                  showAngleIndicator: true
                }
              });
            }
            window.Render.run(window.render);
          }
        }else if(data.type === 'world-update'){
          if(data.engine){
            window.engine = data.engine;
          }
        }
        console.log(data);
    }

    send(data)
    {
        const msg = JSON.stringify(data);
        console.log('Sending message', msg);
        this.conn.send(msg);
    }
}
