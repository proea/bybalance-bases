
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

    this.clear = function()
    {
        $.post(urlMediator + '?c=clear', {sid: sid}, function(data) {
            log(data);
        }, 'json');
    };

    this.doGet = function(url)
    {
        return $.post(urlMediator + '?c=doGet', {sid: sid, url: url}, function(data) {
            log('doGet', data);
        }, 'json');
    };

    this.doPost = function(url, fields)
    {
        return $.post(urlMediator + '?c=doPost', {sid: sid, url: url, fields: fields}, function(data) {
            log('doPost', data);
        }, 'json');
    };
}
