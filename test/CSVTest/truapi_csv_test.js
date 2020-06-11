'use strict';

var _ = require('underscore'),
  path = require('path'),
  async = require('async'),
  csvRd = require('ya-csv'),
  http = require('http'),
  url = require('url');

exports = module.exports = function (vuser) {
  var vuserId, testItems, proxy, errIdCSV, errIdReq, errIdHttp;

  /* error IDs */
  errIdCSV  = 10;
  errIdReq  = 20;
  errIdHttp = 21;
 
  /* prepare test data */
  vuserId = vuser.getVUserId();
  proxy =  process.env.http_proxy;
  testItems = [];

  function addTestItem(opts) {
    var testItem, item, svc;

    opts = opts || {};
    item = opts.item;
    svc = opts.svc;

    /* Example of the csv Item:
     *   - METHOD: 'GET'
     *   - URL: 'http://httpbin.org/get'
     *   - HEADERS: '{key: 123}'
     *   - PAYLOAD: 'Test'
     *   - TRANSACTION:  transaction1
     *   - THINKTIME:  100
     */
    testItem = {
      method: (item['METHOD'] || 'GET').trim().toUpperCase(),
      url: (function () {
        var urlItem, urlData, protocol, href;
        urlItem = (item['URL'] || '').trim();
        if (!_.isString(urlItem) || _.isEmpty(urlItem)) {
          return undefined;
        }
        urlData = url.parse(urlItem);
        if (!urlData.protocol) {
          urlData = url.parse('http://' + urlItem);
        }
        if (!urlData.protocol || !urlData.href) {
          return undefined;
        }
        protocol = urlData.protocol.toLowerCase();
        if (protocol !== 'http:' && protocol !== 'https:') {
          /* Invalid protocol */
          return undefined;
        }
        href = urlData.href.toString();
        return href.length > 0 ? href : undefined;
      })(),
      tran: (function() {
        var data = (item['TRANSACTION'] || '').trim();
        if (!data || !_.isString(data) || _.isEmpty(data)) {
          return undefined;
        }
        return data;
      })(),
      hdr: (function () {
        var headers = (item['HEADERS'] || '').trim();
        if (!_.isString(headers) || _.isEmpty(headers)) {
          return undefined;
        }
        try { return JSON.parse(headers); }
        catch (ignore) { return undefined; }
      })(),
      payload: (function () {
        var data = (item['PAYLOAD'] || '').trim();
        if (!_.isString(data) || _.isEmpty(data)) {
          return undefined;
        }
        return data;
      })(),
      thinkTime: (function () {
        var num, data;
        data = (item['THINKTIME'] || '').trim();
        if (!_.isString(data) || _.isEmpty(data)) {
          return undefined;
        }
        try {  num = Number(data); }
        catch (ignore) { return undefined; }
        return _.isNaN(num) || num < 0 ? undefined : num;
      })()
    };
    if (!testItem.url || _.isEmpty(testItem.url)) {
      return;
    }
    testItems.push(testItem);
  }
 
  function loadCSVData(opts, callback) {
    var csvFilename, csvRd, testCSV;
    
    callback = callback || function () {};
    opts = opts || {};
    csvFilename = opts.filename;
    csvRd = opts.csvRd;
    
    testCSV = csvRd.createCsvFileReader(csvFilename, {
      columnsFromHeader: true
    });
    testCSV.on('data', function (data) {
      var upperCase;
      if (data) {
        upperCase = {};
        _.each(_.keys(data), function (item) {
          upperCase[item.toString().toUpperCase()] = data[item];
        });
        addTestItem({item: upperCase, svc: opts.svc });
      }
    }).on('end', function () {
      callback();
      callback = function () {};
    }).on('error', function (err) {
      callback(err);
      callback = function () {};
    });
  }

  /* init action */
  vuser.init('Vuser init action', function (svc, done) {
    var csvFilename;
  
    /* load test items from the csv file */
    csvFilename = path.resolve(__dirname, 'test.csv');
    loadCSVData({
      csvRd: csvRd,
      filename: csvFilename,
      svc: svc
    }, function (err) {
      if (err) {
        svc.logger.error(errIdCSV, 'Cannot load csv data: %s', err.toString());
      }
      else {
        svc.logger.info('Load csv test data: %j', testItems);
      }
      done();
    });
  });

  /* main action */
  vuser.action('Vuser main action', function (svc, done) {
    var tasks, lastTranName, lastTranStatus;
    
    tasks = [];
    lastTranName = undefined;
    lastTranStatus = svc.transaction.PASS;

    _.each(testItems, function (testItem) {
      tasks.push(function (callback) {
        var reqOpts, tran;

        callback = callback || function () {};
        reqOpts = {
          proxy: proxy,
          url: testItem.url,
          method: testItem.method,
          headers: testItem.hdr,
          body: testItem.payload
        };
        tran = testItem.tran;
        function sndReq() {
          svc.request(reqOpts, function (err, res, body) {
            if (err) {
              svc.logger.error(errIdReq, 'HTTP request error: %s', err.toString());
              lastTranStatus = svc.transaction.FAIL;
              callback();
              return;
            }

            if (res.statusCode >= 400 && res.statusCode <= 599) {
              svc.logger.error(errIdHttp + res.statusCode, 'HTTP error: status = (%d) - %s',
                res.statusCode, http.STATUS_CODES[res.statusCode]);
              lastTranStatus = svc.transaction.FAIL;
              callback();
              return;
            }
            callback();
          });
        }

        if (lastTranName && lastTranName !== tran) {
          svc.transaction.end(lastTranName, lastTranStatus);
          lastTranStatus = svc.transaction.PASS;
        }
        if (tran && tran !== lastTranName) {
          svc.transaction.start(tran);
        }
        lastTranName = tran;
        if (testItem.thinkTime && !tran) {
          svc.thinkTime(testItem.thinkTime, function() {
            sndReq();
          });
        }
        else if (testItem.thinkTime && tran) {
          svc.transaction.thinkTime(tran, testItem.thinkTime, function () {
            sndReq();
          });
        }
        else {
          sndReq();
        }
      });
    });
    async.series(tasks, function () {
      if (lastTranName) {
        svc.transaction.end(lastTranName, lastTranStatus);
      }
      done();
    });
  });

  /* end action */
  vuser.end('Vuser end action', function (svc, done) {
    svc.logger.info('Vuser %s end', vuserId);
    done();
  });
};

