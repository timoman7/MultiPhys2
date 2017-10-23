const localUser = new User("Tim");

const connectionManager = new ConnectionManager(localUser);
connectionManager.connect('ws://' + window.location.hostname + ':' + window.location.port);

const keyListener = (event) => {
      //console.log(event);
      const user = localUser;
      user.keyPress(event.code, event.type);
};
document.addEventListener('keydown', keyListener);
document.addEventListener('keyup', keyListener);
