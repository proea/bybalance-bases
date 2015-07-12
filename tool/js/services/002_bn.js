

function ServiceBusinessNetwork(data)
{
    var url = 'https://ui.bn.by/';
    var result = prepareResult();

    function authorize()
    {
        log('bn authorize');
        return new Promise(function(resolve, reject)
        {
            var rm = new RequestMediator();
            rm.doGet(url + 'index.php').done(function() {
                rm.doPost(url + 'index.php?mode=login', {login: data.username, passwd: data.password}).done(function(response) {
                    resolve(response.data);
                }).fail(reject);
            }).fail(reject);
        });
    }

    function extract(html)
    {
        log('bn extract', html);
        $('#idResponse').val(html);

        var re = /<div class=('alarma'|"alarma")>([^<]+)<\/div>/mi;
        if (html.match(re))
        {
            result.incorrectLogin = true;
            return;
        }

        re = /Текущий баланс:<\/td><td>([^<]+)<\/td>/mi;
        var matches = html.match(re);
        log('matches', matches);
        if (matches && matches.length == 2)
        {
            var balance = getIntegerNumber(matches[1], ',');
            result.extracted = true;
            result.balance = balance;
        }
    }

    function process()
    {
        return new Promise(function(resolve, reject)
        {
            authorize().then(function(html) {
                extract(html);
                resolve(result);
            }).catch(function() {
                resolve(result);
            });

        });
    }

    return {process: process};
}