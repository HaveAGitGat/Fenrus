const express = require('express');
const fetch = require('node-fetch');

let Utils = require('../helpers/utils');
let AppHelper = require('../helpers/appHelper');
const path = require('path');

const router = express.Router();

let instances = {};

function getInstance(app, appInstance){    
    if(!appInstance){
        // this can be null if testing an app that has not yet been added        
        let classType = require(`../apps/${app.Directory}/code.js`);
        return new classType();
    }
    if(instances[appInstance.Uid])
        return instances[appInstance.Uid];

    let classType = require(`../apps/${app.Directory}/code.js`);
    instances[appInstance.Uid] = new classType();
    return instances[appInstance.Uid];
}

function getAppArgs(appInstance, settings){
    let url = appInstance.Url;
    let utils = new Utils();
    let funcArgs = {
        url: url,
        properties: appInstance.Properties,
        Utils: utils,
        linkTarget: settings.LinkTarget,
        appIcon: appInstance.Icon,
        size: appInstance.Size,
        liveStats: (items) => {            
            let html = '<ul class="livestats">';
            for (let item of items) {
                
                for(let i=0;i<item.length;i++){
                    if(/^:html:/.test(item[i]) == false)
                        item[i] = utils.htmlEncode(item[i]);
                    else
                        item[i] = item[i].substring(6);
                }
                if(item.length ===  1)
                {
                    // special case, this is doing a span
                    html += `<li><span class="title span">${item[0]}</span</li>`;
                } else {
                    html += `<li><span class="title">${item[0]}</span><span class="value">${item[1]}</span></li>`;
                }
            }
            html += '</ul>';
            return html;
        },      
        carousel: (items) => {
            let id = utils.newGuid().replaceAll('-', '');
            let html = `:carousel:${id}:<div class="carousel" id="${id}">`;
            let controls = '<div class="controls" onclick="event.stopImmediatePropagation();return false;">';
            let count = 0;
            for(let item of items){
                let itemId = utils.newGuid();
                html += `<div class="item ${count === 0 ? 'visible initial' : ''}" id="${id}-${count}">`;
                html += item
                html += '</div>';
                controls += `<a href="#${itemId}" class="${count === 0 ? 'selected' : ''}" onclick="carouselItem(event, '${id}', ${count})"></a>`;
                ++count;
            }
            controls += '</div>';
            html += controls;
            html += '</div>';
            return html;
        },
        fetch: (args) => {
            if(typeof(args) === 'string')
                args = { url: args };
            
            if (!args.url.startsWith('http')) {
                if (url.endsWith('/') == false)
                    args.url = url + '/' + args.url;
                else
                    args.url = url + args.url;
            }
            if (!args.headers)
                args.headers = { 'Accept': 'application/json' };
            else if (!args.headers['Accept'])
                args.headers['Accept'] = 'application/json';
            console.log(`REQUEST [${args.method || 'GET'}]: ${args.url}`);
            return fetch(args.url, {
                headers: args.headers,
                method: args.method,
                body: args.body
            }).then(res => {
				if(args.headers['Accept'].includes('json'))
					return res.json();
				else
					return res;
			}).catch(error => {
                console.log('error: ' + error);
            });
        }
    }
    return funcArgs;
}

router.get('/:appName/app.css', (req, res) => {    
    let app = req.app;
    let file = `../apps/${app.Directory}/app.css`;
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache header
    res.sendFile(path.resolve(__dirname, file));
});


router.post('/:appName/test', async (req, res) => {
    let app = req.app;
    let appInstance = req.body.AppInstance;   
    
    let instance = getInstance(app, appInstance);
    
    let funcArgs = getAppArgs(appInstance, req.settings);
    let msg = '';
    try
    {
        let result = await instance.test(funcArgs);   
        console.log('test result', result);
        if(result){
            res.status(200).send('').end();
            return;
        }        
    }
    catch(err){ msg = err; }
    res.status(500).send(msg).end();
});

router.get('/:appName/:uid/status', async (req, res) => {    
    let app = req.app;        
    let appInstance = req.appInstance;   

    let instance = getInstance(app, appInstance);

    let funcArgs = getAppArgs(appInstance, req.settings);
    try
    {
        let result = await instance.status(funcArgs);        
        res.send(result || '').end();
    }
    catch(err){}
});


router.get('/:appName/:icon', (req, res) => {    
    let app = req.app;
    let file = `../apps/${app.Directory}/${app.Icon}`;
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache header
    res.sendFile(path.resolve(__dirname, file));
});


router.param('appName', (req, res, next, appName) => {
    let app = AppHelper.getInstance().get(appName);
    
    if(!app){
        res.status(404).send("App not found").end();
        return;
    }
    req.app = app;
    next();
});

router.param('uid', (req, res, next, uid) => {
    
    let appInstance = req.settings.findAppInstance(uid);
    if(!appInstance){
        res.status(404).send("App instance not found: " + uid).end();
        return;
    }
    req.appInstance = appInstance;
    next();
})


module.exports = router;
