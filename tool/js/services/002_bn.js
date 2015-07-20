

function ServiceBusinessNetwork(data)
{
    var url = 'https://ui.bn.by/';
    var result = prepareResult();
    var rm = new RequestMediator();

    function authorize()
    {
        log('bn authorize');
        return new Promise(function(resolve, reject)
        {
            rm.doPost(url + 'index.php?mode=login', {login: data.username, passwd: data.password})
                .then(function(response) {
                    resolve(response.data);
                })
                .catch(reject);
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
        return new Promise(function(resolve)
        {
            var last = function() { resolve(result) };

            authorize().then(extract, last).then(last);
        });
    }

    return {process: process};
}