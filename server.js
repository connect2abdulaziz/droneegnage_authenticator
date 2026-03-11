const v_pjson = require('./package.json');

global.c_CONSTANTS      = require ("./js_constants");
global.Colors           = require ("./helpers/js_colors.js").Colors;
global.m_serverconfig   = require ('./js_serverConfig.js'); 
global.m_authServer     = require ('./auth_server/js_auth_server');

var v_configFileName = global.m_serverconfig.getFileName();

process.once('SIGINT', function(err) {
    if (global.m_logger) global.m_logger.Warn('SIGINT.');
    process.exit(err ? 1 : 0);
 });

 
/**
 * launch express server. core of everything
 */
function fn_startExpressServer ()
{
    //to view es6 capabilities see http://node.green/
    //node v8-options es6 module syntax currently under development (2016/06/25)
    const v_path              = require('path');
    const v_express           = require('express');
    const v_ejsLayouts        = require('express-ejs-layouts');
    const v_cookieParser      = require('cookie-parser');
    const v_bodyParser        = require('body-parser');
    const c_router            = require('./routes/js_router');
    const c_cors              = require('cors')
    const c_helmet            = require('helmet')



    //setup
    const c_app      = v_express();
    c_app.use(c_helmet())

    // Please check this for more details:
    // https://www.html5rocks.com/en/tutorials/security/content-security-policy/
    c_app.use(c_helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'none'"],
          scriptSrc: ["'none'"],
          upgradeInsecureRequests: true,
          workerSrc: false
        }
      }))


    //settings
    const cfg = global.m_serverconfig.m_configuration;
    const v_port = process.env.PORT ? parseInt(process.env.PORT, 10) : cfg.server_port;
    c_app.set('port', v_port);
    c_app.set('views', v_path.join(__dirname, 'views'));
    
    //view engine & main template
    c_app.set('view engine', 'ejs');
    c_app.set('layout', 'template');
    c_app.use(v_ejsLayouts);
    c_app.use(c_cors())

    //middleware
    c_app.use(v_bodyParser.json());
    c_app.use(v_bodyParser.urlencoded({ extended: false }));
    c_app.use(v_cookieParser());

    //router
    c_router.fn_create(c_app);

    const v_fs = require('fs');
    const keyPath = v_path.join(__dirname, cfg.ssl_key_file || '');
    const certPath = v_path.join(__dirname, cfg.ssl_cert_file || '');
    const useSSL = cfg.enable_SSL === true && v_fs.existsSync(keyPath) && v_fs.existsSync(certPath);
    let v_server;

    if (useSSL) {
        const v_https = require('https');
        console.log (global.Colors.Log + "READING " + cfg.ssl_key_file + global.Colors.Reset);
        const v_keyFile = v_fs.readFileSync(keyPath);
        console.log (global.Colors.Log + "READING " + cfg.ssl_cert_file + global.Colors.Reset);
        const v_certFile = v_fs.readFileSync(certPath);
        const v_options = { key: v_keyFile, cert: v_certFile };
        v_server = v_https.createServer(v_options, c_app);
    } else {
        if (cfg.enable_SSL === true && (!v_fs.existsSync(keyPath) || !v_fs.existsSync(certPath))) {
            console.log (global.Colors.FgYellow + "SSL enabled but key/cert files missing – starting HTTP (e.g. behind Railway TLS)" + global.Colors.Reset);
        }
        const v_http = require('http');
        v_server = v_http.createServer(c_app);
    }

    // start listening
    v_server.listen(c_app.get('port'));


    console.log (global.Colors.Success + "[OK] Web Server Started" + global.Colors.Reset);

    return v_server;
}


function fn_displayHelp ()
{
    console.log ("==============================================");
    console.log (global.Colors.Bright + "DE Authentication Server version " +  JSON.stringify(v_pjson.version) + global.Colors.Reset);
    console.log ("----------------------------------");
    console.log ("--config=config_filename config file ");
    console.log ("-h help ");
    console.log ("-v version");
    console.log ("==============================================");
}


function fn_displayInfo ()
{
    console.log ("==============================================");
    console.log (global.Colors.Bright + "DE Authentication Server version " +  JSON.stringify(v_pjson.version) + global.Colors.Reset);
    console.log ("----------------------------------");
    console.log ("Server Name  " + global.Colors.BSuccess + global.m_serverconfig.m_configuration.server_id + global.Colors.Reset);
    console.log ("listening on ip: " + global.Colors.BSuccess +  global.m_serverconfig.m_configuration.server_ip + global.Colors.Reset + " port: " + global.Colors.BSuccess + global.m_serverconfig.m_configuration.server_port + global.Colors.Reset);
    console.log ("S2S WS ip: "  + global.Colors.BSuccess +  global.m_serverconfig.m_configuration.s2s_ws_listening_ip  + global.Colors.Reset + " port: " + global.Colors.BSuccess + global.m_serverconfig.m_configuration.s2s_ws_listening_port + global.Colors.Reset);
    
    if (global.m_serverconfig.m_configuration.enableLog!==true)
    {
        console.log ("logging is " + global.Colors.FgYellow + 'disabled' + global.Colors.Reset);
    }
    else
    {

        global.m_logger         = require ('node-file-logger');

        const options = {
            timeZone: global.m_serverconfig.m_configuration.log_timeZone==null?'GMT':global.m_serverconfig.m_configuration.log_timeZone,      
            folderPath: global.m_serverconfig.m_configuration.log_directory==null?'./log':global.m_serverconfig.m_configuration.log_directory,      
            dateBasedFileNaming: true,
            // Required only if dateBasedFileNaming is set to false
            fileName: 'All_Logs',   
            // Required only if dateBasedFileNaming is set to true
            fileNamePrefix: 'Logs_',
            fileNameSuffix: '',
            fileNameExtension: '.log',     
            
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm:ss.SSS',
            // Allowed values - debug, prod, prod-trace (Details below)
            // prod: Only 'warn', 'info', 'error' and 'fatal' messages are logged. 'debug' and 'trace' messages are not logged.
            logLevel: global.m_serverconfig.m_configuration.log_detailed==true?'debug':'prod',
            // If set to false then messages are logged to console as well
            onlyFileLogging: true 
          };
        
        global.m_logger.SetUserOptions(options); 

        console.log ("logging is " + global.Colors.FgYellow + 'enabled' + global.Colors.Reset);
    }
    console.log ("Datetime: %s", new Date());
    console.log ("==============================================");
    if ((m_serverconfig.m_configuration.account_storage_type!=null) && (typeof(m_serverconfig.m_configuration.account_storage_type) == 'string'))
    {
        
        console.log (" account_storage_type is " + global.Colors.FgYellow + m_serverconfig.m_configuration.account_storage_type.toLowerCase() + global.Colors.Reset);
    }
    else
    {
        console.log (global.Colors.BError + "FATAL ERROR:" + global.Colors.FgYellow + " account_storage_type " +  global.Colors.Reset + " is not specified in config file. ");
        process.exit(0);
    }

    if (global.m_logger) global.m_logger.Info('System Started.');
}

function fn_parseArgs()
{
    const c_args = require ('./helpers/hlp_args.js');
    let cmds = c_args.getArgs();
    if (cmds.hasOwnProperty('h') || cmds.hasOwnProperty('help'))
    {

        fn_displayHelp();
        
        process.exit(0);
    }

    if (cmds.hasOwnProperty('v') || cmds.hasOwnProperty('version'))
    {

        console.log ("Andruav Authentication Server version: " + JSON.stringify(v_pjson.version));
        
        process.exit(0);
    }


    if (cmds.hasOwnProperty('config') )
    {
        v_configFileName = cmds.config;
    }


}



/**
 * start parsing input and lauch app.
 */
function fn_start ()
{
    // parse input arguments
    fn_parseArgs();

    // load server configuration
    global.m_serverconfig.init(v_configFileName);

    // On platforms like Railway, override ports with PORT env if present
    if (process.env.PORT) {
        const p = parseInt(process.env.PORT, 10);
        if (!Number.isNaN(p)) {
            global.m_serverconfig.m_configuration.server_port = p;
            global.m_serverconfig.m_configuration.s2s_ws_listening_port = p;
        }
    }

    // display info
    fn_displayInfo();

    // load express server and get HTTPS instance
	const v_httpsServer = fn_startExpressServer();

    // start auth server and attach S2S WebSocket listener
    global.m_authServer.fn_startServer(v_httpsServer);

}


fn_start();





