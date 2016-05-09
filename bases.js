
function log()
{
    if ('bbLog' in this) bbLog.apply(this, arguments);
    else if ('useRegularConsole' in this) console.log.apply(this, arguments);
}

function getIntegerNumberWithoutPoints(str, separator)
{
    // for netberry
    str = str.replace(/руб./g, '');
    var pos = -1;

    pos = str.indexOf('.');
    if (pos == -1) pos = str.indexOf(',');
    if (pos > 0) str = str.substring(0, pos);

    str = str.replace(/[^0-9\-]/g, '');
    return parseInt(str);
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
    kAccountDiallog: 16, //dead
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
    id_11: 'extractNetberry',
    id_12: 'extractCosmosTv',
    id_13: 'extractDamavik',
    id_14: 'extractInfolan',
    id_15: 'extractUnetBy',
    id_17: 'extractAnitex',
    id_18: 'extractAdslBy'
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
        //r.bonuses = 'Тест длинной строки мегабайт: 20000   сут';
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
        //log(regexp, matches);
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
            //log(regexp, matches);
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
        /Основной счет\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi,
        /Основной счёт\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi
    ];

    for (i=0; i<balanceMarkers.length; i++)
    {
        regexp = balanceMarkers[i];
        matches = html.match(regexp);
        //log(regexp, matches);
        if (matches && matches.length == 2)
        {
            balance = getIntegerNumber(matches[1]);
            r.extracted = true;
            r.balance = balance;
            break;
        }
    }

    if (r.extracted) return r;

    //план для юр. лиц
    matches = html.match(/Использованный корпоративный лимит\s*<\/td>\s*<td[^>]*>([^<]+)руб/mi);
    if (matches && matches.length == 2)
    {
        balance = getIntegerNumber(matches[1]);
        r.extracted = true;
        r.balance = balance;

        var bonusLine, bonuses = [];
        var bonusesMarkers = [
            /(Корпоративный лимит)\s*<\/td>\s*<td[^>]*>([^<]+)/mi,
            /(Использованный корпоративный лимит)\s*<\/td>\s*<td[^>]*>([^<]+)/mi
        ];

        for (i=0; i<bonusesMarkers.length; i++)
        {
            regexp = bonusesMarkers[i];
            matches = html.match(regexp);
            if (matches && matches.length == 3)
            {
                bonusLine = String(matches[1]).trim() + ': ' + String(matches[2]).trim();
                if (bonusLine.length > 1) bonuses.push(bonusLine);
            }
        }

        if (bonuses.length > 0) r.bonuses = bonuses.join(' ');
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

function safaryDOMParserFix()
{
    (function(DOMParser) {
        "use strict";
        var DOMParser_proto = DOMParser.prototype
            , real_parseFromString = DOMParser_proto.parseFromString;

        // Firefox/Opera/IE throw errors on unsupported types
        try {
            // WebKit returns null on unsupported types
            if ((new DOMParser).parseFromString("", "text/html")) {
                // text/html parsing is natively supported
                return;
            }
        } catch (ex) {}

        DOMParser_proto.parseFromString = function(markup, type) {
            if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
                var doc = document.implementation.createHTMLDocument("")
                    , doc_elt = doc.documentElement
                    , first_elt;

                doc_elt.innerHTML = markup;
                first_elt = doc_elt.firstElementChild;

                if (doc_elt.childElementCount === 1
                    && first_elt.localName.toLowerCase() === "html") {
                    doc.replaceChild(first_elt, doc_elt);
                }

                return doc;
            } else {
                return real_parseFromString.apply(this, arguments);
            }
        };
    }(DOMParser));
}

function extractByfly(html)
{
    var r = prepareResult();

    if (html.indexOf('name="oper_user"') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    username = String(username).replace('@beltel.by', '');
    log('username', username);

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
        var re = /Баланс\s*([^)]+)/mi;

        safaryDOMParserFix();

        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        //incorrect html
        if (doc.documentElement.nodeName == 'parsererror') return r;

        //log('doc', doc);
        var nodeTree = doc.getElementById('tree');
        if (!nodeTree) return r;
        //log('nodeTree', nodeTree);
        //log('nodeTree.childNodes', nodeTree.childNodes);

        //check if first level is ul again
        var firstUL = false;
        for (var i=0; i<nodeTree.childNodes.length; i++)
        {
            var nodeTreeChild = nodeTree.childNodes[i];
            if (nodeTreeChild.nodeName.toUpperCase() == 'UL')
            {
                firstUL = true;
                nodeTree = nodeTreeChild;
                break;
            }
        }

        //log('nodeTree', nodeTree);

        for (var i=0; i<nodeTree.childNodes.length; i++)
        {
            var nodeTreeChild = nodeTree.childNodes[i];
            if (nodeTreeChild.nodeName.toUpperCase() == 'LI')
            {
                var nodeLi = nodeTreeChild;
                //log('nodeLi', nodeLi.innerHTML);
                for (var j=0; j<nodeLi.childNodes.length; j++)
                {
                    var nodeLiChild = nodeLi.childNodes[j];
                    if (nodeLiChild.nodeName.toUpperCase() == 'UL')
                    {
                        var nodeUl2 = nodeLiChild;
                        //log('nodeUl2', nodeUl2.innerHTML);
                        for (var k=0; k<nodeUl2.childNodes.length; k++)
                        {
                            var nodeUl2Child = nodeUl2.childNodes[k];
                            if (nodeUl2Child.nodeName.toUpperCase() == 'LI')
                            {
                                var nodeLi2 = nodeUl2Child;
                                //log('nodeLi2', nodeLi2.innerHTML);
                                var block = nodeLi2.innerHTML;

                                if (block.indexOf(username) == -1) continue;

                                //log('username found', nodeLi2.innerHTML);

                                if (firstUL)
                                {
                                    var matches = nodeLi.innerHTML.match(re);
                                }
                                else
                                {
                                    var matches = block.match(re);
                                }

                                if (matches && matches.length == 2)
                                {
                                    var balance = getIntegerNumber(matches[1]);
                                    r.extracted = true;
                                    r.balance = balance;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return r;
}

function NEW_extractByfly(html)
{
    var r = prepareResult();

    if (html.indexOf('name="oper_user"') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }
    username = '1704008644101';
    username = '176543138';
    log('username', username);

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
        var re = /Баланс\s*([^)]+)/mi;
        //save me jquery
        $('ul#tree > li > ul > li', html).each(function(idx, el)
        {
            var block = $(el).html();
            if (block.indexOf(username) == -1) return;

            var matches = block.match(re);
            if (matches && matches.length == 2)
            {
                var balance = getIntegerNumber(matches[1]);
                r.extracted = true;
                r.balance = balance;
            }
        });
    }

    return r;
}

function extractNetberry(html)
{
    var r = prepareResult();

    if (html.indexOf('Ошибка при авторизации') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var re = /Остаток средств<\/td>\s*<td>([^<]+)/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumberWithoutPoints(matches[1]);
        r.extracted = true;
        r.balance = balance;
    }
    else
    {
        re = /Исходящий остаток на конец месяца<\/td>\s*<td>([^<]+)/mi;
        matches = html.match(re);
        if (matches && matches.length == 2)
        {
            var balance = getIntegerNumberWithoutPoints(matches[1]);
            r.extracted = true;
            r.balance = balance;
        }
        else
        {
            re = /Входящий остаток на начало месяца<\/td>\s*<td>([^<]+)/mi;
            matches = html.match(re);
            if (matches && matches.length == 2)
            {
                var balance = getIntegerNumberWithoutPoints(matches[1]);
                r.extracted = true;
                r.balance = balance;
            }
        }
    }

    return r;
}

function extractCosmosTv(html)
{
    var r = prepareResult();
    var line = [];

    //Контракт
    // <form id="frm_contracts"
    re = /<form\s*id="frm_contracts"[^>]*>([\s\S]*?)<\/form>/mi;
    matches = html.match(re);
    //log('matches', matches);
    if (matches && matches.length == 2)
    {
        var formHtml = matches[1];
        //log('formHtml', formHtml);
        //<option value="101909390" selected class=""> TO_7518 </option>
        re = /<option\s*value="[^\"]*"\s*selected[^>]*>([^<]+)<\/option>/mi;
        matches = formHtml.match(re);
        //log('matches', matches);
        if (matches && matches.length == 2)
        {
            var contract = String(matches[1]).trim();
            if (contract.length > 0)
            {
                line.push('к:' + contract);
            }
        }
    }

    //Баланс: <b class="positively"> 0,00 </b>
    var re = /Баланс:\s*<b[^>]*>([^<]+)<\/b>/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var balance = getIntegerNumber(String(matches[1]).trim(), ',');
        r.extracted = true;
        r.balance = balance;
        line.push(r.balance);
    }

    //Статус: <b class="positively">Действующий </b>
    re = /Статус:\s*<b[^>]*>([^<]+)<\/b>/mi;
    matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var status = String(matches[1]).trim();
        if (status.length > 0)
        {
            line.push('c:' + status.toLowerCase());
        }
    }

    if (line.length > 0) r.bonuses = line.join(' - ');

    return r;
}

function extractInfolan(text)
{
    var r = prepareResult();

    var parser = new DOMParser();
    var doc = parser.parseFromString(text, 'text/xml');

    //incorrect xml
    if (doc.documentElement.nodeName == 'parsererror') return r;

    //incorrect login or other server error
    var nodeError = doc.getElementsByTagName('Error')[0];
    if (nodeError) return r;

    var nodeResponse = doc.getElementsByTagName('Response')[0];
    var i, node, nodeBalance, nodeName, nodeExpiry;
    var bonuses = [];
    //log(nodeResponse);
    //log('length', nodeResponse.childNodes.length);
    for (i=0; i<nodeResponse.childNodes.length; i++)
    {
        node = nodeResponse.childNodes[i];
        //log('node', node.nodeName);
        if (node.nodeName == 'Main')
        {
            nodeBalance = node.getElementsByTagName('Balance')[0];
            //log('nodeBalance', nodeBalance);
            if (nodeBalance)
            {
                r.extracted = true;
                //log('balance', nodeBalance.textContent);
                r.balance = getIntegerNumber(nodeBalance.textContent);

                var nodeDL = node.getElementsByTagName('DaysLeft')[0];
                if (nodeDL)
                {
                    var dl = parseInt(nodeDL.textContent);
                    //log('daysLeft', dl);
                    bonuses.push('Осталось ' + dl + ' ' + getNumEnding(dl, ['день', 'дня', 'дней']));
                }
            }
        }
        else if (node.nodeName == 'Inet')
        {
            nodeName = node.getElementsByTagName('Name')[0];
            nodeBalance = node.getElementsByTagName('Balance')[0];
            if (nodeName && nodeBalance)
            {
                var line = nodeName.textContent + ' - ' + nodeBalance.textContent;

                nodeExpiry = node.getElementsByTagName('Expiry')[0];
                if (nodeExpiry)
                {
                    line += ' - ' + nodeExpiry.textContent;
                }

                bonuses.push(line);
            }
        }
    }

    if (bonuses.length > 0) r.bonuses = bonuses.join('\n');
    //log('bonuses', bonuses);

    return r;
}

function extractUnetBy(text)
{
    var r = prepareResult();

    var parser = new DOMParser();
    var doc = parser.parseFromString(text, 'text/xml');

    //incorrect xml
    if (doc.documentElement.nodeName == 'parsererror') return r;

    var nodeTag = doc.getElementsByTagName('tag')[0];
    if (!nodeTag) return r;

    var deposit = nodeTag.getAttribute('deposit');
    if (deposit)
    {
        r.extracted = true;
        r.balance = getIntegerNumber(deposit);

        var bonuses = [];
        var c1 = nodeTag.getAttribute('count_internet');
        if (c1) bonuses.push('Интернет трафик ' + c1 + 'Mb');

        var c2 = nodeTag.getAttribute('count_unet');
        if (c2) bonuses.push('Unet.by трафик ' + c2 + 'Mb');

        if (bonuses.length > 0) r.bonuses = bonuses.join('\n');
    }

    return r;
}

function extractAnitex(html)
{
    var r = prepareResult();

    if (html.indexOf('Ошибка при авторизации') > -1)
    {
        r.incorrectLogin = true;
        return r;
    }

    var userPackages=0, userMegabytes=0, userDays=0, userCredit=0, userBalance=0;

    var re = /Неактивированных пакетов<\/td>\s*<td>([^<]+)<\/td>/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        userPackages = getIntegerNumber(matches[1]);
        r.extracted = true;
    }

    re = /Текущий пакет, осталось МегаБайт<\/td>\s*<td>([^<]+)<\/td>/mi;
    matches = html.match(re);
    if (matches && matches.length == 2)
    {
        userMegabytes = getDecimalNumber(matches[1]);
        r.extracted = true;
    }

    re = /Текущий пакет, осталось суток<\/td>\s*<td>([^<]+)<\/td>/mi;
    matches = html.match(re);
    if (matches && matches.length == 2)
    {
        userDays = getDecimalNumber(matches[1]);
        r.extracted = true;
    }

    re = /Кредит<\/td>\s*<td>([^<]+)<\/td>/mi;
    matches = html.match(re);
    if (matches && matches.length == 2)
    {
        userCredit = getIntegerNumber(matches[1]);
        r.extracted = true;
    }

    re = /Остаток<\/td>\s*<td>([^<]+)<\/td>/mi;
    matches = html.match(re);
    if (matches && matches.length == 2)
    {
        userBalance = getIntegerNumber(matches[1]);
        r.extracted = true;
    }

    /*
    log('userPackages', userPackages);
    log('userMegabytes', userMegabytes);
    log('userDays', userDays);
    log('userCredit', userCredit);
    log('userBalance', userBalance);
    */

    if (!r.extracted) return r;

    var bonuses = [];

    if (0 == userBalance)
    {
        r.balance = userMegabytes;
        bonuses.push('мегабайт: ' + userMegabytes + '  суток: ' + userDays);
        bonuses.push('пакетов: ' + userPackages);
    }
    else
    {
        r.balance = userBalance;
        bonuses.push('остаток: ' + userBalance + '  кредит: ' + userCredit);
    }

    if (bonuses.length > 0) r.bonuses = bonuses.join('\n');

    return r;
}


function extractAdslBy(html)
{
    var r = prepareResult();

    var re = /Осталось трафика на сумму<\/td>\s+<td[^>]+><b>([^<]+)/mi;
    var matches = html.match(re);
    if (matches && matches.length == 2)
    {
        r.balance = getIntegerNumber(matches[1]);
        r.extracted = true;
    }

    var bonuses = [];

    //Включен
    re = />Аккаунт<\/td>\s+<td[^>]+><b>([^<]+)/mi;
    matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var statusLine = String(matches[1]).trim();
        if (statusLine.length > 1) bonuses.push(statusLine);
    }

    //осталось
    re = /<td class='left'><\/td>\s+<td[^>]+>осталось\s+<b>([^<]+)<\/b><\/td>\s+<\/tr>\s+<tr class="sub last_pay">/mi;
    matches = html.match(re);
    if (matches && matches.length == 2)
    {
        var leftLine = String(matches[1]).trim();
        if (leftLine.length > 1) bonuses.push('осталось ' + leftLine);
    }

    if (bonuses.length > 0) r.bonuses = bonuses.join(', ');

    return r;
}

var bb = {
    title: 'Базы приложения',
    version: '1605.0'
};

//end