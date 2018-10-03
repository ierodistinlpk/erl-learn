// -*- encoding:utf-8-*-
//to onload. fill auth sector, status sector, stars, and start picture
function load(){
    //TODO: check session with current ssid
    $.ajax('/login',{type: "POST",dataType:'json',success:function(a,b,c){loginHandler(a,b,c)},error:function(){alert("fail");}});
    return null;
}

// to login/logout buttons
function login(){
    var username = $('#username').val();
    var pwd = $('#pwd').val();
    $('#pwd').val('');
    $.ajax('/login',{type: "POST",dataType:'json',data:{'user':username,'pwd':pwd},success:function(a,b,c){loginHandler(a,b,c)},error:function(){alert("fail");}});
}
function logout(){
    $.ajax('/logout',{success:function(a,b,c){logoutHandler(a,b,c)},error:function(){alert("fail");}});
}

function mainview(){
    $.ajax('/problem',{dataType:'json',success:function(a,b,c){if (checkAccess(a)) problemsHandler(a,b,c)},error:false});
}
function updateStatus(){
    $.ajax('/status',{dataType:'json',success:function(a,b,c){if (checkAccess(a)) updateStatusHandler(a,b,c)},error:false});
}
function updateShip(){
    $.ajax('/ship',{dataType:'json',success:function(a,b,c){if (checkAccess(a)) updateShipHandler(a,b,c)},error:false});
}

    
function loginHandler(data,textStatus,jqXHR){
    if (data['logged_in']){
	$('#login').css('display','none');
	$('#logout').css('display','block');
	$('#name').text(data['username']);
	mainview();
	updateStatus();
	updateShip();
    }
    else
	$('#problem').text(data['msg']);
}

function logoutHandler(data,textStatus,jqXHR){
    $('#problem').html('Для начала работы введите учетные данные');
	$('#logout').css('display','none');
	$('#login').css('display','block');

}

function checkAccess(data){
    var messages={'not logged in':'Ввведите свои данные для работы в Системе','nouser':'Оператор не существует','pwd':'Неверный пароль'}
    if (data["logged_in"]==false && data["msg"]==null){
	$('#problem').html(messages[data["msg"]]);	
	$('#logout').css('display','none');
	$('#login').css('display','block');
	return false
    }
    $('#login').css('display','none');
    $('#logout').css('display','block');
    return true
}


function updateStatusHandler(data,textStatus,jqXHR){
    //TODO: раскрасить
    var Parent=document.getElementById('status');
    while (Parent.childNodes.length>1)Parent.removeChild(Parent.childNodes[1]);
    var styles=['normal','alert','critical'];
    states=['работает','авария','опасность!']
    var table=document.createElement('table');
    for (var i=0;i< data.length;i++){
	var item=data[i];
	var tr=document.createElement('tr');
	table.appendChild(tr);
	for (var key in item){
	    var td=document.createElement('td');
	    if (key=='state'){
		td.innerHTML=states[item[key]];
		tr.className=styles[item[key]];
	    }
	    else
		td.innerHTML=data[i][key];
	    tr.appendChild(td);
	}
    }
    Parent.appendChild(table);
}

function updateShipHandler(data,textStatus,jqXHR){
    // TODO: Раскрасить
    var Parent=document.getElementById('ship')
    var styles=['off','on'];
    var states={'switch':['выкл','вкл'],'door':['закрыто','открыто']}
    while (Parent.childNodes.length>1)Parent.removeChild(Parent.childNodes[1]);
    var tables={'switch':document.createElement('table'),'door':document.createElement('table')};
    for (var i=0;i< data.length;i++){
	var item=data[i];
	var tr=document.createElement('tr');
	tr['partname']=item['part_name']
	tr.onclick=function(){confirmShip(this)}
	tables[data[i]['part_type']].appendChild(tr);
	for (var key in item){
	    if (key!='part_type'){
		var td=document.createElement('td');
		if (key=='state'){
		    td.innerHTML=states[item['part_type']][item[key]];
                    tr.className=styles[item[key]];
		}
		else
		    td.innerHTML=item[key];
		tr.appendChild(td);
	    }
	}
    }
    Parent.appendChild(tables['door']);
    Parent.appendChild(tables['switch']);
}

function confirmShip(Row){
    code=prompt("Введите код доступа","");
    if (code != null){
	$.ajax('/ship/'+Row['partname'],{data:{'answer':code},dataType:'json',success:function(a,b,c){updateShipHandler(a,b,c)},error:false});
    }
}

function problemsHandler(data,textStatus,jqXHR){
// TODO: show active(clickable) list of availible problems
    var styles={true:'passive',false:'active'}
    var Parent=document.getElementById('problem');
    while (Parent.childNodes.length>0)Parent.removeChild(Parent.childNodes[0]);
    var Title=createEl('p','Ваши актуальные задачи:')
    var table=document.createElement('table');
    for (var i=0;i< data.length;i++){
        var item=data[i];
        var tr=document.createElement('tr');
        table.appendChild(tr);
        tr['node_name']=item['node_name'];
        tr.onclick=function(){$.ajax('/problem/'+this['node_name'], {dataType:'json',success:function(a,b,c){problemHandler(a,b,c)},error:false})}
        for (var key in item){
            if (key!='state'){
		var td=document.createElement('td');
                td.innerHTML=item[key];
		tr.appendChild(td);
	    }
            else
                tr.className=styles[item[key]];


        }
    }
    Parent.appendChild(Title)
    Parent.appendChild(table)
}

function problemHandler(data,textStatus,jqXHR){
// TODO: show one problem information
    var Parent=document.getElementById('problem');
    while (Parent.childNodes.length>0)Parent.removeChild(Parent.childNodes[0]);
    var Back=createEl('p','Возврат в меню');
    Back.onclick=function(){mainview()};
    var Title=createEl('p',data[0]['node_name'])
    var Descr=createEl('p',data[0]['descr'])
    var Ans_form=createEl('p',data[0]['ans_data'])
    if (!data[0]['state'])
    {
	while (Ans_form.childNodes.length>0)Ans_form.removeChild(Ans_form.childNodes[0]);
	var field=createInput('text','answer','')
	var btn=createInput('button','check','Есть ответ!')
	btn.onclick=function(){$.ajax('/problem/'+data[0]['node_name'],{data:{'answer':field.value},dataType:'json',success:function(a,b,c){problemHandler(a,b,c)},error:false})}
	Ans_form.appendChild(field);
	Ans_form.appendChild(btn);
	
    }
    Parent.appendChild(Back)
    Parent.appendChild(Title)
    Parent.appendChild(Descr)
    Parent.appendChild(Ans_form)
    if (data[0]['picture']){
	var Pic=createEl('p','<img src='+data[0]['picture']+'>')
	Parent.appendChild(Pic)
    }
}

function createInput(typ,name,val){
    var b=document.createElement('input');
    b.type=typ;
    b.name=name;
    b.value=val;
    return b;
}

function createEl(typ,text){
    var P=document.createElement(typ);
    P.innerHTML=text
    return P
}
