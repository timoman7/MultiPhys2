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
window.Engine = Engine,
  window.Render = Render,
  window.Runner = Runner,
  window.Events = Events,
  window.Composites = Composites,
  window.Common = Common,
  window.MouseConstraint = MouseConstraint,
  window.Mouse = Mouse,
  window.World = World,
  window.Vector = Vector,
  window.Bounds = Bounds,
  window.Bodies = Bodies;
window.engine = Engine.create();

window.DEBUG = false;
document.querySelector("#debug").addEventListener("click", (event) =>{
  window.DEBUG = event.target.checked ? true : false;
});
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
