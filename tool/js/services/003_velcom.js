
function ServiceVelcom(data)
{
    var url = 'https://my.velcom.by/';
    var result = prepareResult();
    var rm = new RequestMediator();
    var paramSid3 = '';
    var paramMenuMarker = '';
    var menuMarkers = ['_root/PERSONAL_INFO_ABONENT',  '_root/PERSONAL_INFO', '_root/USER_INFO', '_root/MENU0'];
    var bonuses = [];

    function prepare()
    {
        log('velcom prepare');
        return new Promise(function(resolve, reject)
        {
            rm.doClear().done(resolve).fail(reject);
        });
    }

    function step1()
    {
        log('velcom step1');
        return new Promise(function(resolve, reject)
        {
            rm.doGet(url + 'work.html').done(function(response) {
                resolve(response.data);
            }).fail(reject);
        });
    }

    function getParamSid3(html)
    {
        var re = /name="sid3" value="([^"]+)"/mi;
        var matches = html.match(re);
        if (matches && matches.length == 2)
        {
            return String(matches[1]).trim();
        }

        return '';
    }

    function step2(html)
    {
        log('velcom step2');
        return new Promise(function(resolve, reject)
        {
            paramSid3 = getParamSid3(html);
            log('paramSid3', paramSid3);
            if (paramSid3 == '')
            {
                reject();
                return;
            }

            var fields = {
                sid3: paramSid3,
                user_input_timestamp: new Date().getTime(),
                user_input_0: '_next',
                last_id: '',
                user_input_1: '375' + data.username.substr(0, 2),
                user_input_2: data.username.substr(2),
                user_input_3: data.password
            };
            log('step2 fields', fields);
            rm.doPost(url + 'work.html', fields, true).done(function(response) {
                resolve(response.data);
            }).fail(reject);
        });
    }

    function getParamMenuMarker(html)
    {
        for (var i=0; i<menuMarkers.length; i++)
        {
            var marker = menuMarkers[i];
            if (html.indexOf(marker) > -1)
            {
                return marker;
            }
        }

        return '';
    }

    function step3(html)
    {
        log('velcom step3');
        return new Promise(function(resolve, reject)
        {
            paramMenuMarker = getParamMenuMarker(html);
            log('paramSid3', paramMenuMarker);
            if (paramMenuMarker == '')
            {
                result.incorrectLogin = true;
                reject();
                return;
            }

            var fields = {
                sid3: paramSid3,
                user_input_timestamp: new Date().getTime(),
                user_input_0: paramMenuMarker,
                last_id: '',
                user_input_1: ''
            };
            log('step3 fields', fields);
            rm.doPost(url + 'work.html', fields, true).done(function(response) {
                resolve(response.data);
            }).fail(reject);
        });
    }

    function authorize()
    {
        log('velcom authorize');
        return new Promise(function(resolve, reject)
        {
            step1().then(function(html) {
                step2(html).then(function(html) {
                    step3(html).then(function(html) {
                        resolve(html);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        });
    }

    function extractBasic(html)
    {
        $('#idResponse').val(html);

        if (html.indexOf('INFO_Error_caption') > -1)
        {
            result.incorrectLogin = true;
            return;
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
                result.extracted = true;
                result.balance = balance;
                break;
            }
        }

        if (result.extracted)
        {
            log('search for bonuses');
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
                    addBonus(matches[1]);
                }
            }
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
        return new Promise(function(resolve, reject) {

            prepare().then(authorize).then(function(html) {
                    extractBasic(html);
                    resolve(result);
                }).catch(function() {
                    resolve(result);
                });

            return;
            prepare().then(function() {
                authorize().then(function(html) {
                    extractBasic(html);
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