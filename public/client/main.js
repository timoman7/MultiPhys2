const codeManager = new CodeManager(document);
const codeContainerLocal = codeManager.createUser();
codeContainerLocal.element.classList.add('local');
codeContainerLocal.run();

const connectionManager = new ConnectionManager(codeManager);
connectionManager.connect('ws://' + window.location.hostname + ':' + window.location.port);

const keyListener = (event) => {
        //console.log(event);
        const user = codeContainerLocal.user;
        user.updateCode(codeContainerLocal.editor.getValue(), (newCode) => {
          codeContainerLocal.updateCode(newCode);
        });
};
const userChangeName = (event) => {
  codeContainerLocal.updateName(codeContainerLocal.element.querySelector('.name').value);
};
codeContainerLocal.element.querySelector('.name').addEventListener('change', userChangeName);
document.addEventListener('keydown', keyListener);
document.addEventListener('keyup', keyListener);
