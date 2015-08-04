
function log()
{
    if ('bbLog' in this) bbLog.apply(this, arguments);
    else if ('inBrowser' in this) console.log.apply(this, arguments);
}

function prepareResult()
{
    return {
        notSupported: false,
        incorrectLogin: false,
        extracted: false,
        balance: 0,
        bonuses: ''
    };
}

function randomString(length, chars)
{
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}

function executeFunctionByName(functionName, context /*, args */)
{
    var args = Array.prototype.slice.call(arguments, 2);
    var namespaces = functionName.split(".");
    var func = namespaces.pop();
    for (var i = 0; i < namespaces.length; i++) {
        context = context[namespaces[i]];
    }
    return context[func].apply(context, args);
}

function getIntegerNumber(str, separator)
{
    separator = separator || '.';
    str = str.replace(/руб./g, '');

    if (separator == '.')
    {
        str = str.replace(/[^0-9.\-]/g, '');
    }
    else
    {
        str = str.replace(/[^0-9,\-]/g, '');
        str = str.replace(',', '.');
    }

    return parseInt(str);
}

function getDecimalNumber(str, separator)
{
    separator = separator || '.';
    str = str.replace(/руб./g, '');

    if (separator == '.')
    {
        str = str.replace(/[^0-9.\-]/g, '');
    }
    else
    {
        str = str.replace(/[^0-9,\-]/g, '');
        str = str.replace(',', '.');
    }

    return parseFloat(str).toFixed(2);
}

function getNumEnding(number, endings)
{
    var ending = '';
    //(1, 4, 5)
    number = Math.abs(number);
    number = number % 100;

    if (number >= 11 && number <= 19)
    {
        ending = endings[2];
    }
    else
    {
        var i = number % 10;
        switch (i)
        {
            case 1:
                ending = endings[0];
                break;
            case 2:
            case 3:
            case 4:
                ending = endings[1];
                break;
            default:
                ending = endings[2];
        }
    }

    return ending;
}

function RequestMediator()
{
    var urlMediator = 'mediator.php';
    var sid = randomString(32, 'aA#');
    //var sid = 'mPTzvonPth8O1XakvwDUt3U1z0HfQyXV';

    //if (!('jQuery' in window)) throw 'jQuery required';
    var useIos = ('bbLog' in window);

    this.doClear = function(url)
    {
        return new Promise(function(resolve, reject) {

            if (useIos)
            {
                bbClear(url);
                resolve();
            }
            else
            {
                jQuery.ajax({
                    url: urlMediator + '?c=doClear',
                    type: 'POST',
                    data: {sid: sid},
                    dataType: 'json'
                }).then(function (data, textStatus, jqXHR) {
                    delete jqXHR.then; // treat xhr as a non-promise
                    log('doClear', data);
                    resolve(data);
                }, function (jqXHR, textStatus, errorThrown) {
                    delete jqXHR.then; // treat xhr as a non-promise
                    reject(jqXHR);
                });
            }

        });
    };

    this.doGet = function(url)
    {
        return new Promise(function(resolve, reject) {
            log('doGet start');

            if (useIos)
            {
                log('doGet start useIos');
                bbGet(url, function(success, data) {
                    //log('doGet start data', data);
                    if (success) resolve(data);
                    else reject();
                    return 123;
                });
            }
            else
            {
                jQuery.ajax({
                    url: urlMediator + '?c=doGet',
                    type: 'POST',
                    data: {sid: sid, url: url},
                    dataType: 'json'
                }).then(function (data, textStatus, jqXHR) {
                    delete jqXHR.then; // treat xhr as a non-promise
                    log('doGet good', data);
                    resolve(data);
                }, function (jqXHR, textStatus, errorThrown) {
                    log('doGet bad');
                    delete jqXHR.then; // treat xhr as a non-promise
                    reject(jqXHR);
                });
            }

        });
    };

    this.doPost = function(url, fields, options)
    {
        options = options || {};
        var data = {sid: sid, url: url, fields: fields};
        if ('multipart' in options) data.multipart = options.multipart;
        if ('referer' in options) data.referer = options.referer;

        return new Promise(function(resolve, reject) {

            if (useIos)
            {
                bbPost(data, function(success, data) {
                    if (success) resolve(data);
                    else reject();
                });
            }
            else
            {
                jQuery.ajax({
                    url: urlMediator + '?c=doPost',
                    type: 'POST',
                    data: data,
                    dataType: 'json'
                }).then(function (data, textStatus, jqXHR) {
                    delete jqXHR.then; // treat xhr as a non-promise
                    log('doPost', data);
                    resolve(data);
                }, function (jqXHR, textStatus, errorThrown) {
                    delete jqXHR.then; // treat xhr as a non-promise
                    reject(jqXHR);
                });
            }
        });
    }
}


function checkBalance(serviceId, data)
{
    function getService(id)
    {
        for (var i=0; i<services.length; i++)
        {
            var s = services[i];
            if (s.id == id) return s;
        }
        return null;
    }

    log('bbCheck', serviceId, data);
    var service = getService(serviceId);
    if (!service) throw 'unknown_service';

    var checkProcessor = executeFunctionByName(service.processor, window, data);
    checkProcessor.process().then(function(result) {
        log('bbCheck result', result);
        bbResult(result);
    });
}