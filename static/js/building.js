// -*- encoding:utf-8-*-
//to onload. fill auth sector, status sector, stars, and start picture
function load(){
    return null;
}

function cut(){
    var Data=$('#to_saw').val().split('\n');
    Separator='\t';
    for (var i=0;i<Data.length;i++){
	Data[i]=Data[i].split(Separator);
	if (Data[i].length==1)
	    Data[i]=Data[i][0].split(';');
    }
    $.ajax('/cutting',{data:{'to_saw':JSON.stringify(Data)},/*type:'POST',*/dataType:'json',success:function(a,b,c){cutHandler(a,b,c)},error:false});
}

function cutHandler(data,textStatus,jqXHR){
    var bars=data['sawed']
    var rem=data['total_rem']
    var Parent=document.getElementById('output');
    while (Parent.childNodes.length>0)Parent.removeChild(Parent.childNodes[0]); // clear output
    var line=createEl('p',"Bars count: "+bars.length+"<br>Total Remainder is "+rem)
    Parent.appendChild(line);
    for (var i=0;i<bars.length;i++){
	var Line=createEl('p',i+': rem: '+bars[i]['remainder'] +" cut: "+bars[i]['parts'])
//	var Bar=createBar(bars[i]);
//	Line.appendChild(Bar)
	Parent.appendChild(Line);
	
    }   
}

function createBar(bar){
    var tr=createEl('tr','');
    var table=createEl('table','');
    table.appendChild(tr);
    for (var i=0;i<bar['parts'].length;i++){
	var td=createEl('td',bar['parts'][i]);
	td.style.width=bar['parts'][i]+'px';
	td.style.border='solid 1px';
	tr.appendChild(td);
    }
    return table
}

function createEl(typ,text){
    var P=document.createElement(typ);
    P.innerHTML=text
    return P
}


