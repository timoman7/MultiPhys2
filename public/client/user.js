class User
{
    constructor(name)
    {
        this.events = new _Events;

        this.name = name;
        this.controls = {
          UP: false,
          DOWN: false,
          LEFT: false,
          RIGHT: false,
          SPIN_LEFT: false,
          SPIN_RIGHT: false,
        };
        this._controls = {
          UP: "KeyW",
          DOWN: "KeyS",
          LEFT: "KeyA",
          RIGHT: "KeyD",
          SPIN_LEFT: "KeyQ",
          SPIN_RIGHT: "KeyE",
        };
        this._controlList = [
          "KeyW",
          "KeyS",
          "KeyA",
          "KeyD",
          "KeyQ",
          "KeyE",
        ];
    }

    keyPress(key, state){
      if(this._controlList.includes(key)){
        for(let dir in this.controls){
          if(this._controls[dir] === key){
            if(state === "keydown"){
              this.controls[dir] = true;
            }else if(state === "keyup"){
              this.controls[dir] = false;
            }
          }
        }
        this.events.emit("controls", this.controls);
      }
    }

    serialize(){
      return {
        user:{
          name: this.name,
          controls: this.controls,
        }
      };
    }
}
