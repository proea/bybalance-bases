

function ServiceMts(data)
{
    var url = 'https://ihelper.mts.by/SelfCare/';
    var result = prepareResult();
    var paramViewState = '';
    var rm = new RequestMediator();
    var bonuses = [];

    function auth1()
    {
        log('mts auth1');
        return new Promise(function(resolve, reject)
        {
            rm.doGet(url + 'logon.aspx')
                .then(function(response) {
                    log('mts auth1 then');
                    resolve(response.data);
                })
                .catch(function(){
                    log('mts auth1 catch');
                    reject();
                });
        });
    }

    function getParamViewState(html)
    {
        var re = /id="__VIEWSTATE" value="([^"]+)"/mi;
        var matches = html.match(re);
        if (matches && matches.length == 2)
        {
            return String(matches[1]).trim();
        }

        return '';
    }

    function auth2(html)
    {
        log('mts auth2');
        return new Promise(function(resolve, reject)
        {
            paramViewState = getParamViewState(html);
            log('paramViewState', paramViewState);
            if (paramViewState == '')
            {
                reject();
                return;
            }

            var fields = {
                '__VIEWSTATE': paramViewState,
                'ctl00$MainContent$tbPhoneNumber': data.username,
                'ctl00$MainContent$tbPassword': data.password,
                'ctl00$MainContent$btnEnter': 'Войти'
            };
            rm.doPost(url + 'logon.aspx', fields)
                .then(function(response) {
                    resolve(response.data);
                })
                .catch(reject);
        });
    }

    function authorize()
    {
        log('mts authorize');
        return new Promise(function(resolve, reject)
        {
            auth1().then(auth2).then(resolve).catch(reject);
        });
    }

    function extractBasic(html)
    {
        log('mts extractBasic');
        //$('#idResponse').val(html);

        var re = /<div class="logon-result-block">([\s\S]+)<\/div>/mi;
        if (html.match(re))
        {
            result.incorrectLogin = true;
            throw 'incorrect_login';
            //return;
        }

        re = /<span id="customer-info-balance"><strong>([^<]+)<\/strong>/mi;
        var matches = html.match(re);
        if (matches && matches.length == 2)
        {
            result.extracted = true;
            result.balance = getIntegerNumber(matches[1], ',');
        }

        re = /<li class="lock-status">([^<]+)<\/li>/mi;
        matches = html.match(re);
        if (matches && matches.length == 2)
        {
            addBonus(matches[1]);
        }
    }

    function readAdditional()
    {
        log('mts readAdditional');
        return new Promise(function(resolve, reject)
        {
            rm.doGet(url + 'account-status.aspx')
                .then(function(response) {
                    resolve(response.data);
                })
                .catch(reject);
        });
    }

    function extractAdditional(html)
    {
        log('mts extractAdditional');
        //$('#idResponse').val(html);

        //<li>Интернет: 12,9 МБ. до 01.08.2015 00:00:00</li>
        var re = /<li>Интернет:([^<]+)<\/li>/mi;
        var matches = html.match(re);
        if (matches && matches.length == 2)
        {
            addBonus('Интернет:' + matches[1]);
        }
    }

    function addBonus(text)
    {
        text = String(text).trim();
        if (text.length < 1) return;

        bonuses.push(text);
        result.bonuses = bonuses.join('\n');
    }

    function process()
    {
        return new Promise(function(resolve)
        {
            var last = function() { resolve(result) };

            authorize()
                .then(extractBasic)
                    .then(readAdditional)
                        .then(extractAdditional)
                            .then(last)
            .catch(last);
        });
    }

    return {process: process};
}
