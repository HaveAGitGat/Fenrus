class Globals
{
    MajorVersion = 0;
    MinorVersion = 3;
    Revision = 0;
    Build = 0;

    Version;

    constructor(){
        console.log('new globals instance!');
    }
}


module.exports = new Globals();