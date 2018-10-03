// -*- encoding:utf-8-*-
//to onload. fill lists and default values. check record id in request. 
function load(){
		$.ajax('/exp/init',{data:{},dataType:'json',success:function(a,b,c){loadHandler(a,b,c)},error:function(a,b,c){console.log('Error:',a,b,c)}});

}

function show_form(formtype){
	document.getElementById(formtype).visibility = true;
}
function save(rowtype){
	var mydata = {
	    'summ':parseFloat($('input[name=summ]').val()),
	    'description':$('input[name=description]').val(),
	    'exptime':$('input[name=exptime]').val(),
	    'category':$('select[name=category]').val(),
	    'is_approx':($('input[name=is_approx]:checked').val()=='on'),
	    'currency':$('select[name=currency]').val(),
	    'location':$('select[name=location]').val(),
	    'is_expence':($('input[name=is_expence]:checked').val()=='expense'),
	    'id':$('input[name=id]').val()
	};
	console.log(mydata);
    $.ajax('/exp/save',{data:mydata,dataType:'json',success:function(a,b,c){saveHandler(a,b,c)},error:false});
}

function loadHandler(data,textStatus,jqXHR){
		for (i=0;i<data.lists.length;i++){
		    var list = data.lists[i].values;
//		    alert ('def_'+data.lists[i]['name']);
			   
		    for (j=0;j<list.length;j++){
			    var opt = createEl('option',list[j]['name']);
			    if (list[j]['name']==data.settings[0]['def_'+data.lists[i]['name']]) //BAD HERE
				opt.selected=true;
			document.getElementById(data.lists[i].name).appendChild(opt);
			}
		}
		//to fill data for edited record
		if (data.record){
			var rec =data.record;
			var keys=Object.keys(rec);
			for (i=0;i<keys.length;i++){
				console.log(rec[keys[i]],$('input[name='+keys[i]+']').prop('type'));
				var field=$('input[name='+keys[i]+']');
				switch (field.prop('type')) {
					case 'checkbox':
						field.prop('checked',rec[keys[i]]);
						break;
					case 'radio':
					//test this line
					$("input[name="+keys[i]+"][value=" + (rec[keys[i]]?'expense':'income') + "]").prop('checked', true);
						break;
					case undefined: //means <select> tag
						$('#'+keys[i]).val(rec[keys[i]]);
						break;
					default:
						$(field).val(rec[keys[i]]);
				}
			}
		}
}

function saveHandler(data,textStatus,jqXHR){
    //Write an answer that saving ok and clear fields
    console.log(data);
		alert('saved ok');
}


function createEl(typ,text){
    var P=document.createElement(typ);
    P.innerHTML=text;
    return P
}


