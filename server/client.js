class Client
{
    constructor(conn, id)
    {
        this.conn = conn;
        this.id = id;
        this.session = null;

        this.state = {
            user: {
              name: "",
              controls: {
                UP: false,
                DOWN: false,
                LEFT: false,
                RIGHT: false
              },
            }
        };
    }

    broadcast(data)
    {
        if (!this.session) {
            throw new Error('Can not broadcast without session');
        }

        data.clientId = this.id;

        [...this.session.clients]
            .filter(client => client !== this)
            .forEach(client => client.send(data));
    }

    send(data)
    {
        const msg = JSON.stringify(data);
        console.log(`Sending message ${msg}`);
        this.conn.send(msg, function ack(err) {
      		if (err) {
      			console.log('Error sending message', msg, err);
      		}
      	});
    }
}

module.exports = Client;
