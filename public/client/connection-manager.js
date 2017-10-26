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
            if(window.DEBUG){
              console.log('Received message', event.data);
            }
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
        const matterSerialize = Serializer.create();
        const data = matterSerialize.parse(msg);
        //const data = JSON.parse(msg);
        if(window.DEBUG){
          console.log(data.type)
        }
        if(data.type === 'session-broadcast'){
          if(data.world){
            window.engine.world = data.world;
            if(!window.render){
              let tempOptions = {};
              ["width", "height", "hasBounds", "showAngleIndicator"].forEach((opt) => {
                let optVal = 0;
                if(data.WorldProp[opt]){
                  optVal = data.WorldProp[opt];
                }
                tempOptions[opt] = optVal;
              });
              window.render = window.Render.create({
                element: document.body,
                engine: window.engine,
                options: tempOptions
              });
            }
            window.Render.run(window.render);
          }
        }else if(data.type === 'session-created') {
          window.location.hash = data.id;
          if(data.world){
            window.engine.world = data.world;
            if(!window.render){
              let tempOptions = {};
              ["width", "height", "hasBounds", "showAngleIndicator"].forEach((opt) => {
                let optVal = 0;
                if(data.WorldProp[opt]){
                  optVal = data.WorldProp[opt];
                }
                tempOptions[opt] = optVal;
              });
              window.render = window.Render.create({
                element: document.body,
                engine: window.engine,
                options: tempOptions
              });
            }
            window.Render.run(window.render);
          }
        }else if(data.type === 'world-update'){
          if(data.world){
            window.engine.world = data.world;
          }
        }
        if(window.DEBUG){
          console.log(data)
        }
    }

    send(data)
    {
        const matterSerialize = Serializer.create();
        const msg = Serializer.serialise(matterSerialize, data);
        //const msg = JSON.stringify(data);
        console.log('Sending message', msg);
        this.conn.send(msg);
    }
}
