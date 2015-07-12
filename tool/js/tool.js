

var service;

function getService(id)
{
    for (var i=0; i<services.length; i++)
    {
        var s = services[i];
        if (s.id == id) return s;
    }
    return null;
}

function renderService(s)
{
    if (!s)
    {
        $('#idPanelService').hide();
        return;
    }

    var fields = '';
    for (var i=0; i<s.fields.length; i++)
    {
        var f = s.fields[i];
        fields += nano('<div class="form-group"><input type="text" class="form-control" name="{name}" placeholder="{name}"></div>', {name:f});
    }

    $('form [rel="fields"]').html(fields);
    $('#idPanelService').show();
}

//render services
var opts = '';
for (var i=0; i<services.length; i++)
{
    var s = services[i];
    opts += nano('<option value="{id}">{name}</option>', s);
}
$('#idServices').append(opts);

//bind select
$('#idBtnSelect').click(function()
{
    var id = $('#idServices').val();
    service = getService(id);
    log('selected', id, service);
    renderService(service);
});

//bind submit
$('form').submit(function(e)
{
    e.preventDefault();
    var form = $('form').serializeArray();
    var data = {};
    $('form input[type="text"]').each(function()
    {
        data[this.name] = this.value;
    });
    //service.data = data;
    log('will check service', service.id, service.name, data);

    /*
    var bc = new BalanceChecker(service);
    bc.check().then(function(result){
        log('check result', result);
    });
    */

    var checkProcessor = executeFunctionByName(service.processor, window, data);
    checkProcessor.process().then(function(result) {
        log('check result', result);
        $('#idResult').text(JSON.stringify(result, undefined, 4));
    })
});


//test
/*
service = getService(2);
var data = {username: '123', password: '123'};
var checkProcessor = executeFunctionByName(service.processor, window, data);
checkProcessor.process().then(function(result) {
    log('check result', result);
    $('#idResult').text(JSON.stringify(result, undefined, 4));
});
*/