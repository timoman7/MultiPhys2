class CodeManager
{
    constructor(document)
    {
        this.document = document;
        this.template = this.document.querySelector('#user-template');

        this.instances = [];
    }

    createUser()
    {
        const element = document
            .importNode(this.template.content, true)
            .children[0];
        const codeContainer = new CodeContainer(element);
        this.document.body.appendChild(codeContainer.element);

        this.instances.push(codeContainer);
        this.addEditor = function(){
            console.log(codeContainer);
            if(ace){
              var editor = ace.edit("editor");
              editor.session.setMode("ace/mode/javascript");
            }
            codeContainer.editor = editor;
        };
        setTimeout(this.addEditor,100);
        return codeContainer;
    }

    removeUser(codeContainer)
    {
        this.document.body.removeChild(codeContainer.element);

        this.instances = this.instances.filter(instance => instance !== codeContainer);
    }

    sortUsers(collab)
    {
        collab.forEach(codeContainer => {
            this.document.body.appendChild(codeContainer.element);
        });
    }
}
