// -*- encoding:utf-8 -*-
function init(){
    svg=null
    jQuery.post('/persongraph',{},function(data,textStatus){createMap(data)});
    Coherency=2
}

//рисование устройства
function drawPerson(user,map){
    var unit=10
    var width=40
    var height=20
    var dev=map.group(map,user['username'],user.x,user.y);
    var point=map.rect(0,0,width,height)
    point.node.id=user['username']//+'point'
    var label=map.text(10,10,user['username'])
    dev.push(point)
    dev.push(label)
    label.attr({ "font-size": 12, "font-family": "Tahoma","text-anchor":"start"});
    label.node.className.baseVal='label'
    dev.drag(enddrag)
    dev.item=user
    return dev
}

function drawConnection(name1,name2,count,svg){
    var f1=document.getElementById(name1)
    var f2=document.getElementById(name2)
    var x1=parseInt(f1.getAttribute('x')),y1=parseInt(f1.getAttribute('y')),
    x2=parseInt(f2.getAttribute('x')),y2=parseInt(f2.getAttribute('y'));
    var str1="M"+x1+','+y1+'C'+x1+','+(y1+y2)/2+' '+(x1+x2)/2+','+(y1+y2)/2+' '+(x1+x2)/2+','+(y1+y2)/2
    var str2="M"+(x1+x2)/2+','+(y1+y2)/2+'C'+(x1+x2)/2+','+(y1+y2)/2+' '+x2+','+(y1+y2)/2+' '+x2+','+y2
    //  var label1=map.text(10,10,device['sysname'])
    //  var label2=map.text(10,10,device['sysname'])
    var colors=['#efefef','#eee','#555555','#000','#00ff00','#ff0000']
    var line=[svg.path(str1),svg.path(str2)]
    /********  TODO: set line style with terminations textStatus */
    line[0].attr({'stroke':colors[count]})
    line[1].attr({'stroke':colors[count]})
    line['terminations']=[f1,f2]
    return line
}

//рисование карты
function createMap(data,textStatus){
    var meta={'width':1200,'height':1000}
    Pairs=data['data']
    Persons=parse_pairs(Pairs)
    lines=[]
    if (!svg)
	svg=Raphael(160,0,meta['width'],meta['height'])
    else
	svg.setSize(meta['width'],meta['height'])
    svg.clear()
    for (var i=0;i<Persons.length;i++){
	Persons[i].x=(i*40+10)%(meta['width']*0.9)
	var x= Persons[i].x-meta['width']*0.4
	var Radius2=Math.pow(meta['height']*0.5,2)
	Persons[i].y=Math.sqrt(Radius2-x*x)%meta['height']
	drawPerson(Persons[i],svg)
    }
    reDrawConnections(Pairs)
}

function parse_pairs(Pairs){
    result=[]
    for (var i=0;i<Pairs.length;i++){
	for (var j=0; j<2;j++)
	    if (result.indexOf(Pairs[i]['names'][j])==-1)
		result.push(Pairs[i]['names'][j])
	
    }
    for (var i=0;i<result.length;i++)
	result[i]={'username':result[i]}
    return result
}

function reDrawConnections(Contacts){
    // Contact: [[A,B],Count]
    for (var i=0;i<lines.length;i++){
	lines[i][0].remove()
	lines[i][1].remove()
    }
    lines.length=0;
    for (i=0;i<Contacts.length;i++)
	if (Contacts[i]['count']>=Coherency)
	    lines.push(drawConnection(Contacts[i]['names'][0],Contacts[i]['names'][1],Contacts[i]['count'],svg))
}

function enddrag(it){
    var g=it.node.parentNode
    var del=false
    g.ismoved=true;
    var nodes=Array.prototype.slice.call(g.childNodes)
    reDrawConnections(Pairs)
}

function ids(array,field){
    ret=[]
    for (var i=0;i<array.length;i++){
	ret.push(array[i][field])
    }
    return ret
}


function add_plane(){
    var form=div('plane_form','form')
    var name=input('name','text')
    var x=input('x','text')
    var y=input('y','text')
    form.appendChild(document.createTextNode('Name:'))
    form.appendChild(name)
    form.appendChild(document.createElement('br'))
    form.appendChild(document.createTextNode('width:'))
    form.appendChild(x)
    form.appendChild(document.createElement('br'))
    form.appendChild(document.createTextNode('height:'))
    form.appendChild(y)
    var ok=input('ok','button','ok')
    var cancel=input('cancel','button','cancel')
    form.appendChild(ok)
    form.appendChild(cancel)
    $('#control').append(form)
    ok.onclick=function(){
	data={'name':name.value,'width':x.value,'height':y.value,'csrfmiddlewaretoken':csrf_token}
	jQuery.post('newmap/',data,function(dat,Status){
	    //можно обнавлять старницу?
	    var el=document.createElement('option')
	    el.value=dat
	    el.innerHTML=data['name']
	    el.selected="selected"
	    $('#id_planes').append(el)
	    jQuery.post('map/',{'map':dat,'csrfmiddlewaretoken':csrf_token},function(data,textStatus){createMap(data)});
	})
    }
}

function updateState(){
    reDrawConnections(Pairs);
}

function processState(data){
    //draw connections brightly
    var colors=['green','yellow','red']
    for (var i=0;i<data.length;i++){
	var item=data[i]
	port=document.getElementById(item[0]+'--'+item[1])
	port.setAttribute('style','fill:'+colors[item[2]])
	port['textState']=item[3]
	port['numState']=item[2]
    }
    reDrawConnections(Pairs)
}

function changeCoherency(){
    Coherency=parseInt($('#cogerent option:selected').html());
    updateState()
}