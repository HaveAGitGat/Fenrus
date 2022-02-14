const express = require('express');
const Utils = require('../helpers/utils');
let Settings = require('../models/settings');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('groups', 
    { 
        title: 'Groups',        
        settings: Settings.getInstance(),
        Utils: new Utils()
    });    
});
  

router.post('/order', (req, res) => {

    let model = req.body;
    if(!model){
        res.status(400).send('Invalid data');
        return;
    }
    let uids = req.body.uids;
    let settings = Settings.getInstance();
    settings.Groups = settings.Groups.sort((a, b) => {
        let aIndex = uids.indexOf(a.Uid);
        let bIndex = uids.indexOf(b.Uid);
        if(aIndex == -1 && bIndex == -1){
            // not in the list
            aIndex = settings.Groups.indexOf(a);
            bIndex = settings.Groups.indexOf(b);
            return aIndex - bIndex;
        }
        if(bIndex < 0)
            return -1;
        if(aIndex < 0)
            return 1;
        return aIndex - bIndex;
    });

    settings.save();

    res.status(200).send('');
});
  

module.exports = router;