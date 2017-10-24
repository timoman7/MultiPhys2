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
        };
        this._controls = {
          UP: "KeyW",
          DOWN: "KeyS",
          LEFT: "KeyA",
          RIGHT: "KeyD",
        };
        this._controlList = [
          "KeyW",
          "KeyS",
          "KeyA",
          "KeyD",
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
