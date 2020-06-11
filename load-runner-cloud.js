'use strict';

/**
 * $: Shortnand variable for common functionality.
 */
const $ = {
    //$.${0,1,2} will be used to encapsulate logging. 0=error, 1=warning, 2=informational
    /**
     * Error message handler
     * @param {string} message 
     */
    $0: function(message) { console.error(message) }, 
    /**
     * Warning message handler
     * @param {string} message 
     */
    $1: function(message) { console.error(message) }, 
    /**
     * Informational message handler
     * @param {string} message 
     */
    $2: function(message) { if ($.config.debug) console.log(message) },

    //set defaults
    /**
     * Configuration items
     * @property {boolean} debug Whether to print debug messages to the console
     * @property {string} server Server, typically loadrunner-cloud.saas.microfocus.com
     * @property {number} tenant Querysting value TENANTID (https://loadrunner-cloud.saas.microfocus.com/home/TENANTID=%3Ctenant%3E%&projectId=%3Cproject%3E) 
     * @property {number} project Querysting value projectId (https://loadrunner-cloud.saas.microfocus.com/home/TENANTID=%3Ctenant%3E%&projectId=%3Cproject%3E)
     * @property {string} user LRC account userid
     * @property {string} password LRC account password
     * @property {boolean} run Whether to run a loadtest upon PushToCloud method
     * @property {number} users Default vuser count for new loadtests
     * @property {number} duration Default duration for new loadtests
     */
    config: {   
        /** Whether to print debug messages to the console */
        debug: true,     
        /** Server, typically loadrunner-cloud.saas.microfocus.com */ 
        server: "stormrunner-load.saas.microfocus.com",
        /** Querysting value TENANTID (https://loadrunner-cloud.saas.microfocus.com/home/TENANTID=%3Ctenant%3E%&projectId=%3Cproject%3E) */
        tenant: "1",
        /** Querysting value projectId (https://loadrunner-cloud.saas.microfocus.com/home/TENANTID=%3Ctenant%3E%&projectId=%3Cproject%3E) */
        project: "1",
        /** LRC account userid */
        user: "saas@microfocus.com",
        /** LRC account password */
        password: "password",
        /** Whether to run a loadtest upon PushToCloud method */
        run: false,
        /** Default vuser count for new loadtests */
        users: 10,
        /** Default duration for new loadtests */
        duration: 30,
        /** Proxy */
        proxy: ""
    },

    //lazy initializations
    _fs: null,
    get fs() {
        if (this._fs == null) this._fs = require("fs");
        return this._fs;
    },
    _path: null,
    get path() {
        if (this._path == null) this._path = require("path");
        return this._path;
    },
    _util: null,
    get util() {
        if (this._util == null) this._util = require("util");
        return this._util;
    },
    _hb: null,
    get hb() {
        if (this._hb == null) this._hb = require("handlebars");
        return this._hb;
    },

    //request method wraps request module into a Promise
    _request: null,
    /**
     * Wraps request module into a Promise
     * @param {any} options request.options
     * @param {string} label label used for identification in messages
     * @param {any} data form-data
     * @param {boolean} parse call JSON.parse(.body) upon resolve
     * @returns {Promise<any>} Promise with the results of the http request
     */
    request: function (options, label, data = null, parse = false) {
        if (this._request == null) {
            this._request = require("request");
            if ($.config.proxy.length > 0) this.agent = new require('https-proxy-agent')($.config.proxy);
        }
        if ($.config.proxy.length > 0) {
            options.agent = this.agent;
            options.rejectUnauthorized = false;
        }
        //options.rejectUnauthorized = false
        //options.requestCert = true
        
        return new Promise((resolve, reject) => {
            var n = label;
            var r = this._request(options, (error, response, body) => {
                if (error) {
                    $.$0(n + " " +error);
                    reject(error);
                }
                var s = response.statusCode;
                if ((s >= 200)&&(s <= 299)) {     
                    $.$2(`${n}.statusCode: ${s}`);
                    resolve(parse ? JSON.parse(response.body) : response.body);
                } else {
                    $.$1(`${n}.statusCode = ${s}`);
                    $.$1(`${n}.body = ${JSON.stringify(response)}`);
                    reject(response);
                }
            });
            $.$2(`${n} requested.`);
            if (data!=null) {       //used to push form-data if necessary
                data.pipe(r);
                $.$2(`${n} piped.`);
            }
        });
    }

}


/**
 * Packages a source directory for uploading using either zip or 'npm pack'
 * @param {string} source source directory
 * @param {boolean} npm true: use 'npm pack' command (default=false)
 */
const bundle = async function (source, npm = false) {
    if (npm) {
        var p = $.path;
        var s = p.resolve(source);
        var d = p.dirname(s);
        var t = s.replace(d, "").replace(p.sep, "./");
        $.$2(`packing "${t}"`);
        const exec = require('child_process').exec;
        return new Promise((resolve, reject) => {
            exec(`npm pack ${t}`, { cwd: d }, (error, stdout, stderr) => {
                if (error) {
                    $.$1(error);
                    reject(error);
                }
                var f = d + p.sep + stdout.trim();
                $.$2(`zip file "${f}" created.`);
                resolve($.fs.createReadStream(f))
            });
        });
    } else {
        const { join } = $.path;
        const util = $.util;
        const jszip = require("jszip");
        const fs = require('fs');
        fs.readdir = util.promisify(fs.readdir)
        let { readdir } = fs;
        async function zip(dir) {
            var z = new jszip();
            const files = (await readdir(dir)).map(f => { 
                var b = join(dir, f)
                if ($.fs.lstatSync(b).isDirectory()==false) { 
                    z.file(f, $.fs.createReadStream(b, 'binary'));
                    $.$2('packaging \'' + f + '\'');
                }
                return b;
            }) 
            $.$2("zip.generateAsync()");
            return z.generateAsync({ type: 'nodebuffer', streamFiles: false })
        }
        $.$2('source \'' + source + '\'');
        return zip(source);
    }
}

/**
 * Logon to LoadRunnerCloud
 * @param {string} user userid (default=config.user)
 * @param {string} password password (default=config.password)
 * @param {boolean} force force new logon (default=false)
 * @returns {Promise<any>} Results of the logon request
 */
const logon = async function(user = $.config.user, password = $.config.password, force = false) {
    if (($.logon!=null) && ($.logon instanceof Promise) && !force) return $.logon
    $.logon = new Promise((resolve, reject) => {
        var n = "logon";
        $.$2(n + '.request()');
        var o = {
            method: 'POST',
            url: `https://${$.config.server}/v1/auth?TENANTID=${$.config.tenant}`,
            json: { "user": user, "password": password }
        }
        var l = $.request(o, n);
        Promise.all([l]).then(function(l){ 
            $.token = l[0].token;
            resolve($.token);
        }).catch((error)=>{ error = error.body||error; $.$0("error"+error); reject(error); })
    });
    return $.logon;
}


/**
 * Upload a script asset to LoadRunnerCloud
 * @param {string} name Desired name of script asset
 * @param {stream} stream Stream to upload (use .package method)
 * @param {string} token Token from logon
 */
const upload = function (name, stream, token = $.token) {
    var n = "upload";
    $.$2(n + '.request()');
    var o = {
        method: 'POST',
        url: `https://${$.config.server}/v1/projects/${$.config.project}/scripts?TENANTID=${$.config.tenant}`,
        headers: { "accept": "application/json", "Cookie": `LWSSO_COOKIE_KEY=${token}`}
    }
    var f = new require('form-data')();
    f.append('file', stream, { filename: `${name}.zip`, contentType: 'application/x-zip-compressed' });
    $.$2(`${n} data appended as "${name}".`);

    o.headers["Content-Type"] = `multipart/form-data; boundary="${f._boundary}"`;
    $.$2(n + ' headers set.');
    
    return $.request(o, n, f, true);
}
/**
 * Create new loadtest in LoadRunnerCloud
 * @param {string} name Desired name of loadtest
 * @param {string} token Token from logon
 */
const loadtest = function (name, token = $.token) {
    var n = "loadtest";
    $.$2(n + '.request()');
    var o = {
        method: 'POST',
        url: `https://${$.config.server}/v1/projects/${$.config.project}/load-tests?TENANTID=${$.config.tenant}`,
        headers: { "accept": "application/json", "Cookie": `LWSSO_COOKIE_KEY=${token}` },
        json: { "name": name }
    }
    return $.request(o, n);
}


/**
 * Bind a script asset to a loadtest in LoadRunnerCloud
 * @param {number} testid Load test id
 * @param {number} scriptid Script asset id
 * @param {string} token Token from logon
 */
const bindupload = function (testid, scriptid, token = $.token) {
    var n = "bindupload"
    $.$2(n + '.request()');
    var o = {
        method: 'POST',
        url: `https://${$.config.server}/v1/projects/${$.config.project}/load-tests/${testid}/scripts?TENANTID=${$.config.tenant}`,
        headers: { "accept": "application/json", "Cookie": `LWSSO_COOKIE_KEY=${token}` },
        json: {
            "scriptId": scriptid,
            "vusersNum": $.config.users,
            "startTime": 0,
            "rampUp": {
                "duration": 10
            },
            "duration": $.config.duration,
            "tearDown": {
                "duration": 10
            },
            "pacing": 2,
            "isLocalPacingEnabled": true,
            "isLocalRtsEnabled": true,
            "locationType": 0
        }
    }
    return $.request(o, n);
}
/**
 * Runs a loadtest in LoadRunnerCloud
 * @param {number} testid Load test id
 * @param {string} token Token from logon
 */
const runtest = function (testid, token = $.token) {
    var n = "runtest";
    $.$2(n + '.request()');
    var o = {
            method: 'POST',
            url: `https://${$.config.server}/v1/projects/${$.config.project}/load-tests/${testid}/runs?TENANTID=${$.config.tenant}`,
            headers: { "accept": "application/json", "Cookie": `LWSSO_COOKIE_KEY=${token}` }
    }
    return $.request(o, n, null, true);
}

/**
 * Creates a timestamp string for use in naming conventions
 */
const timestamp = function() {
    var d = new Date();
    return (d.getFullYear() +
        ("00" + (d.getMonth() + 1)).slice(-2) +
        ("00" + d.getDate()).slice(-2) + "_" +
        ("00" + d.getHours()).slice(-2) +
        ("00" + d.getMinutes()).slice(-2) +
        ("00" + d.getSeconds()).slice(-2)
        + "_" + ("000" + d.getMilliseconds()).slice(-3)
    );
}


module.exports = {
    /**
     * Configuration items
     * @property {boolean} debug Whether to print debug messages to the console
     * @property {string} server Server, typically loadrunner-cloud.saas.microfocus.com
     * @property {number} tenant Querysting value TENANTID (https://loadrunner-cloud.saas.microfocus.com/home/TENANTID=%3Ctenant%3E%&projectId=%3Cproject%3E) 
     * @property {number} project Querysting value projectId (https://loadrunner-cloud.saas.microfocus.com/home/TENANTID=%3Ctenant%3E%&projectId=%3Cproject%3E)
     * @property {string} user LRC account userid
     * @property {string} password LRC account password
     * @property {boolean} run Whether to run a loadtest upon PushToCloud method
     * @property {number} users Default vuser count for new loadtests
     * @property {number} duration Default duration for new loadtests
     */
    get config() {
        return $.config;
    },
    set config(value) {
        if (typeof value !== "undefined") {
            Object.keys(value).forEach(function(key,index) {
                if (typeof $.config[key] !== "undefined") $.config[key]=value[key];
            });
        }
    }
}


/**
 * Module for processing swagger files
 */
module.exports.swagger = {
    /**
     * Creates a DevWeb script from a swagger definition
     * @param {string} source Swagger file in .json or .yml format
     * @param {string} destination Target folder name
     */
    toDevWeb: function (source, destination) {

        //internal function to build default values
        function defaultValue(item) {
            return  (item.default != null) ? item.default.toString() :
                    (item.example != null) ? item.example.toString() :
                    "{" + item.name.toString() + "}";
        }
        //loop through properties
        function recurseProperties(properties) {
            var r = {};
            for (var n in properties) {
                var p = properties[n];
                switch (p.type) {
                    case "object":
                        r[n] = recurseProperties(p.properties)
                        break;
                    //TODO: test array handling
                    default:
                        p.name = n;
                        r[n] = defaultValue(p);
                        break;
                }
            }
            return r;
        }

        var fs = $.fs
        var hb = $.hb
        const parser = require("swagger-parser");
        parser.validate(source, (err, api) => {
            if (err) {
                $.$0(err);
            }
            else {
                var data = [];

                //loop through schemes
                var schemes = api.schemes;
                if (schemes == null) schemes = ['https'];
                schemes = schemes.map(function (x) { return x.toString().toLowerCase() });
                var scheme = 'http' + (schemes.includes('https') ? 's' : '')
                var url = scheme + ":\/\/" + api.host + api.basePath;

                //loop through paths
                var paths = api.paths;
                for (var path in paths) {
                    for (var method in paths[path]) {

                        //each of these will get transposed into http request code
                        var operation = paths[path][method];
                        var headers = {};
                        var payload = "";
                        var params = {};
                        var query = [];
                        operation.path = path;
                        if (operation.parameters!=null) {
                            operation.parameters.forEach(function (item) {
                                switch (item.in) {
                                    case "header":
                                        headers[item.name] = (item.default == null) ? "<" + item.name.toString() + "\/>" : item.default.toString();
                                        break;
                                    case "body":
                                        switch (item.schema.type.toLowerCase()) {
                                            case "object":
                                                payload = recurseProperties(item.schema.properties);
                                                break;
                                            case "array":
                                                payload = []
                                                payload.push(defaultValue(item.items));
                                                break;
                                            default:
                                                payload = defaultValue(item);
                                                break;
                                        }
                                        break;
                                    case "path": //replace {name} with params.name
                                        params[item.name]=defaultValue(item);
                                        operation.path = operation.path.replace(new RegExp("{"+item.name+"}", "ig"), "\"+params."+item.name+"+\"");
                                        break;
                                    case "query": 
                                        params[item.name]=defaultValue(item);
                                        query.push(item.name+'="+encodeURI(params.'+item.name+')')
                                        break;
                                }
                            });
                        }
                        //format any querystring params
                        if (query.length>0) {
                            query = query.join('+"&');
                            operation.path += operation.path.includes('?') ? "&" : "?"
                            operation.path += query+'+"';
                        }
                        var item = { "method": method.toUpperCase(), "path": operation.path, "headers": JSON.stringify(headers), "payload": JSON.stringify(payload), "summary": operation.summary, "operationId": operation.operationId, "params": JSON.stringify(params) };
                        data.push(item);
                    }
                }
                
                //Handlebars templates
                var names = ['main', 'action', 'webrequest'];
                var template = {};
                for (var i = 0; i < names.length; i++) {
                    template[names[i]] = hb.compile(fs.readFileSync(`./template/${names[i]}.template`, 'utf8'));
                }
                
                //output variable to hold javascript
                var output = "";
                
                //write all the webrequests
                for (var i = 0; i < data.length; i++) {
                    data[i].id = i+1;
                    output += "\n"+template.webrequest(data[i]);
                }
                //add webrequests to action
                output = template.action({ webrequest: output })
                //add action to main
                output = template.main({ action: output })
                

                //setup the target destination folder
                var d = destination
                if (!fs.existsSync(d)) fs.mkdirSync(d);
                var path = require('path');
                d = path.resolve(d)+path.sep;

                //write output to file
                fs.writeFileSync(d+'main.js', output);
                fs.writeFileSync(d+'url.json', JSON.stringify({
                    "host":  api.host,
                    "basePath": api.basePath,
                    "scheme": scheme
                }));

                //copy other relevant files
                var names = ['rts.yml', 'scenario.yml', 'TruWebSdk.d.ts', 'parameters.yml', 'data.csv'];
                for (var i = 0; i < names.length; i++) {
                    fs.copyFileSync("./template/"+names[i],d+"/"+names[i]);
                }

                //copy the original swagger file to destination
                var yaml = parser.YAML;
                fs.writeFileSync(d+'/swagger-source.yml', yaml.stringify(api))
                
            }
        });
    }
}


/**
 * Packages a directory as a script asset and uploads to LoadRunnerCloud, creating a loadtest with script bindings.
 * @param {string} source Source directory to package.
 * @param {string} assetname Script asset target name (default=use naming convention)
 * @param {string} testname Loadtest target name (default=use naming convention)
 * @param {boolean} run Run the test upon upload (default=false)
 * @param {boolean} npm Package using 'npm pack', otherwise a standard zip file (default=false)
 */
const PushToCloud = async function(source, assetname = null, testname = null, run = $.config.runtest, npm = false) {
    
    return (new Promise(async (resolve, reject) => {
        
        //promise w/directory stats
        function lstat() { 
                return new Promise((resolve, reject) => {
                $.fs.lstat(source, (error, stats) => {
                    if (error) reject(error);
                    resolve(stats);
                })
            })
        }
        //handles errors
        function $0(error) {
            $.$0(error);
            reject(error);
        }        
        try 
        {
            //check that source is a directory
            if ((await lstat()).isDirectory()==false) throw `"${source}" is not a directory.`
            
            //build naming conventions if names not supplied
            var t=timestamp();
            if ((assetname==null)||(assetname.toString().trim().length==0)) { assetname=`Auto-Gen-Script [${$.config.user}] ${t}` }
            if ((testname==null)||(testname.toString().trim().length==0)) { testname=`Auto-Gen-Test [${$.config.user}] ${t}` }
            
            //bundle and logon can be performed independently
            let s = bundle(source,npm);
            let l = logon()
            
            Promise.all([s, l]).then(function(outer){   //both the packaging and logon must be completed before moving on
                let u = upload(assetname,outer[0]);
                let t = loadtest(testname);
                Promise.all([u, t]).then(async function(inner){     //both the upload (script asset creation) and loadtest must be completed
                    let b = await bindupload(inner[1].id, inner[0].id);     //bind the script to the test
                    let x = {upload: inner[0], loadtest: inner[1], bindupload: b}
                    if (run) { let r = await runtest(inner[1].id); x.runtest = r; }    //run if specified
                    $.$2(x)
                    resolve(x);
                    return;
                }).catch((error)=>{ return $0(error) })
            }).catch((error)=>{ return $0(error) })
            
        } 
        catch (error) 
        {
            return $0(error)
        }
    }));
}
module.exports.PushToCloud = PushToCloud;

module.exports.Logon = logon

