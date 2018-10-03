//-*- encoding: utf-8 -*-
// для работы необходимо в основном скрипте прописывать фунцию save(parameters) в которой вызывать ajax-запрос с data:parameters
function showError(err){
  console.log(err)
}
//ищет див по имени. если не находит - создает
function getDiv(name)
{
  var div=document.getElementById(name) || document.createElement('div')
  div.id=name
  return div
}

//возвращает ячейку с кнопкой.
function makeBtn(name,value){
  var td=document.createElement('td')
  var b=document.createElement('input')
  b.type='button'
  b.name=name
  b.value=value
  td.appendChild(b)
  return td
}

function requestProcessor(requestName){
  this.request=requestName || 'data'
  this.params={}
  this.table=null;
  this.navigation=null;
  // возвращает абзац с навигацией и содержимым. необходимы входные парамерты:
  // navig - хеш параметров нафигации
  // data - отображаемые данные
  // columns - заголовки колонок таблицы
  // key - тип объекта, он же имя таблицы, он же образующее слово для id объектов и значение type в параметрах запроса
  // requestname - имя ajax-запроса для содержимого таблицы
  // onclick - функция вызываемая для ячеек при клике. не пересекается с редактируемостью
  // additional_fn - произвоьная ф-ция с параметрами (row,item) - строка таблицы и элемент массива данных
  // newbutton - булево значение, показываети необходимость строки создания нового объекта
  this.createTable = function(resp,key,search,requestname,onclick,additional_fn,newbutton)
  {
    this.onclik=onclick;
    this.additional_fn=additional_fn;
    this.newbutton=newbutton;
    var params=this.params
    var columns=resp['columns']
    if(requestname) this.request=requestname;
    params['type']=key;
    params['name']=search
    var p=document.createElement('p');
    this.navigation=this.createNavigation(resp['nav'],key)
    p.appendChild(this.navigation);
    this.table=document.createElement('table')
    var table=this.table;
    table.id='_t_'+key
    //заголовок таблицы
    table.appendChild(tableHeader(columns))
    //заполнение данными
    table.appendChild(tableBody(resp['data'],onclick,additional_fn))
    addControl(table)
    if (newbutton)
      addNewLine(table)
    // добавляется возможность редактирования и сортировки.
    if(columns){
      var editableVlan=new EditableGrid("vlan",{enableSort:true,doubleclick: true})
      editableVlan.attachToHTMLTable(table,tableColumns(columns)) 
      $.each(columns,function(col){editableVlan.setHeaderRenderer(col,SortHeaderRendererWithSql)})
      editableVlan.renderGrid()
    }
    p.appendChild(table);
    return p
  }
  this.refreshTable = function(resp)
  {
    var columns=resp['columns']
    this.navigation=this.createNavigation(resp['nav'],this.params['type'])
    var table=this.table;
    while (table.childNodes.length>0)
      table.removeChild(table.firstChild)
    table.appendChild(tableHeader(columns))
    table.appendChild(tableBody(resp['data'],this.onclick,this.additional_fn))
    addControl(table)
    if (this.newbutton)
      addNewLine(table)
    // добавляется возможность редактирования и сортировки.
    if(columns){
      var editableVlan=new EditableGrid("vlan",{enableSort:true,doubleclick: true})
      editableVlan.attachToHTMLTable(table,tableColumns(columns)) 
      $.each(columns,function(col){editableVlan.setHeaderRenderer(col,SortHeaderRendererWithSql)})
      editableVlan.renderGrid()
    }
  }
  //создает заголовок таблицы с указаными колонками
  function tableHeader(columns){
    var header=document.createElement('thead')
    var hr=header.insertRow(0)
    if (columns){
      var i=0;
      $.each(columns,function(key,value){ //заполнение колонок
	var cell=hr.insertCell(i++)
	cell.innerHTML=value
	cell.id='_h_'+key  
      });
    }
    return header;
  }
  //создает массив COLUMNS для EditTable
  function tableColumns(columns){
    ret=[]
    $.each(columns,function(index,item){
      ret.push(new Column({name:item,datatype:'text'}))
    });
    return ret
  }
  //создает тело таблицы заполеннное данными.
  // additional_fn вызывается для каждой строки вставляемой в таблицу после её заполнения.
  function tableBody(data,click_fn,additional_fn){
    var tb=document.createElement('tbody')
    if (data){
      $.each(data,function(index,item){
	var row=tb.insertRow(index) //строка на каждую запись
	if(click_fn)
	  row.onclick=function(ev){click_fn(item,ev)}
	$.each(item,function(key,val){
	  var r=document.createElement('td') // клетка на каждое поле
	  r.id='_f_'+key
	  $(r).addClass('send')
	  row.appendChild(r)
	  var content=document.createTextNode(val)
	  r.appendChild(content)
	  var oldval=document.createAttribute('oldval')
	  oldval.nodeValue=val;
	  r.setAttributeNode(oldval)
	});
	if (additional_fn)
	  additional_fn(row,item)
      });
    }
    return tb
  }

  //добавляет строке управляющие кнопки
  function addControl(table)
  {
    $.each(table.tBodies[0].rows,function(ind,row){
      //кнопка удаления объекта
      var delbtn=makeBtn('delete','delete')
      delbtn.onclick=function(){
	var params={req:'del',obj:table.id.substring(3)}
	$.each(row.cells,function(index,cell){
	  if ((cell.firstChild)&&(cell.firstChild.nodeType==3))
	  {
	    debug (cell.id.substring(3))
	    params[cell.id.substring(3)]=cell.innerHTML}
	});
	console.log('delete params')
	console.log(params)
	save(params)
      }  
      //кнопка сохранения  
      var savebtn=makeBtn('save','save')
      savebtn.onclick=function(){
	var par={
	  'obj':table.id.substring(3),
	  'req':'edit'}
	var fields=row.getElementsByClassName('send')
	$.each(fields,function(index,r){
	  par[r.id.substring(3)+'_n']=r.innerHTML
	});
	$.each(row.cells,function(index,cell){
	  if ((cell.firstChild)&&(cell.firstChild.nodeType==3))
	    par[cell.id.substring(3)]=cell.getAttribute('oldval')
	});
	save(par)
      }
      row.appendChild(savebtn)
      row.appendChild(delbtn);    
    });
  }
  
  function addNewLine(table)
  {
    var columns=table.tHead.rows[0].cells
    var row=table.tBodies[0].insertRow(0)
    $.each(columns,function(index,column){
      var td=row.insertCell(index)
      td.id=column.id
      td.innerHTML='[new '+column.id.substring(3)+']'
      $(td).addClass('send')
    });
    var savebtn=makeBtn('save','save')
    savebtn.onclick=function(){
      var par={
	'obj':table.id.substring(3),
	'req':'new'}
      var fields=row.getElementsByClassName('send')
      //    $.each(params,function(index,value){
      //    par[index]=value
      //});
      $.each(fields,function(index,r){
	par[r.id.substring(3)+'_n']=r.innerHTML
      });
      
      save(par)
    }
    row.appendChild(savebtn)
  }

  this.createNavigation=function(data,type){
    var panel=getDiv(type+'_nav')
    var sep=' : '
    var self=this;
    panel.innerHTML=''
    panel.className='nav'
    var lastpage=Math.floor(data['count']/20)//per_page
    function nav_item(i)
    {
      var link=document.createElement('a');
      link.innerHTML=i
      link.href=self.request
      link.i=i
      var params=data
      params['type']=type;
      params['lim']=20
      link.onclick=function(){
	self.params['page']=this.i,
	$.ajax(self.request,{data:self.params,success:function(r,text,xhr){self.refreshTable($.parseJSON(xhr.responseText))},error:function(r,text,err){debug(text);debug(r)}})
	return false; 
      }
      return link
    }
    var start=Math.max(parseInt(data['current'])-3,1)
    var end=Math.min(parseInt(data['current'])+3,lastpage-1)
    var slink=nav_item(0)
    panel.appendChild(slink)
    if (data['current']==0) 
	$(slink).css({'font-weight':'bold','color':'red'})
    panel.appendChild(document.createTextNode(sep))
    if ( data['current'] > 3 ) {panel.appendChild(document.createTextNode('...'+sep))}
    for (i=start;i<=end;i++){
      link=nav_item(i);
      if (data['current']==i) 
	$(link).css({'font-weight':'bold','color':'red'})
      panel.appendChild(link)
      panel.appendChild(document.createTextNode(sep))
    }
    if ( data['current'] < lastpage-3 ) {panel.appendChild(document.createTextNode('...'+sep))}
    var elink=nav_item(lastpage)
    panel.appendChild(elink)
    if (data['current']==lastpage) 
	$(elink).css({'font-weight':'bold','color':'red'})
    return panel
  }
  var self=this
  function SortHeaderRendererWithSql(columnName, cellRenderer) { this.columnName = columnName; this.cellRenderer = cellRenderer; };
  SortHeaderRendererWithSql.prototype = new CellRenderer();
  SortHeaderRendererWithSql.render = function(cell, value) 
  {
    
    if (!value) {}
    else {
      // create a link that will sort 
      var link = document.createElement("a");
      cell.removeChild(cell.firstChild)
      cell.appendChild(link);
      link.columnName = value;
      link.style.cursor = "pointer";
      link.innerHTML = value;
      if(self.params['order']==link.columnName)
	link.innerHTML+= (self.params['desc'] && ' &darr;') || ' &uarr;';
      link.editablegrid = this.editablegrid;
      link.renderer = this;
      link.onclick = function() {
	debug(self)
	if(self.params['order']!=this.columnName) 
	  self.params['desc']=false
	else
	  self.params['desc']=!self.params['desc']
	self.params['order']=this.columnName;
	$.ajax(self.request,{data:self.params,success:function(r,text,xhr){self.refreshTable($.parseJSON(xhr.responseText))},error:function(r,text,err){debug(text);debug(r)}})
	return false; 
      };    
    }
  };
};