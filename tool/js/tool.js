

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

$('form').submit(function(e)
{
    e.preventDefault();
    var form = $('form').serializeArray();
    var info = {};
    $('form input[type="text"]').each(function()
    {
        info[this.name] = this.value;
    });
    log('will check service', service.id, service.name, 'with', info);

    var bc = new BalanceChecker(service.id, info);
    bc.check();
});


//test
service = getService(1);
var info = {username:'foo', password:'bar'};
var rm = new RequestMediator();
//rm.doGet('http://www.mts.by');
//rm.doGet('https://ihelper.mts.by/selfcare/');
//rm.doGet('http://onliner.by');
rm.doGet('http://tut.by');

//rm.doPost('http://apc/extranet/login/', {action:'login', login:'123123', password:'123'});

//rm.doGet('https://ui.bn.by/index.php');
//setTimeout(function(){
  //  rm.doPost('https://ui.bn.by/index.php?mode=login', {login:'123123', passwd:'123123'});
//}, 10000);

