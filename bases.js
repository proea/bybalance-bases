
var log = console.log || function(){};
var username = ''; //for byfly

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
    id_2: 'extractBn',
    id_3: 'extractVelcom',
    id_4: 'extractLife',
    id_5: 'extractTcm',
    id_6: 'extractNiks',
    id_7: 'extractDamavik',
    id_8: 'extractDamavik',
    id_9: 'extractDamavik',
    id_10: 'extractByfly',
    id_13: 'extractDamavik'
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

    if (html == '')
    {
        return prepareResult();
    }

    return func(html);
}

function getIntegerNumber(str, separator)
{
    separator = separator || '.';

    str = str.replace(/руб./g, ''); //mts,bn,velcom

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
        r.extracted = true;
        r.balance = balance;
    }

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
        r.extracted = true;
        r.balance = balance;
    }

    return r;
}

function extractVelcom(html)
{
    var r = prepareResult();

    if (html.indexOf('INFO_Error_caption') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var i, regexp, matches, balance;
    var balanceMarkers = [
        /баланс:<\/td><td class="INFO">([^<]+)/mi,
        /"Начисления\s*абонента\*:<\/td><td class="INFO">([^<]+)/mi,
        /<td[^>]*id="BALANCE"[^>]*><span>\s*([^<]+)/mi,
        /<td[^>]*id="contractCharge"[^>]*><span>\s*([^<]+)/mi
    ];

    for (i=0; i<balanceMarkers.length; i++)
    {
        regexp = balanceMarkers[i];
        matches = html.match(regexp);
        log(regexp, matches);
        if (matches && matches.length == 2)
        {
            balance = getIntegerNumber(matches[1]);
            r.extracted = true;
            r.balance = balance;
            break;
        }
    }

    if (r.extracted)
    {
        log('search for bonuses');
        var bonusLine, bonuses = [];
        var bonusesMarkers = [
            /<td[^>]*id="DISCOUNT"[^>]*><span>\s*([^<]+)/mi,
            /<td[^>]*id="TraficBalance"[^>]*><span>\s*([^<]+)/mi
        ];

        for (i=0; i<bonusesMarkers.length; i++)
        {
            regexp = bonusesMarkers[i];
            matches = html.match(regexp);
            log(regexp, matches);
            if (matches && matches.length == 2)
            {
                bonusLine = String(matches[1]).trim();
                if (bonusLine.length > 1) bonuses.push(bonusLine);
            }
        }

        if (bonuses.length > 0) r.bonuses = bonuses.join(' ');
    }

    return r;
}

function extractLife(html)
{
    var r = prepareResult();

    if (html.indexOf('class="log-out"') == -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var i, regexp, matches, balance;
    var balanceMarkers = [
        /Основной баланс\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi,
        /Основной счет\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi
    ];

    for (i=0; i<balanceMarkers.length; i++)
    {
        regexp = balanceMarkers[i];
        matches = html.match(regexp);
        log(regexp, matches);
        if (matches && matches.length == 2)
        {
            balance = getIntegerNumber(matches[1]);
            r.extracted = true;
            r.balance = balance;
            break;
        }
    }

    return r;
}

function extractTcm(text)
{
    var r = prepareResult();

    if (text == '') return r;

    if (text.indexOf('ERROR') > -1 || text.indexOf('FORBIDDEN') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var arr = text.split(';');
    if (arr.length < 5) return r;

    r.extracted = true;
    r.balance = getIntegerNumber(arr[2]);

    var status = arr[4];
    if (status == 0)
    {
        r.bonuses = "Аккаунт заблокирован";
    }

    return r;
}

function extractNiks(html)
{
    var r = prepareResult();

    if (html.indexOf('id="MessageLabel"') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var re = /Баланс:<\/td>\s*<td class="bgTableWhite2" width="50%" align="left">\s*<table cellpadding="0" cellspacing="0" border="0" width="100%">\s*<tr>\s*<td nowrap><font color=red><b>([^<]+)/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(matches[1]);
        r.extracted = true;
        r.balance = balance;
    }

    return r;
}

function extractDamavik(html)
{
    var r = prepareResult();

    if (html.indexOf('Введенные данные неверны. Проверьте и повторите попытку.') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var re = /Состояние счета<\/td>\s+<td>([^<]+)/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(matches[1]);
        r.extracted = true;
        r.balance = balance;
    }

    return r;
}

function extractByfly(html)
{
    var r = prepareResult();

    if (html.indexOf('name="oper_user"') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    //simple check, one contract item
    var re = /Актуальный баланс:\s*<b>\s*([^<]+)/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(matches[1]);
        r.extracted = true;
        r.balance = balance;
    }
    else
    {
        re = /<\/strong>\s*<\/span>\s*<ul>([\s\S]+)<\/ul>\s*<\/li>\s*<\/ul>\s*<\/div>/mi;
        matches = html.match(re);
        log(matches);
        if (matches && matches.length == 2)
        {
            var blockAll = matches[1];
            var blocks = blockAll.split(/<\/li>\s*<li>/mi);
            var block, i;
            log(blockAll);
            for (i=0; i<blocks.length; i++)
            {
                block = blocks[i];
                log(block);
                if (block.indexOf(username) == -1) continue;

                re = /Баланс\s*([^)]+)/mi;
                matches = html.match(re);
                if (matches && matches.length == 2)
                {
                    var balance = getIntegerNumber(matches[1]);
                    r.extracted = true;
                    r.balance = balance;
                    break;
                }
            }
        }
    }

    return r;
}

var bb = {
    title: 'Базы приложения',
    version: '1411.3.26'
};

//end