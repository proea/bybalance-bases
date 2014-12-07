
var log = console.log || function(){};

var accounts = {
    kAccountMts: 1,
    kAccountBn: 2,
    kAccountVelcom: 3,
    kAccountLife: 4,
    kAccountTcm: 5,
    kAccountNiks: 6,
    kAccountDamavik: 7,
    kAccountSolo: 8,
    kAccountTeleset: 9,
    kAccountByFly: 10,
    kAccountNetBerry: 11,
    kAccountCosmosTv: 12,
    kAccountAtlantTelecom: 13,
    kAccountInfolan: 14,
    kAccountUnetBy: 15,
    kAccountDiallog: 16,
    kAccountAnitex: 17,
    kAccountAdslBy: 18
};

var accountsFunctions = {
    id_1: 'extractMts',
    id_2: 'extractBn'
};

function getExtractFunction(type)
{
    log('getExtractFunction type:' + type);
    var prop = 'id_'+type;
    var funcName = accountsFunctions[prop] ? accountsFunctions[prop] : null;
    if (!funcName) return null;
    return this[funcName] ? this[funcName] : null;
}

function prepareResult()
{
    return {
        notSupported: false,
        extracted: false,
        incorrectLogin: false,
        balance: 0,
        bonuses: ''
    };
}

function extractData(type, html)
{
    log('extractData type:' + type);
    //log(html);

    var func = getExtractFunction(type);
    if (!func || typeof func != 'function')
    {
        var r = prepareResult();
        r.notSupported = true;
        return r;
    }

    return func(html);
}

function getIntegerNumber(str, separator)
{
    separator = separator || '.';

    str = str.replace(/руб./g, ''); //mts,bn

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

function extractMts(html)
{
    var r = prepareResult();

    var re = /<div class="logon-result-block">([\s\S]+)<\/div>/mi;
    if (html.match(re))
    {
        r.incorrectLogin = true;
        return r;
    }

    re = /<span id="customer-info-balance"><strong>([\s\S]+)<\/strong>/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(matches[1], ',');
        log('balance', balance);
        r.extracted = true;
        r.balance = balance;
    }
    log(matches);

    return r;
}

function extractBn(html)
{
    var r = prepareResult();

    var re = /<div class=('alarma'|"alarma")>([^<]+)<\/div>/mi;
    if (html.match(re))
    {
        r.incorrectLogin = true;
        return r;
    }

    re = /Текущий баланс:<\/td><td>([^<]+)<\/td>/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(matches[1], ',');
        log('balance', balance);
        r.extracted = true;
        r.balance = balance;
    }
    log('matches', matches);

    return r;
}


var bb = {
    title: 'Базы приложения',
    version: '1411.3.17'
};

//end