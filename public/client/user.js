class User
{
    constructor(codeContainer)
    {
        this.events = new Events;

        this.codeContainer = codeContainer;

        this.caret = 0;
        this.code = "";
        this.name = "";
    }

    updateCode(code, callback)
    {
      this.code = code;
      callback(this.code);
    }

    update(deltaTime)
    {
        //console.log(this.codeContainer);
    }
}
