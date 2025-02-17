
let Utils = require('../helpers/utils');
let AppHelper = require('../helpers/appHelper');
let Globals = require("../Globals");

class Common
{
    getRouterArgs(req, customArgs)
    {
        let args = {         
            isHome:req.originalUrl === '/' || !req.originalUrl,
            isGuest: req.isGuest,
            theme: req.theme,
            themeVariables: {},
            user: req.user, 
            settings: req.settings,
            Utils: new Utils(),
            version: Globals.Version,
            AppHelper: AppHelper.getInstance()
        }

        if(customArgs){
            Object.keys(customArgs).forEach(x =>{
                args[x] = customArgs[x];
            });
        }

        return args;
    }
}

module.exports = new Common();