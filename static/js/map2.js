
// -*- coding: utf-8; js-indent-level: 2 -*-

//TODO:
// остался косяк позиционирования при вытаскивании объекта из прокрученного списка. не придумал как его выиграть.
//    - запилить фильтры. 
// вернуть на место ориентацию ящиков на центр а не на угол.

// УК - Условные Координаты

//
// Вспомогательные функции
//
stateis=1;  //Отлов нажатия кнопок для показа боковой панели
statein=1;  //Отлов нажатия кнопок для показа боковой панели
document.onkeydown=function(e){
  var e=window.event || e;
  var vstate=['visible','hidden'];
  if (e.keyCode==120)
  {
    stateis++
    $('switchstab').style.visibility=vstate[stateis%2];
  }
  if (e.keyCode==119)
  {
    statein++
    $('nodestab').style.visibility=vstate[statein%2];
  }
}

function ajax(url, handler, otherparams) {
  var result
  // method: "post"
  params = {
    // debugging
    onFailure: function(r){
      document.write(r.responseText);
    }	
  }
  if(!handler) {
    handler=function(r){
      result=r
    }
    params.asynchronous = false
  }
  params.onSuccess = handler
  new Ajax.Request(url, Object.extend(params, otherparams))
  return result
}

function ajaxjson(url, params) {    
  return ajax(url, undefined, params).responseJSON
}


//
var debug = function() {
  // В firefox без firebug-а нет console.log
  if(window.console && typeof console.log === "function")
    window.console.log.apply(window.console, arguments)
  // else {
  //   FF:
  //   Components.utils.reportError.apply
  // }
}

//
// Точка или пара объектов(чисел) 
// P - point, pair
var P = Class.create({
  initialize: function(x,y){
    assert(typeof x == typeof 1 && typeof y == typeof 1, "invalid arguments: P " + x + ", " + y) //гарантирует что координаты - числа.
    this.x=x
    this.y=y
  },
  //арифметика
  add: function(p) {return new P(this.x+p.x, this.y+p.y)}, 
  sub: function(p) {return new P(this.x-p.x, this.y-p.y)},
  mul: function(p) {return new P(this.x*p.x, this.y*p.y)},
  div: function(p) {return new P(this.x/p.x, this.y/p.y)},
  
  neg: function() {return new P(-this.x, -this.y)},

  between: function(p1,p2) {
    if ( ((Math.abs(this.x-p1.x) +  Math.abs(this.x-p2.x)) ==  Math.abs(p2.x-p1.x)) && ((Math.abs(this.y-p1.y) +  Math.abs(this.y-p2.y)) ==  Math.abs(p2.y-p1.y)) ) 
      return true;
    return false;
  },
  //
  apply: function() {
    var args=Array.from(arguments) //получили массиы аргументов
    var fn=args.pop() //имя применяемой ф-ции
    args.unshift(this) //добавление точки в начало
    var argsx=args.map(function(p){return p.x}) //разбирает все эл-ты массива на x и y. а если там не точка была? 
    var argsy=args.map(function(p){return p.y})
    return new P(fn.apply(undefined, argsx), 
		 fn.apply(undefined, argsy))
  },
})

// Создание точки из (любого) объекта
P.make = function(obj, xname, yname)  {
  return new P(obj[xname || "x"], obj[yname || "y"])
}


//
//
//задание размера элемента
Element.prototype.setSize = function(s) {
  this.setStyle({width: s.x + 'px', height: s.y + 'px'});
}
//задание координат левого верхнего угла элемента
Element.prototype.setPos = function(p){
  this.setStyle({left: p.x + "px", top:  p.y + "px"})
}


//
//
//
function initArray(len, fn) {
  arr = []
  var val=fn
  if(!(typeof fn == "function")) {
    fn=function(){ return val; }
  }
  for (var index = 0; index < len; ++index) { //заполняет массив результатами применения fn к индексам эл-тов.
    arr.push(fn(index))
  }
  return arr;
}


//
// ASSERT
//
function AssertException(message) {
  this.message = message; 
}

AssertException.prototype.toString = function () {
  return 'AssertException: ' + this.message;
}

function assert(exp, message) { //проверяет истинность выражения и выбрасывает исключение если ложно
  if(!exp) {
    debug(message)
    throw new AssertException(message||"");
  }
}

////////////////////////////////////////////////////////////////////////////////

//
// TODO Общая информация о представлении и данных и алгоритмах
// Окно, слои, клетки
//

//
// Application Class
// 
var MapApp = Class.create({
  // Инициализация
  initialize: function() {    
    // debug(Prototype.Version) 
    var self=this
    this.check_fn=reset_filter;
    this.timestamp=Math.round((new Date()).getTime() / 1000);
    this.check_params=null;
    this.state = ["up", "soft", "soft",  "up", "down", "unknown"];
    this.main=$('maindiv')
    this.draggables=[];
    // Получение параметров изображения
    var meta=ajaxjson('/metainfo')
    debug("meta: ", meta)
    // Размеры одной клетки
    this.cellSizePx = new P(meta.x_resolution, meta.y_resolution)
    // Список слоев
    this.layers = meta.layers.map(function(sz){
      return {csize: new P(sz[0], sz[1])}})
    //параметры пересчета геокоординат в пиксели и обратно
    this.Y_Y = meta.geo_start[0];
    this.X_LONGITUDE= meta.geo_start[1];
    this.wrap_coef  = meta.wrap_coef;
    //заполнение таблицы свичей. в идеале неплохо бы избавиться от глобальной переменной switches
    this.tabbody=$('tbody');
    this.nbody=$('nbody')
    this.an_correction=new P(4,4); //предполагаемый "центр тяжести" свича относительно его краев
    this.anode_layer=document.createElement('div');
    this.anode_layer.id='nodelayer';
    this.anode_layer.className='nodelayer';
    this.anode_layer.reSize=function(layerno){
      $A(this.childNodes).each(function(n){
	if (n.nodeType==1)
	{
	  var anode=nodes.detect(function(el){return el.name==n.id})
	  var pos=self.toPx(/*self.to_pix*/(new P(anode.x, anode.y)));
	  n.setPos(pos.sub(self.an_correction));
	  n.className=n.className.replace(/size[0-9]/,'size'+Math.floor(layerno/2));
	}
      }); 
      if($('nbody').childNodes.length>1)
	$A($('nbody').childNodes).each(function(tr){
	  if(tr.nodeType==1){
	    var n=tr.childNodes[0].childNodes[0];
	    n.className=n.className.replace(/size[0-9]/,'size'+Math.floor(layerno/2));
	  }
	});
    }
    //инициализация эл-тов управления 
    var popup=document.createElement('div')
    popup.id='popupinfo'
    popup.hide();
    this.main.appendChild(popup);
    $('edit_map').onclick=function(){self.editMapMode();}
    $('save_map').onclick=function(){self.saveMap();}
    $('edit_sw').onclick=function(){self.editMode();}
    $('save_sw').onclick=function(){self.saveSw();}
    $('filter_n').onclick=function(ev){self.create_filter(ev);}
    $('refresh_state').onclick=function(){updateState();}
    this.isEditMap=false;
    this.isEditMode=false;
    this.buff=$('buff');
    //инициализация фильтра показываемых свичей
    //TODO: вынести их в конфиг?
    this.resize_coef=meta.resize_coef
    $('zoomtotal').innerHTML=this.layers.size()
    // Изменение размеров окна
    this.setMainSize()
    window.onresize = function(){self.setMainSize()}
    // Кнопки "-" и "+"
    $('zoomout').observe('click', function(){self.zoom(-1)})
    $('zoomin').observe('click', function(){self.zoom(1)})
    // var layerno=this.layers.size()/2).ceil()-1
    this.setLayer(0)
    this.updateView()
    this.nodes=nodes
    this.switches=switches
    switches.each(function(sw){
      var el=createItem(sw,'switch');
      el.observe('mouseover',function(){if(self.isEditMode)self.makeDraggable(this,sw.node)});
      if (has_no_coords(sw))
	self.ins_to_list(self.tabbody,el,sw['adr']); 
    });
    this.place_nodes();
    updateState();
    this.timer=new PeriodicalExecuter(updateState, 300);
  },
  
  // Установить размеры div#main
  setMainSize: function() {
    // var borders = 0*2 // Ширина border-а - 5px
    this.main.setSize(new P(window.innerWidth, window.innerHeight)) //растяжение main на всю вкладку
    this.windowSize=new P(this.main.offsetWidth, this.main.offsetHeight)
    this.windowCenter=this.windowSize.div(new P(2,2)) //координаты центра рабочей области
    this.windowSizeCell=this.windowSize.apply(this.cellSizePx, function(a, b){ 
      return Math.ceil(a/b)})
  },
  
  layerPos: function(){ //координаты активного слоя
    return new P(this.layer.drag.offsetLeft, this.layer.drag.offsetTop)
  },

  // Позиция окна относительно слоя = -(позиция слоя относительно окна)
  windowPos: function(){
    return this.layerPos().neg()
  },

  updateView: function() {
    var ltPx=this.windowPos()
    // Позиция окна "в клетках": отношение позиции в пикселях к размеру клетки
    // координаты левого верхнего должны быть > 0
    var lt=ltPx.apply(this.cellSizePx, function(pos, cz){
      return Math.max(0, (pos/cz).floor())})	
    var layer=this.layer
    // координаты правого нижнего должны быть < размеров слоя 
    var rb = lt.apply(this.windowSizeCell, layer.csize, function(lt, size, ls) {
      return Math.min(lt + size, ls - 1)})
    // debug("lt, rb: ", lt, rb)
    var cells=layer.cells
    $R(lt.y, rb.y).each(function(y){
      $R(lt.x, rb.x).each(function(x){
     	cells[y][x].load()})})
  },
  
  initLayer: function(layer, layerno) {
    var self=this
    var layer_resize_coef=Math.pow(this.resize_coef, layerno) // pow может давать неточное значение
    layer.resize_coef=new P(layer_resize_coef, layer_resize_coef)
    var drag=$(document.createElement('div'))
    layer.drag=drag
    drag.className="draged"
    drag.id="draged"
    drag.hide()
    self.main.appendChild(layer.drag)
    // Размер div-а в пикселях: размер в клетках * размер клетки
    drag.setSize(layer.csize.mul(self.cellSizePx))
    // Матрица клеток инициализируется null-ами	
    // не nul-ами а пустыми объектами. вводит в заблуждение.
    layer.cells=$R(0, layer.csize.y-1).map(function(y) {
      return $R(0, layer.csize.x-1).map(function(x) {
	var cell={}
	// Отложенная инициализация клетки, вызывается из updateView
	cell.load = function() {
	  if(cell.div)
	    return;
	  var div=document.createElement('div')
	  drag.appendChild(div)
	  div.className='cell'
	  div.setPos(self.cellSizePx.mul(new P(x,y)))
	  var img=document.createElement('img')
	  // Сделать url настраиваемым, чтобы можно было отдавать картинки с другого сервера
 	  img.src="/slice/map-" + layerno + "-" + x + "-" + y + ".png"
	  div.appendChild(img)
	  cell.div=div}
	return cell})
    })
    // Драг-и-Дроп
    new Draggable(drag, {
      zindex: 1,
      onStart: function() {
	drag.style.cursor = "move";
      },
      // change: function() {
      // 	fillVisibleMap();
      // 	self.updateView()
      // },
      onEnd: function() {
	drag.style.cursor = "default";
	self.updateView()
	// visible_devices()
      },
    })
    //перехват событий мыши
    // Колёсико
    var evName=Prototype.Browser.Gecko ? 'DOMMouseScroll' : 'mousewheel'
    drag.observe(evName, function(ev){	    
      // Хак для ff3.5 linux / prototypejs 1.7
      // if ev.type == "DOMMouseScroll"
      ev.pointer=ev.pointer || function() {  
	return new P(ev.clientX, ev.clientY)
      }
      ev.stop=ev.stop || function(){} //отмена прокрутки страницы по колесу
      //
      var pos=self.getEvPos(ev, self.main) // пересчет координат относительно maindiv-а 
      // debug("pos=", pos, "ev.detail=", ev.detail, "ev.wheelDelta=", ev.wheelDelta)
      var d=ev.detail ? -ev.detail : ev.wheelDelta  
      if(d == 0) {
	return;
      }
      d=d > 0 ? 1 : -1  //определение в какую сторону менять размер
      // debug("pos=", pos, " d=", d)
      ev.stop()
      self.zoom(d, pos)
    })
	
    // Двойной клик
    drag.observe('dblclick', function(ev){ 
      // Точка события перемещается в центр
      var pos=self.getEvPos(ev, self.main)
      // l2 = l1 + (window center - window event pos)
      drag.setPos(self.layerPos().add(self.windowCenter.sub(pos)))
      // Увеличение
      self.zoom(1)
    })
    
    // Движение мышки
    drag.observe('mousemove', function(ev){
      var pos=self.getEvPos(ev, drag) //пересчет координат относительно угла движущегося div-а
      //pos=self.fromPx(pos) //получение координат в условных единицах
      pos=/*self.to_geo*/(self.fromPx(pos)) //получение координат в условных единицах
      $('coor').innerHTML=pos.x.toFixed(6) + ", " + pos.y.toFixed(6) // + '<br>' + "" //отображение в info.
    })
  },
    
  // Выбор актовного слоя
  // Вызывается при смене масштаба
  setLayer: function(layerno) {
    // assert(layerno >= 0 && layerno < this.numLayers, "layerno:" + layerno)	
    var layer = this.layers[layerno]
    assert(layer, "setLayer: bad layerno=" + layerno) //обработка индека несуществующего слоя
    if(this.layer === layer) //если новый слой равен текущему - выход
      return;
    if(!layer.cells) { //если слой еще не использовался - init
      this.initLayer(layer, layerno)
    }
    // Текущий слой прячется
    if(this.layer) {
      this.layer.drag.hide();
    }
    this.layer=layer;
    this.layerno=layerno;
    $('zoomcount').innerHTML=layerno+1;
    layer.drag.appendChild(this.anode_layer);
    this.anode_layer.reSize(layerno);
    layer.drag.show() //слой ставший текущим появляется
    // debug("layer: ", this.layerno+1)
    // debug("this.layer=", this.layer)
  },

  // возвращает координату события в пикселях относительно el
  getEvPos: function(ev, el){
    // "absolute position of the pointer for a mouse event"
    var evp=P.make(ev.pointer())
    // "offsets of element from the top left corner of the document"
    var ofs=P.make(Element.cumulativeOffset(el), "left", "top")
    // pos = evp - ofs
    return evp.sub(ofs)
  },
    
  // УК -> Px
  toPx: function(p) {
    return p.mul(this.layer.resize_coef)
  },

  // Px -> УК
  fromPx: function(p) {
    return p.div(this.layer.resize_coef)
  },

  zoom: function(d, w) {
    var newLayerno=this.layerno+d
    if(!this.layers[newLayerno])
      return;
    var k1=this.layer.resize_coef
    var l1=this.windowPos()
    w=w||this.windowCenter
    this.setLayer(newLayerno)
    var k2=this.layer.resize_coef
    // l2=(l1+w1)*k2/k1-w2
    l2=l1.add(w).mul(k2).div(k1).sub(w)
    this.layer.drag.setPos(l2.neg())
    this.updateView()
  },

  editMode : function(){
    var self=this;
    // в этом режиме окно информации показывать только по клику?
    // все ноды сделать приемниками свичей (в т.ч. и в списке)
    // если свич утаскивается на "склад" - тогда н а склад
    self.isEditMode=true;
    nodes.each(function(nod){
      var node=$(nod.name);
      Droppables.add
      ( node, 
	{accept: 'switch', hoverclass:'hover', onDrop:function(sw,n)
	 {
	   var swch=switches.detect(function(el){return el.name==sw.id});
	   swch.node=n.id;
	   swch.isMoved=true;
	   self.buff.appendChild(sw);
	 }
	}
      )
    });
    Droppables.add
    ( $('switchstab'), 
      {accept: 'switch', onDrop:function(sw,n)
       {
	 var swch=switches.detect(function(el){return el.name==sw.id})
	 swch.isMoved=true;
	 swch.node=null;
	 self.ins_to_list(self.tabbody,sw,swch['adr']);
	 debug("captured");
       }}
    );
    $('save_sw').disabled=false;
    $('edit_sw').onclick=function(){self.unEditMode();}    
    $('edit_sw').value="stop"
  },

  unEditMode : function(){
    self=this;
    self.isEditMode=false;
    $('edit_sw').onclick=function(){self.editMode();};
    $('edit_sw').value="edit"
    $A(self.anode_layer.childNodes).each(function(d){Droppables.remove(d)});
    $A(self.draggables).each(function(item){item.destroy()});
    self.draggables.clear();
  },
  
  editMapMode : function()
  {
    var self=this;
    // маяк что все стало редактируемым
    this.isEditMap=true;

    //при попадании на таблицу объект не захватывается. надо фиксить 
    Droppables.add
    ( $('nodestab'), 
      {accept: 'node', hoverclass:'hover', onDrop:function(n,layer)
       {
	 var nd=nodes.detect(function(el){return el.name==n.id});
	 nd.isMoved=true;
	 nd.x=null;
	 nd.y=null;
	 self.ins_to_list(self.nbody,n,nd['adr']);
	 debug("captured in bay")
       }
      }
    );
    //не всегда срабатывает. причину не понял.
    Droppables.add
    ( $('nodelist'), 
      {accept: 'node', hoverclass:'hover', onDrop:function(n,layer)
       {
	 var nd=nodes.detect(function(el){return el.name==n.id});
	 nd.isMoved=true;
	 nd.x=null;
	 nd.y=null;
	 self.ins_to_list(self.nbody,n,nd['adr']);
	 debug("captured in nodelist")
       }
      }
    );

    Droppables.add
    ( self.anode_layer, 
      {accept: 'node', hoverclass:'hover', onDrop:function(n,layer)
       {
	 var nd=nodes.detect(function(el){return n.id==el.name});
	 var pos=P.make(Element.cumulativeOffset(n), "left", "top");
	 self.anode_layer.appendChild(n);
	 var base=self.anode_layer
	 var basecorner=new P(base.parentNode.offsetLeft,base.parentNode.offsetTop) //координаты движущейся части от экрана
	 pos=pos.sub(basecorner)
	 n.setPos(pos)
	 pos=(self.fromPx(pos)) //получение координат в условных единицах
	 self.set_coords(nd,pos);
	 nd.isMoved=true;
	 n.onmouseover=function(){if(!self.isEditMap)self.showInfo(this)};
	 n.onmouseout=function(){$('popupinfo').hide()};
	 n.observe('click',function()
		   {
		     this.onmouseout=null;
		     var n=this
		     if(!self.isEditMap)self.showInfo(this)
		     $('popupinfo').onmouseout=function(){n.onmouseout=function(){$('popupinfo').hide()};}
		   }); 
       }
      }
    );

    $('save_map').disabled=false;
    $('edit_map').onclick=function(){self.unEditMapMode();}    
    $('edit_map').value="stop edit"
    $A(this.anode_layer.childNodes).each(function(elem){ //все кто на карте становятся draggable
      if (elem.nodeType==1){
	elem.style.cursor = "move"
      }
    });
  },
  
  unEditMapMode : function()
  {
    var self=this;
    //маяк что все прилипло по местам
    this.isEditMap=false;
    $('edit_map').onclick=function(){self.editMapMode();};
    $('edit_map').value="edit map"
    $('save_map').disabled=true;
    $A(this.anode_layer.childNodes).each(function(elem){ //всем кто на карте возвращаем вид курсора
      if (elem.nodeType==1)
	elem.style.cursor = "default"	
    });
    $A(self.anode_layer.childNodes).each(function(d){Droppables.remove(d)});
    debug(self.draggables);
    $A(self.draggables).each(function(item){item.destroy()});
    self.draggables.clear();
  },	
  //делает объект подвижным
  makeDraggable : function(item,is_placed)
  {
    if (this.draggables.detect(function(element){return element.handle.id==item.id}))
      return;
    var tmp=new Draggable(item, {revert:false, onStart:function(){ 
      var nest=item.parentNode;
      var pos=P.make(Element.cumulativeOffset(item),"left","top");
      //случается слишком поздно. как лечить - не осилил ___FAIL___
      pos=pos.sub(P.make(Element.cumulativeScrollOffset(item),"left","top"));
      //debug(pos);
      //он не случается, почему-то
      item.setPos(pos)
      $('maindiv').appendChild(item); // чтобы был виден во время таскания
      if (nest.parentNode && nest.parentNode.nodeName=='TR')
	nest.parentNode.parentNode.removeChild(nest.parentNode);
    }});
    this.draggables.push(tmp); 
  },
  set_coords :function(th, p)
  {
    var pt=p//this.to_geo(p);
    th.y=pt.y;
    th.x=pt.x;
  },
  //перевод геокоординат в пиксели.
  to_pix : function(p)
  {
    var pt = new P(0,0);
    pt.x=(p.x-this.X_LONGITUDE)/this.wrap_coef[0];
    pt.y=(p.y-this.Y_LATITUDE)/this.wrap_coef[1];
    return pt;
  },
  //перевод из пикселей в географические координаты
  to_geo:function(p)
  {
    var pt = new P(0,0);
    pt.x=this.X_LONGITUDE+p.x*this.wrap_coef[0];
    pt.y=this.Y_LATITUDE+p.y*this.wrap_coef[1];
    return pt;
  },
  //вставляет в таблицу ящик
  ins_to_list : function(table_part, element, adr)
  {
    var tr=table_part.insertRow(0);
    var td1=tr.insertCell(0);
    var td2=tr.insertCell(1);
    element.setStyle("left:auto;top:auto;");
    td1.appendChild(element);
    td2.innerHTML=adr;
  },
  
  place_nodes : function(){ //размещает ящики  на карте
    var self=this;
    var base=this.anode_layer;
    self.nodes.each(function(node){
      var anDiv=createItem(node,'node size0');
      anDiv.observe('mouseover',function(){if(self.isEditMap)self.makeDraggable(this,node.x)});
      if ((node.x)&&(node.y)){
	var coor=/*self.to_pix*/(new P(node.x,node.y)); //координаты надо приводить к УК, затем к пикселям
	anDiv.observe('mouseover',function(){if(!self.isEditMap)self.showInfo(this)});
	anDiv.onmouseout=function(){$('popupinfo').hide()};
	anDiv.observe('click',function()
		      {
			this.onmouseout=null;
			var n=this
			if(!self.isEditMap)self.showInfo(this)
			$('popupinfo').onmouseout=function(){n.onmouseout=function(){$('popupinfo').hide()};}
		      });
	base.appendChild(anDiv); //
	anDiv.setPos(coor.sub(self.an_correction));
      }
      else
      {
	//отрисовать их в списке неразмещенных
	node.setCoords=function(p){self.set_coords(this, p);};
	self.ins_to_list(self.nbody,anDiv,node['adr']); 
      }
    });
  },
		    
  saveMap: function()
  {
    var changelist = nodes.select(function(el){return el.isMoved==true;});
    $('save_map').disabled=true;
    var changelst=changelist.map(function(el){ return {'node':el.name,'x':el.x,'y':el.y} })
    debug(changelist)
    if(changelist.length > 0){
      new Ajax.Request('/save_map', {
	parameters: { jsn: Object.toJSON(changelst) },
	onSuccess: function(req){
	  nodes.each(function(el){el.isMoved=false});
	  alert("saving done succesfully");
	},
	onFailure: function(req){alert("saving failed!");}
      })
      changelist.clear();
    }
    $('save_map').disabled=false;
  },
  saveSw: function()
  {
    var changelist = switches.select(function(el){return el.isMoved==true;})
    changelist=changelist.map(function(el){ return {'name':el.name,'node':el.node}});
    $('save_sw').disabled=true;
    debug(changelist)
    if(changelist.length > 0){
      new Ajax.Request('/save_dev', {
	parameters: { jsn: Object.toJSON(changelist) },
	onSuccess: function(req){
	  switches.each(function(el){el.isMoved=false});
	  alert("saving done succesfully");
	},
	onFailure: function(req){alert("saving failed!");}
      })
      changelist.clear
    }
    $('save_sw').disabled=false;
  },
  showInfo:function(n){
    var node=nodes.detect(function(nn){return nn.name==n.id;})
    var self=this;
    var p=$('popupinfo');
    p.setPos(P.make(Element.cumulativeOffset(n), "left", "top").add(new P(5,20)));
    while(p.hasChildNodes())
      p.removeChild(p.lastChild);
    var pp=document.createElement('p')
    pp.appendChild(document.createTextNode(node['adr']))
    pp.appendChild(document.createTextNode(' | '+node['key']))
    p.appendChild(pp) 
    p.appendChild(document.createElement('hr'))
    node.switches=switches.select(function(sw){return sw.node==node.name;});
    if (node.switches==null || node.switches.length==0)
      p.appendChild(document.createTextNode('no switches at this node'))
    else
    {
      node.switches.each(function(sw){
	var s=$(sw.name)
	if (!s){
	  s=createItem(sw,'switch')
	  s.onclick=function(){if(self.isEditMode)self.makeDraggable(this)};
	}
	s.className='switch'+' state'+sw.state+' ack'+sw.ack+' hard'+sw.hard;
	p.appendChild(s);
	s.setStyle("left:auto;top:auto;");
	p.appendChild(document.createElement('br'));
      });
    }
    var wid=((node['adr']&&node['adr'].length)||1)*10
    var em=parseInt(document.defaultView.getComputedStyle(p,null).getPropertyValue('font-size'))
    p.setStyle("height:"+((node.switches.length+1)*1.2*em+10)+"px;width:"+wid+"px")
    p.show()
  },
   
  create_filter : function(ev)
  {
    var self=this;
    var labels={'show all':[reset_filter],'no coordinates':[has_no_coords],'alerts':[in_alert]}
    for(var i=1;i<13;i++)
	labels['ar'+i]=[name_like,'^'+i+'\\.']
    var div=document.getElementById('filter') || document.createElement('div')
    div.id='filter'
    while(div.childNodes.length>0)div.removeChild(div.lastChild);
    $H(labels).each(function(item){
      var a=document.createElement('a')
      a.onclick=function(){$('filt').innerHTML=' filter: '+(self.filter=item.key);filter(nodes,item.value[0],item.value[1]);div.hide();return false};
      a.innerHTML=item.key
      a.href=''
      if (self.filter==item.key) a.setStyle('font-weight:bold');
      div.appendChild(a)
      div.appendChild(document.createElement('br'))
    });
    this.main.appendChild(div)
    div.setPos(new P(ev.clientX,ev.clientY))
    div.show()
  }
})

function createItem(obj,clas){
  var item=document.createElement('div');
  item.id=obj.name;
  item.innerHTML=obj.name;
  item.className=clas;
  return item
}

MapApp.loadSwitches = function() {
  var res=ajaxjson("/devices")
  nodes=new Array();
  res['nodes'].each(function(rec){
    nodes.push(rec);
  });
  
  switches=new Array();
  res['switches'].each(function(rec){
    switches.push(rec);
  });
}

document.observe('dom:loaded', function(){
  MapApp.loadSwitches()
})
document.observe('dom:loaded', function(){
  new MapApp()
})

//функции проверки условий для фильтров
function filter(objects,fltr,params) 
{
  objects.each(function(item){
    if( $(item.name))
    { 
      if(fltr(item,params))
	$(item.name).show()
      else
	$(item.name).hide()
    }
  });
}

function reset_filter(elem) {return true}
function has_coords(elem){  return (elem['node'] || elem['x'])!=null }
function has_no_coords(elem){  return !has_coords(elem);}
function name_like(elem,str){  return elem.name.match(new RegExp(str));}
function in_alert(elem){return elem.state!=1;}

function updateState(){
  /*	name
	state 0..3 //цвет + размер
	hard 0..1 //цвет
	ack 0..1 // границы
	duartion 0..2 //размер чем дольше лежит - тем крупнее?      */
  var nullswitch={'state':-1,'ack':-1,'hard':-1};
  var st=ajaxjson("/state");
  //timestamp=Math.round((new Date()).getTime() / 1000);
  switches.each(function(sw){
    var el=st.detect(function(s){return sw['name']==s['name'];})||nullswitch
    sw.state=el.state+1;
    sw.ack=el.ack+1;
    sw.hard=el.hard+1;
  });
  nodes.each(function(node){
    var content=switches.select(function(sw){return sw.node==node.name})
    var n_state=0;
    var n_ack=10; //почемутак? выяснить!
    var n_duration=0;
    var n_hard=0;
    content.each(function(s){
      if (s.ack==1){
	n_state=Math.max(s.state,n_state);
	n_hard=Math.max(s.hard,n_hard)
      }
    });
    node.state=n_state;
    var n=$(node.name)
    var pos=n.className.search(/size[0-9]/)
    var size=n.className.substring(pos,pos+5)
    n.className='node '+size+' state'+n_state+' hard'+n_hard;
  });
}

