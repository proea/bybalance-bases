
var services = [
    {
        id: 1,
        name: 'МТС',
        fields: ['username', 'password']
    },
    {
        id: 2,
        name: 'Деловая сеть',
        fields: ['username', 'password']
    },
    {
        id: 3,
        name: 'Велком',
        fields: ['username', 'password']
    },
    {
        id: 4,
        name: 'Лайф',
        fields: ['username', 'password']
    },
    {
        id: 5,
        name: 'TCM',
        fields: ['username', 'password']
    },
    {
        id: 6,
        name: 'Никс',
        fields: ['username', 'password']
    },
    {
        id: 7,
        name: 'Дамавік',
        fields: ['username', 'password']
    },
    {
        id: 8,
        name: 'Соло',
        fields: ['username', 'password']
    },
    {
        id: 9,
        name: 'Телесеть',
        fields: ['username', 'password']
    },
    {
        id: 10,
        name: 'Byfly',
        fields: ['username', 'password']
    },
    {
        id: 11,
        name: 'NetBerry',
        fields: ['username', 'password']
    },
    {
        id: 12,
        name: 'Космос тв',
        fields: ['username', 'password']
    },
    {
        id: 13,
        name: 'Атлант телеком',
        fields: ['username', 'password']
    },
    {
        id: 14,
        name: 'Домашняя сеть',
        fields: ['username', 'password']
    },
    {
        id: 15,
        name: 'Unet.by',
        fields: ['username', 'password']
    },
    {
        id: 17,
        name: 'Anitex',
        fields: ['username', 'password']
    },
    {
        id: 18,
        name: 'Adsl.by',
        fields: ['username', 'password']
    }
];

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
        fields += nano('<div class="form-group"><input type="text" class="form-control" id="{name}" placeholder="{name}"></div>', {name:f});
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
    var s = getService(id);
    console.log('selected', id, s);
    renderService(s);
});
