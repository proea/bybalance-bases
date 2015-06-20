
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

function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}

function RequestMediator(id, info)
{
    var urlMediator = 'mediator.php';
    var sid = randomString(32, 'aA#');
    var sid = 'mPTzvonPth8O1XakvwDUt3U1z0HfQyXV';

    this.clear = function()
    {
        $.post(urlMediator + '?c=clear', {sid: sid}, function(data) {
            log(data);
        }, 'json');
    };

    this.doGet = function(url)
    {
        $.post(urlMediator + '?c=doGet', {sid: sid, url: url}, function(data) {
            log(data);
        }, 'json');
    };

    this.doPost = function(url, fields)
    {
        $.post(urlMediator + '?c=doPost', {sid: sid, url: url, fields: fields}, function(data) {
            log(data);
        }, 'json');
    };
}
