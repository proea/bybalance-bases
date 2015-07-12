

function ServiceMts(data)
{
    var url = 'https://ihelper.mts.by/SelfCare/';
    var result = prepareResult();
    var paramViewState = '';
    var rm = new RequestMediator();
    var bonuses = [];

    function step1()
    {
        log('mts step1');
        return new Promise(function(resolve, reject)
        {
            rm.doGet(url + 'logon.aspx').done(function(response) {
                resolve(response.data);
            }).fail(reject);
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

    function step2(html)
    {
        log('mts step2');
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
            rm.doPost(url + 'logon.aspx', fields).done(function(response) {
                resolve(response.data);
            }).fail(reject);
        });
    }

    function authorize()
    {
        log('mts authorize');
        return new Promise(function(resolve, reject)
        {
            step1().then(function(html) {
                step2(html).then(function(html) {
                    resolve(html);
                }).catch(reject);
            }).catch(reject);
        });
    }

    function extractBasic(html)
    {
        $('#idResponse').val(html);

        var re = /<div class="logon-result-block">([\s\S]+)<\/div>/mi;
        if (html.match(re))
        {
            result.incorrectLogin = true;
            return;
        }

        re = /<span id="customer-info-balance"><strong>([^<]+)<\/strong>/mi;
        var matches = html.match(re);
        if (matches && matches.length == 2)
        {
            var balance = getIntegerNumber(matches[1], ',');
            result.extracted = true;
            result.balance = balance;
        }

        re = /<li class="lock-status">([^<]+)<\/li>/mi;
        matches = html.match(re);
        if (matches && matches.length == 2)
        {
            addBonus(matches[1]);
        }
    }

    function step3()
    {
        return new Promise(function(resolve, reject)
        {
            rm.doGet(url + 'account-status.aspx').done(function(response) {
                resolve(response.data);
            }).fail(reject);
        });
    }

    function extractAdditional(html)
    {
        $('#idResponse').val(html);

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
        return new Promise(function(resolve, reject)
        {
            authorize().then(function(html) {
                extractBasic(html);

                step3().then(function(html) {
                    extractAdditional(html);
                    resolve(result);
                }).catch(function() {
                    resolve(result);
                });

            }).catch(function() {
                resolve(result);
            });
        });
    }

    return {process: process};
}