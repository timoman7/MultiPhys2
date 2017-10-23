class CodeContainer
{
    constructor(element)
    {
        this.element = element;
        console.log(this.element.querySelector('canvas'));
        this.canvas = element.querySelector('canvas');
        this.context = this.canvas.getContext('2d');

        this.user = new User(this);
        this.user.events.listen('name', name => {
            this.updateName(name);
        });

        let lastTime = 0;
        this._update = (time = 0) => {
            const deltaTime = time - lastTime;
            lastTime = time;

            this.user.update(deltaTime);

            requestAnimationFrame(this._update);
        };

        this.updateName(0);
    }

    run()
    {
        this._update();
    }

    serialize()
    {
        return {
            user: {
                name: this.user.name,
                code: this.user.code,
                caret: this.user.caret,
            },
        };
    }

    unserialize(state)
    {
        this.user = Object.assign(state.user);
        this.updateName(this.user.name);
    }

    updateCode(code){
        this.user.events.emit('code', code);
        // this.element.querySelector('.code').querySelector('.ace_text-input').innerHTML = code;
        // console.log(this.element.querySelector('.code').querySelector('.ace_text-input').innerHTML);
        // this.element.querySelector('.code').querySelector('.ace_text-input').innerHTML = this.element.querySelector('.code').value;
    }

    updateName(name)
    {
        //this.user.events.emit('name', name);
    }
}
