//TODO
// список постраничный, но сортировка в пределах листа. придумать глобальную сортировку
function ajaxSetup(){
  jQuery.ajaxSetup({type:'POST',async: false,dataType:'json'})
}
var debug = function() {
  // В firefox без firebug-а нет console.log
  if(window.console && typeof console.log === "function")
    window.console.log.apply(window.console, arguments)
}
function init(){
  ajaxSetup()
  reqProc=new requestProcessor('/all')
}

function find(str,type){
  var reqProc= new requestProcessor('/all')
  $.ajax('/all',{data:{'type':type,'name':str},success:function(r,text,xhr){showTable($.parseJSON(xhr.responseText),type,str,reqProc)},error:function(r,text,xhr){}})  
}

function showTable(resp,type,search,processor){
  if(typeof(resp)=='string'){
    getDiv('info').innerHTML=resp
    return null
  }
  var div=getDiv(type)
  div.removeChild(div.lastChild)
  div.appendChild(processor.createTable(resp,type,search,'/all',null,null,true))
}

function save(params){
  $.ajax('/save',{data:params,success:function(r,text,xhr){getDiv('info').innerHTML='saving result:'+xhr.responseText;}, error:function(r,text,err){debug(text);debug(r);} })
}

