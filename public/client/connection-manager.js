class ConnectionManager
{
    constructor(codeManager)
    {
        this.conn = null;
        this.peers = new Map;

        this.codeManager = codeManager;
        this.localUser = this.codeManager.instances[0];
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
        const state = this.localUser.serialize();
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
        const local = this.codeManager.instances[0];

        const user = local.user;
        ['name','code','caret'].forEach(key => {
            user.events.listen(key, () => {
                this.send({
                    type: 'state-update',
                    fragment: 'user',
                    state: [key, user[key]],
                });
            });
        });
    }

    updateManager(peers)
    {
        const me = peers.you;
        const clients = peers.clients.filter(client => me !== client.id);
        clients.forEach(client => {
            if (!this.peers.has(client.id)) {
                const codeContainer = this.codeManager.createUser();
                codeContainer.unserialize(client.state);
                this.peers.set(client.id, codeContainer);
            }
        });

        [...this.peers.entries()].forEach(([id, codeContainer]) => {
            if (!clients.some(client => client.id === id)) {
                this.codeManager.removeUser(codeContainer);
                this.peers.delete(id);
            }
        });

        const local = this.codeManager.instances[0];
        const sorted = peers.clients.map(client => this.peers.get(client.id) || local);
        this.codeManager.sortUsers(sorted);
    }

    updatePeer(id, fragment, [key, value])
    {
        if (!this.peers.has(id)) {
            throw new Error('Client does not exist', id);
        }

        const codeContainer = this.peers.get(id);
        codeContainer[fragment][key] = value;

        if (key === 'name') {
            codeContainer.updateName(value);
        } else {
            //codeContainer.draw();
        }
    }

    receive(msg)
    {
        const data = JSON.parse(msg);
        if (data.type === 'session-created') {
            window.location.hash = data.id;
        } else if (data.type === 'session-broadcast') {
            this.updateManager(data.peers);
        } else if (data.type === 'state-update') {
            this.updatePeer(data.clientId, data.fragment, data.state);
        }
    }

    send(data)
    {
        const msg = JSON.stringify(data);
        console.log('Sending message', msg);
        this.conn.send(msg);
    }
}
