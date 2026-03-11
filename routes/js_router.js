"use strict";
const v_pjson = require('../package.json');
let v_express = require('express');
let v_router = v_express.Router();

function fn_errorPage(v_res, isApiRequest = false) {
    v_res.status(404);
    if (isApiRequest) {
        v_res.json({
            [global.c_CONSTANTS.CONST_ERROR]: global.c_CONSTANTS.CONST_ERROR_NOT_FOUND,
            [global.c_CONSTANTS.CONST_ERROR_MSG]: 'API endpoint not found',
            [global.c_CONSTANTS.CONST_COMMAND]: 'error'
        });
    } else {
        v_res.render('pages/404', { title: 'DE 404', message: 'This page does not exist.' });
    }
}

function fn_create(app) {

    const health_url = global.m_serverconfig.m_configuration.health_utl?global.m_serverconfig.m_configuration.health_utl:'/h';
    
    app.use(v_router);

    // Normalize trailing slash so /w/wl/ matches /w/wl (must run before route handlers)
    app.use((req, res, next) => {
        if (req.path.endsWith('/') && req.path.length > 1) {
            const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
            req.url = req.path.slice(0, -1) + query;
        }
        next();
    });

    // Health-check endpoint
    app.get(`${health_url}/health`, (req, res) => {
        res.status(200).json({
            status: 'OK',
            version: v_pjson.version,
            server_id: global.m_serverconfig.m_configuration.server_id
        });
    });

    

    app.use('/public', v_express.static('public'));

    // Mount web and agent routes without extra prefix,
    // because their own paths already include /w and /agent.
    app.use(require('./js_router_web'));
    app.use(require('./js_router_agent'));

    // Catch-all for unmatched routes
    app.use((v_req, v_res, next) => {
        const isApiRequest = v_req.originalUrl.startsWith(global.c_CONSTANTS.CONST_WEB_FUNCTION);
        fn_errorPage(v_res, isApiRequest);
    });
}

module.exports = {
    fn_create: fn_create,
    fn_errorPage: fn_errorPage,
    m_Router: v_router
};