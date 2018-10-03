Raphael.fn.svg = function() {
    var r = this,
    cfg = arguments;
    function Svg(cfg) {
	var inst,
	svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute('x',cfg[0])
	svg.setAttribute('y',cfg[1])
	svg.setAttribute('width',cfg[2])
	svg.setAttribute('height',cfg[3])
	r.canvas.appendChild(svg);
	inst={ 
	    type:'svg',
	    node:svg
	}
	inst.drag=Element
	return inst;
    }
    return Svg(cfg);
};